# Changelog

## 0.1.0 (YYYY-MM-DD) - Unreleased

- Initial release of the UI Plugin system.
- Implemented configuration-based dynamic loading for components and plugins.
- Added `loadAndRegisterComponents` for dynamically defining custom elements.
- Added `loadAndRegisterPlugins` for dynamically loading plugin modules, registering metadata, and running initialization.
- Added `registerPlugin` (internal helper) to store plugin metadata (panels, functions, toolbars).
- Added getter functions: `getPlugins`, `getPanelConfig`, `getFunctionConfig`, `getToolbarItemsForTarget`.
- Defined core types: `TeskooanoPlugin`, `PanelConfig`, `FunctionConfig`, `ToolbarItemConfig`, `ToolbarTarget`, `ToolbarRegistration`, `ToolbarItemDefinition`.
- Defined configuration/loading types: `ComponentLoadConfig`, `PluginLoadConfig`, `ComponentRegistryConfig`, `PluginRegistryConfig`.
- Added initial `README.md`, `package.json`, `tsconfig.json`, `moon.yml`.

## 0.2.0 (YYYY-MM-DD) - Unreleased

- **Refactor:** Overhauled plugin and component loading mechanism.
  - Removed separate `componentRegistry.ts` and `pluginRegistry.ts` config files.
  - Integrated configuration directly into the Vite plugin (`teskooanoUiPlugin`).
  - Vite plugin now generates `componentRegistryConfig` alongside `componentLoaders` and `pluginLoaders` in the virtual module.
  - `loadAndRegisterComponents` now reads `isCustomElement` flag from `componentRegistryConfig` to differentiate between custom elements and standard classes.
  - Added `getLoadedModuleClass` to retrieve non-custom-element classes loaded via `loadAndRegisterComponents`.
- **Refactor:** Introduced explicit dependency injection for core application services.
  - Added `setAppDependencies({ dockviewApi, dockviewController })` to provide dependencies required by plugins.
  - Removed dependency injection from plugin `initialize` methods. `initialize` is now only for plugin-specific setup.
  - `getFunctionConfig` now returns a wrapped `execute` function that automatically injects the `PluginExecutionContext` (containing `dockviewApi` and `dockviewController`) when called.
- **Feat:** Added support for Toolbar Widgets (`ToolbarWidgetConfig`, `getToolbarWidgetsForTarget`).
- **Fix:** Updated `registerPlugin` to handle sorting of toolbar items by `order`.
- **Docs:** Updated `ARCHITECTURE.md` to reflect new loading flow and dependency management.
