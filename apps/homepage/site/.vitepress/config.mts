import lightbox from "vitepress-plugin-lightbox";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  vite: {
    resolve: {
      alias: {
        "vue-easy-lightbox$":
          "vue-easy-lightbox/dist/external-css/vue-easy-lightbox.esm.min.js",
      },
    },
  },
  base: "/",
  ignoreDeadLinks: true,
  title: "Teskooano",
  description:
    "Advanced 3D N-Body Simulation Engine with realistic physics and multi-view capabilities",
  head: [
    ["link", { rel: "icon", href: "/icon.png" }],
    ["meta", { name: "theme-color", content: "#3a70c9" }],
    ["meta", { name: "og:type", content: "website" }],
    [
      "meta",
      {
        name: "og:title",
        content: "Teskooano - Advanced 3D N-Body Simulation Engine",
      },
    ],
    [
      "meta",
      {
        name: "og:description",
        content:
          "Explore celestial systems with reasonably accurate physics, real-time visualization, and multi-view capabilities",
      },
    ],
    [
      "meta",
      {
        name: "og:image",
        content: "https://teskooano.space/panel-icon.png",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/icon.png",
    nav: [
      { text: "Home", link: "/" },
      { text: "Documentation", link: "/docs/" },
      { text: ".plan", link: "/plan/" },
      { text: "Changelog", link: "/CHANGELOG" },
      { text: "Teskooano", link: "https://teskooano.space/teskooano" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is Teskooano?", link: "/docs/" },
          { text: "Getting Started", link: "/docs/getting-started" },
        ],
      },
      {
        text: "User Guide",
        items: [
          { text: "Basic Usage", link: "/docs/basic-usage" },
          { text: "Navigation Controls", link: "/docs/navigation" },
          { text: "Simulation Controls", link: "/docs/simulation" },
        ],
      },
      {
        text: "Developer Guide",
        items: [
          { text: "Architecture", link: "/docs/architecture" },
          { text: "Contributing", link: "/docs/contributing" },
        ],
      },
      {
        text: "Plan",
        items: [{ text: "Latest Updates", link: "/plan/" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/tanepiper/teskooano" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 Tane Piper",
    },

    search: {
      provider: "local",
    },
    markdown: {
      config: (md) => {
        // Use lightbox plugin
        md.use(lightbox, {});
      },
    },
  },
});
