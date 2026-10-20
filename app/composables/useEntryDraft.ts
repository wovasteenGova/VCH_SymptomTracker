export type EntryDraftCondition = {
  title: string
  category: string
  description: string
  image: string
}

export type EntryDraftSnapshot = {
  version: 1
  id: string
  savedAt: string
  entryStep: number
  severityValue: number
  entryForm: Record<string, string>
  selectedSearchCondition: EntryDraftCondition | null
  customConditionInput: string
  conditionTitle: string
}

const PENDING_ENTRY_SAVE_AFTER_SIGN_IN_KEY = 'symptom-tracker-pending-entry-save'

export function getEntryDraftStorageKey(userId: string | null | undefined) {
  return userId
    ? `symptom-tracker-entry-draft:${userId}`
    : 'symptom-tracker-entry-draft:guest'
}

export function markPendingEntrySaveAfterSignIn() {
  if (!import.meta.client) {
    return
  }

  window.sessionStorage.setItem(PENDING_ENTRY_SAVE_AFTER_SIGN_IN_KEY, '1')
}

export function consumePendingEntrySaveAfterSignIn() {
  if (!import.meta.client) {
    return false
  }

  const pending = window.sessionStorage.getItem(PENDING_ENTRY_SAVE_AFTER_SIGN_IN_KEY) === '1'

  if (pending) {
    window.sessionStorage.removeItem(PENDING_ENTRY_SAVE_AFTER_SIGN_IN_KEY)
  }

  return pending
}

export function clearPendingEntrySaveAfterSignIn() {
  if (!import.meta.client) {
    return
  }

  window.sessionStorage.removeItem(PENDING_ENTRY_SAVE_AFTER_SIGN_IN_KEY)
}

export function createEntryDraftId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeEntryDraft(raw: unknown): EntryDraftSnapshot | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const parsed = raw as Partial<EntryDraftSnapshot>

  if (parsed.version !== 1) {
    return null
  }

  return {
    version: 1,
    id: parsed.id || createEntryDraftId(),
    savedAt: parsed.savedAt || new Date().toISOString(),
    entryStep: parsed.entryStep || 0,
    severityValue: parsed.severityValue ?? 5,
    entryForm: { ...(parsed.entryForm || {}) },
    selectedSearchCondition: parsed.selectedSearchCondition
      ? { ...parsed.selectedSearchCondition }
      : null,
    customConditionInput: parsed.customConditionInput || '',
    conditionTitle: parsed.conditionTitle || 'Symptom log'
  }
}

export function parseEntryDraftStore(raw: unknown): EntryDraftSnapshot[] {
  if (!raw || typeof raw !== 'object') {
    return []
  }

  const record = raw as { version?: number, drafts?: unknown[] }

  if (record.version === 2 && Array.isArray(record.drafts)) {
    return record.drafts
      .map(normalizeEntryDraft)
      .filter((draft): draft is EntryDraftSnapshot => Boolean(draft && isMeaningfulEntryDraft(draft)))
  }

  const single = normalizeEntryDraft(record)

  if (!single || !isMeaningfulEntryDraft(single)) {
    return []
  }

  return [single]
}

export const MAX_ENTRY_DRAFTS = 3

export function isEntryDraftLimitReached(
  drafts: Array<{ id: string }>,
  activeDraftId: string | null | undefined
) {
  if (activeDraftId && drafts.some(draft => draft.id === activeDraftId)) {
    return false
  }

  return drafts.length >= MAX_ENTRY_DRAFTS
}

export function upsertEntryDraftList(drafts: EntryDraftSnapshot[], snapshot: EntryDraftSnapshot) {
  const index = drafts.findIndex(draft => draft.id === snapshot.id)

  if (index === -1) {
    return [snapshot, ...drafts].slice(0, MAX_ENTRY_DRAFTS)
  }

  const next = drafts.slice()
  next[index] = snapshot
  return next
}

function writeEntryDraftList(userId: string | null | undefined, drafts: EntryDraftSnapshot[]) {
  if (!import.meta.client) {
    return
  }

  const key = getEntryDraftStorageKey(userId)

  if (!drafts.length) {
    window.localStorage.removeItem(key)
    return
  }

  window.localStorage.setItem(key, JSON.stringify({
    version: 2,
    drafts
  }))
}

