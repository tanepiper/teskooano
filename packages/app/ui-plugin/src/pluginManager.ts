import type {
  TeskooanoPlugin,
  // ComponentConfig, // No longer needed directly in registerPlugin
  PanelConfig,
  FunctionConfig,
  ToolbarItemConfig,
  ToolbarTarget,
  ToolbarRegistration,
  ToolbarItemDefinition,
  ComponentRegistryConfig,
  PluginRegistryConfig,
} from "./types.js";

// --- Import the generated loaders AND config from the virtual module --- //
import {
  componentLoaders,
  pluginLoaders,
  componentRegistryConfig, // Import the config object
} from "virtual:teskooano-loaders";

// Cast the imported config to the correct type
const loadedComponentConfig =
  componentRegistryConfig as ComponentRegistryConfig;
/** Stores registered plugin definitions, keyed by plugin ID. */
const pluginRegistry: Map<string, TeskooanoPlugin> = new Map();
// const componentRegistry: Map<string, ComponentConfig> = new Map(); // We don't store ComponentConfig anymore
/** Stores registered panel configurations, keyed by component name. */
const panelRegistry: Map<string, PanelConfig> = new Map();
/** Stores registered function configurations, keyed by function ID. */
const functionRegistry: Map<string, FunctionConfig> = new Map();
/** Stores registered toolbar item configurations, keyed by target toolbar ID. */
const toolbarRegistry: Map<ToolbarTarget, ToolbarItemConfig[]> = new Map();
/** Stores loaded module classes for non-custom-elements, keyed by registry key. */
const loadedModuleClasses: Map<string, any> = new Map();

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
    });
    targetItems.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  });
}

/**
 * Loads and registers custom web components or just loads modules
 * based on the configuration provided via the Vite plugin.
 * @param componentTags - An array of component tag/keys to load from the registry.
 */
export async function loadAndRegisterComponents(
  componentTags: string[],
): Promise<void> {
  console.log(
    "[PluginManager] Starting component/module loading via Vite loaders...",
  );
  const loaders = componentLoaders as Record<string, () => Promise<any>>;

  for (const tagName of componentTags) {
    const config = loadedComponentConfig[tagName];
    if (!config) {
      console.error(
        `[PluginManager] No configuration found for key '${tagName}' in the registry.`,
      );
      continue;
    }
    const className = config.className;
    const isCustomElement = config.isCustomElement !== false;

    if (isCustomElement && customElements.get(tagName)) {
      console.warn(
        `[PluginManager] Custom element '${tagName}' is already defined. Skipping.`,
      );
      continue;
    }
    // ---> Check if non-custom-element class is already loaded
    if (!isCustomElement && loadedModuleClasses.has(tagName)) {
      console.log(
        `[PluginManager] Module class for '${tagName}' already loaded. Skipping.`,
      );
      continue;
    }

    const loader = loaders[tagName];
    if (!loader) {
      console.error(`[PluginManager] No loader found for tag '${tagName}'.`);
      continue;
    }

    try {
      console.log(
        `  - Calling loader for ${isCustomElement ? "component" : "module"} '${tagName}' (Class: ${className})...`,
      );
      const module = await loader();
      const loadedClass = module[className];

      if (typeof loadedClass !== "function") {
        console.error(
          `[PluginManager] Failed to load '${tagName}'. Class '${className}' not found or not a function.`,
        );
        continue;
      }

      if (isCustomElement) {
        if (loadedClass.prototype instanceof HTMLElement) {
          customElements.define(
            tagName,
            loadedClass as CustomElementConstructor,
          );
          console.log(`  - Defined custom element: <${tagName}>`);
        } else {
          console.error(
            `[PluginManager] Failed to define '${tagName}'. Class '${className}' is not a valid Custom Element constructor.`,
          );
        }
      } else {
        // ---> Store the loaded class for non-custom-elements
        loadedModuleClasses.set(tagName, loadedClass);
        console.log(
          `  - Loaded and stored class '${className}' for key '${tagName}'.`,
        );
      }
    } catch (error) {
      console.error(
        `[PluginManager] Failed to load ${isCustomElement ? "component" : "module"} '${tagName}':`,
        error,
      );
    }
  }
  console.log("[PluginManager] Component/module loading finished.");
}

/**
 * Loads and registers UI plugins using loaders from the Vite plugin.
 * @param pluginIds - An array of plugin IDs to load (must exist in the config used by the Vite plugin).
 */
export async function loadAndRegisterPlugins(
  pluginIds: string[],
  passedArguments?: any,
): Promise<void> {
  console.log(
    "[PluginManager] Starting plugin registration via Vite loaders...",
  );
  const loaders = pluginLoaders as Record<string, () => Promise<any>>;

  for (const pluginId of pluginIds) {
    // console.log(`[PluginManager Debug] Processing plugin ID: ${pluginId}`); // REMOVED DEBUG
    const loader = loaders[pluginId];
    if (!loader) {
      console.error(
        `[PluginManager] No plugin loader found for ID '${pluginId}'. Was it configured in pluginRegistry.ts?`,
      );
      continue;
    }

    try {
      const module = await loader();
      const plugin = module.plugin as TeskooanoPlugin;

      if (plugin && typeof plugin === "object" && plugin.id === pluginId) {
        registerPlugin(plugin);
        if (typeof plugin.initialize === "function") {
          try {
            plugin.initialize(...(passedArguments ?? []));
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
          `[PluginManager] Failed to register plugin '${pluginId}'. Module export 'plugin' not found or invalid.`,
        );
      }
    } catch (error) {
      console.error(
        `[PluginManager] Failed to load or register plugin '${pluginId}' using its loader:`,
        error,
      );
    }
  }
  console.log("[PluginManager] Plugin registration via Vite loaders finished.");
}

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
  // console.log(`[PluginManager Debug] getFunctionConfig called for ID: ${id}`); // REMOVED DEBUG
  const func = functionRegistry.get(id);
  // console.log(`[PluginManager Debug] Found function config for ${id}:`, !!func); // REMOVED DEBUG
  return func;
}

/**
 * Retrieves all registered toolbar items for a specific target, sorted by order.
 * @param target - The target toolbar ('main-toolbar' or 'engine-toolbar').
 * @returns An array of ToolbarItemConfig objects, or an empty array if none found.
 */
export function getToolbarItemsForTarget(
  target: ToolbarTarget,
): ToolbarItemConfig[] {
  const items = toolbarRegistry.get(target) ?? [];
  return [...items];
}

/**
 * Retrieves a loaded class definition for a non-custom-element module.
 * @param key - The key used in the componentRegistry (e.g., 'teskooano-modal-manager').
 * @returns The loaded class constructor or undefined if not found or not loaded.
 */
export function getLoadedModuleClass(key: string): any | undefined {
  return loadedModuleClasses.get(key);
}
