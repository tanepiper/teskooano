/// <reference types="vite/client" />
import type { DockviewApi } from "dockview-core";
import { Observable, Subject, BehaviorSubject } from "rxjs";
import {
  RegistrationManager,
  type PluginRegistries,
} from "./managers/registration.manager";
import { PluginLoader } from "./managers/plugin-loader.manager";
import { PluginExecutor } from "./managers/plugin-executor.manager";
import { HMRManager } from "./managers/hmr.manager";
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
  PluginManagerProxy,
} from "./types.js";

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
 * This class is now a lean orchestrator that delegates responsibilities
 * to specialized manager classes.
 *
 * @singleton
 */
class PluginManager implements PluginManagerProxy {
  #registries: PluginRegistries = {
    pluginRegistry: new Map<string, TeskooanoPlugin>(),
    panelRegistry: new Map<string, RegisteredItem<PanelConfig>>(),
    functionRegistry: new Map<string, RegisteredItem<FunctionConfig>>(),
    toolbarRegistry: new Map<
      ToolbarTarget,
      RegisteredItem<ToolbarItemConfig>[]
    >(),
    pendingToolbarRegistrations: [],
    managerInstances: new Map<string, RegisteredManager>(),
    componentRegistry: new Map<string, RegisteredItem<ComponentConfig>>(),
  };

  // Specialized managers
  #registrationManager: RegistrationManager;
  #pluginLoader: PluginLoader;
  #pluginExecutor: PluginExecutor;
  #hmrManager: HMRManager;

  #pluginStatusSubject = new Subject<PluginRegistrationStatus>();
  #pluginsChangedSubject = new BehaviorSubject<void>(undefined);

  public readonly pluginStatus$: Observable<PluginRegistrationStatus> =
    this.#pluginStatusSubject.asObservable();
  public readonly pluginsChanged$: Observable<void> =
    this.#pluginsChangedSubject.asObservable();

  private static instance: PluginManager;

  private constructor() {
    this.#registrationManager = new RegistrationManager(
      this.#registries as any,
    ); // Cast needed due to private fields
    
    this.#pluginLoader = new PluginLoader();
    
    this.#pluginExecutor = new PluginExecutor(
      this.#registries.functionRegistry,
      this.#registries.managerInstances,
    );
    
    this.#hmrManager = new HMRManager(
      this.#pluginLoader,
      this.#registrationManager,
      this.#registries.pluginRegistry,
    );

    // Set up HMR callbacks
    this.#hmrManager.setCallbacks({
      onPluginStatusChange: (status) => this.#pluginStatusSubject.next(status),
      onPluginsChanged: () => this.#pluginsChangedSubject.next(),
    });
  }

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  public setAppDependencies(deps: {
    dockviewApi: DockviewApi;
    dockviewController: any;
  }): void {
    this.#registrationManager.setDependencies({
      dockviewApi: deps.dockviewApi,
    });
    
    this.#pluginExecutor.setDependencies({
      dockviewApi: deps.dockviewApi,
      dockviewController: deps.dockviewController,
    });
  }

  public registerPlugin(plugin: TeskooanoPlugin): void {
    if (this.#registries.pluginRegistry.has(plugin.id)) {
      return;
    }
    this.#registries.pluginRegistry.set(plugin.id, plugin);
    this.#registrationManager.processPlugin(plugin);
    this.#pluginsChangedSubject.next();
  }

  public async reloadPlugin(pluginId: string): Promise<void> {
    return this.#hmrManager.reloadPlugin(pluginId);
  }

  public async unloadPlugin(pluginId: string): Promise<void> {
    return this.#hmrManager.unloadPlugin(pluginId);
  }

  public async loadAndRegisterPlugins(
    pluginIds: string[],
    passedArguments?: any,
  ): Promise<void> {
    const registeredPluginIds: Set<string> = new Set();
    const failedPluginIds: Set<string> = new Set();

    this.#pluginStatusSubject.next({
      type: "loading_started",
      pluginIds,
    });

    try {
      const alreadyRegistered = new Set(this.#registries.pluginRegistry.keys());
      const { loadedPlugins, processingOrder } =
        await this.#pluginLoader.loadPlugins(pluginIds, alreadyRegistered);

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
                await plugin.initialize(passedArguments);
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
        (id: string) =>
          !loadedPlugins[id] && !this.#registries.pluginRegistry.has(id),
      );

      this.#pluginStatusSubject.next({
        type: "loading_complete",
        successfullyRegistered: [...registeredPluginIds],
        failed: [...failedPluginIds],
        notFound,
      });
    } catch (error: any) {
      this.#pluginStatusSubject.next({
        type: "load_error",
        pluginId: "unknown",
        error,
      });
      throw error;
    }
  }



  public getPlugins(): TeskooanoPlugin[] {
    return Array.from(this.#registries.pluginRegistry.values());
  }

  public getPanelConfig(componentName: string): PanelConfig | undefined {
    const registeredItem = this.#registries.panelRegistry.get(componentName);
    if (!registeredItem) return undefined;
    const { pluginId, ...panelConfig } = registeredItem;
    return panelConfig as PanelConfig;
  }

  public getFunctionConfig(id: string): FunctionConfig | undefined {
    const registeredItem = this.#registries.functionRegistry.get(id);
    if (!registeredItem) return undefined;
    const { pluginId, ...functionConfig } = registeredItem;
    return functionConfig as FunctionConfig;
  }

  public execute<T = any>(
    functionId: string,
    args?: any,
  ): Promise<T> | T | undefined {
    return this.#pluginExecutor.execute<T>(functionId, args);
  }

  public getToolbarItemsForTarget(target: ToolbarTarget): ToolbarItemConfig[] {
    const registeredItems = this.#registries.toolbarRegistry.get(target) || [];
    return registeredItems.map((item) => {
      const { pluginId, ...toolbarItem } = item;
      return toolbarItem as ToolbarItemConfig;
    });
  }

  public getToolbarWidgetsForTarget(
    target: ToolbarTarget,
  ): ToolbarWidgetConfig[] {
    const allWidgets: ToolbarWidgetConfig[] = [];
    this.#registries.pluginRegistry.forEach((plugin) => {
      if (plugin.toolbarWidgets) {
        allWidgets.push(
          ...plugin.toolbarWidgets.filter((widget) => widget.target === target),
        );
      }
    });
    return allWidgets.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  public getManagerInstance<T = any>(id: string): T | undefined {
    return this.#pluginExecutor.getManagerInstance<T>(id);
  }

  public getPendingToolbarRegistrations(): RegisteredItem<ToolbarRegistration>[] {
    return this.#registries.pendingToolbarRegistrations;
  }
}

export const pluginManager = PluginManager.getInstance();
