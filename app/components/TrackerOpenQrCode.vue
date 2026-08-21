<template>
  <div
    class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
  >
    <div class="shrink-0 rounded-xl bg-white p-2 ring-1 ring-slate-200 dark:ring-slate-700">
      <img
        v-if="qrDataUrl"
        :src="qrDataUrl"
        alt="QR code to open VCH Symptom Tracker on your phone"
        class="size-[7.5rem]"
        width="120"
        height="120"
      >
      <div
        v-else
        class="grid size-[7.5rem] place-items-center bg-slate-100 dark:bg-slate-800"
        aria-hidden="true"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-slate-500"
        />
      </div>
    </div>
    <div class="min-w-0">
      <p class="font-semibold text-slate-950 dark:text-white">
        Open on your phone
      </p>
      <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
        Scan to jump straight into the tracker — best for logging on the go.
      </p>
      <p class="mt-2 truncate text-xs text-slate-500 dark:text-slate-500">
        {{ targetUrl }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

const props = defineProps({
  url: {
    type: String,
    required: true
  }
})

const qrDataUrl = ref('')

onMounted(async () => {
  try {
    qrDataUrl.value = await QRCode.toDataURL(props.url, {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
  } catch {
    qrDataUrl.value = ''
  }
})

const targetUrl = computed(() => props.url.replace(/^https?:\/\//, ''))
</script>
