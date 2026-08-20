export function dismissTrackerStaticSplash() {
  if (!import.meta.client) {
    return
  }

  document.documentElement.classList.remove('tracker-booting')

  const splash = document.getElementById('tracker-static-splash')

  if (!splash) {
    return
  }

  splash.classList.add('tracker-static-splash--leaving')
  window.setTimeout(() => {
    splash.remove()
  }, 500)
}
