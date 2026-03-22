import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import type { SvelteConfig } from "@sveltejs/vite-plugin-svelte";

const config: SvelteConfig = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true,
  },
};

export default config;
