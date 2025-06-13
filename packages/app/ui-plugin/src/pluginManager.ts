/// <reference types="vite/client" />
import type { DockviewApi } from "dockview-core";
import { Observable, Subject, BehaviorSubject } from "rxjs";
import {
  RegistrationManager,
  type PluginRegistries,
} from "./managers/registration.manager";
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

  #registrationManager: RegistrationManager;
  #dockviewApi: DockviewApi | null = null;
  #dockviewController: any | null = null;

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
    if (import.meta.hot) {
      import.meta.hot.on(
        "teskooano-plugin-update",
        (data: { pluginId: string }) => {
          if (data.pluginId) {
            this.reloadPlugin(data.pluginId);
          }
        },
      );
    }
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
    this.#dockviewApi = deps.dockviewApi;
    this.#dockviewController = deps.dockviewController;
    this.#registrationManager.setDependencies({
      dockviewApi: this.#dockviewApi,
    });
    // Additional logic to update dependencies in already instantiated managers
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
    await this.unloadPlugin(pluginId);
    await this.loadAndRegisterPlugins([pluginId]);
  }

  public async unloadPlugin(pluginId: string): Promise<void> {
    this.#pluginStatusSubject.next({ type: "unloading", pluginId });
    const plugin = this.#registries.pluginRegistry.get(pluginId);
    if (!plugin) {
      return;
    }

    if (typeof plugin.dispose === "function") {
      this.#pluginStatusSubject.next({ type: "disposing", pluginId });
      try {
        plugin.dispose();
        this.#pluginStatusSubject.next({ type: "disposed", pluginId });
      } catch (error) {
        this.#pluginStatusSubject.next({
          type: "dispose_error",
          pluginId,
          error,
        });
      }
    }

    this.#registrationManager.unregisterPluginItems(pluginId);
    this.#registries.pluginRegistry.delete(pluginId);
    this.#pluginsChangedSubject.next();
    this.#pluginStatusSubject.next({ type: "unloaded", pluginId });
  }

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
      const failedId =
        processingOrder.find((id) => !loadedPlugins[id]) || "unknown";
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
      (id: string) =>
        !loadedPlugins[id] && !this.#registries.pluginRegistry.has(id),
    );

    this.#pluginStatusSubject.next({
      type: "loading_complete",
      successfullyRegistered: [...registeredPluginIds],
      failed: [...failedPluginIds],
      notFound,
    });
  }

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
      if (visited.has(pluginId)) return;
      processing.add(pluginId);

      const loader = context.loaders[pluginId];
      if (!loader)
        throw new Error(`Loader for plugin '${pluginId}' not found.`);
      const module = await loader();
      const plugin = module.plugin as TeskooanoPlugin;
      context.loadedPlugins[pluginId] = plugin;

      if (plugin.dependencies) {
        for (const depId of plugin.dependencies) {
          if (
            !allRequestedIds.has(depId) &&
            !this.#registries.pluginRegistry.has(depId)
          ) {
            throw new Error(
              `Plugin '${pluginId}' has an unmet dependency: '${depId}'`,
            );
          }
          if (!this.#registries.pluginRegistry.has(depId)) {
            await resolve(depId);
          }
        }
      }
      processing.delete(pluginId);
      visited.add(pluginId);
      context.processingOrder.push(pluginId);
    };

    for (const id of allRequestedIds) {
      if (!this.#registries.pluginRegistry.has(id)) {
        await resolve(id);
      }
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
    const funcConfig = this.#registries.functionRegistry.get(functionId);
    if (!funcConfig) {
      console.error(`[PluginManager] Function '${functionId}' not found.`);
      return undefined;
    }
    const context: PluginExecutionContext = {
      pluginManager: this,
      dockviewApi: this.#dockviewApi,
      dockviewController: this.#dockviewController,
      getManager: this.getManagerInstance.bind(this),
      executeFunction: this.execute.bind(this),
    };
    return funcConfig.execute(context, args);
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
    return this.#registries.managerInstances.get(id)?.instance;
  }

  public getPendingToolbarRegistrations(): RegisteredItem<ToolbarRegistration>[] {
    return this.#registries.pendingToolbarRegistrations;
  }
}

export const pluginManager = PluginManager.getInstance();
