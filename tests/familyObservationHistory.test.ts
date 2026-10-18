import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import * as Vue from 'vue'
import { renderToString } from '@vue/server-renderer'
import { parse } from '@vue/compiler-sfc'
import { baseParse, compile, parserOptions, type ElementNode, type RootNode, type TemplateChildNode } from '@vue/compiler-dom'
import ts from 'typescript'
import { td } from '../app/utils/trackerDesktopTheme'

const index = parse(readFileSync('app/pages/index.vue', 'utf8')).descriptor
const desktop = parse(readFileSync('app/components/tracker/TrackerDesktopHistory.vue', 'utf8')).descriptor
const script = ts.createSourceFile('index.ts', index.scriptSetup!.content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

// Execute the actual page handlers with isolated state; no account or database writes are needed.
function pageHandler(name: string, bindings: Record<string, unknown>) {
  const declaration = script.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name)!
  const code = ts.transpileModule(declaration.getText(script), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 }
  }).outputText
  return new Function(...Object.keys(bindings), `${code}; return ${name};`)(...Object.values(bindings))
}

function findElement(node: RootNode | TemplateChildNode, predicate: (element: ElementNode) => boolean): ElementNode | undefined {
  if (node.type === 1 && predicate(node)) return node
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findElement(child, predicate)
      if (found) return found
    }
  }
}

const template = baseParse(index.template!.content, parserOptions)
const details = findElement(template, node => node.props.some(prop => (
  prop.type === 6 && prop.name === 'aria-labelledby' && prop.value?.content === 'log-details-title'
)))!.loc.source
const mobileRow = findElement(template, node => node.tag === 'article')!.loc.source

async function renderTemplate(source: string, bindings: Record<string, unknown>) {
  const render = new Function('Vue', compile(source, { mode: 'function' }).code)(Vue)
  const app = Vue.createSSRApp({ setup: () => bindings, render })
  app.component('UBadge', Vue.defineComponent({ setup: (_, { slots }) => () => Vue.h('span', slots.default?.()) }))
  app.component('UIcon', Vue.defineComponent({ setup: () => () => Vue.h('i') }))
  return renderToString(app)
}

const familyEntry = {
  id: 'family-1', title: 'Supporter observation', condition: 'Back pain', conditionKey: 'back_pain',
  source: 'Family', month: 'Oct', day: '18', time: '10:00 AM', severity: 5, summary: 'Needed help'
}

function detailsBindings(readOnly: boolean) {
  return {
    viewedHistoryEntry: { ...familyEntry, source: readOnly ? 'Family' : 'Veteran' },
    viewedHistoryRawEntry: { summary: 'Observed difficulty sitting', impact: 'Needed help' },
    viewedHistoryEntryIsReadOnly: readOnly, viewedHistoryEntryTimestamp: 'Oct 18, 2026',
    viewedHistoryEntryDetails: [], editViewedHistoryEntry: vi.fn(), deleteViewedHistoryEntry: vi.fn(),
    closeEntryDetailsOverlay: vi.fn()
  }
}

function desktopBindings(entries = [familyEntry], error = '') {
  return {
    td, entries, error, signedIn: true, authLoading: false, isDemoMode: false, isLoading: false,
    activeTab: 'Entries', panelTitle: 'Entries', historyTabs: ['Entries', 'Calendar', 'Export'],
    showAllEntries: true, entriesFiltered: false, conditionFilterLabel: 'Back pain',
    highlightedEntryId: null, loadingMessage: 'Loading entries...', scrollEl: Vue.ref(null), selectTab: vi.fn()
  }
}

