import type {
  TeskooanoPlugin,
  PanelConfig,
  FunctionConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./CompositeEnginePanel";
import { ProgressPanel } from "./ProgressPanel";

// --- Imports for System Actions (from former SystemActions.plugin) ---
import * as SystemActions from "../../components/toolbar/system-controls.actions";
import SparkleIcon from "@fluentui/svg-icons/icons/sparkle_24_regular.svg?raw";
import type { DockviewApi } from "dockview-core";

// --- Placeholder for Dockview API --- // (Moved from SystemActions.plugin)
let dockviewApiInstance: DockviewApi | null = null;

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

// --- Function Definitions (Moved from SystemActions.plugin) ---
const generateRandomFunction: FunctionConfig = {
  id: "system:generate_random",
  execute: async () => {
    console.log("[EngineViewPlugin] Executing system:generate_random...");
    const result =
      await SystemActions.generateRandomSystem(dockviewApiInstance);
    console.log("[EngineViewPlugin] generate_random result:", result);
  },
};
// TODO: Add other system functions (clear, import, export, etc.) here

// --- Toolbar Registration (Moved from SystemActions.plugin) ---
const mainToolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar",
  items: [
    {
      id: "main-toolbar-random-system",
      type: "function",
      title: "Generate Random System",
      iconSvg: SparkleIcon,
      functionId: generateRandomFunction.id,
      order: 200,
    },
    // TODO: Add other system action buttons here
  ],
};

// --- Plugin Definition ---
// This plugin primarily registers the core engine view component and related transient panels.
export const plugin: TeskooanoPlugin = {
  id: "core-engine-view",
  name: "Core Engine View & Actions",
  description:
    "Registers engine view panels (Composite, Progress) and provides core system actions.",
  // Register both panel types
  panels: [enginePanelConfig, progressPanelConfig],
  // Add functions and toolbar items from SystemActions
  functions: [generateRandomFunction /* Add others */],
  toolbarRegistrations: [mainToolbarRegistration],

  // Add initialize/dispose for DockviewAPI handling
  initialize: (context?: { dockviewApi?: DockviewApi }) => {
    console.log("[EngineViewPlugin] Initializing...");
    if (context?.dockviewApi) {
      console.log(
        "[EngineViewPlugin] Received Dockview API via initialize context.",
      );
      dockviewApiInstance = context.dockviewApi;
    } else {
      console.warn(
        "[EngineViewPlugin] Did not receive Dockview API during initialization! Actions needing it will fail.",
      );
    }
  },
  dispose: () => {
    console.log("[EngineViewPlugin] Disposing...");
    dockviewApiInstance = null; // Clear reference
  },
};
