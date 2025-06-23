import { createPanelPlugin } from "@teskooano/ui-plugin";
import { CelestialUniformsEditor } from "./view/CelestialUniforms.view";
import Icon from "@fluentui/svg-icons/icons/code_circle_20_regular.svg?raw";

/**
 * Plugin definition for the Celestial Uniforms Editor.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 56 lines to 15 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-celestial-uniforms",
  name: "Celestial Uniforms Editor",
  description: "Provides the celestial uniforms editor panel and toolbar button.",
  componentName: CelestialUniformsEditor.componentName,
  panelClass: CelestialUniformsEditor,
  defaultTitle: "Celestial Uniforms Editor",
  iconSvg: Icon,
  target: "engine-toolbar",
  order: 30,
});

export { CelestialUniformsEditor };
