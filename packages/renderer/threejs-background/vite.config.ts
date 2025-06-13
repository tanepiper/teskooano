import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "glsl",
      transform(src, id) {
        if (/\.glsl$/.test(id)) {
          return {
            code: `export default ${JSON.stringify(src)};`,
            map: null,
          };
        }
      },
    },
  ],
});
