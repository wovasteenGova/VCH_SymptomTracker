<template>
  <component
    :is="overlay ? 'div' : 'main'"
    :class="overlay
      ? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-default text-default'
      : 'flex h-dvh min-h-0 flex-col overflow-hidden bg-default text-default'"
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
          <p
            v-if="authValidationMessage"
            class="mb-3 text-center text-sm font-medium text-amber-300"
            aria-live="polite"
          >
            {{ authValidationMessage }}
          </p>

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
            v-if="entitlementsLoaded"
            class="mt-3 flex flex-wrap items-center gap-2"
          >
            <TrackerPlanBadge size="md" />
            <p
              v-if="signInMethodLabel"
              class="flex items-center gap-1.5 text-xs text-muted"
            >
              <UIcon
                v-if="usesGoogleLogin"
                name="i-lucide-chrome"
                class="size-3.5 shrink-0"
              />
              {{ signInMethodLabel }}
            </p>
            <NuxtLink
              to="/upgrade"
              class="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition"
              :class="isPro
                ? 'bg-elevated text-highlighted ring-1 ring-default'
                : 'bg-amber-400 text-slate-950 hover:bg-amber-300'"
            >
              <UIcon
                :name="isPro ? 'i-lucide-receipt' : 'i-lucide-crown'"
                class="size-3.5"
              />
              {{ isPro ? 'Payment center' : `Upgrade — ${PRO_ANNUAL_PRICE_LABEL}` }}
            </NuxtLink>
          </div>

          <p
            v-if="!overlay && user?.email"
            class="mt-2 truncate text-xs text-muted"
          >
            {{ user.email }}
          </p>

          <template v-if="entitlementsLoaded && !overlay">
            <p
              v-if="!isPro"
              class="mt-2 text-xs leading-5 text-muted"
            >
              Free plan: 1 condition with unlimited entries, calendar logging charts, and entry PDFs with weekly symptom counts. Upgrade for {{ PRO_ANNUAL_PRICE_LABEL }} to unlock more conditions, family reporting, and severity trends in PDFs.
            </p>
            <div
              v-if="!isPro"
              class="mt-3 rounded-3xl border border-default bg-default/60 p-4"
            >
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">Your free conditions</p>
              <p class="mt-1 text-xs leading-5 text-muted">
                {{ freeConditionKeys.length }}/{{ FREE_CONDITION_LIMIT }} selected
              </p>
              <div
                v-if="freeConditionKeyLabels.length"
                class="mt-3 flex flex-wrap gap-2"
              >
                <span
                  v-for="label in freeConditionKeyLabels"
                  :key="label"
                  class="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/30"
                >
                  {{ label }}
                </span>
              </div>
              <p
                v-else
                class="mt-3 text-xs leading-5 text-muted"
              >
                Pick conditions when you start logging from the tracker home screen.
              </p>
            </div>
            <p
              v-else-if="isClaimBuilderPro"
              class="mt-2 text-xs leading-5"
              :class="PRO_STATUS_TEXT_CLASS"
            >
              Pro included with VCH Claim Maker.
              <span v-if="claimBuilderFoundingProUntil"> Access until {{ claimBuilderFoundingProUntil }}.</span>
            </p>
            <p
              v-else-if="renewalLabel && !isComped"
              class="mt-2 text-xs leading-5"
              :class="PRO_STATUS_TEXT_CLASS"
            >
              Pro renews on {{ renewalLabel }}.
            </p>
            <p
              v-else-if="isComped"
              class="mt-2 text-xs leading-5"
              :class="PRO_STATUS_TEXT_CLASS"
            >
              Pro access granted at no cost. Thank you for using the tracker.
            </p>
          </template>

          <template v-else-if="entitlementsLoaded && overlay">
            <p
              v-if="!isPro"
              class="mt-2 text-xs leading-5 text-muted"
            >
              Free plan: 1 condition with unlimited entries. Upgrade for {{ PRO_ANNUAL_PRICE_LABEL }} to unlock more.
            </p>
            <p
              v-else-if="isClaimBuilderPro"
              class="mt-2 text-xs leading-5"
              :class="PRO_STATUS_TEXT_CLASS"
            >
              Pro included with VCH Claim Maker.
            </p>
            <p
              v-else-if="renewalLabel && !isComped"
              class="mt-2 text-xs leading-5"
              :class="PRO_STATUS_TEXT_CLASS"
            >
              Pro renews on {{ renewalLabel }}.
            </p>
          </template>

          <div class="mt-3 flex w-full flex-col items-stretch gap-2">
            <label
              for="tracker-settings-real-name"
              class="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
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
              class="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
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
              class="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
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
                  <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
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
                    class="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
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
                    class="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
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
                      class="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
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
                      class="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
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
            <button
              type="button"
              class="font-semibold text-primary underline decoration-primary/40 underline-offset-2 transition hover:text-primary/80"
              @pointerdown.stop
              @click="supportOverlays.openContact()"
            >
              Contact us
            </button>
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

        <section id="settings-logging" :class="settingsSectionClass(compact)">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Logging rhythm</p>
          <h2 class="mt-1 text-xl font-bold text-highlighted">When you log symptoms</h2>
          <p class="mt-2 text-sm leading-6 text-muted">
            Weekly logging is recommended for PTSD and mental health so you are not revisiting painful events every day.
          </p>

          <div class="mt-4 grid gap-3">
            <button
              type="button"
              class="rounded-3xl border px-4 py-4 text-left transition"
              :class="loggingCadence === 'weekly'
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-default bg-elevated/30'"
              @click="saveLoggingCadence('weekly')"
            >
              <span class="block font-bold text-highlighted">End of the week</span>
              <span class="mt-1 block text-sm leading-6 text-muted">Log once and capture the week together.</span>
            </button>

            <button
              type="button"
              class="rounded-3xl border px-4 py-4 text-left transition"
              :class="loggingCadence === 'daily'
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-default bg-elevated/30'"
              @click="saveLoggingCadence('daily')"
            >
              <span class="block font-bold text-highlighted">Every day</span>
              <span class="mt-1 block text-sm leading-6 text-muted">Best when you want details while they are fresh.</span>
            </button>
          </div>

          <div v-if="loggingCadence === 'weekly'" class="mt-4">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">Preferred log day</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="option in weeklyLogDayOptions"
                :key="option.value"
                type="button"
                class="rounded-full px-3 py-2 text-sm font-bold transition"
                :class="weeklyLogDay === option.value
                  ? 'bg-primary text-inverted'
                  : 'bg-elevated text-muted ring-1 ring-default'"
                @click="saveWeeklyLogDay(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </section>

        <section id="settings-reminders" :class="settingsSectionClass(compact)">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Reminders</p>
          <h2 class="mt-1 text-xl font-bold text-highlighted">Logging notifications</h2>
          <p class="mt-2 text-sm leading-6 text-muted">
            {{ logReminderScheduleDescription }}
          </p>
          <p class="mt-2 text-xs leading-5 text-muted">
            Device permission: {{ logReminderDevicePermissionLabel }}. Turning VCH reminders off stops app reminders but does not change your device notification permission.
          </p>

          <p v-if="logReminderPermissionState === 'unsupported'" class="mt-3 text-sm leading-6 text-amber-200">
            Notifications are not supported in this browser.
          </p>
          <p v-else-if="logReminderPermissionState === 'denied'" class="mt-3 text-sm leading-6 text-amber-200">
            Notifications are blocked for this app. Enable them in your phone or browser settings, then come back and tap Enable.
          </p>
          <p v-else-if="pushBackendConfigured === false" class="mt-3 text-sm leading-6 text-amber-200">
            Background push is not configured on the server yet (missing VAPID keys in server setup). Reminders cannot reach this device until that is fixed.
          </p>
          <p v-else-if="hasRegisteredPushSubscription === false" class="mt-3 text-sm leading-6 text-amber-200">
            This device is not registered for push reminders yet. Tap Enable after notifications are allowed.
          </p>

          <div class="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-default bg-elevated/30 px-4 py-4">
            <div>
              <p class="font-bold text-highlighted">Log reminders</p>
              <p class="mt-1 text-sm text-muted">
                {{ logReminderStatusLabel }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
              :class="remindersEnabled
                ? 'bg-primary text-inverted'
                : 'bg-elevated text-muted ring-1 ring-default'"
              :disabled="isReminderTogglePending"
              @click="toggleLogReminders"
            >
              {{ isReminderTogglePending ? 'Working...' : logReminderButtonLabel }}
            </button>
          </div>

          <div class="mt-4 rounded-3xl border border-default bg-elevated/30 px-4 py-4">
            <label class="block text-xs font-bold uppercase tracking-[0.14em] text-muted">
              {{ loggingCadence === 'daily' ? 'Morning reminder' : 'Reminder time' }}
            </label>
            <select
              :value="reminderHour"
              class="mt-2 w-full rounded-2xl border border-default bg-default px-4 py-3 text-sm font-semibold text-highlighted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              @change="handleReminderHourChange"
            >
              <option
                v-for="option in logReminderHourOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div
            v-if="loggingCadence === 'daily'"
            class="mt-4 rounded-3xl border border-default bg-elevated/30 px-4 py-4"
          >
            <label class="block text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Evening reminder
            </label>
            <select
              :value="reminderEveningHour"
              class="mt-2 w-full rounded-2xl border border-default bg-default px-4 py-3 text-sm font-semibold text-highlighted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              @change="handleReminderEveningHourChange"
            >
              <option
                v-for="option in logReminderHourOptions"
                :key="`evening-${option.value}`"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <p class="mt-3 text-xs leading-5 text-muted">
            Uses your local timezone: {{ logReminderTimezoneLabel }} ({{ reminderTimezone }}).
            Install the app for background alerts when closed. On Android, set notification channel to Sound and pop-up if alerts only appear in the shade.
          </p>

          <div class="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-default bg-elevated/30 px-4 py-4">
            <div class="min-w-0">
              <p class="font-bold text-highlighted">Test notification</p>
              <p class="mt-1 text-sm text-muted">
                Sends a real OS notification now so you can confirm this device is set up.
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-full bg-elevated px-4 py-2 text-sm font-bold text-muted ring-1 ring-default transition hover:bg-accented disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isReminderTogglePending || isSendingTestReminder"
              @click="sendTestLogReminder"
            >
              {{ isSendingTestReminder ? 'Sending...' : 'Send test' }}
            </button>
          </div>
        </section>

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

        <section
          id="settings-supporters"
          :class="settingsSectionClass(compact)"
        >
        <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Lay reporting</p>
            <h2 class="mt-1 text-xl font-bold text-highlighted">Observer access links</h2>
            <p class="mt-2 text-sm leading-6 text-muted">
              Create a private link for someone you trust — family, friends, caregivers, or anyone else. They enter their own contact info on each report. You can also create a link from a saved entry in your history.
            </p>
          </div>

          <div
            v-if="!canUseFamilyReporting"
            class="mt-4"
            :class="PRO_LOCK_PANEL_CLASS"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-lock" class="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />
              <div>
                <p :class="PRO_LOCK_TITLE_CLASS">Pro feature</p>
                <p :class="PRO_LOCK_BODY_CLASS">
                  Family reporting links are included with Pro so family, friends, or others can submit signed observations for your claim.
                </p>
                <NuxtLink
                  to="/upgrade"
                  class="mt-3 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950"
                >
                  Unlock family reporting
                </NuxtLink>
                <a
                  :href="supportEmailHref"
                  :class="PRO_LOCK_LINK_CLASS"
                >
                  Can't pay? Email us for free access
                </a>
              </div>
            </div>
          </div>

          <template v-else>

          <div v-if="linkedEntryContext" class="mt-4 rounded-3xl border border-primary/35 bg-primary/10 p-4">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary">Linked entry</p>
            <p class="mt-2 font-semibold text-highlighted">{{ linkedEntryContext.summary }}</p>
            <p class="mt-1 text-xs text-primary/80">{{ linkedEntryContext.condition }}</p>
          </div>

          <div class="mt-5 space-y-4">
            <label class="block">
              <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Link label (optional)</span>
              <input
                v-model="supporterForm.link_label"
                type="text"
                class="w-full rounded-3xl border border-default bg-elevated/40 px-4 py-4 text-base font-medium text-highlighted outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary/40"
                placeholder="Example: Mom, spouse, caregiver"
              >
              <p class="mt-2 px-1 text-xs leading-5 text-muted">
                This label is only for you to recognize the link. They enter their real info when submitting a report.
              </p>
            </label>

            <div>
              <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">Visible conditions</span>
              <USelectMenu
                v-model="supporterForm.visible_conditions"
                :items="conditionOptions"
                multiple
                placeholder="Choose visible conditions"
                class="w-full"
                color="neutral"
                size="xl"
                :ui="settingsSelectMenuUi"
                :content="settingsSelectMenuContent"
              />
            </div>

            <button
              type="button"
              class="w-full rounded-2xl bg-primary px-5 py-4 text-base font-bold text-inverted shadow-lg transition hover:bg-primary/90"
              :disabled="isCreatingSupporter"
              @click="createSupporter"
            >
              {{ isCreatingSupporter ? 'Creating...' : 'Create Private Link' }}
            </button>
          </div>

          <div v-if="createdLink" class="mt-4 rounded-3xl border border-emerald-900 bg-emerald-950/40 p-4">
            <p class="text-sm font-bold text-emerald-200">Private link created</p>
            <p class="mt-2 break-all text-sm leading-6 text-emerald-100">{{ createdLink }}</p>
            <p class="mt-2 text-xs leading-5 text-emerald-200/80">
              Save this now. For privacy, the raw token is only shown when the link is created.
            </p>
            <button
              type="button"
              class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              @click="copyCreatedLink"
            >
              <UIcon :name="createdLinkCopied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-4" />
              {{ createdLinkCopied ? 'Copied to clipboard' : 'Copy link' }}
            </button>
          </div>
          </template>

          <div class="mt-8 border-t border-default/70 pt-5">
            <h2 class="text-xl font-bold text-highlighted">Existing reporting links</h2>

            <div v-if="!supporterProfiles.length" class="py-5 text-center text-sm text-muted">
              No reporting links yet.
            </div>

            <div v-else class="mt-4 divide-y divide-default/70">
              <article
                v-for="profile in supporterProfiles"
                :key="profile.id"
                class="py-4 first:pt-0"
              >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-bold text-highlighted">{{ profile.display_name || 'Private reporting link' }}</h3>
                <p class="mt-1 text-sm text-muted">Reporter details are collected on each submission.</p>
              </div>
              <UBadge :color="profile.active ? 'success' : 'neutral'" variant="soft" size="md">
                {{ profile.active ? 'Active' : 'Disabled' }}
              </UBadge>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <UBadge
                v-for="condition in profile.visible_conditions"
                :key="condition"
                color="neutral"
                variant="soft"
                size="md"
              >
                {{ condition }}
              </UBadge>
            </div>

            <div v-if="profile.entry_context_summary" class="mt-3 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2">
              <p class="text-xs font-bold uppercase tracking-[0.12em] text-primary">Linked entry</p>
              <p class="mt-1 text-sm text-highlighted">{{ profile.entry_context_summary }}</p>
            </div>

            <div class="mt-4 flex items-center gap-3">
              <button
                type="button"
                class="grid size-11 shrink-0 place-items-center rounded-full bg-elevated text-highlighted ring-1 ring-default transition hover:bg-accented"
                :disabled="isCopyingSupporterId === profile.id"
                :aria-label="`Copy link for ${profile.display_name || 'private reporting link'}`"
                @click="copyExistingSupporterLink(profile)"
              >
                <UIcon
                  :name="copiedSupporterId === profile.id ? 'i-lucide-check' : 'i-lucide-copy'"
                  class="size-4"
                />
                <span class="sr-only">{{ copiedSupporterId === profile.id ? 'Copied' : 'Copy link' }}</span>
              </button>
              <button
                type="button"
                class="flex-1 rounded-2xl bg-elevated px-4 py-3 text-sm font-bold text-highlighted ring-1 ring-default"
                @click="toggleSupporter(profile)"
              >
                {{ profile.active ? 'Disable link' : 'Reactivate link' }}
              </button>
              <button
                type="button"
                class="flex-1 rounded-2xl bg-red-950/50 px-4 py-3 text-sm font-bold text-red-300 ring-1 ring-red-900/60"
                @click="requestDeleteSupporter(profile)"
              >
                Delete link
              </button>
            </div>
              </article>
            </div>
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
            <h2 class="mt-1 text-xl font-bold text-highlighted">Delete all logs</h2>
            <p class="mt-2 text-sm leading-6 text-muted">
              Permanently remove every symptom entry from your account, including items in your recovery bin. Your profile, plan, and condition picks stay saved.
            </p>
            <p v-if="activeLogCount > 0" class="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {{ activeLogCount }} {{ activeLogCount === 1 ? 'entry' : 'entries' }} saved
            </p>
            <p v-else class="mt-3 text-xs leading-5 text-muted">
              No logs saved right now. You can still use this setting anytime you need a fresh start.
            </p>
          </div>

          <button
            type="button"
            class="mt-5 w-full rounded-2xl bg-red-950/50 px-4 py-3 text-sm font-bold text-red-300 ring-1 ring-red-900/60 transition hover:bg-red-950/70"
            @click="openDeleteAllLogsModal"
          >
            Delete all logs
          </button>
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

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="pendingDeleteSupporter"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
        @click.self="cancelDeleteSupporter"
      >
        <div class="w-full max-w-md rounded-[1.75rem] border border-default/80 bg-default p-5 shadow-2xl">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">Delete reporting link</p>
          <h3 class="mt-2 text-xl font-bold text-highlighted">Remove this link forever?</h3>
          <p class="mt-3 text-sm leading-6 text-muted">
            <span class="font-semibold text-highlighted">{{ pendingDeleteSupporter.display_name }}</span>
            will stop working immediately. Anyone with the old URL will no longer be able to submit reports.
          </p>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-2xl bg-elevated px-4 py-3 text-sm font-bold text-highlighted"
              @click="cancelDeleteSupporter"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-highlighted"
              :disabled="isDeletingSupporterId === pendingDeleteSupporter.id"
              @click="confirmDeleteSupporter"
            >
              {{ isDeletingSupporterId === pendingDeleteSupporter.id ? 'Deleting...' : 'Delete link' }}
            </button>
          </div>
        </div>
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

    <ContactSupportOverlay
      v-if="!overlay"
      :open="settingsContactOpen"
      :default-name="profileForm.full_name"
      :default-email="user?.email || ''"
      @close="supportOverlays.closeContact()"
    />

    <FaqOverlay
      v-if="!overlay"
      :open="settingsFaqOpen"
      @close="supportOverlays.closeFaq()"
      @open-contact="supportOverlays.openContactFromFaq()"
    />
  </component>
</template>

<script setup lang="ts">
import { useTimedPasswordReveal } from '../composables/useTimedPasswordReveal'
import { useSupabaseAuth } from '../composables/useSupabaseAuth'
import { usePasskeys, type TrackerPasskey } from '../composables/usePasskeys'
import { useUserProfiles } from '../composables/useUserProfiles'
import { useSymptomEntries } from '../composables/useSymptomEntries'
import { useDeletedEntryArchive } from '../composables/useDeletedEntryArchive'
import { useEntitlements } from '../composables/useEntitlements'
import { useAppWelcome } from '../composables/useAppWelcome'
import {
  FREE_CONDITION_LIMIT,
  formatConditionKeyLabel,
  PRO_ANNUAL_PRICE_LABEL,
  buildSupportEmailHref
} from '../utils/subscription'
import { WEEKLY_LOG_DAY_OPTIONS, type LoggingCadence } from '../utils/loggingCadence'
import {
  describeLogReminderSchedule,
  formatTimezoneLabel,
  LOG_REMINDER_HOUR_OPTIONS
} from '../utils/logReminders'
import { useTrackerLayout, TRACKER_CLOSE_EMBED_PROFILE_KEY, TRACKER_CLOSE_SETTINGS_KEY, type TrackerLayoutMode } from '../composables/useTrackerLayout'
import type { SettingsSection } from '../composables/useSettingsSectionNav'
import { mapEntryHistoryItem } from '../utils/entryDisplay'
import { copyToClipboard } from '../utils/copyToClipboard'
import {
  PRO_LOCK_BODY_CLASS,
  PRO_LOCK_LINK_CLASS,
  PRO_LOCK_PANEL_CLASS,
  PRO_LOCK_TITLE_CLASS,
  PRO_STATUS_TEXT_CLASS,
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
  { id: 'settings-logging', label: 'Logging' },
  { id: 'settings-reminders', label: 'Reminders' },
  { id: 'settings-display', label: 'Display' },
  { id: 'settings-install', label: 'Install app' },
  { id: 'settings-supporters', label: 'Lay Reporting' },
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
  upsertProfile,
  listSupporterProfiles,
  createSupporterProfile,
  createSupporterProfileLink,
  toggleSupporterProfile,
  deleteSupporterProfile
} = useUserProfiles()
const { showSubmissionToast } = useSubmissionToast()
const { createEntry, listEntries, deleteAllEntries } = useSymptomEntries()
const {
  listDeletedEntries,
  removeDeletedEntry,
  takeDeletedEntry,
  archiveDeletedEntry,
  clearDeletedEntriesForUser
} = useDeletedEntryArchive()
const {
  isPro,
  isClaimBuilderPro,
  isComped,
  claimBuilderFoundingPro,
  freeConditionKeys,
  canUseFamilyReporting,
  canTrackCondition,
  renewalLabel,
  entitlementsLoaded,
  loadEntitlements
} = useEntitlements()

const claimBuilderFoundingProUntil = computed(() => {
  const until = claimBuilderFoundingPro.value?.until

  if (!until) {
    return ''
  }

  const parsed = new Date(until)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})
const {
  loggingCadence,
  weeklyLogDay,
  needsAppWelcome,
  loadAppWelcomeState,
  updateLoggingCadence
} = useAppWelcome()
const {
  remindersEnabled,
  reminderHour,
  reminderEveningHour,
  reminderTimezone,
  permissionState: logReminderPermissionState,
  pushBackendConfigured,
  hasRegisteredPushSubscription,
  isReminderTogglePending,
  refreshPushReminderStatus,
  enableRemindersWithPermission,
  disableReminders,
  hydrateReminderSettings,
  updateReminderHour,
  updateReminderEveningHour,
  sendTestReminderNotification,
  syncPermissionState
} = useLogReminders()
const logReminderHourOptions = LOG_REMINDER_HOUR_OPTIONS
const isSendingTestReminder = ref(false)

const logReminderScheduleDescription = computed(() => {
  return describeLogReminderSchedule(
    loggingCadence.value,
    weeklyLogDay.value,
    reminderHour.value,
    reminderTimezone.value,
    reminderEveningHour.value
  )
})

const logReminderTimezoneLabel = computed(() => formatTimezoneLabel(reminderTimezone.value))
const logReminderStatusLabel = computed(() => {
  if (logReminderPermissionState.value === 'denied') {
    return 'Blocked in device settings'
  }

  if (logReminderPermissionState.value === 'unsupported') {
    return 'Not supported on this browser'
  }

  if (pushBackendConfigured.value === false) {
    return 'Server setup needed'
  }

  if (hasRegisteredPushSubscription.value === false) {
    return 'Needs setup on this device'
  }

  if (logReminderPermissionState.value === 'granted' && !remindersEnabled.value) {
    return 'Device allowed; VCH reminders off'
  }

  return remindersEnabled.value ? 'On for this device' : 'Off'
})
const logReminderButtonLabel = computed(() => {
  if (remindersEnabled.value && hasRegisteredPushSubscription.value) {
    return 'On'
  }

  if (logReminderPermissionState.value === 'denied') {
    return 'Blocked'
  }

  return 'Enable'
})
const logReminderDevicePermissionLabel = computed(() => {
  if (logReminderPermissionState.value === 'granted') {
    return 'Allowed'
  }

  if (logReminderPermissionState.value === 'denied') {
    return 'Blocked in device settings'
  }

  if (logReminderPermissionState.value === 'unsupported') {
    return 'Not supported here'
  }

  return 'Not decided yet'
})
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

const weeklyLogDayOptions = WEEKLY_LOG_DAY_OPTIONS

const supportEmailHref = buildSupportEmailHref()

const freeConditionKeyLabels = computed(() => {
  return freeConditionKeys.value.map((key) => formatConditionKeyLabel(key))
})

const conditionOptions = [
  'PTSD / Mental Health',
  'Back or Joint Pain',
  'Nerve / Radiculopathy',
  'Migraine / Headache',
  'IBS / Bowel Symptoms',
  'GERD / Acid Reflux',
  'Sleep Issues'
]

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
const supporterForm = ref({
  link_label: '',
  visible_conditions: [] as string[]
})
const supporterProfiles = useState<any[]>('profile-page-supporters', () => [])
const deletedEntries = ref<any[]>([])
const createdLink = ref('')
const createdLinkCopied = ref(false)
const linkedEntryId = ref<string | null>(null)
const linkedEntryContext = ref<null | { summary: string, condition: string }>(null)
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
  if (autoSaveState.value === 'error') return 'Could not save — try again'
  return ''
})

