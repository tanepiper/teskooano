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
export { pluginManager } from "./pluginManager.js";
