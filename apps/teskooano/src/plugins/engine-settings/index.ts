import { createPanelPlugin } from "@teskooano/ui-plugin";
import EngineSettingsPanelSvelte from "./view/EngineSettingsPanel.svelte";
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

/**
 * Plugin definition for the Engine Settings UI panel.
 * ✅ Migrated to Svelte 5
 */
export const plugin = createPanelPlugin({
  id: "teskooano-engine-settings",
  name: "Engine Settings UI",
  description:
    "Provides the settings panel for controlling engine view options.",
  componentName: "teskooano-engine-ui-settings-panel",
  svelteComponent: EngineSettingsPanelSvelte,
  defaultTitle: "⚙️ Engine Settings",
  iconSvg: SettingsIcon,
  target: "engine-toolbar",
  order: 100,
  initialPosition: {
    top: window.innerHeight / 2 - 250,
    left: window.innerWidth / 2 - 250,
    width: 500,
    height: 500,
  },
});

