# Teskooano UI Plugin System (@teskooano/ui-plugin)

This package provides the core infrastructure for registering and managing UI plugins within the Teskooano application ecosystem through dynamic loading based on configuration.

## What?

This library acts as a central registry for UI elements provided by different modules (plugins). It allows features like Dockview panels, custom web components, toolbar buttons, and standalone functions to be defined externally. These components and plugins are loaded dynamically based on configuration files, promoting a modular and maintainable architecture.

## Why?

- **Configuration-Driven:** Easily enable, disable, or swap features by modifying configuration, not code.
- **Dynamic Loading:** Load only the necessary code for enabled features, potentially improving initial load times.
- **Modularity:** Decouples UI features from the core application.
- **Extensibility:** Add new UI features without modifying the core application code.
- **Consistency:** Provides a standardized way to define and register UI components and their interactions.

## How?

1.  **Configure Components:** Create a configuration object (`ComponentRegistryConfig`) mapping component tag names to their module paths (and optional export names).

    ```typescript
    // Example: src/config/componentRegistry.ts
    import type { ComponentRegistryConfig } from "@teskooano/ui-plugin";

    export const componentConfig: ComponentRegistryConfig = {
      "teskooano-button": { path: "@teskooano/design-system/Button" },
      "teskooano-card": { path: "@teskooano/design-system/Card" },
      // ... other base components
    };
    ```

2.  **Configure Plugins:** Create a configuration object (`PluginRegistryConfig`) mapping plugin IDs to their module paths (and optional export names for the plugin object, defaults to `plugin`).

    ```typescript
    // Example: src/config/pluginRegistry.ts
    import type { PluginRegistryConfig } from "@teskooano/ui-plugin";

    export const pluginConfig: PluginRegistryConfig = {
      "core-focus-controls": { path: "@teskooano/focus-plugin/plugin" },
      "feature-ship-editor": {
        path: "@teskooano/ship-editor/pluginDefinition",
        exportName: "shipEditorPlugin",
      },
      // ... other plugins
    };
    ```

3.  **Load Components and Plugins (in `main.ts`):**

    - Import `loadAndRegisterComponents` and `loadAndRegisterPlugins`.
    - Import your configuration objects.
    - Call `await loadAndRegisterComponents(componentConfig)` **first** to define base elements.
    - Call `await loadAndRegisterPlugins(pluginConfig)` to load plugins, register their metadata, and run their `initialize` functions.

    ```typescript
    // Example: apps/teskooano/src/main.ts
    import {
      loadAndRegisterComponents,
      loadAndRegisterPlugins,
    } from "@teskooano/ui-plugin";
    import { componentConfig } from "./config/componentRegistry";
    import { pluginConfig } from "./config/pluginRegistry";

    async function initializeApp() {
      console.log("Initializing Teskooano...");

      // 1. Load and register base web components
      await loadAndRegisterComponents(componentConfig);

      // 2. Load and register plugins (which might use those components)
      await loadAndRegisterPlugins(pluginConfig);

      // 3. Initialize core application logic (Dockview, routing, etc.)
      // ... now safe to use registered panels, functions, etc.
      console.log("Teskooano Initialized.");
    }

    initializeApp();
    ```

4.  **Define a Plugin Module:** Create the plugin module exporting a `TeskooanoPlugin` object (usually named `plugin`).

    - This object defines panels, functions, and toolbar registrations.
    - It _does not_ define components (handled by `loadAndRegisterComponents`).
    - It can have an optional `initialize` function.

    ```typescript
    // Example: packages/features/focus-controls/src/plugin.ts
    import { FocusControlPanel } from "./FocusControlPanel";
    import {
      TeskooanoPlugin,
      PanelConfig,
      ToolbarRegistration,
    } from "@teskooano/ui-plugin";
    import TargetIcon from "./target_24_regular.svg?raw";

    const panelConfig: PanelConfig = {
      componentName: "focus-control",
      panelClass: FocusControlPanel,
      defaultTitle: "Focus Control",
    };

    const toolbarRegistration: ToolbarRegistration = {
      target: "engine-toolbar",
      items: [
        {
          id: "focus-control-button",
          type: "panel",
          title: "Focus Control",
          iconSvg: TargetIcon,
          componentName: "focus-control",
          behaviour: "toggle",
          initialPosition: { top: 150, left: 50, width: 400, height: 650 },
          order: 10,
        },
      ],
    };

    export const plugin: TeskooanoPlugin = {
      id: "core-focus-controls", // Must match the key in pluginConfig
      name: "Core Focus Controls",
      panels: [panelConfig],
      toolbarRegistrations: [toolbarRegistration],
      // No 'components' array needed here
      initialize: () => {
        console.log("Focus Controls Plugin Initialized");
        // Setup listeners or other logic if needed
      },
    };
    ```

5.  **Consume Registered Items:** UI controllers (like `ToolbarController` or `EngineToolbar`) use getter functions (`getToolbarItemsForTarget`, `getPanelConfig`, etc.) to retrieve registered configurations and dynamically build the UI.

## Usage Example (Conceptual)

```typescript
// --- In a plugin module (e.g., packages/features/my-feature/src/plugin.ts) ---
import { MyComponent } from "./MyComponent";
import { MyPanel } from "./MyPanel";
import { TeskooanoPlugin, ToolbarRegistration } from "@teskooano/ui-plugin"; // Import ToolbarRegistration
import MyIcon from "./icon.svg?raw";
import AnotherIcon from "./another-icon.svg?raw";

export const myFeaturePlugin: TeskooanoPlugin = {
  id: "my-feature",
  name: "My Awesome Feature",
  components: [{ tagName: "my-component", componentClass: MyComponent }],
  panels: [
    {
      componentName: "my-panel",
      panelClass: MyPanel,
      defaultTitle: "My Panel",
    },
  ],
  toolbarRegistrations: [
    {
      target: "main-toolbar", // Target the main application toolbar
      items: [
        {
          id: "my-feature-main-button",
          type: "panel",
          title: "Open My Feature Panel",
          iconSvg: MyIcon,
          componentName: "my-panel",
          order: 100,
        },
      ],
    },
    {
      target: "engine-toolbar", // Target the engine-specific toolbar
      items: [
        {
          id: "my-feature-engine-button",
          type: "function", // Example of a function button
          title: "Do Something Feature-Specific",
          iconSvg: AnotherIcon,
          functionId: "my-feature-action", // Assumes a FunctionConfig with this ID is also registered
          order: 50,
        },
      ],
    },
  ],
};

// --- In the main application (e.g., apps/teskooano/src/main.ts) ---
import { registerPlugin } from "@teskooano/ui-plugin";
import { myFeaturePlugin } from "@teskooano/feature-my-feature"; // Assuming path alias

// Register plugins during app initialization
registerPlugin(myFeaturePlugin);

// ... later, in a Toolbar controller ...
// import { getToolbarItemsForTarget } from '@teskooano/ui-plugin';
// const mainToolbarItems = getToolbarItemsForTarget('main-toolbar');
// const engineToolbarItems = getToolbarItemsForTarget('engine-toolbar');
// // Dynamically create buttons based on these items for the respective toolbars
```
