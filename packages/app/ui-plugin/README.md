# Teskooano UI Plugin System (@teskooano/ui-plugin)

This package provides the core infrastructure for registering and managing UI plugins within the Teskooano application ecosystem through configuration and a dedicated Vite plugin.

## What?

This library, along with its accompanying Vite plugin (`teskooanoUiPlugin`), acts as a central registry for UI elements (Dockview panels, functions, toolbar items) provided by different modules (plugins). It also manages the dynamic loading of plugin modules and initialization of managers and custom elements defined within those plugins.

Plugin loading is driven by configuration files, analyzed by the Vite plugin at build time to enable efficient dynamic imports. The `PluginManager` is implemented as a singleton class.

## Why?

- **Build-Time Integration:** Leverages Vite to correctly resolve paths and handle transpilation for dynamically loaded plugin modules.
- **Configuration-Driven:** Easily enable/disable features by modifying Vite plugin configuration.
- **Dynamic Loading:** Optimized loading of feature code.
- **Modularity & Extensibility:** Decouples features.
- **Singleton Management:** Ensures a single source of truth for plugin state.
- **Asynchronous Status:** Provides an RxJS Observable (`pluginStatus$`) to track plugin loading and registration progress.

## How?

1.  **Configure Plugins:** Create one or more `pluginRegistry.ts` files. Each file exports a `pluginConfig` object mapping plugin IDs to _relative paths_ from the config file location (e.g., `../components/ui-controls/focus/FocusControl.plugin.ts`).

    ```typescript
    // Example: apps/teskooano/src/config/pluginRegistry.ts
    import type { PluginRegistryConfig } from "@teskooano/ui-plugin";

    export const pluginConfig: PluginRegistryConfig = {
      "core-focus-controls": {
        path: "../components/ui-controls/focus/FocusControl.plugin.ts", // Path relative to this file
      },
      // ... other plugins
    };
    ```

2.  **Configure Vite:** In your application's `vite.config.ts`, import and use the `teskooanoUiPlugin`, providing an array of _absolute paths_ to your plugin registry configuration files in the `pluginRegistryPaths` option.

    ```typescript
    // Example: apps/teskooano/vite.config.ts
    import { defineConfig } from "vite";
    import { teskooanoUiPlugin } from "@teskooano/ui-plugin";
    import path from "path";

    export default defineConfig({
      plugins: [
        teskooanoUiPlugin({
          // Use path.resolve to get absolute paths
          pluginRegistryPaths: [
            path.resolve(__dirname, "src/config/corePlugins.ts"), // Example with multiple files
            path.resolve(__dirname, "src/config/featurePlugins.ts"),
          ],
        }),
        // ... other plugins
      ],
      // ... other vite config
    });
    ```

3.  **Vite Plugin Action:** The `teskooanoUiPlugin` reads the specified config files and generates a virtual module (`virtual:teskooano-loaders`) containing `pluginLoaders`, an object mapping plugin IDs to functions that perform Vite-analyzable dynamic imports, e.g.:

    ```typescript
    // virtual:teskooano-loaders (simplified)
    export const pluginLoaders = {
      "core-focus-controls": () =>
        import(
          "/path/to/app/src/components/ui-controls/focus/FocusControl.plugin.ts"
        ),
      // ... other plugin loaders
    };
    ```

4.  **Initialize Plugin Manager (in `main.ts`):**

    - Get the singleton instance: `const pluginManager = PluginManager.getInstance();`
    - **Set Dependencies:** Call `pluginManager.setAppDependencies({ dockviewApi, dockviewController });` **ONCE** early in initialization.
    - **Load Plugins:** Call `await pluginManager.loadAndRegisterPlugins(pluginIdsToLoad);` where `pluginIdsToLoad` is an array of the plugin IDs you want to activate (e.g., derived from feature flags or the keys of your config objects).
    - **(Optional) Subscribe to Status:** Observe the loading process: `pluginManager.pluginStatus$.subscribe(status => console.log('Plugin Status:', status));`

    ```typescript
    // Example: apps/teskooano/src/main.ts
    import { PluginManager } from "@teskooano/ui-plugin";
    // Assume dockviewApi and dockviewController are initialized elsewhere
    // Assume pluginIdsToLoad is an array like ['core-focus-controls', 'feature-x']

    async function initializeApp() {
      const pluginManager = PluginManager.getInstance();

      // Optional: Log status updates
      pluginManager.pluginStatus$.subscribe((status) => {
        console.log(
          `Plugin ${status.pluginId}: ${status.status}`,
          status.message || "",
        );
        if (status.error) {
          console.error(status.error);
        }
      });

      // Provide core dependencies needed by plugins
      pluginManager.setAppDependencies({ dockviewApi, dockviewController });

      // Load the desired plugins
      await pluginManager.loadAndRegisterPlugins(pluginIdsToLoad);

      // ... Initialize core app UI that might use plugin getters ...
      // Example: Initialize ToolbarController which calls getToolbarItemsForTarget etc.
    }
    initializeApp();
    ```

