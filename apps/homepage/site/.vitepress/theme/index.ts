// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

// Add additional components or extend the default theme here
export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Add custom layout elements if needed
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Register global components or other app-level enhancements
  }
} satisfies Theme 