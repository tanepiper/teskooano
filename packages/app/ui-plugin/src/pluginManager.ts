/// <reference types="vite/client" />
import type { DockviewApi } from "dockview-core";
import { Observable, Subject } from "rxjs";
import type {
  ComponentConfig,
  FunctionConfig,
  PanelConfig,
  PluginExecutionContext,
  PluginRegistrationStatus,
  RegisteredItem,
  TeskooanoPlugin,
  ToolbarItemConfig,
  ToolbarRegistration,
  ToolbarTarget,
  ToolbarWidgetConfig,
} from "./types.js";

import { pluginLoaders } from "virtual:teskooano-loaders";

/**
 * Internal type to store manager instances along with their originating plugin ID.
 * @internal
 */
type RegisteredManager = {
  instance: any;
  pluginId: string;
};

/**
 * Manages the lifecycle of all UI plugins in the application.
 * This class is a singleton, accessible via `PluginManager.getInstance()`.
 *
 * It handles:
 * - Loading and registering plugins.
 * - Resolving dependencies between plugins.
 * - Providing access to registered plugin capabilities (panels, functions, etc.).
 * - Unloading and reloading plugins, especially for Hot Module Replacement (HMR).
 *
 * @singleton
 */
class PluginManager {
  /** @internal A registry of all loaded plugin definitions, keyed by plugin ID. */
  #pluginRegistry: Map<string, TeskooanoPlugin> = new Map();
  /** @internal A registry of all registered panel configurations, keyed by component name. */
  #panelRegistry: Map<string, RegisteredItem<PanelConfig>> = new Map();
  /** @internal A registry of all registered function configurations, keyed by function ID. */
  #functionRegistry: Map<string, RegisteredItem<FunctionConfig>> = new Map();
  /** @internal A registry of toolbar items, grouped by their target toolbar ID. */
  #toolbarRegistry: Map<ToolbarTarget, RegisteredItem<ToolbarItemConfig>[]> =
    new Map();
  /** @internal A queue for toolbar items with unmet dependencies. */
  #pendingToolbarRegistrations: RegisteredItem<ToolbarRegistration>[] = [];
  /** @internal A registry of instantiated manager class instances, keyed by manager ID. */
  #managerInstances: Map<string, RegisteredManager> = new Map();
  /** @internal A registry of all registered component configurations, keyed by tag name. */
  #componentRegistry: Map<string, RegisteredItem<ComponentConfig>> = new Map();

  /** @internal The core Dockview API instance. */
  #dockviewApi: DockviewApi | null = null;
  /** @internal The core Dockview controller instance. */
  #dockviewController: any | null = null;

  /** @internal The RxJS subject for broadcasting plugin status updates. */
  #pluginStatusSubject = new Subject<PluginRegistrationStatus>();

  /** @internal The RxJS subject for broadcasting when the list of plugins changes. */
  #pluginsChangedSubject = new Subject<void>();

  /**
   * An observable stream that emits status updates throughout the plugin
   * loading, registration, and unloading lifecycle.
   *
   * Subscribe to this to monitor the state of plugins.
   */
  public readonly pluginStatus$: Observable<PluginRegistrationStatus> =
    this.#pluginStatusSubject.asObservable();

  /**
   * An observable stream that emits whenever a plugin is registered or unregistered.
   *
   * Subscribe to this to react to changes in the overall plugin collection.
   */
  public readonly pluginsChanged$: Observable<void> =
    this.#pluginsChangedSubject.asObservable();

  /** @internal The singleton instance of the PluginManager. */
  private static instance: PluginManager;

  /**
   * Private constructor to enforce singleton pattern.
   * Sets up HMR listeners if in a development environment.
   * @private
   */
  private constructor() {
    if (import.meta.hot) {
      import.meta.hot.on(
        "teskooano-plugin-update",
        (data: { pluginId: string }) => {
          if (data.pluginId) {
            console.log(
              `[HMR] Received update for plugin: ${data.pluginId}. Reloading...`,
            );
            this.reloadPlugin(data.pluginId);
          }
        },
      );
    }
  }

  /**
   * Gets the singleton instance of the PluginManager.
   * @returns {PluginManager} The singleton instance.
   */
  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Sets the core application dependencies needed by plugins.
   * This MUST be called once during application initialization before loading plugins.
   * @param deps - An object containing the core application dependencies.
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

