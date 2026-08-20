<template>
  <div
    class="border-t px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md supports-[backdrop-filter]:bg-opacity-90"
    :class="[
      isFloating
        ? 'fixed inset-x-0 z-40'
        : 'sticky bottom-0 z-30 -mx-4 sm:-mx-0',
      tone === 'dark'
        ? 'border-slate-800 bg-slate-950/95 supports-[backdrop-filter]:bg-slate-950/85'
        : 'border-default bg-default/95 supports-[backdrop-filter]:bg-default/85'
    ]"
    :style="floatingStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  tone?: 'light' | 'dark'
  keyboardOffset?: number
}>(), {
  tone: 'light',
  keyboardOffset: 0
})

const isFloating = computed(() => props.keyboardOffset > 0)

const floatingStyle = computed(() => {
  if (!isFloating.value) {
    return undefined
  }

  return {
    bottom: `${props.keyboardOffset}px`
  }
})
</script>
