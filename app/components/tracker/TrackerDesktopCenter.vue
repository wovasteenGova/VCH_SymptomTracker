<script setup lang="ts">
import type { HomeVisitTip } from '../../utils/conditionCatalog'
import { VA_CRISIS_LINE_SHORT } from '../../utils/conditionCatalog'
import type { SymptomDashboardMetrics } from '../../utils/symptomDashboard'
import { td } from '../../utils/trackerDesktopTheme'

type CenterTab = 'log' | 'charts'

defineProps<{
  title: string
  category: string
  image: string
  hasConditions: boolean
  logging: boolean
  tip?: HomeVisitTip | null
  chartMetrics: SymptomDashboardMetrics
}>()

defineEmits<{
  log: []
  openBrowser: []
  showAllTips: []
}>()

const activeTab = defineModel<CenterTab>('activeTab', { default: 'log' })
const chartsShowAllConditions = defineModel<boolean>('chartsShowAllConditions', { default: false })

const centerHoverActive = ref(false)

const showHoverLogButton = computed(() =>
  centerHoverActive.value
  && activeTab.value === 'log'
)

const scopeButtonClass = (active: boolean) => active
  ? 'border-primary/35 bg-primary/10 text-highlighted'
  : 'border-default/80 bg-muted/60 text-muted hover:border-accented hover:bg-accented/40'
</script>

<template>
  <div
    class="relative flex min-h-0 flex-1 flex-col overflow-hidden"
    @pointerenter="centerHoverActive = true"
    @pointerleave="centerHoverActive = false"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
    >
      <Transition name="center-hover-log">
        <button
          v-if="showHoverLogButton && hasConditions"
          type="button"
          class="pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-inverted shadow-lg shadow-primary/25 ring-1 ring-primary/30"
          :disabled="logging"
          @click="$emit('log')"
        >
          <UIcon name="i-lucide-plus" class="size-4" />
          Log entry
        </button>
      </Transition>
    </div>

    <div
      v-if="hasConditions"
      :class="td.panelHeaderSm"
    >
      <div
        :class="['grid grid-cols-2 gap-1', td.tabRail]"
        role="tablist"
        aria-label="Condition panel"
      >
        <button
          type="button"
          role="tab"
          :class="activeTab === 'log' ? td.tabActive : td.tabInactive"
          :aria-selected="activeTab === 'log'"
          @click="activeTab = 'log'"
        >
          Log
        </button>
        <button
          type="button"
          role="tab"
          :class="activeTab === 'charts' ? td.tabActive : td.tabInactive"
          :aria-selected="activeTab === 'charts'"
          @click="activeTab = 'charts'"
        >
          Charts
        </button>
      </div>

      <div
        v-if="activeTab === 'charts'"
        class="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Chart scope"
      >
        <button
          type="button"
          class="rounded-full border px-3 py-1.5 text-[0.6875rem] font-semibold transition"
          :class="scopeButtonClass(!chartsShowAllConditions)"
          @click="chartsShowAllConditions = false"
        >
          {{ title }}
        </button>
        <button
          type="button"
          class="rounded-full border px-3 py-1.5 text-[0.6875rem] font-semibold transition"
          :class="scopeButtonClass(chartsShowAllConditions)"
          @click="chartsShowAllConditions = true"
        >
          All conditions
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain no-scrollbar">
      <template v-if="!hasConditions || activeTab === 'log'">
        <div class="flex min-h-[18rem] flex-col items-center justify-center px-8 py-8 text-center">
          <template v-if="hasConditions">
            <img
              :src="image"
              :alt="title"
              :class="['size-28 rounded-3xl object-cover shadow-lg', td.imageRing]"
            >
            <p :class="['mt-6', td.captionWide]">
              {{ category }}
            </p>
            <h2 :class="['mt-2', td.title2xl]">
              {{ title }}
            </h2>
            <p :class="['mt-3 max-w-sm', td.body]">
              Log what you are feeling now. Entries show up in history on the right.
            </p>
            <button
              type="button"
              :class="['mt-8', td.primaryBtnLg]"
              :disabled="logging"
              @click="$emit('log')"
            >
              <UIcon name="i-lucide-plus" class="size-5" />
              Log entry
            </button>
          </template>

          <template v-else>
            <UIcon name="i-lucide-clipboard-list" :class="['size-12', td.iconMuted]" />
            <h2 :class="['mt-4', td.titleXl]">
              Add your first condition
            </h2>
            <p :class="['mt-2 max-w-sm', td.body]">
              Pick what you want to track, then log symptoms from this panel.
            </p>
            <button
              type="button"
              :class="['mt-6', td.primaryBtn]"
              @click="$emit('openBrowser')"
            >
              Choose conditions
            </button>
          </template>
        </div>
      </template>

      <TrackerDesktopCharts
        v-else
        :metrics="chartMetrics"
        :condition-title="chartsShowAllConditions ? 'all conditions' : title"
      />
    </div>

    <div
      v-if="tip && activeTab === 'log'"
      :class="['shrink-0 px-6 py-4 text-left', td.divider]"
    >
      <HomeVisitTipCard
        :tip="tip"
        @show-all="$emit('showAllTips')"
      />
      <p :class="['mt-3 text-xs leading-5', td.meta]">
        {{ VA_CRISIS_LINE_SHORT }}
      </p>
    </div>

  </div>
</template>

<style scoped>
.center-hover-log-enter-active,
.center-hover-log-leave-active {
  transition:
    opacity 320ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.center-hover-log-enter-from,
.center-hover-log-leave-to {
  opacity: 0;
  transform: translateY(0.65rem);
}

.center-hover-log-enter-to,
.center-hover-log-leave-from {
  opacity: 1;
  transform: translateY(-0.35rem);
}
</style>
