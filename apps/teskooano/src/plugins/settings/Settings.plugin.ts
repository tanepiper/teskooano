import type {
  TeskooanoPlugin,
  PanelConfig,
  FunctionConfig,
  PluginExecutionContext,
  // ToolbarRegistration, // No toolbar items needed directly from this plugin
} from "@teskooano/ui-plugin";
import type { DockviewApi, AddPanelOptions } from "dockview-core";
import { SettingsPanel } from "./SettingsPanel"; // Import the panel class

// --- Constants ---
const SETTINGS_PANEL_ID = "app_settings_panel"; // Consistent ID

// --- Panel Configuration ---
const settingsPanelConfig: PanelConfig = {
  componentName: "settings_view", // Matches the component name used before
  panelClass: SettingsPanel,
  defaultTitle: "Settings",
};

// --- Function Definition: Toggle Panel ---
const toggleSettingsPanelFunction: FunctionConfig = {
  id: "settings:toggle_panel",
  execute: async (context: PluginExecutionContext) => {
    const { dockviewApi } = context;
    console.log("[SettingsPlugin] Executing settings:toggle_panel...");
    if (!dockviewApi) {
      console.error(
        "[SettingsPlugin] Cannot toggle panel: Dockview API not available in context.",
      );
      return;
    }

    const existingPanel = dockviewApi.panels.find(
      (p: any) => p.id === SETTINGS_PANEL_ID,
    );

    const panelWidth = 650;
    const panelHeight = 500;
    // Calculate center position (consider window resize if panel is open?)
    const centerWidth = window.innerWidth / 2 - panelWidth / 2;
    const centerHeight = window.innerHeight / 2 - panelHeight / 2;

    if (existingPanel) {
      existingPanel.api.close();
      console.log(
        `[SettingsPlugin] Closed existing panel: ${SETTINGS_PANEL_ID}`,
      );
    } else {
      const settingsPanelOptions: AddPanelOptions = {
        id: SETTINGS_PANEL_ID,
        component: settingsPanelConfig.componentName,
        title: settingsPanelConfig.defaultTitle,
        floating: {
          position: { top: centerHeight, left: centerWidth },
          width: panelWidth,
          height: panelHeight,
        },
        params: {}, // Add params if SettingsPanel needs them
        // isClosable: false // Maybe keep closable via header 'x'
      };
      try {
        const newPanel = dockviewApi.addPanel(settingsPanelOptions);
        // Optional: Activate? Floating panels usually don't need explicit activation
        // newPanel.api.setActive();
        console.log(`[SettingsPlugin] Added new panel: ${SETTINGS_PANEL_ID}`);
      } catch (error) {
        console.error(
          `[SettingsPlugin] Failed to add settings panel ${SETTINGS_PANEL_ID}:`,
          error,
        );
      }
    }
  },
};

// --- Plugin Definition ---
export const plugin: TeskooanoPlugin = {
  id: "core-settings",
  name: "Core Settings Panel",
  description:
    "Registers the main application settings panel and toggle function.",
  panels: [settingsPanelConfig],
  functions: [toggleSettingsPanelFunction],
  // No direct toolbar registrations needed
};
