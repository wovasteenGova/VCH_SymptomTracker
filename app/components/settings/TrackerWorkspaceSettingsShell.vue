<script setup lang="ts">
import {
  mobileOverlayPanelClass,
  mobileOverlayShellClass
} from '../../utils/mobileOverlayShell'

withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  desktopMaxWidth?: string
  desktopMaxHeight?: string
  zIndex?: number
}>(), {
  zIndex: 110
})

const emit = defineEmits<{
  close: []
}>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
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
        v-if="open"
        :class="mobileOverlayShellClass(zIndex)"
        @click.self="emit('close')"
        @keydown="onKeydown"
      >
        <article
          :class="mobileOverlayPanelClass({
            desktopMaxWidth: desktopMaxWidth ?? 'lg:max-w-lg',
            desktopMaxHeight: desktopMaxHeight ?? 'lg:max-h-[min(80dvh,40rem)]',
            desktopHeight: ''
          })"
        >
          <header class="shrink-0 border-b border-default/60 px-5 py-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-lg font-semibold text-highlighted">
                  {{ title }}
                </h2>
                <p class="mt-1 text-sm leading-6 text-muted">
                  {{ description }}
                </p>
              </div>
              <button
                type="button"
                class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-elevated hover:text-highlighted"
                aria-label="Close"
                @click="emit('close')"
              >
                <UIcon
                  name="i-lucide-x"
                  class="size-5"
                />
              </button>
            </div>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <slot />
          </div>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>
