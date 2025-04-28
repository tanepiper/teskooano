import type {
  TeskooanoPlugin,
  PanelConfig,
  FunctionConfig,
  PluginExecutionContext,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./CompositeEnginePanel";
import { ProgressPanel } from "./ProgressPanel";

import * as SystemActions from "../../components/toolbar/system-controls.actions";
import SparkleIcon from "@fluentui/svg-icons/icons/sparkle_24_regular.svg?raw";
import type { DockviewApi, AddPanelOptions } from "dockview-core";

let enginePanelCounter = 0;

const enginePanelConfig: PanelConfig = {
  componentName: "composite_engine_view",
  panelClass: CompositeEnginePanel,
  defaultTitle: "Engine View",
};

const progressPanelConfig: PanelConfig = {
  componentName: "progress_view",
  panelClass: ProgressPanel,
  defaultTitle: "Processing...",
};

const addCompositeEnginePanelFunction: FunctionConfig = {
  id: "engine:add_composite_panel",
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

      console.log(`[EngineViewPlugin] Added panel '${compositeViewId}'`);
    } catch (error) {
      console.error(
        `[EngineViewPlugin] Failed to add engine panel for counter ${counter}:`,
        error,
      );
      enginePanelCounter--;
    }
  },
};

const generateRandomFunction: FunctionConfig = {
  id: "system:generate_random",
  execute: async (context: PluginExecutionContext) => {
    const { dockviewApi } = context;
    if (!dockviewApi) {
      console.error(
        "[EngineViewPlugin] Cannot generate random: Dockview API not available.",
      );
      return;
    }
    console.log("[EngineViewPlugin] Executing system:generate_random...");
    const result = await SystemActions.generateRandomSystem(dockviewApi);
    console.log("[EngineViewPlugin] generate_random result:", result);
  },
};

const mainToolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar",
  items: [
    {
      id: "main-toolbar-random-system",
      type: "function",
      title: "Generate Random System",
      iconSvg: SparkleIcon,
      functionId: generateRandomFunction.id,
      order: 200,
    },
  ],
};

export const plugin: TeskooanoPlugin = {
  id: "core-engine-view",
  name: "Core Engine View & Actions",
  description:
    "Registers engine view panels (Composite, Progress) and provides core system actions.",
  panels: [enginePanelConfig, progressPanelConfig],
  functions: [addCompositeEnginePanelFunction, generateRandomFunction],
  toolbarRegistrations: [mainToolbarRegistration],
};
