import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CelestialUniformsEditor } from "./CelestialUniforms";

import Icon from "@fluentui/svg-icons/icons/code_circle_20_regular.svg?raw";

const panelConfig: PanelConfig = {
  componentName: CelestialUniformsEditor.componentName,
  panelClass: CelestialUniformsEditor,
  defaultTitle: "Celestial Uniforms Editor",
};

const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar",
  items: [
    {
      id: "celestial-uniforms-button",
      type: "panel",
      title: "Celestial Uniforms Editor",
      iconSvg: Icon,
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
  id: "teskooano-celestial-uniforms",
  name: "Celestial Uniforms",
  description:
    "Provides the celestial uniforms display panel and toolbar button.",
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { CelestialUniformsEditor };
