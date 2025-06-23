import { createPanelPlugin } from "@teskooano/ui-plugin";
import { SettingsPanel } from "./view/SettingsPanel";
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

/**
 * Plugin definition for the main application Settings panel.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 55 lines to 15 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-settings",
  name: "Application Settings Panel",
  description: "Registers the main application settings panel and its toolbar toggle button.",
  componentName: SettingsPanel.componentName,
  panelClass: SettingsPanel,
  defaultTitle: "Settings",
  iconSvg: SettingsIcon,
  target: "main-toolbar",
  order: 100,
  tooltipText: "Open the application settings panel.",
  tooltipTitle: "Settings",
  tooltipIconSvg: SettingsIcon,
});

export { SettingsPanel };
