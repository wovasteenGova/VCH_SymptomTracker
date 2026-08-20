<template>
  <Teleport to="body">
    <div
      v-if="showHomeWorkspaceLoader"
      class="fixed inset-0 z-[80] grid place-items-center bg-default px-4"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div class="flex w-full max-w-[min(28rem,92vw)] flex-col items-center gap-4 sm:max-w-[32rem]">
        <div class="flex items-center justify-center gap-3">
          <img
            src="/brand/vch-symptom-tracker-logo.png"
            alt="VCH Symptom Tracker"
            class="size-11 shrink-0 rounded-full object-cover object-center ring-1 ring-default shadow-sm"
            decoding="async"
          >
          <span class="text-[2rem] font-semibold leading-none tracking-[0.12em] text-default">
            VCH
          </span>
        </div>
        <img
          src="/vch-tank-loader.svg"
          alt=""
          class="w-full select-none"
          decoding="async"
        >
      </div>
    </div>
  </Teleport>
  <main
    id="tracker-app-shell"
    class="app-shell relative overflow-hidden bg-default text-default transition-colors"
    :class="{
      'app-shell-embed': isEmbeddedPreview
    }"
  >
    <section
      class="mx-auto flex h-full w-full flex-col overflow-hidden"
      :class="isDesktopLayout && !isEmbeddedPreview
        ? 'max-w-none px-4 pb-4 pt-4 lg:px-6'
        : 'max-w-md pb-0 sm:max-w-lg'"
    >
      <header
        class="flex shrink-0 flex-col"
        :class="isMobileLayout ? 'border-b border-default/60 bg-default' : 'gap-4 px-4'"
      >
        <div
          class="flex min-w-0 items-center justify-between gap-2"
          :class="isMobileLayout ? 'px-3 py-2' : ''"
        >
          <VchBrandMark
            :vertical="false"
            compact
            :logo-only="isMobileLayout"
            class="min-w-0 shrink"
            @home="goAppHome"
          />

          <div v-if="isEntryOpen && isMobileLayout" class="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="rounded-full px-4 py-2 text-sm font-semibold text-toned transition hover:bg-accented/40"
              @click="handleCancelEntry"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              :disabled="isSavingEntry"
              @click="handleEntryDone"
            >
              {{ entryHeaderActionLabel }}
            </button>
          </div>

          <div v-else class="ml-auto flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
            <UTooltip
              v-if="!isEmbeddedPreview"
              :text="CLAIMBUILDER_ACTION.tooltip"
              :delay-duration="TRACKER_TOOLTIP.delayDuration"
              :content="TRACKER_TOOLTIP.content"
            >
              <UButton
                type="button"
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-file-stack"
                class="shrink-0"
                :aria-label="CLAIMBUILDER_ACTION.ariaLabel"
                @click="openClaimBuilder"
              >
                <span class="hidden md:inline">{{ CLAIMBUILDER_ACTION.label }}</span>
              </UButton>
            </UTooltip>

            <UTooltip
              v-if="!isEmbeddedPreview"
              :text="LAY_REPORTING_ACTION.tooltip"
              :delay-duration="TRACKER_TOOLTIP.delayDuration"
              :content="TRACKER_TOOLTIP.content"
            >
              <UButton
                type="button"
                size="xs"
                variant="soft"
                icon="i-lucide-users"
                class="shrink-0 bg-sky-500/15 text-sky-600 hover:bg-sky-500/25 dark:text-sky-300"
                :aria-label="LAY_REPORTING_ACTION.ariaLabel"
                @click="openLayReportingSettings"
              >
                <span class="hidden md:inline">{{ LAY_REPORTING_ACTION.label }}</span>
              </UButton>
            </UTooltip>

            <VchThemeToggle size="md" />

            <UTooltip
              v-if="notificationNeedsAttention"
              :text="notificationAttentionLabel"
              :delay-duration="TRACKER_TOOLTIP.delayDuration"
              :content="TRACKER_TOOLTIP.content"
            >
              <button
                type="button"
                class="relative grid size-9 place-items-center rounded-full bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-300/70 transition hover:bg-amber-200 sm:size-10 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-700/70 dark:hover:bg-amber-900"
                :aria-label="notificationAttentionLabel"
                @click="handleNotificationStatusClick"
              >
                <UIcon name="i-lucide-bell-off" class="size-5" />
                <span class="absolute -right-0.5 -top-0.5 grid size-3 place-items-center rounded-full bg-amber-400 ring-2 ring-elevated" aria-hidden="true" />
              </button>
            </UTooltip>

            <div v-if="user" class="relative">
              <UTooltip
                :text="SUBMISSIONS_INBOX_ACTION.tooltip"
                :delay-duration="TRACKER_TOOLTIP.delayDuration"
                :content="TRACKER_TOOLTIP.content"
              >
                <button
                  type="button"
                  class="relative z-[60] grid size-9 place-items-center rounded-full shadow-sm ring-1 transition sm:size-10"
                  :class="isSubmissionDropdownOpen
                    ? 'bg-primary text-white ring-primary/50'
                    : 'bg-elevated text-highlighted ring-default hover:bg-accented'"
                  :aria-expanded="isSubmissionDropdownOpen"
                  :aria-label="SUBMISSIONS_INBOX_ACTION.ariaLabel"
                  @click="toggleSubmissionDropdown"
                >
                <UIcon name="i-lucide-inbox" class="size-5" />
                <span
                  v-if="hasEntryDraft"
                  class="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[0.62rem] font-black leading-5 text-white ring-2 ring-elevated"
                >
                  !!
                </span>
                <span
                  v-else-if="unreadSubmissionCount"
                  class="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[0.65rem] font-bold leading-5 text-white ring-2 ring-elevated"
                >
                  {{ unreadSubmissionCount }}
                </span>
              </button>
              </UTooltip>

              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="-translate-y-1 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="translate-y-0 opacity-100"
                leave-to-class="-translate-y-1 opacity-0"
              >
                <div
                  v-if="isSubmissionDropdownOpen"
                  class="fixed inset-0 z-40"
                  @click="closeSubmissionDropdown"
                />
              </Transition>

              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="-translate-y-1 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="translate-y-0 opacity-100"
                leave-to-class="-translate-y-1 opacity-0"
              >
                <div
                  v-if="isSubmissionDropdownOpen"
                  class="z-[70] overflow-hidden rounded-3xl border border-default bg-elevated shadow-2xl shadow-black/15 dark:shadow-black/40"
                  :class="isMobileLayout
                    ? 'fixed inset-x-3 top-[calc(env(safe-area-inset-top)+3.25rem)] max-h-[min(24rem,calc(100dvh-5rem))]'
                    : 'absolute right-0 top-[calc(100%+0.5rem)] w-[min(20rem,calc(100vw-2rem))]'"
                >
                  <div class="border-b border-default px-4 py-3">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide-inbox" class="size-4 text-primary" />
                      <p class="text-[0.875rem] font-bold text-highlighted">Submissions</p>
                    </div>
                    <p class="mt-1 text-xs text-muted">
                      All observations submitted to your tracker.
                    </p>
                  </div>

                  <div class="max-h-80 overflow-y-auto no-scrollbar p-2">
                    <div
                      v-if="hasEntryDraft"
                      class="relative mb-2"
                    >
                      <button
                        type="button"
                        class="flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 pr-12 text-left transition hover:bg-red-100/80 dark:border-red-900/50 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                        @click="resumeEntryDraft"
                      >
                        <span class="relative mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-white text-red-600 ring-1 ring-red-200 dark:bg-elevated dark:text-red-300 dark:ring-red-900/60">
                          <UIcon name="i-lucide-files" class="size-4" />
                          <span class="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-red-500 px-0.5 text-[0.58rem] font-black leading-4 text-white ring-2 ring-red-50 dark:ring-red-950">
                            !!
                          </span>
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block text-[0.875rem] font-bold text-highlighted">Draft</span>
                          <span class="mt-1 block truncate text-xs font-semibold text-toned">
                            {{ entryDraftPreview?.title || 'Symptom log' }}
                          </span>
                          <span class="mt-1 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-red-600 dark:text-red-300">
                            Saved {{ entryDraftPreview?.timeLabel || 'recently' }}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        class="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-muted transition hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300"
                        aria-label="Delete draft"
                        @click.stop="requestDeleteEntryDraft"
                      >
                        <UIcon name="i-lucide-x" class="size-4" />
                      </button>
                    </div>

                    <div
                      v-if="!submissionNotifications.length && !hasEntryDraft"
                      class="px-2 py-6 text-center text-[0.875rem] text-muted"
                    >
                      No submissions yet.
                    </div>

                    <button
                      v-for="submission in submissionNotifications"
                      :key="submission.id"
                      type="button"
                      class="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-accented/40"
                      @click="openSubmissionLogDetails(submission.id)"
                    >
                      <span
                        class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full"
                        :class="highlightedSubmissionId === submission.id
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30 dark:bg-primary/20 dark:text-primary dark:ring-primary/50'
                          : 'bg-muted text-muted dark:text-toned'"
                      >
                        <UIcon name="i-lucide-message-square-text" class="size-4" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-[0.875rem] font-bold text-highlighted">{{ submission.title }}</span>
                        <span class="mt-1 line-clamp-2 block text-xs leading-5 text-muted">{{ submission.summary }}</span>
                        <span class="mt-1 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">
                          {{ submission.source }} · {{ submission.condition }} · {{ submission.timeLabel }}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <TrackerAccountMenu
              :embedded="isEmbeddedPreview"
              @open-embed-profile="openEmbedProfile"
              @signed-in="onTrackerSignedIn"
            />
          </div>
        </div>

        <p
          v-if="homeGreetingLine"
          class="text-xs font-semibold uppercase tracking-[0.2em] text-muted"
          :class="isMobileLayout
            ? 'px-3 pb-2 pt-1'
            : (isDesktopLayout && !isEmbeddedPreview ? 'mb-4' : '')"
        >
          {{ homeGreetingLine }}
        </p>
      </header>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TrackerDesktopWorkspace
          v-if="isDesktopLayout && !isEmbeddedPreview"
          :conditions="homeConditions"
          :selected-key="desktopSelectedConditionKey"
          :entitlements-loaded="entitlementsLoaded"
          :is-condition-locked="isConditionLogLocked"
          @select="handleDesktopConditionSelect"
          @open-browser="openConditionBrowser"
          @add-custom="openConditionBrowserForCustom"
        >
          <template #main>
            <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <ConditionBrowser
                v-if="showConditionBrowser && !showDesktopConditionBrowserOverlay"
                key="condition-browser"
                ref="conditionBrowserRef"
                class="flex min-h-0 flex-1 flex-col overflow-hidden bg-default dark:bg-default"
                :mode="needsOnboarding ? 'onboarding' : 'manage'"
                :conditions="conditionPickerOptions"
                :selected-keys="draftSelectedKeys"
                :list-order-keys="conditionBrowserListOrder"
                :locked-keys="[]"
                :restricted-keys="mentalHealthRestrictedKeys"
                :show-pro-limit="false"
                :saving="isSavingTrackedConditions"
                :error="trackedConditionsError"
                :demo-search-query="isDemoMode ? demoConditionSearch : undefined"
                @toggle="toggleDraftCondition"
                @add-custom="addCustomDraftCondition"
                @restricted-select="handleRestrictedConditionSelect"
                @confirm="confirmConditionOnboarding"
                @done="finishConditionBrowser"
              />

              <Transition
                v-else
                name="workspace-panel"
                mode="out-in"
              >
                <TrackerEntryFlow
                  v-if="isEntryOpen"
                  ref="desktopEntryFlowRef"
                  key="desktop-entry-flow"
                  variant="desktop"
                  class="flex min-h-0 flex-1 flex-col overflow-hidden"
                  :title="entryTitle"
                  :image="activeEntryImage"
                  :is-editing="isEditingEntry"
                  :entry-step="entryStep"
                  :entry-steps-length="entrySteps.length"
                  :entry-progress-width="entryProgressWidth"
                  :is-last-entry-step="isLastEntryStep"
                  :current-step-fields="currentEntryStepFields"
                  :severity="severityValue"
                  :entry-form="entryForm"
                  :entry-date-time-preview="entryDateTimePreview"
                  :calendar-date="entryCalendarDate"
                  :calendar-placeholder="entryCalendarPlaceholder"
                  :time-hour="entryTimeHour"
                  :time-minute="entryTimeMinute"
                  :time-period="entryTimePeriod"
                  :has-logged-entry-on-day="hasLoggedEntryOnDay"
                  :get-calendar-day-display="getCalendarDayDisplay"
                  :get-logged-day-severity-title="getLoggedDaySeverityTitle"
                  :is-saving="isSavingEntry"
                  :error="entryError"
                  :active-entry-is-mental-health="activeEntryIsMentalHealth"
                  :field-key="fieldKey"
                  :get-presets-for-entry-field="getPresetsForEntryField"
                  :show-share-link="Boolean(isEditingEntry && user)"
                  :enable-swipe="false"
                  @cancel="cancelDesktopEntry"
                  @previous-step="showPreviousEntryStep"
                  @next-step="handleEntryNextStep"
                  @primary-action="handleEntryPrimaryAction"
                  @share-link="openShareLinkForEntry(editingEntryId!)"
                  @update:severity="severityValue = $event"
                  @update:calendar-date="onEntryCalendarDateUpdate"
                  @update:calendar-placeholder="onEntryCalendarPlaceholderUpdate"
                  @update:time-hour="entryTimeHour = $event"
                  @update:time-minute="entryTimeMinute = $event"
                  @update:time-period="entryTimePeriod = $event"
                  @time-change="onEntryTimePartsChange"
                  @set-now="setEntryDateTimeNow"
                  @apply-severity-preset="applySeverityPreset"
                  @apply-field-preset="applyEntryFieldPreset"
                />

                <TrackerDesktopCenter
                  v-else
                  key="desktop-center"
                  class="flex min-h-0 flex-1 flex-col overflow-hidden"
                  v-model:active-tab="desktopCenterTab"
                  v-model:charts-show-all-conditions="desktopChartsShowAllConditions"
                  :title="activeCondition.title"
                  :category="activeCondition.category"
                  :image="activeCondition.image"
                  :has-conditions="homeConditions.length > 0"
                  :logging="false"
                  :tip="homeVisitTip"
                  :chart-metrics="desktopChartMetrics"
                  @log="startDesktopLogEntry"
                  @open-browser="openConditionBrowser"
                  @show-all-tips="openHomeTipsOverlay"
                />
              </Transition>

              <ConditionBrowser
                v-if="showDesktopConditionBrowserOverlay"
                key="condition-browser-overlay"
                ref="conditionBrowserRef"
                class="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-default dark:bg-default"
                mode="manage"
                :conditions="conditionPickerOptions"
                :selected-keys="draftSelectedKeys"
                :list-order-keys="conditionBrowserListOrder"
                :locked-keys="[]"
                :restricted-keys="mentalHealthRestrictedKeys"
                :show-pro-limit="false"
                :saving="isSavingTrackedConditions"
                :error="trackedConditionsError"
                :demo-search-query="isDemoMode ? demoConditionSearch : undefined"
                @toggle="toggleDraftCondition"
                @add-custom="addCustomDraftCondition"
                @restricted-select="handleRestrictedConditionSelect"
                @confirm="confirmConditionOnboarding"
                @done="finishConditionBrowser"
              />
            </div>
          </template>

          <template #history>
            <TrackerDesktopHistory
              ref="desktopHistoryRef"
              v-model:active-tab="activeHistoryTab"
              class="min-h-0 flex-1"
              :entries="desktopHistoryEntries"
              :show-all-entries="desktopHistoryShowAll"
              :entries-filtered="!desktopHistoryShowAll"
              :condition-filter-label="activeCondition.title"
              :highlighted-entry-id="highlightedSubmissionId"
              :is-loading="isLoadingEntries && !hasLoadedEntriesOnce"
              :error="entriesError"
              :loading-message="loadingEntriesMessage"
              :signed-in="Boolean(user)"
              :auth-loading="isAuthLoading"
              :is-demo-mode="isDemoMode"
              @sign-in="toggleAuthPanel"
              @show-all="desktopHistoryShowAll = true"
              @view-charts="openDesktopChartsForConditionKey"
              @open-entry="openEntryDetailsOverlay"
              @edit-entry="requestEntryEdit"
              @delete-entry="requestDeleteEntry"
              @open-export="openDesktopHistoryExport"
            >
              <template #calendar>
                <SymptomCalendar
                  v-model="historyCalendarDate"
                  v-model:placeholder="historyCalendarPlaceholder"
                  :has-logged-entry-on-day="hasLoggedEntryOnDay"
                  :get-calendar-day-display="getCalendarDayDisplay"
                  :get-logged-day-severity-title="getLoggedDaySeverityTitle"
                  @update:model-value="onHistoryCalendarDateUpdate"
                  @update:placeholder="onHistoryCalendarPlaceholderUpdate"
                />

                <div class="mt-4 rounded-2xl border border-default bg-muted/40 px-4 py-3">
                  <p :class="['text-xs font-bold uppercase tracking-[0.14em] text-muted']">
                    {{ selectedHistoryDayLabel }}
                  </p>
                  <div v-if="selectedHistoryDayEntries.length" class="mt-2 space-y-2">
                    <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                      <span>{{ selectedHistoryDayEntries.length }} {{ selectedHistoryDayEntries.length === 1 ? 'log' : 'logs' }}</span>
                      <span>Peak severity {{ selectedHistoryDayPeakSeverity }}/10</span>
                      <span v-if="selectedHistoryDaySeverityRange">{{ selectedHistoryDaySeverityRange }}</span>
                    </div>
                    <div class="space-y-2">
                      <button
                        v-for="entry in selectedHistoryDayPreviewEntries"
                        :key="`desktop-history-day-${entry.id}`"
                        type="button"
                        class="w-full rounded-2xl bg-elevated px-3 py-2 text-left text-sm ring-1 ring-default transition hover:bg-accented/40"
                        @click="openEntryDetailsOverlay(entry.id)"
                      >
                        <div class="flex items-center justify-between gap-3">
                          <p class="min-w-0 truncate font-bold text-highlighted">
                            {{ entry.title }}
                          </p>
                          <span class="shrink-0 text-xs font-semibold text-muted">
                            {{ entry.time }} · {{ entry.severity }}/10
                          </span>
                        </div>
                        <p class="mt-1 truncate text-xs text-muted">
                          {{ entry.condition }} · {{ entry.summary }}
                        </p>
                      </button>
                    </div>
                    <p
                      v-if="selectedHistoryDayExtraCount > 0"
                      class="text-xs font-semibold text-muted"
                    >
                      +{{ selectedHistoryDayExtraCount }} more {{ selectedHistoryDayExtraCount === 1 ? 'log' : 'logs' }} that day
                    </p>
                  </div>
                  <p v-else class="mt-2 text-sm text-muted">
                    No logs recorded for this day.
                  </p>
                </div>

                <LoggingActivityReport :metrics="loggingActivityMetrics" />
              </template>
            </TrackerDesktopHistory>
          </template>
        </TrackerDesktopWorkspace>

        <div
          v-else
          class="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <Transition
            name="workspace-panel"
            mode="out-in"
          >
          <section
            v-if="isEntryOpen"
            key="entry-workspace"
            class="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
          >
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden px-5">
            <TrackerEntryFlow
              ref="mobileEntryFlowRef"
              variant="mobile"
              class="flex min-h-0 flex-1 flex-col overflow-hidden"
              :title="entryTitle"
              :image="activeEntryImage"
              :is-editing="isEditingEntry"
              :entry-step="entryStep"
              :entry-steps-length="entrySteps.length"
              :entry-progress-width="entryProgressWidth"
              :is-last-entry-step="isLastEntryStep"
              :current-step-fields="currentEntryStepFields"
              :severity="severityValue"
              :entry-form="entryForm"
              :entry-date-time-preview="entryDateTimePreview"
              :calendar-date="entryCalendarDate"
              :calendar-placeholder="entryCalendarPlaceholder"
              :time-hour="entryTimeHour"
              :time-minute="entryTimeMinute"
              :time-period="entryTimePeriod"
              :has-logged-entry-on-day="hasLoggedEntryOnDay"
              :get-calendar-day-display="getCalendarDayDisplay"
              :get-logged-day-severity-title="getLoggedDaySeverityTitle"
              :is-saving="isSavingEntry"
              :error="entryError"
              :active-entry-is-mental-health="activeEntryIsMentalHealth"
              :field-key="fieldKey"
              :get-presets-for-entry-field="getPresetsForEntryField"
              :show-share-link="Boolean(isEditingEntry && user)"
              :is-condition-picker-open="isConditionPickerOpen"
              :custom-condition-input="customConditionInput"
              :has-custom-condition-search="hasCustomConditionSearch"
              :show-custom-condition-empty-state="showCustomConditionEmptyState"
              :debounced-custom-condition-preview="debouncedCustomConditionPreview"
              :filtered-picker-condition-results="filteredPickerConditionResults"
              @previous-step="showPreviousEntryStep"
              @next-step="handleEntryNextStep"
              @primary-action="handleEntryPrimaryAction"
              @share-link="openShareLinkForEntry(editingEntryId!)"
              @toggle-condition-picker="toggleConditionPicker"
              @apply-custom-condition="applyCustomEntryCondition"
              @change-condition="changeEntryCondition"
              @update:severity="severityValue = $event"
              @update:custom-condition-input="customConditionInput = $event"
              @update:calendar-date="onEntryCalendarDateUpdate"
              @update:calendar-placeholder="onEntryCalendarPlaceholderUpdate"
              @update:time-hour="entryTimeHour = $event"
              @update:time-minute="entryTimeMinute = $event"
              @update:time-period="entryTimePeriod = $event"
              @time-change="onEntryTimePartsChange"
              @set-now="setEntryDateTimeNow"
              @apply-severity-preset="applySeverityPreset"
              @apply-field-preset="applyEntryFieldPreset"
            />
        </div>
      </section>

          <div
            v-else
            key="home-workspace"
            class="home-workspace relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
            :class="[
              { 'home-workspace--history-hidden': shouldHideHistoryChrome },
              isMobileLayout ? 'mt-1' : 'mt-2'
            ]"
          >
        <div
          class="flex min-h-0 flex-col"
          :class="[isMobileLayout ? 'px-3' : 'px-4', carouselWorkspaceClass]"
          @wheel.passive="handleConditionWheel"
          @touchstart.passive="handleConditionSwipeStart"
          @touchmove.passive="handleConditionTouchMove"
          @touchend="handleConditionSwipeEnd"
        >
          <div
            class="relative flex min-h-0 flex-1 flex-col"
            :style="homeTransitionStyleVars"
          >
            <div
              class="relative min-h-0 w-full flex-1 overflow-hidden rounded-[1.75rem]"
              :class="{ 'is-home-morph-active': homeSharedTransitionActive && transitionDirection === 'expand' }"
            >
              <Transition name="home-state-fade">
                <ConditionBrowser
                  v-if="showConditionBrowser"
                  ref="conditionBrowserRef"
                  key="condition-browser"
                  class="absolute inset-0 z-20 bg-default"
                  :mode="needsOnboarding ? 'onboarding' : 'manage'"
                  :conditions="conditionPickerOptions"
                  :selected-keys="draftSelectedKeys"
                  :list-order-keys="conditionBrowserListOrder"
                  :locked-keys="[]"
                  :restricted-keys="mentalHealthRestrictedKeys"
                  :show-pro-limit="false"
                  :saving="isSavingTrackedConditions"
                  :error="trackedConditionsError"
                  :demo-search-query="isDemoMode ? demoConditionSearch : undefined"
                  @toggle="toggleDraftCondition"
                  @add-custom="addCustomDraftCondition"
                  @restricted-select="handleRestrictedConditionSelect"
                  @confirm="confirmConditionOnboarding"
                  @done="finishConditionBrowser"
                />

                <div
                  v-else-if="trackedConditionsLoadError && !homeConditions.length"
                  key="home-load-error"
                  class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-default px-6 text-center"
                >
                  <UIcon name="i-lucide-triangle-alert" class="size-10 text-amber-500" />
                  <h3 class="mt-4 text-lg font-bold text-highlighted">
                    Tracker didn't load
                  </h3>
                  <p class="mt-2 max-w-xs text-sm leading-6 text-toned">
                    {{ trackedConditionsLoadError || 'Something went wrong while loading your account.' }}
                  </p>
                  <div class="mt-5 flex w-full max-w-xs flex-col gap-2">
                    <button
                      type="button"
                      class="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                      @click="retryHomeLoad"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented"
                      @click="reloadAppPage"
                    >
                      Refresh page
                    </button>
                  </div>
                </div>

                <div
                  v-else-if="homeConditions.length"
                  key="home-carousel"
                  ref="homeCarouselStageEl"
                  class="home-carousel-stage absolute inset-0 flex min-h-0 flex-col overflow-hidden bg-default"
                  :class="[
                    isHomeOverviewSlide ? 'is-overview justify-start' : 'is-condition',
                    homeSharedTransitionActive ? 'is-shared-transition' : '',
                    homeSharedTransitionActive ? `is-shared-${transitionDirection}` : '',
                    homeHeroTitleRevealed ? 'is-hero-title-revealed' : ''
                  ]"
                  :style="homeCarouselStageStyle"
                >
                <div ref="homeCarouselHeroEl" class="home-carousel-hero relative shrink-0 overflow-hidden">
                  <Transition :name="heroSlideTransitionName">
                    <div
                      :key="`${activeIndex}-${activeCondition.key}`"
                      class="absolute inset-0"
                    >
                      <img
                        :src="activeCondition.image"
                        :alt="activeCondition.title"
                        class="absolute inset-0 h-full w-full object-cover"
                        :class="homeImageTransitionKey ? 'opacity-0' : ''"
                      >

                      <div class="home-carousel-hero-title pointer-events-none absolute inset-x-0 top-0 bg-linear-to-b from-black/70 via-black/20 to-transparent p-5 pb-10">
                        <h2 class="text-2xl font-bold text-white">
                          {{ activeCondition.title }}
                        </h2>
                      </div>

                      <button
                        v-if="isMobileCarouselLayout && !isHomeOverviewSlide"
                        type="button"
                        class="absolute right-3 top-3 z-20 rounded-full bg-black/45 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-black/60"
                        @click.stop="openHomeOverview"
                      >
                        All conditions
                      </button>
                    </div>
                  </Transition>

                  <button
                    v-if="!isHomeOverviewSlide"
                    type="button"
                    class="absolute inset-0 z-10"
                    :class="isConditionSlideEntryEnabled ? 'cursor-pointer' : 'pointer-events-none'"
                    :tabindex="isConditionSlideEntryEnabled ? 0 : -1"
                    :aria-label="`Log ${activeCondition.title} entry`"
                    @click.stop="startEntryFromCurrentSlide"
                    @keydown.enter.prevent="startEntryFromCurrentSlide"
                    @keydown.space.prevent="startEntryFromCurrentSlide"
                  />
                </div>

                <div ref="homeCarouselOverviewEl" class="home-carousel-overview flex min-h-0 flex-col overflow-hidden">
                  <div data-home-overview-header class="shrink-0 px-4 pt-2 pb-3">
                    <div class="flex items-center justify-between gap-2">
                      <h2 class="text-xl font-bold text-highlighted">
                        Your conditions
                      </h2>
                      <div class="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          class="rounded-full bg-primary px-3.5 py-2 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:opacity-90"
                          @click.stop="openConditionBrowser"
                        >
                          All conditions
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    ref="homeConditionsScrollEl"
                    data-home-conditions-scroll
                    class="no-scrollbar overflow-y-auto px-2 pb-2"
                    @scroll="handleConditionScroll"
                  >
                    <div class="space-y-1">
                      <button
                        v-for="condition in homeConditions"
                        :key="condition.key"
                        type="button"
                        class="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition hover:bg-accented/40 active:scale-[0.995]"
                        @click="logHomeCondition(condition)"
                      >
                        <span class="relative size-16 shrink-0">
                          <img
                            :ref="(el) => setHomeConditionImageRef(condition.key, el)"
                            :src="condition.image"
                            :alt="condition.title"
                            class="size-16 shrink-0 rounded-2xl object-cover"
                            :class="homeImageTransitionKey === condition.key ? 'opacity-0' : ''"
                          >
                        </span>

                        <span class="min-w-0 flex-1">
                          <span class="block text-lg font-bold leading-snug text-highlighted">
                            {{ condition.title }}
                          </span>
                          <span class="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                            {{ condition.category }}
                          </span>
                        </span>

                        <span
                          v-if="!entitlementsLoaded"
                          class="size-5 shrink-0 animate-pulse rounded-full bg-muted"
                          aria-hidden="true"
                        />
                        <UIcon
                          v-else-if="isConditionLogLocked(condition.key)"
                          name="i-lucide-lock"
                          class="size-5 shrink-0 text-amber-600 dark:text-amber-300"
                          aria-hidden="true"
                        />
                        <UIcon
                          v-else
                          name="i-lucide-chevron-right"
                          class="size-5 shrink-0 text-muted"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Dots → tip → crisis: grid row under list (overview) or under hero (slideshow). DO NOT move to footer. -->
                <div
                  data-home-carousel-chrome
                  class="home-carousel-chrome shrink-0 px-2 pb-1"
                  :class="{
                    'is-chrome-retreat': homeChromeRetreat,
                    'is-chrome-retreat-instant': homeChromeRetreatInstant
                  }"
                >
                  <div class="flex justify-center gap-2">
                    <button
                      v-for="slideIndex in homeCarouselSlideCount"
                      :key="`chrome-dot-${slideIndex - 1}`"
                      type="button"
                      class="home-carousel-dot h-2 rounded-full"
                      :class="[
                        slideIndex - 1 === activeIndex ? 'w-7 bg-primary' : 'w-2 bg-muted'
                      ]"
                      :aria-label="slideIndex === 1 ? 'Show your conditions overview' : `Show ${homeConditions[slideIndex - 2]?.title}`"
                      @click="showSlide(slideIndex - 1)"
                    />
                  </div>

                  <div
                    v-if="homeVisitTip"
                    class="home-carousel-tip mt-3"
                    :class="{ 'is-tip-retreat': homeChromeRetreat }"
                  >
                    <Transition name="home-tip-fade" mode="out-in">
                      <HomeVisitTipCard
                        :key="`${homeVisitTip.title}-${homeVisitTip.text}`"
                        :tip="homeVisitTip"
                        @show-all="openHomeTipsOverlay"
                      />
                    </Transition>
                  </div>

                  <p class="mt-3 text-xs leading-5 text-muted">
                    {{ VA_CRISIS_LINE_SHORT }}
                  </p>
                </div>

                <img
                  v-if="homeImageTransitionKey"
                  :src="homeImageTransitionImage"
                  :alt="homeImageTransitionAlt"
                  class="home-image-transition fixed z-[80] object-cover"
                  :style="homeImageTransitionStyle"
                  aria-hidden="true"
                >
                </div>

                <div
                  v-else
                  key="home-fallback"
                  class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-default px-6 text-center"
                >
                  <UIcon name="i-lucide-circle-alert" class="size-10 text-amber-500" />
                  <h3 class="mt-4 text-lg font-bold text-highlighted">
                    Something didn't load right
                  </h3>
                  <p class="mt-2 max-w-xs text-sm leading-6 text-toned">
                    The tracker hit an unexpected state. Refresh the page or try again in a moment.
                  </p>
                  <div class="mt-5 flex w-full max-w-xs flex-col gap-2">
                    <button
                      type="button"
                      class="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                      @click="retryHomeLoad"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented"
                      @click="reloadAppPage"
                    >
                      Refresh page
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <div
              v-if="homeConditions.length && !showConditionBrowser"
              class="home-carousel-footer mb-2 shrink-0 pt-3"
              :class="{
                'has-mobile-log-space': isMobileCarouselLayout && (homeSharedTransitionActive || !isHomeOverviewSlide),
                'pointer-events-none': historyExpanded
              }"
            >
              <Transition name="home-log-btn">
                <div
                  v-if="isMobileCarouselLayout && !prefersDesktopCarouselChrome && !isHomeOverviewSlide && !historyExpanded && isConditionSlideEntryEnabled"
                  key="condition-log-btn"
                  class="mt-4 flex w-full justify-center"
                >
                  <button
                    type="button"
                    class="flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-xl transition hover:opacity-90 active:scale-[0.98]"
                    :aria-label="`Log ${activeCondition.title} entry`"
                    @click.stop="startEntryFromCurrentSlide"
                  >
                    <UIcon name="i-lucide-plus" class="size-5" />
                    Log {{ activeCondition.title }}
                  </button>
                </div>
              </Transition>

              <div
                v-if="prefersDesktopCarouselChrome && !historyExpanded"
                class="flex items-center justify-center gap-4"
                :class="isHomeOverviewSlide ? '' : 'mt-4'"
              >
                <button
                  type="button"
                  class="grid size-11 place-items-center rounded-full bg-elevated text-highlighted shadow-lg ring-1 ring-default transition hover:bg-accented/40"
                  aria-label="Previous slide"
                  @click.stop="showPreviousCondition"
                >
                  <UIcon name="i-lucide-chevron-left" class="size-5" />
                </button>

                <button
                  v-if="isHomeOverviewSlide"
                  type="button"
                  class="grid size-[4.5rem] place-items-center rounded-full bg-elevated text-highlighted shadow-xl ring-1 ring-default transition hover:bg-accented/40"
                  aria-label="Log a symptom entry"
                  @click.stop="startEntryFromOverview"
                >
                  <UIcon name="i-lucide-plus" class="size-9" />
                </button>
                <button
                  v-else
                  type="button"
                  class="grid size-[4.5rem] place-items-center rounded-full bg-elevated text-highlighted shadow-xl ring-1 ring-default transition hover:bg-accented/40"
                  :class="historyExpanded ? 'scale-90' : 'scale-100'"
                  :aria-label="`Add ${activeCondition.title} entry`"
                  @click.stop="startEntryFromCurrentSlide"
                >
                  <UIcon name="i-lucide-plus" class="size-9" />
                </button>

                <button
                  type="button"
                  class="grid size-11 place-items-center rounded-full bg-elevated text-highlighted shadow-lg ring-1 ring-default transition hover:bg-accented/40"
                  aria-label="Next slide"
                  @click.stop="showNextCondition"
                >
                  <UIcon name="i-lucide-chevron-right" class="size-5" />
                </button>
              </div>

            </div>
          </div>
        </div>

        <section
          v-if="!shouldHideHistoryChrome"
          class="home-history-panel flex min-h-0 flex-col overflow-hidden rounded-t-[1.75rem] border-t border-default/80 bg-elevated"
          :class="historyPanelClass"
          @pointerdown="handleHistoryPointerDown"
          @pointermove="handleHistoryPointerMove"
          @pointerup="handleHistoryPointerUp"
          @pointercancel="handleHistoryPointerCancel"
          @transitionend="handleHistoryPanelTransitionEnd"
        >
          <div class="history-panel-handle flex w-full shrink-0 cursor-grab flex-col items-center py-3 active:cursor-grabbing">
            <span class="h-1.5 w-14 rounded-full bg-muted" />
          </div>

          <div class="history-panel-header shrink-0 pb-3" :class="isMobileLayout ? 'px-3' : 'px-4'">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-2xl font-bold text-highlighted">History</h2>
              </div>
              <div class="relative flex shrink-0 items-center gap-2">
                <MonthlyBackupReminderTip
                  :open="isMonthlyBackupReminderVisible"
                  @dismiss="dismissMonthlyBackupReminder"
                />
                <span
                  v-if="user && !entitlementsLoaded"
                  class="relative inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1.5 ring-1 ring-default/60"
                  aria-hidden="true"
                >
                  <span class="inline-block h-3 w-10 animate-pulse rounded-full bg-accented/70" />
                </span>
                <span
                  v-else-if="user"
                  class="relative inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] ring-1"
                  :class="isPro
                    ? 'bg-amber-400/15 text-amber-700 ring-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/80'
                    : 'bg-primary/10 text-primary ring-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/40'"
                >
                  <UIcon
                    :name="isPro ? 'i-lucide-crown' : 'i-lucide-sparkles'"
                    class="size-3.5"
                    :class="isPro ? 'text-amber-600 dark:text-amber-300' : 'text-primary'"
                  />
                  {{ isPro ? 'Pro' : 'Free' }}
                  <span
                    class="absolute -right-0.5 -top-0.5 grid size-[0.825rem] place-items-center rounded-full bg-highlighted ring-[1.5px] ring-elevated"
                    aria-hidden="true"
                  >
                    <UIcon name="i-lucide-check" class="size-[0.55rem] text-emerald-400" />
                  </span>
                </span>
                <button
                  v-else-if="!isAuthLoading"
                  type="button"
                  data-history-interactive
                  class="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-toned ring-1 ring-default/60 transition hover:bg-accented"
                  aria-label="Sign in to save and view symptom history"
                  @click="openAuthPanel"
                >
                  <UIcon name="i-lucide-log-in" class="size-3.5" />
                  Not logged in
                </button>
              </div>
            </div>

            <div class="history-panel-header-extra">
              <p v-if="exportError" class="mt-2 text-sm font-medium text-red-600 dark:text-red-300" aria-live="assertive">
                {{ exportError }}
              </p>
              <p
                v-if="exportNotice"
                class="mt-2 flex items-start gap-2 rounded-2xl border px-3 py-2 text-xs leading-5"
                :class="isPro
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100'
                  : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100'"
                aria-live="polite"
              >
                <UIcon
                  :name="isPro ? 'i-lucide-circle-check' : 'i-lucide-crown'"
                  class="mt-0.5 size-3.5 shrink-0"
                  :class="isPro ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'"
                />
                <span>
                  {{ exportNotice }}
                  <NuxtLink
                    v-if="!isPro"
                    to="/upgrade"
                    data-history-interactive
                    class="font-bold underline decoration-amber-600/60 underline-offset-2 hover:text-amber-800 dark:decoration-amber-300/60 dark:hover:text-amber-50"
                  >
                    Get Pro now
                  </NuxtLink>
                </span>
              </p>

              <div
                v-if="highlightedSubmissionNotice && highlightedSubmissionNotice.source === 'Family'"
                class="mt-3 flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-primary/5 px-3 py-2.5 dark:border-primary/40 dark:bg-primary/10"
              >
                <span class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary">
                  <UIcon name="i-lucide-message-square-text" class="size-3.5" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-[0.875rem] font-bold text-highlighted">
                    New family observation
                  </p>
                  <p class="mt-0.5 truncate text-xs font-semibold text-toned">
                    {{ highlightedSubmissionNotice.title }}
                  </p>
                  <p class="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-primary">
                    {{ highlightedSubmissionNotice.condition }} · {{ highlightedSubmissionNotice.timeLabel }}
                  </p>
                </div>
              </div>
            </div>

            <div
              class="history-panel-tabs mt-4 rounded-full bg-muted p-1"
              role="tablist"
              aria-label="History sections"
              @click.stop
              @touchstart.passive="handleHistoryTabSwipeStart"
              @touchend="handleHistoryTabSwipeEnd"
            >
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="tab in historyTabs"
                  :key="tab"
                  type="button"
                  data-history-interactive
                  role="tab"
                  class="relative rounded-full px-4 py-3 text-sm font-semibold transition"
                  :class="activeHistoryTab === tab ? 'bg-elevated text-highlighted shadow-sm' : 'text-muted'"
                  :aria-selected="activeHistoryTab === tab"
                  @click.stop="selectHistoryTab(tab)"
                >
                  {{ tab }}
                </button>
              </div>
            </div>
          </div>

          <div
            ref="historyScrollEl"
            class="history-panel-scroll min-h-0 flex-1 overscroll-contain bg-elevated pb-2 pt-3 custom-scrollbar"
            :class="[
              isMobileLayout ? 'px-3' : 'px-4',
              historyExpanded ? 'overflow-y-auto' : 'overflow-hidden touch-pan-y'
            ]"
            @scroll="handleHistoryScroll"
            @wheel="handleHistoryWheel"
          >
            <div v-if="activeHistoryTab === 'Entries'" class="divide-y divide-default">
              <div v-if="!user && !isAuthLoading && !isDemoMode" class="py-8 text-center">
                <p class="font-bold text-highlighted">Sign in to save entries</p>
                <p class="mt-1 text-sm text-toned">
                  Your symptom logs sync to your account once you sign in.
                </p>
                <button
                  type="button"
                  data-history-interactive
                  class="mt-4 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                  @click="toggleAuthPanel"
                >
                  Sign in
                </button>
              </div>
              <div v-else-if="isLoadingEntries" class="py-8 text-center text-sm text-muted">
                {{ loadingEntriesMessage }}
              </div>
              <div v-else-if="entriesError" class="py-8 text-center text-sm text-red-600 dark:text-red-300">
                {{ entriesError }}
              </div>
              <div v-else-if="!historyEntries.length" class="py-8 text-center">
                <p class="font-bold text-highlighted">No entries yet</p>
                <p class="mt-1 text-sm text-toned">Tap a condition or use search to create your first log.</p>
              </div>
              <article
                v-for="entry in historyEntries"
                :key="entry.id"
                :data-entry-id="entry.id"
                data-history-interactive
                class="cursor-pointer rounded-2xl px-2 py-3 transition duration-500 hover:bg-accented/30 active:bg-accented/50"
                :class="highlightedSubmissionId === entry.id
                  ? 'submission-flash bg-primary/10 ring-2 ring-primary/35 shadow-lg shadow-black/10 dark:bg-primary/15 dark:ring-primary/50 dark:shadow-black/20'
                  : ''"
                role="button"
                tabindex="0"
                :aria-label="`View ${entry.title}`"
                @click="openEntryDetailsOverlay(entry.id)"
                @keydown.enter.prevent="openEntryDetailsOverlay(entry.id)"
                @keydown.space.prevent="openEntryDetailsOverlay(entry.id)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="grid size-16 shrink-0 place-items-center rounded-2xl text-center text-muted transition hover:bg-accented/40"
                    aria-hidden="true"
                  >
                    <div>
                      <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">{{ entry.month }}</p>
                      <p class="text-xl font-bold leading-none text-highlighted">{{ entry.day }}</p>
                    </div>
                  </div>

                  <div class="min-w-0 flex-1 text-left">
                    <div class="flex flex-wrap items-center gap-2">
                      <UBadge color="neutral" variant="soft" size="md">{{ entry.condition }}</UBadge>
                      <UBadge :color="entry.source === 'Family' ? 'info' : 'primary'" variant="soft" size="md">
                        {{ entry.source }}
                      </UBadge>
                      <UBadge v-if="entry.wasEdited" color="warning" variant="soft" size="md">
                        Edited
                      </UBadge>
                    </div>

                    <h3 class="mt-2 truncate text-base font-bold text-highlighted">{{ entry.title }}</h3>
                    <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                      <span class="inline-flex items-center gap-1">
                        <UIcon name="i-lucide-clock-3" class="size-3.5" />
                        {{ entry.time }}
                      </span>
                      <span class="text-dimmed">•</span>
                      <span>Severity {{ entry.severity }}/10</span>
                      <span class="text-dimmed">•</span>
                      <span>{{ entry.summary }}</span>
                    </div>
                    <p v-if="entry.editedLabel" class="mt-1 text-xs text-muted">
                      {{ entry.editedLabel }}
                    </p>
                  </div>

                  <button
                    type="button"
                    data-history-interactive
                    class="grid size-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-accented/40 hover:text-highlighted"
                    :aria-label="`Edit ${entry.title}`"
                    @click.stop="requestEntryEdit(entry.id)"
                  >
                    <UIcon name="i-lucide-pencil" class="size-4" />
                  </button>

                  <button
                    type="button"
                    data-history-interactive
                    class="grid size-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    :aria-label="`Delete ${entry.title}`"
                    @click.stop="requestDeleteEntry(entry.id)"
                  >
                    <UIcon name="i-lucide-trash-2" class="size-4" />
                  </button>
                </div>
              </article>
            </div>

            <div
              v-else-if="activeHistoryTab === 'Calendar'"
              class="py-1"
            >
              <SymptomCalendar
                v-model="historyCalendarDate"
                v-model:placeholder="historyCalendarPlaceholder"
                :has-logged-entry-on-day="hasLoggedEntryOnDay"
                :get-calendar-day-display="getCalendarDayDisplay"
                :get-logged-day-severity-title="getLoggedDaySeverityTitle"
                @update:model-value="onHistoryCalendarDateUpdate"
                @update:placeholder="onHistoryCalendarPlaceholderUpdate"
              />

              <div class="mt-4 rounded-3xl border border-default bg-muted/40 px-4 py-3">
                <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  {{ selectedHistoryDayLabel }}
                </p>
                <div v-if="selectedHistoryDayEntries.length" class="mt-2 space-y-2">
                  <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                    <span>{{ selectedHistoryDayEntries.length }} {{ selectedHistoryDayEntries.length === 1 ? 'log' : 'logs' }}</span>
                    <span>Peak severity {{ selectedHistoryDayPeakSeverity }}/10</span>
                    <span v-if="selectedHistoryDaySeverityRange">{{ selectedHistoryDaySeverityRange }}</span>
                  </div>
                  <div class="space-y-2">
                    <button
                      v-for="entry in selectedHistoryDayPreviewEntries"
                      :key="`history-day-${entry.id}`"
                      type="button"
                      data-history-interactive
                      class="w-full rounded-2xl bg-elevated px-3 py-2 text-left text-sm ring-1 ring-default transition hover:bg-accented/30"
                      @click="openEntryDetailsOverlay(entry.id)"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <p class="min-w-0 truncate font-bold text-highlighted">
                          {{ entry.title }}
                        </p>
                        <span class="shrink-0 text-xs font-semibold text-muted">
                          {{ entry.time }} · {{ entry.severity }}/10
                        </span>
                      </div>
                      <p class="mt-1 truncate text-xs text-muted">
                        {{ entry.condition }} · {{ entry.summary }}
                      </p>
                    </button>
                  </div>
                  <p
                    v-if="selectedHistoryDayExtraCount > 0"
                    class="text-xs font-semibold text-muted"
                  >
                    +{{ selectedHistoryDayExtraCount }} more {{ selectedHistoryDayExtraCount === 1 ? 'log' : 'logs' }} that day
                  </p>
                </div>
                <p v-else class="mt-2 text-sm text-muted">
                  No logs recorded for this day.
                </p>
              </div>

              <LoggingActivityReport :metrics="loggingActivityMetrics" />
            </div>

            <div class="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pb-1 text-xs font-semibold text-muted">
              <NuxtLink to="/install" data-history-interactive class="hover:text-highlighted">Install</NuxtLink>
              <a
                href="mailto:support@veteranscentralhub.com?subject=Accessibility%20help%20with%20VCH"
                data-history-interactive
                class="hover:text-highlighted"
              >
                Accessibility/help
              </a>
              <NuxtLink to="/privacy" data-history-interactive class="hover:text-highlighted">Privacy</NuxtLink>
              <NuxtLink to="/disclaimer" data-history-interactive class="hover:text-highlighted">Disclaimer</NuxtLink>
            </div>
          </div>
        </section>
      </div>
          </Transition>
        </div>
      </div>
    </section>

    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <div
        v-if="isEmbeddedPreview && isEmbedProfileOpen"
        class="absolute inset-0 z-[110] flex min-h-0 flex-col overflow-hidden bg-default"
      >
        <ProfilePage />
      </div>
    </Transition>

    <SubmissionToast v-if="isEmbeddedPreview" embedded />
  </main>

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="pendingDeleteDraft"
      backdrop-class="bg-black/55"
      @dismiss="cancelDeleteEntryDraft"
    >
      <div class="app-overlay-panel app-overlay-panel--compact rounded-[1.75rem] bg-elevated p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-draft-title">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Draft
        </p>
        <h3 id="delete-draft-title" class="mt-2 text-xl font-bold text-highlighted">
          Delete this draft?
        </h3>
        <p class="mt-3 text-sm leading-6 text-toned">
          <span class="font-semibold text-highlighted">{{ entryDraftPreview?.title || 'Symptom log' }}</span>
          will be permanently removed. This cannot be undone.
        </p>

        <div class="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            class="rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented"
            @click="cancelDeleteEntryDraft"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            @click="confirmDeleteEntryDraft"
          >
            Delete draft
          </button>
        </div>
      </div>
    </AppOverlayShell>
  </Transition>

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="viewedHistoryEntry && viewedHistoryRawEntry"
      :z-index="120"
      @dismiss="closeEntryDetailsOverlay"
    >
      <div class="app-overlay-panel app-overlay-panel--stack app-overlay-panel--lg overflow-hidden rounded-[1.75rem] border border-default bg-elevated shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="log-details-title">
        <div class="flex items-start justify-between gap-4 border-b border-default px-5 py-4">
          <div class="min-w-0">
            <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <UIcon name="i-lucide-eye" class="size-4" />
              Log details
            </p>
            <h3 id="log-details-title" class="mt-2 truncate text-xl font-bold text-highlighted">
              {{ viewedHistoryEntry.title }}
            </h3>
            <p v-if="viewedHistoryEntryTimestamp" class="mt-1 text-sm font-medium text-muted">
              {{ viewedHistoryEntryTimestamp }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="grid size-10 place-items-center rounded-full text-muted transition hover:bg-accented/40 hover:text-highlighted"
              :aria-label="`Edit ${viewedHistoryEntry.title}`"
              @click="editViewedHistoryEntry"
            >
              <UIcon name="i-lucide-pencil" class="size-4" />
            </button>
            <button
              type="button"
              class="grid size-10 place-items-center rounded-full text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:text-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"
              :aria-label="`Delete ${viewedHistoryEntry.title}`"
              @click="deleteViewedHistoryEntry"
            >
              <UIcon name="i-lucide-trash-2" class="size-4" />
            </button>
            <button
              type="button"
              class="grid size-10 place-items-center rounded-full text-muted transition hover:bg-accented/40 hover:text-highlighted"
              aria-label="Close log details"
              @click="closeEntryDetailsOverlay"
            >
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
        </div>

        <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="neutral" variant="soft" size="md">{{ viewedHistoryEntry.condition }}</UBadge>
            <UBadge :color="viewedHistoryEntry.source === 'Family' ? 'info' : 'primary'" variant="soft" size="md">
              {{ viewedHistoryEntry.source }}
            </UBadge>
            <UBadge color="warning" variant="soft" size="md">
              Severity {{ viewedHistoryEntry.severity }}/10
            </UBadge>
            <UBadge v-if="viewedHistoryEntry.wasEdited" color="warning" variant="soft" size="md">
              Edited
            </UBadge>
          </div>

          <div class="mt-5 space-y-4">
            <section class="rounded-2xl bg-muted/40 px-4 py-3">
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">What happened</p>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-highlighted">
                {{ viewedHistoryRawEntry.summary || viewedHistoryEntry.title }}
              </p>
            </section>

            <section class="rounded-2xl bg-muted/40 px-4 py-3">
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">Daily impact</p>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-highlighted">
                {{ viewedHistoryRawEntry.impact || 'No impact note added' }}
              </p>
            </section>

            <section v-if="viewedHistoryEntryDetails.length" class="space-y-2">
              <div
                v-for="detail in viewedHistoryEntryDetails"
                :key="detail.label"
                class="rounded-2xl bg-muted/40 px-4 py-3"
              >
                <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">{{ detail.label }}</p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-highlighted">{{ detail.value }}</p>
              </div>
            </section>

            <p v-if="viewedHistoryEntry.editedLabel" class="text-xs font-medium text-muted">
              {{ viewedHistoryEntry.editedLabel }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 border-t border-default px-5 py-4">
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
            @click="closeEntryDetailsOverlay"
          >
            Close
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
            @click="editViewedHistoryEntry"
          >
            <UIcon name="i-lucide-pencil" class="size-4" />
            Edit log
          </button>
        </div>
      </div>
    </AppOverlayShell>
  </Transition>

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="pendingDelete"
      backdrop-class="bg-black/55"
      @dismiss="cancelDeleteEntry"
    >
      <div class="app-overlay-panel app-overlay-panel--compact rounded-[1.75rem] bg-elevated p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-entry-title">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Move to deleted
        </p>
        <h3 id="delete-entry-title" class="mt-2 text-xl font-bold text-highlighted">
          Delete this entry?
        </h3>
        <p class="mt-3 text-sm leading-6 text-toned">
          <span class="font-semibold text-highlighted">{{ pendingDelete.title }}</span>
          will move to Deleted in your account settings. You can restore it later from there.
        </p>

        <div class="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            class="rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented"
            @click="cancelDeleteEntry"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            @click="confirmDeleteEntry"
          >
            Move to Deleted
          </button>
        </div>
      </div>
    </AppOverlayShell>
  </Transition>

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="isEditHistoryNoticeOpen"
      backdrop-class="bg-black/55"
      @dismiss="closeEditHistoryNotice"
    >
      <div class="app-overlay-panel app-overlay-panel--compact rounded-[1.75rem] bg-elevated p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="edit-history-notice-title">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Editing logs
        </p>
        <h3 id="edit-history-notice-title" class="mt-2 text-xl font-bold text-highlighted">
          Full history mode is on
        </h3>
        <p class="mt-3 text-sm leading-6 text-toned">
          Signed PDF exports show crossed-out previous text plus your latest version so reviewers can see corrections clearly.
        </p>
        <p class="mt-3 text-sm leading-6 text-toned">
          Each log can be edited up to
          <span class="font-semibold text-highlighted">3 times</span>.
          After that, log a new entry for additional changes.
        </p>
        <p
          v-if="pendingEditRemainingEdits() < MAX_ENTRY_EDITS"
          class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
        >
          This log has {{ pendingEditRemainingEdits() }} edit{{ pendingEditRemainingEdits() === 1 ? '' : 's' }} remaining.
        </p>

        <button
          type="button"
          class="mt-5 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          @click="confirmEditHistoryNotice"
        >
          I understand
        </button>
      </div>
    </AppOverlayShell>
  </Transition>

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="isEntryEditLockedOpen"
      backdrop-class="bg-black/55"
      @dismiss="closeEntryEditLockedOverlay"
    >
      <div class="app-overlay-panel app-overlay-panel--compact rounded-[1.75rem] bg-elevated p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="entry-edit-locked-title">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Edit limit reached
        </p>
        <h3 id="entry-edit-locked-title" class="mt-2 text-xl font-bold text-highlighted">
          No more edits for this log
        </h3>
        <p class="mt-3 text-sm leading-6 text-toned">
          This entry has already been edited 3 times. Log a new entry if you need to record additional detail.
        </p>

        <button
          type="button"
          class="mt-5 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          @click="closeEntryEditLockedOverlay"
        >
          OK
        </button>
      </div>
    </AppOverlayShell>
  </Transition>

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="isShareLinkOpen && shareLinkEntry"
      backdrop-class="bg-black/55"
      @dismiss="closeShareLinkModal"
    >
      <div class="app-overlay-panel app-overlay-panel--compact rounded-[1.75rem] bg-elevated p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="share-entry-title">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Private supporter link
        </p>
        <h3 id="share-entry-title" class="mt-2 text-xl font-bold text-highlighted">
          Share this entry
        </h3>
        <p class="mt-3 text-sm leading-6 text-toned">
          Create a one-time private URL for someone you trust to report what they observed about
          <span class="font-semibold text-highlighted">{{ shareLinkEntry.summary || shareLinkEntry.condition_label }}</span>.
        </p>

        <div v-if="!shareLinkCreatedUrl" class="mt-5 space-y-4">
          <label class="block">
            <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Link label (optional)</span>
            <input
              v-model="shareLinkLabel"
              type="text"
              class="w-full rounded-2xl border border-default bg-muted px-4 py-3 text-base font-medium text-highlighted outline-none placeholder:text-dimmed focus:border-primary"
              placeholder="Example: Spouse, caregiver"
            >
          </label>

          <div class="rounded-2xl border border-default bg-muted/40 px-4 py-3">
            <p class="text-xs font-bold uppercase tracking-[0.12em] text-muted">Visible condition</p>
            <p class="mt-1 font-semibold text-highlighted">{{ shareLinkEntry.condition_label }}</p>
          </div>

          <button
            type="button"
            class="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
            :disabled="isCreatingShareLink"
            @click="createShareLinkForEntry"
          >
            {{ isCreatingShareLink ? 'Creating...' : 'Create private link' }}
          </button>
        </div>

        <div v-else class="mt-5 space-y-4">
          <p class="break-all rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            {{ shareLinkCreatedUrl }}
          </p>
          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
            @click="copyShareLink"
          >
            <UIcon :name="shareLinkCopied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-4" />
            {{ shareLinkCopied ? 'Copied to clipboard' : 'Copy link' }}
          </button>
        </div>

        <p v-if="shareLinkError" class="mt-4 text-center text-sm font-medium text-red-600 dark:text-red-300" aria-live="assertive">{{ shareLinkError }}</p>

        <button
          type="button"
          class="mt-4 w-full rounded-2xl px-4 py-2 text-sm font-semibold text-muted"
          @click="closeShareLinkModal"
        >
          Close
        </button>
      </div>
    </AppOverlayShell>
  </Transition>

  <AppWelcomeCarousel
    v-if="needsAppWelcome"
    :install-platform="installPlatform"
    :install-instruction-text="installInstructionText"
    :install-guide-video-url="installGuideVideoUrl"
    :can-prompt-install="canPromptInstall"
    @complete="handleWelcomeComplete"
    @prompt-install="promptInstall"
  />

  <LoggingCadencePrompt
    :open="isLoggingCadencePromptOpen"
    :caution="weeklyLogCaution"
    @close="closeLoggingCadencePrompt"
    @continue="confirmLoggingCadencePrompt"
  />

  <UpgradePromptModal
    :open="isUpgradePromptOpen"
    :title="upgradePromptTitle"
    :description="upgradePromptDescription"
    :is-checkout-loading="isUpgradeCheckoutLoading"
    @close="closeUpgradePrompt"
    @upgrade="handleUpgradeCheckout"
  />

  <HomeTipsOverlay
    :open="isHomeTipsOverlayOpen"
    :tips="homeVisitTips"
    @close="isHomeTipsOverlayOpen = false"
  />

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="isConditionSlotOpen"
      @dismiss="closeConditionSlotModal"
    >
      <div class="app-overlay-panel app-overlay-panel--compact rounded-[1.75rem] border border-default bg-elevated p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="condition-slot-title">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">Free plan</p>
        <h3 id="condition-slot-title" class="mt-2 text-xl font-bold text-white">
          {{ pendingConditionSlotMode === 'replace' ? 'Switch to' : 'Use' }} {{ pendingConditionSlotLabel }}?
        </h3>
        <p class="mt-3 text-sm leading-6 text-toned">
          <template v-if="pendingConditionSlotMode === 'replace'">
            <span v-if="pendingConditionSlotLoggedEntryCount === 0">
              You have not logged anything yet, so you can change your free condition to this one.
            </span>
            <span v-else>
              You have already logged entries on your free plan, so you cannot switch conditions without upgrading.
            </span>
          </template>
          <template v-else>
            Free includes {{ FREE_CONDITION_LIMIT }} conditions with unlimited entries in each.
            <span v-if="freeConditionSlotsRemaining === FREE_CONDITION_LIMIT">Pick one condition to start.</span>
            <span v-else-if="freeConditionSlotsRemaining === 1">This will use your free condition slot.</span>
            <span v-else>Your free condition slot is already used.</span>
          </template>
        </p>
        <p v-if="freeConditionKeys.length" class="mt-3 text-xs leading-5 text-muted">
          Current: {{ freeConditionLabels.join(', ') || 'None yet' }}
        </p>
        <p v-if="conditionSlotError" class="mt-3 text-sm font-medium text-red-300" aria-live="assertive">{{ conditionSlotError }}</p>
        <div class="mt-5 grid gap-3">
          <button
            type="button"
            class="w-full rounded-2xl bg-primary px-4 py-4 text-base font-bold text-white transition hover:opacity-90"
            :disabled="isConfirmingConditionSlot || (pendingConditionSlotMode === 'replace' && pendingConditionSlotLoggedEntryCount > 0)"
            @click="confirmConditionSlot"
          >
            {{ isConfirmingConditionSlot ? 'Saving...' : pendingConditionSlotMode === 'replace' ? `Switch to ${pendingConditionSlotLabel}` : `Use ${pendingConditionSlotLabel}` }}
          </button>
          <button
            type="button"
            class="w-full rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted ring-1 ring-default"
            @click="closeConditionSlotModal"
          >
            Cancel
          </button>
        </div>
      </div>
    </AppOverlayShell>
  </Transition>

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="isPdfExportOverlayOpen"
      :z-index="120"
      @dismiss="closePdfExportOverlay"
    >
      <div
        class="app-overlay-panel app-overlay-panel--stack app-overlay-panel--lg overflow-hidden rounded-[1.75rem] border border-default bg-elevated shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-export-title"
      >
        <div class="flex items-start justify-between gap-4 border-b border-default px-5 py-4">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Export
            </p>
            <h3 id="pdf-export-title" class="mt-2 text-xl font-bold text-highlighted">
              Download PDF
            </h3>
            <p class="mt-1 text-sm text-muted">
              Choose report type, conditions, and download options.
            </p>
          </div>
          <button
            type="button"
            class="grid size-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-accented/40 hover:text-highlighted"
            aria-label="Close download options"
            @click="closePdfExportOverlay"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div v-if="!user && !isAuthLoading" class="py-8 text-center">
            <p class="font-bold text-highlighted">Sign in to export</p>
            <p class="mt-1 text-sm text-toned">
              Your symptom logs need to be saved to your account before you can download a PDF.
            </p>
          </div>

          <div v-else-if="!exportableConditions.length" class="py-8 text-center">
            <p class="font-bold text-highlighted">Nothing to export yet</p>
            <p class="mt-1 text-sm text-toned">
              Log at least one symptom entry, then come back here to build your PDF.
            </p>
          </div>

          <template v-else>
          <div class="rounded-full bg-muted p-1">
            <div class="grid grid-cols-2 gap-1">
              <button
                type="button"
                class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
                :class="pdfExportType === 'full'
                  ? 'bg-elevated text-highlighted shadow-sm'
                  : 'text-muted'"
                @click="pdfExportType = 'full'"
              >
                Full report
              </button>
              <button
                type="button"
                class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
                :class="pdfExportType === 'cp-exam'
                  ? 'bg-elevated text-highlighted shadow-sm'
                  : 'text-muted'"
                @click="pdfExportType = 'cp-exam'"
              >
                Personal review
              </button>
            </div>
          </div>

          <p class="mt-3 text-xs leading-5 text-muted">
            {{ pdfExportDescription }}
          </p>

          <div v-if="pdfExportType === 'full'" class="mt-4 space-y-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Report content
              </p>
              <div class="mt-2 rounded-full bg-muted p-1">
                <div class="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
                    :class="pdfExportContentMode === 'charts'
                      ? 'bg-elevated text-highlighted shadow-sm'
                      : 'text-muted'"
                    @click="pdfExportContentMode = 'charts'"
                  >
                    Charts + entries
                  </button>
                  <button
                    type="button"
                    class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
                    :class="pdfExportContentMode === 'entries-only'
                      ? 'bg-elevated text-highlighted shadow-sm'
                      : 'text-muted'"
                    @click="pdfExportContentMode = 'entries-only'"
                  >
                    Entries only
                  </button>
                </div>
              </div>
              <p class="mt-2 text-xs leading-5 text-muted">
                {{ pdfExportContentDescription }}
              </p>
            </div>

            <label
              v-if="exportSelectedFamilyEntryCount"
              class="flex items-start gap-3 rounded-2xl border border-default bg-muted/40 px-4 py-4"
            >
              <input
                v-model="pdfExportSeparateFamily"
                type="checkbox"
                class="mt-0.5 size-4 rounded border-default text-highlighted focus:ring-primary"
              >
              <span class="text-xs leading-5 text-toned">
                <span class="font-semibold text-highlighted">Download family and friend reports separately</span>
                <span class="mt-1 block">
                  Family and friend observations can be powerful evidence. Submitting them in a separate PDF makes it harder for raters to miss them.
                  You will get two files: your logs and a family observations report.
                </span>
              </span>
            </label>
          </div>

          <div class="mt-5 flex items-center justify-between gap-3">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Conditions
            </p>
            <button
              type="button"
              class="text-xs font-semibold text-primary transition hover:opacity-90"
              @click="toggleAllExportConditions"
            >
              {{ allExportConditionsSelected ? 'Clear all' : 'Select all' }}
            </button>
          </div>

          <div class="mt-2 space-y-2">
            <label
              v-for="condition in exportableConditions"
              :key="condition.key"
              class="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 transition"
              :class="isExportConditionSelected(condition.key)
                ? 'bg-muted/80'
                : 'bg-transparent'"
            >
              <input
                type="checkbox"
                class="size-4 shrink-0 rounded border-default text-highlighted focus:ring-primary"
                :checked="isExportConditionSelected(condition.key)"
                @change="toggleExportCondition(condition.key)"
              >
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold text-highlighted">{{ condition.label }}</span>
                <span class="mt-0.5 block text-xs text-muted">
                  {{ condition.entryCount }} {{ condition.entryCount === 1 ? 'entry' : 'entries' }}
                </span>
              </span>
            </label>
          </div>

          <p
            v-if="!selectedExportConditionKeys.length"
            class="mt-3 text-xs font-medium text-amber-700 dark:text-amber-200"
          >
            Select at least one condition to include in the PDF.
          </p>

          <label
            v-if="pdfExportType === 'full'"
            class="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/60 dark:bg-amber-950/30"
          >
            <input
              v-model="pdfExportAcknowledged"
              type="checkbox"
              class="mt-0.5 size-4 rounded border-default text-highlighted focus:ring-primary"
            >
            <span class="text-xs leading-5 text-amber-950 dark:text-amber-100">
              {{ PDF_EXPORT_ACKNOWLEDGMENT_LABEL }}
            </span>
          </label>

          <p v-if="exportError" class="mt-4 text-sm font-medium text-red-600 dark:text-red-300" aria-live="assertive">
            {{ exportError }}
          </p>

          <p
            v-if="pdfExportDownloadStarted && exportNotice"
            class="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
            aria-live="polite"
          >
            <UIcon name="i-lucide-circle-check" class="mt-0.5 size-4 shrink-0" />
            <span>{{ exportNotice }}</span>
          </p>
          </template>
        </div>

        <div class="border-t border-default px-5 py-4">
          <button
            v-if="!user && !isAuthLoading"
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-bold text-white transition hover:opacity-90"
            @click="closePdfExportOverlay(); toggleAuthPanel()"
          >
            Sign in to export
          </button>
          <button
            v-else-if="exportableConditions.length"
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold transition disabled:opacity-40"
            :class="pdfExportDownloadStarted
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400'
              : 'bg-primary text-white hover:opacity-90'"
            :disabled="!canConfirmPdfExport"
            @click="runPdfExport"
          >
            <UIcon
              :name="pdfExportDownloadStarted ? 'i-lucide-folder-down' : 'i-lucide-download'"
              class="size-4"
            />
            {{ exportButtonLabel }}
          </button>
        </div>
      </div>
    </AppOverlayShell>
  </Transition>

</template>

<script setup lang="ts">
import { useSupabaseAuth } from '../composables/useSupabaseAuth'
import { usePasskeys } from '../composables/usePasskeys'
import { clearOAuthFlowMarker } from '../composables/useAuthEmailLink'
import { useSymptomEntries } from '../composables/useSymptomEntries'
import { useSymptomPdfExport } from '../composables/useSymptomPdfExport'
import { useDeletedEntryArchive } from '../composables/useDeletedEntryArchive'
import { useUserProfiles } from '../composables/useUserProfiles'
import { useEntitlements } from '../composables/useEntitlements'
import { useAppWelcome } from '../composables/useAppWelcome'
import { useTimedPasswordReveal } from '../composables/useTimedPasswordReveal'
import { FREE_CONDITION_LIMIT, PRO_ANNUAL_PRICE_LABEL, formatConditionKeyLabel, conditionKeyFromLabel } from '../utils/subscription'
import {
  CLAIMBUILDER_ACTION,
  LAY_REPORTING_ACTION,
  SUBMISSIONS_INBOX_ACTION,
  TRACKER_TOOLTIP
} from '../utils/trackerToolbarUi'
import { buildClaimBuilderUrl } from '../utils/claimBuilderLinks'
import { mapEntryHistoryItem } from '../utils/entryDisplay'
import {
  getRemainingEntryEdits,
  groupRevisionsByEntryId,
  isEntryEditLocked,
  MAX_ENTRY_EDITS
} from '../utils/entryEditHistory'
import {
  acknowledgeEditHistoryNotice,
  hasAcknowledgedEditHistoryNotice
} from '../utils/editHistoryNotice'
import {
  buildSymptomEntrySavePayload,
  buildSymptomEntrySavePayloadFromRecord,
  symptomEntrySavePayloadsEqual,
  type SymptomEntrySavePayload
} from '../utils/symptomEntrySavePayload'
import { copyToClipboard } from '../utils/copyToClipboard'
import { AUTH_NOTICES, authNoticeToast, authSuccessToast, handleAuthApiFailure, resolveAuthApiErrorMessage, validateSignupForm, AUTH_VALIDATION, authErrorToast, isEmailConfirmationNotice } from '../utils/authNotices'
import { PDF_EXPORT_ACKNOWLEDGMENT_LABEL } from '../utils/pdfExportCertification'
import {
  calendarDateToDateString,
  clampTime24ToMax,
  coerceCalendarDate,
  dateStringToCalendarDate,
  formatEntryDateTimePreview,
  formatPartsToTime24,
  getMaxEntryDateTimeLocal,
  getMaxEntryTimeLocal,
  getTodayCalendarDate,
  isFutureEntryDateTime,
  parseTime24ToParts,
  splitEntryDateTimeLocal,
  toLocalDateTimeInputValue
} from '../utils/symptomDateTime'
import {
  getEntryFieldPresets,
  getValuesFromLastEntry,
  isAppendPresetField,
  isMultiSelectPresetField,
  mergeEntryFieldPresets,
  toggleEntryFieldPresetValue
} from '../utils/entryFieldPresets'
import {
  rememberMedicationsFromEntry
} from '../utils/entryMedications'
import {
  buildDefaultEntryFields,
  entryFieldsByCondition,
  getEntryFieldsForSearchCondition,
  isEpisodeDurationField,
  isEpisodeFollowUpField,
  isMedicationsStepField,
  resolveEntryTemplateKeyForCondition,
  type EntryFieldDef
} from '../utils/vaConditionFields'
import { androidAddToHomeScreenVideoUrl, iosAddToHomeScreenVideoUrl } from '../utils/installGuide'
import { filterAndRankConditions } from '../utils/conditionSearch'
import { getWeeklyLogCaution, type WeeklyLogCaution } from '../utils/loggingCadence'
import { buildLoggingActivityMetrics } from '../utils/loggingActivityReport'
import { buildSymptomDashboardMetrics } from '../utils/symptomDashboard'
import { buildConditionPickerOptions, buildCustomConditionLabelsFromEntries, buildHomeVisitTips, conditionCatalog, getCatalogConditionByKey, isCustomTrackedConditionKey, isMentalHealthConditionKey, listMentalHealthConditionKeys, MENTAL_HEALTH_ONE_CONDITION_MESSAGE, normalizeConditionLabel, pickRandomHomeVisitTip, resolveCatalogConditionByStoredKey, resolveTrackedConditionByStoredKey, resolveTrackedConditionKey, VA_CRISIS_LINE_SHORT, type HomeVisitTip } from '../utils/conditionCatalog'
import { LOG_REMINDER_TEST_INTERVAL_MS, LOG_REMINDER_TEST_MODE } from '../utils/logReminders'
import { conditionImageAssets } from '../utils/conditionImages'
import { getSeverityEmoji } from '../utils/severityGuidance'
import { CalendarDate } from '@internationalized/date'
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue'
import {
  buildEntryDraftSnapshot,
  clearEntryDraft,
  formatEntryDraftTimeLabel,
  isMeaningfulEntryDraft,
  readEntryDraft,
  writeEntryDraft,
  type EntryDraftSnapshot
} from '../composables/useEntryDraft'
import { useTrackerLayout, TRACKER_CLOSE_EMBED_PROFILE_KEY, TRACKER_DEMO_ACTIONS_KEY, TRACKER_DEMO_CONTROL_KEY, TRACKER_DEMO_KEY } from '../composables/useTrackerLayout'
import { useTrackerDemoScript, type TrackerDemoActions } from '../composables/useTrackerDemoScript'
import { trackerDemoFieldDefaults, trackerDemoTiming } from '../utils/trackerDemoConfig'
import { useAppOverlayHistoryInset } from '../composables/useAppOverlayHistoryInset'
import ProfilePage from './profile.vue'
import TrackerDesktopWorkspace from '../components/tracker/TrackerDesktopWorkspace.vue'
import TrackerDesktopCenter from '../components/tracker/TrackerDesktopCenter.vue'
import TrackerDesktopHistory from '../components/tracker/TrackerDesktopHistory.vue'
import TrackerEntryFlow from '../components/tracker/TrackerEntryFlow.vue'
import TrackerAccountMenu from '../components/TrackerAccountMenu.vue'
import { useTrackerAuthPrompt } from '../composables/useTrackerAuthPrompt'
import { useTrackerSettingsPanelOpen } from '../composables/useTrackerSettingsPanelOpen'
import { useHomeWorkspaceReady } from '../composables/useHomeWorkspaceReady'

const {
  user,
  isAuthLoading,
  authError,
  signIn,
  signUp,
  resendConfirmationEmail,
  signInWithGoogle,
  sendPasswordReset,
  signOut
} = useSupabaseAuth()
const { isPasskeySupported, signInWithPasskey } = usePasskeys()
const router = useRouter()
const route = useRoute()
const { getProfile } = useUserProfiles()
const {
  isPro,
  freeConditionKeys,
  freeConditionSlotsRemaining,
  canUseFamilyReporting,
  canTrackCondition,
  canAddFreeCondition,
  addFreeCondition,
  canReplaceFreeCondition,
  replaceFreeCondition,
  entitlementsLoaded,
  loadEntitlements
} = useEntitlements()
const {
  needsAppWelcome,
  loggingCadence,
  weeklyLogDay,
  loadAppWelcomeState,
  completeAppWelcome
} = useAppWelcome()
const {
  trackedConditionKeys,
  needsOnboarding,
  hasLoadedTrackedConditions,
  isLoading: isLoadingTrackedConditions,
  loadError: trackedConditionsLoadError,
  loadTrackedConditions,
  resetTrackedConditionsLoadState,
  completeOnboarding,
  updateTrackedConditions,
  applyLocalState
} = useTrackedConditions()
const { showSubmissionToast } = useSubmissionToast()

const profileDisplayName = useState('home-profile-display-name', () => '')
const homeGreetingWord = useState<'Hello' | 'Hey' | ''>('home-greeting-word', () => '')

type HomeTransitionDirection = 'expand' | 'collapse' | 'previous' | 'next'

const HOME_TRANSITION = {
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  heroMorphEase: 'cubic-bezier(0.32, 0, 0.2, 1)',
  chromeInEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
  // chromeRevealLeadMs: start slide-up before hero morph ends (0 = wait until morph finishes)
  expand: { heroMs: 680, chromeInMs: 720, chromeRevealLeadMs: 0, logDelayMs: 140 },
  collapse: { heroMs: 600, chromeInMs: 620, chromeRevealLeadMs: 0, logDelayMs: 0 }
} as const

function getHomeHeroTransitionMs(direction: 'expand' | 'collapse') {
  return HOME_TRANSITION[direction].heroMs
}

function getHomeSharedTransitionMs(direction: HomeTransitionDirection) {
  return direction === 'collapse'
    ? HOME_TRANSITION.collapse.heroMs
    : HOME_TRANSITION.expand.heroMs
}

function getHomeTransitionStyleVars(direction: HomeTransitionDirection | null) {
  if (direction !== 'expand' && direction !== 'collapse') {
    return {
      '--home-hero-ms': `${HOME_TRANSITION.expand.heroMs}ms`,
      '--home-chrome-in-ms': `${HOME_TRANSITION.expand.chromeInMs}ms`,
      '--home-chrome-in-ease': HOME_TRANSITION.chromeInEase,
      '--home-ui-ms': `${HOME_TRANSITION.collapse.heroMs}ms`,
      '--home-log-ms': `${HOME_TRANSITION.collapse.heroMs}ms`,
      '--home-log-delay-ms': '0ms',
      '--home-ease': HOME_TRANSITION.ease
    }
  }

  const timing = HOME_TRANSITION[direction]

  return {
    '--home-hero-ms': `${timing.heroMs}ms`,
    '--home-chrome-in-ms': `${timing.chromeInMs}ms`,
    '--home-chrome-in-ease': HOME_TRANSITION.chromeInEase,
    '--home-ui-ms': `${timing.heroMs}ms`,
    '--home-log-ms': `${timing.heroMs}ms`,
    '--home-log-delay-ms': `${direction === 'expand' ? timing.logDelayMs : 0}ms`,
    '--home-ease': HOME_TRANSITION.ease
  }
}

const homeTransitionStyleVars = computed(() => {
  if (homeSharedTransitionActive.value) {
    return getHomeTransitionStyleVars(transitionDirection.value)
  }

  return getHomeTransitionStyleVars(null)
})

const homeCarouselStageStyle = computed(() => {
  const style: Record<string, string> = {}

  if (homeChromeBlockHeightPx.value > 0) {
    style['--home-chrome-block-h'] = `${homeChromeBlockHeightPx.value}px`
  }

  if (homeConditionsScrollHeightPx.value > 0) {
    style['--home-conditions-scroll-h'] = `${homeConditionsScrollHeightPx.value}px`
  }

  return style
})

const activeIndex = ref(0)
const homeChromeRetreat = ref(false)
const homeChromeRetreatInstant = ref(false)
const homeHeroTitleRevealed = ref(true)
let homeChromeRevealTimer: ReturnType<typeof setTimeout> | undefined
const homeSharedTransitionActive = ref(false)
let homeSharedTransitionToken = 0
let homeSharedTransitionTimer: ReturnType<typeof setTimeout> | undefined
let homeImageMorphTimer: ReturnType<typeof setTimeout> | undefined
let homeHeroTitleRevealTimer: ReturnType<typeof setTimeout> | undefined
let homeImageMorphFrame: number | undefined
const homeCarouselStageEl = ref<HTMLElement | null>(null)
const homeCarouselHeroEl = ref<HTMLElement | null>(null)
const homeCarouselOverviewEl = ref<HTMLElement | null>(null)
const homeConditionsScrollEl = ref<HTMLElement | null>(null)
const homeOverviewHeaderHeightPx = ref(0)
const homeChromeBlockHeightPx = ref(0)
const homeConditionsScrollHeightPx = ref(0)
let homeConditionsMaxScrollResizeListener: (() => void) | undefined
const homeImageTransitionKey = ref('')
const homeImageTransitionImage = ref('')
const homeImageTransitionAlt = ref('')
const homeImageTransitionStyle = ref<Record<string, string>>({})
const homeConditionImageEls = new Map<string, HTMLImageElement>()
const activeHistoryTab = ref('Entries')
const desktopHistoryShowAll = ref(false)
const desktopCenterTab = ref<'log' | 'charts'>('log')
const desktopChartsShowAllConditions = ref(false)
const suppressHomeMotionOnMount = ref(true)
const isEntryOpen = ref(false)
const isConditionPickerOpen = ref(false)
const customConditionInput = ref('')
const debouncedCustomConditionPreview = ref('')
const { requestSignIn, authPanelOpen: isAuthPanelOpen, setAuthPanelOpen } = useTrackerAuthPrompt()
const pendingAuthPanelOpen = useState('tracker-pending-auth-panel-open', () => false)
const authMode = ref<'login' | 'signup'>('login')
const colorMode = useColorMode()
const googleButtonTheme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')
const authName = ref('')
const authEmail = ref('')
const {
  isEmailCooldownActive,
  resendConfirmationLabel,
  forgotPasswordLabel,
  refreshCooldown
} = useAuthEmailCooldown(authEmail)
const authPassword = ref('')
const authConfirmPassword = ref('')
const signupPasswordReveal = useTimedPasswordReveal()
const authValidationMessage = ref('')
const authPanelNotice = ref<SubmissionToastPayload | null>(null)
let authPanelNoticeTimer: ReturnType<typeof setTimeout> | undefined
const needsEmailConfirmation = ref(false)
const isAuthSubmitting = ref(false)
const hasActiveDraft = ref(false)
const entryDraftPreview = ref<{ title: string, timeLabel: string } | null>(null)
const isRestoringEntryDraft = ref(false)
const entryStep = ref(0)
const editingEntryId = ref<string | null>(null)
const editingEntryConditionLabel = ref<string | null>(null)
const editingEntrySaveSnapshot = ref<SymptomEntrySavePayload | null>(null)
const severityValue = ref(5)
const isEditingEntry = computed(() => Boolean(editingEntryId.value))

const entryForm = ref<Record<string, string>>({})
const isSavingEntry = ref(false)
const entryError = ref('')
const isLoadingEntries = ref(false)
const loadingEntriesMessage = ref('Loading entries...')
const entriesError = ref('')
const savedEntries = ref<any[]>([])
const hasLoadedEntriesOnce = ref(false)
let entriesLoadPromise: Promise<void> | null = null
const homeConditionOrderKeys = ref<string[]>([])
const conditionBrowserListOrder = ref<string[]>([])
const conditionBrowserRef = ref<{ focusCustomConditionInput?: () => void } | null>(null)
const isExportingPdf = ref(false)
const pdfExportDownloadStarted = ref(false)
const exportError = ref('')
const exportNotice = ref('')
const pdfExportType = ref<'full' | 'cp-exam'>('full')
const pdfExportContentMode = ref<'charts' | 'entries-only'>('charts')
const pdfExportSeparateFamily = ref(false)
const isPdfExportOverlayOpen = ref(false)
const selectedExportConditionKeys = ref<string[]>([])
const pdfExportAcknowledged = ref(false)
const transitionDirection = ref<HomeTransitionDirection>('next')
const { installPlatform, canPromptInstall, promptInstall } = usePwaInstall()
const historyExpanded = ref(false)
const historyPanelAnimating = ref(false)
const historyScrollEl = ref<HTMLElement | null>(null)
const desktopHistoryRef = ref<{ scrollEntryIntoView: (entryId: string) => Promise<void> } | null>(null)
const conditionSlideEntryBlocked = ref(false)
let conditionSlideEntryBlockedTimer: ReturnType<typeof setTimeout> | undefined
const homeVisitTip = ref<HomeVisitTip | null>(null)
const homeVisitTipSignature = ref('')
const isHomeTipsOverlayOpen = ref(false)
const homeVisitTips = computed(() => buildHomeVisitTips(homeConditions.value))
const {
  remindersEnabled,
  permissionState: logReminderPermissionState,
  pushBackendConfigured,
  hasRegisteredPushSubscription,
  runLogReminderCheck,
  hydrateReminderSettings,
  persistReminderSettings,
  enableRemindersWithPermission
} = useLogReminders()
const { isDesktopLayout, isMobileLayout, isMobileCarouselLayout, prefersDesktopCarouselChrome, isEmbeddedPreview } = useTrackerLayout()
const { homeWorkspaceReady, markHomeWorkspaceReady, resetHomeWorkspaceReady } = useHomeWorkspaceReady()
const { openSettingsPanel } = useTrackerSettingsPanelOpen()

watch(isDesktopLayout, (desktop) => {
  if (desktop) {
    historyExpanded.value = true
  }
}, { immediate: true })
const isDemoMode = inject(TRACKER_DEMO_KEY, false)
const demoControl = inject(TRACKER_DEMO_CONTROL_KEY, null)
const demoConditionSearch = ref('')
const demoReady = ref(false)
let demoEntryCounter = 0
const isEmbedProfileOpen = ref(false)

const notificationNeedsAttention = computed(() => {
  if (!user.value || logReminderPermissionState.value === 'unsupported') {
    return false
  }

  return !remindersEnabled.value
    || logReminderPermissionState.value !== 'granted'
    || pushBackendConfigured.value === false
    || hasRegisteredPushSubscription.value === false
})

const notificationAttentionLabel = computed(() => {
  if (logReminderPermissionState.value === 'denied') {
    return 'Notifications are blocked. Open profile to enable them.'
  }

  if (pushBackendConfigured.value === false) {
    return 'Notification server setup is missing. Open profile.'
  }

  if (hasRegisteredPushSubscription.value === false) {
    return 'Notifications need setup on this device. Open profile.'
  }

  return 'Notifications are off. Open profile to enable reminders.'
})

const profileButtonRingClass = computed(() => {
  if (!user.value) {
    return 'ring-1 ring-default'
  }

  if (entitlementsLoaded.value && isPro.value) {
    return 'ring-2 ring-amber-400/80 dark:ring-amber-400/70'
  }

  return 'ring-2 ring-primary/35'
})

function closeEmbedProfile() {
  isEmbedProfileOpen.value = false
  isConditionBrowserOpen.value = false
  activeIndex.value = 0
}

function openEmbedProfile() {
  isEmbedProfileOpen.value = true
}

provide(TRACKER_CLOSE_EMBED_PROFILE_KEY, closeEmbedProfile)
const isConditionScrolling = ref(false)
const isSubmissionDropdownOpen = ref(false)
const lastSeenSubmissionAt = ref('')
const highlightedSubmissionId = ref<string | null>(null)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const selectedSearchCondition = ref<null | {
  title: string
  category: string
  description: string
  image: string
}>(null)

const { downloadEntriesPdf, downloadCpExamPdf } = useSymptomPdfExport()
const { archiveDeletedEntry } = useDeletedEntryArchive()
const {
  isMonthlyBackupReminderVisible,
  dismissMonthlyBackupReminder,
  refreshMonthlyBackupReminder
} = useMonthlyBackupReminder(
  () => user.value?.id,
  () => savedEntries.value.length > 0
)

const initialEntryDateTime = splitEntryDateTimeLocal(getMaxEntryDateTimeLocal())
const initialEntryTimeParts = parseTime24ToParts(initialEntryDateTime.time)
const entryCalendarDate = shallowRef(dateStringToCalendarDate(initialEntryDateTime.date))
const entryCalendarPlaceholder = shallowRef(dateStringToCalendarDate(initialEntryDateTime.date))
const entryTimeInput = ref(initialEntryDateTime.time)
const entryTimeHour = ref(initialEntryTimeParts.hour12)
const entryTimeMinute = ref(initialEntryTimeParts.minute)
const entryTimePeriod = ref<'AM' | 'PM'>(initialEntryTimeParts.period)
let isApplyingEntryCalendarSelection = false
let entryTimeWasManuallySelected = false
const defaultBackdatedEntryTime = '12:00'

const mobileEntryFlowRef = ref<InstanceType<typeof TrackerEntryFlow> | null>(null)
const desktopEntryFlowRef = ref<InstanceType<typeof TrackerEntryFlow> | null>(null)

function getActiveEntryFlowRef() {
  return isDesktopLayout.value ? desktopEntryFlowRef.value : mobileEntryFlowRef.value
}

function getEntryStepScrollEl() {
  return getActiveEntryFlowRef()?.getStepScrollEl() ?? null
}

function scrollEntryElementIntoView(target: HTMLElement) {
  getActiveEntryFlowRef()?.scrollElementIntoView(target)
}

const pdfConditionStatementField: EntryFieldDef = {
  label: 'PDF condition statement',
  type: 'textarea',
  placeholder: 'Example: I am backtracking my symptoms. Most GERD symptoms I logged happened when I did not take my medication.',
  helper: 'Optional. This prints once before this condition in your PDF, not before every entry.'
}
const PDF_CONDITION_STATEMENT_KEY = 'pdf_condition_statement'
const historyCalendarDate = shallowRef(getTodayCalendarDate())
const historyCalendarPlaceholder = shallowRef(getTodayCalendarDate())

const maxEntryTimeInput = computed(() => {
  if (!entryCalendarDate.value) {
    return '23:59'
  }

  return getMaxEntryTimeLocal(calendarDateToDateString(entryCalendarDate.value))
})

const entryDateTimePreview = computed(() => {
  return formatEntryDateTimePreview(entryForm.value.date_and_time || '')
})

const historyTabs = ['Entries', 'Calendar', 'Export']
const submissionHighlightDurationMs = 5_000

const pendingDeleteDraft = ref(false)
const pendingDelete = ref<null | {
  id: string
  mode: 'archive'
  title: string
}>(null)
const viewedHistoryEntryId = ref<string | null>(null)
const isShareLinkOpen = ref(false)
const shareLinkEntry = ref<any | null>(null)
const shareLinkLabel = ref('')
const shareLinkCreatedUrl = ref('')
const shareLinkCopied = ref(false)
const shareLinkError = ref('')
const isCreatingShareLink = ref(false)
const isUpgradePromptOpen = ref(false)
const upgradePromptTitle = ref('Upgrade to Pro')
const upgradePromptDescription = ref('')
const isUpgradeCheckoutLoading = ref(false)
const isEditHistoryNoticeOpen = ref(false)
const isEntryEditLockedOpen = ref(false)
const pendingEditAfterNoticeEntryId = ref<string | null>(null)
const isConditionSlotOpen = ref(false)
const pendingConditionSlotKey = ref('')
const pendingConditionSlotLabel = ref('')
const pendingConditionSlotMode = ref<'add' | 'replace'>('add')
const pendingConditionSlotLoggedEntryCount = ref(0)
const pendingEntryPanelOptions = ref<{
  prefillCustomCondition?: string
  condition?: {
    title: string
    category: string
    description: string
    image: string
  }
} | null>(null)
const isConfirmingConditionSlot = ref(false)
const isLoggingCadencePromptOpen = ref(false)
const weeklyLogCaution = ref<WeeklyLogCaution | null>(null)
const pendingCadenceEntryOptions = ref<{
  prefillCustomCondition?: string
  condition?: {
    title: string
    category: string
    description: string
    image: string
  }
} | null>(null)
const conditionSlotError = ref('')
const isConditionBrowserOpen = ref(false)

/** Hide History chrome whenever a blocking overlay owns the screen. */
const shouldHideHistoryChrome = computed(() => (
  needsAppWelcome.value
  || isAuthPanelOpen.value
  || isHomeTipsOverlayOpen.value
  || isUpgradePromptOpen.value
  || isLoggingCadencePromptOpen.value
  || pendingDeleteDraft.value
  || Boolean(pendingDelete.value)
  || Boolean(viewedHistoryEntryId.value)
  || (isShareLinkOpen.value && Boolean(shareLinkEntry.value))
  || isConditionSlotOpen.value
  || isEditHistoryNoticeOpen.value
  || isEntryEditLockedOpen.value
  || isPdfExportOverlayOpen.value
  || (isEmbeddedPreview && isEmbedProfileOpen.value)
))

useAppOverlayHistoryInset(historyExpanded, { historyHidden: shouldHideHistoryChrome })
const draftSelectedKeys = ref<string[]>([])
const isSavingTrackedConditions = ref(false)
const trackedConditionsError = ref('')

const conditionResults = conditionCatalog

type HomeCondition = typeof conditionCatalog[number]

const conditionPickerOptions = computed(() => buildConditionPickerOptions({
  trackedKeys: trackedConditionKeys.value,
  extraKeys: draftSelectedKeys.value.filter((key) => isCustomTrackedConditionKey(key)),
  customLabels: customConditionLabels.value
}))

const customConditionLabels = computed(() => buildCustomConditionLabelsFromEntries(savedEntries.value))
const HOME_CONDITION_ORDER_STORAGE_PREFIX = 'symptom-tracker-home-condition-order'

function getHomeConditionOrderStorageKey() {
  return user.value?.id ? `${HOME_CONDITION_ORDER_STORAGE_PREFIX}:${user.value.id}` : ''
}

function buildLastRecordedAtByConditionKey(entries: any[]) {
  const lastRecordedAt = new Map<string, number>()

  for (const entry of entries) {
    if (!entry.condition_key) {
      continue
    }

    const resolvedKey = resolveCatalogConditionByStoredKey(entry.condition_key)?.key ?? entry.condition_key
    const timestamp = new Date(entry.occurred_at || entry.created_at).getTime()

    if (Number.isNaN(timestamp)) {
      continue
    }

    const previous = lastRecordedAt.get(resolvedKey) ?? 0

    if (timestamp > previous) {
      lastRecordedAt.set(resolvedKey, timestamp)
    }
  }

  return lastRecordedAt
}

function buildHomeConditionOrderKeys(trackedKeys: string[], entries: any[]) {
  const lastRecordedAt = buildLastRecordedAtByConditionKey(entries)
  const trackedOrder = new Map<string, number>()

  trackedKeys.forEach((storedKey, index) => {
    const resolvedKey = resolveCatalogConditionByStoredKey(storedKey)?.key ?? storedKey

    if (resolvedKey && !trackedOrder.has(resolvedKey)) {
      trackedOrder.set(resolvedKey, index)
    }
  })

  const conditionKeys = trackedKeys
    .map((storedKey) => resolveCatalogConditionByStoredKey(storedKey)?.key ?? storedKey)
    .filter((key, index, keys) => Boolean(key) && keys.indexOf(key) === index)

  return [...conditionKeys].sort((a, b) => {
    const lastRecordedDiff = (lastRecordedAt.get(b) ?? 0) - (lastRecordedAt.get(a) ?? 0)

    if (lastRecordedDiff !== 0) {
      return lastRecordedDiff
    }

    return (trackedOrder.get(a) ?? 0) - (trackedOrder.get(b) ?? 0)
  })
}

function normalizeHomeConditionOrderKeys(keys: string[]) {
  const trackedKeySet = new Set(
    trackedConditionKeys.value
      .map((storedKey) => resolveCatalogConditionByStoredKey(storedKey)?.key ?? storedKey)
      .filter(Boolean)
  )
  const normalized: string[] = []

  for (const key of keys) {
    const resolvedKey = resolveCatalogConditionByStoredKey(key)?.key ?? key

    if (!resolvedKey || !trackedKeySet.has(resolvedKey) || normalized.includes(resolvedKey)) {
      continue
    }

    normalized.push(resolvedKey)
  }

  return normalized
}

function readCachedHomeConditionOrderKeys() {
  if (!import.meta.client) {
    return []
  }

  const storageKey = getHomeConditionOrderStorageKey()

  if (!storageKey) {
    return []
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]')
    return Array.isArray(parsed) ? normalizeHomeConditionOrderKeys(parsed.filter((key) => typeof key === 'string')) : []
  } catch {
    return []
  }
}

function writeCachedHomeConditionOrderKeys(keys: string[]) {
  if (!import.meta.client) {
    return
  }

  const storageKey = getHomeConditionOrderStorageKey()

  if (!storageKey) {
    return
  }

  const normalized = normalizeHomeConditionOrderKeys(keys)
  window.localStorage.setItem(storageKey, JSON.stringify(normalized))
}

function restoreCachedHomeConditionOrderKeys() {
  const cachedKeys = readCachedHomeConditionOrderKeys()

  if (cachedKeys.length) {
    homeConditionOrderKeys.value = cachedKeys
  }
}

function syncHomeConditionOrderKeys() {
  homeConditionOrderKeys.value = buildHomeConditionOrderKeys(
    trackedConditionKeys.value,
    savedEntries.value
  )
  writeCachedHomeConditionOrderKeys(homeConditionOrderKeys.value)
}

function promoteHomeConditionOrderKey(conditionKey: string) {
  const resolvedKey = resolveCatalogConditionByStoredKey(conditionKey)?.key ?? conditionKey

  if (!resolvedKey) {
    return
  }

  const current = homeConditionOrderKeys.value.length
    ? [...homeConditionOrderKeys.value]
    : buildHomeConditionOrderKeys(trackedConditionKeys.value, savedEntries.value)

  homeConditionOrderKeys.value = [
    resolvedKey,
    ...current.filter((key) => key !== resolvedKey)
  ]
  writeCachedHomeConditionOrderKeys(homeConditionOrderKeys.value)
}

const homeConditions = computed(() => {
  const fallbackOrder = trackedConditionKeys.value
    .map((storedKey) => resolveCatalogConditionByStoredKey(storedKey)?.key ?? storedKey)
    .filter((key, index, keys) => Boolean(key) && keys.indexOf(key) === index)
  const orderKeys = homeConditionOrderKeys.value.length ? homeConditionOrderKeys.value : fallbackOrder
  const order = new Map(orderKeys.map((key, index) => [key, index]))
  const fallbackOrderIndex = new Map(fallbackOrder.map((key, index) => [key, index]))

  const conditions = trackedConditionKeys.value
    .map((storedKey) => resolveTrackedConditionByStoredKey(storedKey, customConditionLabels.value))
    .filter((condition): condition is HomeCondition => Boolean(condition))

  return conditions.sort((a, b) => {
    const aIndex = order.has(a.key)
      ? order.get(a.key)!
      : order.size + (fallbackOrderIndex.get(a.key) ?? 0)
    const bIndex = order.has(b.key)
      ? order.get(b.key)!
      : order.size + (fallbackOrderIndex.get(b.key) ?? 0)

    return aIndex - bIndex
  })
})

/** Single fullscreen tank loader while the home workspace bootstraps. */
const showHomeWorkspaceLoader = computed(() =>
  !isEmbeddedPreview.value && !homeWorkspaceReady.value
)

/** Desktop manage-mode browser overlays the center panel instead of replacing it (avoids flash). */
const showDesktopConditionBrowserOverlay = computed(() =>
  isDesktopLayout.value
  && isConditionBrowserOpen.value
  && !needsOnboarding.value
  && homeConditions.value.length > 0
)

const showConditionBrowser = computed(() => {
  if (!hasLoadedTrackedConditions.value && !trackedConditionKeys.value.length) {
    return false
  }

  return needsOnboarding.value
    || isConditionBrowserOpen.value
    || !homeConditions.value.length
})

function trackedConditionKeysSignature(keys: string[]) {
  return [...keys].sort().join('|')
}

function refreshHomeVisitTip() {
  if (showConditionBrowser.value) {
    return
  }

  const signature = trackedConditionKeysSignature(trackedConditionKeys.value)

  if (!signature || !homeConditions.value.length) {
    homeVisitTip.value = null
    homeVisitTipSignature.value = ''
    return
  }

  if (signature === homeVisitTipSignature.value && homeVisitTip.value) {
    const pool = buildHomeVisitTips(homeConditions.value)
    const stillValid = pool.some((tip) => {
      return tip.title === homeVisitTip.value!.title && tip.text === homeVisitTip.value!.text
    })

    if (stillValid) {
      return
    }
  }

  homeVisitTipSignature.value = signature
  homeVisitTip.value = pickRandomHomeVisitTip(homeConditions.value)
}

function goAppHome() {
  if (isEntryOpen.value) {
    closeEntryPanel(true)
  }

  isConditionBrowserOpen.value = false
  isSubmissionDropdownOpen.value = false
  closeAppOverlaysExcept()
  activeIndex.value = 0
}

function scheduleLogReminderCheck() {
  if (!user.value) {
    return
  }

  runLogReminderCheck({
    cadence: loggingCadence.value,
    weeklyLogDay: weeklyLogDay.value,
    entries: savedEntries.value,
    isAuthenticated: true
  })
}

let logReminderIntervalId: ReturnType<typeof setInterval> | undefined

function handleLogReminderVisibilityChange() {
  if (document.visibilityState === 'visible') {
    scheduleLogReminderCheck()
  }
}

const historyEntries = computed(() => {
  return [...savedEntries.value]
    .sort((a, b) => {
      const bTime = new Date(b.created_at || b.occurred_at).getTime()
      const aTime = new Date(a.created_at || a.occurred_at).getTime()
      return bTime - aTime
    })
    .map((entry) => mapEntryHistoryItem(entry))
})

function savedEntryConditionKey(entry: { condition_key?: string | null, condition_label?: string | null }) {
  const resolvedCondition = resolveCatalogConditionByStoredKey(entry.condition_key || entry.condition_label || '')
  return resolvedCondition?.key || entry.condition_key || conditionKey(entry.condition_label || '')
}

const desktopHistoryEntries = computed(() => {
  if (desktopHistoryShowAll.value) {
    return historyEntries.value
  }

  const key = activeCondition.value?.key
  if (!key) {
    return historyEntries.value
  }

  const matchingIds = new Set(
    savedEntries.value
      .filter((entry) => savedEntryConditionKey(entry) === key)
      .map((entry) => entry.id)
  )

  return historyEntries.value.filter((entry) => matchingIds.has(entry.id))
})

const viewedHistoryEntry = computed(() => {
  if (!viewedHistoryEntryId.value) {
    return null
  }

  return historyEntries.value.find((entry) => entry.id === viewedHistoryEntryId.value) || null
})

const viewedHistoryRawEntry = computed(() => {
  if (!viewedHistoryEntryId.value) {
    return null
  }

  return savedEntries.value.find((entry) => entry.id === viewedHistoryEntryId.value) || null
})

const viewedHistoryEntryTimestamp = computed(() => {
  const rawEntry = viewedHistoryRawEntry.value
  if (!rawEntry) {
    return ''
  }

  const entryDate = new Date(rawEntry.occurred_at || rawEntry.created_at)
  if (Number.isNaN(entryDate.getTime())) {
    return ''
  }

  return entryDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
})

const viewedHistoryEntryDetails = computed(() => {
  const details = viewedHistoryRawEntry.value?.details
  if (!details || typeof details !== 'object') {
    return []
  }

  const skippedDetailKeys = new Set([
    'date_and_time',
    'condition_name',
    'what_happened',
    'daily_impact',
    PDF_CONDITION_STATEMENT_KEY
  ])

  return Object.entries(details)
    .filter(([key, value]) => !skippedDetailKeys.has(key) && formatHistoryEntryDetailValue(value))
    .map(([key, value]) => ({
      label: formatHistoryEntryDetailLabel(key),
      value: formatHistoryEntryDetailValue(value)
    }))
})

const submissionNotifications = computed(() => {
  return savedEntries.value
    .map((entry) => {
      const entryDate = entry.occurred_at ? new Date(entry.occurred_at) : new Date(entry.created_at)
      const conditionLabel = normalizeConditionLabel(entry.condition_label)

      return {
        id: entry.id,
        condition: conditionLabel,
        source: entry.source === 'family' ? 'Family' : 'Veteran',
        title: entry.summary || conditionLabel,
        summary: entry.impact || 'No impact note added',
        createdAt: entry.created_at || entry.occurred_at || '',
        timeLabel: entryDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const unreadSubmissionCount = computed(() => {
  if (!lastSeenSubmissionAt.value) {
    return submissionNotifications.value.length
  }

  const lastSeenTime = new Date(lastSeenSubmissionAt.value).getTime()
  return submissionNotifications.value.filter((submission) => {
    return new Date(submission.createdAt).getTime() > lastSeenTime
  }).length
})

const highlightedSubmissionNotice = computed(() => {
  if (!highlightedSubmissionId.value) {
    return null
  }

  return submissionNotifications.value.find((submission) => {
    return submission.id === highlightedSubmissionId.value
  }) ?? null
})

const hasEntryDraft = computed(() => {
  if (entryDraftPreview.value) {
    return true
  }

  if (!hasActiveDraft.value || isEntryOpen.value || editingEntryId.value) {
    return false
  }

  return isMeaningfulEntryDraft({
    entryStep: entryStep.value,
    entryForm: entryForm.value,
    selectedSearchCondition: selectedSearchCondition.value,
    customConditionInput: customConditionInput.value
  })
})

const loggedEntryPeakSeverityByDate = computed(() => {
  const severityByDate = new Map<string, number>()

  savedEntries.value.forEach((entry) => {
    const entryDate = entry.occurred_at ? new Date(entry.occurred_at) : new Date(entry.created_at)
    if (Number.isNaN(entryDate.getTime())) {
      return
    }

    const dateKey = calendarDateToDateString(new CalendarDate(
      entryDate.getFullYear(),
      entryDate.getMonth() + 1,
      entryDate.getDate()
    ))
    const severity = entry.severity ?? 0
    const existing = severityByDate.get(dateKey)

    if (existing === undefined || severity > existing) {
      severityByDate.set(dateKey, severity)
    }
  })

  return severityByDate
})

function normalizeCalendarDay(day: CalendarDate | { year: number, month: number, day: number }) {
  return day instanceof CalendarDate
    ? day
    : new CalendarDate(day.year, day.month, day.day)
}

function getLoggedDayPeakSeverity(day: CalendarDate | { year: number, month: number, day: number }) {
  return loggedEntryPeakSeverityByDate.value.get(
    calendarDateToDateString(normalizeCalendarDay(day))
  )
}

function hasLoggedEntryOnDay(day: CalendarDate | { year: number, month: number, day: number }) {
  return getLoggedDayPeakSeverity(day) !== undefined
}

function getCalendarDayDisplay(day: CalendarDate | { year: number, month: number, day: number }) {
  const calendarDay = normalizeCalendarDay(day)
  const peakSeverity = getLoggedDayPeakSeverity(calendarDay)

  if (peakSeverity === undefined) {
    return String(calendarDay.day)
  }

  return getSeverityEmoji(peakSeverity)
}

function getLoggedDaySeverityTitle(day: CalendarDate | { year: number, month: number, day: number }) {
  const peakSeverity = getLoggedDayPeakSeverity(day)

  if (peakSeverity === undefined) {
    return undefined
  }

  return `Logged · peak severity ${peakSeverity}/10`
}

function entryLocalDateKey(entry: Record<string, any>) {
  const entryDate = entry.occurred_at ? new Date(entry.occurred_at) : new Date(entry.created_at)

  if (Number.isNaN(entryDate.getTime())) {
    return ''
  }

  return calendarDateToDateString(new CalendarDate(
    entryDate.getFullYear(),
    entryDate.getMonth() + 1,
    entryDate.getDate()
  ))
}

const selectedHistoryDayKey = computed(() => calendarDateToDateString(historyCalendarDate.value))

const selectedHistoryDayLabel = computed(() => {
  const selected = historyCalendarDate.value
  const date = new Date(selected.year, selected.month - 1, selected.day)

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const selectedHistoryDayEntries = computed(() => {
  return savedEntries.value
    .filter((entry) => entryLocalDateKey(entry) === selectedHistoryDayKey.value)
    .sort((a, b) => {
      const aTime = new Date(a.occurred_at || a.created_at).getTime()
      const bTime = new Date(b.occurred_at || b.created_at).getTime()
      return bTime - aTime
    })
    .map((entry) => mapEntryHistoryItem(entry))
})

const selectedHistoryDayPreviewEntries = computed(() => selectedHistoryDayEntries.value.slice(0, 3))
const selectedHistoryDayExtraCount = computed(() => Math.max(0, selectedHistoryDayEntries.value.length - selectedHistoryDayPreviewEntries.value.length))

const selectedHistoryDayPeakSeverity = computed(() => {
  return selectedHistoryDayEntries.value.reduce((peak, entry) => Math.max(peak, entry.severity), 0)
})

const selectedHistoryDaySeverityRange = computed(() => {
  if (selectedHistoryDayEntries.value.length < 2) {
    return ''
  }

  const severities = selectedHistoryDayEntries.value.map((entry) => entry.severity)
  const min = Math.min(...severities)
  const max = Math.max(...severities)

  if (min === max) {
    return ''
  }

  return `Range ${min}-${max}/10`
})

function onHistoryCalendarPlaceholderUpdate(date: unknown) {
  const parsed = coerceCalendarDate(date)
  if (parsed) {
    historyCalendarPlaceholder.value = parsed
  }
}

function onHistoryCalendarDateUpdate(date: unknown) {
  const parsed = coerceCalendarDate(date)
  if (parsed) {
    historyCalendarDate.value = parsed
    historyCalendarPlaceholder.value = parsed
  }
}

function onEntryCalendarPlaceholderUpdate(date: unknown) {
  const parsed = coerceCalendarDate(date)
  if (parsed) {
    entryCalendarPlaceholder.value = parsed
  }
}

function onEntryCalendarDateUpdate(date: unknown) {
  const parsed = coerceCalendarDate(date)
  if (!parsed) {
    return
  }

  const today = getTodayCalendarDate()
  const calendarDate = parsed.compare(today) > 0 ? today : parsed

  isApplyingEntryCalendarSelection = true
  entryCalendarDate.value = calendarDate
  entryCalendarPlaceholder.value = calendarDate
  entryForm.value.date_and_time = `${calendarDateToDateString(calendarDate)}T${entryTimeInput.value}`

  window.setTimeout(() => {
    isApplyingEntryCalendarSelection = false
  }, 300)
}

const loggingActivityMetrics = computed(() => {
  const date = historyCalendarPlaceholder.value
  return buildLoggingActivityMetrics(savedEntries.value, date.year, date.month - 1)
})

const isHomeOverviewSlide = computed(() => activeIndex.value === 0)

watch([isHomeOverviewSlide, homeSharedTransitionActive, homeConditions], () => {
  if (!homeSharedTransitionActive.value) {
    scheduleHomeOverviewLayoutRefresh()
  }
})

watch(homeVisitTip, () => {
  if (isHomeOverviewSlide.value && !homeSharedTransitionActive.value) {
    scheduleHomeOverviewLayoutRefresh()
  }
})

const heroSlideTransitionName = computed(() => {
  if (
    suppressHomeMotionOnMount.value
    || (
      homeSharedTransitionActive.value
      && (transitionDirection.value === 'expand' || transitionDirection.value === 'collapse')
    )
  ) {
    return 'hero-shared'
  }

  return 'hero-carousel'
})

const carouselWorkspaceClass = computed(() => {
  return 'flex-1 pb-3'
})

const historyPanelClass = computed(() => [
  historyExpanded.value ? 'is-history-expanded' : 'is-history-collapsed',
  historyPanelAnimating.value ? 'is-history-animating' : ''
])

const isConditionSlideEntryEnabled = computed(() => {
  return !historyExpanded.value && !conditionSlideEntryBlocked.value
})

const homeCarouselSlideCount = computed(() => homeConditions.value.length + 1)

function isConditionLogLocked(key: string) {
  if (!entitlementsLoaded.value || isPro.value || !user.value) {
    return false
  }

  if (savedEntries.value.length === 0) {
    return false
  }

  return !canTrackCondition(key)
}

function resolveActiveMentalHealthConditionKey() {
  const entryCounts = new Map<string, number>()

  for (const entry of savedEntries.value) {
    const key = savedEntryConditionKey(entry)
    if (!isMentalHealthConditionKey(key)) {
      continue
    }

    entryCounts.set(key, (entryCounts.get(key) || 0) + 1)
  }

  if (entryCounts.size) {
    return [...entryCounts.entries()]
      .sort((left, right) => right[1] - left[1])[0]?.[0] || null
  }

  for (const key of trackedConditionKeys.value) {
    if (isMentalHealthConditionKey(key)) {
      return key
    }
  }

  for (const key of draftSelectedKeys.value) {
    if (isMentalHealthConditionKey(key)) {
      return key
    }
  }

  return null
}

const mentalHealthRestrictedKeys = computed(() => {
  const activeKey = resolveActiveMentalHealthConditionKey()
  if (!activeKey) {
    return []
  }

  return listMentalHealthConditionKeys().filter((key) => key !== activeKey)
})

function handleRestrictedConditionSelect() {
  trackedConditionsError.value = MENTAL_HEALTH_ONE_CONDITION_MESSAGE
}

function validateDraftMentalHealthSelection(keys: string[]) {
  const mentalHealthKeys = keys.filter((key) => isMentalHealthConditionKey(key))
  if (mentalHealthKeys.length <= 1) {
    return true
  }

  trackedConditionsError.value = MENTAL_HEALTH_ONE_CONDITION_MESSAGE
  return false
}

const activeCondition = computed(() => {
  if (isHomeOverviewSlide.value) {
    return homeConditions.value[0] || conditionCatalog[0]
  }

  return homeConditions.value[activeIndex.value - 1] || homeConditions.value[0] || conditionCatalog[0]
})

const desktopSelectedConditionKey = computed(() => {
  if (isEntryOpen.value) {
    const key = resolveCatalogConditionByStoredKey(conditionKey(entryTitle.value))?.key
      ?? conditionKey(entryTitle.value)
    if (key) {
      return key
    }
  }

  return activeCondition.value?.key || ''
})

const desktopChartMetrics = computed(() => (
  buildSymptomDashboardMetrics(
    savedEntries.value,
    desktopChartsShowAllConditions.value ? null : desktopSelectedConditionKey.value
  )
))
const entryTitle = computed(() => {
  if (isConditionPickerOpen.value) {
    const previewName = debouncedCustomConditionPreview.value.trim()
    if (previewName) {
      return previewName
    }
  }

  if (selectedSearchCondition.value) {
    return selectedSearchCondition.value.title
  }

  const customName = entryForm.value.condition_name?.trim()
  if (customName) {
    return customName
  }

  if (editingEntryConditionLabel.value) {
    return editingEntryConditionLabel.value
  }

  return activeCondition.value?.title || 'Custom condition'
})
function resolveHomeGreetingFirstName() {
  if (!user.value) {
    return ''
  }

  const metadataName = typeof user.value.user_metadata?.full_name === 'string'
    ? user.value.user_metadata.full_name.trim()
    : ''

  return (profileDisplayName.value || metadataName).trim().split(/\s+/)[0] || ''
}

const homeGreetingLine = computed(() => {
  if (!user.value) {
    return ''
  }

  const firstName = resolveHomeGreetingFirstName()
  const greetingWord = homeGreetingWord.value || 'Hello'

  if (!firstName) {
    return greetingWord
  }

  return `${greetingWord}, ${firstName}`
})
const freeConditionLabels = computed(() => {
  return freeConditionKeys.value.map((key) => {
    const matchedEntry = savedEntries.value.find((entry) => entry.condition_key === key)
    return normalizeConditionLabel(matchedEntry?.condition_label || formatConditionKeyLabel(key))
  })
})

type ExportableCondition = {
  key: string
  label: string
  entryCount: number
}

const exportableConditions = computed((): ExportableCondition[] => {
  const groups = new Map<string, { label: string, count: number }>()

  for (const entry of savedEntries.value) {
    const resolvedCondition = resolveCatalogConditionByStoredKey(entry.condition_key || entry.condition_label)
    const key = resolvedCondition?.key || entry.condition_key || conditionKey(entry.condition_label)
    const label = resolvedCondition?.title || normalizeConditionLabel(entry.condition_label || formatConditionKeyLabel(key))
    const existing = groups.get(key)

    if (existing) {
      existing.count += 1
    } else {
      groups.set(key, { label, count: 1 })
    }
  }

  return [...groups.entries()]
    .map(([key, data]) => ({
      key,
      label: data.label,
      entryCount: data.count
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})


const allExportConditionsSelected = computed(() => {
  if (!exportableConditions.value.length) {
    return false
  }

  return exportableConditions.value.every((condition) => (
    selectedExportConditionKeys.value.includes(condition.key)
  ))
})

const pdfExportDescription = computed(() => {
  if (pdfExportType.value === 'cp-exam') {
    return 'Designed to help you prepare for a C&P exam by summarizing patterns in your logs, including frequency, severity, functional impact, and recurring topics. For personal use only and not intended as medical, legal, or VA evidence.'
  }

  return 'Signed Veteran Symptom History Report with summary stats, logging consistency charts, and your full entry log.'
})

const pdfExportContentDescription = computed(() => {
  if (pdfExportContentMode.value === 'entries-only') {
    return 'Summary stats and your full entry log without logging charts or advanced analytics.'
  }

  if (isPro.value) {
    return 'Includes logging consistency charts, severity trends, and advanced analytics plus your full entry log.'
  }

  return 'Includes logging consistency charts plus your full entry log. Pro adds severity trends and advanced analytics.'
})

function isFamilySourceEntry(entry: { source?: string | null }) {
  return entry.source === 'family'
}

function resolveExportEntries(
  conditionKeys: string[],
  options: { source?: 'veteran' | 'family' | 'all' } = {}
) {
  const { source = 'all' } = options
  const keySet = new Set(conditionKeys)

  return savedEntries.value.filter((entry) => {
    const resolvedCondition = resolveCatalogConditionByStoredKey(entry.condition_key || entry.condition_label)
    const entryKey = resolvedCondition?.key || entry.condition_key || conditionKey(entry.condition_label)

    if (!keySet.has(entryKey)) {
      return false
    }

    if (source === 'veteran' && isFamilySourceEntry(entry)) {
      return false
    }

    if (source === 'family' && !isFamilySourceEntry(entry)) {
      return false
    }

    return true
  })
}

const exportSelectedFamilyEntryCount = computed(() => (
  resolveExportEntries(selectedExportConditionKeys.value, { source: 'family' }).length
))

const exportSelectedVeteranEntryCount = computed(() => (
  resolveExportEntries(selectedExportConditionKeys.value, { source: 'veteran' }).length
))

const exportableFamilyEntryCount = computed(() => (
  resolveExportEntries(exportableConditions.value.map((condition) => condition.key), { source: 'family' }).length
))

const canConfirmPdfExport = computed(() => {
  if (isExportingPdf.value || pdfExportDownloadStarted.value || !user.value || !exportableConditions.value.length || !selectedExportConditionKeys.value.length) {
    return false
  }

  if (pdfExportType.value === 'full') {
    return pdfExportAcknowledged.value
  }

  return true
})

const exportButtonLabel = computed(() => {
  if (pdfExportDownloadStarted.value) {
    return 'Check your downloads'
  }

  if (isExportingPdf.value) {
    return 'Preparing...'
  }

  const count = selectedExportConditionKeys.value.length

  if (pdfExportType.value === 'cp-exam') {
    return count === 1 ? 'Download personal review' : `Download personal review (${count} conditions)`
  }

  if (pdfExportSeparateFamily.value && exportSelectedFamilyEntryCount.value > 0 && exportSelectedVeteranEntryCount.value > 0) {
    return 'Download 2 PDFs'
  }

  return count === 1 ? 'Download signed PDF' : `Download signed PDF (${count} conditions)`
})

function openPdfExportOverlay() {
  exportError.value = ''
  pdfExportDownloadStarted.value = false
  isPdfExportOverlayOpen.value = true
}

function closePdfExportOverlay() {
  if (isExportingPdf.value) {
    return
  }

  pdfExportDownloadStarted.value = false
  isPdfExportOverlayOpen.value = false
}

watch(
  [pdfExportType, pdfExportContentMode, pdfExportSeparateFamily, selectedExportConditionKeys, pdfExportAcknowledged],
  () => {
    if (pdfExportDownloadStarted.value) {
      pdfExportDownloadStarted.value = false
      exportNotice.value = ''
    }
  }
)

function isExportConditionSelected(conditionKey: string) {
  return selectedExportConditionKeys.value.includes(conditionKey)
}

function toggleExportCondition(conditionKey: string) {
  if (isExportConditionSelected(conditionKey)) {
    selectedExportConditionKeys.value = selectedExportConditionKeys.value.filter((key) => key !== conditionKey)
    return
  }

  selectedExportConditionKeys.value = [...selectedExportConditionKeys.value, conditionKey]
}

function toggleAllExportConditions() {
  if (allExportConditionsSelected.value) {
    selectedExportConditionKeys.value = []
    return
  }

  selectedExportConditionKeys.value = exportableConditions.value.map((condition) => condition.key)
}

function ensureExportConditionSelection() {
  if (!exportableConditions.value.length) {
    selectedExportConditionKeys.value = []
    return
  }

  const validKeys = new Set(exportableConditions.value.map((condition) => condition.key))
  const retained = selectedExportConditionKeys.value.filter((key) => validKeys.has(key))

  selectedExportConditionKeys.value = retained.length
    ? retained
    : exportableConditions.value.map((condition) => condition.key)
}

function buildExportConditionLabel(conditionKeys: string[]) {
  const selected = exportableConditions.value.filter((condition) => conditionKeys.includes(condition.key))

  if (selected.length === 1) {
    return selected[0].label
  }

  if (selected.length === exportableConditions.value.length) {
    return null
  }

  return `${selected.length} conditions`
}

watch(exportableConditions, () => {
  ensureExportConditionSelection()
})

const activeEntryImage = computed(() => {
  if (selectedSearchCondition.value?.image) {
    return selectedSearchCondition.value.image
  }

  return activeCondition.value?.image || conditionImageAssets.mentalHealth
})
const activeEntryFields = computed(() => {
  let fields: EntryFieldDef[]

  if (selectedSearchCondition.value) {
    fields = getEntryFieldsForSearchCondition(selectedSearchCondition.value)
  } else {
    const customName = entryForm.value.condition_name?.trim()
    if (customName) {
      fields = [
        {
          label: 'Condition name',
          type: 'text',
          placeholder: 'Example: tinnitus, sinusitis, skin flare-up...'
        },
        ...buildDefaultEntryFields()
      ]
    } else if (editingEntryConditionLabel.value) {
      fields = entryFieldsByCondition[editingEntryConditionLabel.value as keyof typeof entryFieldsByCondition]
        || buildDefaultEntryFields()
    } else {
      const activeTitle = activeCondition.value?.title
      fields = activeTitle
        ? entryFieldsByCondition[activeTitle as keyof typeof entryFieldsByCondition] || buildDefaultEntryFields()
        : buildDefaultEntryFields()
    }
  }

  return [
    ...fields,
    pdfConditionStatementField
  ]
})
const entrySteps = computed(() => {
  const fields = activeEntryFields.value
  const steps = []
  let index = 0

  while (index < fields.length) {
    const field = fields[index]

    if (field.type === 'datetime' || field.type === 'slider') {
      steps.push([field])
      index += 1
      continue
    }

    if (isEpisodeDurationField(field)) {
      const nextField = fields[index + 1]
      if (nextField && isEpisodeFollowUpField(nextField)) {
        steps.push([field, nextField])
        index += 2
      } else {
        steps.push([field])
        index += 1
      }
      continue
    }

    if (isEpisodeFollowUpField(field)) {
      steps.push([field])
      index += 1
      continue
    }

    if (isMedicationsStepField(field)) {
      const medicationFields = [field]
      while (index + 1 < fields.length && isMedicationsStepField(fields[index + 1])) {
        medicationFields.push(fields[index + 1]!)
        index += 1
      }
      steps.push(medicationFields)
      index += 1
      continue
    }

    steps.push(fields.slice(index, index + 2))
    index += 2
  }

  return steps
})
const currentEntryStepFields = computed(() => entrySteps.value[entryStep.value] || [])
const isLastEntryStep = computed(() => entryStep.value >= entrySteps.value.length - 1)
const entryHeaderActionLabel = computed(() => {
  if (isSavingEntry.value) {
    return 'Saving...'
  }

  if (isEditingEntry.value) {
    return 'Save changes'
  }

  if (isLastEntryStep.value) {
    return 'Finish'
  }

  return 'Save draft'
})
const entryProgressWidth = computed(() => {
  if (!entrySteps.value.length) {
    return '0%'
  }

  return `${((entryStep.value + 1) / entrySteps.value.length) * 100}%`
})

const activeEntryIsMentalHealth = computed(() => {
  const category = selectedSearchCondition.value?.category
    || activeCondition.value?.category
    || ''

  return category.toLowerCase().includes('mental')
})

const activeEntryTemplateKey = computed(() => {
  if (selectedSearchCondition.value) {
    return resolveEntryTemplateKeyForCondition(selectedSearchCondition.value)
  }

  if (editingEntryConditionLabel.value && editingEntryConditionLabel.value in entryFieldsByCondition) {
    return editingEntryConditionLabel.value as keyof typeof entryFieldsByCondition
  }

  const active = activeCondition.value
  if (active) {
    return resolveEntryTemplateKeyForCondition(active)
  }

  return '__generic__' as const
})

function getPresetsForEntryField(fieldLabel: string) {
  const catalogPresets = getEntryFieldPresets(fieldLabel, activeEntryTemplateKey.value)
  const lastEntryValues = getValuesFromLastEntry(
    savedEntriesForCondition(entryTitle.value),
    fieldLabel
  )

  return mergeEntryFieldPresets(catalogPresets, lastEntryValues)
}
function filterConditionResults(query: string) {
  return filterAndRankConditions(conditionResults, query)
}

const filteredConditionResults = computed(() => filterConditionResults(debouncedSearchQuery.value))
const hasConditionSearch = computed(() => debouncedSearchQuery.value.trim().length > 0)
const showConditionSearchEmptyState = computed(() =>
  hasConditionSearch.value && filteredConditionResults.value.length === 0
)
const filteredPickerConditionResults = computed(() => filterConditionResults(debouncedCustomConditionPreview.value))
const hasCustomConditionSearch = computed(() => debouncedCustomConditionPreview.value.trim().length > 0)
const showCustomConditionEmptyState = computed(() =>
  hasCustomConditionSearch.value && filteredPickerConditionResults.value.length === 0
)
const installGuideVideoUrl = computed(() => {
  if (installPlatform.value === 'ios') {
    return iosAddToHomeScreenVideoUrl
  }

  if (installPlatform.value === 'android') {
    return androidAddToHomeScreenVideoUrl
  }

  return null
})
const installInstructionText = computed(() => {
  if (installPlatform.value === 'ios') {
    return 'On iPhone: use Safari, tap Share, then Add to Home Screen.'
  }

  if (installPlatform.value === 'android') {
    return canPromptInstall.value
      ? 'On Android: tap Install app, or use Chrome menu > Add to Home screen.'
      : 'On Android: open Chrome menu, then tap Add to Home screen or Install app.'
  }

  return 'Open this link on your phone, then add it to your home screen for the app-like experience.'
})

let searchTimer: ReturnType<typeof setTimeout> | undefined
let customConditionTimer: ReturnType<typeof setTimeout> | undefined
let conditionScrollTimer: ReturnType<typeof setTimeout> | undefined
let submissionHighlightTimer: ReturnType<typeof setTimeout> | undefined
let entryDraftSaveTimer: ReturnType<typeof setTimeout> | undefined

function refreshEntryDraftPreview() {
  const snapshot = readEntryDraft(user.value?.id)

  if (snapshot && isMeaningfulEntryDraft(snapshot)) {
    entryDraftPreview.value = {
      title: snapshot.conditionTitle || 'Symptom log',
      timeLabel: formatEntryDraftTimeLabel(snapshot.savedAt)
    }
    return
  }

  if (
    hasActiveDraft.value
    && !isEntryOpen.value
    && !editingEntryId.value
    && isMeaningfulEntryDraft({
      entryStep: entryStep.value,
      entryForm: entryForm.value,
      selectedSearchCondition: selectedSearchCondition.value,
      customConditionInput: customConditionInput.value
    })
  ) {
    entryDraftPreview.value = {
      title: entryTitle.value,
      timeLabel: 'This session'
    }
    return
  }

  entryDraftPreview.value = null
}

function persistEntryDraftNow() {
  if (isRestoringEntryDraft.value || editingEntryId.value) {
    return
  }

  const snapshot = buildEntryDraftSnapshot({
    entryStep: entryStep.value,
    severityValue: severityValue.value,
    entryForm: entryForm.value,
    selectedSearchCondition: selectedSearchCondition.value,
    customConditionInput: customConditionInput.value,
    conditionTitle: entryTitle.value
  })

  if (!snapshot) {
    clearEntryDraft(user.value?.id)
    refreshEntryDraftPreview()
    return
  }

  writeEntryDraft(user.value?.id, snapshot)
  refreshEntryDraftPreview()
}

function scheduleEntryDraftSave() {
  if (isRestoringEntryDraft.value || editingEntryId.value) {
    return
  }

  if (entryDraftSaveTimer) {
    clearTimeout(entryDraftSaveTimer)
  }

  entryDraftSaveTimer = setTimeout(() => {
    persistEntryDraftNow()
  }, 800)
}

function cancelEntryDraftSave() {
  if (!entryDraftSaveTimer) {
    return
  }

  clearTimeout(entryDraftSaveTimer)
  entryDraftSaveTimer = undefined
}

function clearPersistedEntryDraft() {
  cancelEntryDraftSave()
  clearEntryDraft(user.value?.id)
  entryDraftPreview.value = null
}

function restoreEntryDraftSnapshot(snapshot: EntryDraftSnapshot) {
  isRestoringEntryDraft.value = true
  historyExpanded.value = false
  transitionDirection.value = 'expand'
  editingEntryId.value = null
  editingEntryConditionLabel.value = null
  entryError.value = ''
  entryStep.value = snapshot.entryStep
  severityValue.value = snapshot.severityValue
  entryForm.value = { ...snapshot.entryForm }
  selectedSearchCondition.value = snapshot.selectedSearchCondition
    ? { ...snapshot.selectedSearchCondition }
    : null
  customConditionInput.value = snapshot.customConditionInput
  debouncedCustomConditionPreview.value = snapshot.customConditionInput
  isConditionPickerOpen.value = false
  hasActiveDraft.value = true
  syncEntryInputsFromForm()
  isRestoringEntryDraft.value = false
}

function resumeEntryDraft() {
  if (needsAppWelcome.value) {
    return
  }

  closeSubmissionDropdown()

  if (
    hasActiveDraft.value
    && isMeaningfulEntryDraft({
      entryStep: entryStep.value,
      entryForm: entryForm.value,
      selectedSearchCondition: selectedSearchCondition.value,
      customConditionInput: customConditionInput.value
    })
  ) {
    historyExpanded.value = false
    transitionDirection.value = 'expand'
    isEntryOpen.value = true
    return
  }

  const snapshot = readEntryDraft(user.value?.id)

  if (!snapshot) {
    refreshEntryDraftPreview()
    return
  }

  restoreEntryDraftSnapshot(snapshot)
  isEntryOpen.value = true
}

function requestDeleteEntryDraft() {
  closeAppOverlaysExcept('delete-draft')
  pendingDeleteDraft.value = true
}

function cancelDeleteEntryDraft() {
  pendingDeleteDraft.value = false
}

function confirmDeleteEntryDraft() {
  clearPersistedEntryDraft()
  hasActiveDraft.value = false
  pendingDeleteDraft.value = false
  closeSubmissionDropdown()

  if (isEntryOpen.value && !editingEntryId.value) {
    closeEntryPanel(true)
  }

  showSubmissionToast('Draft deleted.')
}

watch(searchQuery, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    debouncedSearchQuery.value = value
  }, 250)
})

watch(customConditionInput, (value) => {
  if (customConditionTimer) {
    clearTimeout(customConditionTimer)
  }

  customConditionTimer = setTimeout(() => {
    debouncedCustomConditionPreview.value = value
  }, 250)
})

watch(isConditionPickerOpen, (open) => {
  if (!open) {
    debouncedCustomConditionPreview.value = ''
    if (customConditionTimer) {
      clearTimeout(customConditionTimer)
    }
  }
})

onMounted(async () => {
  const shouldShowBootstrapLoader = !homeWorkspaceReady.value

  if (import.meta.client) {
    const { hash, search } = window.location
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
    const linkType = hashParams.get('type')
    const hasAuthPayload = hashParams.has('access_token')
      || search.includes('code=')
      || search.includes('token_hash=')

    if (hasAuthPayload) {
      markHomeWorkspaceReady()

      if (linkType === 'recovery') {
        window.location.replace(`/auth/reset-password${search}${hash}`)
        return
      }

      window.location.replace(`/auth/confirm${search}${hash}`)
      return
    }
  }

  openLoginFromQuery()
  openExportFromQuery()

  if (!homeGreetingWord.value) {
    homeGreetingWord.value = Math.random() < 0.5 ? 'Hello' : 'Hey'
  }
  if (shouldShowBootstrapLoader) {
    await loadAppWelcomeState()
    await refreshTrackedConditions()
  } else {
    void loadAppWelcomeState()
    void refreshTrackedConditions()
  }

  nextTick(() => {
    suppressHomeMotionOnMount.value = false
  })
  restoreCachedHomeConditionOrderKeys()

  nextTick(() => {
    rememberHomeOverviewHeaderHeight()
    rememberHomeChromeBlockHeight()
    updateHomeConditionsMaxScroll()
  })

  homeConditionsMaxScrollResizeListener = () => {
    updateHomeConditionsMaxScroll()
  }
  window.addEventListener('resize', homeConditionsMaxScrollResizeListener)

  if (user.value) {
    if (shouldShowBootstrapLoader) {
      loadProfileDisplayName()
      loadEntitlements()
      await loadEntries()
    } else {
      loadProfileDisplayName()
      loadEntitlements()
      void loadEntries()
    }
    refreshEntryDraftPreview()
  }

  document.addEventListener('visibilitychange', handleLogReminderVisibilityChange)
  logReminderIntervalId = window.setInterval(
    scheduleLogReminderCheck,
    LOG_REMINDER_TEST_MODE ? LOG_REMINDER_TEST_INTERVAL_MS : 60 * 60 * 1000
  )

  if (isDemoMode) {
    demoReady.value = true
  }

  markHomeWorkspaceReady()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleLogReminderVisibilityChange)

  if (homeConditionsMaxScrollResizeListener) {
    window.removeEventListener('resize', homeConditionsMaxScrollResizeListener)
  }

  if (logReminderIntervalId) {
    clearInterval(logReminderIntervalId)
  }
})

watch(() => user.value?.id ?? null, async (nextId, prevId) => {
  if (nextId === prevId) {
    return
  }

  // Auth token refresh / hydration after the first bootstrap — refresh quietly.
  if (!prevId && nextId && homeWorkspaceReady.value) {
    loadProfileDisplayName()
    loadEntitlements()
    await loadAppWelcomeState()
    await refreshTrackedConditions()
    restoreCachedHomeConditionOrderKeys()
    await loadEntries()
    refreshEntryDraftPreview()
    return
  }

  // Skip until the first bootstrap finishes; onMounted owns that path.
  if (!homeWorkspaceReady.value) {
    return
  }

  // Signed out — clear data without blanking the shell (avoids tank-loader flash).
  if (!nextId && prevId) {
    profileDisplayName.value = ''
    savedEntries.value = []
    homeConditionOrderKeys.value = []
    hasLoadedEntriesOnce.value = false
    closeEntryPanel(true, true)
    refreshEntryDraftPreview()
    await refreshTrackedConditions()
    return
  }

  // Different signed-in account — refresh quietly (no fullscreen bootstrap loader).
  if (nextId && prevId) {
    try {
      isAuthPanelOpen.value = false
      loadProfileDisplayName()
      loadEntitlements()
      await loadAppWelcomeState()
      await refreshTrackedConditions()
      restoreCachedHomeConditionOrderKeys()
      await loadEntries()
      refreshEntryDraftPreview()
    } catch (error) {
      entriesError.value = getErrorMessage(error)
    }
  }
})

watch(showConditionBrowser, (showing, wasShowing) => {
  if (!showing || needsOnboarding.value || wasShowing) {
    return
  }

  draftSelectedKeys.value = [...trackedConditionKeys.value]
  conditionBrowserListOrder.value = buildConditionBrowserListOrder(trackedConditionKeys.value)
})

watch(needsOnboarding, (needsOnboardingNow) => {
  if (needsOnboardingNow) {
    draftSelectedKeys.value = [...trackedConditionKeys.value]
    isConditionBrowserOpen.value = false
    return
  }

  if (!draftSelectedKeys.value.length && trackedConditionKeys.value.length) {
    draftSelectedKeys.value = [...trackedConditionKeys.value]
  }
}, { immediate: true })

watch(authMode, () => {
  signupPasswordReveal.hide()
  authConfirmPassword.value = ''
  authValidationMessage.value = ''
})

watch(isAuthPanelOpen, (open) => {
  if (!open) {
    clearAuthPanelNotice()
  }
})

watch(isEntryOpen, (open) => {
  if (!open || editingEntryId.value) {
    return
  }

  scheduleEntryDraftSave()
})

watch(shouldHideHistoryChrome, (hide) => {
  if (hide) {
    historyExpanded.value = false
  }
})

watch(historyExpanded, (expanded, wasExpanded) => {
  if (wasExpanded === undefined) {
    if (!expanded) {
      blockConditionSlideEntry(HISTORY_TRANSITION_LOCK_MS)
    }
    return
  }

  historyPanelAnimating.value = true

  if (expanded) {
    conditionSlideEntryBlocked.value = true
    return
  }

  blockConditionSlideEntry(HISTORY_TRANSITION_LOCK_MS)
})

watch(() => route.query.login, (value) => {
  if (value === '1') {
    openLoginFromQuery()
  }
})

watch(() => route.query.export, (value) => {
  if (value === '1') {
    openExportFromQuery()
  }
})

watch(pendingAuthPanelOpen, (pending) => {
  if (!pending) {
    return
  }

  pendingAuthPanelOpen.value = false
  authMode.value = 'login'
  authError.value = ''
  authValidationMessage.value = ''
  openAuthPanel()
}, { flush: 'post' })

watch(
  [entryForm, () => severityValue.value, entryStep, selectedSearchCondition, customConditionInput],
  () => {
    if (!isEntryOpen.value || editingEntryId.value || isRestoringEntryDraft.value) {
      return
    }

    hasActiveDraft.value = true
    scheduleEntryDraftSave()
  },
  { deep: true }
)

watch(
  [
    isHomeOverviewSlide,
    () => trackedConditionKeysSignature(trackedConditionKeys.value),
    showConditionBrowser
  ],
  ([isOverview, signature, browserOpen]) => {
    if (!isOverview || browserOpen) {
      return
    }

    if (!signature) {
      homeVisitTip.value = null
      homeVisitTipSignature.value = ''
      return
    }

    refreshHomeVisitTip()
  },
  { immediate: true }
)

watch(trackedConditionKeys, (keys) => {
  if (!keys.length) {
    activeIndex.value = 0
    return
  }

  if (activeIndex.value > keys.length) {
    activeIndex.value = keys.length
  }
})

async function loadProfileDisplayName() {
  if (!user.value) {
    profileDisplayName.value = ''
    return
  }

  const metadataName = typeof user.value.user_metadata?.full_name === 'string'
    ? user.value.user_metadata.full_name.trim()
    : ''

  if (metadataName && !profileDisplayName.value) {
    profileDisplayName.value = metadataName
  }

  try {
    const profile = await getProfile()
    const resolved = profile?.full_name?.trim() || metadataName

    if (resolved) {
      profileDisplayName.value = resolved
    }
  } catch {
    if (metadataName && !profileDisplayName.value) {
      profileDisplayName.value = metadataName
    }
  }
}

const ENTRY_FIELD_KEY_ALIASES: Record<string, string> = {
  'Possible Factors (optional)': 'medication_or_food_trigger'
}

function fieldKey(label: string) {
  if (ENTRY_FIELD_KEY_ALIASES[label]) {
    return ENTRY_FIELD_KEY_ALIASES[label]
  }

  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function applySeverityPreset(value: number) {
  severityValue.value = value
}

function applyEntryFieldPreset(label: string, value: string) {
  const key = fieldKey(label)

  if (isAppendPresetField(label)) {
    appendSavedMedicationToEntry(value)
    return
  }

  if (isMultiSelectPresetField(label)) {
    entryForm.value[key] = toggleEntryFieldPresetValue(entryForm.value[key], value)
    return
  }

  entryForm.value[key] = value
}

function appendSavedMedicationToEntry(medication: string) {
  const key = fieldKey('Medications for this entry')
  const current = entryForm.value[key] || ''
  const parts = current
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const normalized = medication.trim().toLowerCase()
  const existingIndex = parts.findIndex((part) => part.toLowerCase() === normalized)

  if (existingIndex >= 0) {
    parts.splice(existingIndex, 1)
  } else {
    parts.push(medication.trim())
  }

  entryForm.value[key] = parts.length ? parts.join('\n') : ''
}

function refreshEntryDateLimits() {
  // Future dates are blocked on selection and when validating the step.
}

function resetEntryForm() {
  refreshEntryDateLimits()
  entryForm.value = {}
  severityValue.value = 5
  entryTimeWasManuallySelected = false
  entryForm.value.date_and_time = getMaxEntryDateTimeLocal()
  syncEntryInputsFromForm()
}

function syncEntryInputsFromForm() {
  const raw = entryForm.value.date_and_time || getMaxEntryDateTimeLocal()
  const date = raw.slice(0, 10)
  const time = raw.slice(11, 16) || initialEntryDateTime.time
  entryTimeInput.value = time
  syncEntryTimePartsFromInput()

  entryCalendarDate.value = dateStringToCalendarDate(date)
  entryCalendarPlaceholder.value = dateStringToCalendarDate(date)
}

function syncEntryFormFromInputs() {
  const calendarDate = coerceCalendarDate(entryCalendarDate.value)

  if (!calendarDate || !entryTimeInput.value) {
    return
  }

  const dateStr = calendarDateToDateString(calendarDate)
  entryForm.value.date_and_time = `${dateStr}T${entryTimeInput.value}`
}

function syncEntryTimePartsFromInput() {
  const parts = parseTime24ToParts(entryTimeInput.value)
  entryTimeHour.value = parts.hour12
  entryTimeMinute.value = parts.minute
  entryTimePeriod.value = parts.period
}

function onEntryTimePartsChange() {
  if (isApplyingEntryCalendarSelection) {
    return
  }

  const nextTime = formatPartsToTime24(
    entryTimeHour.value,
    entryTimeMinute.value,
    entryTimePeriod.value
  )
  entryTimeWasManuallySelected = true
  entryTimeInput.value = clampTime24ToMax(nextTime, maxEntryTimeInput.value)
  syncEntryTimePartsFromInput()
  syncEntryFormFromInputs()
}

function setEntryDateTimeNow() {
  refreshEntryDateLimits()
  entryTimeWasManuallySelected = true
  entryForm.value.date_and_time = getMaxEntryDateTimeLocal()
  syncEntryInputsFromForm()
}

function currentStepHasDateTimeField() {
  return currentEntryStepFields.value.some((field) => field.type === 'datetime')
}

function validateEntryDateTimeStep() {
  if (!entryForm.value.date_and_time) {
    entryError.value = 'Choose when this happened.'
    return false
  }

  if (isFutureEntryDateTime(entryForm.value.date_and_time)) {
    entryError.value = 'Date and time cannot be in the future.'
    return false
  }

  entryError.value = ''
  return true
}

async function exportCpExamPdf(conditionKeys: string[]) {
  isExportingPdf.value = true
  exportError.value = ''
  exportNotice.value = ''

  try {
    const entries = resolveExportEntries(conditionKeys)
    const conditionLabel = buildExportConditionLabel(conditionKeys)

    if (!entries.length) {
      exportError.value = 'No entries found for the selected conditions.'
      return
    }

    const profile = await getProfile()
    const veteranName = profile?.full_name?.trim()
      || (typeof user.value?.user_metadata?.full_name === 'string'
        ? user.value.user_metadata.full_name.trim()
        : '')

    await downloadCpExamPdf(entries, {
      veteranName: veteranName || null,
      conditionLabel
    })

    exportNotice.value = 'Your personal review PDF should be in your downloads folder.'
    pdfExportDownloadStarted.value = true
  } catch (error) {
    exportError.value = getErrorMessage(error)
  } finally {
    isExportingPdf.value = false
  }
}

async function exportEntriesPdf(conditionKeys: string[]) {
  isExportingPdf.value = true
  exportError.value = ''
  exportNotice.value = ''

  try {
    const conditionLabel = buildExportConditionLabel(conditionKeys)
    const separateFamily = pdfExportSeparateFamily.value && exportSelectedFamilyEntryCount.value > 0
    const includeCharts = pdfExportContentMode.value === 'charts'
    const veteranEntries = separateFamily
      ? resolveExportEntries(conditionKeys, { source: 'veteran' })
      : resolveExportEntries(conditionKeys)
    const familyEntries = separateFamily
      ? resolveExportEntries(conditionKeys, { source: 'family' })
      : []

    if (!veteranEntries.length && !familyEntries.length) {
      exportError.value = 'No entries found for the selected conditions.'
      return
    }

    const profile = await getProfile()
    const veteranName = profile?.full_name?.trim()
      || (typeof user.value?.user_metadata?.full_name === 'string'
        ? user.value.user_metadata.full_name.trim()
        : '')

    const exportEntryIds = [...veteranEntries, ...familyEntries]
      .map((entry) => entry.id)
      .filter((id): id is string => Boolean(id))
    const { listRevisionsForEntries } = useSymptomEntries()
    const revisions = await listRevisionsForEntries(exportEntryIds)
    const revisionGroups = groupRevisionsByEntryId(revisions)
    const entryRevisionsByEntryId = Object.fromEntries(revisionGroups.entries())

    const baseOptions = {
      veteranName: veteranName || null,
      veteranEmail: user.value?.email || null,
      conditionLabel,
      loggingCadence: loggingCadence.value,
      weeklyLogDay: weeklyLogDay.value,
      includeLoggingCharts: includeCharts,
      includeAdvancedCharts: includeCharts && isPro.value,
      entryRevisionsByEntryId
    }

    if (veteranEntries.length) {
      await downloadEntriesPdf(veteranEntries, {
        ...baseOptions,
        reportVariant: separateFamily ? 'veteran' : undefined
      })
    }

    if (familyEntries.length) {
      await downloadEntriesPdf(familyEntries, {
        ...baseOptions,
        reportVariant: 'family',
        includeLoggingCharts: false,
        includeAdvancedCharts: false
      })
    }

    if (separateFamily && veteranEntries.length && familyEntries.length) {
      exportNotice.value = 'Downloaded two PDFs. Check your downloads folder for your veteran logs and the family observations report.'
    } else if (!isPro.value && includeCharts) {
      exportNotice.value = 'PDF downloaded with your entries and weekly symptom counts. Pro adds severity trends and advanced charts. Check your downloads folder.'
    } else if (pdfExportContentMode.value === 'entries-only') {
      exportNotice.value = 'PDF downloaded with summary stats and your entry log. Check your downloads folder.'
    } else {
      exportNotice.value = 'Your PDF should be in your downloads folder.'
    }

    pdfExportDownloadStarted.value = true
  } catch (error) {
    exportError.value = getErrorMessage(error)
  } finally {
    isExportingPdf.value = false
  }
}

async function runPdfExport() {
  if (!canConfirmPdfExport.value) {
    return
  }

  exportError.value = ''
  dismissMonthlyBackupReminder()

  if (pdfExportType.value === 'cp-exam') {
    await exportCpExamPdf(selectedExportConditionKeys.value)
  } else {
    await exportEntriesPdf(selectedExportConditionKeys.value)
  }
}

function conditionKey(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function resolveEntryStatementConditionKey(label: string) {
  const resolved = resolveCatalogConditionByStoredKey(conditionKey(label))
  return resolved?.key || conditionKey(label)
}

function savedEntriesForCondition(label: string) {
  const targetKey = resolveEntryStatementConditionKey(label)
  return savedEntries.value.filter((entry) => {
    const entryKey = resolveCatalogConditionByStoredKey(entry.condition_key || entry.condition_label)?.key
      || conditionKey(entry.condition_label || '')
    return entryKey === targetKey
  })
}

function findSavedConditionStatement(label: string) {
  const matchingEntries = savedEntriesForCondition(label)
    .sort((left, right) => {
      const leftTime = new Date(left.updated_at || left.created_at || left.occurred_at).getTime()
      const rightTime = new Date(right.updated_at || right.created_at || right.occurred_at).getTime()
      return rightTime - leftTime
    })

  for (const entry of matchingEntries) {
    const statement = String(entry.details?.[PDF_CONDITION_STATEMENT_KEY] || '').trim()
    if (statement) {
      return statement
    }
  }

  return ''
}

function prefillConditionStatementForEntry(label = entryTitle.value) {
  if (entryForm.value[PDF_CONDITION_STATEMENT_KEY]?.trim()) {
    return
  }

  const statement = findSavedConditionStatement(label)
  if (statement) {
    entryForm.value[PDF_CONDITION_STATEMENT_KEY] = statement
  }
}

async function refreshTrackedConditions() {
  const entryKeys = [...new Set(savedEntries.value.map((entry) => entry.condition_key).filter(Boolean))]
  await loadTrackedConditions(entryKeys)

  if (needsOnboarding.value) {
    draftSelectedKeys.value = [...trackedConditionKeys.value]
  }
}

async function retryHomeLoad() {
  entriesError.value = ''
  resetTrackedConditionsLoadState()
  resetHomeWorkspaceReady()

  try {
    await refreshTrackedConditions()

    if (user.value) {
      await loadEntries()
    }
  } catch (error) {
    entriesError.value = getErrorMessage(error)
  } finally {
    markHomeWorkspaceReady()
  }
}

function reloadAppPage() {
  if (import.meta.client) {
    window.location.reload()
  }
}

function buildConditionBrowserListOrder(trackedKeys: string[]) {
  const trackedFirst: string[] = []
  const trackedSet = new Set<string>()

  for (const storedKey of trackedKeys) {
    const resolvedKey = resolveCatalogConditionByStoredKey(storedKey)?.key ?? storedKey

    if (!resolvedKey || trackedSet.has(resolvedKey)) {
      continue
    }

    trackedSet.add(resolvedKey)
    trackedFirst.push(resolvedKey)
  }

  const rest = conditionCatalog
    .map((condition) => condition.key)
    .filter((key) => !trackedSet.has(key))

  return [...trackedFirst, ...rest]
}

function openConditionBrowser() {
  draftSelectedKeys.value = [...trackedConditionKeys.value]
  conditionBrowserListOrder.value = buildConditionBrowserListOrder(trackedConditionKeys.value)
  trackedConditionsError.value = ''
  isConditionBrowserOpen.value = true
  collapseHistorySheet()
}

function openConditionBrowserForCustom() {
  openConditionBrowser()
  nextTick(() => {
    conditionBrowserRef.value?.focusCustomConditionInput?.()
  })
}

function toggleDraftCondition(key: string) {
  trackedConditionsError.value = ''

  if (mentalHealthRestrictedKeys.value.includes(key)) {
    trackedConditionsError.value = MENTAL_HEALTH_ONE_CONDITION_MESSAGE
    return
  }

  if (draftSelectedKeys.value.includes(key)) {
    draftSelectedKeys.value = draftSelectedKeys.value.filter((existingKey) => existingKey !== key)
    return
  }

  if (isMentalHealthConditionKey(key)) {
    const existingMentalHealthKey = draftSelectedKeys.value.find((existingKey) => isMentalHealthConditionKey(existingKey))
    if (existingMentalHealthKey && existingMentalHealthKey !== key) {
      trackedConditionsError.value = MENTAL_HEALTH_ONE_CONDITION_MESSAGE
      return
    }
  }

  // Free / demo: one active condition at a time (replace, don't stack).
  if (isDemoMode || !isPro.value) {
    draftSelectedKeys.value = [key]
    return
  }

  draftSelectedKeys.value = [key, ...draftSelectedKeys.value]
}

function resolveTrackedKeysToSave(keys: string[]) {
  if (isDemoMode || !isPro.value) {
    return keys.slice(0, FREE_CONDITION_LIMIT)
  }

  return keys
}

async function syncFreeConditionWithTrackedKeys(keys: string[]) {
  if (isPro.value || !keys.length || !user.value) {
    return
  }

  if (freeConditionKeys.value.length === 0 && savedEntries.value.length === 0) {
    return
  }

  const normalizedKeys = keys
    .map((key) => resolveCatalogConditionByStoredKey(key)?.key ?? key)
    .filter(Boolean)

  if (!normalizedKeys.length) {
    return
  }

  const activeFreeKey = freeConditionKeys.value[0]
  if (activeFreeKey && normalizedKeys.includes(activeFreeKey)) {
    return
  }

  const nextKey = normalizedKeys[0]
  if (!nextKey) {
    return
  }

  if (savedEntries.value.length === 0) {
    await replaceFreeCondition(nextKey, 0)
    return
  }

  if (canReplaceFreeCondition(nextKey, savedEntries.value.length)) {
    await replaceFreeCondition(nextKey, savedEntries.value.length)
  }
}

async function syncHomeConditionsAfterEntrySave(savedConditionKey: string) {
  const key = resolveTrackedConditionKey(savedConditionKey) ?? savedConditionKey.trim()
  if (!key) {
    return
  }

  if (isPro.value) {
    const trackedKeysNormalized = trackedConditionKeys.value.map(
      (storedKey) => resolveTrackedConditionKey(storedKey) ?? storedKey
    )
    if (!trackedKeysNormalized.includes(key)) {
      await updateTrackedConditions([...trackedConditionKeys.value, key])
    }
    return
  }

  if (!canTrackCondition(key)) {
    return
  }

  const trackedKeysNormalized = trackedConditionKeys.value.map(
    (storedKey) => resolveTrackedConditionKey(storedKey) ?? storedKey
  )
  const keyAlreadyRepresented = trackedKeysNormalized.includes(key)

  if (!keyAlreadyRepresented) {
    await updateTrackedConditions([key])
  }
}

function addCustomDraftCondition(label: string) {
  const trimmed = label.trim()
  if (!trimmed) {
    return
  }

  trackedConditionsError.value = ''

  const catalogMatch = conditionCatalog.find((condition) => condition.title.toLowerCase() === trimmed.toLowerCase())
  if (catalogMatch) {
    toggleDraftCondition(catalogMatch.key)
    return
  }

  const key = conditionKeyFromLabel(trimmed)
  if (!key) {
    return
  }

  const catalogByKey = getCatalogConditionByKey(key)
  if (catalogByKey) {
    toggleDraftCondition(catalogByKey.key)
    return
  }

  if (draftSelectedKeys.value.includes(key)) {
    return
  }

  if (isDemoMode || !isPro.value) {
    draftSelectedKeys.value = [key]
    return
  }

  draftSelectedKeys.value = [key, ...draftSelectedKeys.value]
}

async function confirmConditionOnboarding() {
  isSavingTrackedConditions.value = true
  trackedConditionsError.value = ''

  try {
    const keysToSave = resolveTrackedKeysToSave(draftSelectedKeys.value)
    if (!validateDraftMentalHealthSelection(keysToSave)) {
      return
    }
    draftSelectedKeys.value = keysToSave
    await completeOnboarding(keysToSave)
    await syncFreeConditionWithTrackedKeys(keysToSave)
    isConditionBrowserOpen.value = false
  } catch (error) {
    trackedConditionsError.value = getErrorMessage(error)
  } finally {
    isSavingTrackedConditions.value = false
  }
}

async function finishConditionBrowser() {
  isSavingTrackedConditions.value = true
  trackedConditionsError.value = ''

  try {
    const keysToSave = resolveTrackedKeysToSave(draftSelectedKeys.value)
    if (!validateDraftMentalHealthSelection(keysToSave)) {
      return
    }
    draftSelectedKeys.value = keysToSave

    await updateTrackedConditions(keysToSave)
    await syncFreeConditionWithTrackedKeys(keysToSave)
    isConditionBrowserOpen.value = false
  } catch (error) {
    trackedConditionsError.value = getErrorMessage(error)
  } finally {
    isSavingTrackedConditions.value = false
  }
}

async function loadEntries() {
  if (!user.value) {
    savedEntries.value = []
    homeConditionOrderKeys.value = []
    hasLoadedEntriesOnce.value = false
    isSubmissionDropdownOpen.value = false
    lastSeenSubmissionAt.value = ''
    highlightedSubmissionId.value = null
    return
  }

  if (entriesLoadPromise) {
    return entriesLoadPromise
  }

  entriesLoadPromise = (async () => {
    if (!hasLoadedEntriesOnce.value) {
      isLoadingEntries.value = true
    }
    entriesError.value = ''

    try {
      const { listEntries } = useSymptomEntries()
      savedEntries.value = await listEntries()
      syncSubmissionSeenState(savedEntries.value)
      refreshMonthlyBackupReminder()
      await refreshTrackedConditions()
      syncHomeConditionOrderKeys()
    } catch (error) {
      entriesError.value = getErrorMessage(error)
    } finally {
      isLoadingEntries.value = false
      hasLoadedEntriesOnce.value = true
      scheduleLogReminderCheck()
    }
  })()

  try {
    await entriesLoadPromise
  } finally {
    entriesLoadPromise = null
  }
}

function getSubmissionSeenKey() {
  return user.value ? `symptom-tracker-submissions-seen:${user.value.id}` : ''
}

function loadSubmissionSeenState() {
  if (!import.meta.client) {
    return
  }

  const key = getSubmissionSeenKey()
  const legacyKey = user.value ? `symptom-tracker-family-submissions-seen:${user.value.id}` : ''
  lastSeenSubmissionAt.value = key
    ? window.localStorage.getItem(key) || (legacyKey ? window.localStorage.getItem(legacyKey) || '' : '')
    : ''
}

function markSubmissionSeenUpTo(createdAt: string) {
  if (!import.meta.client || !createdAt) {
    return
  }

  const key = getSubmissionSeenKey()
  if (!key) {
    return
  }

  const currentSeenTime = lastSeenSubmissionAt.value
    ? new Date(lastSeenSubmissionAt.value).getTime()
    : 0
  const createdTime = new Date(createdAt).getTime()

  if (createdTime > currentSeenTime) {
    lastSeenSubmissionAt.value = createdAt
    window.localStorage.setItem(key, createdAt)
  }
}

function syncSubmissionSeenState(entries: any[]) {
  loadSubmissionSeenState()

  if (!import.meta.client || !user.value) {
    return
  }

  const key = getSubmissionSeenKey()
  if (!key || lastSeenSubmissionAt.value || !entries.length) {
    return
  }

  const newestCreatedAt = entries
    .map((entry) => entry.created_at || entry.occurred_at)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]

  if (newestCreatedAt) {
    markSubmissionSeenUpTo(newestCreatedAt)
  }
}

function scheduleSubmissionHighlightClear() {
  if (submissionHighlightTimer) {
    clearTimeout(submissionHighlightTimer)
  }

  submissionHighlightTimer = setTimeout(() => {
    highlightedSubmissionId.value = null
  }, submissionHighlightDurationMs)
}

async function scrollHistoryEntryIntoView(entryId: string) {
  await nextTick()

  if (!import.meta.client) {
    return
  }

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

  if (isDesktopLayout.value) {
    await desktopHistoryRef.value?.scrollEntryIntoView(entryId)
    return
  }

  const container = historyScrollEl.value
  const entryElement = container?.querySelector(`[data-entry-id="${entryId}"]`) as HTMLElement | null

  if (!container || !entryElement) {
    return
  }

  const scrollTarget = entryElement.getBoundingClientRect().top
    - container.getBoundingClientRect().top
    + container.scrollTop

  container.scrollTo({
    top: Math.max(0, scrollTarget - 4),
    behavior: 'smooth'
  })
}

function markSubmissionsSeen() {
  if (!import.meta.client) {
    return
  }

  const newestSubmission = submissionNotifications.value[0]
  const key = getSubmissionSeenKey()

  if (!newestSubmission?.createdAt || !key) {
    return
  }

  lastSeenSubmissionAt.value = newestSubmission.createdAt
  window.localStorage.setItem(key, newestSubmission.createdAt)
}

function toggleSubmissionDropdown() {
  const shouldOpen = !isSubmissionDropdownOpen.value
  isSubmissionDropdownOpen.value = shouldOpen

  if (shouldOpen) {
    closeEntryDetailsOverlay()
    collapseHistorySheet()
    markSubmissionsSeen()
  }
}

function closeSubmissionDropdown() {
  isSubmissionDropdownOpen.value = false
}

async function focusSubmission(entryId: string) {
  highlightedSubmissionId.value = entryId
  scheduleSubmissionHighlightClear()

  const submission = submissionNotifications.value.find((item) => item.id === entryId)
  if (submission?.createdAt) {
    markSubmissionSeenUpTo(submission.createdAt)
  }

  isSubmissionDropdownOpen.value = false
  activeHistoryTab.value = 'Entries'

  if (isDesktopLayout.value) {
    await nextTick()
    await scrollHistoryEntryIntoView(entryId)
    return
  }

  const wasCollapsed = !historyExpanded.value
  expandHistorySheet()

  if (wasCollapsed) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 420)
    })
  }
  await scrollHistoryEntryIntoView(entryId)
}

function openSubmissionLogDetails(entryId: string) {
  isSubmissionDropdownOpen.value = false
  const submission = submissionNotifications.value.find((item) => item.id === entryId)
  if (submission?.createdAt) {
    markSubmissionSeenUpTo(submission.createdAt)
  }

  openEntryDetailsOverlay(entryId)
}

async function saveEntry() {
  if (isDemoMode) {
    await saveDemoEntry()
    return
  }

  if (!user.value) {
    entryError.value = 'Please sign in before saving symptom entries.'
    openAuthPanel()
    return
  }

  if (!validateEntryDateTimeStep()) {
    return
  }

  const entryConditionKey = resolveCatalogConditionByStoredKey(conditionKey(entryTitle.value))?.key ?? conditionKey(entryTitle.value)

  if (!isPro.value && !editingEntryId.value && !canTrackCondition(entryConditionKey)) {
    if (canAddFreeCondition(entryConditionKey, savedEntries.value.length)) {
      try {
        await addFreeCondition(entryConditionKey)
      } catch (error) {
        entryError.value = getErrorMessage(error)
        return
      }
    } else if (canReplaceFreeCondition(entryConditionKey, savedEntries.value.length)) {
      try {
        await replaceFreeCondition(entryConditionKey, savedEntries.value.length)
      } catch (error) {
        entryError.value = getErrorMessage(error)
        return
      }
    } else {
      openUpgradePrompt(
        'Free plan: 1 condition',
        `Free lets you pick ${FREE_CONDITION_LIMIT} condition with unlimited entries. Upgrade to Pro for ${PRO_ANNUAL_PRICE_LABEL} to track more conditions, family reporting, and advanced charts in PDF exports.`
      )
      return
    }
  }

  const payload = buildSymptomEntrySavePayload({
    entryTitle: entryTitle.value,
    severity: severityValue.value,
    entryForm: entryForm.value
  })

  if (editingEntryId.value && editingEntrySaveSnapshot.value && symptomEntrySavePayloadsEqual(editingEntrySaveSnapshot.value, payload)) {
    hasActiveDraft.value = false
    closeEntryPanel(true)
    return
  }

  isSavingEntry.value = true
  entryError.value = ''

  try {
    const wasEditing = Boolean(editingEntryId.value)
    const { createEntry, updateEntry, updateEntryWithRevision } = useSymptomEntries()

    let savedEntryId: string | null = null

    if (editingEntryId.value) {
      const editingEntry = savedEntries.value.find((item) => item.id === editingEntryId.value)

      if (editingEntry?.source === 'family') {
        await updateEntry(editingEntryId.value, payload)
      } else if (editingEntrySaveSnapshot.value) {
        await updateEntryWithRevision(editingEntryId.value, editingEntrySaveSnapshot.value, payload)
      } else {
        await updateEntry(editingEntryId.value, payload)
      }
    } else {
      const savedEntry = await createEntry(payload)
      savedEntryId = savedEntry?.id || null
    }

    hasActiveDraft.value = false
    clearPersistedEntryDraft()
    editingEntrySaveSnapshot.value = null
    closeEntryPanel(true)
    await loadEntries()
    await syncHomeConditionsAfterEntrySave(payload.condition_key)
    await loadEntitlements()

    if (!wasEditing && savedEntryId) {
      await focusSubmission(savedEntryId)
    }

    rememberMedicationsFromEntry(
      entryForm.value.medications_for_this_entry,
      user.value?.id,
      payload.condition_key
    )

    showSubmissionToast({
      message: wasEditing ? 'Entry updated.' : 'Entry saved.',
      highlight: wasEditing ? undefined : '+1'
    })
  } catch (error) {
    entryError.value = getErrorMessage(error)
  } finally {
    isSavingEntry.value = false
  }
}

async function archiveEntry(id: string) {
  if (!user.value) {
    entriesError.value = 'Please sign in to manage entries.'
    openAuthPanel()
    return
  }

  entriesError.value = ''

  const entry = savedEntries.value.find((item) => item.id === id)
  if (!entry) {
    return
  }

  try {
    archiveDeletedEntry(user.value.id, entry)

    const { deleteEntry } = useSymptomEntries()
    await deleteEntry(id)
    await loadEntries()

    showSubmissionToast({
      message: 'Moved to Deleted.',
      action: {
        href: '/profile#settings-recovery',
        label: 'Open Recovery'
      }
    })
  } catch (error) {
    entriesError.value = getErrorMessage(error)
    showSubmissionToast({
      message: getErrorMessage(error),
      tone: 'error'
    })
  }
}

function requestDeleteEntry(id: string) {
  const entry = historyEntries.value.find((item) => item.id === id)
  if (!entry) {
    return
  }

  closeAppOverlaysExcept('delete-entry')
  viewedHistoryEntryId.value = null
  isSubmissionDropdownOpen.value = false
  collapseHistorySheet()
  pendingDelete.value = {
    id,
    mode: 'archive',
    title: entry.title
  }
}

function cancelDeleteEntry() {
  pendingDelete.value = null
}

async function confirmDeleteEntry() {
  if (!pendingDelete.value) {
    return
  }

  const { id } = pendingDelete.value
  pendingDelete.value = null
  await archiveEntry(id)
}

function formatHistoryEntryDetailLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatHistoryEntryDetailValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => formatHistoryEntryDetailValue(item))
      .filter(Boolean)
      .join(', ')
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nestedValue]) => {
        const formatted = formatHistoryEntryDetailValue(nestedValue)
        return formatted ? `${formatHistoryEntryDetailLabel(key)}: ${formatted}` : ''
      })
      .filter(Boolean)
      .join(', ')
  }

  return String(value ?? '').trim()
}

