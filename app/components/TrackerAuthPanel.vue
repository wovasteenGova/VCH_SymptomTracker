<script setup lang="ts">
import {
  AUTH_NOTICES,
  AUTH_VALIDATION,
  authErrorToast,
  authNoticeToast,
  handleAuthApiFailure,
  isEmailConfirmationNotice,
  resolveAuthApiErrorMessage,
  validateSignupForm
} from '../utils/authNotices'
import { isPasskeyProductionHost, PASSKEY_PRODUCTION_HOST_MESSAGE } from '../utils/passkeyHost'

const props = withDefaults(defineProps<{
  compact?: boolean
  defaultAuthMode?: 'login' | 'signup'
  postAuthRedirect?: string
}>(), {
  compact: false,
  defaultAuthMode: 'login',
  postAuthRedirect: undefined
})

const emit = defineEmits<{
  close: []
  signedIn: []
}>()

const {
  user,
  isAuthLoading,
  authError,
  signIn,
  signUp,
  resendConfirmationEmail,
  signInWithGoogle,
  syncAuthSession,
  sendPasswordReset
} = useSupabaseAuth()
const { isPasskeySupported, signInWithPasskey } = usePasskeys()
const { showSubmissionToast } = useSubmissionToast()

function showAuthFeedback(payload: Parameters<typeof showSubmissionToast>[0]) {
  showSubmissionToast(payload)
}

const authMode = ref<'login' | 'signup'>(props.defaultAuthMode)
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const needsEmailConfirmation = ref(false)
const signupPasswordReveal = useTimedPasswordReveal()

const {
  isEmailCooldownActive,
  forgotPasswordLabel,
  resendConfirmationLabel
} = useAuthEmailCooldown(email)

watch([user, isAuthLoading], async ([nextUser, loading]) => {
  if (loading || !nextUser) return
  emit('signedIn')
})

watch(authMode, () => {
  needsEmailConfirmation.value = false
})

async function onSubmit() {
  const validationError = validateSignupForm({
    mode: authMode.value,
    name: name.value,
    email: email.value,
    password: password.value,
    confirmPassword: confirmPassword.value
  })

  if (validationError) {
    showAuthFeedback(authErrorToast(validationError))
    return
  }

  submitting.value = true

  try {
    if (authMode.value === 'login') {
      await signIn(email.value, password.value)
      return
    }

    const result = await signUp(email.value, password.value, name.value.trim())
    if (result.needsEmailConfirmation) {
      needsEmailConfirmation.value = true
      authMode.value = 'login'
      showAuthFeedback(authNoticeToast(AUTH_NOTICES.signupCheckEmail))
      return
    }
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Authentication failed.'),
      authEmail: email.value,
      setValidationMessage: () => {},
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showAuthFeedback,
      setNeedsEmailConfirmation: (value) => {
        needsEmailConfirmation.value = value
      },
      setAuthModeLogin: () => {
        authMode.value = 'login'
      }
    })
  } finally {
    submitting.value = false
  }
}

async function onGoogleSignIn() {
  submitting.value = true

  try {
    await signInWithGoogle(props.postAuthRedirect)
  } catch {
    showAuthFeedback(authErrorToast(resolveAuthApiErrorMessage(authError.value, 'Google sign-in failed.')))
    authError.value = ''
    submitting.value = false
  }
}

async function onPasskeySignIn() {
  if (!isPasskeyProductionHost()) {
    showAuthFeedback(authErrorToast(PASSKEY_PRODUCTION_HOST_MESSAGE))
    return
  }

  submitting.value = true

  try {
    await signInWithPasskey()
    await syncAuthSession({ attempts: 3, delayMs: 150 })
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Could not sign in with a passkey.'

    if (isEmailConfirmationNotice(message)) {
      needsEmailConfirmation.value = true
      showAuthFeedback(authNoticeToast(AUTH_NOTICES.emailConfirmationRequired))
      return
    }

    showAuthFeedback(authErrorToast(message))
  } finally {
    submitting.value = false
  }
}

async function onForgotPassword() {
  if (!email.value.trim()) {
    showAuthFeedback(authErrorToast(AUTH_VALIDATION.enterEmailForForgotPassword))
    return
  }

  submitting.value = true

  try {
    await sendPasswordReset(email.value)
    showAuthFeedback(authNoticeToast(AUTH_NOTICES.passwordResetSent))
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not send reset email.'),
      authEmail: email.value,
      setValidationMessage: () => {},
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showAuthFeedback
    })
  } finally {
    submitting.value = false
  }
}

async function onResendConfirmation() {
  if (!email.value.trim()) {
    showAuthFeedback(authErrorToast(AUTH_VALIDATION.enterEmailForResendConfirmation))
    return
  }

  submitting.value = true

  try {
    await resendConfirmationEmail(email.value)
    needsEmailConfirmation.value = true
    showAuthFeedback(authNoticeToast(AUTH_NOTICES.confirmationEmailSent))
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not resend confirmation email.'),
      authEmail: email.value,
      setValidationMessage: () => {},
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showAuthFeedback
    })
  } finally {
    submitting.value = false
  }
}

const fieldClass = 'w-full rounded-xl border border-default/80 bg-default/40 px-3.5 py-2.5 text-sm text-highlighted outline-none transition placeholder:text-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/15'
const labelClass = 'mb-1.5 block text-xs font-semibold text-highlighted'

const colorMode = useColorMode()
const authProviderButtonTheme = computed(() => (
  colorMode.value === 'dark' ? 'dark' : 'light'
))

