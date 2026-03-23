import { createPanelPlugin } from "@teskooano/ui-plugin";
import SettingsPanelSvelte from "./view/SettingsPanel.svelte";
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

/**
 * Plugin definition for the main application Settings panel.
 * Migrated to Svelte — no custom elements registered.
 */
export const plugin = createPanelPlugin({
  id: "teskooano-settings",
  name: "Application Settings Panel",
  description:
    "Registers the main application settings panel and its toolbar toggle button.",
  componentName: "teskooano-settings-panel",
  svelteComponent: SettingsPanelSvelte,
  defaultTitle: "Settings",
  iconSvg: SettingsIcon,
  target: "main-toolbar",
  order: 100,
  tooltipText: "Open the application settings panel.",
  tooltipTitle: "Settings",
  tooltipIconSvg: SettingsIcon,
});
