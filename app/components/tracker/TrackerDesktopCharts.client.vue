<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import {
  CHART_ROTATED_TICK_LAYOUT,
  chartLegendLabels,
  chartScaleOptions,
  chartTooltipPlugin,
  resolveSymptomChartColors
} from '../../utils/chartTheme'
import {
  buildSeverityMixChartData,
  buildSeverityTrendChartData,
  buildWeeklyLogChartData,
  type SymptomDashboardMetrics
} from '../../utils/symptomDashboard'
import { td } from '../../utils/trackerDesktopTheme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  metrics: SymptomDashboardMetrics
  conditionTitle: string
}>()

const colorMode = useColorMode()
const { themeId } = useClaimColorTheme()
const isDark = computed(() => colorMode.value === 'dark')

const chartColors = computed(() => {
  themeId.value
  return resolveSymptomChartColors()
})

const trendChartData = computed(() => buildSeverityTrendChartData(props.metrics.timeline, chartColors.value))
const weeklyChartData = computed(() => buildWeeklyLogChartData(props.metrics.weeklyLogs, chartColors.value))
const mixChartData = computed(() => buildSeverityMixChartData(props.metrics.severityBuckets, chartColors.value))

const hasChartData = computed(() => props.metrics.totalLogs > 0)

const trendOptions = computed<ChartOptions<'line'>>(() => {
  const scale = chartScaleOptions(isDark.value)
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: CHART_ROTATED_TICK_LAYOUT,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...chartTooltipPlugin(isDark.value),
        callbacks: {
          label: context => `Severity ${context.parsed.y}/10`
        }
      }
    },
    scales: {
      x: {
        ...scale,
        ticks: { ...scale.ticks, maxRotation: 45, minRotation: 0 }
      },
      y: {
        ...scale,
        min: 0,
        max: 10,
        ticks: { ...scale.ticks, stepSize: 2 }
      }
    }
  }
})

const weeklyOptions = computed<ChartOptions<'bar'>>(() => {
  const scale = chartScaleOptions(isDark.value)
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: CHART_ROTATED_TICK_LAYOUT,
    plugins: {
      legend: { display: false },
      tooltip: chartTooltipPlugin(isDark.value)
    },
    scales: {
      x: {
        ...scale,
        ticks: { ...scale.ticks, maxRotation: 45, minRotation: 0 }
      },
      y: {
        ...scale,
        beginAtZero: true,
        ticks: { ...scale.ticks, precision: 0 }
      }
    }
  }
})

const mixOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: chartLegendLabels(isDark.value)
    },
    tooltip: chartTooltipPlugin(isDark.value)
  }
}))
</script>

<template>
  <div v-if="!hasChartData" class="flex min-h-[20rem] flex-col items-center justify-center px-6 py-10 text-center">
    <UIcon name="i-lucide-chart-line" :class="['size-10', td.iconMuted]" />
    <p :class="['mt-4 font-bold', td.titleBase]">
      No chart data yet
    </p>
    <p :class="['mt-2 max-w-xs', td.body]">
      Log a few {{ conditionTitle }} entries with severity ratings to see trends here.
    </p>
  </div>

  <div v-else class="space-y-4 p-4 pb-8">
    <div :class="['grid grid-cols-3 gap-2 p-3', td.insetCard]">
      <div class="text-center">
        <p :class="['text-[0.65rem] font-bold uppercase tracking-[0.12em]', td.meta]">Logs</p>
        <p class="mt-1 text-lg font-bold text-highlighted">{{ metrics.totalLogs }}</p>
      </div>
      <div class="text-center">
        <p :class="['text-[0.65rem] font-bold uppercase tracking-[0.12em]', td.meta]">Avg</p>
        <p class="mt-1 text-lg font-bold text-highlighted">{{ metrics.avgSeverity }}/10</p>
      </div>
      <div class="text-center">
        <p :class="['text-[0.65rem] font-bold uppercase tracking-[0.12em]', td.meta]">Peak</p>
        <p class="mt-1 text-lg font-bold text-highlighted">{{ metrics.maxSeverity }}/10</p>
      </div>
    </div>

    <section :class="td.insetCard">
      <h3 :class="td.caption">
        Severity over time
      </h3>
      <div class="relative mt-3 h-[220px]">
        <Line
          :data="trendChartData"
          :options="trendOptions"
        />
      </div>
    </section>

    <div class="grid gap-4 lg:grid-cols-2">
      <section :class="td.insetCard">
        <h3 :class="td.caption">
          Logs per week
        </h3>
        <div class="relative mt-3 h-[220px]">
          <Bar
            :data="weeklyChartData"
            :options="weeklyOptions"
          />
        </div>
      </section>

      <section :class="td.insetCard">
        <h3 :class="td.caption">
          Severity mix
        </h3>
        <div class="relative mt-3 h-[220px]">
          <Doughnut
            :data="mixChartData"
            :options="mixOptions"
          />
        </div>
      </section>
    </div>
  </div>
</template>
