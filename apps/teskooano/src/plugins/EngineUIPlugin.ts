import type { TeskooanoPlugin, ToolbarRegistration } from '@teskooano/ui-plugin';
import { EngineUISettingsPanel } from '../components/ui-controls/EngineUISettingsPanel';

// Get the static button config from the panel class
const settingsButtonConfig = EngineUISettingsPanel.registerToolbarButtonConfig();

// Define the plugin object
export const engineUiPlugin: TeskooanoPlugin = {
  id: 'core-engine-ui-controls',
  name: 'Core Engine UI Controls',
  description: 'Provides standard UI controls like the settings panel for engine views.',

  // Register the EngineUISettingsPanel as a Dockview panel component
  panels: [
    {
      componentName: EngineUISettingsPanel.componentName, // Use static property
      panelClass: EngineUISettingsPanel, // The class itself
      defaultTitle: 'Engine Settings',
      // Default params and options can be added if needed
    },
  ],

  // Register the toolbar button for the engine settings panel
  toolbarRegistrations: [
    {
      // This button belongs on the toolbar specific to engine views
      target: 'engine-toolbar', 
      items: [
        {
          id: settingsButtonConfig.id, // Use the base ID from static config
          title: settingsButtonConfig.title,
          iconSvg: settingsButtonConfig.iconSvg,
          order: 100, // Example order, adjust as needed
          type: 'panel',
          componentName: settingsButtonConfig.componentName, // Panel to open
          panelTitle: settingsButtonConfig.panelTitle,
          behaviour: settingsButtonConfig.behaviour,
        },
        // Add other engine toolbar items from this plugin here if any
      ],
    },
  ],

  // No functions or global components provided by this specific plugin
  functions: [],

  // Optional initialization/cleanup if needed in the future
  initialize: () => {
    console.log('[EngineUIPlugin] Initialized.');
  },
  dispose: () => {
    console.log('[EngineUIPlugin] Disposed.');
  },
};

// Default export for easy dynamic import by the plugin loader
// export default engineUiPlugin; 
// ---> EXPORT using the named export 'plugin' that the loader expects
export const plugin = engineUiPlugin; 