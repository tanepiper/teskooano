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
  PluginFunctionCallerSignature,
  ToolbarWidgetConfig,
} from "./types.js";

// Export the singleton instance of the PluginManager
export { pluginManager } from "./pluginManager.js";