function openEntryDetailsOverlay(entryId: string) {
  if (isHistoryEntryActivationLocked()) {
    return
  }

  if (!user.value) {
    openAuthPanel()
    return
  }

  const entry = savedEntries.value.find((item) => item.id === entryId)
  if (!entry) {
    return
  }

  closeAppOverlaysExcept('entry-details')
  isSubmissionDropdownOpen.value = false
  collapseHistorySheet()
  viewedHistoryEntryId.value = entryId
}

function closeEntryDetailsOverlay() {
  viewedHistoryEntryId.value = null
}

function editViewedHistoryEntry() {
  const entryId = viewedHistoryEntryId.value
  if (!entryId) {
    return
  }

  closeEntryDetailsOverlay()
  requestEntryEdit(entryId)
}

function deleteViewedHistoryEntry() {
  const entryId = viewedHistoryEntryId.value
  if (!entryId) {
    return
  }

  closeEntryDetailsOverlay()
  requestDeleteEntry(entryId)
}

function openShareLinkForEntry(entryId: string) {
  if (!user.value) {
    openAuthPanel()
    return
  }

  if (!canUseFamilyReporting.value) {
    openUpgradePrompt(
      'Family reporting is a Pro feature',
      'Create private links so spouses, caregivers, or family can submit signed observations for your claim.'
    )
    return
  }

  const entry = savedEntries.value.find((item) => item.id === entryId)
  if (!entry || entry.source === 'family') {
    return
  }

  closeAppOverlaysExcept('share-link')
  shareLinkEntry.value = entry
  shareLinkLabel.value = ''
  shareLinkCreatedUrl.value = ''
  shareLinkCopied.value = false
  shareLinkError.value = ''
  isShareLinkOpen.value = true
}

