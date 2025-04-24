import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Teskooano Docs', // You might want to change this title
      customCss: [
        // Relative path to your custom CSS file
        './src/styles/custom.css',
      ],
    }),
  ],
}); 