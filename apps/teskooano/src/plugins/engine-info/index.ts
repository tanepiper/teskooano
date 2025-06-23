import { createPanelPlugin } from "@teskooano/ui-plugin";
import { RendererInfoDisplay } from "./view/RendererInfoDisplay.view.js";
import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw";

/**
 * The Teskooano plugin definition for the Engine Info feature.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 57 lines to 15 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-engine-info",
  name: "Engine Info Display",
  description: "Provides the engine information display panel and toolbar button.",
  componentName: RendererInfoDisplay.componentName,
  panelClass: RendererInfoDisplay,
  defaultTitle: "Renderer Info",
  iconSvg: DataUsageIcon,
  target: "engine-toolbar",
  order: 20,
});

export { RendererInfoDisplay };
