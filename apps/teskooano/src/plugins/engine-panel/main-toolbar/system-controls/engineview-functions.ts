import type {
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import type { AddPanelOptions } from "dockview-core";

let enginePanelCounter = 0;

export const addCompositeEnginePanelFunction: FunctionConfig = {
  id: "engine:add_composite_panel",
  requiresDockviewApi: true,
  requiresDockviewController: true,
  execute: async (context: PluginExecutionContext) => {
    const { dockviewApi, dockviewController } = context;
    if (!dockviewApi || !dockviewController) {
      console.error(
        "[EngineViewPlugin] Cannot add panel: Dockview API (or Controller) not provided in context.",
      );
      return;
    }

    enginePanelCounter++;
    const counter = enginePanelCounter;
    const compositeViewId = `composite_engine_view_${counter}`;
    const compositeViewTitle = `Teskooano ${counter}`;

    const panelOptions: AddPanelOptions = {
      id: compositeViewId,
      component: "composite_engine_view",
      title: compositeViewTitle,
      params: {
        title: compositeViewTitle,
        dockviewController: dockviewController,
      },
    };

    try {
      const newPanel = dockviewApi.addPanel(panelOptions);
      newPanel.api.setActive();
    } catch (error) {
      console.error(
        `[EngineViewPlugin] Failed to add engine panel for counter ${counter}:`,
        error,
      );
      enginePanelCounter--; // Decrement counter on failure
    }
  },
};
