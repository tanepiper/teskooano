import {
  type TeskooanoPlugin,
  type PanelConfig,
  type PluginExecutionContext,
} from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./composite-panel/CompositeEnginePanel";

const enginePanelConfig: PanelConfig = {
  componentName: "teskooano-engine-view",
  panelClass: CompositeEnginePanel,
  defaultTitle: "Engine View",
};

/**
 * Plugin definition for the core Engine Panel view.
 * Registers the CompositeEnginePanel as a Dockview panel.
 */
export const plugin: TeskooanoPlugin = {
  id: "engine-panel-views",
  name: "Engine Panel Views",
  description: "Registers the main engine view panel (CompositeEnginePanel).",
  panels: [enginePanelConfig],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { CompositeEnginePanel };
