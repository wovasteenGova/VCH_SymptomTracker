<template>
  <component
    :is="overlay ? 'div' : 'main'"
    :class="overlay
      ? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-default text-default'
      : 'tracker-chrome-frame flex min-h-0 flex-col overflow-hidden bg-default text-default'"
  >
    <section
      :class="overlay
        ? 'flex min-h-0 flex-1 flex-col'
        : 'mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pt-4 sm:max-w-lg'"
    >
      <header
        v-if="!overlay"
        class="sticky top-0 z-40 -mx-4 flex shrink-0 items-center gap-3 border-b border-default bg-default/95 px-4 pb-4 pt-4 backdrop-blur-md"
      >
        <button
          v-if="closeEmbedProfile"
          type="button"
          class="grid size-10 shrink-0 place-items-center rounded-full bg-elevated text-highlighted shadow-sm ring-1 ring-default transition hover:bg-accented"
          aria-label="Back to tracker"
          @click="closeEmbedProfile()"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5" />
        </button>
        <NuxtLink
          v-else
          to="/"
          class="grid size-10 shrink-0 place-items-center rounded-full bg-elevated text-highlighted shadow-sm ring-1 ring-default transition hover:bg-accented"
          aria-label="Back to tracker"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5" />
        </NuxtLink>

        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Profile</p>
          <h1 class="mt-1 truncate text-xl font-bold tracking-tight text-highlighted">Account Settings</h1>
        </div>

        <p
          v-if="user && autoSaveLabel"
          class="shrink-0 text-xs font-semibold"
          :class="autoSaveState === 'error' ? 'text-red-300' : 'text-muted'"
          aria-live="polite"
        >
          {{ autoSaveLabel }}
        </p>
      </header>

      <section v-if="isAuthLoading" class="mt-6 shrink-0 rounded-xl border border-default/70 bg-elevated/20 p-5">
        <h2 class="text-xl font-bold text-highlighted">Loading account...</h2>
        <p class="mt-2 text-sm leading-6 text-muted">
          Checking your saved session.
        </p>
      </section>

      <form v-else-if="!user" class="mt-6 flex min-h-0 flex-1 flex-col" @submit.prevent="handleAuthSubmit">
        <div class="flex-1 overflow-y-auto no-scrollbar">
          <section class="rounded-xl border border-default/70 bg-elevated/20 p-5">
            <AuthModeTabs v-model="authMode" tone="dark" />

            <p class="mt-3 text-sm leading-6 text-muted">
              Sign in to save symptom entries, export reports, and manage deleted logs.
            </p>

            <div class="mt-5 space-y-4">
              <label v-if="authMode === 'signup'" class="block">
                <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Name</span>
                <input
                  v-model="authName"
                  type="text"
                  name="name"
                  autocomplete="name"
                  class="w-full rounded-3xl border border-default bg-elevated/40 px-4 py-4 text-base font-medium text-highlighted outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary/40"
                  placeholder="Your full name"
                  :required="authMode === 'signup'"
                >
              </label>

              <label class="block">
                <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Email</span>
                <input
                  v-model="authEmail"
                  type="email"
                  name="email"
                  autocomplete="email"
                  inputmode="email"
                  autocapitalize="none"
                  class="w-full rounded-3xl border border-default bg-elevated/40 px-4 py-4 text-base font-medium text-highlighted outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary/40"
                  placeholder="you@example.com"
                  required
                >
              </label>

              <label class="block">
                <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Password</span>
                <PasswordInput
                  v-if="authMode === 'login'"
                  key="auth-login-password"
                  v-model="authPassword"
                  name="password"
                  tone="dark"
                  autocomplete="current-password"
                  placeholder="Your password"
                  required
                />
                <PasswordInput
                  v-else
                  key="auth-signup-password"
                  v-model="authPassword"
                  name="password"
                  tone="dark"
                  autocomplete="new-password"
                  placeholder="At least 6 characters"
                  :minlength="6"
                  :revealed="signupPasswordReveal.visible"
                  :countdown="signupPasswordReveal.countdown"
                  @reveal="signupPasswordReveal.start"
                  required
                />
              </label>

              <label v-if="authMode === 'signup'" class="block">
                <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Confirm password</span>
                <PasswordInput
                  v-model="authConfirmPassword"
                  name="confirm-password"
                  autocomplete="new-password"
                  tone="dark"
                  placeholder="Re-enter password"
                  :show-toggle="false"
                  :required="authMode === 'signup'"
                />
              </label>

              <button
                v-if="authMode === 'login'"
                type="button"
                class="w-full rounded-2xl px-4 py-2 text-sm font-semibold text-muted"
                :disabled="isAuthSubmitting || isEmailCooldownActive"
                @click="handleForgotPassword"
              >
                {{ forgotPasswordLabel }}
              </button>

              <button
                v-if="needsEmailConfirmation"
                type="button"
                class="w-full rounded-2xl px-4 py-2 text-sm font-semibold text-primary"
                :disabled="isAuthSubmitting || !authEmail || isEmailCooldownActive"
                @click="handleResendConfirmation"
              >
                {{ resendConfirmationLabel }}
              </button>
            </div>
          </section>
        </div>

        <StickyActionBar tone="dark">
          <button
            type="submit"
            class="w-full rounded-2xl bg-primary px-5 py-4 text-base font-bold text-inverted shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
            :disabled="isAuthSubmitting"
          >
            {{ isAuthSubmitting ? 'Working...' : authMode === 'login' ? 'Sign in' : 'Create account' }}
          </button>

          <GoogleSignInButton
            class="mt-3"
            :text="authMode === 'signup' ? 'signup_with' : 'signin_with'"
            theme="dark"
            :disabled="isAuthSubmitting"
            @click="handleGoogleSignIn"
          />

          <PasskeySignInButton
            v-if="authMode === 'login' && isPasskeySupported"
            class="mt-3"
            theme="dark"
            :disabled="isAuthSubmitting"
            @click="handlePasskeySignIn"
          />

          <p
            v-else-if="authMode === 'signup' && isPasskeySupported"
            class="mt-3 text-center text-xs leading-5 text-muted"
          >
            Prefer passkeys? Create your account first, then add one under Profile &rarr; Passkeys.
          </p>
        </StickyActionBar>
      </form>

      <div
        v-else
        :class="overlay ? 'flex min-h-0 flex-1 flex-col' : 'mt-3 flex min-h-0 flex-1 flex-col'"
      >
        <SettingsSectionNav
          :sections="settingsSections"
          :scroll-root="settingsScrollEl"
          :compact="compact"
          :readable="readable"
        />

        <div
          ref="settingsScrollEl"
          class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain custom-scrollbar pb-[max(1rem,env(safe-area-inset-bottom))]"
          :class="[
            settingsSectionsStackClass(compact),
            settingsScrollBodyClass({ compact, overlay }),
            readable ? 'tracker-settings-readable' : ''
          ]"
        >
        <section
          id="settings-account"
          :class="settingsSectionClass(compact)"
        >
          <h3
            class="font-semibold text-highlighted"
            :class="readable ? 'text-lg' : 'text-sm'"
          >
            Account
          </h3>

          <div
            v-if="entitlementsLoaded && signInMethodLabel"
            class="mt-3 flex flex-wrap items-center gap-2"
          >
            <p class="flex items-center gap-1.5 text-xs text-muted">
              <UIcon
                v-if="usesGoogleLogin"
                name="i-lucide-chrome"
                class="size-3.5 shrink-0"
              />
              {{ signInMethodLabel }}
            </p>
          </div>

          <p
            v-if="!overlay && user?.email"
            class="mt-2 truncate text-xs text-muted"
          >
            {{ user.email }}
          </p>

          <p
            v-if="entitlementsLoaded"
            class="mt-2 text-xs leading-5 text-muted"
          >
            Symptom Tracker is free: unlimited conditions, logging charts, PDF exports, and family reporting links.
          </p>

          <div class="mt-3 flex w-full flex-col items-stretch gap-2">
            <label
              for="tracker-settings-real-name"
              class="block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
            >
              Real name
            </label>
            <UInput
              id="tracker-settings-real-name"
              v-model="profileForm.full_name"
              class="w-full"
              :size="settingsInputSize"
              :loading="isSavingProfile || autoSaveState === 'saving'"
              placeholder="Your name"
              autocomplete="name"
            />
            <p
              class="text-xs leading-5"
              :class="autoSaveState === 'error' ? 'text-error' : 'text-muted'"
            >
              {{ nameSaveHint || 'Use real name' }}
            </p>

            <label
              for="tracker-settings-phone"
              class="mt-1 block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
            >
              Phone number
            </label>
            <UInput
              id="tracker-settings-phone"
              :model-value="serviceDraft.phone ?? ''"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              class="w-full"
              :size="settingsInputSize"
              :loading="isSavingProfile || autoSaveState === 'saving'"
              placeholder="(555) 555-5555"
              @update:model-value="serviceDraft.phone = ($event as string).trim() || null; onServiceFieldInput()"
            />

            <label
              for="tracker-settings-dob"
              class="mt-1 block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
            >
              Date of birth
            </label>
            <UInput
              id="tracker-settings-dob"
              :model-value="serviceDraft.date_of_birth ?? ''"
              type="date"
              class="w-full"
              :size="settingsInputSize"
              :loading="isSavingProfile || autoSaveState === 'saving'"
              @update:model-value="serviceDraft.date_of_birth = ($event as string) || null; onServiceFieldInput()"
            />

            <div class="mt-3 overflow-hidden rounded-xl border border-default/60 bg-default/30">
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-elevated/30"
                :aria-expanded="projectSettingsExpanded"
                @click="projectSettingsExpanded = !projectSettingsExpanded"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">
                    Project settings
                  </p>
                  <p
                    class="mt-0.5 truncate text-xs leading-5"
                    :class="projectSettingsHasDetails ? 'text-highlighted' : 'text-muted'"
                  >
                    {{ projectSettingsSummary }}
                  </p>
                </div>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="size-4 shrink-0 text-muted transition-transform duration-200"
                  :class="projectSettingsExpanded ? 'rotate-180' : ''"
                />
              </button>

              <div
                v-show="projectSettingsExpanded"
                class="space-y-3 border-t border-default/60 px-3 py-3"
              >
                <div>
                  <label
                    for="tracker-settings-service-branch"
                    class="mb-1 block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
                  >
                    Branch
                  </label>
                  <USelectMenu
                    id="tracker-settings-service-branch"
                    class="w-full"
                    :model-value="serviceDraft.service_branch ?? undefined"
                    :items="serviceBranchItems"
                    value-key="value"
                    label-key="label"
                    placeholder="Select branch"
                    :size="settingsInputSize"
                    color="primary"
                    :ui="settingsSelectMenuUi"
                    :content="settingsSelectMenuContent"
                    @update:model-value="onServiceBranchChange"
                  />
                </div>

                <div>
                  <label
                    for="tracker-settings-rank"
                    class="mb-1 block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
                  >
                    Rank
                  </label>
                  <UInput
                    id="tracker-settings-rank"
                    :model-value="serviceDraft.service_rank ?? ''"
                    class="w-full"
                    :size="settingsInputSize"
                    :loading="isSavingProfile || autoSaveState === 'saving'"
                    placeholder="e.g. E-5, Sergeant, Captain"
                    autocomplete="off"
                    @update:model-value="serviceDraft.service_rank = ($event as string) || null; onServiceFieldInput()"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      for="tracker-settings-year-in"
                      class="mb-1 block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
                    >
                      Year in
                    </label>
                    <UInput
                      id="tracker-settings-year-in"
                      :model-value="serviceDraft.service_start_year?.toString() ?? ''"
                      type="number"
                      min="1940"
                      max="2100"
                      inputmode="numeric"
                      class="w-full"
                      :size="settingsInputSize"
                      placeholder="2008"
                      @update:model-value="onServiceYearInput('service_start_year', String($event ?? ''))"
                    />
                  </div>
                  <div>
                    <label
                      for="tracker-settings-year-out"
                      class="mb-1 block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
                    >
                      Year out
                    </label>
                    <UInput
                      id="tracker-settings-year-out"
                      :model-value="serviceDraft.service_end_year?.toString() ?? ''"
                      type="number"
                      min="1940"
                      max="2100"
                      inputmode="numeric"
                      class="w-full"
                      :size="settingsInputSize"
                      placeholder="2012"
                      @update:model-value="onServiceYearInput('service_end_year', String($event ?? ''))"
                    />
                  </div>
                </div>

                <p
                  class="text-xs leading-5"
                  :class="autoSaveState === 'error' ? 'text-error' : 'text-muted'"
                >
                  {{ serviceSaveHint || 'Used for claim packets and export headers.' }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="user"
            :class="SETTINGS_ACCOUNT_HELP_CLASS"
          >
            <span>Issues?</span>
            <a
              :href="contactUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-primary underline decoration-primary/40 underline-offset-2 transition hover:text-primary/80"
              @pointerdown.stop
            >
              Contact us
            </a>
            <span aria-hidden="true" class="text-muted">·</span>
            <button
              type="button"
              class="font-semibold text-primary underline decoration-primary/40 underline-offset-2 transition hover:text-primary/80"
              @pointerdown.stop
              @click="supportOverlays.openFaq()"
            >
              FAQ
            </button>
          </div>
        </section>

        <div
          v-if="needsAppWelcome"
          class="settings-section-block scroll-mt-3 rounded-4xl border border-teal-500/40 bg-teal-950/40 p-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Setup incomplete</p>
          <p class="mt-2 text-sm leading-6 text-teal-50">
            Finish the quick setup wizard to choose how often you log and accept the terms.
          </p>
          <NuxtLink
            to="/"
            class="mt-4 inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-300"
          >
            Resume setup
            <UIcon name="i-lucide-arrow-right" class="size-4" />
          </NuxtLink>
        </div>

        <section id="settings-display" :class="settingsSectionClass(compact)">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Display</p>
          <h2 class="mt-1 text-xl font-bold text-highlighted">Tracker layout</h2>
          <p class="mt-2 text-sm leading-6 text-muted">
            Auto hides arrow controls on small screens. Choose desktop to keep arrows and the wide layout on a tablet or narrow window.
          </p>

          <div class="mt-5 flex items-center justify-between gap-4 rounded-3xl border border-default bg-elevated/30 px-4 py-3">
            <div class="min-w-0">
              <p class="font-bold text-highlighted">Color theme</p>
              <p class="mt-1 text-sm leading-6 text-muted">
                Pick a palette and light or dark mode.
              </p>
            </div>
            <VchThemeToggle size="md" />
          </div>

          <div class="mt-4 grid gap-3">
            <button
              v-for="option in layoutOptions"
              :key="option.value"
              type="button"
              class="rounded-3xl border px-4 py-4 text-left transition"
              :class="layoutMode === option.value
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-default bg-elevated/30'"
              @click="chooseLayoutMode(option.value)"
            >
              <span class="block font-bold text-highlighted">{{ option.label }}</span>
              <span class="mt-1 block text-sm leading-6 text-muted">{{ option.copy }}</span>
            </button>
          </div>
        </section>

        <PwaInstallSettingsSection :compact="compact" />

        <section id="settings-passkeys" :class="settingsSectionClass(compact)">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Sign-in &amp; security</p>
          <h2 class="mt-1 text-xl font-bold text-highlighted">Passkeys</h2>
          <p class="mt-2 text-sm leading-6 text-muted">
            Sign in with your fingerprint, face, or device PIN instead of a password. Passkeys stay on your device and cannot be phished.
          </p>

          <p v-if="!isPasskeySupported" class="mt-3 text-sm leading-6 text-amber-200">
            This browser does not support passkeys. Try a modern browser on your phone or computer.
          </p>

          <template v-else>
            <p v-if="passkeysError" class="mt-3 text-sm font-medium text-red-300">{{ passkeysError }}</p>
            <p v-if="passkeyActionError" class="mt-3 text-sm font-medium text-red-300">{{ passkeyActionError }}</p>

            <div v-if="isLoadingPasskeys && !passkeys.length" class="mt-4 space-y-2">
              <div class="h-16 animate-pulse rounded-3xl bg-elevated/50" />
            </div>

            <div v-else-if="passkeys.length" class="mt-4 space-y-2">
              <div
                v-for="passkey in passkeys"
                :key="passkey.id"
                class="rounded-3xl border border-default bg-elevated/30 px-4 py-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <UIcon name="i-lucide-fingerprint" class="size-5 shrink-0 text-primary" />
                    <div class="min-w-0">
                      <template v-if="renamingPasskeyId === passkey.id">
                        <input
                          v-model="renamePasskeyName"
                          type="text"
                          maxlength="120"
                          class="w-full rounded-2xl border border-default bg-default px-3 py-2 text-sm font-semibold text-highlighted outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                          placeholder="Name this passkey (e.g. My phone)"
                          @keydown.enter.prevent="saveRenamePasskey"
                          @keydown.esc="cancelRenamePasskey"
                        >
                      </template>
                      <template v-else>
                        <p class="truncate font-bold text-highlighted">{{ passkey.friendly_name || 'Passkey' }}</p>
                        <p class="mt-0.5 text-xs text-muted">
                          Added {{ formatPasskeyDate(passkey.created_at) }}<template v-if="passkey.last_used_at"> · Last used {{ formatPasskeyDate(passkey.last_used_at) }}</template>
                        </p>
                      </template>
                    </div>
                  </div>

                  <div class="flex shrink-0 items-center gap-1">
                    <template v-if="renamingPasskeyId === passkey.id">
                      <button
                        type="button"
                        class="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-inverted disabled:opacity-60"
                        :disabled="isPasskeyBusy"
                        @click="saveRenamePasskey"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        class="rounded-full bg-elevated px-3 py-1.5 text-xs font-bold text-muted"
                        :disabled="isPasskeyBusy"
                        @click="cancelRenamePasskey"
                      >
                        Cancel
                      </button>
                    </template>
                    <template v-else>
                      <button
                        type="button"
                        class="rounded-full p-2 text-muted transition hover:bg-accented hover:text-highlighted"
                        aria-label="Rename passkey"
                        @click="startRenamePasskey(passkey)"
                      >
                        <UIcon name="i-lucide-pencil" class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="rounded-full p-2 text-muted transition hover:bg-red-950 hover:text-red-300"
                        aria-label="Delete passkey"
                        @click="requestDeletePasskey(passkey)"
                      >
                        <UIcon name="i-lucide-trash-2" class="size-4" />
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <p v-else class="mt-4 text-sm leading-6 text-muted">
              No passkeys yet. Add one to sign in without your password next time.
            </p>

            <button
              type="button"
              class="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-inverted transition hover:bg-primary/90 disabled:opacity-60"
              :disabled="isAddingPasskey || isPasskeyBusy"
              @click="handleAddPasskey"
            >
              <UIcon name="i-lucide-plus" class="size-4" />
              {{ isAddingPasskey ? 'Waiting for your device...' : 'Add a passkey' }}
            </button>
          </template>
        </section>

        <section id="settings-sessions" :class="settingsSectionClass(compact)">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-red-600/80 dark:text-red-300/80">Sign-in &amp; security</p>
          <h2 class="mt-1 text-xl font-bold text-highlighted">Sessions</h2>
          <p class="mt-2 text-sm leading-6 text-muted">
            Signed in on a shared or borrowed computer? Use <span class="font-semibold text-muted">Sign out everywhere</span> so no one else can open your logs. You can sign back in anytime with your passkey, Google, or email.
          </p>

          <div class="mt-4 rounded-3xl border border-default bg-elevated/30 px-4 py-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-monitor-smartphone" class="mt-0.5 size-5 shrink-0 text-primary" />
              <div class="min-w-0">
                <p class="font-bold text-highlighted">Signed in in this browser</p>
                <p class="mt-1 text-xs text-muted">
                  Other browsers or computers you used are not listed here yet.
                </p>
                <p v-if="sessionSignInMethodLabel" class="mt-1 text-sm text-muted">
                  {{ sessionSignInMethodLabel }}
                </p>
                <p v-if="sessionLastSignInLabel" class="mt-1 text-xs text-muted">
                  {{ sessionLastSignInLabel }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-2xl bg-elevated px-4 py-3 text-sm font-bold text-highlighted ring-1 ring-default transition hover:bg-accented disabled:opacity-60"
              :disabled="Boolean(pendingSessionAction)"
              @click="handleSignOut"
            >
              {{ pendingSessionAction === 'local' ? 'Signing out...' : 'Sign out in this browser' }}
            </button>
            <button
              type="button"
              class="rounded-2xl bg-red-950/40 px-4 py-3 text-sm font-bold text-red-200 ring-1 ring-red-900/60 transition hover:bg-red-950/60 disabled:opacity-60"
              :disabled="Boolean(pendingSessionAction)"
              @click="handleSignOutEverywhere"
            >
              {{ pendingSessionAction === 'everywhere' ? 'Signing out...' : 'Sign out everywhere' }}
            </button>
          </div>
        </section>

        <section id="settings-recovery" :class="settingsSectionClass(compact)">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Deleted Entries</p>
            <h2 class="mt-1 text-xl font-bold text-highlighted">Recovery bin</h2>
            <p class="mt-2 text-sm leading-6 text-muted">
              Entries removed from your log stay here until you restore or permanently remove them.
            </p>
          </div>

          <div v-if="!deletedHistoryEntries.length" class="mt-5 rounded-3xl border border-default bg-default/60 p-5 text-center text-sm text-muted">
            No deleted entries.
          </div>

          <div v-else class="mt-5 space-y-3">
            <article
              v-for="entry in deletedHistoryEntries"
              :key="entry.id"
              class="rounded-3xl border border-default bg-default/60 p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge color="neutral" variant="soft" size="md">{{ entry.condition }}</UBadge>
                    <UBadge color="error" variant="soft" size="md">Deleted</UBadge>
                  </div>
                  <h3 class="mt-2 font-bold text-highlighted">{{ entry.title }}</h3>
                  <p class="mt-1 text-xs text-muted">{{ entry.deletedLabel }}</p>
                </div>

                <div class="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    class="rounded-full bg-primary px-3 py-2 text-xs font-bold text-inverted"
                    :disabled="isRestoringEntryId === entry.id"
                    @click="restoreDeletedEntry(entry.id)"
                  >
                    {{ isRestoringEntryId === entry.id ? 'Restoring...' : 'Restore' }}
                  </button>
                  <button
                    type="button"
                    class="rounded-full px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-950/40"
                    @click="requestPurgeDeletedEntry(entry.id)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="settings-danger" :class="settingsSectionClass(compact)">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-red-300/80">Data control</p>
            <h2 class="mt-1 text-xl font-bold text-highlighted">Delete entries</h2>
            <p class="mt-2 text-sm leading-6 text-muted">
              Remove logs for specific conditions. Active entries move to your Recovery bin; entries already in Recovery are removed permanently.
            </p>
          </div>

          <button
            type="button"
            class="mt-5 w-full rounded-2xl bg-red-950/35 px-4 py-3 text-sm font-bold text-red-200 ring-1 ring-red-900/50 transition hover:bg-red-950/55"
            @click="openDeleteEntriesModal"
          >
            Delete entries
          </button>

          <div class="mt-8 border-t border-default/70 pt-8">
            <h2 class="text-xl font-bold text-highlighted">Delete all logs</h2>
            <p class="mt-2 text-sm leading-6 text-muted">
              Permanently remove every symptom entry from your account, including items in your recovery bin. Your profile, plan, and condition picks stay saved.
            </p>
            <p v-if="activeLogCount > 0" class="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {{ activeLogCount }} {{ activeLogCount === 1 ? 'entry' : 'entries' }} saved
            </p>
            <p v-else class="mt-3 text-xs leading-5 text-muted">
              No logs saved right now. You can still use this setting anytime you need a fresh start.
            </p>

            <button
              type="button"
              class="mt-5 w-full rounded-2xl bg-red-950/50 px-4 py-3 text-sm font-bold text-red-300 ring-1 ring-red-900/60 transition hover:bg-red-950/70"
              @click="openDeleteAllLogsModal"
            >
              Delete all logs
            </button>
          </div>
        </section>

        <p v-if="pageError" class="px-1 py-3 text-sm font-medium text-red-600 dark:text-red-200">
          {{ pageError }}
        </p>
        </div>
      </div>
    </section>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="pendingPurgeEntry"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
        @click.self="cancelPurgeDeletedEntry"
      >
        <div class="w-full max-w-md rounded-[1.75rem] border border-default/80 bg-default p-5 shadow-2xl">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">Permanent removal</p>
          <h3 class="mt-2 text-xl font-bold text-highlighted">Remove forever?</h3>
          <p class="mt-3 text-sm leading-6 text-muted">
            <span class="font-semibold text-highlighted">{{ pendingPurgeEntry.title }}</span>
            will be removed from your deleted archive. This cannot be undone.
          </p>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-2xl bg-elevated px-4 py-3 text-sm font-bold text-highlighted"
              @click="cancelPurgeDeletedEntry"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-highlighted"
              @click="confirmPurgeDeletedEntry"
            >
              Remove forever
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <DeleteEntriesByConditionSheet
      v-if="isDeleteEntriesModalOpen"
      :conditions="deletableConditionGroups"
      :selected-keys="selectedDeleteConditionKeys"
      :loading="isLoadingDeleteEntriesModal"
      :deleting="isDeletingSelectedEntries"
      :error="deleteEntriesError"
      @dismiss="closeDeleteEntriesModal"
      @toggle="toggleDeleteConditionSelection"
      @confirm="confirmDeleteSelectedEntries"
    />

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isDeleteAllLogsModalOpen"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
        @click.self="closeDeleteAllLogsModal"
      >
        <form
          class="w-full max-w-md rounded-[1.75rem] border border-default/80 bg-default p-5 shadow-2xl"
          @submit.prevent="confirmDeleteAllLogs"
        >
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-red-300/80">Delete all logs</p>
          <h3 class="mt-2 text-xl font-bold text-highlighted">Remove every entry?</h3>
          <p class="mt-3 text-sm leading-6 text-muted">
            This permanently deletes all symptom logs and clears your recovery bin. It cannot be undone.
          </p>

          <label v-if="usesPasswordLogin" class="mt-5 block">
            <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Password</span>
            <PasswordInput
              v-model="deleteAllLogsPassword"
              tone="dark"
              autocomplete="current-password"
              placeholder="Enter your account password"
              required
            />
          </label>

          <label v-else class="mt-5 block">
            <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Confirmation</span>
            <input
              v-model="deleteAllLogsConfirmPhrase"
              type="text"
              autocomplete="off"
              class="w-full rounded-3xl border border-default bg-elevated/40 px-4 py-4 text-base font-medium text-highlighted outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary/40"
              placeholder="Type DELETE ALL LOGS"
              required
            >
            <p class="mt-2 px-1 text-xs leading-5 text-muted">
              Google sign-in accounts must type <span class="font-semibold text-muted">DELETE ALL LOGS</span> to confirm.
            </p>
          </label>

          <p v-if="deleteAllLogsError" class="mt-3 text-sm font-medium text-red-300">{{ deleteAllLogsError }}</p>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-2xl bg-elevated px-4 py-3 text-sm font-bold text-highlighted"
              :disabled="isDeletingAllLogs"
              @click="closeDeleteAllLogsModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-highlighted disabled:opacity-60"
              :disabled="isDeletingAllLogs"
            >
              {{ isDeletingAllLogs ? 'Deleting...' : 'Delete all logs' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="pendingDeletePasskey"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
        @click.self="cancelDeletePasskey"
      >
        <div class="w-full max-w-md rounded-[1.75rem] border border-default/80 bg-default p-5 shadow-2xl">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">Delete passkey</p>
          <h3 class="mt-2 text-xl font-bold text-highlighted">Remove this passkey?</h3>
          <p class="mt-3 text-sm leading-6 text-muted">
            <span class="font-semibold text-highlighted">{{ pendingDeletePasskey.friendly_name || 'This passkey' }}</span>
            will stop working for sign-in immediately. You can still sign in with your other methods, and you can add a new passkey any time.
          </p>

          <p v-if="deletePasskeyError" class="mt-3 text-sm font-medium text-red-300">{{ deletePasskeyError }}</p>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-2xl bg-elevated px-4 py-3 text-sm font-bold text-highlighted"
              :disabled="isDeletingPasskey"
              @click="cancelDeletePasskey"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-highlighted disabled:opacity-60"
              :disabled="isDeletingPasskey"
              @click="confirmDeletePasskey"
            >
              {{ isDeletingPasskey ? 'Deleting...' : 'Delete passkey' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <FaqOverlay
      v-if="!overlay"
      :open="settingsFaqOpen"
      @close="supportOverlays.closeFaq()"
    />

    <TrackerLayReportingSettingsOverlay
      v-if="!overlay"
      :open="layReportingSettingsOpen"
      @close="closeHeaderSettingsOverlays"
    />

    <TrackerLogNotificationsSettingsOverlay
      v-if="!overlay"
      :open="logNotificationsSettingsOpen"
      @close="closeHeaderSettingsOverlays"
    />
  </component>
</template>

<script setup lang="ts">
import { useTimedPasswordReveal } from '../composables/useTimedPasswordReveal'
import { useSupabaseAuth } from '../composables/useSupabaseAuth'
import { usePasskeys, type TrackerPasskey } from '../composables/usePasskeys'
import { useUserProfiles } from '../composables/useUserProfiles'
import { useSymptomEntries } from '../composables/useSymptomEntries'
import { useEntitlements } from '../composables/useEntitlements'
import { useAppWelcome } from '../composables/useAppWelcome'
import { useTrackedConditions } from '../composables/useTrackedConditions'
import { useLogReminders } from '../composables/useLogReminders'
import { useTrackerHeaderSettingsOverlays } from '../composables/useTrackerHeaderSettingsOverlays'
import { useTrackerLayReportingSettings } from '../composables/useTrackerLayReportingSettings'
import TrackerLayReportingSettingsOverlay from '../components/settings/TrackerLayReportingSettingsOverlay.vue'
import TrackerLogNotificationsSettingsOverlay from '../components/settings/TrackerLogNotificationsSettingsOverlay.vue'
import { useTrackerLayout, TRACKER_CLOSE_EMBED_PROFILE_KEY, TRACKER_CLOSE_SETTINGS_KEY } from '../composables/useTrackerLayout'
import type { TrackerLayoutMode } from '../utils/trackerLayoutState'
import type { SettingsSection } from '../composables/useSettingsSectionNav'
import { mapEntryHistoryItem } from '../utils/entryDisplay'
import { buildDeletableConditionGroups, type DeletableConditionGroup } from '../utils/deletableConditionGroups'
import {
  SETTINGS_ACCOUNT_HELP_CLASS,
  settingsSectionsStackClass,
  settingsScrollBodyClass,
  settingsSectionClass
} from '../utils/settingsSectionLayout'
import {
  EMPTY_VETERAN_SERVICE_PROFILE,
  SERVICE_BRANCH_OPTIONS,
  formatVeteranServiceProfileSummary,
  hasVeteranServiceProfileDetails,
  normalizeVeteranServiceProfilePatch,
  readVeteranServiceProfileFromRow,
  type VeteranServiceProfile
} from '#shared/veteranServiceProfile'
import { AUTH_NOTICES, authNoticeToast, authSuccessToast, handleAuthApiFailure, resolveAuthApiErrorMessage, validateSignupForm, AUTH_VALIDATION, authErrorToast, isEmailConfirmationNotice } from '../utils/authNotices'
import { useVchPublicUrls } from '../composables/useVchPublicUrls'
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = withDefaults(defineProps<{
  overlay?: boolean
  compact?: boolean
  readable?: boolean
  initialSection?: string | null
}>(), {
  overlay: false,
  compact: false,
  readable: false,
  initialSection: null
})

const emit = defineEmits<{
  close: []
}>()

const settingsInputSize = computed(() => {
  if (props.readable) return 'lg'
  if (props.compact) return 'sm'
  return 'md'
})

const route = useRoute()
const closeEmbedProfile = inject<(() => void) | null>(TRACKER_CLOSE_EMBED_PROFILE_KEY, null)
const closeSettings = inject<(() => void) | null>(TRACKER_CLOSE_SETTINGS_KEY, null)
const settingsScrollEl = ref<HTMLElement | null>(null)

function closeSettingsPanel() {
  if (closeSettings) {
    closeSettings()
    return
  }

  if (closeEmbedProfile) {
    closeEmbedProfile()
    return
  }

  emit('close')
}

const settingsSections: SettingsSection[] = [
  { id: 'settings-account', label: 'Account' },
  { id: 'settings-display', label: 'Display' },
  { id: 'settings-install', label: 'Install app' },
  { id: 'settings-passkeys', label: 'Passkeys' },
  { id: 'settings-sessions', label: 'Sessions' },
  { id: 'settings-recovery', label: 'Recovery' },
  { id: 'settings-danger', label: 'Delete logs' }
]

const {
  user,
  isAuthLoading,
  authError,
  signIn,
  signUp,
  resendConfirmationEmail,
  signInWithGoogle,
  sendPasswordReset,
  signOut,
  signOutEverywhere,
  verifyPassword
} = useSupabaseAuth()
const {
  passkeys,
  isLoadingPasskeys,
  passkeysError,
  isPasskeyBusy,
  isPasskeySupported,
  signInWithPasskey,
  registerPasskey,
  loadPasskeys,
  renamePasskey,
  deletePasskey,
  clearPasskeys
} = usePasskeys()
const {
  getProfile,
  upsertProfile
} = useUserProfiles()
const { showSubmissionToast } = useSubmissionToast()
const { loadTrackedConditions } = useTrackedConditions()
const {
  layReportingOpen: layReportingSettingsOpen,
  logNotificationsOpen: logNotificationsSettingsOpen,
  closeHeaderSettingsOverlays,
  openLayReportingSettingsOverlay
} = useTrackerHeaderSettingsOverlays()
const { applySupporterLinkFromRoute } = useTrackerLayReportingSettings()
const {
  listEntries,
  listDeletedEntries,
  restoreEntry,
  purgeDeletedEntry,
  deleteAllEntries,
  removeAllEntriesForConditionKeys
} = useSymptomEntries()
const {
  canTrackCondition,
  entitlementsLoaded,
  loadEntitlements
} = useEntitlements()
const {
  needsAppWelcome,
  loadAppWelcomeState
} = useAppWelcome()
const {
  hydrateReminderSettings,
  refreshPushReminderStatus
} = useLogReminders()
const { layoutMode, setLayoutMode } = useTrackerLayout()

const layoutOptions: Array<{ value: TrackerLayoutMode, label: string, copy: string }> = [
  {
    value: 'auto',
    label: 'Auto',
    copy: 'Use mobile layout on small screens and desktop arrows on wider screens.'
  },
  {
    value: 'desktop',
    label: 'Desktop',
    copy: 'Keep the three-panel desktop workspace on wide screens. On narrower windows, falls back to the phone carousel with arrow controls.'
  },
  {
    value: 'mobile',
    label: 'Mobile',
    copy: 'Always use the compact phone layout, even on a large screen.'
  }
]

const { contactUrl } = useVchPublicUrls()

const authMode = ref<'login' | 'signup'>('login')
const authName = ref('')
const authEmail = ref('')
const {
  isEmailCooldownActive,
  resendConfirmationLabel,
  forgotPasswordLabel,
  refreshCooldown
} = useAuthEmailCooldown(authEmail)
const authPassword = ref('')
const authConfirmPassword = ref('')
const signupPasswordReveal = useTimedPasswordReveal()
const authValidationMessage = ref('')
const needsEmailConfirmation = ref(false)
const isAuthSubmitting = ref(false)

watch(authMode, () => {
  signupPasswordReveal.hide()
  authConfirmPassword.value = ''
  authValidationMessage.value = ''
})

// Cached across visits so the page renders instantly with the last known
// data instead of flashing empty sections on every navigation.
const profileForm = useState('profile-page-form', () => ({
  full_name: ''
}))
const serviceDraft = ref<VeteranServiceProfile>({ ...EMPTY_VETERAN_SERVICE_PROFILE })
const projectSettingsExpanded = ref(false)
const serviceBranchItems: Array<{ label: string, value: string }> = [
  ...SERVICE_BRANCH_OPTIONS
]
const settingsSelectMenuUi = {
  base: 'w-full',
  content: 'z-[130] min-w-72 max-w-96',
  itemLabel: 'whitespace-normal truncate-none'
}
const settingsSelectMenuContent = {
  align: 'start' as const,
  side: 'bottom' as const,
  sideOffset: 4,
  collisionPadding: 8
}
const deletedEntries = ref<any[]>([])
const pageError = ref('')
const isSavingProfile = ref(false)
const profileInitialized = useState('profile-page-initialized', () => false)
const isHydratingProfile = ref(false)
const autoSaveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const autoSaveLabel = computed(() => {
  if (autoSaveState.value === 'saving') {
    return 'Saving...'
  }

  if (autoSaveState.value === 'saved') {
    return 'Saved'
  }

  if (autoSaveState.value === 'error') {
    return 'Save failed'
  }

  return ''
})

const nameSaveHint = computed(() => {
  if (autoSaveState.value === 'saving') return 'Saving…'
  if (autoSaveState.value === 'saved') return 'Saved'
  if (autoSaveState.value === 'error') return 'Could not save. Try again.'
  return ''
})

const serviceSaveHint = computed(() => {
  if (autoSaveState.value === 'saving') return 'Saving…'
  if (autoSaveState.value === 'saved') return 'Saved'
  if (autoSaveState.value === 'error') return 'Could not save. Try again.'
  return ''
})

const projectSettingsSummary = computed(() => {
  const summary = formatVeteranServiceProfileSummary(serviceDraft.value)
  if (summary) return summary
  return 'Branch, rank, and service years'
})

const projectSettingsHasDetails = computed(() =>
  hasVeteranServiceProfileDetails(serviceDraft.value)
)

let profileSaveTimer: ReturnType<typeof setTimeout> | undefined
let serviceSaveTimer: ReturnType<typeof setTimeout> | undefined
let savedLabelTimer: ReturnType<typeof setTimeout> | undefined
let profileLoadSequence = 0
const isRestoringEntryId = ref<string | null>(null)
const pendingPurgeEntry = ref<null | { id: string, title: string }>(null)
const activeLogCount = useState('profile-page-log-count', () => 0)
const supportOverlays = useSettingsSupportOverlays()
const { faqOpen: settingsFaqOpen } = supportOverlays
const isDeleteAllLogsModalOpen = ref(false)
const deleteAllLogsPassword = ref('')
const deleteAllLogsConfirmPhrase = ref('')
const deleteAllLogsError = ref('')
const isDeletingAllLogs = ref(false)
const isDeleteEntriesModalOpen = ref(false)
const isLoadingDeleteEntriesModal = ref(false)
const isDeletingSelectedEntries = ref(false)
const deleteEntriesError = ref('')
const deletableConditionGroups = ref<DeletableConditionGroup[]>([])
const selectedDeleteConditionKeys = ref<string[]>([])

const usesPasswordLogin = computed(() => {
  return Boolean(user.value?.identities?.some((identity) => identity.provider === 'email'))
})

const usesGoogleLogin = computed(() => {
  return Boolean(user.value?.identities?.some((identity) => identity.provider === 'google'))
})

const signInMethodLabel = computed(() => {
  const providers = new Set(user.value?.identities?.map((identity) => identity.provider) ?? [])
  const methods: string[] = []

  if (providers.has('google')) {
    methods.push('Google')
  }

  if (providers.has('webauthn')) {
    methods.push('passkey')
  }

  if (providers.has('email')) {
    methods.push('email & password')
  }

  if (!methods.length) {
    return ''
  }

  return `Signed in with ${methods.join(' and ')}`
})

const sessionSignInMethodLabel = computed(() => {
  if (signInMethodLabel.value) {
    return signInMethodLabel.value
  }

  if (passkeys.value.length) {
    return 'Passkey available on this account'
  }

  return 'Sign-in method unavailable'
})

const sessionLastSignInLabel = computed(() => {
  const lastSignInAt = user.value?.last_sign_in_at

  if (!lastSignInAt) {
    return ''
  }

  const parsed = new Date(lastSignInAt)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return `Last signed in ${parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })}`
})

const pendingSessionAction = ref<'local' | 'everywhere' | null>(null)

const deletedHistoryEntries = computed(() => {
  return deletedEntries.value.map((entry) => mapEntryHistoryItem(entry, { deleted: true }))
})

onMounted(() => {
  if (typeof route.query.entry === 'string') {
    applySupporterLinkFromRoute()
    openLayReportingSettingsOverlay()
  }
  if (user.value) {
    loadProfilePage()
  }
  void scrollToInitialSection()
})

function scrollToInitialSection() {
  const sectionId = props.initialSection
  if (!sectionId || !props.overlay) {
    return
  }

  return nextTick(() => {
    requestAnimationFrame(() => {
      const root = settingsScrollEl.value
      if (!root) {
        return
      }

      const target = root.querySelector<HTMLElement>(`#${CSS.escape(sectionId)}`)
      if (!target) {
        return
      }

      const navHeight = 48
      const rootRect = root.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const targetTop = targetRect.top - rootRect.top + root.scrollTop
      root.scrollTo({ top: Math.max(0, targetTop - navHeight - 8), behavior: 'auto' })
    })
  })
}

watch(() => props.initialSection, () => {
  void scrollToInitialSection()
})

watch(user, (currentUser) => {
  profileLoadSequence += 1
  if (profileSaveTimer) clearTimeout(profileSaveTimer)
  if (serviceSaveTimer) clearTimeout(serviceSaveTimer)
  profileSaveTimer = undefined
  serviceSaveTimer = undefined
  if (currentUser) {
    void loadProfilePage(currentUser.id)
  } else {
    deletedEntries.value = []
    profileForm.value.full_name = ''
    serviceDraft.value = { ...EMPTY_VETERAN_SERVICE_PROFILE }
    activeLogCount.value = 0
    profileInitialized.value = false
    clearPasskeys()
  }
})

watch(isAuthLoading, (loading) => {
  if (!loading && user.value) {
    void loadProfilePage(user.value.id)
  }
})

async function loadDeletedEntries(expectedUserId = user.value?.id ?? null) {
  if (!user.value) {
    deletedEntries.value = []
    return
  }

  const entries = await listDeletedEntries()
  if (expectedUserId && user.value?.id === expectedUserId) {
    deletedEntries.value = entries
  }
}

function chooseLayoutMode(mode: TrackerLayoutMode) {
  setLayoutMode(mode)
  markAutoSaveSaved()
}

async function loadProfilePage(expectedUserId = user.value?.id ?? null) {
  if (!expectedUserId) return
  const requestSequence = ++profileLoadSequence
  pageError.value = ''
  isHydratingProfile.value = true

  try {
    await loadDeletedEntries(expectedUserId)
    void loadPasskeys()
    const [profile, entries] = await Promise.all([
      getProfile(),
      listEntries().catch(() => [])
    ])

    if (user.value?.id !== expectedUserId || requestSequence !== profileLoadSequence) return

    await loadEntitlements()
    await loadAppWelcomeState()
    await loadTrackedConditions()
    if (user.value?.id !== expectedUserId || requestSequence !== profileLoadSequence) return

    activeLogCount.value = entries.length
    profileForm.value.full_name = profile?.full_name || user.value?.user_metadata?.full_name || ''
    if (autoSaveState.value !== 'saving') {
      serviceDraft.value = readVeteranServiceProfileFromRow(profile as Record<string, unknown> | null)
    }
    hydrateReminderSettings(profile)
    await refreshPushReminderStatus()
  } catch (error) {
    if (user.value?.id === expectedUserId && requestSequence === profileLoadSequence) {
      pageError.value = getErrorMessage(error)
    }
  } finally {
    if (user.value?.id === expectedUserId && requestSequence === profileLoadSequence) {
      profileInitialized.value = true
      isHydratingProfile.value = false
    }
  }
}

function markAutoSavePending() {
  autoSaveState.value = 'saving'
}

function markAutoSaveSaved() {
  autoSaveState.value = 'saved'

  if (savedLabelTimer) {
    clearTimeout(savedLabelTimer)
  }

  savedLabelTimer = setTimeout(() => {
    if (autoSaveState.value === 'saved') {
      autoSaveState.value = 'idle'
    }
  }, 2000)
}

function scheduleProfileAutoSave() {
  if (!user.value || !profileInitialized.value || isHydratingProfile.value) {
    return
  }

  markAutoSavePending()

  if (profileSaveTimer) {
    clearTimeout(profileSaveTimer)
  }

  const expectedUserId = user.value.id
  profileSaveTimer = setTimeout(() => {
    if (user.value?.id === expectedUserId) void saveProfile(expectedUserId)
  }, 650)
}

watch(
  () => profileForm.value.full_name,
  () => {
    scheduleProfileAutoSave()
  }
)

function onServiceBranchChange(value: string | null | undefined) {
  serviceDraft.value.service_branch = value?.trim() || null
  scheduleServiceAutoSave()
}

function onServiceFieldInput() {
  scheduleServiceAutoSave()
}

function onServiceYearInput(field: 'service_start_year' | 'service_end_year', raw: string) {
  const trimmed = raw.trim()
  serviceDraft.value[field] = trimmed ? Number.parseInt(trimmed, 10) : null
  if (trimmed && !Number.isFinite(serviceDraft.value[field]!)) {
    serviceDraft.value[field] = null
  }
  scheduleServiceAutoSave()
}

function scheduleServiceAutoSave() {
  if (!user.value || !profileInitialized.value || isHydratingProfile.value) {
    return
  }

  markAutoSavePending()

  if (serviceSaveTimer) {
    clearTimeout(serviceSaveTimer)
  }

  const expectedUserId = user.value.id
  serviceSaveTimer = setTimeout(() => {
    if (user.value?.id === expectedUserId) void saveServiceProfile(expectedUserId)
  }, 650)
}

async function saveServiceProfile(expectedUserId = user.value?.id ?? null) {
  if (!expectedUserId || user.value?.id !== expectedUserId) return
  isSavingProfile.value = true
  pageError.value = ''

  const normalized = normalizeVeteranServiceProfilePatch({
    phone: serviceDraft.value.phone,
    date_of_birth: serviceDraft.value.date_of_birth,
    service_branch: serviceDraft.value.service_branch,
    service_rank: serviceDraft.value.service_rank,
    service_start_year: serviceDraft.value.service_start_year,
    service_end_year: serviceDraft.value.service_end_year
  })

  if ('error' in normalized) {
    autoSaveState.value = 'error'
    pageError.value = normalized.error
    isSavingProfile.value = false
    return
  }

  try {
    if (user.value?.id !== expectedUserId) return
    await upsertProfile(normalized.patch, expectedUserId)
    markAutoSaveSaved()
  } catch (error) {
    autoSaveState.value = 'error'
    pageError.value = getErrorMessage(error)
  } finally {
    isSavingProfile.value = false
  }
}

onUnmounted(() => {
  if (profileSaveTimer) {
    clearTimeout(profileSaveTimer)
  }

  if (serviceSaveTimer) {
    clearTimeout(serviceSaveTimer)
  }

  if (savedLabelTimer) {
    clearTimeout(savedLabelTimer)
  }
})

async function saveProfile(expectedUserId = user.value?.id ?? null) {
  if (!expectedUserId || user.value?.id !== expectedUserId) return
  isSavingProfile.value = true
  pageError.value = ''

  try {
    await upsertProfile({
      full_name: profileForm.value.full_name,
      display_name: profileForm.value.full_name
    }, expectedUserId)
    markAutoSaveSaved()
  } catch (error) {
    autoSaveState.value = 'error'
    pageError.value = getErrorMessage(error)
  } finally {
    isSavingProfile.value = false
  }
}

async function restoreDeletedEntry(entryId: string) {
  if (!user.value) {
    return
  }

  pageError.value = ''
  isRestoringEntryId.value = entryId

  const archivedEntry = deletedEntries.value.find(entry => entry.id === entryId)
  if (!archivedEntry) {
    isRestoringEntryId.value = null
    return
  }

  try {
    const restoredEntry = { ...archivedEntry }
    delete restoredEntry.deleted_at

    if (!canTrackCondition(restoredEntry.condition_key || 'unknown')) {
      pageError.value = 'This entry uses a condition that is not available on your account.'
      return
    }

    await restoreEntry(entryId)

    await loadDeletedEntries(user.value.id)
    showSubmissionToast('Entry restored.')
  } catch (error) {
    pageError.value = getErrorMessage(error)
    showSubmissionToast({
      message: getErrorMessage(error),
      tone: 'error'
    })
  } finally {
    isRestoringEntryId.value = null
  }
}

function requestPurgeDeletedEntry(entryId: string) {
  const entry = deletedHistoryEntries.value.find((item) => item.id === entryId)
  if (!entry || !user.value) {
    return
  }

  pendingPurgeEntry.value = {
    id: entryId,
    title: entry.title
  }
}

function cancelPurgeDeletedEntry() {
  pendingPurgeEntry.value = null
}

async function confirmPurgeDeletedEntry() {
  if (!pendingPurgeEntry.value || !user.value) {
    return
  }

  try {
    await purgeDeletedEntry(pendingPurgeEntry.value.id)
    pendingPurgeEntry.value = null
    await loadDeletedEntries(user.value.id)
    showSubmissionToast('Deleted entry removed permanently.')
  } catch (error) {
    pageError.value = getErrorMessage(error)
  }
}

function openDeleteAllLogsModal() {
  deleteAllLogsPassword.value = ''
  deleteAllLogsConfirmPhrase.value = ''
  deleteAllLogsError.value = ''
  isDeleteAllLogsModalOpen.value = true
}

async function openDeleteEntriesModal() {
  if (!user.value) {
    return
  }

  deleteEntriesError.value = ''
  selectedDeleteConditionKeys.value = []
  deletableConditionGroups.value = []
  isDeleteEntriesModalOpen.value = true
  isLoadingDeleteEntriesModal.value = true

  try {
    const [activeEntries, deletedEntriesList] = await Promise.all([
      listEntries(),
      listDeletedEntries()
    ])

    deletedEntries.value = deletedEntriesList
    deletableConditionGroups.value = buildDeletableConditionGroups({
      activeEntries,
      deletedEntries: deletedEntriesList
    })
  } catch (error) {
    deleteEntriesError.value = getErrorMessage(error)
  } finally {
    isLoadingDeleteEntriesModal.value = false
  }
}

function closeDeleteEntriesModal() {
  if (isDeletingSelectedEntries.value) {
    return
  }

  isDeleteEntriesModalOpen.value = false
  deleteEntriesError.value = ''
  selectedDeleteConditionKeys.value = []
  deletableConditionGroups.value = []
}

function toggleDeleteConditionSelection(conditionKey: string) {
  if (selectedDeleteConditionKeys.value.includes(conditionKey)) {
    selectedDeleteConditionKeys.value = selectedDeleteConditionKeys.value.filter((key) => key !== conditionKey)
    return
  }

  selectedDeleteConditionKeys.value = [...selectedDeleteConditionKeys.value, conditionKey]
}

async function confirmDeleteSelectedEntries() {
  if (!user.value || !selectedDeleteConditionKeys.value.length || isDeletingSelectedEntries.value) {
    return
  }

  isDeletingSelectedEntries.value = true
  deleteEntriesError.value = ''
  pageError.value = ''

  try {
    const selectedKeys = [...selectedDeleteConditionKeys.value]
    const selectedLabels = deletableConditionGroups.value
      .filter((group) => selectedKeys.includes(group.key))
      .map((group) => group.label)

    const result = await removeAllEntriesForConditionKeys(selectedKeys)
    await Promise.all([
      loadDeletedEntries(user.value.id),
      listEntries().then((entries) => {
        activeLogCount.value = entries.length
      })
    ])

    closeDeleteEntriesModal()

    showSubmissionToast(
      selectedLabels.length === 1
        ? `Removed ${result.totalCount} ${result.totalCount === 1 ? 'entry' : 'entries'} for ${selectedLabels[0]}.`
        : `Removed ${result.totalCount} ${result.totalCount === 1 ? 'entry' : 'entries'} for ${selectedLabels.length} conditions.`
    )
  } catch (error) {
    deleteEntriesError.value = getErrorMessage(error)
  } finally {
    isDeletingSelectedEntries.value = false
  }
}

function closeDeleteAllLogsModal() {
  if (isDeletingAllLogs.value) {
    return
  }

  isDeleteAllLogsModalOpen.value = false
  deleteAllLogsPassword.value = ''
  deleteAllLogsConfirmPhrase.value = ''
  deleteAllLogsError.value = ''
}

async function confirmDeleteAllLogs() {
  if (!user.value) {
    return
  }

  deleteAllLogsError.value = ''
  isDeletingAllLogs.value = true
  pageError.value = ''

  try {
    if (usesPasswordLogin.value) {
      await verifyPassword(user.value.email || '', deleteAllLogsPassword.value)
    } else if (deleteAllLogsConfirmPhrase.value.trim() !== 'DELETE ALL LOGS') {
      deleteAllLogsError.value = 'Type DELETE ALL LOGS exactly to confirm.'
      return
    }

    await deleteAllEntries()
    await loadDeletedEntries(user.value.id)
    activeLogCount.value = 0
    closeDeleteAllLogsModal()
    showSubmissionToast('All logs deleted.')
  } catch (error) {
    deleteAllLogsError.value = getErrorMessage(error)
    showSubmissionToast({
      message: getErrorMessage(error),
      tone: 'error',
      durationMs: 4200
    })
  } finally {
    isDeletingAllLogs.value = false
  }
}

function redirectAfterAuth() {
  if (props.overlay || closeEmbedProfile || closeSettings) {
    closeSettingsPanel()
    return
  }

  navigateTo('/')
}

async function handleAuthSubmit() {
  if (isAuthSubmitting.value) {
    return
  }

  authValidationMessage.value = ''
  authError.value = ''

  const validationMessage = validateSignupForm({
    mode: authMode.value,
    name: authName.value,
    email: authEmail.value,
    password: authPassword.value,
    confirmPassword: authConfirmPassword.value
  })

  if (validationMessage) {
    showSubmissionToast(authErrorToast(validationMessage))
    return
  }

  isAuthSubmitting.value = true

  try {
    if (authMode.value === 'login') {
      await signIn(authEmail.value, authPassword.value)
      showSubmissionToast(authSuccessToast('Signed in.'))
      redirectAfterAuth()
    } else {
      const data = await signUp(authEmail.value, authPassword.value, authName.value.trim())

      if (data.session || user.value) {
        showSubmissionToast(authSuccessToast('Account created. You are signed in.'))
        redirectAfterAuth()
      } else if (data.needsEmailConfirmation || data.user) {
        needsEmailConfirmation.value = true
        refreshCooldown()
        showSubmissionToast(authNoticeToast(AUTH_NOTICES.signupCheckEmail))
        authMode.value = 'login'
      } else {
        showSubmissionToast(authErrorToast('Signup did not return a user. Check Supabase Auth settings and try again.'))
      }
    }
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not sign in. Check your email and password.'),
      authEmail: authEmail.value,
      setValidationMessage: () => {},
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showSubmissionToast,
      setNeedsEmailConfirmation: (value) => {
        needsEmailConfirmation.value = value
      },
      setAuthModeLogin: () => {
        authMode.value = 'login'
      }
    })
  } finally {
    isAuthSubmitting.value = false
  }
}

async function handleResendConfirmation() {
  if (isAuthSubmitting.value) {
    return
  }

  authValidationMessage.value = ''

  if (!authEmail.value.trim()) {
    showSubmissionToast(authErrorToast(AUTH_VALIDATION.enterEmailForResendConfirmation))
    return
  }

  isAuthSubmitting.value = true
  authError.value = ''

  try {
    await resendConfirmationEmail(authEmail.value)
    needsEmailConfirmation.value = true
    refreshCooldown()
    showSubmissionToast(authNoticeToast(AUTH_NOTICES.confirmationEmailSent))
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not resend the confirmation email.'),
      authEmail: authEmail.value,
      setValidationMessage: () => {},
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showSubmissionToast
    })
  } finally {
    isAuthSubmitting.value = false
  }
}

async function handleForgotPassword() {
  if (isAuthSubmitting.value) {
    return
  }

  authValidationMessage.value = ''
  authError.value = ''

  if (!authEmail.value.trim()) {
    showSubmissionToast(authErrorToast(AUTH_VALIDATION.enterEmailForForgotPassword))
    return
  }

  isAuthSubmitting.value = true

  try {
    await sendPasswordReset(authEmail.value)
    refreshCooldown()
    showSubmissionToast(authNoticeToast(AUTH_NOTICES.passwordResetSent))
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not send the reset email.'),
      authEmail: authEmail.value,
      setValidationMessage: () => {},
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showSubmissionToast
    })
  } finally {
    isAuthSubmitting.value = false
  }
}

