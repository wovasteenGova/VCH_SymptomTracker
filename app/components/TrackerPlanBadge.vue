<script setup lang="ts">
import { PRO_BADGE_CLASS, PRO_BADGE_ICON_CLASS } from '../utils/settingsSectionLayout'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md'
}>(), {
  size: 'sm'
})

const { isPro, entitlementsLoaded } = useEntitlements()

const badgeClass = computed(() => (
  props.size === 'md'
    ? 'px-2.5 py-1 text-[0.62rem]'
    : 'px-2 py-0.5 text-[0.58rem]'
))
</script>

<template>
  <span
    v-if="!entitlementsLoaded"
    class="inline-block animate-pulse rounded-full bg-muted"
    :class="size === 'md' ? 'h-5 w-14' : 'h-4 w-12'"
    aria-hidden="true"
  />
  <span
    v-else-if="isPro"
    class="inline-flex shrink-0 items-center gap-1 rounded-full font-bold uppercase tracking-[0.12em] ring-1"
    :class="[badgeClass, PRO_BADGE_CLASS]"
  >
    <UIcon
      name="i-lucide-crown"
      :class="[size === 'md' ? 'size-3' : 'size-2.5', PRO_BADGE_ICON_CLASS]"
    />
    Pro
  </span>
  <NuxtLink
    v-else
    to="/upgrade"
    class="inline-flex shrink-0 items-center gap-1 rounded-full font-bold uppercase tracking-[0.12em] ring-1 transition hover:bg-primary/20"
    :class="[badgeClass, 'bg-primary/10 text-primary ring-primary/40 dark:bg-primary/15 dark:text-primary dark:ring-primary/40']"
  >
    <UIcon
      name="i-lucide-crown"
      :class="size === 'md' ? 'size-3' : 'size-2.5'"
      class="text-primary"
    />
    Get Pro
  </NuxtLink>
</template>
