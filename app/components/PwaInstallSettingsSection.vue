<script setup lang="ts">
import { settingsSectionClass } from '../utils/settingsSectionLayout'

withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false
})

const {
  runningStandalone,
  installedOnDevice,
  isIosSafari,
  isIosOther,
  isAndroid,
  isDesktop,
  canPromptInstall,
  refreshInstallStatus,
  promptInstall
} = usePwaInstall()

const installing = ref(false)

onMounted(() => {
  void refreshInstallStatus()
})

async function installApp() {
  if (installing.value) return
  installing.value = true
  try {
    await promptInstall()
  } finally {
    installing.value = false
  }
}
</script>

<template>
  <section
    id="settings-install"
    :class="settingsSectionClass(compact)"
  >
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
      Install
    </p>
    <h2 class="mt-1 text-xl font-bold text-highlighted">
      Add to home screen or taskbar
    </h2>
    <p class="mt-2 text-sm leading-6 text-muted">
      Install VCH Symptom Tracker for faster access and background reminders — even if you removed the shortcut earlier.
    </p>

    <div
      v-if="runningStandalone"
      class="mt-4 flex items-start gap-3 rounded-3xl border border-teal-500/30 bg-teal-950/40 px-4 py-4"
    >
      <UIcon
        name="i-lucide-circle-check"
        class="mt-0.5 size-5 shrink-0 text-teal-300"
      />
      <div class="min-w-0">
        <p class="font-bold text-highlighted">
          Running as installed app
        </p>
        <p class="mt-1 text-sm leading-6 text-muted">
          You opened VCH Symptom Tracker from your home screen, taskbar, or app dock.
        </p>
      </div>
    </div>

    <div
      v-else-if="installedOnDevice"
      class="mt-4 flex items-start gap-3 rounded-3xl border border-teal-500/30 bg-teal-950/40 px-4 py-4"
    >
      <UIcon
        name="i-lucide-circle-check"
        class="mt-0.5 size-5 shrink-0 text-teal-300"
      />
      <div class="min-w-0">
        <p class="font-bold text-highlighted">
          Installed on this device
        </p>
        <p class="mt-1 text-sm leading-6 text-muted">
          Open VCH Symptom Tracker from your Start menu, taskbar, or home screen. If you removed the shortcut, reinstall below.
        </p>
      </div>
    </div>

    <template v-else>
      <button
        v-if="canPromptInstall"
        type="button"
        class="mt-4 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-inverted shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
        :disabled="installing"
        @click="installApp"
      >
        {{ installing ? 'Opening install…' : 'Install app' }}
      </button>

      <div class="mt-4 rounded-3xl border border-default bg-elevated/30 px-4 py-4 text-sm leading-6 text-muted">
        <p
          v-if="isDesktop"
          class="font-bold text-highlighted"
        >
          Desktop (Chrome or Edge)
        </p>
        <p
          v-else-if="isIosSafari"
          class="font-bold text-highlighted"
        >
          iPhone or iPad (Safari)
        </p>
        <p
          v-else-if="isIosOther"
          class="font-bold text-highlighted"
        >
          iPhone or iPad
        </p>
        <p
          v-else-if="isAndroid"
          class="font-bold text-highlighted"
        >
          Android (Chrome)
        </p>

        <p
          v-if="isDesktop"
          class="mt-2"
        >
          Use the install icon in the address bar, or open the browser menu and choose
          <strong class="text-highlighted">Install VCH Symptom Tracker</strong>.
          If you previously uninstalled or removed the taskbar icon, install again from here.
        </p>
        <ol
          v-else-if="isIosSafari"
          class="mt-2 list-decimal space-y-1.5 pl-4"
        >
          <li>Open this site in Safari.</li>
          <li>Tap <strong class="text-highlighted">Share</strong> at the bottom of Safari.</li>
          <li>Tap <strong class="text-highlighted">Add to Home Screen</strong>, then tap Add.</li>
        </ol>
        <p
          v-else-if="isIosOther"
          class="mt-2"
        >
          Open this site in Safari, then use Share →
          <strong class="text-highlighted">Add to Home Screen</strong>.
        </p>
        <ol
          v-else-if="isAndroid"
          class="mt-2 list-decimal space-y-1.5 pl-4"
        >
          <li>Open this site in Chrome.</li>
          <li>Tap <strong class="text-highlighted">Install app</strong> if Chrome shows it.</li>
          <li>Otherwise open the menu (⋮) and choose <strong class="text-highlighted">Install app</strong> or <strong class="text-highlighted">Add to Home screen</strong>.</li>
        </ol>
      </div>
    </template>

    <NuxtLink
      to="/install"
      class="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary/80"
    >
      Full install guide with videos
      <UIcon
        name="i-lucide-arrow-right"
        class="size-4"
      />
    </NuxtLink>
  </section>
</template>
