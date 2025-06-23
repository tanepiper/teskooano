import { createInterfacePlugin } from "@teskooano/ui-plugin";
import type {
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import { EngineToolbarManager } from "./EngineToolbarManager";

export * from "./EngineToolbar";
export * from "./EngineToolbarManager";

const initializeEngineToolbar: FunctionConfig = {
  id: "engine-toolbar:initialize",
  execute: async (
    context: PluginExecutionContext,
  ): Promise<EngineToolbarManager> => {
    return new EngineToolbarManager(context);
  },
};

export const plugin = createInterfacePlugin({
  id: "teskooano-engine-toolbar",
  name: "Teskooano Engine Toolbar",
  description: "Provides the manager service for engine overlay toolbars.",
  functions: [initializeEngineToolbar],
});