async function handlePasskeySignIn() {
  isAuthSubmitting.value = true
  authValidationMessage.value = ''
  authError.value = ''

  try {
    await signInWithPasskey()
    showSubmissionToast('Signed in with your passkey.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sign in with a passkey.'

    if (isEmailConfirmationNotice(message)) {
      needsEmailConfirmation.value = true
      showSubmissionToast(authNoticeToast(AUTH_NOTICES.emailConfirmationRequired))
      return
    }

    showSubmissionToast(authErrorToast(message))
  } finally {
    isAuthSubmitting.value = false
  }
}

const passkeyActionError = ref('')
const isAddingPasskey = ref(false)
const renamingPasskeyId = ref<string | null>(null)
const renamePasskeyName = ref('')
const pendingDeletePasskey = ref<TrackerPasskey | null>(null)
const deletePasskeyError = ref('')
const isDeletingPasskey = ref(false)

function formatPasskeyDate(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'recently'
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

async function handleAddPasskey() {
  passkeyActionError.value = ''
  isAddingPasskey.value = true

  try {
    await registerPasskey()
    showSubmissionToast('Passkey added. You can use it to sign in next time.')
  } catch (error) {
    passkeyActionError.value = error instanceof Error ? error.message : 'Could not add a passkey.'
  } finally {
    isAddingPasskey.value = false
  }
}

function startRenamePasskey(passkey: TrackerPasskey) {
  passkeyActionError.value = ''
  renamingPasskeyId.value = passkey.id
  renamePasskeyName.value = passkey.friendly_name || ''
}

function cancelRenamePasskey() {
  renamingPasskeyId.value = null
  renamePasskeyName.value = ''
}

async function saveRenamePasskey() {
  if (!renamingPasskeyId.value) {
    return
  }

  passkeyActionError.value = ''

  try {
    await renamePasskey(renamingPasskeyId.value, renamePasskeyName.value)
    cancelRenamePasskey()
  } catch (error) {
    passkeyActionError.value = error instanceof Error ? error.message : 'Could not rename the passkey.'
  }
}

function requestDeletePasskey(passkey: TrackerPasskey) {
  passkeyActionError.value = ''
  deletePasskeyError.value = ''
  pendingDeletePasskey.value = passkey
}

function cancelDeletePasskey() {
  pendingDeletePasskey.value = null
  deletePasskeyError.value = ''
}

async function confirmDeletePasskey() {
  if (!pendingDeletePasskey.value) {
    return
  }

  deletePasskeyError.value = ''
  isDeletingPasskey.value = true

  try {
    await deletePasskey(pendingDeletePasskey.value.id)
    pendingDeletePasskey.value = null
    showSubmissionToast('Passkey deleted.')
  } catch (error) {
    deletePasskeyError.value = error instanceof Error ? error.message : 'Could not delete the passkey.'
    showSubmissionToast({
      message: deletePasskeyError.value,
      tone: 'error'
    })
  } finally {
    isDeletingPasskey.value = false
  }
}

async function handleGoogleSignIn() {
  isAuthSubmitting.value = true
  authValidationMessage.value = ''

  try {
    await signInWithGoogle()
  } catch {
    if (import.meta.client) {
      window.sessionStorage.removeItem('symptom-tracker-auth-success')
    }
    showSubmissionToast(authErrorToast(resolveAuthApiErrorMessage(authError.value, 'Could not sign in with Google.')))
    authError.value = ''
  } finally {
    isAuthSubmitting.value = false
  }
}

const pendingAuthPanelOpen = useState('tracker-pending-auth-panel-open', () => false)

async function handleSignOut() {
  pendingSessionAction.value = 'local'
  pageError.value = ''

  try {
    await signOut()
    authMode.value = 'login'
    authValidationMessage.value = ''

    if (closeEmbedProfile || closeSettings || props.overlay) {
      pendingAuthPanelOpen.value = true
      closeSettingsPanel()
      return
    }

    await navigateTo('/?login=1')
  } catch {
    pageError.value = authError.value
  } finally {
    pendingSessionAction.value = null
  }
}

async function handleSignOutEverywhere() {
  if (!window.confirm('Sign out on every browser and device? You can sign back in with your passkey, Google, or email.')) {
    return
  }

  pendingSessionAction.value = 'everywhere'
  pageError.value = ''

  try {
    await signOutEverywhere()
    authMode.value = 'login'
    authValidationMessage.value = ''

    if (closeEmbedProfile || closeSettings || props.overlay) {
      pendingAuthPanelOpen.value = true
      closeSettingsPanel()
      return
    }

    await navigateTo('/?login=1')
  } catch {
    pageError.value = authError.value
  } finally {
    pendingSessionAction.value = null
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message || '').trim()
    if (message) {
      return message
    }
  }

  return 'Something went wrong. Please try again.'
}
</script>

<style scoped>
.tracker-settings-readable :deep(.text-\[10px\]) {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.tracker-settings-readable :deep(.text-xs) {
  font-size: 0.9375rem;
  line-height: 1.375rem;
}

.tracker-settings-readable :deep(.text-sm) {
  font-size: 1.0625rem;
  line-height: 1.625rem;
}

.tracker-settings-readable :deep(.text-base) {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.tracker-settings-readable :deep(.text-xl) {
  font-size: 1.375rem;
  line-height: 1.875rem;
}

.tracker-settings-readable :deep(.text-2xl) {
  font-size: 1.625rem;
  line-height: 2rem;
}

.tracker-settings-readable :deep(input:not([type='checkbox']):not([type='radio'])),
.tracker-settings-readable :deep(select),
.tracker-settings-readable :deep(textarea) {
  min-height: 3rem;
  font-size: 1.0625rem;
}

.tracker-settings-readable :deep(button.rounded-3xl),
.tracker-settings-readable :deep(button.rounded-2xl) {
  min-height: 3rem;
}

.tracker-settings-readable :deep(.rounded-3xl.border.px-4.py-4) {
  padding-top: 1.125rem;
  padding-bottom: 1.125rem;
}
</style>