const serviceSaveHint = computed(() => {
  if (autoSaveState.value === 'saving') return 'Saving…'
  if (autoSaveState.value === 'saved') return 'Saved'
  if (autoSaveState.value === 'error') return 'Could not save — try again'
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
const isCreatingSupporter = ref(false)
const isRestoringEntryId = ref<string | null>(null)
const isDeletingSupporterId = ref<string | null>(null)
const isCopyingSupporterId = ref<string | null>(null)
const copiedSupporterId = ref<string | null>(null)
const pendingPurgeEntry = ref<null | { id: string, title: string }>(null)
const pendingDeleteSupporter = ref<null | { id: string, display_name: string }>(null)
const activeLogCount = useState('profile-page-log-count', () => 0)
const supportOverlays = useSettingsSupportOverlays()
const {
  contactOpen: settingsContactOpen,
  faqOpen: settingsFaqOpen
} = supportOverlays
const isDeleteAllLogsModalOpen = ref(false)
const deleteAllLogsPassword = ref('')
const deleteAllLogsConfirmPhrase = ref('')
const deleteAllLogsError = ref('')
const isDeletingAllLogs = ref(false)

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
  syncPermissionState()
  applySupporterLinkQuery()
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

function applySupporterLinkQuery() {
  const entryId = typeof route.query.entry === 'string' ? route.query.entry : null
  const condition = typeof route.query.condition === 'string' ? route.query.condition : null
  const label = typeof route.query.label === 'string' ? route.query.label : null
  const summary = typeof route.query.summary === 'string' ? route.query.summary : null

  linkedEntryId.value = entryId

  if (condition) {
    supporterForm.value.visible_conditions = [condition]
  }

  if (label) {
    supporterForm.value.link_label = label
  }

  if (summary && condition) {
    linkedEntryContext.value = {
      summary,
      condition
    }
  }
}

watch(user, (currentUser) => {
  if (currentUser) {
    loadProfilePage()
  } else {
    deletedEntries.value = []
    supporterProfiles.value = []
    profileForm.value.full_name = ''
    serviceDraft.value = { ...EMPTY_VETERAN_SERVICE_PROFILE }
    activeLogCount.value = 0
    profileInitialized.value = false
    clearPasskeys()
  }
})

watch(isAuthLoading, (loading) => {
  if (!loading && user.value) {
    loadProfilePage()
  }
})

function loadDeletedEntries() {
  if (!user.value) {
    deletedEntries.value = []
    return
  }

  deletedEntries.value = listDeletedEntries(user.value.id)
}

function chooseLayoutMode(mode: TrackerLayoutMode) {
  setLayoutMode(mode)
  markAutoSaveSaved()
}

async function loadProfilePage() {
  pageError.value = ''
  isHydratingProfile.value = true
  loadDeletedEntries()
  loadPasskeys()

  try {
    const [profile, supporters, entries] = await Promise.all([
      getProfile(),
      listSupporterProfiles(),
      listEntries().catch(() => [])
    ])

    await loadEntitlements()
    await loadAppWelcomeState()

    activeLogCount.value = entries.length
    profileForm.value.full_name = profile?.full_name || user.value?.user_metadata?.full_name || ''
    if (autoSaveState.value !== 'saving') {
      serviceDraft.value = readVeteranServiceProfileFromRow(profile as Record<string, unknown> | null)
    }
    hydrateReminderSettings(profile)
    supporterProfiles.value = supporters
    await refreshPushReminderStatus()
  } catch (error) {
    pageError.value = getErrorMessage(error)
  } finally {
    profileInitialized.value = true
    isHydratingProfile.value = false
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

  profileSaveTimer = setTimeout(() => {
    saveProfile()
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

  serviceSaveTimer = setTimeout(() => {
    void saveServiceProfile()
  }, 650)
}

async function saveServiceProfile() {
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
    await upsertProfile(normalized.patch)
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

async function saveProfile() {
  isSavingProfile.value = true
  pageError.value = ''

  try {
    await upsertProfile({
      full_name: profileForm.value.full_name,
      display_name: profileForm.value.full_name
    })
    markAutoSaveSaved()
  } catch (error) {
    autoSaveState.value = 'error'
    pageError.value = getErrorMessage(error)
  } finally {
    isSavingProfile.value = false
  }
}

async function saveLoggingCadence(cadence: LoggingCadence) {
  pageError.value = ''
  markAutoSavePending()

  try {
    await updateLoggingCadence(cadence, weeklyLogDay.value)
    markAutoSaveSaved()
  } catch (error) {
    autoSaveState.value = 'error'
    pageError.value = getErrorMessage(error)
  }
}

async function saveWeeklyLogDay(day: number) {
  pageError.value = ''
  markAutoSavePending()

  try {
    await updateLoggingCadence('weekly', day)
    markAutoSaveSaved()
  } catch (error) {
    autoSaveState.value = 'error'
    pageError.value = getErrorMessage(error)
  }
}

async function toggleLogReminders() {
  if (isReminderTogglePending.value) {
    return
  }

  if (remindersEnabled.value) {
    await disableReminders()
    await refreshPushReminderStatus()
    showSubmissionToast({ message: 'VCH reminders turned off.' })
    return
  }

  const result = await enableRemindersWithPermission()

  if (result.ok) {
    showSubmissionToast({ message: 'Log reminders turned on for this device.' })
    return
  }

  if (result.reason === 'missing-vapid') {
    showSubmissionToast({
      message: 'Push reminders are not configured on the server yet. Add VAPID keys in Render, redeploy, then try again.',
      tone: 'error'
    })
    return
  }

  if (result.reason === 'permission-denied') {
    showSubmissionToast({
      message: 'Notifications are blocked for this app. Enable them in phone or browser settings, then tap Enable again.',
      tone: 'error'
    })
    return
  }

  if (result.reason === 'unsupported') {
    showSubmissionToast({
      message: 'Notifications are not supported in this browser.',
      tone: 'error'
    })
    return
  }

  if (result.reason === 'subscribe-failed') {
    showSubmissionToast({
      message: result.message || 'Could not register this device for push reminders.',
      tone: 'error'
    })
    return
  }

  showSubmissionToast({
    message: 'Allow notifications to turn on reminders.',
    tone: 'error'
  })
}

async function handleReminderHourChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const hour = Number(target.value)

  if (!Number.isFinite(hour)) {
    return
  }

  pageError.value = ''

  try {
    await updateReminderHour(hour)
    showSubmissionToast({ message: `Reminder time set to ${logReminderHourOptions.find((option) => option.value === hour)?.label || 'your chosen time'}.` })
  } catch (error) {
    pageError.value = getErrorMessage(error)
  }
}

async function handleReminderEveningHourChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const hour = Number(target.value)

  if (!Number.isFinite(hour)) {
    return
  }

  pageError.value = ''

  try {
    await updateReminderEveningHour(hour)
    showSubmissionToast({
      message: `Evening reminder set to ${logReminderHourOptions.find((option) => option.value === hour)?.label || 'your chosen time'}.`
    })
  } catch (error) {
    pageError.value = getErrorMessage(error)
  }
}

async function sendTestLogReminder() {
  if (isSendingTestReminder.value) {
    return
  }

  isSendingTestReminder.value = true

  try {
    const result = await sendTestReminderNotification()

    if (result.ok) {
      showSubmissionToast({
        message: result.via === 'push'
          ? 'Background push test sent. Check your notification shade.'
          : result.message || 'Test notification shown. Check your notification shade.'
      })
      return
    }

    showSubmissionToast({
      message: result.message || 'Could not send a test notification.',
      tone: 'error'
    })
  } finally {
    isSendingTestReminder.value = false
  }
}

async function createSupporter() {
  pageError.value = ''
  createdLink.value = ''

  if (!canUseFamilyReporting.value) {
    pageError.value = 'Family reporting requires Pro. Visit Payment center to upgrade.'
    return
  }

  if (!supporterForm.value.visible_conditions.length) {
    pageError.value = 'Choose at least one visible condition.'
    return
  }

  isCreatingSupporter.value = true

  try {
    const payload = {
      ...supporterForm.value,
      linked_entry_id: linkedEntryId.value,
      entry_context_summary: linkedEntryContext.value?.summary || null
    }
    const { token } = await createSupporterProfile(payload)
    createdLink.value = `${window.location.origin}/report/${token}`
    createdLinkCopied.value = false
    supporterForm.value = {
      link_label: '',
      visible_conditions: []
    }
    linkedEntryId.value = null
    linkedEntryContext.value = null
    await loadProfilePage()
    showSubmissionToast('Reporting link created.')
  } catch (error) {
    pageError.value = getErrorMessage(error)
  } finally {
    isCreatingSupporter.value = false
  }
}

async function toggleSupporter(profile: any) {
  pageError.value = ''

  try {
    await toggleSupporterProfile(profile.id, !profile.active)
    await loadProfilePage()
  } catch (error) {
    pageError.value = getErrorMessage(error)
  }
}

async function copyCreatedLink() {
  if (!createdLink.value) {
    return
  }

  const copied = await copyToClipboard(createdLink.value)
  createdLinkCopied.value = copied
  if (copied) {
    showSubmissionToast('Private link copied.')
  }
  pageError.value = copied ? '' : 'Could not copy link. Copy it manually.'
}

async function copyExistingSupporterLink(profile: any) {
  pageError.value = ''
  copiedSupporterId.value = null
  isCopyingSupporterId.value = profile.id

  try {
    const token = await createSupporterProfileLink(profile.id)
    const link = `${window.location.origin}/report/${token}`
    const copied = await copyToClipboard(link)

    if (copied) {
      copiedSupporterId.value = profile.id
      showSubmissionToast('Private link copied.')
    } else {
      pageError.value = 'Could not copy link. Copy it manually.'
      createdLink.value = link
      createdLinkCopied.value = false
    }
  } catch (error) {
    pageError.value = getErrorMessage(error)
  } finally {
    isCopyingSupporterId.value = null
  }
}

function requestDeleteSupporter(profile: any) {
  pendingDeleteSupporter.value = {
    id: profile.id,
    display_name: profile.display_name || 'Private reporting link'
  }
}

function cancelDeleteSupporter() {
  pendingDeleteSupporter.value = null
}

async function confirmDeleteSupporter() {
  if (!pendingDeleteSupporter.value) {
    return
  }

  pageError.value = ''
  isDeletingSupporterId.value = pendingDeleteSupporter.value.id

  try {
    await deleteSupporterProfile(pendingDeleteSupporter.value.id)
    pendingDeleteSupporter.value = null
    showSubmissionToast('Reporting link deleted.')
    await loadProfilePage()
  } catch (error) {
    pageError.value = getErrorMessage(error)
    showSubmissionToast({
      message: getErrorMessage(error),
      tone: 'error'
    })
  } finally {
    isDeletingSupporterId.value = null
  }
}

async function restoreDeletedEntry(entryId: string) {
  if (!user.value) {
    return
  }

  pageError.value = ''
  isRestoringEntryId.value = entryId

  const archivedEntry = takeDeletedEntry(user.value.id, entryId)
  if (!archivedEntry) {
    isRestoringEntryId.value = null
    return
  }

  try {
    const restoredEntry = { ...archivedEntry }
    delete restoredEntry.deleted_at

    if (!canTrackCondition(restoredEntry.condition_key || 'unknown')) {
      archiveDeletedEntry(user.value.id, archivedEntry)
      loadDeletedEntries()
      pageError.value = `Free plan includes ${FREE_CONDITION_LIMIT} conditions. Upgrade to Pro to restore entries for other conditions.`
      return
    }

    await createEntry({
      condition_key: restoredEntry.condition_key,
      condition_label: restoredEntry.condition_label,
      severity: restoredEntry.severity,
      occurred_at: restoredEntry.occurred_at,
      summary: restoredEntry.summary,
      impact: restoredEntry.impact,
      details: restoredEntry.details || {}
    })

    loadDeletedEntries()
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

function confirmPurgeDeletedEntry() {
  if (!pendingPurgeEntry.value || !user.value) {
    return
  }

  removeDeletedEntry(user.value.id, pendingPurgeEntry.value.id)
  pendingPurgeEntry.value = null
  loadDeletedEntries()
  showSubmissionToast('Deleted entry removed permanently.')
}

function openDeleteAllLogsModal() {
  deleteAllLogsPassword.value = ''
  deleteAllLogsConfirmPhrase.value = ''
  deleteAllLogsError.value = ''
  isDeleteAllLogsModalOpen.value = true
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
    clearDeletedEntriesForUser(user.value.id)
    loadDeletedEntries()
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
    authValidationMessage.value = validationMessage
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
      setValidationMessage: (message) => {
        authValidationMessage.value = message
      },
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
    authValidationMessage.value = AUTH_VALIDATION.enterEmailForResendConfirmation
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
      setValidationMessage: (message) => {
        authValidationMessage.value = message
      },
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
    authValidationMessage.value = AUTH_VALIDATION.enterEmailForForgotPassword
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
      setValidationMessage: (message) => {
        authValidationMessage.value = message
      },
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
  if (error instanceof Error) {
    return error.message
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
