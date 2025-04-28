/**
 * UI Plugin System
 *
 * This package provides a system for registering and loading UI plugins.
 * It includes types, functions, and utilities for managing plugins, components,
 * and toolbar items.
 *
 * Don't export the vite plugin here, it's handled in the vite config.
 */

export type {
  // Core Plugin System Types
  ToolbarTarget,
  ComponentConfig,
  PanelConfig,
  FunctionConfig,
  BaseToolbarItemConfig,
  PanelToolbarItemConfig,
  FunctionToolbarItemConfig,
  ToolbarItemConfig,
  ToolbarItemDefinition,
  ToolbarRegistration,
  TeskooanoPlugin,
  // Config types
  ComponentLoadConfig,
  PluginLoadConfig,
  ComponentRegistryConfig,
  PluginRegistryConfig,
  PluginExecutionContext,
} from "./types.js";

// Export Client-Side Manager Functions
export {
  registerPlugin,
  loadAndRegisterComponents,
  loadAndRegisterPlugins,
  setAppDependencies,
  getPlugins,
  getPanelConfig,
  getFunctionConfig,
  getToolbarItemsForTarget,
  getLoadedModuleClass,
} from "./pluginManager.js";
