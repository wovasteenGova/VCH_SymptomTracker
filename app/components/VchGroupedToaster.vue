<script setup lang="ts">
import { ToastProvider, ToastViewport, ToastPortal } from 'reka-ui'
import { reactivePick } from '@vueuse/core'
import { toastMaxInjectionKey } from '@nuxt/ui/runtime/composables/useToast'
import { useForwardProps } from '@nuxt/ui/runtime/composables/useForwardProps'
import { usePortal } from '@nuxt/ui/runtime/composables/usePortal'
import { omit } from '@nuxt/ui/utils'
import { tv } from '@nuxt/ui/utils/tv'
import theme from '#build/ui/toaster'
import { isGroupedToastId } from '#shared/groupedToast'
import { isAuthAccountToast } from '#shared/toastPlacement'

const props = withDefaults(defineProps<{
  position?: 'top-center' | 'top-right' | 'top-left' | 'bottom-center' | 'bottom-right' | 'bottom-left'
  /** When true, only login/signup/password-reset toasts. When false, everything else. */
  accountOnly?: boolean
  expand?: boolean
  progress?: boolean
  portal?: boolean | string
  max?: number
  duration?: number
}>(), {
  position: 'bottom-right',
  accountOnly: false,
  expand: false,
  progress: true,
  portal: true,
  max: 5,
  duration: 5000
})

const { toasts, remove } = useToast()
const { getGroup } = useGroupedToast()
const appConfig = useAppConfig()

const visibleToasts = computed(() =>
  toasts.value.filter(entry =>
    props.accountOnly ? isAuthAccountToast(entry) : !isAuthAccountToast(entry)
  )
)

provide(toastMaxInjectionKey, toRef(() => props.max))

const providerProps = useForwardProps(reactivePick(props, 'duration', 'label', 'swipeThreshold', 'disableSwipe'))
const portalProps = usePortal(toRef(() => props.portal))

const swipeDirection = computed(() => {
  switch (props.position) {
    case 'top-center':
      return 'up'
    case 'top-right':
    case 'bottom-right':
      return 'right'
    case 'bottom-center':
      return 'down'
    case 'top-left':
    case 'bottom-left':
      return 'left'
    default:
      return 'right'
  }
})

const ui = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.toaster || {}) })({
  position: props.position,
  swipeDirection: swipeDirection.value
}))

function onUpdateOpen(value: boolean, id: string | number) {
  if (value) {
    return
  }
  remove(id)
}

const hovered = ref(false)
const expandedStack = computed(() => props.expand || hovered.value)

const refs = ref<{ height: number }[]>([])

const height = computed(() => refs.value.reduce((acc, { height: itemHeight }) => acc + itemHeight + 16, 0))
const frontHeight = computed(() => refs.value[refs.value.length - 1]?.height || 0)

function getOffset(index: number) {
  return refs.value.slice(index + 1).reduce((acc, { height: itemHeight }) => acc + itemHeight + 16, 0)
}

function groupedEntryCount(id: string | number) {
  return getGroup(String(id))?.entries.length ?? 0
}

function isGroupExpanded(id: string | number) {
  return getGroup(String(id))?.expanded ?? false
}
</script>

<template>
  <ToastProvider
    :swipe-direction="swipeDirection"
    v-bind="providerProps"
  >
    <template
      v-for="(toast, index) of visibleToasts"
      :key="toast.id"
    >
      <VchGroupedToast
        v-if="isGroupedToastId(toast.id) && groupedEntryCount(toast.id) > 1"
        ref="refs"
        :toast="toast"
        :group="getGroup(String(toast.id))!"
        :progress="props.progress"
        :expanded="isGroupExpanded(toast.id)"
        :data-expanded="expandedStack"
        :data-front="!expandedStack && index === visibleToasts.length - 1"
        :data-pulsing="toast._duplicate ? toast._duplicate % 2 === 0 ? 'even' : 'odd' : undefined"
        :style="{
          '--index': index - visibleToasts.length + visibleToasts.length,
          '--before': visibleToasts.length - 1 - index,
          '--offset': getOffset(index),
          '--scale': expandedStack ? '1' : 'calc(1 - var(--before) * var(--scale-factor))',
          '--translate': expandedStack ? 'calc(var(--offset) * var(--translate-factor))' : 'calc(var(--before) * var(--gap))',
          '--transform': 'translateY(var(--translate)) scale(var(--scale))'
        }"
        data-slot="base"
        :class="ui.base({ class: toast.onClick ? 'cursor-pointer' : undefined })"
        @update:open="onUpdateOpen($event, toast.id)"
        @toggle="toast.onClick?.(toast)"
      />

      <UToast
        v-else
        ref="refs"
        :progress="props.progress"
        v-bind="omit(toast, ['id', 'close', '_duplicate', '_updated', 'onClick'])"
        :close="toast.close"
        :data-expanded="expandedStack"
        :data-front="!expandedStack && index === visibleToasts.length - 1"
        :data-pulsing="toast._duplicate ? toast._duplicate % 2 === 0 ? 'even' : 'odd' : undefined"
        :style="{
          '--index': index - visibleToasts.length + visibleToasts.length,
          '--before': visibleToasts.length - 1 - index,
          '--offset': getOffset(index),
          '--scale': expandedStack ? '1' : 'calc(1 - var(--before) * var(--scale-factor))',
          '--translate': expandedStack ? 'calc(var(--offset) * var(--translate-factor))' : 'calc(var(--before) * var(--gap))',
          '--transform': 'translateY(var(--translate)) scale(var(--scale))'
        }"
        data-slot="base"
        :class="ui.base({ class: toast.onClick ? 'cursor-pointer' : undefined })"
        @update:open="onUpdateOpen($event, toast.id)"
        @click="toast.onClick && toast.onClick(toast)"
      />
    </template>

    <ToastPortal v-bind="portalProps">
      <ToastViewport
        :data-expanded="expandedStack"
        data-slot="viewport"
        :class="ui.viewport()"
        :style="{
          '--scale-factor': '0.05',
          '--translate-factor': props.position?.startsWith('top') ? '1px' : '-1px',
          '--gap': props.position?.startsWith('top') ? '16px' : '-16px',
          '--front-height': `${frontHeight}px`,
          '--height': `${height}px`
        }"
        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
      />
    </ToastPortal>
  </ToastProvider>
</template>
