import type {
  TeskooanoPlugin,
  FunctionConfig,
  PluginExecutionContext,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { TourController } from "./TourController";

import TourIcon from "@fluentui/svg-icons/icons/compass_northwest_24_regular.svg?raw";

export * from "./TourModal";
export * from "./TourController";

export const tourControllerInstance = new TourController();

const startTourFunction: FunctionConfig = {
  id: "tour:start",
  dependencies: {},
  execute: async () => {
    tourControllerInstance.startTour();
  },
};

const restartTourFunction: FunctionConfig = {
  id: "tour:restart",
  dependencies: {},
  execute: async () => {
    tourControllerInstance.restartTour();
  },
};

const setSkipTourFunction: FunctionConfig = {
  id: "tour:setSkip",
  dependencies: {},

  execute: async (_: PluginExecutionContext, args?: { skip?: boolean }) => {
    const skipValue = args?.skip ?? false;
    tourControllerInstance.setSkipTour(skipValue);
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
  functions: [startTourFunction, restartTourFunction, setSkipTourFunction],
  panels: [],
  toolbarRegistrations: [tourToolbarRegistration],
};
