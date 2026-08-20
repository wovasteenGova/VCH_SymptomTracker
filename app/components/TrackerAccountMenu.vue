<script setup lang="ts">
import {
  desktopOverlayShellClass,
  mobileOverlayPanelClass,
  mobileOverlayShellClass
} from '../utils/mobileOverlayShell'
import { useTrackerAuthPrompt } from '../composables/useTrackerAuthPrompt'
import { useTrackerSettingsPanelOpen } from '../composables/useTrackerSettingsPanelOpen'
import { useTrackerSettingsSectionMenuOpen } from '../composables/useTrackerSettingsSectionMenuOpen'
import { TRACKER_CLOSE_SETTINGS_KEY } from '../composables/useTrackerLayout'
import ProfilePage from '../pages/profile.vue'
import {
  SETTINGS_EXPANDED_DESKTOP_HEIGHT_CLASS,
  SETTINGS_EXPANDED_DESKTOP_MAX_HEIGHT_CLASS,
  SETTINGS_EXPANDED_DESKTOP_WIDTH_CLASS,
  SETTINGS_POPOVER_MAX_HEIGHT_CLASS,
  SETTINGS_POPOVER_WIDTH_CLASS
} from '../utils/settingsPanelLayout'
import {
  ACCOUNT_SETTINGS_ACTION,
  TRACKER_TOOLTIP
} from '../utils/trackerToolbarUi'

const props = withDefaults(defineProps<{
  embedded?: boolean
  showName?: boolean
}>(), {
  embedded: false,
  showName: true
})

const emit = defineEmits<{
  openEmbedProfile: []
  signedIn: []
}>()

const { user, isAuthLoading } = useSupabaseAuth()
const { getProfile } = useUserProfiles()
const { signInRequested, clearSignInRequest, setAuthPanelOpen } = useTrackerAuthPrompt()
const { settingsSectionMenuOpen } = useTrackerSettingsSectionMenuOpen()
const {
  settingsPopoverOpen: settingsOpen,
  settingsExpandedOpen: settingsExpanded,
  settingsPanelOpen,
  closeSettingsPanel,
  consumePendingSettingsSection
} = useTrackerSettingsPanelOpen()
const supportOverlays = useSettingsSupportOverlays()
const {
  contactOpen: settingsContactOpen,
  faqOpen: settingsFaqOpen,
  isOpen: settingsSupportOverlayOpen,
  openContactFromFaq: openSettingsContactFromFaq,
  closeContact: closeSettingsContact,
  closeFaq: closeSettingsFaq,
  closeAll: closeSettingsSupportOverlays
} = supportOverlays

const initialSettingsSection = ref<string | null>(null)

watch(settingsPanelOpen, (open) => {
  if (!open) {
    initialSettingsSection.value = null
    return
  }

  const pending = consumePendingSettingsSection()
  if (pending) {
    initialSettingsSection.value = pending
  }
})

const authOpen = ref(false)
const menuRootRef = ref<HTMLElement | null>(null)
const authDialogRef = ref<HTMLElement | null>(null)
const mobileViewport = ref(false)
const narrowAuthViewport = ref(false)
const accountName = ref('')

let mobileViewportMedia: MediaQueryList | null = null
let narrowAuthViewportMedia: MediaQueryList | null = null
let syncMobileViewport: (() => void) | null = null
let syncNarrowAuthViewport: (() => void) | null = null

const accountFirstName = computed(() => {
  const full = accountName.value.trim()
  if (full) return full.split(/\s+/)[0]!
  return user.value?.email?.split('@')[0] || 'Account'
})

const accountLabel = computed(() => {
  return accountName.value.trim() || user.value?.email?.split('@')[0] || 'Account'
})

const accountDisplayName = computed(() => {
  return accountName.value.trim() || accountLabel.value
})

function closeSettings() {
  closeSettingsSupportOverlays()
  closeSettingsPanel()
}

provide(TRACKER_CLOSE_SETTINGS_KEY, closeSettings)

onMounted(async () => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('pointerdown', onSettingsPanelOutsidePointerDown, true)

  if (!import.meta.client) return

  mobileViewportMedia = window.matchMedia('(max-width: 1023px)')
  syncMobileViewport = () => {
    mobileViewport.value = mobileViewportMedia?.matches ?? false
  }
  syncMobileViewport()
  mobileViewportMedia.addEventListener('change', syncMobileViewport)

  narrowAuthViewportMedia = window.matchMedia('(max-width: 560px)')
  syncNarrowAuthViewport = () => {
    narrowAuthViewport.value = narrowAuthViewportMedia?.matches ?? false
  }
  syncNarrowAuthViewport()
  narrowAuthViewportMedia.addEventListener('change', syncNarrowAuthViewport)

  if (user.value) {
    await loadAccountName()
  }
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('pointerdown', onSettingsPanelOutsidePointerDown, true)
  if (!import.meta.client) return
  if (mobileViewportMedia && syncMobileViewport) {
    mobileViewportMedia.removeEventListener('change', syncMobileViewport)
  }
  if (narrowAuthViewportMedia && syncNarrowAuthViewport) {
    narrowAuthViewportMedia.removeEventListener('change', syncNarrowAuthViewport)
  }
})

