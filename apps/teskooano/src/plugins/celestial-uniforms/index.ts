import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CelestialUniformsEditor } from "./view/CelestialUniforms.view";

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
 * Plugin definition for the Celestial Uniforms Editor.
 *
 * Registers the `CelestialUniformsEditor` panel and its associated toolbar button,
 * providing a developer tool for real-time editing of object properties.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-celestial-uniforms",
  name: "Celestial Uniforms Editor",
  description:
    "Provides the celestial uniforms editor panel and toolbar button.",
  components: [
    {
      tagName: CelestialUniformsEditor.componentName,
      componentClass: CelestialUniformsEditor,
    },
  ],
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { CelestialUniformsEditor };
