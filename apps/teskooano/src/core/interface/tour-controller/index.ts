import type {
  TeskooanoPlugin,
  FunctionConfig,
  PluginExecutionContext,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { TourController } from "./TourController";

import TourIcon from "@fluentui/svg-icons/icons/compass_northwest_24_regular.svg?raw";

export * from "./TourController";

// A module-scoped variable to hold the singleton instance.
let tourControllerInstance: TourController | null = null;

const initializeTourFunction: FunctionConfig = {
  id: "tour:initialize",
  execute: async (context: PluginExecutionContext) => {
    if (!tourControllerInstance) {
      tourControllerInstance = new TourController(context);
    }
    await tourControllerInstance.promptIfNeeded();
    return tourControllerInstance;
  },
};

const startTourFunction: FunctionConfig = {
  id: "tour:start",
  execute: async () => {
    if (tourControllerInstance) {
      tourControllerInstance.startTour();
    } else {
      console.error(
        "[TourPlugin] Cannot start tour: Controller not initialized.",
      );
    }
  },
};

const restartTourFunction: FunctionConfig = {
  id: "tour:restart",
  execute: async () => {
    if (tourControllerInstance) {
      tourControllerInstance.restartTour();
    } else {
      console.error(
        "[TourPlugin] Cannot restart tour: Controller not initialized.",
      );
    }
  },
};

const setSkipTourFunction: FunctionConfig = {
  id: "tour:setSkip",
  execute: async (_: PluginExecutionContext, args?: { skip?: boolean }) => {
    if (tourControllerInstance) {
      const skipValue = args?.skip ?? false;
      tourControllerInstance.setSkipTour(skipValue);
    } else {
      console.error(
        "[TourPlugin] Cannot set skip preference: Controller not initialized.",
      );
    }
  },
};

const tourToolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar",
  items: [
    {
      id: "core-tour-restart-button",
      type: "function",
      title: "Restart Tour",
      iconSvg: TourIcon,
      functionId: restartTourFunction.id,
      order: 90,

      tooltipText: "Restart the application introduction tour.",
      tooltipTitle: "Restart Tour",
      tooltipIconSvg: TourIcon,
    },
  ],
};

export const plugin: TeskooanoPlugin = {
  id: "teskooano-tour",
  name: "Teskooano Tour",
  description: "Provides the interface for application tours using driver.js",
  functions: [
    initializeTourFunction,
    startTourFunction,
    restartTourFunction,
    setSkipTourFunction,
  ],
  panels: [],
  toolbarRegistrations: [tourToolbarRegistration],
};
