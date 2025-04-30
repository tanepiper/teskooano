import type {
  FunctionConfig,
  PanelConfig,
  PluginExecutionContext,
  TeskooanoPlugin,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import type { AddPanelOptions } from "dockview-core";
import { SettingsPanel } from "./SettingsPanel"; // Import the panel class

// Import the Fluent UI Settings icon
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

// --- Constants ---
const SETTINGS_PANEL_ID = "app_settings_panel"; // Consistent ID

// --- Panel Configuration ---
const settingsPanelConfig: PanelConfig = {
  componentName: SettingsPanel.componentName,
  panelClass: SettingsPanel,
  defaultTitle: "Settings",
};

// Toolbar Registration (NEW)
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
    },
  ],
};

// --- Plugin Definition ---
export const plugin: TeskooanoPlugin = {
  id: "core-settings",
  name: "Core Settings Panel",
  description:
    "Registers the main application settings panel and its toolbar toggle button.",
  panels: [settingsPanelConfig],
  functions: [], // REMOVED toggleSettingsPanelFunction
  toolbarRegistrations: [settingsToolbarRegistration], // ADDED toolbar registration
};
