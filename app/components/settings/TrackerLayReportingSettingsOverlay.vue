<script setup lang="ts">
import TrackerWorkspaceSettingsShell from './TrackerWorkspaceSettingsShell.vue'
import { useTrackerLayReportingSettings } from '../../composables/useTrackerLayReportingSettings'
import {
  TRACKER_SETTINGS_SELECT_MENU_CONTENT,
  TRACKER_SETTINGS_SELECT_MENU_UI
} from '../../utils/trackerSettingsSelectMenu'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const {
  supporterForm,
  supporterProfiles,
  createdLink,
  createdLinkCopied,
  createdLinkPanelEl,
  supporterError,
  linkedEntryContext,
  isCreatingSupporter,
  isDeletingSupporterId,
  isCopyingSupporterId,
  copiedSupporterId,
  pendingDeleteSupporter,
  shareConditionOptions,
  prepareLayReportingPanel,
  createSupporter,
  toggleSupporter,
  copyCreatedLink,
  copyExistingSupporterLink,
  requestDeleteSupporter,
  cancelDeleteSupporter,
  confirmDeleteSupporter
} = useTrackerLayReportingSettings()

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    void prepareLayReportingPanel()
  }
}, { immediate: true })
</script>

<template>
  <TrackerWorkspaceSettingsShell
    :open="open"
    title="Lay reporting"
    description="Create private links so someone you trust can submit observer reports. You can also start a link from a saved history entry."
    desktop-max-width="lg:max-w-xl"
    desktop-max-height="lg:max-h-[min(85dvh,44rem)]"
    @close="emit('close')"
  >
    <div v-if="linkedEntryContext" class="mb-5 rounded-3xl border border-primary/35 bg-primary/10 p-4">
      <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">
        Linked entry
      </p>
      <p class="mt-2 font-semibold text-highlighted">
        {{ linkedEntryContext.summary }}
      </p>
      <p class="mt-1 text-xs text-primary/80">
        {{ linkedEntryContext.condition }}
      </p>
    </div>

    <div class="space-y-4">
      <label class="block">
        <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Link label (optional)</span>
        <input
          v-model="supporterForm.link_label"
          type="text"
          class="w-full rounded-3xl border border-default bg-elevated/40 px-4 py-4 text-base font-medium text-highlighted outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary/40"
          placeholder="Example: Mom, spouse, caregiver"
        >
        <p class="mt-2 px-1 text-xs leading-5 text-muted">
          This label is only for you to recognize the link. They enter their real info when submitting a report.
        </p>
      </label>

      <div>
        <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Conditions to share</span>
        <USelectMenu
          v-model="supporterForm.visible_conditions"
          :items="shareConditionOptions"
          multiple
          placeholder="Choose conditions to share"
          class="w-full"
          color="neutral"
          size="xl"
          :ui="TRACKER_SETTINGS_SELECT_MENU_UI"
          :content="TRACKER_SETTINGS_SELECT_MENU_CONTENT"
        />
      </div>

      <p
        v-if="supporterError"
        class="text-center text-sm font-medium text-red-600 dark:text-red-300"
        aria-live="assertive"
      >
        {{ supporterError }}
      </p>

      <button
        type="button"
        class="w-full rounded-2xl bg-primary px-5 py-4 text-base font-bold text-inverted shadow-lg transition hover:bg-primary/90"
        :disabled="isCreatingSupporter"
        @click="createSupporter"
      >
        {{ isCreatingSupporter ? 'Creating...' : 'Create Private Link' }}
      </button>
    </div>

    <div
      v-if="createdLink"
      ref="createdLinkPanelEl"
      class="mt-5 rounded-3xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40"
    >
      <p class="text-sm font-bold text-emerald-950 dark:text-emerald-200">
        Private reporting link
      </p>
      <p class="mt-2 break-all text-sm leading-6 text-emerald-900 dark:text-emerald-100">
        {{ createdLink }}
      </p>
      <p class="mt-2 text-xs leading-5 text-emerald-800 dark:text-emerald-200/80">
        Click Copy link to put this URL on the clipboard. The raw token is only shown here.
      </p>
      <button
        type="button"
        class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
        @click="copyCreatedLink"
      >
        <UIcon :name="createdLinkCopied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-4" />
        {{ createdLinkCopied ? 'Copied to clipboard' : 'Copy link' }}
      </button>
    </div>

    <div class="mt-8 border-t border-default/70 pt-5">
      <h3 class="text-base font-bold text-highlighted">
        Existing reporting links
      </h3>

      <div v-if="!supporterProfiles.length" class="py-5 text-center text-sm text-muted">
        No reporting links yet.
      </div>

      <div v-else class="mt-4 divide-y divide-default/70">
        <article
          v-for="profile in supporterProfiles"
          :key="profile.id"
          class="py-4 first:pt-0"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h4 class="font-bold text-highlighted">
                {{ profile.display_name || 'Private reporting link' }}
              </h4>
              <p class="mt-1 text-sm text-muted">
                Reporter details are collected on each submission.
              </p>
            </div>
            <UBadge :color="profile.active ? 'success' : 'neutral'" variant="soft" size="md">
              {{ profile.active ? 'Active' : 'Disabled' }}
            </UBadge>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <UBadge
              v-for="condition in profile.visible_conditions"
              :key="condition"
              color="neutral"
              variant="soft"
              size="md"
            >
              {{ condition }}
            </UBadge>
          </div>

          <div v-if="profile.entry_context_summary" class="mt-3 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2">
            <p class="text-xs font-bold uppercase tracking-[0.12em] text-primary">
              Linked entry
            </p>
            <p class="mt-1 text-sm text-highlighted">
              {{ profile.entry_context_summary }}
            </p>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <button
              type="button"
              class="grid size-11 shrink-0 place-items-center rounded-full bg-elevated text-highlighted ring-1 ring-default transition hover:bg-accented"
              :disabled="isCopyingSupporterId === profile.id"
              :aria-label="`Show a copyable link for ${profile.display_name || 'private reporting link'}`"
              @click="copyExistingSupporterLink(profile)"
            >
              <UIcon
                :name="copiedSupporterId === profile.id ? 'i-lucide-check' : 'i-lucide-copy'"
                class="size-4"
              />
              <span class="sr-only">{{ copiedSupporterId === profile.id ? 'Copied' : 'Show copyable link' }}</span>
            </button>
            <button
              type="button"
              class="flex-1 rounded-2xl bg-elevated px-4 py-3 text-sm font-bold text-highlighted ring-1 ring-default"
              @click="toggleSupporter(profile)"
            >
              {{ profile.active ? 'Disable link' : 'Reactivate link' }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-2xl bg-red-950/50 px-4 py-3 text-sm font-bold text-red-300 ring-1 ring-red-900/60"
              @click="requestDeleteSupporter(profile)"
            >
              Delete link
            </button>
          </div>
        </article>
      </div>
    </div>
  </TrackerWorkspaceSettingsShell>

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && pendingDeleteSupporter"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
        @click.self="cancelDeleteSupporter"
      >
        <div class="w-full max-w-md rounded-[1.75rem] border border-default/80 bg-default p-5 shadow-2xl">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Delete reporting link
          </p>
          <h3 class="mt-2 text-xl font-bold text-highlighted">
            Remove this link forever?
          </h3>
          <p class="mt-3 text-sm leading-6 text-muted">
            <span class="font-semibold text-highlighted">{{ pendingDeleteSupporter.display_name }}</span>
            will stop working immediately. Anyone with the old URL will no longer be able to submit reports.
          </p>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-2xl bg-elevated px-4 py-3 text-sm font-bold text-highlighted"
              @click="cancelDeleteSupporter"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-highlighted"
              :disabled="isDeletingSupporterId === pendingDeleteSupporter.id"
              @click="confirmDeleteSupporter"
            >
              {{ isDeletingSupporterId === pendingDeleteSupporter.id ? 'Deleting...' : 'Delete link' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
