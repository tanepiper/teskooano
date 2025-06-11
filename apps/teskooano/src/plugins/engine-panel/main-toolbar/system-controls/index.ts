import type {
  TeskooanoPlugin,
  PluginExecutionContext,
  FunctionConfig,
  ComponentConfig,
} from "@teskooano/ui-plugin";
import { SystemControls } from "./SystemControls";
import { SystemFunctionsManager } from "./system-functions";
import { SystemGenerator } from "./system-generator";

const systemControlsComponent: ComponentConfig = {
  tagName: "teskooano-system-controls",
  componentClass: SystemControls,
};

const initializeSystemControls: FunctionConfig = {
  id: "system-controls:initialize",
  dependencies: {
    dockView: { api: true },
  },
  execute: (context: PluginExecutionContext) => {
    const { pluginManager, dockviewApi } = context;

    // 1. Instantiate managers with context
    const generator = new SystemGenerator(dockviewApi);
    const functionsManager = new SystemFunctionsManager(context, generator);

    // 2. Register a dynamic, in-memory plugin containing the functions
    pluginManager.registerPlugin({
      id: "teskooano-system-functions-runtime",
      name: "System Functions (Runtime)",
      description: "Holds all dynamically registered system functions.",
      functions: functionsManager.getFunctions(),
    });
  },
};

/**
 * Plugin definition for the System Controls.
 * It provides the SystemControls custom element and a single 'initialize' function.
 * The initializer is responsible for dynamically registering all associated system functions.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-system-controls",
  name: "System Controls",
  description:
    "Provides the system controls component and an initializer for its functions.",
  components: [systemControlsComponent],
  functions: [initializeSystemControls],
};

export { SystemControls };
