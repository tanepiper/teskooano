import { createPanelPlugin } from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./composite-panel/CompositeEnginePanel";

/**
 * Plugin definition for the core Engine Panel view.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 30 lines to 12 lines
 * Note: This is a special panel that doesn't have a toolbar button as it's created dynamically
 */
export const plugin = createPanelPlugin({
  id: "engine-panel-views",
  name: "Engine Panel Views",
  description: "Registers the main engine view panel (CompositeEnginePanel).",
  componentName: "teskooano-engine-view",
  panelClass: CompositeEnginePanel,
  defaultTitle: "Engine View",
  iconSvg: "", // No icon needed - this panel is created programmatically
  target: undefined, // No toolbar registration - panels are created via function calls
});

export { CompositeEnginePanel };
