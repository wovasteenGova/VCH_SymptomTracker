<script setup lang="ts">
import { computed, inject } from 'vue'
import { TRACKER_EMBED_KEY } from '../composables/useTrackerLayout'

/**
 * Full-screen modal/prompt shell that clears the History bottom sheet.
 *
 * Pattern:
 *   <AppOverlayShell backdrop-class="bg-slate-950/70" @dismiss="close">
 *     <div class="app-overlay-panel ...">...</div>
 *   </AppOverlayShell>
 *
 * Stack layouts: add `app-overlay-panel--stack` on the panel for scrollable body + fixed footer.
 * History inset is synced on the app page via `useAppOverlayHistoryInset`.
 */
withDefaults(defineProps<{
  backdropClass?: string
  zIndex?: number
  dismissible?: boolean
  /** FAQ overlay opened from settings. Keep the settings panel open underneath. */
  settingsSupportOverlay?: boolean
}>(), {
  backdropClass: 'bg-slate-950/70',
  zIndex: 110,
  dismissible: true,
  settingsSupportOverlay: false
})

const emit = defineEmits<{
  dismiss: []
}>()

const isEmbeddedPreview = inject(TRACKER_EMBED_KEY, false)
const teleportTarget = computed(() => (isEmbeddedPreview ? '#tracker-app-shell' : 'body'))
const positionClass = computed(() => (isEmbeddedPreview ? 'absolute' : 'fixed'))
</script>

<template>
  <Teleport :to="teleportTarget">
    <div
      class="app-overlay-shell inset-0"
      :class="[positionClass, backdropClass]"
      :style="{ zIndex }"
      :data-settings-support-overlay="settingsSupportOverlay ? '' : undefined"
      @click.self="dismissible && emit('dismiss')"
    >
      <div class="app-overlay-inner">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
