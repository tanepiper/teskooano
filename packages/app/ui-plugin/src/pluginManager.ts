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
  PluginExecutionContext,
  PluginFunctionCallerSignature,
  ToolbarWidgetConfig,
} from "./types.js";
import type { DockviewApi } from "dockview-core";

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

// --- ADD: Manager State for Dependencies ---
let _dockviewApi: DockviewApi | null = null;
let _dockviewController: any | null = null; // Use same type as in context (any for now)

/**
 * Sets the core application dependencies needed by plugins.
 * MUST be called once during application initialization.
 * @param deps - Object containing the core dependencies.
 */
export function setAppDependencies(deps: {
  dockviewApi: DockviewApi;
  dockviewController: any; // Use same type as context
}): void {
  if (_dockviewApi) {
    console.warn("[PluginManager] setAppDependencies called more than once.");
    // Optionally throw an error or just overwrite
  }
  _dockviewApi = deps.dockviewApi;
  _dockviewController = deps.dockviewController;
  console.log(
    "[PluginManager] Application dependencies (DockviewApi, DockviewController) set.",
  );
}
// --- END ADD ---

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
        // REMOVED: Automatic dependency injection via initialize.
        // Initialize is now only for plugin-specific setup.
        if (typeof plugin.initialize === "function") {
          try {
            // Call initialize without API/Controller args
            plugin.initialize();
          } catch (initError) {
            console.error(
              `[PluginManager] Error calling optional initialize for plugin '${pluginId}':`,
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
 * @param id The unique identifier of the function.
 * @returns The function configuration object, or undefined if not found.
 */
export function getFunctionConfig(
  id: string,
): { id: string; execute: PluginFunctionCallerSignature } | undefined {
  const originalConfig = functionRegistry.get(id);

  if (!originalConfig) {
    return undefined;
  }

  // Return a new object containing a wrapped execute function
  return {
    id: originalConfig.id,
    // The returned execute function matches the *original* expected signature (args only)
    execute: (...args: any[]) => {
      // This wrapper injects the stored dependencies into the context
      // before calling the plugin's original execute function.
      if (!_dockviewApi) {
        console.error(
          `[PluginManager] Cannot execute function '${id}': DockviewApi dependency not set. Call setAppDependencies first.`,
        );
        // Optionally throw or return a rejected promise for async cases
        return Promise.reject("DockviewApi not available");
      }

      // Create the context to pass
      const executionContext: PluginExecutionContext = {
        dockviewApi: _dockviewApi,
        dockviewController: _dockviewController, // Pass stored controller
      };

      try {
        // Call the original plugin function with the prepared context and original args
        return originalConfig.execute(executionContext, ...args);
      } catch (error) {
        console.error(
          `[PluginManager] Error executing function '${id}' from plugin '${/* How to get plugin ID here? Might need to store it with func */ "unknown"}':`,
          error,
        );
        // Re-throw or handle as appropriate
        throw error;
      }
    },
  };
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

/**
 * Retrieves all registered toolbar widget configurations for a specific target toolbar area,
 * sorted by their 'order' property.
 * @param target - The ID of the target toolbar ('main-toolbar', 'engine-toolbar', etc.).
 * @returns An array of sorted ToolbarWidgetConfig objects.
 */
export function getToolbarWidgetsForTarget(
  target: ToolbarTarget,
): ToolbarWidgetConfig[] {
  const allWidgets: ToolbarWidgetConfig[] = [];

  pluginRegistry.forEach((plugin) => {
    if (plugin.toolbarWidgets) {
      plugin.toolbarWidgets.forEach((widgetConfig) => {
        // Ensure the widget config has the target property correctly set internally
        // (Even though it's defined on the config object itself)
        if (widgetConfig.target === target) {
          allWidgets.push(widgetConfig);
        }
      });
    }
  });

  // Sort widgets by order (ascending, undefined order goes last)
  allWidgets.sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    return orderA - orderB;
  });

  console.log(
    `[PluginManager] Found ${allWidgets.length} widgets for target '${target}'`,
  );
  return allWidgets;
}