function closeShareLinkModal() {
  isShareLinkOpen.value = false
  shareLinkEntry.value = null
  shareLinkLabel.value = ''
  shareLinkCreatedUrl.value = ''
  shareLinkCopied.value = false
  shareLinkError.value = ''
}

type AppOverlayKey =
  | 'auth'
  | 'delete-draft'
  | 'delete-entry'
  | 'entry-details'
  | 'share-link'
  | 'upgrade'
  | 'home-tips'
  | 'condition-slot'
  | 'logging-cadence'
  | 'edit-history-notice'
  | 'entry-edit-locked'

function closeAppOverlaysExcept(keep?: AppOverlayKey) {
  if (keep !== 'auth') {
    setAuthPanelOpen(false)
  }

  if (keep !== 'delete-draft') {
    pendingDeleteDraft.value = false
  }

  if (keep !== 'delete-entry') {
    pendingDelete.value = null
  }

  if (keep !== 'entry-details' && keep !== 'delete-entry') {
    viewedHistoryEntryId.value = null
  }

  if (keep !== 'share-link') {
    closeShareLinkModal()
  }

  if (keep !== 'upgrade') {
    isUpgradePromptOpen.value = false
  }

  if (keep !== 'home-tips') {
    isHomeTipsOverlayOpen.value = false
  }

  if (keep !== 'condition-slot') {
    isConditionSlotOpen.value = false
    pendingEntryPanelOptions.value = null
    pendingConditionSlotKey.value = ''
    pendingConditionSlotLabel.value = ''
    pendingConditionSlotMode.value = 'add'
    pendingConditionSlotLoggedEntryCount.value = 0
    conditionSlotError.value = ''
  }

  if (keep !== 'logging-cadence') {
    isLoggingCadencePromptOpen.value = false
    weeklyLogCaution.value = null
    pendingCadenceEntryOptions.value = null
  }

  if (keep !== 'edit-history-notice') {
    isEditHistoryNoticeOpen.value = false
    pendingEditAfterNoticeEntryId.value = null
  }

  if (keep !== 'entry-edit-locked') {
    isEntryEditLockedOpen.value = false
  }
}

