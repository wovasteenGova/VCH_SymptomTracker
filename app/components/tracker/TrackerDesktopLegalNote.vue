<script setup lang="ts">
import { VCH_PRIVACY_URL, VCH_TERMS_URL } from '../../utils/subscription'
import { td } from '../../utils/trackerDesktopTheme'
</script>

<template>
  <p
    :class="['shrink-0 px-4 py-3 text-center text-xs leading-snug text-muted', td.divider]"
    role="note"
  >
    VCH Symptom Tracker helps you log symptoms and export reports. It is not medical or legal advice and does not guarantee any VA or benefits outcome.
    <a
      :href="VCH_TERMS_URL"
      target="_blank"
      rel="noopener noreferrer"
      :class="td.link"
    >Terms</a>
    and
    <a
      :href="VCH_PRIVACY_URL"
      target="_blank"
      rel="noopener noreferrer"
      :class="td.link"
    >Privacy</a>.
  </p>
</template>
