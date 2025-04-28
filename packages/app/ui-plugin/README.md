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