async function createShareLinkForEntry() {
  if (!shareLinkEntry.value) {
    return
  }

  isCreatingShareLink.value = true
  shareLinkError.value = ''

  try {
    const { createSupporterProfile } = useUserProfiles()
    const { token } = await createSupporterProfile({
      link_label: shareLinkLabel.value,
      visible_conditions: [shareLinkEntry.value.condition_label],
      linked_entry_id: shareLinkEntry.value.id,
      entry_context_summary: shareLinkEntry.value.summary || shareLinkEntry.value.condition_label
    })
    shareLinkCreatedUrl.value = `${window.location.origin}/report/${token}`
    shareLinkCopied.value = false
  } catch (error) {
    shareLinkError.value = getErrorMessage(error)
  } finally {
    isCreatingShareLink.value = false
  }
}

async function copyShareLink() {
  if (!shareLinkCreatedUrl.value) {
    return
  }

  const copied = await copyToClipboard(shareLinkCreatedUrl.value)
  shareLinkCopied.value = copied
  if (!copied) {
    shareLinkError.value = 'Could not copy link. Copy it manually.'
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

function openUpgradePrompt(title: string, description: string) {
  closeAppOverlaysExcept('upgrade')
  upgradePromptTitle.value = title
  upgradePromptDescription.value = description
  isUpgradePromptOpen.value = true
}

function closeUpgradePrompt() {
  isUpgradePromptOpen.value = false
}

async function handleUpgradeCheckout() {
  isUpgradeCheckoutLoading.value = true

  try {
    closeUpgradePrompt()
    await router.push('/upgrade?checkout=1')
  } catch (error) {
    exportError.value = getErrorMessage(error)
  } finally {
    isUpgradeCheckoutLoading.value = false
  }
}

function toggleAuthPanel() {
  if (isAuthLoading.value) {
    return
  }

  if (isAuthPanelOpen.value) {
    setAuthPanelOpen(false)
    return
  }

  openAuthPanel()
}

function openAuthPanel() {
  closeAppOverlaysExcept('auth')
  historyExpanded.value = false
  isSubmissionDropdownOpen.value = false
  signupPasswordReveal.hide()
  clearAuthPanelNotice()
  requestSignIn()
}

function clearAuthPanelNotice() {
  if (authPanelNoticeTimer) {
    clearTimeout(authPanelNoticeTimer)
    authPanelNoticeTimer = undefined
  }

  authPanelNotice.value = null
}

function showAuthFeedback(payload: string | SubmissionToastPayload) {
  const normalized = normalizeSubmissionToastPayload(payload)

  if (isAuthPanelOpen.value) {
    clearAuthPanelNotice()
    authPanelNotice.value = normalized

    const durationMs = normalized.durationMs
      ?? (normalized.tone === 'error' ? 5200 : 5200)

    authPanelNoticeTimer = setTimeout(() => {
      authPanelNotice.value = null
      authPanelNoticeTimer = undefined
    }, durationMs)
    return
  }

  showSubmissionToast(normalized)
}

function openHomeTipsOverlay() {
  closeAppOverlaysExcept('home-tips')
  isHomeTipsOverlayOpen.value = true
}

function openLoginFromQuery() {
  if (route.query.login !== '1') {
    return
  }

  clearOAuthFlowMarker()
  authMode.value = 'login'
  authError.value = ''
  authValidationMessage.value = ''
  openAuthPanel()

  void router.replace({ path: '/', query: {} })
}

function openExportFromQuery() {
  if (route.query.export !== '1') {
    return
  }

  selectHistoryTab('Export')

  void router.replace({ path: '/', query: {} })
}

async function onTrackerSignedIn() {
  loadProfileDisplayName()
  loadEntitlements()
  await loadEntries()
  refreshEntryDraftPreview()
}


async function handleAuthSubmit() {
  if (isAuthSubmitting.value) {
    return
  }

  authValidationMessage.value = ''
  authError.value = ''
  clearAuthPanelNotice()

  const validationMessage = validateSignupForm({
    mode: authMode.value,
    name: authName.value,
    email: authEmail.value,
    password: authPassword.value,
    confirmPassword: authConfirmPassword.value
  })

  if (validationMessage) {
    authValidationMessage.value = validationMessage
    return
  }

  isAuthSubmitting.value = true

  try {
    if (authMode.value === 'login') {
      await signIn(authEmail.value, authPassword.value)
      isAuthPanelOpen.value = false
      showSubmissionToast(authSuccessToast('Signed in.'))
    } else {
      const data = await signUp(authEmail.value, authPassword.value, authName.value.trim())

      if (data.session || user.value) {
        isAuthPanelOpen.value = false
        showSubmissionToast(authSuccessToast('Account created. You are signed in.'))
      } else if (data.needsEmailConfirmation || data.user) {
        needsEmailConfirmation.value = true
        refreshCooldown()
        showAuthFeedback(authNoticeToast(AUTH_NOTICES.signupCheckEmail))
        authMode.value = 'login'
      } else {
        showAuthFeedback(authErrorToast('Signup did not return a user. Check Supabase Auth settings and try again.'))
      }
    }
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not sign in. Check your email and password.'),
      authEmail: authEmail.value,
      setValidationMessage: (message) => {
        authValidationMessage.value = message
      },
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showAuthFeedback,
      setNeedsEmailConfirmation: (value) => {
        needsEmailConfirmation.value = value
      },
      setAuthModeLogin: () => {
        authMode.value = 'login'
      }
    })
  } finally {
    isAuthSubmitting.value = false
  }
}

