// Only re-export types and CLIENT-SIDE manager functions

// Export Types
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

// Export Client-Side Manager Functions
export {
    registerPlugin,
    loadAndRegisterComponents,
    loadAndRegisterPlugins,
    getPlugins,
    getPanelConfig,
    getFunctionConfig,
    getToolbarItemsForTarget
} from './pluginManager.js';
