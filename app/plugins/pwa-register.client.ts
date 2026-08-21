/**
 * Register the reminder SW without reloading the tab.
 * Old vite-pwa autoUpdate helpers called location.reload() on controllerchange.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client || !import.meta.env.PROD) {
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Intentionally empty — never reload for a new worker.
  })

  void navigator.serviceWorker.register('/sw.js').catch(() => {
    // Push reminders still work after a later visit if registration fails here.
  })
})
