import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export const AUTH_PANEL_ROOT_CLASS = 'auth-panel-root'
export const AUTH_PANEL_FOOTER_CLASS = 'auth-panel-footer'
export const AUTH_PANEL_KEYBOARD_DATASET = 'authKeyboard'

const NARROW_AUTH_MAX_WIDTH_PX = 560
const KEYBOARD_INSET_THRESHOLD_PX = 80

function isAuthEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true
  }
  return target.isContentEditable
}

export function detectAuthPanelKeyboardOpen(input: {
  narrowViewport: boolean
  editableFocused: boolean
  layoutHeight: number
  visualHeight: number
  visualOffsetTop: number
}) {
  if (!input.narrowViewport || !input.editableFocused) return false

  const visualInset = Math.max(
    0,
    input.layoutHeight - input.visualHeight - input.visualOffsetTop
  )
  const layoutShrink = Math.max(0, input.layoutHeight - input.visualHeight)

  return visualInset > KEYBOARD_INSET_THRESHOLD_PX || layoutShrink > KEYBOARD_INSET_THRESHOLD_PX
}

function syncAuthKeyboardDataset(open: boolean) {
  if (!import.meta.client) return

  if (open) {
    document.documentElement.dataset[AUTH_PANEL_KEYBOARD_DATASET] = 'open'
    return
  }

  delete document.documentElement.dataset[AUTH_PANEL_KEYBOARD_DATASET]
}

export function useAuthPanelKeyboard(rootRef?: Ref<HTMLElement | null>) {
  const keyboardOpen = ref(false)
  const narrowViewport = ref(false)

  let narrowMedia: MediaQueryList | null = null
  let syncNarrowViewport: (() => void) | null = null
  let editableFocused = false

  function measureKeyboard() {
    if (!import.meta.client || !narrowViewport.value) {
      keyboardOpen.value = false
      syncAuthKeyboardDataset(false)
      return
    }

    const vv = window.visualViewport
    const open = detectAuthPanelKeyboardOpen({
      narrowViewport: narrowViewport.value,
      editableFocused,
      layoutHeight: window.innerHeight,
      visualHeight: vv?.height ?? window.innerHeight,
      visualOffsetTop: vv?.offsetTop ?? 0
    })

    keyboardOpen.value = open
    syncAuthKeyboardDataset(open)
  }

  function focusIsInsidePanel(target: EventTarget | null) {
    const root = rootRef?.value
    if (!root || !(target instanceof Node)) return false
    return root.contains(target)
  }

  function onFocusIn(event: FocusEvent) {
    if (!narrowViewport.value || !isAuthEditable(event.target)) return
    if (!focusIsInsidePanel(event.target)) return

    editableFocused = true
    measureKeyboard()
  }

  function onFocusOut() {
    if (!editableFocused) return

    window.requestAnimationFrame(() => {
      const active = document.activeElement
      if (focusIsInsidePanel(active) && isAuthEditable(active)) {
        measureKeyboard()
        return
      }

      editableFocused = false
      measureKeyboard()
    })
  }

  onMounted(() => {
    if (!import.meta.client) return

    narrowMedia = window.matchMedia(`(max-width: ${NARROW_AUTH_MAX_WIDTH_PX}px)`)
    syncNarrowViewport = () => {
      narrowViewport.value = narrowMedia?.matches ?? false
      if (!narrowViewport.value) {
        editableFocused = false
      }
      measureKeyboard()
    }
    syncNarrowViewport()
    narrowMedia.addEventListener('change', syncNarrowViewport)

    document.addEventListener('focusin', onFocusIn, true)
    document.addEventListener('focusout', onFocusOut, true)
    window.visualViewport?.addEventListener('resize', measureKeyboard)
    window.visualViewport?.addEventListener('scroll', measureKeyboard)
  })

  onUnmounted(() => {
    if (!import.meta.client) return

    document.removeEventListener('focusin', onFocusIn, true)
    document.removeEventListener('focusout', onFocusOut, true)
    window.visualViewport?.removeEventListener('resize', measureKeyboard)
    window.visualViewport?.removeEventListener('scroll', measureKeyboard)

    if (narrowMedia && syncNarrowViewport) {
      narrowMedia.removeEventListener('change', syncNarrowViewport)
    }

    if (editableFocused || keyboardOpen.value) {
      editableFocused = false
      keyboardOpen.value = false
      syncAuthKeyboardDataset(false)
    }
  })

  return {
    keyboardOpen,
    narrowViewport
  }
}
