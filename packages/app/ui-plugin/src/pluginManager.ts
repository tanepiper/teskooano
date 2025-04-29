import type {
  TeskooanoPlugin,
  PanelConfig,
  FunctionConfig,
  ToolbarItemConfig,
  ToolbarTarget,
  ToolbarRegistration,
  ToolbarItemDefinition,
  ComponentRegistryConfig,
  PluginExecutionContext,
  PluginFunctionCallerSignature,
  ToolbarWidgetConfig,
} from "./types.js";
import type { DockviewApi } from "dockview-core";

import {
  componentLoaders as virtualComponentLoaders,
  pluginLoaders as virtualPluginLoaders,
  componentRegistryConfig as virtualComponentRegistryConfig,
} from "virtual:teskooano-loaders";

const loadedComponentConfig =
  virtualComponentRegistryConfig as ComponentRegistryConfig;

class PluginManager {
  private pluginRegistry: Map<string, TeskooanoPlugin> = new Map();
  private panelRegistry: Map<string, PanelConfig> = new Map();
  private functionRegistry: Map<string, FunctionConfig> = new Map();
  private toolbarRegistry: Map<ToolbarTarget, ToolbarItemConfig[]> = new Map();
  private loadedModuleClasses: Map<string, any> = new Map();

  private _dockviewApi: DockviewApi | null = null;
  private _dockviewController: any | null = null;

  /**
   * Sets the core application dependencies needed by plugins.
   * MUST be called once during application initialization.
   * @param deps - Object containing the core dependencies.
   */
  public setAppDependencies(deps: {
    dockviewApi: DockviewApi;
    dockviewController: any;
  }): void {
    if (this._dockviewApi) {
      console.warn("[PluginManager] setAppDependencies called more than once.");
    }
    this._dockviewApi = deps.dockviewApi;
    this._dockviewController = deps.dockviewController;
    console.log(
      "[PluginManager] Application dependencies (DockviewApi, DockviewController) set.",
    );
  }

