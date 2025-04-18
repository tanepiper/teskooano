import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import lightbox from "vitepress-plugin-lightbox";

// https://vitepress.dev/reference/site-config
export default withMermaid({
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
          "Explore realistic celestial systems with accurate physics, real-time visualization, and multi-view capabilities",
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
