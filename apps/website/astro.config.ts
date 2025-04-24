// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightClientMermaid from "@pasqal-io/starlight-client-mermaid";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightClientMermaid(),
        //   starlightTypeDoc({
        //   entryPoints: [
        //     '../../packages/app/design-system/src/index.ts',
        //     '../../packages/app/simulation/src/index.ts',
        //     '../../packages/app/web-apis/src/index.ts',
        //   ],
        //   tsconfig: '../../tsconfig.typedoc.json',
        // })
      ],
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
