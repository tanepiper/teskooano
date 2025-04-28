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