5.  **Define a Plugin Module:** Export a `TeskooanoPlugin` object (usually named `plugin`) defining panels, functions, toolbar registrations, manager classes, and components. The `PluginManager` will automatically instantiate managers and define custom elements provided here during the `loadAndRegisterPlugins` call.

    ```typescript
    // Example: packages/my-feature/src/MyFeature.plugin.ts
    import type {
      TeskooanoPlugin,
      PanelConfig,
      FunctionConfig,
      ToolbarRegistration,
      ManagerConfig,
      ComponentConfig,
      PluginExecutionContext,
    } from "@teskooano/ui-plugin";
    import { MyPanelElement } from "./MyPanelElement"; // A custom element
    import { MyUtilityManager } from "./MyUtilityManager"; // A manager class
    import { MyButtonComponent } from "./MyButtonComponent"; // Another custom element

    const myPanel: PanelConfig = {
      componentName: "my-feature-panel",
      panelClass: MyPanelElement,
      defaultTitle: "My Feature",
    };

    const myManager: ManagerConfig = {
      id: "my-feature-manager",
      managerClass: MyUtilityManager,
    };

    const myComponent: ComponentConfig = {
      tagName: "my-feature-button",
      componentClass: MyButtonComponent,
    };

    const myAction: FunctionConfig = {
      id: "my-feature:action",
      execute: async (context: PluginExecutionContext) => {
        /* ... */
      },
    };

    const myToolbar: ToolbarRegistration = {
      target: "main-toolbar",
      items: [
        {
          id: "my-feature-btn",
          type: "function",
          functionId: "my-feature:action",
          title: "Do Action",
          order: 10,
        },
      ],
    };

    export const plugin: TeskooanoPlugin = {
      id: "my-feature",
      name: "My Feature",
      panels: [myPanel],
      functions: [myAction],
      managerClasses: [myManager],
      components: [myComponent],
      toolbarRegistrations: [myToolbar],
      // Optional initialize function for plugin-specific setup (runs after registration)
      initialize: () => {
        console.log("My Feature plugin initialized");
      },
      // Optional dispose function for cleanup (runs before unload/reload)
      dispose: () => {
        console.log("My Feature plugin is being unloaded");
        // e.g., remove event listeners created in initialize()
      },
    };
    ```

6.  **Consume Registered Items:** UI controllers (like `ToolbarController`, `DockviewController`) use getter functions on the `pluginManager` instance (`getToolbarItemsForTarget`, `getPanelConfig`, `getManagerInstance`, etc.) to dynamically build the UI based on what plugins were loaded.

## Hot Module Replacement (HMR) and Lifecycle

The plugin system now supports Hot Module Replacement during development. When a plugin's source file is changed, the Vite plugin will notify the `PluginManager` to automatically unload the old version and load the new one.

### The `dispose` Method

To support this, a plugin can now export an optional `dispose` function. This function is called just before the plugin is unloaded, giving it a chance to clean up any resources it allocated. This is the ideal place to remove event listeners, close connections, or dispose of complex objects that were set up in the `initialize` function.

```typescript
export const plugin: TeskooanoPlugin = {
  id: 'my-resource-intensive-plugin',
  name: 'My Plugin',
  initialize: () => {
    // Setup listeners or intervals
    window.addEventListener('resize', handleResize);
    const intervalId = setInterval(doSomething, 1000);
    // Store intervalId to clear it later
  },
  dispose: () => {
    // Clean up what was done in initialize
    window.removeEventListener('resize', handleResize);
    clearInterval(intervalId); // Assuming intervalId was stored
    console.log('Plugin cleaned up successfully.');
  }
};
```

### HMR Limitations: Custom Elements

Due to limitations in the browser's Custom Elements API, it is **not possible to un-register a custom element tag name**.

When a plugin that defines custom elements (including panel components that are custom elements) is reloaded via HMR, the `PluginManager` will **not** attempt to redefine the tag. It will log a warning, and the **old component implementation will remain active**.

To see changes in a custom element's definition, **a full page reload is required**. Logic within the component's methods, however, can often be hot-reloaded without a full page refresh.

## Advanced Usage Examples

