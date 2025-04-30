import type {
  TeskooanoPlugin,
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

import {
  componentLoaders,
  pluginLoaders,
  componentRegistryConfig,
} from "virtual:teskooano-loaders";

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
/** Stores registered manager/service CLASS CONSTRUCTORS, keyed by manager ID. */
// const managerRegistry: Map<string, { new (...args: any[]): any }> = new Map();
/** Stores INSTANTIATED singleton manager/service instances, keyed by manager ID. */
const managerInstances: Map<string, any> = new Map();

let _dockviewApi: DockviewApi | null = null;
let _dockviewController: any | null = null;

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
  }
  _dockviewApi = deps.dockviewApi;
  _dockviewController = deps.dockviewController;
  console.log(
    "[PluginManager] Application dependencies (DockviewApi, DockviewController) set.",
  );
}

/**
 * Registers the metadata of a UI plugin (panels, functions, toolbars).
 * It now ALSO automatically defines custom elements provided via plugin panels.
 * @param plugin - The plugin object containing metadata.
 */
export function registerPlugin(plugin: TeskooanoPlugin): void {
  if (pluginRegistry.has(plugin.id)) {
    console.warn(
      `[PluginManager] Plugin with ID '${plugin.id}' already registered. Skipping.`,
    );
    return;
  }
  pluginRegistry.set(plugin.id, plugin);

  plugin.panels?.forEach((panelConfig) => {
    if (panelRegistry.has(panelConfig.componentName)) {
      console.warn(
        `[PluginManager] Panel component name '${panelConfig.componentName}' from plugin '${plugin.id}' already registered by another plugin. Skipping panel registration.`,
      );
      // We still check if the custom element needs defining below,
      // in case multiple plugins reuse the same panel component.
    } else {
      panelRegistry.set(panelConfig.componentName, panelConfig);
    }

    // --- Auto-define Custom Element Panels ---
    const PanelClass = panelConfig.panelClass as any; // Cast to any to satisfy TS temporarily
    const componentName = panelConfig.componentName;

    // Check if it's a class, extends HTMLElement, and isn't already defined
    if (
      PanelClass &&
      typeof PanelClass === "function" &&
      PanelClass.prototype instanceof HTMLElement &&
      !customElements.get(componentName)
    ) {
      try {
        console.log(
          `[PluginManager] Auto-defining custom element panel '${componentName}' from plugin '${plugin.id}'...`,
        );
        // We perform runtime checks, so the cast is safe here
        customElements.define(
          componentName,
          PanelClass as CustomElementConstructor,
        );
        console.log(
          `[PluginManager] Custom element panel '${componentName}' defined successfully.`,
        );
      } catch (error) {
        console.error(
          `[PluginManager] Failed to auto-define custom element panel '${componentName}' from plugin '${plugin.id}':`,
          error,
        );
      }
    } else if (
      PanelClass &&
      typeof PanelClass === "function" &&
      PanelClass.prototype instanceof HTMLElement &&
      customElements.get(componentName)
    ) {
      // Optional: Log if it's already defined
      // console.log(`[PluginManager] Custom element panel '${componentName}' was already defined.`);
    }
    // --- End Auto-define ---
  });

  plugin.functions?.forEach((funcConfig) => {
    if (functionRegistry.has(funcConfig.id)) {
      console.warn(
        `[PluginManager] Function ID '${funcConfig.id}' from plugin '${plugin.id}' already registered. Skipping.`,
      );
      return;
    }
    functionRegistry.set(funcConfig.id, funcConfig);
  });

  plugin.toolbarRegistrations?.forEach((registration: ToolbarRegistration) => {
    const target = registration.target;
    if (!toolbarRegistry.has(target)) {
      toolbarRegistry.set(target, []);
    }
    const targetItems = toolbarRegistry.get(target)!;

    registration.items?.forEach((itemDefinition: ToolbarItemDefinition) => {
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

  plugin.managerClasses?.forEach((managerConfig) => {
    if (managerInstances.has(managerConfig.id)) {
      console.warn(
        `[PluginManager] Manager INSTANCE for ID '${managerConfig.id}' already exists. Skipping registration.`,
      );
      return; // Skip if instance already exists
    }

    try {
      // Instantiate the manager class immediately
      const ManagerClass = managerConfig.managerClass;
      const instance = new ManagerClass(/* Constructor args? Needs context? */);

      // Store the INSTANCE
      managerInstances.set(managerConfig.id, instance);
      console.log(
        `[PluginManager] Instantiated and registered manager '${managerConfig.id}' from plugin '${plugin.id}'.`,
      );

      // Optional: Call an init method on the instance if it exists, passing context?
      if (typeof instance.setDependencies === "function") {
        // Pass core dependencies if available
        if (_dockviewApi && _dockviewController) {
          instance.setDependencies({
            dockviewApi: _dockviewApi,
            dockviewController: _dockviewController,
          });
        } else {
          console.warn(
            `[PluginManager] Dependencies not yet available for manager ${managerConfig.id}. Consider initializing later or handling missing dependencies.`,
          );
        }
      }
    } catch (error) {
      console.error(
        `[PluginManager] Failed to instantiate manager '${managerConfig.id}' from plugin '${plugin.id}':`,
        error,
      );
    }
  });

  // --- Process custom element component registrations --- //
  plugin.components?.forEach((componentConfig) => {
    if (customElements.get(componentConfig.tagName)) {
      console.warn(
        `[PluginManager] Custom element '${componentConfig.tagName}' from plugin '${plugin.id}' is already defined. Skipping registration.`,
      );
      return;
    }
    try {
      customElements.define(
        componentConfig.tagName,
        componentConfig.componentClass,
      );
      console.log(
        `[PluginManager] Defined custom element '${componentConfig.tagName}' from plugin '${plugin.id}'.`,
      );
    } catch (error) {
      console.error(
        `[PluginManager] Failed to define custom element '${componentConfig.tagName}' from plugin '${plugin.id}':`,
        error,
      );
    }
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
    if (!isCustomElement && loadedModuleClasses.has(tagName)) {
      console.warn(
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
          console.log(
            `[PluginManager] Defining custom element '${tagName}'...`,
          );
          customElements.define(
            tagName,
            loadedClass as CustomElementConstructor,
          );
          console.log(
            `[PluginManager] Custom element '${tagName}' defined successfully.`,
          );
        } else {
          console.error(
            `[PluginManager] Failed to define '${tagName}'. Class '${className}' is not a valid Custom Element constructor.`,
          );
        }
      } else {
        loadedModuleClasses.set(tagName, loadedClass);
        console.log(
          `[PluginManager] Loaded non-custom-element module '${tagName}'.`,
        );
      }
    } catch (error) {
      console.error(
        `[PluginManager] Failed to load ${isCustomElement ? "component" : "module"} '${tagName}':`,
        error,
      );
    }
  }
}

/**
 * Loads and registers UI plugins using loaders from the Vite plugin.
 * @param pluginIds - An array of plugin IDs to load (must exist in the config used by the Vite plugin).
 */
export async function loadAndRegisterPlugins(
  pluginIds: string[],
  passedArguments?: any,
): Promise<void> {
  const loaders = pluginLoaders as Record<string, () => Promise<any>>;
  const loadedPlugins: Record<string, TeskooanoPlugin> = {};
  const registeredPluginIds: Set<string> = new Set();
  const failedPluginIds: Set<string> = new Set();

  console.log(
    `[PluginManager] Attempting to load ${pluginIds.length} plugins:`,
    pluginIds,
  );

  // --- 1. Load all plugin modules --- //
  const loadPromises = pluginIds.map(async (id) => {
    const loader = loaders[id];
    if (!loader) {
      console.error(`[PluginManager] No loader found for plugin ID '${id}'.`);
      failedPluginIds.add(id); // Mark as failed early
      return null;
    }
    try {
      const module = await loader();
      // Assuming the plugin object is exported as 'plugin'
      const plugin = module.plugin as TeskooanoPlugin;
      if (!plugin || typeof plugin !== "object" || plugin.id !== id) {
        console.error(
          `[PluginManager] Failed to load plugin '${id}'. Invalid or missing 'plugin' export or mismatched ID.`,
        );
        failedPluginIds.add(id);
        return null;
      }
      loadedPlugins[id] = plugin;
      return plugin;
    } catch (error) {
      console.error(
        `[PluginManager] Failed to load plugin module '${id}':`,
        error,
      );
      failedPluginIds.add(id);
      return null;
    }
  });

  await Promise.all(loadPromises);

  console.log(
    `[PluginManager] Successfully loaded modules for ${Object.keys(loadedPlugins).length} plugins.`,
  );

  // --- 2. Register plugins respecting dependencies --- //
  let pluginsToRegister = Object.values(loadedPlugins);
  let registeredInPass: number;
  const maxPasses = pluginIds.length + 1; // Generous limit to detect cycles/missing
  let currentPass = 0;

  while (pluginsToRegister.length > 0 && currentPass < maxPasses) {
    currentPass++;
    registeredInPass = 0;
    const remainingPlugins: TeskooanoPlugin[] = [];

    console.log(
      `[PluginManager] Registration Pass ${currentPass}, attempting to register ${pluginsToRegister.length} plugins.`,
    );

    for (const plugin of pluginsToRegister) {
      // Check dependencies
      const dependencies = plugin.dependencies || [];
      const unmetDependencies = dependencies.filter(
        (depId) =>
          !registeredPluginIds.has(depId) && !failedPluginIds.has(depId), // Don't wait for failed deps
      );

      if (unmetDependencies.length === 0) {
        // All dependencies met (or no dependencies)
        try {
          console.log(`[PluginManager] Registering plugin '${plugin.id}'...`);
          registerPlugin(plugin); // Use the existing registration logic
          // Call initialize if it exists (passing optional args)
          if (typeof plugin.initialize === "function") {
            console.log(
              `[PluginManager] Initializing plugin '${plugin.id}'...`,
            );
            try {
              plugin.initialize(passedArguments);
            } catch (initError) {
              console.error(
                `[PluginManager] Error during initialize() for plugin '${plugin.id}':`,
                initError,
              );
              // Decide if registration should be rolled back or just logged
            }
          }
          registeredPluginIds.add(plugin.id);
          registeredInPass++;
          console.log(
            `[PluginManager] Plugin '${plugin.id}' registered successfully.`,
          );
        } catch (registerError) {
          console.error(
            `[PluginManager] Error during registerPlugin() for plugin '${plugin.id}':`,
            registerError,
          );
          failedPluginIds.add(plugin.id); // Mark as failed if registration throws
        }
      } else {
        // Dependencies not met, keep for the next pass
        // console.log(`[PluginManager] Deferring plugin '${plugin.id}', unmet dependencies: ${unmetDependencies.join(", ")}`);
        remainingPlugins.push(plugin);
      }
    }

    pluginsToRegister = remainingPlugins;

    if (registeredInPass === 0 && pluginsToRegister.length > 0) {
      // No progress made in this pass, indicates circular or missing dependencies
      console.error(
        `[PluginManager] Could not register some plugins due to missing or circular dependencies. Remaining:`,
        pluginsToRegister.map((p) => p.id),
      );
      pluginsToRegister.forEach((p) => {
        const unmet = (p.dependencies || []).filter(
          (depId) => !registeredPluginIds.has(depId),
        );
        console.error(
          ` - Plugin '${p.id}' waiting for: ${unmet.join(", ") || "[unknown issue]"}`,
        );
        failedPluginIds.add(p.id); // Mark remaining as failed
      });
      break; // Exit the loop
    }
  }

  if (pluginsToRegister.length === 0) {
    console.log(
      `[PluginManager] All ${registeredPluginIds.size} requested and loadable plugins registered successfully.`,
    );
  } else {
    console.warn(
      `[PluginManager] Finished registration process with ${pluginsToRegister.length} plugins unable to register.`,
    );
  }

  if (failedPluginIds.size > 0) {
    console.error(
      `[PluginManager] The following plugins failed to load or register:`,
      Array.from(failedPluginIds),
    );
  }
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

  return {
    id: originalConfig.id,
    execute: (...args: any[]) => {
      if (!_dockviewApi) {
        console.error(
          `[PluginManager] Cannot execute function '${id}': DockviewApi dependency not set. Call setAppDependencies first.`,
        );
        return Promise.reject("DockviewApi not available");
      }

      const executionContext: PluginExecutionContext = {
        dockviewApi: _dockviewApi,
        dockviewController: _dockviewController, // Pass stored controller
      };

      try {
        return originalConfig.execute(executionContext, ...args);
      } catch (error) {
        console.error(
          `[PluginManager] Error executing function '${id}' from plugin '${/* How to get plugin ID here? Might need to store it with func */ "unknown"}':`,
          error,
        );
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
        if (widgetConfig.target === target) {
          allWidgets.push(widgetConfig);
        }
      });
    }
  });

  allWidgets.sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    return orderA - orderB;
  });
  return allWidgets;
}

/**
 * Retrieves a registered manager INSTANCE for a specific ID.
 * @param id - The ID of the manager.
 * @returns The manager instance or undefined if not found.
 */
export function getManagerInstance<T = any>(id: string): T | undefined {
  return managerInstances.get(id) as T | undefined;
}
