import {
  FunctionConfig,
  PluginExecutionContext,
  TeskooanoPlugin,
} from "@teskooano/ui-plugin";
import { EngineViewManager } from "./EngineViewManager";

/**
 * The initializer function for the Engine View manager.
 *
 * This function is executed once by the PluginManager at startup. It creates an
 * instance of the EngineViewManager and then registers a new plugin in-memory
 * that exposes the `view:addCompositeEnginePanel` function to the entire application.
 * This approach avoids global singletons and ensures dependencies are provided
 * explicitly.
 */
const engineViewInitializer: FunctionConfig = {
  id: "engine-view:initialize",
  execute: (context: PluginExecutionContext) => {
    const engineViewManager = new EngineViewManager(context);

    const addCompositeEnginePanelFunction: FunctionConfig = {
      id: "view:addCompositeEnginePanel",
      execute: () => engineViewManager.createPanel(),
    };

    const dynamicPlugin: TeskooanoPlugin = {
      id: "teskooano-engine-view-functions",
      name: "Engine View Functions",
      description:
        "Provides functions for creating and managing engine view panels.",
      functions: [addCompositeEnginePanelFunction],
    };

    context.pluginManager.registerPlugin(dynamicPlugin);

    // Return the manager instance so it can be used by the calling context if needed.
    return engineViewManager;
  },
};

/**
 * The main plugin definition for the Engine View feature.
 *
 * This plugin's sole purpose is to register the initializer function,
 * which sets up the `EngineViewManager` and its associated functions.
 * The actual `<teskooano-engine-view>` component is registered by another plugin.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-engine-view-initializer",
  name: "Engine View Initializer",
  description: "Initializes the manager for engine view panels.",
  functions: [engineViewInitializer],
};
