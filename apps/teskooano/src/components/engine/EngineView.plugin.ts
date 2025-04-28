import type { TeskooanoPlugin, PanelConfig } from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./CompositeEnginePanel";
import { ProgressPanel } from "./ProgressPanel";

// --- Panel Configurations ---

const enginePanelConfig: PanelConfig = {
  // This is the component name used when adding engine views
  componentName: "composite_engine_view",
  panelClass: CompositeEnginePanel,
  defaultTitle: "Engine View", // Default title, often overridden
};

const progressPanelConfig: PanelConfig = {
  // This is the component name used when adding the progress panel programmatically
  componentName: "progress_view",
  panelClass: ProgressPanel,
  defaultTitle: "Processing...", // Default title
};

// --- Plugin Definition ---
// This plugin primarily registers the core engine view component and related transient panels.
export const plugin: TeskooanoPlugin = {
  id: "core-engine-view",
  name: "Core Engine View",
  description:
    "Registers the main CompositeEnginePanel and related ProgressPanel for Dockview.",
  // Register both panel types
  panels: [enginePanelConfig, progressPanelConfig],
  // No toolbar items or functions defined directly by this plugin
  toolbarRegistrations: [],
  functions: [],
};
