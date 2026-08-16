<template>

  <div class="flex h-full min-h-0 flex-col overflow-hidden">

    <div class="shrink-0 px-2 pt-2">

      <div class="flex items-start justify-between gap-3">

        <div class="min-w-0 flex-1">

          <p

            v-if="mode === 'onboarding'"

            class="text-xs font-semibold uppercase tracking-[0.2em] text-muted"

          >

            Welcome

          </p>

          <h2

            class="text-2xl font-bold text-highlighted"

            :class="mode === 'onboarding' ? 'mt-1' : ''"

          >

            {{ mode === 'onboarding' ? 'Pick your conditions' : 'All conditions' }}

          </h2>

          <p
            v-if="mode === 'onboarding'"
            class="mt-2 text-sm leading-6 text-toned"
          >
            Pick catalog conditions or search to add your own — anything you want quick access to on your home screen.
          </p>

        </div>



        <button

          v-if="mode === 'manage'"

          type="button"

          class="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"

          @click="emit('done')"

        >

          Done

        </button>

      </div>

      <p
        v-if="mode === 'manage' && selectedCount === 0"
        class="mt-2 text-sm leading-6 text-toned"
      >
        Tap conditions below or search to add a custom one to your home screen.
      </p>



      <p v-if="error" class="mt-2 text-sm font-medium text-red-600 dark:text-red-300">

        {{ error }}

      </p>



      <input

        v-model="searchQuery"

        type="search"

        placeholder="Search conditions"

        class="mt-3 w-full border-0 border-b border-default/80 bg-transparent px-1 py-2.5 text-lg font-semibold text-highlighted outline-none placeholder:text-dimmed focus:border-primary"

      >

    </div>



    <div class="relative mt-3 min-h-0 flex-1">

      <div class="no-scrollbar h-full space-y-1 overflow-y-auto px-1 pb-24">

        <div

          v-if="showEmptyState"

          class="rounded-2xl px-3 py-8 text-center"

        >

          <p class="text-lg font-bold text-highlighted">No matches</p>

          <p class="mt-2 text-sm leading-6 text-toned">

            Add your own condition name below.

          </p>

          <button
            v-if="canAddCustomFromSearch"
            type="button"
            class="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
            @click="emitAddCustomFromSearch"
          >
            <UIcon name="i-lucide-plus" class="size-4" />
            Add "{{ trimmedSearchQuery }}"
          </button>

        </div>



        <button
          v-else-if="showAddCustomRow"
          type="button"
          class="mb-2 flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-left transition hover:bg-primary/10"
          @click="emitAddCustomFromSearch"
        >
          <span class="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <UIcon name="i-lucide-plus" class="size-7" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-lg font-bold leading-snug text-highlighted">
              Add "{{ trimmedSearchQuery }}"
            </span>
            <span class="mt-1 block text-sm leading-5 text-toned">
              Custom condition — track it on your home screen like any other.
            </span>
          </span>
        </button>



        <button

          v-for="condition in filteredConditions"

          :key="condition.key"

          type="button"

          class="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition active:scale-[0.995]"

          :class="isLocked(condition.key)

            ? 'opacity-80 hover:bg-amber-50/80 dark:hover:bg-amber-950/20'

            : isRestricted(condition.key)

              ? 'opacity-70 hover:bg-accented/40'

            : isSelected(condition.key)

              ? 'bg-muted ring-1 ring-default hover:bg-muted'

              : 'hover:bg-accented/40'"

          @click="handleConditionClick(condition.key)"

        >

          <img

            :src="condition.image"

            :alt="condition.title"

            class="size-16 shrink-0 rounded-2xl object-cover"

            :class="isLocked(condition.key) || isRestricted(condition.key) ? 'opacity-75' : ''"

          >



          <span class="min-w-0 flex-1">

            <span class="flex items-center gap-2">

              <span class="block text-lg font-bold leading-snug text-highlighted">

                {{ condition.title }}

              </span>

            </span>

            <span class="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">

              {{ condition.category }}

            </span>

            <span class="mt-1 block line-clamp-2 text-sm leading-5 text-toned">

              {{ condition.description }}

            </span>

          </span>



          <span

            v-if="isRestricted(condition.key)"

            class="flex shrink-0 flex-col items-center gap-1.5"

            aria-hidden="true"

          >

            <span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-toned">

              One MH

            </span>

            <UIcon

              name="i-lucide-ban"

              class="size-4 text-muted"

            />

          </span>



          <span

            v-else-if="isLocked(condition.key)"

            class="flex shrink-0 flex-col items-center gap-1.5"

            aria-hidden="true"

          >

            <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800 dark:bg-amber-950 dark:text-amber-200">

              Pro

            </span>

            <UIcon

              name="i-lucide-lock"

              class="size-4 text-amber-600 dark:text-amber-300"

            />

          </span>



          <span

            v-else

            class="grid size-10 shrink-0 place-items-center rounded-full transition duration-200"

            :class="isSelected(condition.key)

              ? 'bg-primary text-white shadow-md shadow-black/20 ring-2 ring-primary'

              : 'bg-elevated text-transparent ring-2 ring-default'"

            aria-hidden="true"

          >

            <UIcon

              name="i-lucide-check"

              class="size-5 transition duration-200"

              :class="isSelected(condition.key) ? 'scale-100 opacity-100' : 'scale-75 opacity-0'"

            />

          </span>

        </button>

      </div>

    </div>



    <div

      v-if="mode === 'onboarding'"

      class="shrink-0 border-t border-default bg-elevated px-2 py-3"

    >

      <button

        type="button"

        class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-40"

        :disabled="selectedCount === 0 || saving"

        @click="emit('confirm')"

      >

        {{ continueButtonLabel }}

        <UIcon name="i-lucide-arrow-right" class="size-5" />

      </button>

    </div>

  </div>

