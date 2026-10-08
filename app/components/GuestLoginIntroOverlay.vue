<script setup lang="ts">
defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
  'sign-in': []
}>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="open"
      :z-index="120"
      backdrop-class="bg-black/55"
      @dismiss="$emit('close')"
    >
      <Transition
        enter-active-class="transition duration-250 ease-out"
        enter-from-class="translate-y-6 opacity-0 sm:translate-y-0 sm:scale-95"
        enter-to-class="translate-y-0 opacity-100 sm:scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100 sm:scale-100"
        leave-to-class="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
      >
        <section
          v-if="open"
          class="app-overlay-panel app-overlay-panel--compact overflow-hidden rounded-[1.75rem] border border-default bg-elevated shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-login-intro-title"
        >
          <div class="flex shrink-0 items-start justify-between gap-3 border-b border-default px-5 py-4">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Your privacy
              </p>
              <h2 id="guest-login-intro-title" class="mt-1 text-xl font-bold text-highlighted">
                Sign in to keep your logs
              </h2>
            </div>
            <button
              type="button"
              class="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-toned transition hover:bg-accented"
              aria-label="Close"
              @click="$emit('close')"
            >
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>

          <div class="px-5 py-5">
            <p class="text-sm leading-7 text-toned">
              Your symptom data is stored securely. Our team does not read or review your entries.
            </p>
            <p class="mt-4 text-sm leading-7 text-toned">
              Signing in saves your history to your account so it is not lost if you clear this browser or switch devices.
            </p>
          </div>

          <div class="shrink-0 border-t border-default px-5 py-4">
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-bold text-white transition hover:opacity-90"
              @click="$emit('sign-in')"
            >
              <UIcon name="i-lucide-log-in" class="size-5" />
              Sign in
            </button>
            <button
              type="button"
              class="mt-3 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-muted transition hover:text-toned"
              @click="$emit('close')"
            >
              Not now
            </button>
          </div>
        </section>
      </Transition>
    </AppOverlayShell>
  </Transition>
</template>
