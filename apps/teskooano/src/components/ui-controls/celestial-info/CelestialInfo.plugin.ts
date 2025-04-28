import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CelestialInfo } from "./CelestialInfo"; // Import the panel class

// --- Import Fluent UI Icons ---
// Use the InfoIcon defined in the CelestialInfo component's static config
import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";

// --- Panel Configuration ---
const panelConfig: PanelConfig = {
  componentName: CelestialInfo.componentName, // Use static property 'celestial-info'
  panelClass: CelestialInfo, // The class implementing IContentRenderer
  defaultTitle: "Celestial Info",
};

// --- Toolbar Registration ---
const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar", // Add button to the engine's overlay toolbar
  items: [
    {
      id: "celestial-info-button", // Unique ID for this button
      type: "panel",
      title: "Celestial Info", // Tooltip for the button
      iconSvg: InfoIcon, // Icon for the button
      componentName: panelConfig.componentName, // Panel to open ('celestial-info')
      behaviour: "toggle", // Allow opening/closing the panel
      order: 30, // Place it after Engine Info (order 20)
      // No initial position specified, will use default cascade
    },
  ],
};

// --- Plugin Definition ---
// Export the plugin definition adhering to the TeskooanoPlugin interface
// Use the required named export 'plugin'
export const plugin: TeskooanoPlugin = {
  id: "core-celestial-info", // Unique ID for this plugin
  name: "Core Celestial Info",
  description:
    "Provides the celestial information display panel and toolbar button.",
  panels: [panelConfig], // Register the panel
  toolbarRegistrations: [toolbarRegistration], // Register the toolbar item(s)
  // No functions or base components from this plugin
  functions: [],
  // Optional initialize/dispose if needed
};