async function handleResendConfirmation() {
  if (isAuthSubmitting.value) {
    return
  }

  authValidationMessage.value = ''
  clearAuthPanelNotice()

  if (!authEmail.value.trim()) {
    authValidationMessage.value = AUTH_VALIDATION.enterEmailForResendConfirmation
    return
  }

  isAuthSubmitting.value = true
  authError.value = ''

  try {
    await resendConfirmationEmail(authEmail.value)
    needsEmailConfirmation.value = true
    refreshCooldown()
    showAuthFeedback(authNoticeToast(AUTH_NOTICES.confirmationEmailSent))
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not resend the confirmation email.'),
      authEmail: authEmail.value,
      setValidationMessage: (message) => {
        authValidationMessage.value = message
      },
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showAuthFeedback
    })
  } finally {
    isAuthSubmitting.value = false
  }
}

async function handleGoogleSignIn() {
  isAuthSubmitting.value = true
  authValidationMessage.value = ''
  clearAuthPanelNotice()

  try {
    await signInWithGoogle()
  } catch {
    if (import.meta.client) {
      window.sessionStorage.removeItem('symptom-tracker-auth-success')
    }
    showAuthFeedback(authErrorToast(resolveAuthApiErrorMessage(authError.value, 'Could not sign in with Google.')))
    authError.value = ''
  } finally {
    isAuthSubmitting.value = false
  }
}

