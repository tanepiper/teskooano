// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: '🔭 Teskooano - Three.js Powered Orbital Simulation Engine',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tanepiper/teskooano' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			customCss: [
				// Import only the design tokens (variables) for the website
				'@teskooano/design-system/colors.css',
				'./src/styles/custom.css',
			]
		}),
	],
});
