import type {
  TeskooanoPlugin,
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import { TourController } from "./tourController"; // Import the controller class

const tourControllerInstance = new TourController();

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
  // Expects second argument: { skip: boolean }
  execute: async (_: PluginExecutionContext, args?: { skip?: boolean }) => {
    const skipValue = args?.skip ?? false;
    console.log(`[TourPlugin] Executing tour:setSkip with value: ${skipValue}`);
    tourControllerInstance.setSkipTour(skipValue);
  },
};

export const plugin: TeskooanoPlugin = {
  id: "core-tour",
  name: "Application Tour",
  description: "Manages the application tour using driver.js.",
  functions: [startTourFunction, restartTourFunction, setSkipTourFunction],
  panels: [],
  toolbarRegistrations: [],
};
