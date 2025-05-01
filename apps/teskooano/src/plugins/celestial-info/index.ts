import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CelestialInfo } from "./CelestialInfo"; // Import the panel class

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

/**
 * Plugin definition for the Celestial Info display panel.
 *
 * Registers the CelestialInfo panel and its associated toolbar button
 * for showing detailed information about the currently focused celestial object.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-celestial-info", // Updated ID
  name: "Celestial Info Display",
  description:
    "Provides the celestial information display panel and toolbar button.",
  panels: [panelConfig], // Register the panel
  toolbarRegistrations: [toolbarRegistration], // Register the toolbar item(s)
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

// Export the panel component directly if needed elsewhere
export { CelestialInfo };
