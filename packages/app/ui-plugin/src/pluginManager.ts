import { Subject, Observable } from "rxjs";
import type { DockviewApi } from "dockview-core";
import type {
  FunctionConfig,
  PanelConfig,
  PluginExecutionContext,
  PluginFunctionCallerSignature,
  TeskooanoPlugin,
  ToolbarItemConfig,
  ToolbarItemDefinition,
  ToolbarRegistration,
  ToolbarTarget,
  ToolbarWidgetConfig,
  ManagerConfig,
  ComponentConfig,
  PluginRegistrationStatus,
} from "./types.js";

import { pluginLoaders } from "virtual:teskooano-loaders";

class PluginManager {
  // --- Private Members ---
  #pluginRegistry: Map<string, TeskooanoPlugin> = new Map();
  #panelRegistry: Map<string, PanelConfig> = new Map();
  #functionRegistry: Map<string, FunctionConfig> = new Map();
  #toolbarRegistry: Map<ToolbarTarget, ToolbarItemConfig[]> = new Map();
  #loadedModuleClasses: Map<string, any> = new Map();
  #managerInstances: Map<string, any> = new Map();

  #dockviewApi: DockviewApi | null = null;
  #dockviewController: any | null = null;

  // RxJS Subject for plugin registration status
  #pluginStatusSubject = new Subject<PluginRegistrationStatus>();

  // --- Public RxJS Observable ---
  public readonly pluginStatus$: Observable<PluginRegistrationStatus> =
    this.#pluginStatusSubject.asObservable();

  // Singleton instance
  private static instance: PluginManager;

  // Private constructor to enforce singleton pattern
  private constructor() {}

  /**
   * Gets the singleton instance of the PluginManager.
   */
  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  // --- Public Methods ---

