import { bindAutoHideScrollbars } from '../utils/autoHideScrollbar'

/** Native scrollbars that reveal while scrolling and fade after idle. */
export default defineNuxtPlugin((nuxtApp) => {
  let unbind: (() => void) | null = null

  nuxtApp.hook('app:mounted', () => {
    unbind = bindAutoHideScrollbars(document)
  })

  nuxtApp.hook('app:beforeUnmount', () => {
    unbind?.()
    unbind = null
  })
})