  /**
   * Registers the metadata of a UI plugin.
   * @param plugin - The plugin object containing metadata.
   */
  public registerPlugin(plugin: TeskooanoPlugin): void {
    if (this.pluginRegistry.has(plugin.id)) {
      console.warn(
        `[PluginManager] Plugin with ID '${plugin.id}' already registered. Skipping. `,
      );
      return;
    }
    this.pluginRegistry.set(plugin.id, plugin);

    plugin.panels?.forEach((panelConfig) => {
      if (this.panelRegistry.has(panelConfig.componentName)) {
        console.warn(
          `[PluginManager] Panel component name '${panelConfig.componentName}' from plugin '${plugin.id}' already registered. Skipping. `,
        );
        return;
      }
      this.panelRegistry.set(panelConfig.componentName, panelConfig);
    });

    plugin.functions?.forEach((funcConfig) => {
      if (this.functionRegistry.has(funcConfig.id)) {
        console.warn(
          `[PluginManager] Function ID '${funcConfig.id}' from plugin '${plugin.id}' already registered. Skipping. `,
        );
        return;
      }
      this.functionRegistry.set(funcConfig.id, funcConfig);
    });

    plugin.toolbarRegistrations?.forEach(
      (registration: ToolbarRegistration) => {
        const target = registration.target;
        if (!this.toolbarRegistry.has(target)) {
          this.toolbarRegistry.set(target, []);
        }
        const targetItems = this.toolbarRegistry.get(target)!;

        registration.items?.forEach((itemDefinition: ToolbarItemDefinition) => {
          const fullItemConfig: ToolbarItemConfig = {
            ...itemDefinition,
            target: target,
          };
          if (targetItems.some((item) => item.id === fullItemConfig.id)) {
            console.warn(
              `[PluginManager] Toolbar item ID '${fullItemConfig.id}' for target '${target}' from plugin '${plugin.id}' already exists. Skipping. `,
            );
            return;
          }
          targetItems.push(fullItemConfig);
        });
        targetItems.sort(
          (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
        );
      },
    );

    if (typeof plugin.initialize === "function") {
      try {
        plugin.initialize();
      } catch (initError) {
        console.error(
          `[PluginManager] Error calling optional initialize for plugin '${plugin.id}': `,
          initError,
        );
      }
    }
  }

  /**
   * Loads and registers custom web components or just loads modules
   * based on the configuration provided via the Vite plugin.
   * @param componentTags - An array of component tag/keys to load from the registry.
   */
  public async loadAndRegisterComponents(
    componentTags: string[],
  ): Promise<void> {
    const loaders = virtualComponentLoaders as Record<
      string,
      () => Promise<any>
    >;

    for (const tagName of componentTags) {
      const config = loadedComponentConfig[tagName];
      if (!config) {
        console.error(
          `[PluginManager] No configuration found for key '${tagName}' in the registry. `,
        );
        continue;
      }
      const className = config.className;
      const isCustomElement = config.isCustomElement !== false;

      if (isCustomElement && customElements.get(tagName)) {
        continue;
      }
      if (!isCustomElement && this.loadedModuleClasses.has(tagName)) {
        continue;
      }

      const loader = loaders[tagName];
      if (!loader) {
        console.error(`[PluginManager] No loader found for tag '${tagName}'. `);
        continue;
      }

      try {
        const module = await loader();
        const loadedClass = module[className];

        if (typeof loadedClass !== "function") {
          console.error(
            `[PluginManager] Failed to load '${tagName}'. Class '${className}' not found or not a function. `,
          );
          continue;
        }

        if (isCustomElement) {
          if (loadedClass.prototype instanceof HTMLElement) {
            customElements.define(
              tagName,
              loadedClass as CustomElementConstructor,
            );
          } else {
            console.error(
              `[PluginManager] Failed to define '${tagName}'. Class '${className}' is not a valid Custom Element constructor. `,
            );
          }
        } else {
          this.loadedModuleClasses.set(tagName, loadedClass);
        }
      } catch (error) {
        console.error(
          `[PluginManager] Failed to load ${isCustomElement ? "component" : "module"} '${tagName}': `,
          error,
        );
      }
    }
  }

  /**
   * Loads and registers UI plugins using loaders from the Vite plugin.
   * @param pluginIds - An array of plugin IDs to load.
   */
  public async loadAndRegisterPlugins(pluginIds: string[]): Promise<void> {
    const loaders = virtualPluginLoaders as Record<string, () => Promise<any>>;

    for (const pluginId of pluginIds) {
      const loader = loaders[pluginId];
      if (!loader) {
        console.error(
          `[PluginManager] No plugin loader found for ID '${pluginId}'. Was it configured in pluginRegistry.ts? `,
        );
        continue;
      }

      try {
        const module = await loader();
        const plugin = module.plugin as TeskooanoPlugin;

        if (plugin && typeof plugin === "object" && plugin.id === pluginId) {
          this.registerPlugin(plugin);
        } else if (plugin && plugin.id !== pluginId) {
          console.error(
            `[PluginManager] Failed to register plugin '${pluginId}'. Loaded plugin has mismatched ID '${plugin.id}'. `,
          );
        } else {
          console.error(
            `[PluginManager] Failed to register plugin '${pluginId}'. Module export 'plugin' not found or invalid. `,
          );
        }
      } catch (error) {
        console.error(
          `[PluginManager] Failed to load or register plugin '${pluginId}' using its loader: `,
          error,
        );
      }
    }
  }

  /**
   * Retrieves all registered plugins.
   * @returns An array of registered plugin objects.
   */
  public getPlugins(): TeskooanoPlugin[] {
    return Array.from(this.pluginRegistry.values());
  }

  /**
   * Retrieves the configuration for a specific panel component.
   * @param componentName - The component name of the panel.
   * @returns The PanelConfig or undefined if not found.
   */
  public getPanelConfig(componentName: string): PanelConfig | undefined {
    return this.panelRegistry.get(componentName);
  }

  /**
   * Retrieves the configuration for a specific function, wrapped to include context.
   * @param id The unique identifier of the function.
   * @returns The function configuration object with context-aware execution, or undefined.
   */
  public getFunctionConfig(
    id: string,
  ): { id: string; execute: PluginFunctionCallerSignature } | undefined {
    const originalConfig = this.functionRegistry.get(id);

    if (!originalConfig) {
      return undefined;
    }

    return {
      id: originalConfig.id,
      execute: (...args: any[]) => {
        if (!this._dockviewApi) {
          console.error(
            `[PluginManager] Cannot execute function '${id}': DockviewApi dependency not set. Call setAppDependencies first. `,
          );
          return Promise.reject(
            new Error("Dockview API not available in PluginManager"),
          );
        }

        const executionContext: PluginExecutionContext = {
          dockviewApi: this._dockviewApi,
          dockviewController: this._dockviewController,
        };

        try {
          const result = originalConfig.execute(executionContext, ...args);
          return Promise.resolve(result);
        } catch (error) {
          console.error(
            `[PluginManager] Error executing function '${id}': `,
            error,
          );
          return Promise.reject(error);
        }
      },
    };
  }

  /**
   * Retrieves all registered toolbar items for a specific target, sorted by order.
   * @param target - The target toolbar ('main-toolbar' or 'engine-toolbar').
   * @returns An array of ToolbarItemConfig objects, or an empty array if none found.
   */
  public getToolbarItemsForTarget(target: ToolbarTarget): ToolbarItemConfig[] {
    const items = this.toolbarRegistry.get(target) ?? [];
    return [...items];
  }

  /**
   * Retrieves a loaded class definition for a non-custom-element module.
   * @param key - The key used in the componentRegistry.
   * @returns The loaded class constructor or undefined if not found or not loaded.
   */
  public getLoadedModuleClass(key: string): any | undefined {
    return this.loadedModuleClasses.get(key);
  }

  /**
   * Retrieves all registered toolbar widget configurations for a specific target toolbar area,
   * sorted by their 'order' property.
   * @param target - The ID of the target toolbar.
   * @returns An array of sorted ToolbarWidgetConfig objects.
   */
  public getToolbarWidgetsForTarget(
    target: ToolbarTarget,
  ): ToolbarWidgetConfig[] {
    const allWidgets: ToolbarWidgetConfig[] = [];

    this.pluginRegistry.forEach((plugin) => {
      plugin.toolbarWidgets?.forEach((widgetConfig) => {
        if (widgetConfig.target === target) {
          allWidgets.push(widgetConfig);
        }
      });
    });

    allWidgets.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    return allWidgets;
  }
}

const pluginManager = new PluginManager();
export { pluginManager };