  /**
   * Sets the core application dependencies needed by plugins.
   * MUST be called once during application initialization.
   * @param deps - Object containing the core dependencies.
   */
  public setAppDependencies(deps: {
    dockviewApi: DockviewApi;
    dockviewController: any;
  }): void {
    if (this.#dockviewApi && deps.dockviewApi) {
      console.warn(
        "[PluginManager] setAppDependencies called more than once with non-null API.",
      );
    }

    this.#dockviewApi = deps.dockviewApi;
    this.#dockviewController = deps.dockviewController;

    this.#managerInstances.forEach((instance, id) => {
      if (typeof instance.setDependencies === "function") {
        try {
          if (!instance._dependenciesSet) {
            instance.setDependencies({
              dockviewApi: this.#dockviewApi,
              dockviewController: this.#dockviewController,
            });
            instance._dependenciesSet = true;
          }
        } catch (error) {
          console.error(
            `[PluginManager] Error setting dependencies post-instantiation for manager '${id}':`,
            error,
          );
        }
      }
    });
  }

  /**
   * Registers the metadata of a UI plugin (panels, functions, toolbars).
   * Automatically defines custom elements provided via plugin panels and components.
   * @param plugin - The plugin object containing metadata.
   */
  public registerPlugin(plugin: TeskooanoPlugin): void {
    if (this.#pluginRegistry.has(plugin.id)) {
      console.warn(
        `[PluginManager] Plugin with ID '${plugin.id}' already registered. Skipping.`,
      );
      return;
    }
    this.#pluginRegistry.set(plugin.id, plugin);

    plugin.panels?.forEach((panelConfig) => {
      if (this.#panelRegistry.has(panelConfig.componentName)) {
        console.warn(
          `[PluginManager] Panel component name '${panelConfig.componentName}' from plugin '${plugin.id}' already registered by another plugin. Skipping panel registration.`,
        );
      } else {
        this.#panelRegistry.set(panelConfig.componentName, panelConfig);
      }

      const PanelClass = panelConfig.panelClass as any;
      const componentName = panelConfig.componentName;

      if (
        PanelClass &&
        typeof PanelClass === "function" &&
        PanelClass.prototype instanceof HTMLElement &&
        !customElements.get(componentName)
      ) {
        try {
          customElements.define(
            componentName,
            PanelClass as CustomElementConstructor,
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
      }
    });

    plugin.functions?.forEach((funcConfig) => {
      if (this.#functionRegistry.has(funcConfig.id)) {
        console.warn(
          `[PluginManager] Function ID '${funcConfig.id}' from plugin '${plugin.id}' already registered. Skipping.`,
        );
        return;
      }
      this.#functionRegistry.set(funcConfig.id, funcConfig);
    });

    plugin.toolbarRegistrations?.forEach(
      (registration: ToolbarRegistration) => {
        const target = registration.target;
        if (!this.#toolbarRegistry.has(target)) {
          this.#toolbarRegistry.set(target, []);
        }
        const targetItems = this.#toolbarRegistry.get(target)!;

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
        targetItems.sort(
          (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
        );
      },
    );

    plugin.managerClasses?.forEach((managerConfig) => {
      if (this.#managerInstances.has(managerConfig.id)) {
        console.warn(
          `[PluginManager] Manager INSTANCE for ID '${managerConfig.id}' already exists. Skipping registration.`,
        );
        return;
      }

      try {
        const ManagerClass = managerConfig.managerClass;
        const instance =
          new ManagerClass(/* Constructor args? Needs context? */);

        this.#managerInstances.set(managerConfig.id, instance);

        if (typeof instance.setDependencies === "function") {
          if (this.#dockviewApi && this.#dockviewController) {
            instance.setDependencies({
              dockviewApi: this.#dockviewApi,
              dockviewController: this.#dockviewController,
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
      } catch (error) {
        console.error(
          `[PluginManager] Failed to define custom element '${componentConfig.tagName}' from plugin '${plugin.id}':`,
          error,
        );
      }
    });
  }

  /**
   * Loads and registers UI plugins using loaders from the Vite plugin.
   * Emits status updates via the `pluginStatus$` observable.
   * @param pluginIds - An array of plugin IDs to load.
   * @param passedArguments - Optional arguments to pass to the plugin's initialize function.
   */
  public async loadAndRegisterPlugins(
    pluginIds: string[],
    passedArguments?: any,
  ): Promise<void> {
    const loaders = pluginLoaders as Record<string, () => Promise<any>>;
    const loadedPlugins: Record<string, TeskooanoPlugin> = {};
    const registeredPluginIds: Set<string> = new Set();
    const failedPluginIds: Set<string> = new Set();
    const allRequestedIds = new Set(pluginIds);

    this.#pluginStatusSubject.next({
      type: "loading_started",
      pluginIds,
    });

    const loadPromises = pluginIds.map(async (id) => {
      const loader = loaders[id];
      if (!loader) {
        console.error(`[PluginManager] No loader found for plugin ID '${id}'.`);
        failedPluginIds.add(id);
        this.#pluginStatusSubject.next({
          type: "load_error",
          pluginId: id,
          error: new Error("Loader not found"),
        });
        return null;
      }
      try {
        this.#pluginStatusSubject.next({
          type: "loading_plugin",
          pluginId: id,
        });
        const module = await loader();
        const plugin = module.plugin as TeskooanoPlugin;
        if (!plugin || typeof plugin !== "object" || plugin.id !== id) {
          const error = new Error(
            "Invalid or missing 'plugin' export or mismatched ID.",
          );
          console.error(
            `[PluginManager] Failed to load plugin '${id}'. ${error.message}`,
          );
          failedPluginIds.add(id);
          this.#pluginStatusSubject.next({
            type: "load_error",
            pluginId: id,
            error,
          });
          return null;
        }
        loadedPlugins[id] = plugin;
        this.#pluginStatusSubject.next({
          type: "loaded_plugin",
          pluginId: id,
        });
        return plugin;
      } catch (error: any) {
        console.error(
          `[PluginManager] Failed to load plugin module '${id}':`,
          error,
        );
        failedPluginIds.add(id);
        this.#pluginStatusSubject.next({
          type: "load_error",
          pluginId: id,
          error,
        });
        return null;
      }
    });

    await Promise.all(loadPromises);

    let pluginsToRegister = Object.values(loadedPlugins);
    let registeredInPass: number;
    const maxPasses = pluginIds.length + 1;
    let currentPass = 0;

    this.#pluginStatusSubject.next({
      type: "registration_started",
      pluginIds: Object.keys(loadedPlugins),
    });

    while (pluginsToRegister.length > 0 && currentPass < maxPasses) {
      currentPass++;
      registeredInPass = 0;
      const remainingPlugins: TeskooanoPlugin[] = [];

      for (const plugin of pluginsToRegister) {
        const dependencies = plugin.dependencies || [];
        const unmetDependencies = dependencies.filter(
          (depId) =>
            !registeredPluginIds.has(depId) && !failedPluginIds.has(depId),
        );

        if (unmetDependencies.length === 0) {
          try {
            this.#pluginStatusSubject.next({
              type: "registering_plugin",
              pluginId: plugin.id,
            });
            this.registerPlugin(plugin);

            if (typeof plugin.initialize === "function") {
              try {
                plugin.initialize(passedArguments);
              } catch (initError: any) {
                console.error(
                  `[PluginManager] Error during initialize() for plugin '${plugin.id}':`,
                  initError,
                );
                this.#pluginStatusSubject.next({
                  type: "init_error",
                  pluginId: plugin.id,
                  error: initError,
                });
              }
            }
            registeredPluginIds.add(plugin.id);
            registeredInPass++;
            this.#pluginStatusSubject.next({
              type: "registered_plugin",
              pluginId: plugin.id,
            });
          } catch (registerError: any) {
            console.error(
              `[PluginManager] Error during registerPlugin() for plugin '${plugin.id}':`,
              registerError,
            );
            failedPluginIds.add(plugin.id);
            this.#pluginStatusSubject.next({
              type: "register_error",
              pluginId: plugin.id,
              error: registerError,
            });
          }
        } else {
          remainingPlugins.push(plugin);
        }
      }

      pluginsToRegister = remainingPlugins;

      if (registeredInPass === 0 && pluginsToRegister.length > 0) {
        console.error(
          `[PluginManager] Could not register some plugins due to missing or circular dependencies after ${currentPass} passes. Remaining:`,
          pluginsToRegister.map((p) => p.id),
        );
        pluginsToRegister.forEach((p) => {
          const unmet = (p.dependencies || []).filter(
            (depId) => !registeredPluginIds.has(depId),
          );
          const reason =
            unmet.length > 0
              ? `Waiting for: ${unmet.join(", ")}`
              : "Possible circular dependency or unmet failed dependency";
          console.error(` - Plugin '${p.id}': ${reason}`);
          failedPluginIds.add(p.id);
          this.#pluginStatusSubject.next({
            type: "dependency_error",
            pluginId: p.id,
            missingDependencies: unmet,
          });
        });
        break;
      }
    }

    const successfullyRegistered = Array.from(registeredPluginIds);
    const finallyFailed = Array.from(failedPluginIds).concat(
      pluginsToRegister.map((p) => p.id),
    );
    const allProcessedIds = new Set([
      ...successfullyRegistered,
      ...finallyFailed,
    ]);
    const notFoundIds = pluginIds.filter((id) => !allProcessedIds.has(id));

    if (
      pluginsToRegister.length > 0 ||
      failedPluginIds.size > 0 ||
      notFoundIds.length > 0
    ) {
      console.warn(
        `[PluginManager] Plugin loading/registration finished with issues.`,
      );
    } else {
      console.log(
        "[PluginManager] All requested plugins loaded and registered successfully.",
      );
    }

    this.#pluginStatusSubject.next({
      type: "loading_complete",
      successfullyRegistered: successfullyRegistered,
      failed: finallyFailed,
      notFound: notFoundIds,
    });
  }

  /**
   * Retrieves all registered plugins.
   * @returns An array of registered plugin objects.
   */
  public getPlugins(): TeskooanoPlugin[] {
    return Array.from(this.#pluginRegistry.values());
  }

  /**
   * Retrieves the configuration for a specific panel component.
   * @param componentName - The component name of the panel.
   * @returns The PanelConfig or undefined if not found.
   */
  public getPanelConfig(componentName: string): PanelConfig | undefined {
    return this.#panelRegistry.get(componentName);
  }

  /**
   * Retrieves the configuration for a specific function.
   * @param id The unique identifier of the function.
   * @returns The function configuration object, or undefined if not found.
   */
  public getFunctionConfig(id: string): FunctionConfig | undefined {
    return this.#functionRegistry.get(id);
  }

  /**
   * Executes a registered plugin function by its ID.
   * Injects dependencies (like Dockview API/Controller) if required by the function config.
   * @param functionId - The unique identifier of the function to execute.
   * @param args - Optional arguments to pass to the function.
   * @returns The result of the function execution. Throws error if function fails execution, returns undefined if function not found.
   */
  public execute<T = any>(
    functionId: string,
    args?: any,
  ): Promise<T> | T | undefined {
    const funcConfig = this.#functionRegistry.get(functionId);
    if (!funcConfig) {
      console.error(`[PluginManager] Function '${functionId}' not found.`);
      return undefined;
    }

    // Check new dependencies structure first
    const requiresApi = funcConfig.dependencies?.dockView?.api;
    const requiresController = funcConfig.dependencies?.dockView?.controller;

    // Validate dependencies are met
    if (requiresApi && !this.#dockviewApi) {
      const errorMsg = `[PluginManager] Cannot execute function '${functionId}': DockviewApi dependency required but not set. Call setAppDependencies first.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    if (requiresController && !this.#dockviewController) {
      const errorMsg = `[PluginManager] Cannot execute function '${functionId}': DockviewController dependency required but not set. Call setAppDependencies first.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Build context, injecting only if needed (or always for simplicity? Always for now.)
    const context: PluginExecutionContext = {
      dockviewApi: this.#dockviewApi, // Always pass, might be null if not set/needed
      dockviewController: this.#dockviewController, // Always pass, might be null
      getManager: this.getManagerInstance.bind(this),
      executeFunction: this.execute.bind(this),
    };

    try {
      return funcConfig.execute(context, args);
    } catch (error) {
      console.error(
        `[PluginManager] Error executing function '${functionId}':`,
        error,
      );
      throw error;
    }
  }

  /**
   * Retrieves all registered toolbar items for a specific target, sorted by order.
   * @param target - The target toolbar ('main-toolbar' or 'engine-toolbar').
   * @returns A new array of ToolbarItemConfig objects, or an empty array if none found.
   */
  public getToolbarItemsForTarget(target: ToolbarTarget): ToolbarItemConfig[] {
    return [...(this.#toolbarRegistry.get(target) ?? [])];
  }

  /**
   * Retrieves all registered toolbar widget configurations for a specific target toolbar area,
   * sorted by their 'order' property.
   * @param target - The ID of the target toolbar ('main-toolbar', 'engine-toolbar', etc.).
   * @returns An array of sorted ToolbarWidgetConfig objects.
   */
  public getToolbarWidgetsForTarget(
    target: ToolbarTarget,
  ): ToolbarWidgetConfig[] {
    const allWidgets: ToolbarWidgetConfig[] = [];

    this.#pluginRegistry.forEach((plugin) => {
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
  public getManagerInstance<T = any>(id: string): T | undefined {
    return this.#managerInstances.get(id) as T | undefined;
  }

  // --- Private Helper Methods ---

  #registerPanel(pluginId: string, panelConfig: PanelConfig): void {
    if (this.#panelRegistry.has(panelConfig.componentName)) {
      console.warn(
        `[PluginManager] Panel component name '${panelConfig.componentName}' from plugin '${pluginId}' already registered by another plugin. Skipping panel registration.`,
      );
      return;
    }

    this.#panelRegistry.set(panelConfig.componentName, panelConfig);

    const PanelClass = panelConfig.panelClass as any;
    const componentName = panelConfig.componentName;

    if (
      PanelClass &&
      typeof PanelClass === "function" &&
      PanelClass.prototype instanceof HTMLElement
    ) {
      if (!customElements.get(componentName)) {
        try {
          customElements.define(
            componentName,
            PanelClass as CustomElementConstructor,
          );
        } catch (error) {
          console.error(
            `[PluginManager] Failed to auto-define custom element panel '${componentName}' from plugin '${pluginId}':`,
            error,
          );
        }
      }
    }
  }

  #registerFunction(pluginId: string, funcConfig: FunctionConfig): void {
    if (this.#functionRegistry.has(funcConfig.id)) {
      console.warn(
        `[PluginManager] Function ID '${funcConfig.id}' from plugin '${pluginId}' already registered. Skipping.`,
      );
      return;
    }
    this.#functionRegistry.set(funcConfig.id, funcConfig);
  }

  #registerToolbarItems(
    pluginId: string,
    registration: ToolbarRegistration,
  ): void {
    const target = registration.target;
    if (!this.#toolbarRegistry.has(target)) {
      this.#toolbarRegistry.set(target, []);
    }
    const targetItems = this.#toolbarRegistry.get(target)!;

    registration.items?.forEach((itemDefinition: ToolbarItemDefinition) => {
      const fullItemConfig: ToolbarItemConfig = { ...itemDefinition, target };

      if (targetItems.some((item) => item.id === fullItemConfig.id)) {
        console.warn(
          `[PluginManager] Toolbar item ID '${fullItemConfig.id}' for target '${target}' from plugin '${pluginId}' already exists. Skipping.`,
        );
        return;
      }
      targetItems.push(fullItemConfig);
    });

    targetItems.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  }

  #instantiateManager(pluginId: string, managerConfig: ManagerConfig): void {
    if (this.#managerInstances.has(managerConfig.id)) {
      console.warn(
        `[PluginManager] Manager INSTANCE for ID '${managerConfig.id}' already exists. Skipping instantiation from plugin '${pluginId}'.`,
      );
      return;
    }

    try {
      const ManagerClass = managerConfig.managerClass;
      const instance = new ManagerClass(/* Pass context/args if needed */);
      this.#managerInstances.set(managerConfig.id, instance);

      if (typeof instance.setDependencies === "function") {
        if (this.#dockviewApi && this.#dockviewController) {
          instance.setDependencies({
            dockviewApi: this.#dockviewApi,
            dockviewController: this.#dockviewController,
          });
          instance._dependenciesSet = true;
        }
      }
    } catch (error) {
      console.error(
        `[PluginManager] Failed to instantiate manager '${managerConfig.id}' from plugin '${pluginId}':`,
        error,
      );
    }
  }

  #registerComponent(pluginId: string, componentConfig: ComponentConfig): void {
    if (customElements.get(componentConfig.tagName)) {
      console.warn(
        `[PluginManager] Custom element '${componentConfig.tagName}' from plugin '${pluginId}' is already defined. Skipping registration.`,
      );
      return;
    }
    try {
      customElements.define(
        componentConfig.tagName,
        componentConfig.componentClass,
      );
    } catch (error) {
      console.error(
        `[PluginManager] Failed to define custom element '${componentConfig.tagName}' from plugin '${pluginId}':`,
        error,
      );
    }
  }
}

export const pluginManager = PluginManager.getInstance();
