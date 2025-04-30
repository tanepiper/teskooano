import type {
  TeskooanoPlugin,
  FunctionConfig,
  PluginExecutionContext,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { TourController } from "./TourController"; // Import the controller class

// Import the Fluent UI compass icon
import TourIcon from "@fluentui/svg-icons/icons/compass_northwest_24_regular.svg?raw";

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

// Toolbar Registration (NEW)
const tourToolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar",
  items: [
    {
      id: "core-tour-restart-button",
      type: "function",
      title: "Restart Tour",
      iconSvg: TourIcon,
      functionId: restartTourFunction.id, // Call tour:restart
      order: 90, // Place it before settings (adjust as needed)
      // Add tooltip details
      tooltipText: "Restart the application introduction tour.",
      tooltipTitle: "Restart Tour",
      tooltipIconSvg: TourIcon, // Can use the same icon for the tooltip
    },
  ],
};

export const plugin: TeskooanoPlugin = {
  id: "core-tour",
  name: "Application Tour",
  description: "Manages the application tour using driver.js.",
  functions: [startTourFunction, restartTourFunction, setSkipTourFunction],
  panels: [],
  toolbarRegistrations: [tourToolbarRegistration],
};