async function handlePasskeySignIn() {
  isAuthSubmitting.value = true
  authValidationMessage.value = ''
  authError.value = ''
  clearAuthPanelNotice()

  try {
    await signInWithPasskey()
    isAuthPanelOpen.value = false
    showSubmissionToast(authSuccessToast('Signed in with your passkey.'))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sign in with a passkey.'

    if (isEmailConfirmationNotice(message)) {
      needsEmailConfirmation.value = true
      showAuthFeedback(authNoticeToast(AUTH_NOTICES.emailConfirmationRequired))
      return
    }

    showAuthFeedback(authErrorToast(message))
  } finally {
    isAuthSubmitting.value = false
  }
}

async function handleForgotPassword() {
  if (isAuthSubmitting.value) {
    return
  }

  authValidationMessage.value = ''
  authError.value = ''
  clearAuthPanelNotice()

  if (!authEmail.value.trim()) {
    authValidationMessage.value = AUTH_VALIDATION.enterEmailForForgotPassword
    return
  }

  isAuthSubmitting.value = true

  try {
    await sendPasswordReset(authEmail.value)
    refreshCooldown()
    showAuthFeedback(authNoticeToast(AUTH_NOTICES.passwordResetSent))
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not send the reset email.'),
      authEmail: authEmail.value,
      setValidationMessage: (message) => {
        authValidationMessage.value = message
      },
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showAuthFeedback
    })
  } finally {
    isAuthSubmitting.value = false
  }
}

async function handleSignOut() {
  isAuthSubmitting.value = true
  authValidationMessage.value = ''

  try {
    await signOut()
    authMode.value = 'login'
    authError.value = ''
    hasActiveDraft.value = false
    closeEntryPanel(true, true)
    refreshEntryDraftPreview()
    openAuthPanel()
  } catch {
    showSubmissionToast(authErrorToast(resolveAuthApiErrorMessage(authError.value, 'Could not sign out.')))
    authError.value = ''
  } finally {
    isAuthSubmitting.value = false
  }
}

function logHomeCondition(condition: HomeCondition) {
  openEntryPanel({
    condition: {
      title: condition.title,
      category: condition.category,
      description: condition.description,
      image: condition.image
    }
  })
}

function selectDesktopConditionByKey(conditionKey: string) {
  const slideIndex = homeConditions.value.findIndex((item) => item.key === conditionKey)
  if (slideIndex >= 0) {
    showSlide(slideIndex + 1)
  }
}

function openDesktopChartsForConditionKey(conditionKey: string) {
  if (!conditionKey) {
    return
  }

  selectDesktopConditionByKey(conditionKey)
  desktopHistoryShowAll.value = false
  desktopChartsShowAllConditions.value = false

  if (isEntryOpen.value) {
    closeEntryPanel(true)
  }

  desktopCenterTab.value = 'charts'
}

function handleDesktopConditionSelect(condition: HomeCondition) {
  selectDesktopConditionByKey(condition.key)
  desktopHistoryShowAll.value = false
  desktopChartsShowAllConditions.value = false

  if (isEntryOpen.value) {
    closeEntryPanel(true)
  }
}

function startDesktopLogEntry() {
  if (activeCondition.value) {
    logHomeCondition(activeCondition.value as HomeCondition)
  }
}

function cancelDesktopEntry() {
  closeEntryPanel(true)
}

function resolveCarouselTransitionDirection(nextIndex: number, currentIndex: number): HomeTransitionDirection {
  if (nextIndex === 0) {
    return 'collapse'
  }

  if (currentIndex === 0) {
    return 'expand'
  }

  return nextIndex > currentIndex ? 'next' : 'previous'
}

function getSlideConditionKey(index: number) {
  return homeConditions.value[index - 1]?.key || ''
}

function resolveSharedHomeTransitionKey(nextIndex: number, currentIndex: number) {
  if (currentIndex === 0 && nextIndex > 0) {
    return getSlideConditionKey(nextIndex)
  }

  if (currentIndex > 0 && nextIndex === 0) {
    return getSlideConditionKey(currentIndex)
  }

  return ''
}

function clearHomeImageOverlay(token: number) {
  if (token !== homeSharedTransitionToken) {
    return
  }

  homeImageTransitionKey.value = ''
  homeImageTransitionImage.value = ''
  homeImageTransitionAlt.value = ''
  homeImageTransitionStyle.value = {}
}

function clearHomeMorphTimers() {
  cancelHomeImageMorphFrame()

  if (homeImageMorphTimer) {
    clearTimeout(homeImageMorphTimer)
    homeImageMorphTimer = undefined
  }

  if (homeHeroTitleRevealTimer) {
    clearTimeout(homeHeroTitleRevealTimer)
    homeHeroTitleRevealTimer = undefined
  }
}

function cancelHomeImageMorphFrame() {
  if (homeImageMorphFrame !== undefined) {
    cancelAnimationFrame(homeImageMorphFrame)
    homeImageMorphFrame = undefined
  }
}

function cleanupHomeSharedTransition(token: number) {
  if (token !== homeSharedTransitionToken) {
    return
  }

  clearHomeChromeRevealTimer()
  clearHomeMorphTimers()
  homeChromeRetreatInstant.value = false
  homeChromeRetreat.value = false
  homeHeroTitleRevealed.value = true
  homeSharedTransitionActive.value = false
  clearHomeImageOverlay(token)

  if (homeSharedTransitionTimer) {
    clearTimeout(homeSharedTransitionTimer)
    homeSharedTransitionTimer = undefined
  }

  if (isHomeOverviewSlide.value) {
    scheduleHomeOverviewLayoutRefresh({ settle: true })
  }
}

function rememberHomeOverviewHeaderHeight() {
  const header = homeCarouselOverviewEl.value?.querySelector('[data-home-overview-header]')

  if (header instanceof HTMLElement && header.offsetHeight > 0) {
    homeOverviewHeaderHeightPx.value = header.offsetHeight
  }
}

function rememberHomeChromeBlockHeight() {
  const chrome = homeCarouselStageEl.value?.querySelector('[data-home-carousel-chrome]')

  if (!(chrome instanceof HTMLElement) || chrome.offsetHeight <= 0) {
    return
  }

  const marginTop = Number.parseFloat(getComputedStyle(chrome).marginTop) || 0
  homeChromeBlockHeightPx.value = Math.ceil(chrome.offsetHeight + marginTop)
}

function updateHomeConditionsMaxScroll() {
  const stage = homeCarouselStageEl.value
  const scrollEl = homeConditionsScrollEl.value

  if (!stage || !scrollEl) {
    return
  }

  rememberHomeChromeBlockHeight()
  rememberHomeOverviewHeaderHeight()

  const stageHeight = stage.getBoundingClientRect().height
  const chromeBlockPx = homeChromeBlockHeightPx.value || 0
  const headerPx = homeOverviewHeaderHeightPx.value || 0
  const listBottomGapPx = 16
  const availableScrollPx = Math.max(0, stageHeight - chromeBlockPx - headerPx - listBottomGapPx)
  const contentHeightPx = scrollEl.scrollHeight

  homeConditionsScrollHeightPx.value = contentHeightPx > availableScrollPx
    ? availableScrollPx
    : 0
}

function scheduleHomeOverviewLayoutRefresh(options: { settle?: boolean } = {}) {
  nextTick(() => {
    if (!isHomeOverviewSlide.value || homeSharedTransitionActive.value) {
      return
    }

    rememberHomeOverviewHeaderHeight()
    rememberHomeChromeBlockHeight()
    updateHomeConditionsMaxScroll()

    if (!import.meta.client) {
      return
    }

    window.requestAnimationFrame(() => {
      if (!isHomeOverviewSlide.value || homeSharedTransitionActive.value) {
        return
      }

      rememberHomeOverviewHeaderHeight()
      rememberHomeChromeBlockHeight()
      updateHomeConditionsMaxScroll()

      window.requestAnimationFrame(() => {
        if (!isHomeOverviewSlide.value || homeSharedTransitionActive.value) {
          return
        }

        rememberHomeOverviewHeaderHeight()
        rememberHomeChromeBlockHeight()
        updateHomeConditionsMaxScroll()
      })
    })

    if (options.settle) {
      window.setTimeout(() => {
        if (!isHomeOverviewSlide.value || homeSharedTransitionActive.value) {
          return
        }

        rememberHomeOverviewHeaderHeight()
        rememberHomeChromeBlockHeight()
        updateHomeConditionsMaxScroll()
      }, 120)
      window.setTimeout(() => {
        if (!isHomeOverviewSlide.value || homeSharedTransitionActive.value) {
          return
        }

        rememberHomeOverviewHeaderHeight()
        rememberHomeChromeBlockHeight()
        updateHomeConditionsMaxScroll()
      }, 320)
    }
  })
}

function clearHomeChromeRevealTimer() {
  if (homeChromeRevealTimer) {
    clearTimeout(homeChromeRevealTimer)
    homeChromeRevealTimer = undefined
  }
}

function scheduleHomeChromeSequence(direction: 'expand' | 'collapse', token: number) {
  clearHomeChromeRevealTimer()
  homeChromeRetreatInstant.value = true
  homeChromeRetreat.value = true

  if (import.meta.client) {
    requestAnimationFrame(() => {
      if (token !== homeSharedTransitionToken) {
        return
      }

      homeChromeRetreatInstant.value = false
    })
  }

  const { heroMs, chromeRevealLeadMs } = HOME_TRANSITION[direction]
  const revealDelayMs = Math.max(0, heroMs - chromeRevealLeadMs)

  homeChromeRevealTimer = setTimeout(() => {
    if (token !== homeSharedTransitionToken) {
      return
    }

    homeChromeRetreat.value = false
    homeChromeRevealTimer = undefined
  }, revealDelayMs)
}

