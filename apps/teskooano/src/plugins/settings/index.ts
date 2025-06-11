import type {
  PanelConfig,
  TeskooanoPlugin,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { SettingsPanel } from "./view/SettingsPanel";

import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

const SETTINGS_PANEL_ID = "app_settings_panel";

const settingsPanelConfig: PanelConfig = {
  componentName: SettingsPanel.componentName,
  panelClass: SettingsPanel,
  defaultTitle: "Settings",
};

const settingsToolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar",
  items: [
    {
      id: "core-settings-toggle",
      type: "panel",
      title: "Settings",
      iconSvg: SettingsIcon,
      componentName: settingsPanelConfig.componentName,
      behaviour: "toggle",
      order: 100,
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
  id: "teskooano-settings",
  name: "Application Settings Panel",
  description:
    "Registers the main application settings panel and its toolbar toggle button.",
  panels: [settingsPanelConfig],
  toolbarRegistrations: [settingsToolbarRegistration],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { SettingsPanel };
