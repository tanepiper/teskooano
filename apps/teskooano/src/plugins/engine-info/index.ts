import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
  ComponentConfig,
} from "@teskooano/ui-plugin";
import { RendererInfoDisplay } from "./view/RendererInfoDisplay.view.js";

import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw";

const panelConfig: PanelConfig = {
  componentName: RendererInfoDisplay.componentName,
  panelClass: RendererInfoDisplay,
  defaultTitle: "Renderer Info",
};

const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar",
  items: [
    {
      id: "engine-info-button",
      type: "panel",
      title: "Engine Info",
      iconSvg: DataUsageIcon,
      componentName: panelConfig.componentName,
      behaviour: "toggle",
      order: 20,
    },
  ],
};

const componentConfig: ComponentConfig = {
  tagName: RendererInfoDisplay.componentName,
  componentClass: RendererInfoDisplay,
};

/**
 * Plugin definition for the Engine Info display panel.
 *
 * Registers the RendererInfoDisplay panel and its associated toolbar button
 * for showing renderer statistics.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-engine-info",
  name: "Engine Info Display",
  description:
    "Provides the engine information display panel and toolbar button.",
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  components: [componentConfig],
  managerClasses: [],
};

export { RendererInfoDisplay };
