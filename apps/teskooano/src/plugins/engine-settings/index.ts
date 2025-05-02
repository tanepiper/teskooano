import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { EngineUISettingsPanel } from "./EngineSettings";

const settingsButtonConfig =
  EngineUISettingsPanel.registerToolbarButtonConfig();

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
      componentName: EngineUISettingsPanel.componentName,
      panelClass: EngineUISettingsPanel,
      defaultTitle: "Engine Settings",
    },
  ],

  toolbarRegistrations: [
    {
      target: "engine-toolbar",
      items: [
        {
          id: settingsButtonConfig.id,
          title: settingsButtonConfig.title,
          iconSvg: settingsButtonConfig.iconSvg,
          order: 100,
          type: "panel",
          componentName: settingsButtonConfig.componentName,
          panelTitle: settingsButtonConfig.panelTitle,
          behaviour: settingsButtonConfig.behaviour,
        },
      ],
    },
  ],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { EngineUISettingsPanel };