const panelRootRef = ref<HTMLElement | null>(null)
const { keyboardOpen, narrowViewport } = useAuthPanelKeyboard(panelRootRef)
const hideFooterForKeyboard = computed(() => keyboardOpen.value)
const mobileAuthLayout = computed(() => props.compact || narrowViewport.value)

const compactFormClass = computed(() => (
  mobileAuthLayout.value
    ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
    : 'flex flex-col'
))

const scrollBodyClass = computed(() => (
  mobileAuthLayout.value
    ? 'custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-6'
    : ''
))

const footerClass = computed(() => (
  mobileAuthLayout.value
    ? 'auth-panel-footer h-auto shrink-0 space-y-2.5 border-t border-default/60 bg-elevated/30 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]'
    : 'auth-panel-footer mt-4 h-auto space-y-2.5 border-t border-default/60 bg-elevated/30 p-0 pt-4'
))
</script>

<template>
  <div
    ref="panelRootRef"
    class="auth-panel-root flex min-h-0 flex-col overflow-hidden"
    :class="mobileAuthLayout ? 'max-h-full min-h-0 flex-1' : ''"
  >
    <div
      v-if="compact"
      class="flex shrink-0 items-center justify-between gap-3 border-b border-default/60 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)]"
    >
      <div class="min-w-0">
        <p class="text-sm font-semibold text-highlighted">
          Account
        </p>
        <p class="text-[11px] text-muted">
          Sign in to sync your symptom logs
        </p>
      </div>
      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-elevated/60 hover:text-highlighted"
        aria-label="Close"
        @click="emit('close')"
      >
        <UIcon name="i-lucide-x" class="size-4" />
      </button>
    </div>

    <div
      v-if="isAuthLoading"
      class="p-4 text-sm text-muted"
    >
      <span class="inline-flex items-center gap-2">
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
        Checking your session…
      </span>
    </div>

    <form
      v-else
      :class="compactFormClass"
      @submit.prevent="onSubmit"
    >
      <div :class="scrollBodyClass">
        <AuthModeTabs v-model="authMode" tone="theme" />

        <p class="mt-4 text-xs leading-6 text-muted">
          Use your Veterans Central Hub account: the same sign-in as Claim Maker.
        </p>

        <div class="mt-5 space-y-4">
          <label v-if="authMode === 'signup'" class="block">
            <span :class="labelClass">Name</span>
            <input
              v-model="name"
              type="text"
              autocomplete="name"
              :class="fieldClass"
              placeholder="Your full name"
              required
            >
          </label>

          <label class="block">
            <span :class="labelClass">Email</span>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              inputmode="email"
              autocapitalize="none"
              :class="fieldClass"
              placeholder="you@example.com"
              required
            >
          </label>

          <label class="block">
            <span :class="labelClass">Password</span>
            <PasswordInput
              v-if="authMode === 'login'"
              key="auth-login-password"
              v-model="password"
              tone="theme"
              autocomplete="current-password"
              placeholder="Your password"
              required
            />
            <PasswordInput
              v-else
              key="auth-signup-password"
              v-model="password"
              tone="theme"
              autocomplete="new-password"
              placeholder="At least 6 characters"
              :minlength="6"
              :revealed="signupPasswordReveal.visible.value"
              :countdown="signupPasswordReveal.countdown.value"
              required
              @reveal="signupPasswordReveal.start"
            />
          </label>

          <label v-if="authMode === 'signup'" class="block">
            <span :class="labelClass">Confirm password</span>
            <PasswordInput
              v-model="confirmPassword"
              tone="theme"
              autocomplete="new-password"
              placeholder="Re-enter password"
              :show-toggle="false"
              required
            />
          </label>

          <button
            v-if="authMode === 'login'"
            type="button"
            class="w-full rounded-xl px-3 py-2 text-xs font-semibold text-muted transition hover:bg-elevated/60 hover:text-highlighted"
            :disabled="submitting || isEmailCooldownActive"
            @click="onForgotPassword"
          >
            {{ forgotPasswordLabel }}
          </button>

          <button
            v-if="needsEmailConfirmation"
            type="button"
            class="w-full rounded-xl px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
            :disabled="submitting || !email || isEmailCooldownActive"
            @click="onResendConfirmation"
          >
            {{ resendConfirmationLabel }}
          </button>
        </div>
      </div>

      <div
        v-show="!hideFooterForKeyboard"
        :class="footerClass"
      >
        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="submitting"
          :label="submitting ? 'Working…' : authMode === 'login' ? 'Sign in' : 'Create account'"
        />

        <GoogleSignInButton
          class="mt-2.5"
          :text="authMode === 'signup' ? 'signup_with' : 'signin_with'"
          :theme="authProviderButtonTheme"
          :size="compact ? 'medium' : 'large'"
          :disabled="submitting"
          @click="onGoogleSignIn"
        />

        <PasskeySignInButton
          v-if="authMode === 'login' && isPasskeySupported"
          class="mt-2.5"
          :theme="authProviderButtonTheme"
          :disabled="submitting"
          @click="onPasskeySignIn"
        />

        <p
          v-else-if="authMode === 'signup' && isPasskeySupported"
          class="mt-2.5 text-center text-xs leading-5 text-muted"
        >
          Prefer passkeys? Create your account first, then add one under Settings &rarr; Passkeys.
        </p>
      </div>
    </form>
  </div>
</template>