watch(user, async (nextUser) => {
  if (nextUser) {
    await loadAccountName()
    closeAuth()
    return
  }

  accountName.value = ''
  closeSettingsPanel()
})

watch(signInRequested, (requested) => {
  if (!requested || user.value) {
    if (requested) clearSignInRequest()
    return
  }

  authOpen.value = true
  setAuthPanelOpen(true)
  clearSignInRequest()
})

watch(authOpen, (open) => {
  setAuthPanelOpen(open)
})

watch(settingsExpanded, (expanded) => {
  if (expanded) settingsOpen.value = false
})

async function loadAccountName() {
  if (!user.value) {
    accountName.value = ''
    return
  }

  try {
    const profile = await getProfile(user.value.id)
    accountName.value = profile?.full_name?.trim() || ''
  } catch {
    accountName.value = ''
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!authOpen.value) return
  const root = menuRootRef.value
  const dialog = authDialogRef.value
  const target = event.target as Node
  if (root && !root.contains(target) && !dialog?.contains(target)) {
    closeAuth()
  }
}

function isSettingsPanelInteractionTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  // USelectMenu / Reka popovers portal under <body>; treat those as inside the panel
  // so choosing an option does not tear down settings before the value commits.
  return !!target.closest(
    '[data-settings-panel-root], [data-settings-section-menu], [data-settings-panel-trigger], [data-reka-popper-content-wrapper], [data-dismissable-layer], [role="listbox"], [data-settings-support-overlay]'
  )
}

function onSettingsPanelOutsidePointerDown(event: PointerEvent) {
  if (!settingsPanelOpen.value) return
  if (settingsSupportOverlayOpen.value) return
  const target = event.target
  if (!(target instanceof Element)) return
  if (isSettingsPanelInteractionTarget(target)) return
  closeSettingsPanel()
}

function expandSettings() {
  settingsOpen.value = false
  settingsExpanded.value = true
}

function collapseSettings() {
  settingsExpanded.value = false
  settingsOpen.value = true
}

function onSettingsKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (settingsSupportOverlayOpen.value) {
    closeSettingsSupportOverlays()
    return
  }
  if (settingsExpanded.value) {
    if (mobileViewport.value) closeSettings()
    else collapseSettings()
    return
  }
  closeSettings()
}

function openProfileSettings() {
  if (props.embedded) {
    emit('openEmbedProfile')
    return
  }

  if (mobileViewport.value) {
    expandSettings()
    return
  }

  settingsOpen.value = !settingsOpen.value
}

function openAuth() {
  authOpen.value = !authOpen.value
}

function closeAuth() {
  authOpen.value = false
}

async function onSignedIn() {
  closeAuth()
  emit('signedIn')
  await loadAccountName()
}
</script>

