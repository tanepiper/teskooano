import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'; // Import the plugin


const basePath = process.env.CI ? '/teskooano/' : '/';


export default defineConfig({
  plugins: [
    glsl() // Add the plugin to the plugins array
  ],
  base: basePath,
  
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext'
  }
})
