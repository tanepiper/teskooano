// Re-export everything except the conflicting config types from types.ts
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
    PluginRegistryConfig
} from './types.js';

// Re-export everything from pluginManager
export {
    registerPlugin,
    loadAndRegisterComponents,
    loadAndRegisterPlugins,
    getPlugins,
    getPanelConfig,
    getFunctionConfig,
    getToolbarItemsForTarget
} from './pluginManager.js';

// Re-export the vite plugin and its options type
export { teskooanoUiPlugin } from './vite-plugin.js';
export type { TeskooanoUiPluginOptions } from './vite-plugin.js';

// // Explicitly re-export config types if needed at the top level
// // (This structure avoids the name collision)
// export type {
//     ComponentLoadConfig,
//     PluginLoadConfig,
//     ComponentRegistryConfig,
//     PluginRegistryConfig
// } from './types.js';
