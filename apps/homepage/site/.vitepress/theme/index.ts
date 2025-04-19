import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import ScreenshotCarousel from "./components/ScreenshotCarousel.vue";
import VueEasyLightbox from "vue-easy-lightbox";
import "vue-easy-lightbox/dist/external-css/vue-easy-lightbox.css";
import "./custom.css";

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("ScreenshotCarousel", ScreenshotCarousel);
    app.use(VueEasyLightbox);
  },
} satisfies Theme;
