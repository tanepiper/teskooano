import type { TeskooanoPlugin, FunctionConfig } from "@teskooano/ui-plugin";
import { TourController } from "./tourController"; // Import the controller class

// --- Instantiate Tour Controller Singleton ---
// Create a single instance when the plugin module is loaded.
const tourControllerInstance = new TourController();
console.log("[TourPlugin] TourController instance created.");

// --- Function Definitions ---

const startTourFunction: FunctionConfig = {
  id: "tour:start",
  execute: async () => {
    console.log("[TourPlugin] Executing tour:start...");
    tourControllerInstance.startTour();
  },
};

const restartTourFunction: FunctionConfig = {
  id: "tour:restart",
  execute: async () => {
    console.log("[TourPlugin] Executing tour:restart...");
    tourControllerInstance.restartTour();
  },
};

const setSkipTourFunction: FunctionConfig = {
  id: "tour:setSkip",
  // Expects context: { skip: boolean }
  execute: async (context?: { skip?: boolean }) => {
    const skipValue = context?.skip ?? false;
    console.log(`[TourPlugin] Executing tour:setSkip with value: ${skipValue}`);
    tourControllerInstance.setSkipTour(skipValue);
  },
};

// TODO: Add functions for setEngineViewId and setCurrentSelectedCelestial if needed later,
// but preferably the TourController should subscribe to state itself.

// --- Plugin Definition ---
export const plugin: TeskooanoPlugin = {
  id: "core-tour",
  name: "Application Tour",
  description: "Manages the application tour using driver.js.",
  functions: [startTourFunction, restartTourFunction, setSkipTourFunction],
  // No panels or direct toolbar items from this plugin
  panels: [],
  toolbarRegistrations: [],

  // Optional initialize/dispose if needed for more complex setup/teardown
  // initialize: () => { ... }
  // dispose: () => { ... tourControllerInstance.destroy()? (if it has a destroy method) }
};
