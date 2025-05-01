import type {
  ToolbarRegistration,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";
import AddIcon from "@fluentui/svg-icons/icons/add_24_regular.svg?raw";
import { addCompositeEnginePanelFunction } from "./system-controls/engineview-functions"; // Assuming the function ID is stable

export const simulationControlsWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-sim-controls",
  target: "main-toolbar",
  componentName: "teskooano-simulation-controls", // Ensure this web component is registered
  order: 10,
};

export const systemControlsWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-teskooano-system-controls",
  target: "main-toolbar",
  componentName: "teskooano-system-controls", // Ensure this web component is registered
  order: 20,
};

export const externalLinksWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-external-links",
  target: "main-toolbar",
  componentName: "teskooano-external-links-component", // Matches the registered component tag
  order: 30, // Place it after system controls
};

export const addViewButtonRegistration: ToolbarRegistration = {
  target: "main-toolbar",
  items: [
    {
      id: "main-toolbar-add-view",
      type: "function",
      title: "Add Engine View",
      iconSvg: AddIcon,
      functionId: addCompositeEnginePanelFunction.id, // Use imported function config id
      order: 150,
      tooltipText: "Add a new composite engine view panel to the layout.",
      tooltipTitle: "Add Engine View",
      tooltipIconSvg: AddIcon,
    },
  ],
};