function prefersReducedHomeMotion() {
  return import.meta.client
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function setHomeConditionImageRef(key: string, element: Element | null) {
  if (element instanceof HTMLImageElement) {
    homeConditionImageEls.set(key, element)
    return
  }

  homeConditionImageEls.delete(key)
}

function getHomeHeroTargetRect() {
  const heroRect = homeCarouselHeroEl.value?.getBoundingClientRect()
  if (heroRect) {
    return heroRect
  }

  const stageRect = homeCarouselStageEl.value?.getBoundingClientRect()
  const chromeEl = homeCarouselStageEl.value?.querySelector('[data-home-carousel-chrome]')

  if (!stageRect) {
    return homeCarouselHeroEl.value?.getBoundingClientRect() ?? null
  }

  const chromeHeight = chromeEl instanceof HTMLElement
    ? chromeEl.getBoundingClientRect().height
    : 0

  return new DOMRect(
    stageRect.left,
    stageRect.top,
    stageRect.width,
    Math.max(0, stageRect.height - chromeHeight)
  )
}

function getHomeHeroExpandedTargetRect() {
  const stageRect = homeCarouselStageEl.value?.getBoundingClientRect()
  const chromeEl = homeCarouselStageEl.value?.querySelector('[data-home-carousel-chrome]')

  if (!stageRect) {
    return getHomeHeroTargetRect()
  }

  const chromeHeight = chromeEl instanceof HTMLElement
    ? chromeEl.getBoundingClientRect().height
    : 0

  return new DOMRect(
    stageRect.left,
    stageRect.top,
    stageRect.width,
    Math.max(0, stageRect.height - chromeHeight)
  )
}

function getHomeOverviewThumbnailTargetRect(key: string) {
  const thumbRect = homeConditionImageEls.get(key)?.getBoundingClientRect()
  const scrollEl = homeConditionsScrollEl.value

  if (thumbRect && thumbRect.width > 0 && scrollEl) {
    const scrollRect = scrollEl.getBoundingClientRect()
    const padding = 4
    const isVisible = thumbRect.top >= scrollRect.top - padding
      && thumbRect.bottom <= scrollRect.bottom + padding

    if (isVisible) {
      return thumbRect
    }
  }

  const stageRect = homeCarouselStageEl.value?.getBoundingClientRect()
  const overviewEl = homeCarouselOverviewEl.value
  const headerEl = overviewEl?.querySelector('[data-home-overview-header]')

  if (!stageRect || !(headerEl instanceof HTMLElement)) {
    return null
  }

  const conditionIndex = Math.max(0, homeConditions.value.findIndex((condition) => condition.key === key))
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const thumbnailSize = 4 * rootFontSize
  const rowGap = 0.25 * rootFontSize
  const rowPaddingY = 0.75 * rootFontSize
  const rowHeight = thumbnailSize + (rowPaddingY * 2)
  const scrollTop = homeConditionsScrollEl.value?.scrollTop ?? 0
  const x = stageRect.left + rootFontSize
  const y = stageRect.top + headerEl.offsetHeight + (conditionIndex * (rowHeight + rowGap)) + rowPaddingY - scrollTop

  return new DOMRect(x, y, thumbnailSize, thumbnailSize)
}

function isHomeConditionThumbnailFullyVisible(conditionKey: string) {
  const scrollEl = homeConditionsScrollEl.value
  const thumbEl = homeConditionImageEls.get(conditionKey)

  if (!scrollEl || !thumbEl) {
    return true
  }

  const scrollRect = scrollEl.getBoundingClientRect()
  const thumbRect = thumbEl.getBoundingClientRect()
  const padding = 4

  return thumbRect.top >= scrollRect.top - padding
    && thumbRect.bottom <= scrollRect.bottom + padding
}

async function ensureHomeConditionThumbnailInView(
  conditionKey: string,
  options: { force?: boolean } = {}
) {
  if (!import.meta.client) {
    return
  }

  const scrollEl = homeConditionsScrollEl.value
  const thumbEl = homeConditionImageEls.get(conditionKey)

  if (!scrollEl || !thumbEl) {
    return
  }

  if (!options.force && isHomeConditionThumbnailFullyVisible(conditionKey)) {
    return
  }

  const conditionIndex = homeConditions.value.findIndex((item) => item.key === conditionKey)
  const isLast = conditionIndex === homeConditions.value.length - 1

  if (isLast) {
    scrollEl.scrollTop = scrollEl.scrollHeight
  } else {
    thumbEl.scrollIntoView({
      block: options.force ? 'center' : 'nearest',
      inline: 'nearest',
      behavior: 'auto'
    })
  }

  await nextTick()
  await waitForAnimationFrame()
  await waitForAnimationFrame()
}

const HOME_HERO_RADIUS = '1.75rem'
const HOME_THUMB_RADIUS = '1rem'

function parseHomeRadiusPx(radius: string) {
  if (!import.meta.client) {
    return 16
  }

  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

  if (radius.endsWith('rem')) {
    return Number.parseFloat(radius) * rootFontSize
  }

  return Number.parseFloat(radius)
}

function lerpMorphValue(from: number, to: number, progress: number) {
  return from + ((to - from) * progress)
}

function easeHomeMorph(progress: number) {
  const p = Math.min(1, Math.max(0, progress))
  // Quadratic ease-out — lands cleanly without the end crawl of cubic ease-out
  return 1 - ((1 - p) ** 2)
}

function easeHomeMorphRadius(progress: number) {
  return Math.min(1, easeHomeMorph(progress) / 0.4)
}

/** Corner-anchored box morph — not uniform rect lerp (which drags top edges downward). */
function interpolateMorphRect(
  from: DOMRect,
  to: DOMRect,
  moveProgress: number,
  direction: 'expand' | 'collapse'
) {
  if (direction === 'expand') {
    // Top-left pinned early: grow up + right from thumbnail corner, then travel to hero slot
    const sizeProgress = easeHomeMorph(Math.min(1, moveProgress / 0.58))
    const positionProgress = easeHomeMorph(Math.max(0, (moveProgress - 0.24) / 0.76))

    return {
      left: lerpMorphValue(from.left, to.left, positionProgress),
      top: lerpMorphValue(from.top, to.top, positionProgress),
      width: lerpMorphValue(from.width, to.width, sizeProgress),
      height: lerpMorphValue(from.height, to.height, sizeProgress)
    }
  }

  // Collapse: bottom-right corner leads — shrink up-left into list thumbnail
  const width = lerpMorphValue(from.width, to.width, moveProgress)
  const height = lerpMorphValue(from.height, to.height, moveProgress)
  const right = lerpMorphValue(from.right, to.right, moveProgress)
  const bottom = lerpMorphValue(from.bottom, to.bottom, moveProgress)

  return {
    left: right - width,
    top: bottom - height,
    width,
    height
  }
}

function getLiveMorphTargetRect(
  direction: 'expand' | 'collapse',
  conditionKey: string,
  fallback: DOMRect
) {
  if (direction === 'expand') {
    const heroRect = homeCarouselHeroEl.value?.getBoundingClientRect()

    if (heroRect && heroRect.width > 0 && heroRect.height > 4) {
      return heroRect
    }

    return getHomeHeroExpandedTargetRect() ?? fallback
  }

  const thumbRect = homeConditionImageEls.get(conditionKey)?.getBoundingClientRect()

  if (thumbRect && thumbRect.width > 0) {
    return thumbRect
  }

  return getHomeOverviewThumbnailTargetRect(conditionKey) ?? fallback
}

function getHomeImageMorphStartStyle(fromRect: DOMRect, direction: 'expand' | 'collapse') {
  const fromRadius = direction === 'expand' ? HOME_THUMB_RADIUS : HOME_HERO_RADIUS

  return {
    left: `${fromRect.left}px`,
    top: `${fromRect.top}px`,
    width: `${fromRect.width}px`,
    height: `${fromRect.height}px`,
    transform: 'none',
    borderRadius: fromRadius,
    transition: 'none'
  }
}

function runHomeImageMorphRaf(
  fromRect: DOMRect,
  toRect: DOMRect,
  direction: 'expand' | 'collapse',
  conditionKey: string,
  token: number
) {
  clearHomeMorphTimers()

  const durationMs = getHomeHeroTransitionMs(direction)
  const fromRadiusPx = parseHomeRadiusPx(direction === 'expand' ? HOME_THUMB_RADIUS : HOME_HERO_RADIUS)
  const toRadiusPx = parseHomeRadiusPx(direction === 'expand' ? HOME_HERO_RADIUS : HOME_THUMB_RADIUS)
  const startedAt = performance.now()

  homeHeroTitleRevealTimer = setTimeout(() => {
    if (token !== homeSharedTransitionToken) {
      return
    }

    homeHeroTitleRevealed.value = true
    homeHeroTitleRevealTimer = undefined
  }, Math.max(0, durationMs - 160))

  function resolveMorphTarget() {
    return getLiveMorphTargetRect(direction, conditionKey, toRect)
  }

  function applyMorphBox(target: DOMRect, moveProgress: number, radiusProgress: number) {
    const box = interpolateMorphRect(fromRect, target, moveProgress, direction)

    homeImageTransitionStyle.value = {
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
      transform: 'none',
      borderRadius: `${lerpMorphValue(fromRadiusPx, toRadiusPx, radiusProgress)}px`,
      transition: 'none'
    }
  }

  function tick(now: number) {
    if (token !== homeSharedTransitionToken) {
      return
    }

    const rawProgress = Math.min(1, (now - startedAt) / durationMs)
    const moveProgress = easeHomeMorph(rawProgress)
    const radiusProgress = easeHomeMorphRadius(rawProgress)
    const target = resolveMorphTarget()

    applyMorphBox(target, moveProgress, radiusProgress)

    if (rawProgress < 1) {
      homeImageMorphFrame = requestAnimationFrame(tick)
      return
    }

    applyMorphBox(target, 1, 1)
    clearHomeImageOverlay(token)
    homeImageMorphFrame = undefined
  }

  homeImageMorphFrame = requestAnimationFrame(tick)
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

async function animateHomeSlideChange(nextIndex: number, sharedConditionKey: string) {
  const token = homeSharedTransitionToken + 1
  homeSharedTransitionToken = token

  if (homeSharedTransitionTimer) {
    clearTimeout(homeSharedTransitionTimer)
    homeSharedTransitionTimer = undefined
  }

  clearHomeChromeRevealTimer()
  clearHomeMorphTimers()

  const currentIndex = activeIndex.value
  const isExpandingFromOverview = currentIndex === 0 && nextIndex > 0
  const isCollapsingToOverview = currentIndex > 0 && nextIndex === 0
  const collapseHeroSourceRect = isCollapsingToOverview
    ? homeCarouselHeroEl.value?.getBoundingClientRect()
    : null

  if (!sharedConditionKey || !import.meta.client || prefersReducedHomeMotion()) {
    homeChromeRetreat.value = false
    homeHeroTitleRevealed.value = true
    activeIndex.value = nextIndex
    cleanupHomeSharedTransition(token)
    return
  }

  homeHeroTitleRevealed.value = false

  const condition = homeConditions.value.find((item) => item.key === sharedConditionKey)
  const sharedDirection: 'expand' | 'collapse' = isCollapsingToOverview ? 'collapse' : 'expand'
  const transitionTiming = HOME_TRANSITION[sharedDirection]

  if (isCollapsingToOverview) {
    rememberHomeChromeBlockHeight()
    updateHomeConditionsMaxScroll()
    homeSharedTransitionActive.value = true
    activeIndex.value = nextIndex
    await nextTick()
    rememberHomeOverviewHeaderHeight()
    updateHomeConditionsMaxScroll()
    scheduleHomeChromeSequence(sharedDirection, token)
    await ensureHomeConditionThumbnailInView(sharedConditionKey, { force: true })
    await waitForAnimationFrame()
    await waitForAnimationFrame()

    if (token !== homeSharedTransitionToken || !collapseHeroSourceRect || !condition) {
      return
    }

    const targetRect = getHomeOverviewThumbnailTargetRect(sharedConditionKey)

    if (!targetRect) {
      homeChromeRetreat.value = false
      cleanupHomeSharedTransition(token)
      return
    }

    homeImageTransitionKey.value = sharedConditionKey
    homeImageTransitionImage.value = condition.image
    homeImageTransitionAlt.value = condition.title
    homeImageTransitionStyle.value = getHomeImageMorphStartStyle(collapseHeroSourceRect, sharedDirection)

    await nextTick()
    await waitForAnimationFrame()

    if (token !== homeSharedTransitionToken) {
      return
    }

    runHomeImageMorphRaf(collapseHeroSourceRect, targetRect, sharedDirection, sharedConditionKey, token)
    homeSharedTransitionTimer = setTimeout(
      () => cleanupHomeSharedTransition(token),
      transitionTiming.heroMs + transitionTiming.chromeInMs + 32
    )
    return
  }

  homeSharedTransitionActive.value = true
  scheduleHomeChromeSequence(sharedDirection, token)

  if (isExpandingFromOverview) {
    await ensureHomeConditionThumbnailInView(sharedConditionKey)
  }

  const sourceRect = currentIndex === 0
    ? homeConditionImageEls.get(sharedConditionKey)?.getBoundingClientRect()
    : homeCarouselHeroEl.value?.getBoundingClientRect()

  if (!sourceRect || !condition) {
    homeChromeRetreat.value = false
    activeIndex.value = nextIndex
    cleanupHomeSharedTransition(token)
    return
  }

  // Show the flying image at the thumbnail/hero rect before the grid morph runs.
  homeImageTransitionKey.value = sharedConditionKey
  homeImageTransitionImage.value = condition.image
  homeImageTransitionAlt.value = condition.title
  homeImageTransitionStyle.value = getHomeImageMorphStartStyle(sourceRect, sharedDirection)

  await nextTick()
  await waitForAnimationFrame()

  if (token !== homeSharedTransitionToken) {
    return
  }

  activeIndex.value = nextIndex
  await nextTick()
  await waitForAnimationFrame()

  if (token !== homeSharedTransitionToken) {
    return
  }

  const targetRect = currentIndex === 0
    ? (isExpandingFromOverview ? getHomeHeroExpandedTargetRect() : getHomeHeroTargetRect())
    : homeConditionImageEls.get(sharedConditionKey)?.getBoundingClientRect()

  if (!targetRect) {
    homeChromeRetreat.value = false
    cleanupHomeSharedTransition(token)
    return
  }

  runHomeImageMorphRaf(sourceRect, targetRect, sharedDirection, sharedConditionKey, token)
  homeSharedTransitionTimer = setTimeout(
    () => cleanupHomeSharedTransition(token),
    transitionTiming.heroMs + transitionTiming.chromeInMs + 32
  )
}

function showConditionSlide(index: number, options: { clearSelectedSearchCondition?: boolean } = {}) {
  const lastIndex = homeConditions.value.length

  if (index === activeIndex.value || index < 0 || index > lastIndex) {
    return
  }

  const currentIndex = activeIndex.value
  const sharedKey = resolveSharedHomeTransitionKey(index, currentIndex)

  if (!sharedKey) {
    clearHomeChromeRevealTimer()
    homeChromeRetreat.value = false
  }

  if (options.clearSelectedSearchCondition) {
    selectedSearchCondition.value = null
  }

  closeEntryPanel()
  transitionDirection.value = resolveCarouselTransitionDirection(index, currentIndex)
  void animateHomeSlideChange(index, resolveSharedHomeTransitionKey(index, currentIndex))
}

function openHomeOverview() {
  if (isHomeOverviewSlide.value) {
    return
  }

  showSlide(0)
}

function showPreviousCondition() {
  if (!homeConditions.value.length) {
    return
  }

  const lastIndex = homeConditions.value.length
  const currentIndex = activeIndex.value
  const nextIndex = currentIndex === 0 ? 1 : currentIndex - 1

  showConditionSlide(nextIndex)
}

function showNextCondition() {
  if (!homeConditions.value.length) {
    return
  }

  const lastIndex = homeConditions.value.length
  const currentIndex = activeIndex.value
  const nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1

  showConditionSlide(nextIndex)
}

function showSlide(index: number) {
  showConditionSlide(index, { clearSelectedSearchCondition: true })
}

function focusHomeConditionByKey(conditionKey: string) {
  const resolvedKey = resolveCatalogConditionByStoredKey(conditionKey)?.key ?? conditionKey
  const conditionIndex = homeConditions.value.findIndex((condition) => condition.key === resolvedKey)

  if (conditionIndex < 0) {
    return
  }

  showConditionSlide(conditionIndex + 1)
}

function handleCancelEntry() {
  if (
    isMeaningfulEntryDraft({
      entryStep: entryStep.value,
      entryForm: entryForm.value,
      selectedSearchCondition: selectedSearchCondition.value,
      customConditionInput: customConditionInput.value
    })
  ) {
    closeEntryPanel()
    return
  }

  closeEntryPanel(true)
}

function startEntryFromCurrentSlide() {
  if (
    suppressConditionTap
    || !isConditionSlideEntryEnabled.value
    || isHomeOverviewSlide.value
    || isHistoryEntryActivationLocked()
  ) {
    return
  }

  const condition = activeCondition.value
  if (!condition) {
    return
  }

  logHomeCondition(condition)
}

function startEntryFromOverview() {
  if (isHistoryEntryActivationLocked()) {
    return
  }

  const condition = homeConditions.value.find((item) => !isConditionLogLocked(item.key))
    ?? homeConditions.value[0]

  if (!condition) {
    openConditionBrowser()
    return
  }

  logHomeCondition(condition)
}

function changeEntryCondition(condition: { title: string, category: string, description: string, image: string }) {
  if (condition.title === entryTitle.value) {
    isConditionPickerOpen.value = false
    return
  }

  selectedSearchCondition.value = condition
  editingEntryConditionLabel.value = null

  if (entryForm.value.condition_name) {
    delete entryForm.value.condition_name
  }

  customConditionInput.value = ''
  entryStep.value = 0
  isConditionPickerOpen.value = false
  prefillConditionStatementForEntry(condition.title)

  const medicationKey = fieldKey('Medications for this entry')
  delete entryForm.value[medicationKey]

  if (!isPro.value && !editingEntryId.value) {
    void ensureFreeConditionAccess(
      conditionKeyFromLabel(condition.title),
      condition.title,
      null
    )
  }
}

function applyCustomEntryCondition() {
  const customName = customConditionInput.value.trim()
  if (!customName) {
    return
  }

  if (customName === entryTitle.value && !selectedSearchCondition.value) {
    isConditionPickerOpen.value = false
    return
  }

  selectedSearchCondition.value = null
  editingEntryConditionLabel.value = null
  entryForm.value.condition_name = customName
  entryStep.value = 0
  isConditionPickerOpen.value = false
  prefillConditionStatementForEntry(customName)

  const medicationKey = fieldKey('Medications for this entry')
  delete entryForm.value[medicationKey]

  if (!isPro.value && !editingEntryId.value) {
    void ensureFreeConditionAccess(
      conditionKeyFromLabel(customName),
      customName,
      null
    )
  }
}

function toggleConditionPicker() {
  isConditionPickerOpen.value = !isConditionPickerOpen.value

  if (isConditionPickerOpen.value) {
    customConditionInput.value = selectedSearchCondition.value
      ? ''
      : (entryForm.value.condition_name?.trim() || '')
    debouncedCustomConditionPreview.value = customConditionInput.value
    return
  }

  customConditionInput.value = ''
  debouncedCustomConditionPreview.value = ''
}

function selectSearchCondition(condition: { title: string, category: string, description: string, image: string }) {
  openEntryPanel({ condition })
}

function expandHistorySheet() {
  viewedHistoryEntryId.value = null
  isSubmissionDropdownOpen.value = false

  if (!historyExpanded.value) {
    historyPanelAnimating.value = true
    blockConditionSlideEntry(HISTORY_TRANSITION_LOCK_MS)
    historyExpanded.value = true
    lockHistoryTransition()
  }
}

function collapseHistorySheet() {
  if (!historyExpanded.value) {
    return
  }

  historyPanelAnimating.value = true
  historyExpanded.value = false
  historyScrollEl.value?.scrollTo({ top: 0 })
  lockHistoryTransition()
}

function selectHistoryTab(tab: string) {
  if (tab === 'Export') {
    lockHistoryEntryActivation()
    blockConditionSlideEntry(HISTORY_ENTRY_ACTIVATION_LOCK_MS)

    if (!historyExpanded.value) {
      expandHistorySheet()
    }

    ensureExportConditionSelection()
    openPdfExportOverlay()
    return
  }

  if (activeHistoryTab.value === tab && historyExpanded.value) {
    return
  }

  lockHistoryEntryActivation()
  blockConditionSlideEntry(HISTORY_ENTRY_ACTIVATION_LOCK_MS)

  if (!historyExpanded.value) {
    expandHistorySheet()
  }

  activeHistoryTab.value = tab
}

const HISTORY_DRAG_ACTIVATE_PX = 8
const HISTORY_DRAG_SNAP_PX = 32
const HISTORY_TRANSITION_LOCK_MS = 650

let historyTransitionLockUntil = 0

function lockHistoryTransition(durationMs = HISTORY_TRANSITION_LOCK_MS) {
  historyTransitionLockUntil = Date.now() + durationMs
}

function isHistoryTransitionLocked() {
  return Date.now() < historyTransitionLockUntil
}

let historyPointerId: number | null = null
let historyPointerStartY = 0
let historyPointerDeltaY = 0
let historyPointerStartedOnInteractive = false
let historyPointerDidChangeState = false

function resetHistoryPointer() {
  historyPointerId = null
  historyPointerStartY = 0
  historyPointerDeltaY = 0
  historyPointerStartedOnInteractive = false
  historyPointerDidChangeState = false
}

function handleHistoryPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }

  const target = event.target as HTMLElement

  historyPointerStartedOnInteractive = Boolean(
    target.closest('[data-history-interactive]')
  )

  if (historyPointerStartedOnInteractive) {
    return
  }

  if (historyExpanded.value && historyScrollEl.value?.contains(target)) {
    return
  }

  historyPointerId = event.pointerId
  historyPointerStartY = event.clientY
  historyPointerDeltaY = 0
  historyPointerDidChangeState = false
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function handleHistoryPointerMove(event: PointerEvent) {
  if (historyPointerId !== event.pointerId || historyPointerStartedOnInteractive) {
    return
  }

  historyPointerDeltaY = historyPointerStartY - event.clientY

  if (!historyExpanded.value && historyPointerDeltaY > HISTORY_DRAG_ACTIVATE_PX) {
    expandHistorySheet()
    historyPointerDidChangeState = true
  }

  if (
    historyExpanded.value
    && historyPointerDeltaY < -HISTORY_DRAG_ACTIVATE_PX
    && (historyScrollEl.value?.scrollTop ?? 0) <= 0
  ) {
    collapseHistorySheet()
    historyPointerDidChangeState = true
  }
}

function handleHistoryPointerUp(event: PointerEvent) {
  if (historyPointerId !== event.pointerId) {
    return
  }

  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture?.(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }

  if (!historyPointerStartedOnInteractive) {
    const delta = historyPointerDeltaY

    if (Math.abs(delta) < HISTORY_DRAG_ACTIVATE_PX) {
      if (!historyPointerDidChangeState) {
        lockHistoryEntryActivation()
        blockConditionSlideEntry(HISTORY_ENTRY_ACTIVATION_LOCK_MS)
        if (historyExpanded.value) {
          collapseHistorySheet()
        } else {
          expandHistorySheet()
        }
      }
    } else if (delta > HISTORY_DRAG_SNAP_PX) {
      lockHistoryEntryActivation()
      blockConditionSlideEntry(HISTORY_ENTRY_ACTIVATION_LOCK_MS)
      expandHistorySheet()
    } else if (delta < -HISTORY_DRAG_SNAP_PX) {
      lockHistoryEntryActivation()
      blockConditionSlideEntry(HISTORY_ENTRY_ACTIVATION_LOCK_MS)
      collapseHistorySheet()
    }
  }

  resetHistoryPointer()
}

function handleHistoryPointerCancel() {
  resetHistoryPointer()
}

function handleHistoryPanelTransitionEnd(event: TransitionEvent) {
  if (event.target !== event.currentTarget || event.propertyName !== 'height') {
    return
  }

  historyPanelAnimating.value = false
}

let conditionSwipeStartX = 0
let conditionSwipeStartY = 0
let conditionSwipeAxis: 'horizontal' | 'vertical' | null = null
let suppressConditionTap = false
let conditionSwipeStartedInScrollList = false
let historyEntryActivationLockUntil = 0
const HISTORY_ENTRY_ACTIVATION_LOCK_MS = 450

function blockConditionSlideEntry(durationMs = HISTORY_ENTRY_ACTIVATION_LOCK_MS) {
  conditionSlideEntryBlocked.value = true

  if (conditionSlideEntryBlockedTimer) {
    clearTimeout(conditionSlideEntryBlockedTimer)
  }

  conditionSlideEntryBlockedTimer = setTimeout(() => {
    conditionSlideEntryBlocked.value = historyExpanded.value
    conditionSlideEntryBlockedTimer = undefined
  }, durationMs)
}

function lockHistoryEntryActivation() {
  historyEntryActivationLockUntil = Date.now() + HISTORY_ENTRY_ACTIVATION_LOCK_MS
}

function isHistoryEntryActivationLocked() {
  return Date.now() < historyEntryActivationLockUntil
}

function suppressConditionTapBriefly() {
  suppressConditionTap = true
  blockConditionSlideEntry(320)
  window.setTimeout(() => {
    suppressConditionTap = false
  }, 320)
}

function handleConditionSwipeStart(event: TouchEvent) {
  if (isDesktopLayout.value || showConditionBrowser.value || isEntryOpen.value) {
    return
  }

  const target = event.target as HTMLElement
  conditionSwipeStartedInScrollList = Boolean(target.closest('[data-home-conditions-scroll]'))
  conditionSwipeStartX = event.touches[0]?.clientX ?? 0
  conditionSwipeStartY = event.touches[0]?.clientY ?? 0
  conditionSwipeAxis = null
  suppressConditionTap = false
}

function handleConditionSwipeEnd(event: TouchEvent) {
  if (isDesktopLayout.value || showConditionBrowser.value || isEntryOpen.value) {
    return
  }

  const touch = event.changedTouches[0]
  if (!touch) {
    return
  }

  const deltaX = touch.clientX - conditionSwipeStartX
  const deltaY = conditionSwipeStartY - touch.clientY

  if (!conditionSwipeAxis) {
    if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
      return
    }

    conditionSwipeAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
  }

  if (conditionSwipeAxis === 'horizontal') {
    if (Math.abs(deltaX) >= 50) {
      suppressConditionTapBriefly()

      if (deltaX < -50) {
        showNextCondition()
      } else if (deltaX > 50) {
        showPreviousCondition()
      }
    }
    conditionSwipeStartedInScrollList = false
    return
  }

  if (
    deltaY > 36
    && !historyExpanded.value
    && !isHomeOverviewSlide.value
    && !conditionSwipeStartedInScrollList
    && !isConditionScrolling.value
  ) {
    lockHistoryEntryActivation()
    suppressConditionTapBriefly()
    expandHistorySheet()
  }

  conditionSwipeStartedInScrollList = false
}

let historyTabSwipeStartX = 0

function handleHistoryTabSwipeStart(event: TouchEvent) {
  if (isDesktopLayout.value) {
    return
  }

  historyTabSwipeStartX = event.touches[0]?.clientX ?? 0
}

function handleHistoryTabSwipeEnd(event: TouchEvent) {
  if (isDesktopLayout.value) {
    return
  }

  const touch = event.changedTouches[0]
  if (!touch) {
    return
  }

  const deltaX = touch.clientX - historyTabSwipeStartX

  if (Math.abs(deltaX) < 40) {
    return
  }

  const currentIndex = historyTabs.indexOf(activeHistoryTab.value)

  if (deltaX < 0 && currentIndex < historyTabs.length - 1) {
    selectHistoryTab(historyTabs[currentIndex + 1])
    return
  }

  if (deltaX > 0 && currentIndex > 0) {
    selectHistoryTab(historyTabs[currentIndex - 1])
  }
}

function handleConditionScroll() {
  isConditionScrolling.value = true

  if (conditionScrollTimer) {
    clearTimeout(conditionScrollTimer)
  }

  conditionScrollTimer = setTimeout(() => {
    isConditionScrolling.value = false
  }, 350)

  if (historyExpanded.value && !isHistoryTransitionLocked()) {
    collapseHistorySheet()
  }
}

function handleConditionWheel() {
  if (historyExpanded.value) {
    collapseHistorySheet()
  }
}

function handleConditionTouchMove(event: TouchEvent) {
  if (isDesktopLayout.value || showConditionBrowser.value || isEntryOpen.value) {
    return
  }

  const touch = event.touches[0]
  if (!touch) {
    return
  }

  const deltaX = touch.clientX - conditionSwipeStartX
  const deltaY = touch.clientY - conditionSwipeStartY

  if (!conditionSwipeAxis && (Math.abs(deltaX) > 12 || Math.abs(deltaY) > 12)) {
    conditionSwipeAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
  }

  if (historyExpanded.value && Math.abs(deltaY) > 8) {
    collapseHistorySheet()
  }
}

function handleHistoryScroll(event: Event) {
  const target = event.target as HTMLElement

  if (!historyExpanded.value && target.scrollTop > 2) {
    expandHistorySheet()
  }
}

function handleHistoryWheel(event: WheelEvent) {
  if (!historyExpanded.value && event.deltaY > 0) {
    expandHistorySheet()
    return
  }

  if (historyExpanded.value && event.deltaY < 0 && (historyScrollEl.value?.scrollTop ?? 0) <= 0) {
    collapseHistorySheet()
  }
}

function resolvePendingEntryConditionKey(options: {
  prefillCustomCondition?: string
  condition?: { title: string }
} = {}) {
  if (options.condition?.title) {
    return conditionKey(options.condition.title)
  }

  if (options.prefillCustomCondition) {
    return conditionKey(options.prefillCustomCondition)
  }

  return ''
}

function resolveEntryConditionLabel(label: string) {
  const normalizedLabel = normalizeConditionLabel(label)
  const searchMatch = conditionResults.find((condition) => condition.title === normalizedLabel)
  if (searchMatch) {
    return {
      searchCondition: searchMatch,
      conditionLabel: null as string | null,
      customName: null as string | null
    }
  }

  if (normalizedLabel in entryFieldsByCondition) {
    return {
      searchCondition: null,
      conditionLabel: normalizedLabel,
      customName: null
    }
  }

  return {
    searchCondition: null,
    conditionLabel: null,
    customName: normalizedLabel
  }
}

function populateEntryFormFromRecord(entry: Record<string, any>) {
  const details = {
    ...(entry.details || {})
  } as Record<string, string>

  if (entry.summary && !details.what_happened) {
    details.what_happened = entry.summary
  }

  if (entry.impact && !details.daily_impact) {
    details.daily_impact = entry.impact
  }

  if (!details.date_and_time && entry.occurred_at) {
    details.date_and_time = toLocalDateTimeInputValue(new Date(entry.occurred_at))
  }

  entryForm.value = details
  severityValue.value = entry.severity ?? 5
  syncEntryInputsFromForm()
  entryTimeWasManuallySelected = true
}

function openDesktopHistoryExport() {
  ensureExportConditionSelection()
  openPdfExportOverlay()
}

function openClaimBuilder() {
  if (!import.meta.client) return
  const config = useRuntimeConfig()
  window.open(
    buildClaimBuilderUrl({ claimBuilderUrl: config.public.claimBuilderUrl }),
    '_blank',
    'noopener,noreferrer'
  )
}

function openLayReportingSettings() {
  if (!user.value) {
    toggleAuthPanel()
    return
  }

  if (isEmbeddedPreview) {
    openEmbedProfile()
    return
  }

  openSettingsPanel({
    expanded: !isDesktopLayout.value,
    section: 'settings-supporters'
  })
}

function handleNotificationStatusClick() {
  if (!user.value) {
    toggleAuthPanel()
    return
  }

  if (isEmbeddedPreview) {
    openEmbedProfile()
    return
  }

  openSettingsPanel({
    expanded: isMobileLayout.value,
    section: 'settings-reminders'
  })
}

function requestEntryEdit(entryId: string) {
  if (isHistoryEntryActivationLocked()) {
    return
  }

  if (needsAppWelcome.value) {
    return
  }

  if (!user.value) {
    openAuthPanel()
    return
  }

  const entry = savedEntries.value.find((item) => item.id === entryId)
  if (!entry) {
    return
  }

  if (entry.source === 'family') {
    openEntryForEdit(entryId)
    return
  }

  if (isEntryEditLocked(entry.edit_count)) {
    closeAppOverlaysExcept('entry-edit-locked')
    isEntryEditLockedOpen.value = true
    return
  }

  if (!hasAcknowledgedEditHistoryNotice(user.value.id)) {
    pendingEditAfterNoticeEntryId.value = entryId
    closeAppOverlaysExcept('edit-history-notice')
    isEditHistoryNoticeOpen.value = true
    return
  }

  openEntryForEdit(entryId)
}

