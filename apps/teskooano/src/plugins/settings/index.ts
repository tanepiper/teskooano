import type {
  PanelConfig,
  TeskooanoPlugin,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { SettingsPanel } from "./SettingsPanel"; // Import the panel class

// Import the Fluent UI Settings icon
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

// --- Constants ---
const SETTINGS_PANEL_ID = "app_settings_panel"; // Consistent ID (though componentName is primary)

// --- Panel Configuration ---
const settingsPanelConfig: PanelConfig = {
  componentName: SettingsPanel.componentName,
  panelClass: SettingsPanel,
  defaultTitle: "Settings",
};

// Toolbar Registration
const settingsToolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar", // Target the main application toolbar
  items: [
    {
      id: "core-settings-toggle",
      type: "panel",
      title: "Settings",
      iconSvg: SettingsIcon, // Use the imported Fluent UI icon
      componentName: settingsPanelConfig.componentName, // Panel to open
      behaviour: "toggle", // Toggle the panel's visibility
      order: 100, // Place it towards the end (adjust as needed)
      tooltipText: "Open the application settings panel.",
      tooltipTitle: "Settings",
      tooltipIconSvg: SettingsIcon,
    },
  ],
};

/**
 * Plugin definition for the main application Settings panel.
 *
 * Registers the SettingsPanel and its associated toolbar button
 * on the main application toolbar.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-settings", // Updated ID
  name: "Application Settings Panel",
  description:
    "Registers the main application settings panel and its toolbar toggle button.",
  panels: [settingsPanelConfig],
  toolbarRegistrations: [settingsToolbarRegistration],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

// Export the panel component directly if needed elsewhere
export { SettingsPanel };
