import type {
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import type { AddPanelOptions } from "dockview-core";

let enginePanelCounter = 0;

export const addCompositeEnginePanelFunction: FunctionConfig = {
  id: "view:addCompositeEnginePanel",
  dependencies: {
    dockView: {
      api: true,
      controller: true,
    },
  },
  execute: (context: PluginExecutionContext) => {
    const { dockviewApi } = context;
    if (!dockviewApi) {
      console.error(
        "[EngineViewFunctions] Cannot add panel: Dockview API not available.",
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
        dockviewController: context.dockviewController,
      },
    };

    try {
      const newPanel = dockviewApi.addPanel(panelOptions);
      newPanel.api.setActive();
      console.log(
        `[EngineViewFunctions] Added composite engine panel: ${compositeViewId}`,
      );
      return { success: true, panelId: compositeViewId };
    } catch (error) {
      console.error(
        `[EngineViewFunctions] Failed to add engine panel for counter ${counter}:`,
        error,
      );
      enginePanelCounter--; // Decrement counter on failure
      return { success: false, panelId: null };
    }
  },
};
