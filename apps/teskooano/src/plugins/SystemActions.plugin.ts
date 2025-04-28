import type {
  TeskooanoPlugin,
  FunctionConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import * as SystemActions from "../components/toolbar/system-controls.actions";
import SparkleIcon from "@fluentui/svg-icons/icons/sparkle_24_regular.svg?raw";
import type { DockviewApi } from "dockview-core"; // Need this type

// --- Function Definitions ---

// Placeholder for getting Dockview API - This needs a proper mechanism!
// Maybe the plugin manager injects it during initialize or execute?
let dockviewApiInstance: DockviewApi | null = null;

const generateRandomFunction: FunctionConfig = {
  id: "system:generate_random",
  // Assume execute receives the API instance as context
  execute: async (/* context?: { dockviewApi?: DockviewApi } */) => {
    console.log("[SystemActionsPlugin] Executing generate_random...");
    // TODO: Get the actual Dockview API instance!
    // For now, using the placeholder
    const result =
      await SystemActions.generateRandomSystem(dockviewApiInstance);
    console.log("[SystemActionsPlugin] generate_random result:", result);
    // TODO: Show feedback based on result (e.g., using a notification system?)
  },
};

// --- Toolbar Registration (Main Toolbar) ---

const mainToolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar", // Target the main application toolbar
  items: [
    {
      id: "main-toolbar-random-system",
      type: "function",
      title: "Generate Random System",
      iconSvg: SparkleIcon,
      functionId: generateRandomFunction.id, // Link to the function above
      order: 200, // Place it after Add View button (assuming Add View is ~100)
    },
    // Add other system action buttons here (Generate from Seed, Clear, Import, Export etc.)
  ],
};

// --- Plugin Definition ---
export const plugin: TeskooanoPlugin = {
  id: "core-system-actions",
  name: "Core System Actions",
  description:
    "Provides core functions and main toolbar buttons for system management (generate, clear, import, export).",
  functions: [generateRandomFunction /* Add other functions */],
  toolbarRegistrations: [mainToolbarRegistration],
  panels: [], // No panels defined by this plugin itself

  // --- How to get the Dockview API? ---
  // Option 1: Passed during initialization?
  initialize: (context?: { dockviewApi?: DockviewApi }) => {
    console.log("[SystemActionsPlugin] Initializing...");
    if (context?.dockviewApi) {
      console.log(
        "[SystemActionsPlugin] Received Dockview API via initialize context.",
      );
      dockviewApiInstance = context.dockviewApi;
    } else {
      console.warn(
        "[SystemActionsPlugin] Did not receive Dockview API during initialization! Actions needing it will fail.",
      );
    }
  },
  dispose: () => {
    console.log("[SystemActionsPlugin] Disposing...");
    dockviewApiInstance = null; // Clear reference
  },
};
