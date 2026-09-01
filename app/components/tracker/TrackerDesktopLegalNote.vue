<script setup lang="ts">
import { useVchPublicUrls } from '../../composables/useVchPublicUrls'
import { td } from '../../utils/trackerDesktopTheme'

const { privacyUrl, termsUrl } = useVchPublicUrls()
</script>

<template>
  <p
    :class="['shrink-0 px-4 py-3 text-center text-xs leading-snug text-muted', td.divider]"
    role="note"
  >
    VCH Symptom Tracker helps you log symptoms and export reports. It is not medical or legal advice and does not guarantee any VA or benefits outcome.
    <a
      :href="termsUrl"
      target="_blank"
      rel="noopener noreferrer"
      :class="td.link"
    >Terms</a>
    and
    <a
      :href="privacyUrl"
      target="_blank"
      rel="noopener noreferrer"
      :class="td.link"
    >Privacy</a>.
  </p>
</template>
