import { createPanelPlugin } from "@teskooano/ui-plugin";
import { WebGLCapabilitiesDisplay } from "./view/WebGLCapabilitiesDisplay.view.js";
import RendererInfoPanelSvelte from "./view/RendererInfoPanel.svelte";
import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw";

/**
 * The Teskooano plugin definition for the Engine Info feature.
 * ✅ Migrated to Svelte 5
 */
export const plugin = createPanelPlugin({
  id: "teskooano-engine-info",
  name: "Engine Info Display",
  description:
    "Provides the engine information display panel and toolbar button.",
  componentName: "renderer-info-display",
  svelteComponent: RendererInfoPanelSvelte,
  defaultTitle: "Renderer Info",
  iconSvg: DataUsageIcon,
  target: "engine-toolbar",
  order: 20,
  initialPosition: {
    top: window.innerHeight / 2 - 240,
    left: window.innerWidth / 2 - 320,
    width: 640,
    height: 480,
  },
});

export { WebGLCapabilitiesDisplay };
