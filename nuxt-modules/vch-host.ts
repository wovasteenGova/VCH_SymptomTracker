import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'vch-host'
  },
  setup() {
    const resolver = createResolver(import.meta.url)
    addPlugin({
      src: resolver.resolve('./runtime/vch-cookie-domain'),
      enforce: 'pre'
    })
  }
})
