/**
 * UI Plugin System
 *
 * This package provides a system for registering and loading UI plugins.
 * It includes types, functions, and utilities for managing plugins, components,
 * and toolbar items.
 *
 * Don't export the vite plugin here, it's handled in the vite config.
 */

export * from "./types.js";
export * from "./pluginManager.js";

// Export Client-Side Manager Functions
export {
  registerPlugin,
  loadAndRegisterPlugins,
  setAppDependencies,
  getPlugins,
  getPanelConfig,
  getFunctionConfig,
  getToolbarItemsForTarget,
  getLoadedModuleClass,
  getToolbarWidgetsForTarget,
  getManagerInstance,
} from "./pluginManager.js";

// Explicitly re-export execute if needed, though wildcard should cover it
// export { execute } from "./pluginManager.js";
