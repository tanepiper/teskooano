import { createPanelPlugin } from "@teskooano/ui-plugin";
import CelestialUniformsPanelSvelte from "./view/CelestialUniformsPanel.svelte";
import Icon from "@fluentui/svg-icons/icons/code_circle_20_regular.svg?raw";

/**
 * Plugin definition for the Celestial Uniforms Editor.
 * ✅ Migrated to Svelte 5
 */
export const plugin = createPanelPlugin({
  id: "teskooano-celestial-uniforms",
  name: "Celestial Uniforms Editor",
  description:
    "Provides the celestial uniforms editor panel and toolbar button.",
  componentName: "celestial-uniforms-editor",
  svelteComponent: CelestialUniformsPanelSvelte,
  defaultTitle: "Celestial Uniforms Editor",
  iconSvg: Icon,
  target: "engine-toolbar",
  order: 30,
});

