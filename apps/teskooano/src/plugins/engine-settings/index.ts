import { createPanelPlugin } from "@teskooano/ui-plugin";
import { EngineUISettingsPanel } from "./view/EngineSettings.view.js";
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

const COMPONENT_NAME = "teskooano-engine-ui-settings-panel";

/**
 * Plugin definition for the Engine Settings UI panel.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 49 lines to 15 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-engine-settings",
  name: "Engine Settings UI",
  description:
    "Provides the settings panel for controlling engine view options.",
  componentName: COMPONENT_NAME,
  panelClass: EngineUISettingsPanel,
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

export { EngineUISettingsPanel };
