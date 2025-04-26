import {
  TeskooanoPlugin,
  // ComponentConfig, // No longer needed directly in registerPlugin
  PanelConfig,
  FunctionConfig,
  ToolbarItemConfig,
  ToolbarTarget,
  ToolbarRegistration,
  ToolbarItemDefinition,
} from "./types";

// --- Configuration Interfaces ---

/** Configuration for dynamically loading a component. */
export interface ComponentLoadConfig {
  /** Path to the module exporting the component class (e.g., '@teskooano/design-system/Button'). */
  path: string;
  /** Optional name of the exported class if not default export (useful if module exports multiple things). */
  exportName?: string;
}

/** Configuration for dynamically loading a plugin. */
export interface PluginLoadConfig {
  /** Path to the module exporting the plugin object (e.g., '@teskooano/focus-plugin/plugin'). */
  path: string;
  /** Optional name of the exported plugin object if not exported as 'plugin'. */
  exportName?: string;
}

/** Map of component tag names to their loading configuration. */
export type ComponentRegistryConfig = Record<string, ComponentLoadConfig>;

/** Map of plugin IDs to their loading configuration. */
export type PluginRegistryConfig = Record<string, PluginLoadConfig>;

// --- Registries (remain the same) ---
const pluginRegistry: Map<string, TeskooanoPlugin> = new Map();
// const componentRegistry: Map<string, ComponentConfig> = new Map(); // We don't store ComponentConfig anymore
const panelRegistry: Map<string, PanelConfig> = new Map();
const functionRegistry: Map<string, FunctionConfig> = new Map();
const toolbarRegistry: Map<ToolbarTarget, ToolbarItemConfig[]> = new Map();

// --- Core Registration Functions ---

/**
 * Registers the metadata of a UI plugin (panels, functions, toolbars).
 * Does NOT register custom elements anymore.
 * @param plugin - The plugin object containing metadata.
 */
export function registerPlugin(plugin: TeskooanoPlugin): void {
  if (pluginRegistry.has(plugin.id)) {
    console.warn(
      `[PluginManager] Plugin with ID '${plugin.id}' already registered. Skipping.`,
    );
    return;
  }

  console.log(
    `[PluginManager] Registering plugin metadata: ${plugin.name} (ID: ${plugin.id})`,
  );
  pluginRegistry.set(plugin.id, plugin);

  // Register panels
  plugin.panels?.forEach((panelConfig) => {
    if (panelRegistry.has(panelConfig.componentName)) {
      console.warn(
        `[PluginManager] Panel component name '${panelConfig.componentName}' from plugin '${plugin.id}' already registered. Skipping.`,
      );
      return;
    }
    panelRegistry.set(panelConfig.componentName, panelConfig);
    console.log(`  - Registered panel: ${panelConfig.componentName}`);
  });

  // Register functions
  plugin.functions?.forEach((funcConfig) => {
    if (functionRegistry.has(funcConfig.id)) {
      console.warn(
        `[PluginManager] Function ID '${funcConfig.id}' from plugin '${plugin.id}' already registered. Skipping.`,
      );
      return;
    }
    functionRegistry.set(funcConfig.id, funcConfig);
    console.log(`  - Registered function: ${funcConfig.id}`);
  });

  // Register toolbar items
  plugin.toolbarRegistrations?.forEach((registration: ToolbarRegistration) => {
    const target = registration.target;
    if (!toolbarRegistry.has(target)) {
      toolbarRegistry.set(target, []);
    }
    const targetItems = toolbarRegistry.get(target)!;

    registration.items.forEach((itemDefinition: ToolbarItemDefinition) => {
      const fullItemConfig: ToolbarItemConfig = {
        ...itemDefinition,
        target: target,
      };
      if (targetItems.some((item) => item.id === fullItemConfig.id)) {
        console.warn(
          `[PluginManager] Toolbar item ID '${fullItemConfig.id}' for target '${target}' from plugin '${plugin.id}' already exists. Skipping.`,
        );
        return;
      }
      targetItems.push(fullItemConfig);
      console.log(
        `  - Registered toolbar item '${fullItemConfig.id}' for target '${target}'`,
      );
    });
    targetItems.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  });

  // Initialize function is called after *dynamic* loading in loadAndRegisterPlugins
}

// --- Dynamic Loading and Registration Functions ---

/**
 * Loads and registers custom web components based on configuration.
 * Ensures base components are defined before plugins might need them.
 * @param componentConfig - An object mapping tag names to their load configurations.
 */