describe('family observation history', () => {
  it('shows supporter details with a noninteractive View only footer instead of edit buttons', async () => {
    const html = await renderTemplate(details, detailsBindings(true))
    expect(html).toContain('Supporter observation')
    expect(html).toContain('Read-only')
    expect(html).toContain('View only')
    expect(html).toMatch(/<span[^>]*>[\s\S]*View only\s*<\/span>/)
    expect(html).not.toContain('Edit log')
    expect(html).not.toContain('aria-label="Edit ')
  })

  it('keeps edit actions available on veteran details', async () => {
    const html = await renderTemplate(details, detailsBindings(false))
    expect(html).toContain('Edit log')
    expect(html).toContain('aria-label="Edit Supporter observation"')
    expect(html).not.toContain('View only')
    expect(html).not.toContain('Read-only')
  })

  it('hides edit buttons on both desktop and mobile family history rows', async () => {
    const desktopHtml = await renderTemplate(desktop.template!.content, desktopBindings())
    const mobileHtml = await renderTemplate(mobileRow, {
      historyEntries: [familyEntry], highlightedSubmissionId: null,
      openEntryDetailsOverlay: vi.fn(), requestEntryEdit: vi.fn(), requestDeleteEntry: vi.fn()
    })
    expect(desktopHtml).toContain('Read-only')
    for (const html of [desktopHtml, mobileHtml]) {
      expect(html).toContain('Supporter observation')
      expect(html).not.toContain('aria-label="Edit ')
    }
    const veteranHtml = await renderTemplate(desktop.template!.content, desktopBindings([{ ...familyEntry, source: 'Veteran' }]))
    expect(veteranHtml).toContain('aria-label="Edit Supporter observation"')
  })

  it.each(['Spouse', 'Friend'].flatMap(relationship => (
    ['requestEntryEdit', 'openEntryForEdit'].map(handler => [handler, relationship])
  )))('%s routes stale %s edit requests to details without poisoning History', (name, relationship) => {
    const entriesError = Vue.ref('')
    const openEntryDetailsOverlay = vi.fn()
    const state = {
      isHistoryEntryActivationLocked: () => false, needsAppWelcome: Vue.ref(false),
      user: Vue.ref({ id: 'veteran-1' }),
      savedEntries: Vue.ref([{ id: 'family-1', source: 'family', details: { reporter_relationship: relationship } }]),
      entriesError, openEntryDetailsOverlay, openAuthPanel: vi.fn(),
      editingEntryId: Vue.ref(null), isEntryOpen: Vue.ref(false)
    }
    pageHandler(name, state)('family-1')
    expect(openEntryDetailsOverlay).toHaveBeenCalledWith('family-1')
    expect(entriesError.value).toBe('')
    expect(state.editingEntryId.value).toBeNull()
    expect(state.isEntryOpen.value).toBe(false)
  })

  it('still opens the normal veteran editor', () => {
    const openEntryForEdit = vi.fn()
    pageHandler('requestEntryEdit', {
      isHistoryEntryActivationLocked: () => false, needsAppWelcome: Vue.ref(false),
      user: Vue.ref({ id: 'veteran-1' }), savedEntries: Vue.ref([{ id: 'entry-1', source: 'veteran' }]),
      isEntryEditLocked: () => false, hasAcknowledgedEditHistoryNotice: () => true, openEntryForEdit
    })('entry-1')
    expect(openEntryForEdit).toHaveBeenCalledWith('entry-1')
  })

  it('keeps loaded desktop rows visible on error and provides a retry action', async () => {
    const html = await renderTemplate(desktop.template!.content, desktopBindings([familyEntry], 'Could not refresh entries.'))
    expect(html).toContain('Could not refresh entries.')
    expect(html).toContain('Try again')
    expect(html).toContain('Supporter observation')
    const emptyHtml = await renderTemplate(desktop.template!.content, desktopBindings([], 'Could not load entries.'))
    expect(emptyHtml).toContain('Try again')
    expect(emptyHtml).not.toContain('No entries yet')
  })

  it('lets All recover a previous error without reloading the page', async () => {
    const desktopHistoryShowAll = Vue.ref(false)
    const entriesError = Vue.ref('Old action error')
    const loadEntries = vi.fn(async () => { entriesError.value = '' })
    const showAll = pageHandler('showAllDesktopHistoryEntries', { desktopHistoryShowAll, entriesError, loadEntries })
    await showAll()
    expect(desktopHistoryShowAll.value).toBe(true)
    expect(entriesError.value).toBe('')
    expect(loadEntries).toHaveBeenCalledOnce()
    await showAll()
    expect(loadEntries).toHaveBeenCalledOnce()
  })
})
