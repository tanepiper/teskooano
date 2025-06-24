/// <reference types="vite/client" />
import type { TeskooanoPlugin } from "../types";
import type { PluginLoader } from "./plugin-loader.manager";
import type { RegistrationManager } from "./registration.manager";

/**
 * Handles Hot Module Replacement (HMR) functionality for plugins.
 * Manages the reload/unload/dispose lifecycle during development.
 */
export class HMRManager {
  private pluginLoader: PluginLoader;
  private registrationManager: RegistrationManager;
  private pluginRegistry: Map<string, TeskooanoPlugin>;
  private onPluginStatusChange?: (status: any) => void;
  private onPluginsChanged?: () => void;

  constructor(
    pluginLoader: PluginLoader,
    registrationManager: RegistrationManager,
    pluginRegistry: Map<string, TeskooanoPlugin>,
  ) {
    this.pluginLoader = pluginLoader;
    this.registrationManager = registrationManager;
    this.pluginRegistry = pluginRegistry;

    this.setupHMRListeners();
  }

  /**
   * Sets up callbacks for status changes and plugin updates.
   */
  public setCallbacks(callbacks: {
    onPluginStatusChange?: (status: any) => void;
    onPluginsChanged?: () => void;
  }): void {
    this.onPluginStatusChange = callbacks.onPluginStatusChange;
    this.onPluginsChanged = callbacks.onPluginsChanged;
  }

  /**
   * Sets up HMR listeners if running in development mode.
   */
  private setupHMRListeners(): void {
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

  /**
   * Reloads a plugin by unloading it and then loading it again.
   * @param pluginId The ID of the plugin to reload
   */
  public async reloadPlugin(pluginId: string): Promise<void> {
    this.emitStatus({ type: "reloading", pluginId });

    try {
      await this.unloadPlugin(pluginId);
      await this.loadAndRegisterPlugin(pluginId);
      this.emitStatus({ type: "reloaded", pluginId });
    } catch (error) {
      this.emitStatus({ type: "reload_error", pluginId, error });
      throw error;
    }
  }

  /**
   * Unloads a plugin, calling its dispose method and removing all registrations.
   * @param pluginId The ID of the plugin to unload
   */
  public async unloadPlugin(pluginId: string): Promise<void> {
    this.emitStatus({ type: "unloading", pluginId });

    const plugin = this.pluginRegistry.get(pluginId);
    if (!plugin) {
      this.emitStatus({ type: "not_found", pluginId });
      return;
    }

    // Call dispose method if it exists
    if (typeof plugin.dispose === "function") {
      this.emitStatus({ type: "disposing", pluginId });
      try {
        await plugin.dispose();
        this.emitStatus({ type: "disposed", pluginId });
      } catch (error) {
        this.emitStatus({ type: "dispose_error", pluginId, error });
        console.error(
          `[HMRManager] Error disposing plugin '${pluginId}':`,
          error,
        );
      }
    }

    // Remove all plugin registrations
    this.registrationManager.unregisterPluginItems(pluginId);
    this.pluginRegistry.delete(pluginId);

    this.emitPluginsChanged();
    this.emitStatus({ type: "unloaded", pluginId });
  }

  /**
   * Loads and registers a single plugin.
   * @param pluginId The ID of the plugin to load
   */
  private async loadAndRegisterPlugin(pluginId: string): Promise<void> {
    try {
      const alreadyRegistered = new Set(this.pluginRegistry.keys());
      const { loadedPlugins, processingOrder } =
        await this.pluginLoader.loadPlugins([pluginId], alreadyRegistered);

      for (const id of processingOrder) {
        const plugin = loadedPlugins[id];
        if (plugin) {
          this.emitStatus({ type: "registering", pluginId: id });
          this.pluginRegistry.set(id, plugin);
          this.registrationManager.processPlugin(plugin);
          this.emitStatus({ type: "registered", pluginId: id });

          // Call initialize method if it exists
          if (plugin.initialize) {
            try {
              await plugin.initialize();
            } catch (initError) {
              this.emitStatus({ type: "init_error", pluginId: id, initError });
              console.error(
                `[HMRManager] Error initializing plugin '${id}':`,
                initError,
              );
            }
          }
        }
      }

      this.emitPluginsChanged();
    } catch (error) {
      this.emitStatus({ type: "load_error", pluginId, error });
      throw error;
    }
  }

  /**
   * Emits a status change event.
   */
  private emitStatus(status: any): void {
    this.onPluginStatusChange?.(status);
  }

  /**
   * Emits a plugins changed event.
   */
  private emitPluginsChanged(): void {
    this.onPluginsChanged?.();
  }
}
