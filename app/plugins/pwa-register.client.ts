/**
 * Register the reminder service worker without the vite-pwa autoUpdate reload.
 * `controllerchange` + location.reload() was replaying the tank splash.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client || !import.meta.env.PROD) {
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  void navigator.serviceWorker.register('/sw.js').catch(() => {
    // Ignore — push reminders still work after a later visit if registration fails here.
  })
})
