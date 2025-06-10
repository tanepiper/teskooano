import type {
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import type { AddPanelOptions } from "dockview-core";
import { EngineToolbarManager } from "../../../../core/interface/engine-toolbar";

let enginePanelCounter = 0;

export const addCompositeEnginePanelFunction: FunctionConfig = {
  id: "view:addCompositeEnginePanel",
  dependencies: {
    dockView: {
      api: true,
      controller: true,
    },
  },
  execute: async (context: PluginExecutionContext) => {
    const { dockviewApi, pluginManager } = context;
    if (!dockviewApi) {
      console.error(
        "[EngineViewFunctions] Cannot add panel: Dockview API not available.",
      );
      return;
    }

    const engineToolbarManager =
      await pluginManager.execute<EngineToolbarManager>(
        "engine-toolbar:initialize",
      );

    if (!engineToolbarManager) {
      console.error(
        "[EngineViewFunctions] Cannot add panel: EngineToolbarManager could not be initialized.",
      );
      return;
    }

    enginePanelCounter++;
    const counter = enginePanelCounter;
    const compositeViewId = `composite_engine_view_${counter}`;
    const compositeViewTitle = `Teskooano ${counter}`;

    const panelOptions: AddPanelOptions = {
      id: compositeViewId,
      component: "teskooano-engine-view",
      title: compositeViewTitle,
      params: {
        title: compositeViewTitle,
        dockviewController: context.dockviewController,
        engineToolbarManager,
      },
    };

    try {
      const newPanel = dockviewApi.addPanel(panelOptions);
      newPanel.api.setActive();

      return { success: true, panelId: compositeViewId };
    } catch (error) {
      console.error(
        `[EngineViewFunctions] Failed to add engine panel for counter ${counter}:`,
        error,
      );
      enginePanelCounter--;
      return { success: false, panelId: null };
    }
  },
};
