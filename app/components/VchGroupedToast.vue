<script setup lang="ts">
import { ToastRoot, ToastTitle, ToastDescription, ToastClose } from 'reka-ui'
import { reactivePick } from '@vueuse/core'
import { useForwardProps } from '@nuxt/ui/runtime/composables/useForwardProps'
import { useLocale } from '@nuxt/ui/runtime/composables/useLocale'
import { tv } from '@nuxt/ui/utils/tv'
import theme from '#build/ui/toast'
import type { GroupedToastGroup } from '#shared/groupedToast'

const props = defineProps<{
  toast: {
    title?: string
    description?: string
    icon?: string
    color?: string
    orientation?: 'vertical' | 'horizontal'
    closeIcon?: string
    duration?: number
    type?: 'foreground' | 'background'
    defaultOpen?: boolean
    open?: boolean
    as?: string
  }
  group: GroupedToastGroup
  expanded: boolean
  progress?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'toggle': []
}>()

const appConfig = useAppConfig()
const { t } = useLocale()

const rootProps = useForwardProps(reactivePick(props.toast, 'as', 'defaultOpen', 'open', 'duration', 'type'))

const ui = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.toast || {}) })({
  color: props.toast.color,
  orientation: props.toast.orientation ?? 'vertical',
  title: true
}))

const rootRef = useTemplateRef('rootRef')
const height = ref(0)

function measureHeight() {
  if (!rootRef.value?.$el?.getBoundingClientRect) {
    return
  }
  height.value = rootRef.value.$el.getBoundingClientRect().height
}

onMounted(measureHeight)

watch(() => [props.expanded, props.group.entries.length], () => {
  nextTick(measureHeight)
})

defineExpose({
  height
})

function onRootClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-slot="close"]')) {
    return
  }
  emit('toggle')
}
</script>

<template>
  <ToastRoot
    ref="rootRef"
    v-slot="{ remaining, duration: totalDuration, open }"
    v-bind="rootProps"
    :data-orientation="toast.orientation ?? 'vertical'"
    data-slot="root"
    :class="ui.root()"
    :style="{ '--height': height }"
    @update:open="emit('update:open', $event)"
    @click="onRootClick"
  >
    <UIcon
      v-if="toast.icon"
      :name="toast.icon"
      data-slot="icon"
      :class="ui.icon()"
    />

    <div
      data-slot="wrapper"
      :class="ui.wrapper()"
    >
      <ToastTitle
        data-slot="title"
        :class="ui.title()"
      >
        <span class="inline-flex items-center gap-2">
          {{ toast.title }}
          <span
            v-if="!expanded && group.entries.length > 1"
            class="inline-flex min-w-5 items-center justify-center rounded-full bg-elevated px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-none text-muted tabular-nums"
            aria-hidden="true"
          >
            {{ group.entries.length }}
          </span>
        </span>
      </ToastTitle>

      <ToastDescription
        v-if="expanded && group.entries.length > 1"
        data-slot="description"
        :class="ui.description()"
      >
        <ul class="mt-1 space-y-2">
          <li
            v-for="(entry, index) in group.entries"
            :key="entry.addedAt"
            class="border-l-2 border-default pl-2.5"
            :class="index === 0 ? 'text-highlighted' : 'text-muted'"
          >
            <p v-if="entry.description">
              {{ entry.description }}
            </p>
            <p
              v-else
              class="italic"
            >
              Update recorded
            </p>
          </li>
        </ul>
        <p class="mt-2 text-xs text-muted">
          Tap to collapse
        </p>
      </ToastDescription>

      <ToastDescription
        v-else
        data-slot="description"
        :class="ui.description()"
      >
        <p v-if="group.entries[0]?.description">
          {{ group.entries[0].description }}
        </p>
        <p
          v-if="group.entries.length > 1"
          class="mt-1 text-xs text-muted"
        >
          Tap to see all {{ group.entries.length }} updates
        </p>
      </ToastDescription>
    </div>

    <div
      data-slot="actions"
      :class="ui.actions({ orientation: 'horizontal' })"
    >
      <ToastClose as-child>
        <UButton
          :icon="toast.closeIcon || appConfig.ui.icons.close"
          color="neutral"
          variant="link"
          :aria-label="t('toast.close')"
          data-slot="close"
          :class="ui.close()"
          @click.stop
        />
      </ToastClose>
    </div>

    <UProgress
      v-if="progress && open && remaining > 0 && totalDuration && !expanded"
      :model-value="remaining / totalDuration * 100"
      :color="toast.color"
      size="sm"
      data-slot="progress"
      :class="ui.progress()"
    />
  </ToastRoot>
</template>
