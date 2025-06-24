import type { TeskooanoPlugin } from "../types";
import { pluginLoaders } from "virtual:teskooano-loaders";

/**
 * Handles plugin loading and dependency resolution.
 * Responsible for the complex topological sorting and loading logic.
 */
export class PluginLoader {
  /**
   * Loads plugins with proper dependency resolution using topological sorting.
   * @param pluginIds Array of plugin IDs to load
   * @param alreadyRegistered Set of already registered plugin IDs to avoid reloading
   * @returns Object containing loaded plugins and processing order
   */
  public async loadPlugins(
    pluginIds: string[],
    alreadyRegistered: Set<string> = new Set(),
  ): Promise<{
    loadedPlugins: Record<string, TeskooanoPlugin>;
    processingOrder: string[];
  }> {
    const loaders = pluginLoaders as Record<string, () => Promise<any>>;
    const loadedPlugins: Record<string, TeskooanoPlugin> = {};
    const allRequestedIds = new Set(pluginIds);
    const processingOrder: string[] = [];

    try {
      await this.performTopologicalSort(allRequestedIds, {
        loaders,
        loadedPlugins,
        processingOrder,
        alreadyRegistered,
      });

      return { loadedPlugins, processingOrder };
    } catch (error: any) {
      const failedId =
        processingOrder.find((id) => !loadedPlugins[id]) || "unknown";
      throw new Error(
        `Failed to load plugin '${failedId}': ${error.message}`,
      );
    }
  }

  /**
   * Performs topological sort to resolve plugin dependencies.
   */
  private async performTopologicalSort(
    allRequestedIds: Set<string>,
    context: {
      loaders: Record<string, () => Promise<any>>;
      loadedPlugins: Record<string, TeskooanoPlugin>;
      processingOrder: string[];
      alreadyRegistered: Set<string>;
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
      if (!loader) {
        throw new Error(`Loader for plugin '${pluginId}' not found.`);
      }

      const module = await loader();
      const plugin = module.plugin as TeskooanoPlugin;
      context.loadedPlugins[pluginId] = plugin;

      if (plugin.dependencies) {
        for (const depId of plugin.dependencies) {
          if (
            !allRequestedIds.has(depId) &&
            !context.alreadyRegistered.has(depId)
          ) {
            throw new Error(
              `Plugin '${pluginId}' has an unmet dependency: '${depId}'`,
            );
          }
          if (!context.alreadyRegistered.has(depId)) {
            await resolve(depId);
          }
        }
      }

      processing.delete(pluginId);
      visited.add(pluginId);
      context.processingOrder.push(pluginId);
    };

    for (const id of allRequestedIds) {
      if (!context.alreadyRegistered.has(id)) {
        await resolve(id);
      }
    }
  }
}