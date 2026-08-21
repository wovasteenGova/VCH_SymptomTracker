// https://nuxt.com/docs/api/configuration/nuxt-config
import { config as loadDotenv } from 'dotenv'

const isProduction = process.env.NODE_ENV === 'production'

// Local .env should win over stale shell env (common cause of sk_live on localhost).
if (!isProduction) {
  loadDotenv({ override: true })
}

function env(name: string) {
  return String(process.env[name] || '').trim()
}

function envFirst(...names: string[]) {
  for (const name of names) {
    const value = env(name)
    if (value) {
      return value
    }
  }

  return ''
}

const supabaseUrl = env('SUPABASE_URL')
  || env('NUXT_PUBLIC_SUPABASE_URL')

const supabaseAnonKey = env('SUPABASE_ANON_KEY')
  || env('SUPABASE_KEY')
  || env('NUXT_PUBLIC_SUPABASE_ANON_KEY')
  || env('NUXT_PUBLIC_SUPABASE_KEY')
  || env('NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

// Do not read service/Stripe/VAPID secrets at config load — they get inlined
// into the server bundle. Runtime plugins fill them from process.env.

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // Dark backdrop only — the tank lives in app.html outside #__nuxt so Vue
  // replacing this template does not restart the SVG animation.
  spaLoadingTemplate: true,
  devtools: { enabled: false },
  devServer: {
    port: 3001
  },
  icon: {
    serverBundle: {
      collections: ['lucide']
    }
  },
  modules: ['@nuxt/ui', '@vite-pwa/nuxt', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: ''
  },
  supabase: {
    redirect: false,
    url: supabaseUrl,
    key: supabaseAnonKey,
    clientOptions: {
      auth: {
        // Opt in to Supabase's beta passkey (WebAuthn) API.
        experimental: {
          passkey: true
        }
      }
    },
    cookieOptions: isProduction
      ? {
          domain: '.veteranscentralhub.us',
          secure: true,
          sameSite: 'lax'
        }
      : undefined
  },
  runtimeConfig: {
    // Private keys stay empty at build; server plugin fills from process.env.
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripeProPriceId: envFirst('STRIPE_PRO_PRICE_ID', 'NUXT_STRIPE_PRO_PRICE_ID'),
    supabaseServiceRoleKey: '',
    supabaseServiceKey: '',
    vapidPrivateKey: '',
    reminderCronSecret: '',
    public: {
      supabaseUrl,
      supabaseAnonKey: supabaseAnonKey,
      supabaseKey: supabaseAnonKey,
      supabasePublishableKey: supabaseAnonKey,
      stripePublishableKey: envFirst(
        'STRIPE_PUBLIC_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
      ),
      vapidPublicKey: env('VAPID_PUBLIC_KEY') || env('NUXT_PUBLIC_VAPID_PUBLIC_KEY'),
      siteUrl: env('APP_URL')
        || env('NUXT_PUBLIC_SITE_URL')
        || (isProduction ? 'https://tracker.veteranscentralhub.us' : ''),
      claimBuilderUrl: envFirst('NUXT_PUBLIC_CLAIMBUILDER_URL', 'CLAIMBUILDER_URL')
        || (isProduction ? 'https://claimbuilder.veteranscentralhub.us' : 'http://localhost:3000'),
      // Web3Forms contact form — create a form at https://web3forms.com (can share VCH inbox key).
      web3formsAccessKey: env('NUXT_PUBLIC_WEB3FORMS_ACCESS_KEY')
    }
  },
  app: {
    head: {
      title: 'Veteran Symptom Tracker',
      meta: [
        { name: 'description', content: 'A mobile-first symptom tracker for veterans to log symptoms, track daily impact, and collect supporter observations.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0f172a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Symptoms' },
        { property: 'og:title', content: 'Veteran Symptom Tracker' },
        { property: 'og:description', content: 'Track symptoms, daily impact, and signed supporter observations from your phone.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/brand/vch-symptom-tracker-logo.png' },
        { name: 'twitter:card', content: 'summary' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/brand/vch-symptom-tracker-logo.png' },
        { rel: 'shortcut icon', type: 'image/png', href: '/brand/vch-symptom-tracker-logo.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' }
      ]
    }
  },
  pwa: {
    // Keep skipWaiting so push reminders can activate, but do not inject the
    // default autoUpdate helper — it calls location.reload() on controllerchange
    // and replayed the tank splash about a second after first paint.
    registerType: 'autoUpdate',
    client: {
      register: false
    },
    includeAssets: ['brand/vch-symptom-tracker-logo.png', 'vch-logo.png', 'vch-logo-loader.svg', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png', 'pwa-maskable-512.png', 'notification-badge.png'],
    workbox: {
      importScripts: ['/log-reminder-handlers.js'],
      // This is an authenticated server app, not an offline SPA shell. Keep the
      // reminder service worker active without replacing navigations or API/auth
      // responses with a cached root document.
      navigateFallbackDenylist: [/.*/]
    },
    manifest: {
      id: '/',
      name: 'VCH Symptom Tracker',
      short_name: 'Symptoms',
      description: 'A mobile-first symptom tracker for veterans to log symptoms and supporter observations.',
      theme_color: '#0f172a',
      background_color: '#020617',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      categories: ['health', 'productivity', 'utilities']
    }
  },
  vite: {
    optimizeDeps: {
      include: ['@stripe/stripe-js', 'chart.js', 'vue-chartjs']
    }
  },
  nitro: {
    // Render runs the generated Nitro node server in production.
    preset: process.env.NITRO_PRESET || 'node-server',
    compatibilityDate: '2025-07-15',
    compressPublicAssets: true
  },
  routeRules: {
    '/app/**': { redirect: { to: '/', statusCode: 301 } },
    '/': { ssr: false },
    '/profile': { ssr: false },
    '/report/**': { ssr: false },
    '/auth/**': { ssr: false },
    '/upgrade': { ssr: false },
    '/upgrade/**': { ssr: false },
    '/api/stripe/webhook': { cors: false },
    '/api/stripe/**': { cors: false }
  }
})