export function readEntryDrafts(userId: string | null | undefined): EntryDraftSnapshot[] {
  if (!import.meta.client) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(getEntryDraftStorageKey(userId))

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as { version?: number }
    const drafts = parseEntryDraftStore(parsed)

    if (parsed?.version !== 2) {
      writeEntryDraftList(userId, drafts)
    }

    return drafts
  } catch {
    return []
  }
}

export function upsertEntryDraft(userId: string | null | undefined, snapshot: EntryDraftSnapshot) {
  writeEntryDraftList(userId, upsertEntryDraftList(readEntryDrafts(userId), snapshot))
}

export function removeEntryDraft(userId: string | null | undefined, draftId: string) {
  writeEntryDraftList(
    userId,
    readEntryDrafts(userId).filter(draft => draft.id !== draftId)
  )
}

export function migrateGuestEntryDraftToUser(userId: string) {
  const guestDrafts = readEntryDrafts(null)

  if (!guestDrafts.length) {
    return false
  }

  let userDrafts = readEntryDrafts(userId)

  for (const draft of guestDrafts) {
    userDrafts = upsertEntryDraftList(userDrafts, draft)
  }

  writeEntryDraftList(userId, userDrafts)
  clearEntryDraft(null)
  return true
}

export function clearEntryDraft(userId: string | null | undefined) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.removeItem(getEntryDraftStorageKey(userId))
}

export function isMeaningfulEntryDraft(snapshot: {
  entryStep?: number
  severityValue?: number
  entryForm?: Record<string, string>
  selectedSearchCondition?: EntryDraftCondition | null
  customConditionInput?: string
}) {
  // Opening a condition, advancing through steps, and the default severity do
  // not constitute a log. The condition's PDF statement may be prefilled too.
  if (snapshot.severityValue != null && snapshot.severityValue !== 5) {
    return true
  }

  const form = snapshot.entryForm || {}

  for (const [key, value] of Object.entries(form)) {
    if (key === 'date_and_time' || key === 'condition_name' || key === 'pdf_condition_statement') {
      continue
    }

    if (value?.trim()) {
      return true
    }
  }

  return false
}

export function buildEntryDraftSnapshot(input: {
  id?: string | null
  entryStep: number
  severityValue: number
  entryForm: Record<string, string>
  selectedSearchCondition: EntryDraftCondition | null
  customConditionInput: string
  conditionTitle: string
}): EntryDraftSnapshot | null {
  const snapshot: EntryDraftSnapshot = {
    version: 1,
    id: input.id || createEntryDraftId(),
    savedAt: new Date().toISOString(),
    entryStep: input.entryStep,
    severityValue: input.severityValue,
    entryForm: { ...input.entryForm },
    selectedSearchCondition: input.selectedSearchCondition
      ? { ...input.selectedSearchCondition }
      : null,
    customConditionInput: input.customConditionInput,
    conditionTitle: input.conditionTitle
  }

  return isMeaningfulEntryDraft(snapshot) ? snapshot : null
}

export function entryDraftSnapshotsEqual(a: EntryDraftSnapshot, b: EntryDraftSnapshot) {
  if (a.conditionTitle !== b.conditionTitle) {
    return false
  }

  if (a.entryStep !== b.entryStep) {
    return false
  }

  if (a.severityValue !== b.severityValue) {
    return false
  }

  if (a.customConditionInput !== b.customConditionInput) {
    return false
  }

  if (JSON.stringify(a.selectedSearchCondition) !== JSON.stringify(b.selectedSearchCondition)) {
    return false
  }

  const formA = a.entryForm || {}
  const formB = b.entryForm || {}
  const keys = new Set([...Object.keys(formA), ...Object.keys(formB)])

  for (const key of keys) {
    if ((formA[key] || '').trim() !== (formB[key] || '').trim()) {
      return false
    }
  }

  return true
}

export function shouldPromptBeforeResumeEntryDraft(options: {
  editingSavedEntry?: boolean
  visitedStepTwo?: boolean
  alreadyEditingStoredDraft: boolean
  hasMeaningfulCurrentEntry?: boolean
  draftLimitReached?: boolean
}) {
  if (options.alreadyEditingStoredDraft) {
    return false
  }

  if (typeof options.draftLimitReached === 'boolean') {
    return Boolean(options.hasMeaningfulCurrentEntry && options.draftLimitReached)
  }

  return false
}

export function formatEntryDraftTimeLabel(savedAt: string) {
  const savedDate = new Date(savedAt)

  if (Number.isNaN(savedDate.getTime())) {
    return 'Saved recently'
  }

  return savedDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
