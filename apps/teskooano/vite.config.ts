import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'; // Import the plugin

export default defineConfig({
  plugins: [
    glsl() // Add the plugin to the plugins array
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext'
  }
})
