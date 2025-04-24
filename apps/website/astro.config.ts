// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightClientMermaid from "@pasqal-io/starlight-client-mermaid";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightClientMermaid()],
      title: "Teskooano",
      description: "A 3D N-Body Simulation Engine",
      head: [
        {
          tag: "link",
          attrs: { rel: "icon", href: "/assets/icon.png" },
        },
        {
          tag: "meta",
          attrs: {
            name: "viewport",
            content: "width=device-width, initial-scale=1",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "me",
            href: "https://mastodon.gamedev.place/@teskooano",
          },
        },
        {
          tag: "link",
          attrs: { rel: "me", href: "https://github.com/tanepiper/teskooano" },
        },
      ],
      logo: {
        src: "/public/assets/icon.png",
        alt: "Teskooano Logo",
      },
      favicon: "/assets/icon.png",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/tanepiper/teskooano",
        },
      ],
      sidebar: [
        { label: "Homepage", link: "/" },
        { label: "Plan", link: "/plan" },

        { label: "Changelog", link: "/changelog" },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