export async function loadAndRegisterComponents(
  componentConfig: ComponentRegistryConfig,
): Promise<void> {
  console.log("[PluginManager] Starting component registration...");
  for (const [tagName, config] of Object.entries(componentConfig)) {
    if (customElements.get(tagName)) {
      console.warn(
        `[PluginManager] Custom element '${tagName}' is already defined. Skipping registration.`,
      );
      continue;
    }
    try {
      console.log(
        `  - Dynamically importing component '${tagName}' from ${config.path}`,
      );
      const module = await import(/* @vite-ignore */ config.path);
      const componentClass = config.exportName
        ? module[config.exportName]
        : module.default;

      if (
        typeof componentClass === "function" &&
        componentClass.prototype instanceof HTMLElement
      ) {
        customElements.define(
          tagName,
          componentClass as CustomElementConstructor,
        );
        console.log(`  - Defined component: <${tagName}>`);
      } else {
        console.error(
          `[PluginManager] Failed to define component '${tagName}'. Loaded module export '${config.exportName || "default"}' is not a valid Custom Element constructor.`,
        );
      }
    } catch (error) {
      console.error(
        `[PluginManager] Failed to load or define component '${tagName}' from ${config.path}:`,
        error,
      );
    }
  }
  console.log("[PluginManager] Component registration finished.");
}

/**
 * Loads and registers UI plugins based on configuration.
 * @param pluginConfig - An object mapping plugin IDs to their load configurations.
 */
export async function loadAndRegisterPlugins(
  pluginConfig: PluginRegistryConfig,
): Promise<void> {
  console.log("[PluginManager] Starting plugin registration...");
  for (const [pluginId, config] of Object.entries(pluginConfig)) {
    try {
      console.log(
        `  - Dynamically importing plugin '${pluginId}' from ${config.path}`,
      );
      const module = await import(/* @vite-ignore */ config.path);
      const plugin = (
        config.exportName ? module[config.exportName] : module.plugin
      ) as TeskooanoPlugin;

      if (plugin && typeof plugin === "object" && plugin.id === pluginId) {
        registerPlugin(plugin); // Register the metadata
        // Call initialize *after* successful registration
        if (typeof plugin.initialize === "function") {
          try {
            console.log(
              `  - Initializing plugin: ${plugin.name} (ID: ${pluginId})`,
            );
            plugin.initialize(/* Pass APIs if needed */);
          } catch (initError) {
            console.error(
              `[PluginManager] Error initializing plugin '${pluginId}':`,
              initError,
            );
          }
        }
      } else if (plugin && plugin.id !== pluginId) {
        console.error(
          `[PluginManager] Failed to register plugin '${pluginId}'. Loaded plugin has mismatched ID '${plugin.id}'.`,
        );
      } else {
        console.error(
          `[PluginManager] Failed to register plugin '${pluginId}'. Module export '${config.exportName || "plugin"}' not found or invalid.`,
        );
      }
    } catch (error) {
      console.error(
        `[PluginManager] Failed to load or register plugin '${pluginId}' from ${config.path}:`,
        error,
      );
    }
  }
  console.log("[PluginManager] Plugin registration finished.");
}

// --- Getter functions (remain the same) --- //

/**
 * Retrieves all registered plugins.
 * @returns An array of registered plugin objects.
 */
export function getPlugins(): TeskooanoPlugin[] {
  return Array.from(pluginRegistry.values());
}

/**
 * Retrieves the configuration for a specific panel component.
 * @param componentName - The component name of the panel.
 * @returns The PanelConfig or undefined if not found.
 */
export function getPanelConfig(componentName: string): PanelConfig | undefined {
  return panelRegistry.get(componentName);
}

/**
 * Retrieves the configuration for a specific function.
 * @param id - The ID of the function.
 * @returns The FunctionConfig or undefined if not found.
 */
export function getFunctionConfig(id: string): FunctionConfig | undefined {
  return functionRegistry.get(id);
}

/**
 * Retrieves all registered toolbar items for a specific target, sorted by order.
 * @param target - The target toolbar ('main-toolbar' or 'engine-toolbar').
 * @returns An array of ToolbarItemConfig objects, or an empty array if none found.
 */
export function getToolbarItemsForTarget(
  target: ToolbarTarget,
): ToolbarItemConfig[] {
  return [...(toolbarRegistry.get(target) ?? [])]; // Return a copy
}
