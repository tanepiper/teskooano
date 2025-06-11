import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { EngineUISettingsPanel } from "./view/EngineSettings.view.js";
import SettingsIcon from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";

const COMPONENT_NAME = "engine-ui-settings-panel";
/**
 * Plugin definition for the Engine Settings UI panel.
 *
 * Registers the EngineUISettingsPanel and its associated toolbar button
 * for controlling engine view settings.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-engine-settings",
  name: "Engine Settings UI",
  description:
    "Provides the settings panel for controlling engine view options.",

  panels: [
    {
      componentName: COMPONENT_NAME,
      panelClass: EngineUISettingsPanel,
      defaultTitle: "Engine Settings",
    },
  ],

  toolbarRegistrations: [
    {
      target: "engine-toolbar",
      items: [
        {
          id: "engine_settings",
          title: "Engine Settings",
          iconSvg: SettingsIcon,
          order: 100,
          type: "panel",
          componentName: COMPONENT_NAME,
          panelTitle: "Engine Settings",
          behaviour: "toggle",
        },
      ],
    },
  ],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { EngineUISettingsPanel };
