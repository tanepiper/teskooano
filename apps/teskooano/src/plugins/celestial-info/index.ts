import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CelestialInfo } from "./CelestialInfo";

import InfoIcon from "@fluentui/svg-icons/icons/info_24_regular.svg?raw";

const panelConfig: PanelConfig = {
  componentName: CelestialInfo.componentName,
  panelClass: CelestialInfo,
  defaultTitle: "Celestial Info",
};

const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar",
  items: [
    {
      id: "celestial-info-button",
      type: "panel",
      title: "Celestial Info",
      iconSvg: InfoIcon,
      componentName: panelConfig.componentName,
      behaviour: "toggle",
      order: 30,
    },
  ],
};

/**
 * Plugin definition for the Celestial Info display panel.
 *
 * Registers the CelestialInfo panel and its associated toolbar button
 * for showing detailed information about the currently focused celestial object.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-celestial-info",
  name: "Celestial Info Display",
  description:
    "Provides the celestial information display panel and toolbar button.",
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { CelestialInfo };
