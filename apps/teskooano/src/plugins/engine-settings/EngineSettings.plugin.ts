import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { EngineUISettingsPanel } from "./EngineSettings";

const settingsButtonConfig =
  EngineUISettingsPanel.registerToolbarButtonConfig();

export const engineUiPlugin: TeskooanoPlugin = {
  id: "core-engine-ui-controls",
  name: "Core Engine UI Controls",
  description:
    "Provides standard UI controls like the settings panel for engine views.",

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
};

export const plugin = engineUiPlugin;
