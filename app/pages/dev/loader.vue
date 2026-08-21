<template>
  <main class="mx-auto flex min-h-dvh max-w-lg flex-col gap-8 px-6 py-12">
    <header>
      <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">Dev</p>
      <h1 class="mt-1 text-2xl font-bold">Opening workspace loader</h1>
    </header>

    <VchOpeningWorkspaceLoader
      :full-screen="false"
      show-brand
      label="Setting up workspace"
    />

    <VchOpeningWorkspaceLoader
      :full-screen="false"
      :show-brand="false"
      label="Saving entry"
    />

    <p class="text-sm text-muted">
      Same component ClaimBuilder uses:
      <code class="rounded bg-elevated px-1.5 py-0.5">&lt;VchOpeningWorkspaceLoader /&gt;</code>
    </p>
  </main>
</template>