function pendingEditRemainingEdits() {
  const entryId = pendingEditAfterNoticeEntryId.value
  if (!entryId) {
    return MAX_ENTRY_EDITS
  }

  const entry = savedEntries.value.find((item) => item.id === entryId)
  return getRemainingEntryEdits(entry?.edit_count)
}

function closeEditHistoryNotice() {
  isEditHistoryNoticeOpen.value = false
  pendingEditAfterNoticeEntryId.value = null
}

function confirmEditHistoryNotice() {
  if (!user.value?.id) {
    closeEditHistoryNotice()
    return
  }

  acknowledgeEditHistoryNotice(user.value.id)
  const entryId = pendingEditAfterNoticeEntryId.value
  isEditHistoryNoticeOpen.value = false
  pendingEditAfterNoticeEntryId.value = null

  if (entryId) {
    openEntryForEdit(entryId)
  }
}

function closeEntryEditLockedOverlay() {
  isEntryEditLockedOpen.value = false
}

function openEntryForEdit(entryId: string) {
  if (isHistoryEntryActivationLocked()) {
    return
  }

  if (needsAppWelcome.value) {
    return
  }

  if (!user.value) {
    openAuthPanel()
    return
  }
  const entry = savedEntries.value.find((item) => item.id === entryId)
  if (!entry) {
    return
  }

  const resolved = resolveEntryConditionLabel(entry.condition_label)
  editingEntryId.value = entryId
  editingEntryConditionLabel.value = resolved.conditionLabel
  selectedSearchCondition.value = resolved.searchCondition
  customConditionInput.value = ''
  debouncedCustomConditionPreview.value = ''
  isConditionPickerOpen.value = false
  historyExpanded.value = false
  if (!isDesktopLayout.value) {
    transitionDirection.value = 'expand'
  }
  entryStep.value = 0
  entryError.value = ''
  hasActiveDraft.value = true
  isEntryOpen.value = true

  entryForm.value = {}
  severityValue.value = 5
  entryTimeWasManuallySelected = false
  populateEntryFormFromRecord(entry)

  if (resolved.customName) {
    entryForm.value.condition_name = resolved.customName
  }

  const entryTitleForSnapshot = resolved.searchCondition?.title
    ?? resolved.conditionLabel
    ?? resolved.customName
    ?? normalizeConditionLabel(entry.condition_label)

  editingEntrySaveSnapshot.value = buildSymptomEntrySavePayloadFromRecord(
    entry,
    entryTitleForSnapshot,
    { customName: resolved.customName }
  )
}

function openConditionSlotModal(options: {
  conditionKey: string
  conditionLabel: string
  mode: 'add' | 'replace'
  loggedEntryCount: number
  entryPanelOptions?: {
    prefillCustomCondition?: string
    condition?: {
      title: string
      category: string
      description: string
      image: string
    }
  } | null
}) {
  closeAppOverlaysExcept('condition-slot')
  pendingEntryPanelOptions.value = options.entryPanelOptions ?? null
  pendingConditionSlotKey.value = options.conditionKey
  pendingConditionSlotLabel.value = options.conditionLabel
  pendingConditionSlotMode.value = options.mode
  pendingConditionSlotLoggedEntryCount.value = options.loggedEntryCount
  conditionSlotError.value = ''
  isConditionSlotOpen.value = true
}

async function ensureFreeConditionAccess(
  conditionKey: string,
  conditionLabel: string,
  entryPanelOptions: {
    prefillCustomCondition?: string
    condition?: {
      title: string
      category: string
      description: string
      image: string
    }
  } | null = null
) {
  if (isPro.value || canTrackCondition(conditionKey)) {
    return true
  }

  if (!hasLoadedEntriesOnce.value) {
    await loadEntries()
  }

  const loggedEntryCount = savedEntries.value.length

  if (canAddFreeCondition(conditionKey, loggedEntryCount)) {
    openConditionSlotModal({
      conditionKey,
      conditionLabel,
      mode: 'add',
      loggedEntryCount,
      entryPanelOptions
    })
    return false
  }

  if (canReplaceFreeCondition(conditionKey, loggedEntryCount)) {
    openConditionSlotModal({
      conditionKey,
      conditionLabel,
      mode: 'replace',
      loggedEntryCount,
      entryPanelOptions
    })
    return false
  }

  openUpgradePrompt(
    'Free plan: 1 condition',
    `You already picked ${freeConditionLabels.value[0] || 'your free condition'}. Upgrade to Pro for ${PRO_ANNUAL_PRICE_LABEL} to track ${conditionLabel || formatConditionKeyLabel(conditionKey)} and more.`
  )
  return false
}

function openEntryPanel(options: {
  prefillCustomCondition?: string
  condition?: {
    title: string
    category: string
    description: string
    image: string
  }
} = {}) {
  void openEntryPanelAsync(options)
}

async function openEntryPanelAsync(options: {
  prefillCustomCondition?: string
  condition?: {
    title: string
    category: string
    description: string
    image: string
  }
} = {}) {
  if (isDemoMode) {
    openEntryPanelInner(options)
    return
  }

  if (needsAppWelcome.value) {
    return
  }

  if (!user.value) {
    openAuthPanel()
    return
  }

  if (isPro.value) {
    requestEntryPanelOpen(options)
    return
  }

  const pendingConditionKey = resolvePendingEntryConditionKey(options)
  const pendingConditionLabel = options.condition?.title || options.prefillCustomCondition || ''

  if (!pendingConditionKey) {
    requestEntryPanelOpen(options)
    return
  }

  if (await ensureFreeConditionAccess(pendingConditionKey, pendingConditionLabel || formatConditionKeyLabel(pendingConditionKey), options)) {
    requestEntryPanelOpen(options)
  }
}

function requestEntryPanelOpen(options: {
  prefillCustomCondition?: string
  condition?: {
    title: string
    category: string
    description: string
    image: string
  }
} = {}) {
  const caution = getWeeklyLogCaution(weeklyLogDay.value, loggingCadence.value)

  if (caution) {
    closeAppOverlaysExcept('logging-cadence')
    pendingCadenceEntryOptions.value = options
    weeklyLogCaution.value = caution
    isLoggingCadencePromptOpen.value = true
    return
  }

  openEntryPanelInner(options)
}

function closeLoggingCadencePrompt() {
  isLoggingCadencePromptOpen.value = false
  weeklyLogCaution.value = null
  pendingCadenceEntryOptions.value = null
}

function confirmLoggingCadencePrompt() {
  const options = pendingCadenceEntryOptions.value || {}
  closeLoggingCadencePrompt()
  openEntryPanelInner(options)
}

async function handleWelcomeComplete(payload: {
  loggingCadence: 'daily' | 'weekly'
  weeklyLogDay: number
  termsAcceptedAt: string
  enableLogReminders: boolean
  reminderHour: number
  reminderTimezone: string
}) {
  try {
    await completeAppWelcome(payload)
    hydrateReminderSettings({
      log_reminders_enabled: payload.enableLogReminders,
      reminder_hour: payload.reminderHour,
      reminder_timezone: payload.reminderTimezone
    })

    if (payload.enableLogReminders) {
      const result = await enableRemindersWithPermission()

      if (!result.ok) {
        await persistReminderSettings({
          enabled: false,
          hour: payload.reminderHour,
          timezone: payload.reminderTimezone
        })
      }
    }

    showSubmissionToast('Welcome! You are all set.')
  } catch (error) {
    console.error(error)
  }
}

function openEntryPanelInner(options: {
  prefillCustomCondition?: string
  condition?: {
    title: string
    category: string
    description: string
    image: string
  }
} = {}) {
  if (needsAppWelcome.value) {
    return
  }

  historyExpanded.value = false
  if (!isDesktopLayout.value) {
    transitionDirection.value = 'expand'
  }
  entryStep.value = 0
  resetEntryForm()
  editingEntryId.value = null
  editingEntryConditionLabel.value = null
  selectedSearchCondition.value = options.condition ?? null
  hasActiveDraft.value = true
  isConditionPickerOpen.value = false
  customConditionInput.value = ''
  debouncedCustomConditionPreview.value = ''

  if (options.prefillCustomCondition) {
    entryForm.value.condition_name = options.prefillCustomCondition
    customConditionInput.value = options.prefillCustomCondition
    debouncedCustomConditionPreview.value = options.prefillCustomCondition
  }

  prefillConditionStatementForEntry()
  isEntryOpen.value = true
}

function closeConditionSlotModal() {
  isConditionSlotOpen.value = false
  pendingEntryPanelOptions.value = null
  pendingConditionSlotKey.value = ''
  pendingConditionSlotLabel.value = ''
  pendingConditionSlotMode.value = 'add'
  pendingConditionSlotLoggedEntryCount.value = 0
  conditionSlotError.value = ''
}

async function confirmConditionSlot() {
  if (!pendingConditionSlotKey.value) {
    return
  }

  if (!hasLoadedEntriesOnce.value) {
    await loadEntries()
  }

  const loggedEntryCount = savedEntries.value.length

  if (pendingConditionSlotMode.value === 'replace' && !canReplaceFreeCondition(pendingConditionSlotKey.value, loggedEntryCount)) {
    conditionSlotError.value = 'You can only change your free condition before logging your first entry.'
    pendingConditionSlotLoggedEntryCount.value = loggedEntryCount
    return
  }

  isConfirmingConditionSlot.value = true
  conditionSlotError.value = ''

  try {
    if (pendingConditionSlotMode.value === 'replace') {
      await replaceFreeCondition(pendingConditionSlotKey.value, loggedEntryCount)
    } else {
      await addFreeCondition(pendingConditionSlotKey.value)
    }

    const options = pendingEntryPanelOptions.value
    closeConditionSlotModal()

    if (options) {
      openEntryPanelInner(options)
    }
  } catch (error) {
    conditionSlotError.value = getErrorMessage(error)
  } finally {
    isConfirmingConditionSlot.value = false
  }
}

async function handleEntryDone() {
  if (isEditingEntry.value || isLastEntryStep.value) {
    await saveEntry()
    return
  }

  if (isMeaningfulEntryDraft({
    entryStep: entryStep.value,
    entryForm: entryForm.value,
    selectedSearchCondition: selectedSearchCondition.value,
    customConditionInput: customConditionInput.value
  })) {
    closeEntryPanel(false)
    return
  }

  closeEntryPanel(true)
}

function closeEntryPanel(clearDraft = false, preservePersistedDraft = false) {
  const wasEntryOpen = isEntryOpen.value

  if (isEntryOpen.value && !clearDraft && !editingEntryId.value) {
    persistEntryDraftNow()
  }

  if (isEntryOpen.value && !isDesktopLayout.value) {
    transitionDirection.value = 'collapse'
  }

  if (clearDraft) {
    hasActiveDraft.value = false

    if (!preservePersistedDraft) {
      clearPersistedEntryDraft()
    }

    editingEntryId.value = null
    editingEntryConditionLabel.value = null
    editingEntrySaveSnapshot.value = null
    selectedSearchCondition.value = null
    isConditionPickerOpen.value = false
    customConditionInput.value = ''
    debouncedCustomConditionPreview.value = ''
    resetEntryForm()
  } else if (!editingEntryId.value) {
    hasActiveDraft.value = isMeaningfulEntryDraft({
      entryStep: entryStep.value,
      entryForm: entryForm.value,
      selectedSearchCondition: selectedSearchCondition.value,
      customConditionInput: customConditionInput.value
    })

    if (!hasActiveDraft.value) {
      selectedSearchCondition.value = null
      customConditionInput.value = ''
      debouncedCustomConditionPreview.value = ''
      isConditionPickerOpen.value = false
      clearPersistedEntryDraft()
    }

    refreshEntryDraftPreview()
  } else {
    editingEntryId.value = null
    editingEntryConditionLabel.value = null
    editingEntrySaveSnapshot.value = null
    selectedSearchCondition.value = null
    isConditionPickerOpen.value = false
    customConditionInput.value = ''
    debouncedCustomConditionPreview.value = ''
  }

  isEntryOpen.value = false

  if (wasEntryOpen) {
    blockConditionSlideEntry(400)
  }
}

function showPreviousEntryStep() {
  if (entryStep.value > 0) {
    entryStep.value -= 1
  }
}

function showNextEntryStep() {
  if (!isLastEntryStep.value) {
    entryStep.value += 1
  }
}

function handleEntryNextStep() {
  if (isLastEntryStep.value) {
    return
  }

  if (currentStepHasDateTimeField() && !validateEntryDateTimeStep()) {
    return
  }

  showNextEntryStep()
}

function handleEntryPrimaryAction() {
  if (currentStepHasDateTimeField() && !validateEntryDateTimeStep()) {
    return
  }

  if (isLastEntryStep.value) {
    saveEntry()
    return
  }

  showNextEntryStep()
}

function isDemoEntryId(id: string) {
  return id.startsWith('demo-entry-')
}

async function saveDemoEntry() {
  if (currentStepHasDateTimeField() && !entryForm.value.date_and_time) {
    setEntryDateTimeNow()
  }

  if (!validateEntryDateTimeStep()) {
    return
  }

  isSavingEntry.value = true
  entryError.value = ''

  await demoSleep(700)
  await scrollDemoEntryFormToBottom()

  const payload = buildSymptomEntrySavePayload({
    entryTitle: entryTitle.value,
    severity: severityValue.value,
    entryForm: entryForm.value
  })

  const now = new Date().toISOString()
  demoEntryCounter += 1
  const entryId = `demo-entry-${demoEntryCounter}-${Date.now()}`

  const demoEntry = {
    id: entryId,
    source: 'veteran',
    entry_status: 'complete',
    condition_key: payload.condition_key,
    condition_label: payload.condition_label,
    severity: payload.severity,
    occurred_at: payload.occurred_at,
    summary: payload.summary,
    impact: payload.impact,
    details: payload.details,
    created_at: now,
    updated_at: now
  }

  savedEntries.value = [demoEntry, ...savedEntries.value]
  hasLoadedEntriesOnce.value = true
  hasActiveDraft.value = false
  clearPersistedEntryDraft()
  editingEntrySaveSnapshot.value = null
  promoteHomeConditionOrderKey(payload.condition_key)
  syncHomeConditionOrderKeys()
  closeEntryPanel(true)

  await nextTick()
  await focusSubmission(entryId)

  showSubmissionToast({
    message: 'Entry saved.',
    highlight: '+1'
  })

  isSavingEntry.value = false
}

async function revealDemoSavedConditionOnHome(conditionKey: string) {
  if (historyExpanded.value) {
    collapseHistorySheet()
    await demoSleep(650)
  }

  await nextTick()
  focusHomeConditionByKey(conditionKey)
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3
}

async function animateDemoScroll(container: HTMLElement, targetScrollTop: number) {
  const startScrollTop = container.scrollTop
  const distance = targetScrollTop - startScrollTop

  if (Math.abs(distance) < 4) {
    await demoSleep(trackerDemoTiming.scrollPauseMs)
    return
  }

  const duration = trackerDemoTiming.scrollDurationMs
  const startedAt = Date.now()

  while (true) {
    if (demoControl?.isUserControlled.value) {
      return
    }

    const elapsed = Date.now() - startedAt
    const progress = Math.min(1, elapsed / duration)
    container.scrollTop = startScrollTop + distance * easeOutCubic(progress)

    if (progress >= 1) {
      break
    }

    await demoSleep(32)
  }

  await demoSleep(trackerDemoTiming.scrollPauseMs)
}

async function scrollDemoFieldIntoView(targetKey: string) {
  await nextTick()

  const container = getEntryStepScrollEl()
  if (!container) {
    return
  }

  const selector = targetKey === 'severity-slider'
    ? '[data-demo-field="severity-slider"]'
    : targetKey === 'datetime'
      ? '[data-demo-field="datetime"]'
      : `[data-entry-field-key="${targetKey}"]`

  const target = container.querySelector(selector)
  if (!(target instanceof HTMLElement)) {
    return
  }

  const previousScrollTop = container.scrollTop
  scrollEntryElementIntoView(target)
  const targetScrollTop = container.scrollTop
  container.scrollTop = previousScrollTop

  await animateDemoScroll(container, targetScrollTop)
}

async function scrollDemoEntryFormToBottom() {
  await nextTick()

  const container = getEntryStepScrollEl()
  if (!container) {
    return
  }

  const targetScrollTop = Math.max(0, container.scrollHeight - container.clientHeight)
  await animateDemoScroll(container, targetScrollTop)
}

function resolveDemoFieldText(
  field: { label: string, type: string },
  samples: Record<string, string>
) {
  const key = fieldKey(field.label)

  if (samples[key]) {
    return samples[key]
  }

  if (trackerDemoFieldDefaults[key]) {
    return trackerDemoFieldDefaults[key]
  }

  if (field.type === 'textarea') {
    return 'Symptoms made routine tasks harder than usual today.'
  }

  if (field.type === 'text') {
    return 'Moderate impact on daily routine.'
  }

  return ''
}

function demoSleep(ms: number) {
  return new Promise<void>((resolve) => {
    if (!demoControl || demoControl.isUserControlled.value) {
      resolve()
      return
    }

    const started = Date.now()
    const tick = () => {
      if (!demoControl || demoControl.isUserControlled.value) {
        resolve()
        return
      }

      if (demoControl.isPaused.value) {
        setTimeout(tick, 100)
        return
      }

      if (Date.now() - started >= ms) {
        resolve()
        return
      }

      setTimeout(tick, 100)
    }

    tick()
  })
}

async function typeDemoFormField(key: string, text: string) {
  entryForm.value[key] = ''
  await scrollDemoFieldIntoView(key)

  let charCount = 0
  for (const char of text) {
    if (demoControl?.isUserControlled.value) {
      return
    }

    entryForm.value[key] += char
    charCount += 1

    if (charCount % 36 === 0) {
      await scrollDemoFieldIntoView(key)
    }

    await demoSleep(trackerDemoTiming.charFieldMs)

    if (char === ' ' || char === ',') {
      await demoSleep(trackerDemoTiming.charPauseMs)
    }
  }

  await scrollDemoFieldIntoView(key)
}

async function animateDemoSeverity(target: number) {
  await scrollDemoFieldIntoView('severity-slider')

  const step = target >= severityValue.value ? 1 : -1

  while (severityValue.value !== target) {
    if (demoControl?.isUserControlled.value) {
      return
    }

    severityValue.value += step
    await demoSleep(trackerDemoTiming.severityStepMs)
  }

  await scrollDemoFieldIntoView('severity-slider')
}

async function fillDemoEntryStep(samples: Record<string, string>, severity: number) {
  for (const field of currentEntryStepFields.value) {
    if (demoControl?.isUserControlled.value) {
      return
    }

    if (field.type === 'datetime') {
      await scrollDemoFieldIntoView('datetime')
      await demoSleep(trackerDemoTiming.datetimePauseMs)
      setEntryDateTimeNow()
      continue
    }

    if (field.type === 'slider') {
      await animateDemoSeverity(severity)
      continue
    }

    const key = fieldKey(field.label)
    const text = resolveDemoFieldText(field, samples)

    if (!text) {
      continue
    }

    await typeDemoFormField(key, text)
    await demoSleep(trackerDemoTiming.charPauseMs)
  }
}

async function selectDemoCondition(key: string) {
  await demoSleep(trackerDemoTiming.afterSearchMs / 2)
  // Replace prior picks so scenarios don't stack (PTSD + Migraine, etc.).
  draftSelectedKeys.value = [key]
}

function demoAdvanceEntryStep() {
  if (currentStepHasDateTimeField() && !entryForm.value.date_and_time) {
    setEntryDateTimeNow()
  }

  entryError.value = ''

  if (isLastEntryStep.value) {
    return true
  }

  showNextEntryStep()
  return false
}

async function resetDemoPreview() {
  demoConditionSearch.value = ''
  draftSelectedKeys.value = []
  isConditionBrowserOpen.value = false
  highlightedSubmissionId.value = null
  savedEntries.value = savedEntries.value.filter((entry) => !isDemoEntryId(String(entry.id)))
  collapseHistorySheet()
  closeEntryPanel(true)
  applyLocalState([], false)
  await nextTick()
}

const trackerDemoActions: TrackerDemoActions = {
  ready: demoReady,
  resetPreview: resetDemoPreview,
  openConditionBrowser,
  setConditionSearch: (text: string) => {
    demoConditionSearch.value = text
  },
  selectCondition: selectDemoCondition,
  finishConditionBrowser: finishConditionBrowser,
  openEntryForConditionKey: (key: string) => {
    const condition = getCatalogConditionByKey(key)
    if (!condition) {
      return
    }

    openEntryPanelInner({
      condition: {
        title: condition.title,
        category: condition.category,
        description: condition.description,
        image: condition.image
      }
    })
  },
  fillCurrentEntryStep: fillDemoEntryStep,
  advanceEntryStep: demoAdvanceEntryStep,
  submitDemoEntry: saveDemoEntry,
  revealSavedConditionOnHome: revealDemoSavedConditionOnHome,
  collapseHistoryForDemo: () => {
    if (historyExpanded.value) {
      collapseHistorySheet()
    }
  },
  isConditionBrowserVisible: () => showConditionBrowser.value,
  isEntryOpen: () => isEntryOpen.value
}

if (isDemoMode) {
  provide(TRACKER_DEMO_ACTIONS_KEY, trackerDemoActions)

  if (demoControl) {
    watch(() => demoControl.isPaused.value, (paused) => {
      if (demoControl.isUserControlled.value) {
        return
      }

      if (paused) {
        openAuthPanel()
        return
      }

      isAuthPanelOpen.value = false
    })

    watch(() => demoControl.isUserControlled.value, (controlled) => {
      if (controlled) {
        isAuthPanelOpen.value = false
      }
    })
  }
}

useTrackerDemoScript(isDemoMode ? trackerDemoActions : null, demoControl)
</script>

<style scoped>
.severity-guide-enter-active,
.severity-guide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.severity-guide-enter-from {
  opacity: 0;
  transform: translateY(0.35rem);
}

.severity-guide-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem);
}

.home-log-btn-enter-active {
  transition:
    opacity var(--home-log-ms, 650ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1))
    var(--home-log-delay-ms, 0ms);
}

.home-log-btn-leave-active {
  transition: opacity var(--home-log-ms, 650ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.home-log-btn-enter-from,
.home-log-btn-leave-to {
  opacity: 0;
}

.home-state-fade-enter-active,
.home-state-fade-leave-active {
  transition: none;
}

.home-state-fade-leave-active {
  pointer-events: none;
}

.home-state-fade-enter-from,
.home-state-fade-leave-to {
  opacity: 1;
}

.home-carousel-dot {
  transition:
    width var(--home-ui-ms, 650ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color var(--home-ui-ms, 650ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.hero-carousel-enter-active,
.hero-carousel-leave-active {
  transition: opacity 360ms var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.hero-carousel-leave-active {
  z-index: 1;
}

.hero-carousel-enter-active {
  z-index: 2;
}

.hero-carousel-enter-from,
.hero-carousel-leave-to {
  opacity: 0;
}

.hero-shared-enter-active,
.hero-shared-leave-active {
  transition: none;
}

.hero-shared-enter-from,
.hero-shared-enter-to,
.hero-shared-leave-from,
.hero-shared-leave-to {
  opacity: 1;
}

.home-carousel-stage {
  display: grid;
  grid-template-rows: 0fr auto auto;
  align-content: start;
}

.home-carousel-stage.absolute {
  margin-bottom: 0.8rem;
}

.home-workspace {
  padding-bottom: var(--history-sheet-collapsed-height);
}

.home-workspace--history-hidden {
  padding-bottom: 0;
}

.home-history-panel {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 90;
  max-height: 80%;
  min-height: 0;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  transition:
    height 650ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 650ms cubic-bezier(0.22, 1, 0.36, 1);
}

.home-history-panel.is-history-collapsed {
  height: var(--history-sheet-collapsed-height);
  max-height: var(--history-sheet-collapsed-height);
  justify-content: flex-start;
}

.home-history-panel.is-history-collapsed:not(.is-history-animating) .history-panel-header-extra,
.home-history-panel.is-history-collapsed:not(.is-history-animating) .history-panel-tabs,
.home-history-panel.is-history-collapsed:not(.is-history-animating) .history-panel-scroll {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  pointer-events: none;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.home-history-panel.is-history-collapsed .history-panel-scroll {
  flex: 0 0 0;
  min-height: 0;
}

.home-history-panel.is-history-collapsed .history-panel-handle {
  padding-bottom: 0.5rem;
}

.home-history-panel.is-history-collapsed .history-panel-header {
  padding-bottom: 0.75rem;
}

.home-history-panel.is-history-expanded {
  z-index: 100;
  height: 80%;
  max-height: 80%;
  box-shadow: 0 -12px 40px rgb(0 0 0 / 0.12);
}

.dark .home-history-panel.is-history-expanded {
  box-shadow: 0 -12px 40px rgb(0 0 0 / 0.35);
}

.workspace-panel-enter-active {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.workspace-panel-leave-active {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.workspace-panel-enter-from,
.workspace-panel-leave-to {
  opacity: 0;
  transform: translateY(0.375rem);
}

.workspace-panel-enter-to,
.workspace-panel-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.home-carousel-stage.is-shared-transition {
  transition: grid-template-rows var(--home-hero-ms, 680ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.home-carousel-stage.is-overview {
  grid-template-rows: 0fr auto auto;
  align-content: start;
}

.home-carousel-stage.is-condition {
  grid-template-rows: 1fr 0fr var(--home-chrome-block-h, auto);
  align-content: stretch;
}

.home-carousel-hero {
  min-height: 0;
  overflow: hidden;
  height: 100%;
  border-radius: 1.75rem;
}

.is-home-morph-active {
  border-radius: 1.75rem;
  overflow: hidden;
}

.home-carousel-stage.is-shared-transition.is-shared-collapse {
  transition: grid-template-rows var(--home-hero-ms, 680ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
  grid-template-rows: 0fr auto auto;
  align-content: start;
}

.home-carousel-stage.is-shared-collapse .home-carousel-hero {
  opacity: 0;
  pointer-events: none;
}

.home-carousel-stage.is-shared-transition .home-carousel-hero {
  border-radius: 1.75rem;
  background: transparent;
}

.home-image-transition {
  display: block;
  pointer-events: none;
  overflow: hidden;
  box-shadow: 0 1.5rem 3rem rgb(0 0 0 / 0.18);
  backface-visibility: hidden;
  contain: layout paint;
  -webkit-mask-image: -webkit-radial-gradient(white, black);
  will-change: left, top, width, height, border-radius;
  z-index: 80;
}

.home-carousel-hero-title {
  position: relative;
  z-index: 1;
  opacity: 0;
  transition:
    opacity 240ms var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.home-carousel-stage.is-condition .home-carousel-hero-title {
  opacity: 1;
}

.home-carousel-stage.is-shared-transition .home-carousel-hero-title {
  z-index: 90;
  opacity: 0;
}

.home-carousel-stage.is-shared-transition.is-hero-title-revealed .home-carousel-hero-title {
  opacity: 1;
}

.home-carousel-overview {
  min-height: 0;
  align-self: stretch;
  overflow: hidden;
  opacity: 1;
}

.home-carousel-stage.is-overview .home-carousel-overview {
  opacity: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-self: start;
}

.home-carousel-stage.is-overview [data-home-conditions-scroll] {
  flex: none;
  height: auto;
  height: var(--home-conditions-scroll-h, auto);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.home-carousel-stage.is-shared-collapse .home-carousel-overview {
  opacity: 1;
  pointer-events: none;
  align-self: start;
}

.home-carousel-stage.is-shared-collapse [data-home-conditions-scroll] {
  flex: none;
  height: auto;
  height: var(--home-conditions-scroll-h, auto);
  overflow-y: auto;
}

.home-carousel-stage.is-condition .home-carousel-overview {
  opacity: 0;
  pointer-events: none;
  min-height: 0;
}

.home-carousel-stage.is-shared-transition .home-carousel-overview {
  transition: none;
}

.home-carousel-chrome {
  align-self: stretch;
  position: relative;
  z-index: 0;
  overflow: hidden;
  margin-top: 1.5rem;
  opacity: 1;
}

.home-carousel-stage.is-shared-transition .home-carousel-chrome {
  transition: opacity var(--home-chrome-in-ms, 720ms) var(--home-chrome-in-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.home-carousel-chrome.is-chrome-retreat,
.home-carousel-chrome.is-chrome-retreat-instant {
  opacity: 0;
  pointer-events: none;
}

.home-carousel-chrome.is-chrome-retreat-instant,
.home-carousel-stage.is-shared-transition .home-carousel-chrome.is-chrome-retreat {
  transition: none;
}

.home-carousel-tip {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity var(--home-chrome-in-ms, 720ms) var(--home-chrome-in-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--home-chrome-in-ms, 720ms) var(--home-chrome-in-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.home-carousel-tip.is-tip-retreat {
  opacity: 0;
  transform: translateY(0.75rem);
  pointer-events: none;
}

.home-carousel-chrome.is-chrome-retreat-instant .home-carousel-tip,
.home-carousel-stage.is-shared-transition .home-carousel-chrome.is-chrome-retreat .home-carousel-tip {
  transition: none;
}

.home-tip-fade-enter-active {
  transition:
    opacity var(--home-chrome-in-ms, 720ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--home-chrome-in-ms, 720ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.home-tip-fade-leave-active {
  transition: opacity 420ms var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.home-tip-fade-enter-from,
.home-tip-fade-leave-to {
  opacity: 0;
}

.home-tip-fade-enter-from {
  transform: translateY(0.75rem);
}

.home-carousel-footer {
  min-height: 0;
  transition:
    min-height var(--home-ui-ms, 650ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    padding-top var(--home-ui-ms, 650ms) var(--home-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

.home-carousel-footer.has-mobile-log-space {
  min-height: 5rem;
}

.home-carousel-footer:not(.has-mobile-log-space) {
  padding-top: 0;
}

@media (prefers-reduced-motion: reduce) {
  .home-state-fade-enter-active,
  .home-state-fade-leave-active,
  .hero-carousel-enter-active,
  .hero-carousel-leave-active,
  .home-carousel-dot,
  .home-carousel-stage,
  .home-history-panel,
  .home-carousel-hero,
  .home-carousel-hero-title,
  .home-carousel-overview,
  .home-carousel-chrome,
  .home-carousel-tip,
  .home-tip-fade-enter-active,
  .home-tip-fade-leave-active,
  .home-log-btn-enter-active,
  .home-log-btn-leave-active,
  .workspace-panel-enter-active,
  .workspace-panel-leave-active {
    transition-duration: 1ms;
    transition-delay: 0ms;
    animation-duration: 1ms;
  }
}

.crisis-line-enter-active,
.crisis-line-leave-active {
  overflow: hidden;
  transition:
    opacity 0.7s ease-in-out,
    transform 0.7s ease-in-out,
    max-height 0.7s ease-in-out,
    margin-top 0.7s ease-in-out;
}

.crisis-line-enter-from,
.crisis-line-leave-to {
  max-height: 0;
  margin-top: 0;
  opacity: 0;
  transform: translateY(0.25rem);
}

.crisis-line-enter-to,
.crisis-line-leave-from {
  max-height: 4.5rem;
  margin-top: 0.75rem;
  opacity: 1;
  transform: translateY(0);
}
</style>