(Content below this point remains largely the same as it describes the _plugin definition format_, which hasn't changed significantly, but update references to use `pluginManager` instance where applicable)

### Defining Multiple Panels and Functions

A single plugin module can register multiple panels and functions:

```typescript
// Example: packages/my-feature/src/MyFeature.plugin.ts
import type {
  TeskooanoPlugin,
  PanelConfig,
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import { MyPanelOne } from "./MyPanelOne";
import { MyPanelTwo } from "./MyPanelTwo";
import MyIcon from "./my-icon.svg?raw"; // Assuming SVG loader

const panelOneConfig: PanelConfig = {
  componentName: "my_panel_one",
  panelClass: MyPanelOne,
  defaultTitle: "Panel One",
};

const panelTwoConfig: PanelConfig = {
  componentName: "my_panel_two",
  panelClass: MyPanelTwo,
  defaultTitle: "Panel Two",
};

const coolActionFunction: FunctionConfig = {
  id: "myfeature:cool_action",
  execute: async (
    context: PluginExecutionContext,
    options?: { intensity?: number },
  ) => {
    // Access Dockview or other context if needed
    const { dockviewApi } = context;
    console.log(
      "Executing cool action with intensity:",
      options?.intensity ?? 1,
    );
    // ... do something ...
    return { success: true, symbol: "🚀", message: "Cool action done!" };
  },
};

const anotherActionFunction: FunctionConfig = {
  id: "myfeature:another_action",
  execute: async (context: PluginExecutionContext) => {
    // ... do something else ...
    return {
      success: true,
      symbol: "✅",
      message: "Another action succeeded.",
    };
  },
};

export const plugin: TeskooanoPlugin = {
  id: "my-feature",
  name: "My Feature Set",
  description: "Provides multiple panels and actions.",
  panels: [panelOneConfig, panelTwoConfig], // Register multiple panels
  functions: [coolActionFunction, anotherActionFunction], // Register multiple functions
  // Toolbar registrations can also be added here (see below)
};
```

### Registering Toolbar Widgets

Toolbar widgets are custom web components placed in specific toolbar areas.

1.  **Define the Widget Config:** In your plugin file, define a `ToolbarWidgetConfig`.

    ```typescript
    // In MyFeature.plugin.ts (continued from above)
    import type { ToolbarWidgetConfig } from "@teskooano/ui-plugin";

    const myToolbarWidget: ToolbarWidgetConfig = {
      id: "my-feature-toolbar-widget", // Unique ID for this widget instance
      target: "main-toolbar", // Target toolbar area ID
      componentName: "teskooano-my-widget-component", // Tag name of the web component
      order: 50, // Controls rendering order within the target
    };

    // Add it to the plugin export:
    export const plugin: TeskooanoPlugin = {
      // ... other properties ...
      panels: [panelOneConfig, panelTwoConfig],
      functions: [coolActionFunction, anotherActionFunction],
      toolbarWidgets: [myToolbarWidget], // Add widget config
    };
    ```

2.  **Register the Component:** Ensure the web component (`teskooano-my-widget-component` in this example) is registered via your `componentRegistry.ts` and loaded like any other component.

### Registering Toolbar Buttons (Function Triggers)

You can add buttons to toolbars that directly trigger one of your plugin's registered functions.

1.  **Define the Toolbar Registration:** In your plugin file, define a `ToolbarRegistration` containing items of type `function`.

    ```typescript
    // In MyFeature.plugin.ts (continued from above)
    import type { ToolbarRegistration } from "@teskooano/ui-plugin";
    import ActionIcon from "./action-icon.svg?raw"; // Example icon

    const myToolbarActions: ToolbarRegistration = {
      target: "main-toolbar", // Target toolbar area ID
      items: [
        {
          id: "my-feature-toolbar-cool-action", // Unique ID for the button
          type: "function", // This button calls a function
          title: "Do Cool Action", // Button text/label
          iconSvg: ActionIcon, // SVG content for the icon
          functionId: coolActionFunction.id, // ID of the function to execute
          order: 100, // Controls order within the target
          tooltipText: "Executes the cool action.", // Tooltip details
          tooltipTitle: "Cool Action Trigger", // Tooltip title
          tooltipIconSvg: ActionIcon, // Optional icon for tooltip
        },
        // ... add more function buttons if needed ...
      ],
    };

    // Add it to the plugin export:
    export const plugin: TeskooanoPlugin = {
      // ... other properties ...
      panels: [panelOneConfig, panelTwoConfig],
      functions: [coolActionFunction, anotherActionFunction],
      toolbarWidgets: [myToolbarWidget],
      toolbarRegistrations: [myToolbarActions], // Add toolbar registration
    };
    ```

### Plugin Execution Context (`PluginExecutionContext`)

When a registered function is executed (e.g., via a toolbar button or programmatically), it receives a `PluginExecutionContext` object. This provides access to shared application resources:

```typescript
interface PluginExecutionContext {
  dockviewApi?: DockviewApi; // Optional API for Dockview layout management
  dockviewController?: DockviewController; // Optional controller for Dockview
  // ... potentially other context items ...
}
```

Your function implementation can use these properties, like `dockviewApi`, to interact with the main application UI. Remember to handle cases where context properties might be `undefined`.

### Getting Manager Instances

If a plugin registers a manager class via the `managerClasses` array, other parts of the application can retrieve the singleton instance created by the `PluginManager`:

```typescript
import { PluginManager } from "@teskooano/ui-plugin";
import type { MyUtilityManager } from "./MyUtilityManager"; // Import the type

// Get the manager instance
const pluginManager = PluginManager.getInstance();
const myManager =
  pluginManager.getManagerInstance<MyUtilityManager>("my-feature-manager");

if (myManager) {
  myManager.doSomethingUseful();
}
```
