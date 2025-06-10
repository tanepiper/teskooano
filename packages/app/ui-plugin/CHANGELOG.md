# Changelog - @teskooano/ui-plugin

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Plugin HMR & Unloading:** Implemented Hot Module Replacement for plugins. The `PluginManager` can now unload and reload plugins dynamically.
  - Added `pluginManager.unloadPlugin(pluginId)` and `pluginManager.reloadPlugin(pluginId)`.
  - Added `handleHotUpdate` to the Vite plugin to send reload events to the client.
- **Plugin Lifecycle:** Plugins can now define an optional `dispose(): void | Promise<void>` method, which is called automatically when the plugin is unloaded or reloaded.

### Changed

- `pluginManager` now tracks which plugin registered each panel, function, and toolbar item to enable proper cleanup on unload.
- `pluginManager` now warns instead of throwing an error if a plugin tries to register a custom element with a tag name that is already defined, improving HMR experience for components.
- The `loadAndRegisterPlugins` method is now more robust, with improved dependency resolution and circular dependency detection.

## [0.2.0] - 2025-05-01

### Changed

- **Refactored `pluginManager` to a singleton class.**
- Introduced RxJS `Subject` for observing plugin registration status.
- Updated exports and types accordingly.
- Added Vite plugin helper (`vite-plugin.ts`).
- Updated dependencies.

## [0.1.0] - 2025-04-24

### Added

- Initial functional implementation of plugin manager.