<template>
  <template v-if="user">
    <UTooltip
      v-if="mobileViewport"
      :text="ACCOUNT_SETTINGS_ACTION.tooltip"
      :delay-duration="TRACKER_TOOLTIP.delayDuration"
      :content="TRACKER_TOOLTIP.content"
    >
      <UButton
        type="button"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-user-round"
        trailing-icon="i-lucide-chevron-down"
        :label="showName ? accountFirstName : undefined"
        :aria-label="`Open account for ${accountLabel}`"
        :aria-expanded="settingsExpanded"
        class="max-w-[9rem] shrink-0 truncate"
        data-settings-panel-trigger
        @click="openProfileSettings"
      />
    </UTooltip>

    <UPopover
      v-else
      v-model:open="settingsOpen"
      :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
      :modal="false"
      :dismissible="!settingsSectionMenuOpen && !settingsSupportOverlayOpen"
    >
      <UTooltip
        :text="ACCOUNT_SETTINGS_ACTION.tooltip"
        :delay-duration="TRACKER_TOOLTIP.delayDuration"
        :content="TRACKER_TOOLTIP.content"
      >
        <UButton
          type="button"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-user-round"
          trailing-icon="i-lucide-chevron-down"
          :label="showName ? accountFirstName : undefined"
          :aria-label="`Open account for ${accountLabel}`"
          :aria-expanded="settingsOpen || settingsExpanded"
          class="max-w-[9rem] shrink-0 truncate"
          data-settings-panel-trigger
        />
      </UTooltip>

      <template #content>
        <div
          data-settings-panel-root
          class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-default/80 bg-default shadow-xl"
          :class="[SETTINGS_POPOVER_WIDTH_CLASS, SETTINGS_POPOVER_MAX_HEIGHT_CLASS]"
        >
          <header class="flex shrink-0 items-start justify-between gap-1 border-b border-default/60 px-2 pt-2">
            <div class="min-w-0 px-1 pb-2">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <p class="truncate text-sm font-semibold text-highlighted">
                  {{ accountDisplayName }}
                </p>
                <TrackerPlanBadge />
              </div>
              <p
                v-if="user.email"
                class="truncate text-xs text-muted"
              >
                {{ user.email }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-0.5">
              <UButton
                type="button"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-maximize-2"
                aria-label="Expand settings"
                title="Expand settings"
                @click="expandSettings"
              />
              <UButton
                type="button"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                aria-label="Close settings"
                @click="closeSettings"
              />
            </div>
          </header>

          <ProfilePage
            overlay
            compact
            readable
            class="flex min-h-0 flex-1 flex-col overflow-hidden"
            :initial-section="initialSettingsSection"
            @close="closeSettings"
          />
        </div>
      </template>
    </UPopover>

    <Teleport to="body">
      <div
        v-if="settingsExpanded"
        class="fixed inset-0 z-[90]"
        @keydown="onSettingsKeydown"
      >
        <div
          :class="mobileViewport ? mobileOverlayShellClass(90) : desktopOverlayShellClass(90)"
          @click.self="!mobileViewport && !settingsSupportOverlayOpen && closeSettings()"
        >
          <section
            data-settings-panel-root
            :class="mobileOverlayPanelClass({
              desktopMaxWidth: SETTINGS_EXPANDED_DESKTOP_WIDTH_CLASS,
              desktopMaxHeight: SETTINGS_EXPANDED_DESKTOP_MAX_HEIGHT_CLASS,
              desktopHeight: SETTINGS_EXPANDED_DESKTOP_HEIGHT_CLASS,
              desktopRounded: 'lg:rounded-2xl',
              border: 'lg:border lg:border-default/80'
            })"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracker-settings-expanded-title"
            @click.stop
          >
            <header class="flex shrink-0 items-start justify-between gap-3 border-b border-default/60 px-5 py-4">
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Symptom Tracker
                </p>
                <div class="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                  <h2
                    id="tracker-settings-expanded-title"
                    class="truncate text-2xl font-semibold text-highlighted"
                  >
                    Account Settings
                  </h2>
                  <TrackerPlanBadge />
                </div>
                <p
                  v-if="user.email"
                  class="mt-1 truncate text-base text-muted"
                >
                  {{ user.email }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <UButton
                  v-if="!mobileViewport"
                  type="button"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-minimize-2"
                  aria-label="Collapse to compact panel"
                  title="Collapse"
                  @click="collapseSettings"
                />
                <UButton
                  type="button"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  aria-label="Close settings"
                  @click="closeSettings"
                />
              </div>
            </header>

            <ProfilePage
              overlay
              readable
              class="flex min-h-0 flex-1 flex-col overflow-hidden"
              :initial-section="initialSettingsSection"
              @close="closeSettings"
            />
          </section>
        </div>
      </div>
    </Teleport>
  </template>

  <div
    v-else-if="!isAuthLoading"
    ref="menuRootRef"
    class="relative"
  >
    <UButton
      type="button"
      size="xs"
      color="primary"
      variant="soft"
      icon="i-lucide-log-in"
      :label="narrowAuthViewport ? undefined : 'Sign in'"
      :class="authOpen ? 'ring-2 ring-primary/25' : ''"
      @click="openAuth"
    />

    <Teleport
      to="body"
      :disabled="!narrowAuthViewport"
    >
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="authOpen"
          ref="authDialogRef"
          :class="narrowAuthViewport
            ? mobileOverlayShellClass(90)
            : 'absolute right-0 top-[calc(100%+0.5rem)] z-[90] max-h-[min(80dvh,36rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-default/80 bg-default shadow-xl ring-1 ring-black/5'"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in"
          @click.stop
        >
          <div
            v-if="narrowAuthViewport"
            class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
            :class="mobileOverlayPanelClass()"
          >
            <TrackerAuthPanel
              compact
              class="min-h-0 flex-1"
              @close="closeAuth"
              @signed-in="onSignedIn"
            />
          </div>
          <TrackerAuthPanel
            v-else
            compact
            @close="closeAuth"
            @signed-in="onSignedIn"
          />
        </div>
      </Transition>
    </Teleport>
  </div>

  <div
    v-else
    class="flex size-8 shrink-0 items-center justify-center text-muted"
    role="status"
    aria-label="Checking account"
  >
    <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
  </div>

  <ContactSupportOverlay
    :open="settingsContactOpen"
    :default-name="accountDisplayName"
    :default-email="user?.email || ''"
    @close="closeSettingsContact()"
  />

  <FaqOverlay
    :open="settingsFaqOpen"
    @close="closeSettingsFaq()"
    @open-contact="openSettingsContactFromFaq()"
  />
</template>
