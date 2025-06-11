import type {
  TeskooanoPlugin,
  PluginExecutionContext,
  FunctionConfig,
  ComponentConfig,
} from "@teskooano/ui-plugin";
import { SystemControls } from "./view/system-controls.component";
import { SystemFunctionsManager } from "./services/system-functions.manager";
import { SystemGenerator } from "./services/system-generator.service";

/**
 * Configuration for the SystemControls custom element.
 * This tells the PluginManager how to register the component.
 */
const systemControlsComponent: ComponentConfig = {
  tagName: "teskooano-system-controls",
  componentClass: SystemControls,
};

/**
 * An initializer function that sets up the system controls' backend services.
 * When executed by the PluginManager, this function will:
 * 1. Instantiate the `SystemGenerator` and `SystemFunctionsManager`.
 * 2. Dynamically register a new, in-memory plugin that contains all the
 *    functions from the `SystemFunctionsManager` (e.g., `system:clear`, `system:export`).
 * This pattern ensures that the services are only created when needed and that
 * their dependencies are properly injected.
 */
const initializeSystemControls: FunctionConfig = {
  id: "system-controls:initialize",
  dependencies: {
    dockView: { api: true },
  },
  execute: (context: PluginExecutionContext) => {
    const { pluginManager, dockviewApi } = context;

    // 1. Instantiate services with their required context/dependencies.
    const generator = new SystemGenerator(dockviewApi);
    const functionsManager = new SystemFunctionsManager(context, generator);

    // 2. Register a dynamic, in-memory plugin containing the functions.
    pluginManager.registerPlugin({
      id: "teskooano-system-functions-runtime",
      name: "System Functions (Runtime)",
      description: "Holds all dynamically registered system functions.",
      functions: functionsManager.getFunctions(),
    });
  },
};

/**
 * The main plugin definition for the System Controls feature.
 *
 * This plugin exports two main things:
 * - The `<teskooano-system-controls>` custom element.
 * - An `system-controls:initialize` function.
 *
 * The application's bootstrapper is responsible for executing the initializer,
 * which in turn sets up all the necessary background logic and makes it
 * available to other parts of the application through the `PluginManager`.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-system-controls",
  name: "System Controls",
  description:
    "Provides the system controls component and an initializer for its functions.",
  components: [systemControlsComponent],
  functions: [initializeSystemControls],
};

// Export the component class for potential direct instantiation or type usage.
export { SystemControls };
