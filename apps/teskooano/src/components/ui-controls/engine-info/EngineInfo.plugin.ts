import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { RendererInfoDisplay } from "./engine-info"; // Import the panel class

// --- Import Fluent UI Icons ---
// Using DataUsageIcon from the component itself, but could define another like InfoIcon:
// import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";
import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw"; // Using the same icon for now

// --- Panel Configuration ---
const panelConfig: PanelConfig = {
  componentName: RendererInfoDisplay.componentName, // Use static property 'renderer-info-display'
  panelClass: RendererInfoDisplay, // The class implementing IContentRenderer
  defaultTitle: "Renderer Info",
};

// --- Toolbar Registration ---
const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar", // Add button to the engine's overlay toolbar
  items: [
    {
      id: "engine-info-button", // Unique ID for this button
      type: "panel",
      title: "Engine Info", // Tooltip for the button
      iconSvg: DataUsageIcon, // Icon for the button
      componentName: panelConfig.componentName, // Panel to open ('renderer-info-display')
      behaviour: "toggle", // Allow opening/closing the panel
      order: 20, // Place it after Focus Control (order 10)
      // No initial position specified, will use default cascade
    },
  ],
};

// --- Plugin Definition ---
// Export the plugin definition adhering to the TeskooanoPlugin interface
// Use the required named export 'plugin'
export const plugin: TeskooanoPlugin = {
  id: "core-engine-info", // Unique ID for this plugin
  name: "Core Engine Info",
  description:
    "Provides the engine information display panel and toolbar button.",
  panels: [panelConfig], // Register the panel
  toolbarRegistrations: [toolbarRegistration], // Register the toolbar item(s)
  // No functions or base components from this plugin
  functions: [],
  // Optional initialize/dispose if needed
};
