import type {
  ToolbarRegistration,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";
import AddIcon from "@fluentui/svg-icons/icons/add_24_regular.svg?raw";
import { addCompositeEnginePanelFunction } from "./engine-view/EngineViewManager";

export const simulationControlsWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-sim-controls",
  target: "main-toolbar",
  componentName: "teskooano-simulation-controls",
  order: 10,
};

export const systemControlsWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-teskooano-system-controls",
  target: "main-toolbar",
  componentName: "teskooano-system-controls",
  order: 20,
};

export const externalLinksWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-external-links",
  target: "main-toolbar",
  componentName: "teskooano-external-links-component",
  order: 30,
};

export const addViewButtonRegistration: ToolbarRegistration = {
  target: "main-toolbar",
  items: [
    {
      id: "main-toolbar-add-view",
      type: "function",
      title: "Add Engine View",
      iconSvg: AddIcon,
      functionId: addCompositeEnginePanelFunction.id,
      order: 150,
      tooltipText: "Add a new composite engine view panel to the layout.",
      tooltipTitle: "Add Engine View",
      tooltipIconSvg: AddIcon,
    },
  ],
};