    this.#managerInstances.forEach((managerInfo, id) => {
      const instance = managerInfo.instance;
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
   * Registers a single plugin and all of its provided capabilities.
   * This is the central point for making a plugin's features available to the application.
   * @param {TeskooanoPlugin} plugin - The plugin object to register.
   */
  public registerPlugin(plugin: TeskooanoPlugin): void {
    if (this.#pluginRegistry.has(plugin.id)) {
      console.warn(
        `[PluginManager] Plugin with ID '${plugin.id}' already registered. Skipping.`,
      );
      return;
    }
    this.#pluginRegistry.set(plugin.id, plugin);

    this.#registerPanels(plugin);
    this.#registerFunctions(plugin);
    this.#registerToolbarItems(plugin);
    this.#registerManagerClasses(plugin);
    this.#registerComponents(plugin);

    this.#pluginsChangedSubject.next();
  }

  /**
   * Registers all panels from a given plugin.
   * It stores the panel's configuration and defines its class as a custom element
   * if it hasn't been defined already.
   * @param {TeskooanoPlugin} plugin - The plugin providing the panels.
   * @private
   */
  #registerPanels(plugin: TeskooanoPlugin): void {
    plugin.panels?.forEach((panelConfig) => {
      if (this.#panelRegistry.has(panelConfig.componentName)) {
        console.warn(
          `[PluginManager] Panel component name '${panelConfig.componentName}' from plugin '${plugin.id}' already registered by another plugin. Skipping panel registration.`,
        );
      } else {
        this.#panelRegistry.set(panelConfig.componentName, {
          ...panelConfig,
          pluginId: plugin.id,
        });
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
      } else if (customElements.get(componentName)) {
        console.warn(
          `[HMR] Custom element '${componentName}' from plugin '${plugin.id}' is already defined. HMR for components is not fully supported. A full page reload may be required to see changes.`,
        );
      }
    });
  }

  /**
   * Registers all functions from a given plugin.
   * @param {TeskooanoPlugin} plugin - The plugin providing the functions.
   * @private
   */
  #registerFunctions(plugin: TeskooanoPlugin): void {
    plugin.functions?.forEach((funcConfig) => {
      if (this.#functionRegistry.has(funcConfig.id)) {
        console.warn(
          `[PluginManager] Function ID '${funcConfig.id}' from plugin '${plugin.id}' already registered. Skipping.`,
        );
        return;
      }
      this.#functionRegistry.set(funcConfig.id, {
        ...funcConfig,
        pluginId: plugin.id,
      });
    });

    // After registering new functions, try to process any pending toolbar items
    // that might have been waiting for those functions.
    this.#processPendingToolbarItems();
  }

  /**
   * Processes toolbar items that were deferred due to unmet dependencies.
   * This method iterates through the pending queue and moves items to the
   * main toolbar registry if their dependencies are now satisfied.
   * @private
   */
  #processPendingToolbarItems(): void {
    const stillPending: RegisteredItem<ToolbarRegistration>[] = [];

    this.#pendingToolbarRegistrations.forEach((pendingRegistration) => {
      const initializers = pendingRegistration.items
        ?.flatMap((item) => item.dependencies?.initializers)
        .filter((id): id is string => !!id);

      let allDepsMet = true;
      if (initializers && initializers.length > 0) {
        for (const initId of initializers) {
          if (!this.#functionRegistry.has(initId)) {
            allDepsMet = false;
            break;
          }
        }
      }

      if (allDepsMet) {
        this.#addToolbarRegistration(pendingRegistration);
      } else {
        stillPending.push(pendingRegistration);
      }
    });

    this.#pendingToolbarRegistrations = stillPending;
  }

  /**
   * Registers all toolbar items from a given plugin.
   * If an item has unmet dependencies, it is added to a pending queue for later processing.
   * @param {TeskooanoPlugin} plugin - The plugin providing the toolbar items.
   * @private
   */
  #registerToolbarItems(plugin: TeskooanoPlugin): void {
    plugin.toolbarRegistrations?.forEach(
      (registration: ToolbarRegistration) => {
        const registeredRegistration: RegisteredItem<ToolbarRegistration> = {
          ...registration,
          pluginId: plugin.id,
        };
        this.#pendingToolbarRegistrations.push(registeredRegistration);
      },
    );
  }

  /**
   * Adds a given toolbar registration to the main toolbar registry and sorts the items.
   * @param {RegisteredItem<ToolbarRegistration>} registration - The registration to add.
   * @private
   */
  #addToolbarRegistration(
    registration: RegisteredItem<ToolbarRegistration>,
  ): void {
    const target = registration.target;
    if (!this.#toolbarRegistry.has(target)) {
      this.#toolbarRegistry.set(target, []);
    }
    const targetItems = this.#toolbarRegistry.get(target)!;

    if (registration.items) {
      const itemsWithPluginId = registration.items.map((item) => ({
        ...item,
        target: target, // ensure target is set on the item itself
        pluginId: registration.pluginId,
      }));

      targetItems.push(
        ...(itemsWithPluginId as RegisteredItem<ToolbarItemConfig>[]),
      );
    }

    // Sort the entire list for that target by order
    targetItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  /**
   * Registers and instantiates all manager classes from a given plugin.
   * If the manager instance has a `setDependencies` method, it is called with the
   * core application dependencies.
   * @param {TeskooanoPlugin} plugin - The plugin providing the manager classes.
   * @private
   */
  #registerManagerClasses(plugin: TeskooanoPlugin): void {
    plugin.managerClasses?.forEach((managerConfig) => {
      if (this.#managerInstances.has(managerConfig.id)) {
        console.warn(
          `[PluginManager] Manager INSTANCE for ID '${managerConfig.id}' already exists. Skipping registration.`,
        );
        return;
      }

      try {
        const ManagerClass = managerConfig.managerClass;
        const instance = new ManagerClass();

        this.#managerInstances.set(managerConfig.id, {
          instance,
          pluginId: plugin.id,
        });

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
  }

  /**
   * Registers all generic components from a given plugin by defining them as custom elements.
   * @param {TeskooanoPlugin} plugin - The plugin providing the components.
   * @private
   */
  #registerComponents(plugin: TeskooanoPlugin): void {
    plugin.components?.forEach((componentConfig) => {
      this.#componentRegistry.set(componentConfig.tagName, {
        ...componentConfig,
        pluginId: plugin.id,
      });
      if (customElements.get(componentConfig.tagName)) {
        console.warn(
          `[PluginManager] Custom element '${componentConfig.tagName}' from plugin '${plugin.id}' is already defined. Skipping registration definition. A full page reload might be necessary for the component to update.`,
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
   * Reloads a plugin by unloading it first, then loading and registering it again.
   * This is the core of the Hot Module Replacement (HMR) functionality.
   * @param {string} pluginId - The ID of the plugin to reload.
   * @returns {Promise<void>}
   */
  public async reloadPlugin(pluginId: string): Promise<void> {
    await this.unloadPlugin(pluginId);
    await this.loadAndRegisterPlugins([pluginId]);
  }

  /**
   * Unloads a plugin, calls its `dispose` method, and removes all its registered
   * contributions (panels, functions, toolbar items, and managers) from the system.
   *
   * @note This does not un-register custom elements from the browser, as this is
   * not supported by the Custom Elements API.
   *
   * @param {string} pluginId - The ID of the plugin to unload.
   * @returns {Promise<void>}
   */
  public async unloadPlugin(pluginId: string): Promise<void> {
    this.#pluginStatusSubject.next({ type: "unloading", pluginId });

    const plugin = this.#pluginRegistry.get(pluginId);
    if (!plugin) {
      console.warn(
        `[PluginManager] Plugin '${pluginId}' not found for unload.`,
      );
      return;
    }

    // Call optional dispose method on the plugin
    if (typeof plugin.dispose === "function") {
      this.#pluginStatusSubject.next({ type: "disposing", pluginId });
      try {
        await plugin.dispose();
        this.#pluginStatusSubject.next({ type: "disposed", pluginId });
      } catch (error) {
        console.error(
          `[PluginManager] Error disposing plugin '${pluginId}':`,
          error,
        );
        this.#pluginStatusSubject.next({
          type: "dispose_error",
          pluginId,
          error,
        });
      }
    }

    // Unregister all items associated with this plugin
    const unregister = <T>(
      registry: Map<string, RegisteredItem<T>>,
      itemType: string,
    ) => {
      const itemsToRemove: string[] = [];
      for (const [key, item] of registry.entries()) {
        if (item.pluginId === pluginId) {
          itemsToRemove.push(key);
        }
      }
      itemsToRemove.forEach((key) => {
        registry.delete(key);
        console.log(`[PluginManager] Unregistered ${itemType}: ${key}`);
      });
      if (itemsToRemove.length > 0) {
        this.#pluginsChangedSubject.next();
      }
    };

    unregister(this.#panelRegistry, "Panel");
    unregister(this.#functionRegistry, "Function");
    unregister(this.#componentRegistry, "Component");

    // Unregister toolbar items
    for (const target of this.#toolbarRegistry.keys()) {
      const items = this.#toolbarRegistry.get(target) || [];
      const remainingItems = items.filter((item) => item.pluginId !== pluginId);
      this.#toolbarRegistry.set(target, remainingItems);
    }

    // Unregister managers
    const managersToRemove = [...this.#managerInstances.entries()]
      .filter(([, manager]) => manager.pluginId === pluginId)
      .map(([key]) => key);
    managersToRemove.forEach((key) => this.#managerInstances.delete(key));

    // Remove plugin from main registry
    this.#pluginRegistry.delete(pluginId);

    this.#pluginStatusSubject.next({ type: "unloaded", pluginId });
    console.log(`[PluginManager] Plugin '${pluginId}' unloaded.`);
  }

  /**
   * Loads and registers a list of UI plugins by their IDs.
   * This method performs a topological sort to ensure plugins are loaded in the
   * correct order based on their dependencies. It emits status updates throughout
   * the process via the `pluginStatus$` observable.
   *
   * @param {string[]} pluginIds - An array of plugin IDs to load.
   * @param {any} [passedArguments] - Optional arguments to pass to each plugin's `initialize` function.
   * @returns {Promise<void>} A promise that resolves when the loading and registration process is complete.
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
    const processingOrder: string[] = [];

    this.#pluginStatusSubject.next({
      type: "loading_started",
      pluginIds: Array.from(allRequestedIds),
    });

    try {
      await this.#performTopologicalSort(allRequestedIds, {
        loaders,
        loadedPlugins,
        processingOrder,
      });
    } catch (error: any) {
      console.error("[PluginManager] Failed to load a plugin:", error);
      // The error might happen during the sort, find the last item being processed.
      // This is a best-guess effort for better error reporting.
      const failedId =
        processingOrder.find((id) => !loadedPlugins[id]) ||
        [...allRequestedIds].find((id) => !processingOrder.includes(id)) ||
        "unknown";

      failedPluginIds.add(failedId);
      this.#pluginStatusSubject.next({
        type: "load_error",
        pluginId: failedId,
        error,
      });
    }

    this.#pluginStatusSubject.next({
      type: "registration_started",
      pluginIds: processingOrder,
    });

    for (const pluginId of processingOrder) {
      const plugin = loadedPlugins[pluginId];
      if (plugin) {
        try {
          this.#pluginStatusSubject.next({
            type: "registering_plugin",
            pluginId,
          });
          this.registerPlugin(plugin);
          registeredPluginIds.add(pluginId);
          this.#pluginStatusSubject.next({
            type: "registered_plugin",
            pluginId,
          });
          if (plugin.initialize) {
            try {
              plugin.initialize(passedArguments);
            } catch (initError: any) {
              console.error(
                `[PluginManager] Error initializing plugin '${pluginId}':`,
                initError,
              );
              this.#pluginStatusSubject.next({
                type: "init_error",
                pluginId,
                error: initError,
              });
            }
          }
        } catch (regError: any) {
          console.error(
            `[PluginManager] Error registering plugin '${pluginId}':`,
            regError,
          );
          failedPluginIds.add(pluginId);
          this.#pluginStatusSubject.next({
            type: "register_error",
            pluginId,
            error: regError,
          });
        }
      }
    }

    const notFound = pluginIds.filter(
      (id: string) => !loadedPlugins[id] && !this.#pluginRegistry.has(id),
    );

    this.#pluginStatusSubject.next({
      type: "loading_complete",
      successfullyRegistered: [...registeredPluginIds],
      failed: [...failedPluginIds],
      notFound,
    });
  }

  /**
   * Retrieves all registered plugin definitions.
   * @returns {TeskooanoPlugin[]} An array of all registered plugin objects.
   */
  public getPlugins(): TeskooanoPlugin[] {
    return Array.from(this.#pluginRegistry.values());
  }

  /**
   * Retrieves the configuration for a specific panel component.
   * @param {string} componentName - The component name (custom element tag) of the panel.
   * @returns {PanelConfig | undefined} The panel's configuration or undefined if not found.
   */
  public getPanelConfig(componentName: string): PanelConfig | undefined {
    const registeredItem = this.#panelRegistry.get(componentName);
    if (!registeredItem) return undefined;
    const { pluginId, ...panelConfig } = registeredItem;
    return panelConfig as PanelConfig;
  }

  /**
   * Retrieves the configuration for a specific registered function.
   * @param {string} id - The unique identifier of the function.
   * @returns {FunctionConfig | undefined} The function's configuration or undefined if not found.
   */
  public getFunctionConfig(id: string): FunctionConfig | undefined {
    const registeredItem = this.#functionRegistry.get(id);
    if (!registeredItem) return undefined;
    const { pluginId, ...functionConfig } = registeredItem;
    return functionConfig as FunctionConfig;
  }

  /**
   * Executes a registered plugin function by its ID.
   * It automatically injects the necessary `PluginExecutionContext` (containing core APIs)
   * if the function configuration requires it.
   *
   * @param {string} functionId - The unique identifier of the function to execute.
   * @param {any} [args] - Optional arguments to pass to the function.
   * @returns {Promise<T> | T | undefined} The result of the function execution.
   * @throws Will throw an error if the function requires a dependency that has not been set,
   * or if the function itself throws an error during execution.
   */
  public execute<T = any>(
    functionId: string,
    args?: any,
  ): Promise<T> | T | undefined {
    const registeredItem = this.#functionRegistry.get(functionId);
    if (!registeredItem) {
      console.error(`[PluginManager] Function '${functionId}' not found.`);
      return undefined;
    }

    const requiresApi = registeredItem.dependencies?.dockView?.api;
    const requiresController =
      registeredItem.dependencies?.dockView?.controller;

    if (requiresApi && !this.#dockviewApi) {
      const message = `[PluginManager] Execution of function '${functionId}' prevented: It requires the Dockview API, which has not been set.`;
      console.error(message);
      throw new Error(message);
    }
    if (requiresController && !this.#dockviewController) {
      const message = `[PluginManager] Execution of function '${functionId}' prevented: It requires the Dockview Controller, which has not been set.`;
      console.error(message);
      throw new Error(message);
    }

    try {
      const context: PluginExecutionContext = {
        pluginManager: this,
        dockviewApi: this.#dockviewApi,
        dockviewController: this.#dockviewController,
        getManager: this.getManagerInstance.bind(this),
        executeFunction: this.execute.bind(this),
      };
      return registeredItem.execute(context, args);
    } catch (error) {
      console.error(
        `[PluginManager] Uncaught error executing function '${functionId}':`,
        error,
      );
      throw error;
    }
  }

  /**
   * Retrieves all registered toolbar items for a specific target, sorted by their `order` property.
   * @param {ToolbarTarget} target - The target toolbar ID (e.g., 'main-toolbar').
   * @returns {ToolbarItemConfig[]} An array of toolbar item configurations.
   */
  public getToolbarItemsForTarget(target: ToolbarTarget): ToolbarItemConfig[] {
    const registeredItems = this.#toolbarRegistry.get(target) || [];
    return registeredItems.map((item) => {
      const { pluginId, ...toolbarItem } = item;
      return toolbarItem as ToolbarItemConfig;
    });
  }

  /**
   * Retrieves all registered toolbar widget configurations for a specific target,
   * sorted by their `order` property.
   * @param {ToolbarTarget} target - The ID of the target toolbar.
   * @returns {ToolbarWidgetConfig[]} An array of sorted toolbar widget configurations.
   */
  public getToolbarWidgetsForTarget(
    target: ToolbarTarget,
  ): ToolbarWidgetConfig[] {
    // This is a simplified implementation. In a real-world scenario,
    // you might need a more complex registry for widgets if they also have dependencies.
    const allWidgets: ToolbarWidgetConfig[] = [];
    this.#pluginRegistry.forEach((plugin) => {
      if (plugin.toolbarWidgets) {
        allWidgets.push(
          ...plugin.toolbarWidgets.filter((widget) => widget.target === target),
        );
      }
    });
    return allWidgets.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  /**
   * Retrieves a singleton manager instance by its ID.
   * @template T
   * @param {string} id - The ID of the manager to retrieve.
   * @returns {T | undefined} The manager instance, or undefined if not found.
   */
  public getManagerInstance<T = any>(id: string): T | undefined {
    return this.#managerInstances.get(id)?.instance;
  }

  /**
   * Performs a topological sort of the plugins to determine the correct loading order.
   * This method recursively resolves dependencies and detects circular references.
   * It modifies the context object in place, populating `loadedPlugins` and `processingOrder`.
   * @param {Set<string>} allRequestedIds - A set of all plugin IDs that were initially requested to be loaded.
   * @param {object} context - An object containing the state needed for the sorting process.
   * @param {Record<string, () => Promise<any>>} context.loaders - The Vite-generated plugin loaders.
   * @param {Record<string, TeskooanoPlugin>} context.loadedPlugins - An object to be populated with loaded plugin modules.
   * @param {string[]} context.processingOrder - An array to be populated with the resolved loading order.
   * @private
   * @returns {Promise<void>}
   * @throws Will throw an error if a dependency is not found or a circular dependency is detected.
   */
  async #performTopologicalSort(
    allRequestedIds: Set<string>,
    context: {
      loaders: Record<string, () => Promise<any>>;
      loadedPlugins: Record<string, TeskooanoPlugin>;
      processingOrder: string[];
    },
  ): Promise<void> {
    const visited = new Set<string>();
    const processing = new Set<string>();

    const resolve = async (pluginId: string): Promise<void> => {
      if (processing.has(pluginId)) {
        throw new Error(
          `Circular dependency detected involving plugin: ${pluginId}`,
        );
      }
      if (visited.has(pluginId)) {
        return;
      }

      processing.add(pluginId);

      const loader = context.loaders[pluginId];
      if (!loader) {
        throw new Error(`Loader for plugin '${pluginId}' not found.`);
      }

      this.#pluginStatusSubject.next({ type: "loading_plugin", pluginId });
      const module = await loader();
      const plugin = module.plugin as TeskooanoPlugin;
      if (!plugin) {
        throw new Error(
          `Module for plugin '${pluginId}' does not have a 'plugin' export.`,
        );
      }
      this.#pluginStatusSubject.next({ type: "loaded_plugin", pluginId });
      context.loadedPlugins[pluginId] = plugin;

      if (plugin.dependencies) {
        for (const depId of plugin.dependencies) {
          if (!allRequestedIds.has(depId) && !this.#pluginRegistry.has(depId)) {
            this.#pluginStatusSubject.next({
              type: "dependency_error",
              pluginId,
              missingDependencies: [depId],
            });
            throw new Error(
              `Plugin '${pluginId}' has an unmet dependency: '${depId}' which was not requested for loading and is not already registered.`,
            );
          }
          if (!this.#pluginRegistry.has(depId)) {
            await resolve(depId);
          }
        }
      }

      processing.delete(pluginId);
      visited.add(pluginId);
      context.processingOrder.push(pluginId);
    };

    for (const id of allRequestedIds) {
      if (!this.#pluginRegistry.has(id)) {
        await resolve(id);
      }
    }
  }

  /**
   * Returns toolbar registrations that have unmet dependencies.
   * This is used by controllers that need to dynamically build their UI
   * and wait for initializers to complete.
   * @returns An array of toolbar registrations that are pending.
   */
  public getPendingToolbarRegistrations(): RegisteredItem<ToolbarRegistration>[] {
    return this.#pendingToolbarRegistrations;
  }
}

/**
 * The singleton instance of the PluginManager.
 * Use this instance to interact with the plugin system.
 */
export const pluginManager = PluginManager.getInstance();
