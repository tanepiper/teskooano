import type { PluginRegistryConfig } from '@teskooano/ui-plugin';

// Defines the UI feature plugins to load.
// The keys are unique plugin IDs used for identification.
// The paths should point to the module exporting the `TeskooanoPlugin` object
// (exported as 'plugin' by default).

export const pluginConfig: PluginRegistryConfig = {
  // Add the Focus Control plugin
  'core-focus-controls': { path: '../components/ui-controls/focus/FocusControl.plugin.js' }, // Assuming .js after build, adjust if needed

  // Example (add actual plugins here later):
  // 'feature-celestial-info': { path: '@teskooano/celestial-info-plugin' }, // Assuming default export 'plugin'
}; 