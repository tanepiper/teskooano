# Teskooano UI Plugin System (@teskooano/ui-plugin)

This package provides the core infrastructure for registering and managing UI plugins within the Teskooano application ecosystem through configuration and a dedicated Vite plugin.

## What?

This library, along with its accompanying Vite plugin (`teskooanoUiPlugin`), acts as a central registry for UI elements (Dockview panels, functions, toolbar items) provided by different modules (plugins). It also manages the loading and definition of base web components.

Plugin and component loading is driven by configuration files, analyzed by the Vite plugin at build time to enable efficient dynamic imports.

## Why?

- **Build-Time Integration:** Leverages Vite to correctly resolve paths and handle transpilation for dynamically loaded components and plugins.
- **Configuration-Driven:** Easily enable/disable features via config.
- **Dynamic Loading:** Optimized loading of feature code.
- **Modularity & Extensibility:** Decouples features.
- **Order Guarantee:** Ensures base components are defined before plugins use them.

## How?

1.  **Configure Components:** Create `componentRegistry.ts` mapping tag names to _relative paths_ from the config file location (e.g., `./components/shared/Button.ts`).

    ```typescript
    // Example: apps/teskooano/src/config/componentRegistry.ts
    import type { ComponentRegistryConfig } from "@teskooano/ui-plugin";

    export const componentConfig: ComponentRegistryConfig = {
      "teskooano-button": { path: "../components/shared/Button.ts" }, // Path relative to this file
      "teskooano-card": { path: "../components/shared/Card.ts" },
    };
    ```

2.  **Configure Plugins:** Create `pluginRegistry.ts` mapping plugin IDs to _relative paths_ from the config file location (e.g., `../components/ui-controls/focus/FocusControl.plugin.ts`).

    ```typescript
    // Example: apps/teskooano/src/config/pluginRegistry.ts
    import type { PluginRegistryConfig } from "@teskooano/ui-plugin";

    export const pluginConfig: PluginRegistryConfig = {
      "core-focus-controls": {
        path: "../components/ui-controls/focus/FocusControl.plugin.ts",
      },
    };
    ```

3.  **Configure Vite:** In your application's `vite.config.ts`, import and use the `teskooanoUiPlugin`, providing the _absolute paths_ to your configuration files.

    ```typescript
    // Example: apps/teskooano/vite.config.ts
    import { defineConfig } from "vite";
    import { teskooanoUiPlugin } from "@teskooano/ui-plugin";
    import path from "path";

    export default defineConfig({
      plugins: [
        teskooanoUiPlugin({
          // Use path.resolve to get absolute paths
          componentRegistryPath: path.resolve(
            __dirname,
            "src/config/componentRegistry.ts",
          ),
          pluginRegistryPath: path.resolve(
            __dirname,
            "src/config/pluginRegistry.ts",
          ),
        }),
        // ... other plugins
      ],
      // ... other vite config
    });
    ```

4.  **Vite Plugin Action:** The `teskooanoUiPlugin` reads the configs and generates a virtual module (`virtual:teskooano-loaders`) containing functions that perform Vite-analyzable dynamic imports, e.g.:

    ```typescript
    // virtual:teskooano-loaders (simplified)
    export const componentLoaders = {
      "teskooano-button": () =>
        import("/path/to/app/src/components/shared/Button.ts"),
    };
    export const pluginLoaders = {
      "core-focus-controls": () =>
        import(
          "/path/to/app/src/components/ui-controls/focus/FocusControl.plugin.ts"
        ),
    };
    ```

5.  **Load Components and Plugins (in `main.ts`):**

    - Import `loadAndRegisterComponents`, `loadAndRegisterPlugins`.
    - Import your configuration objects (`componentConfig`, `pluginConfig`).
    - Call `await loadAndRegisterComponents(Object.keys(componentConfig))`.
    - Call `await loadAndRegisterPlugins(Object.keys(pluginConfig))`.
    - These functions now internally use the loaders from `virtual:teskooano-loaders`.

    ```typescript
    // Example: apps/teskooano/src/main.ts
    import {
      loadAndRegisterComponents,
      loadAndRegisterPlugins,
    } from "@teskooano/ui-plugin";
    import { componentConfig } from "./config/componentRegistry";
    import { pluginConfig } from "./config/pluginRegistry";

    async function initializeApp() {
      // ...
      await loadAndRegisterComponents(Object.keys(componentConfig));
      await loadAndRegisterPlugins(Object.keys(pluginConfig));
      // ... Initialize core app ...
    }
    initializeApp();
    ```

6.  **Define a Plugin Module:** Export a `TeskooanoPlugin` object (usually named `plugin`) defining panels, functions, toolbar registrations, etc. (No change from previous step in this file).

7.  **Consume Registered Items:** UI controllers use getter functions (`getToolbarItemsForTarget`, etc.) to dynamically build the UI. (No change here).

## Advanced Usage Examples

The basic setup covers loading components and plugins. Here's how you can define more complex plugins, similar to `apps/teskooano/src/components/engine/EngineView.plugin.ts`:

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
