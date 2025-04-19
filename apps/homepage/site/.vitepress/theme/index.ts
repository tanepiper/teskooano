import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import ScreenshotCarousel from "./components/ScreenshotCarousel.vue";
import ScreenshotGrid from "./components/ScreenshotGrid.vue";
import VueEasyLightbox from "vue-easy-lightbox";
import "vue-easy-lightbox/dist/external-css/vue-easy-lightbox.css";
import "./custom.css";

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("ScreenshotCarousel", ScreenshotCarousel);
    app.component("ScreenshotGrid", ScreenshotGrid);
    app.use(VueEasyLightbox);
  },
} satisfies Theme;