</template>



<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import { filterAndRankConditions } from '../utils/conditionSearch'



type ConditionOption = {

  key: string

  title: string

  category: string

  description: string

  image: string

}



const props = defineProps<{

  mode: 'onboarding' | 'manage'

  conditions: ConditionOption[]

  selectedKeys: string[]

  /** Frozen display order for manage mode; avoids jumping rows while toggling. */
  listOrderKeys?: string[]

  lockedKeys?: string[]

  /** Non-Pro locks (e.g. one mental health condition at a time). */
  restrictedKeys?: string[]

  showProLimit?: boolean

  saving?: boolean

  error?: string

  demoSearchQuery?: string

}>()



const emit = defineEmits<{

  toggle: [key: string]

  lockedSelect: [key: string]

  restrictedSelect: [key: string]

  addCustom: [label: string]

  confirm: []

  done: []

}>()



const searchQuery = ref('')

const debouncedSearchQuery = ref('')

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined



watch(searchQuery, (value) => {

  if (searchDebounceTimer) {

    clearTimeout(searchDebounceTimer)

  }



  searchDebounceTimer = setTimeout(() => {

    debouncedSearchQuery.value = value

  }, 180)

}, { immediate: true })

watch(() => props.demoSearchQuery, (value) => {
  if (value === undefined) {
    return
  }

  searchQuery.value = value
  debouncedSearchQuery.value = value
})

const lockedKeySet = computed(() => new Set(props.lockedKeys || []))
const restrictedKeySet = computed(() => new Set(props.restrictedKeys || []))



const selectedCount = computed(() => props.selectedKeys.length)

const continueButtonLabel = computed(() => {
  if (props.saving) {
    return 'Saving...'
  }

  if (selectedCount.value === 0) {
    return 'Continue'
  }

  if (selectedCount.value === 1) {
    const selectedKey = props.selectedKeys[0]
    const title = props.conditions.find((condition) => condition.key === selectedKey)?.title

    if (title) {
      return `Continue with ${title}`
    }
  }

  return `Continue with ${selectedCount.value} conditions`
})

const filteredConditions = computed(() => {
  const query = debouncedSearchQuery.value.trim()

  const results = filterAndRankConditions(props.conditions, query)

  if (props.mode !== 'manage' || query || !props.listOrderKeys?.length) {
    return results
  }

  const listOrder = new Map(props.listOrderKeys.map((key, index) => [key, index]))

  return [...results].sort((a, b) => {
    return (listOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (listOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER)
  })
})



const trimmedSearchQuery = computed(() => debouncedSearchQuery.value.trim())

const canAddCustomFromSearch = computed(() => {
  const query = trimmedSearchQuery.value
  if (!query) {
    return false
  }

  const lower = query.toLowerCase()
  return !props.conditions.some((condition) => condition.title.toLowerCase() === lower)
})

const showAddCustomRow = computed(() => {
  return canAddCustomFromSearch.value && filteredConditions.value.length > 0
})

const showEmptyState = computed(() => {

  return Boolean(trimmedSearchQuery.value) && filteredConditions.value.length === 0

})

function emitAddCustomFromSearch() {
  const label = trimmedSearchQuery.value
  if (!label) {
    return
  }

  emit('addCustom', label)
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
}



function isSelected(key: string) {

  return props.selectedKeys.includes(key)

}



function isLocked(key: string) {

  return lockedKeySet.value.has(key)

}

function isRestricted(key: string) {
  return restrictedKeySet.value.has(key)
}



function handleConditionClick(key: string) {

  if (isLocked(key)) {

    emit('lockedSelect', key)

    return

  }

  if (isRestricted(key)) {
    emit('restrictedSelect', key)
    return
  }

  emit('toggle', key)

}

</script>


