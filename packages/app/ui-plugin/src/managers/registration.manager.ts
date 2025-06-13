import type { DockviewApi } from "dockview-core";
import type {
  ComponentConfig,
  FunctionConfig,
  PanelConfig,
  RegisteredItem,
  TeskooanoPlugin,
  ToolbarItemConfig,
  ToolbarRegistration,
  ToolbarTarget,
} from "../types";

/**
 * A type representing the collection of registries managed by the PluginManager.
 * @internal
 */
export type PluginRegistries = {
  pluginRegistry: Map<string, TeskooanoPlugin>;
  panelRegistry: Map<string, RegisteredItem<PanelConfig>>;
  functionRegistry: Map<string, RegisteredItem<FunctionConfig>>;
  toolbarRegistry: Map<ToolbarTarget, RegisteredItem<ToolbarItemConfig>[]>;
  pendingToolbarRegistrations: RegisteredItem<ToolbarRegistration>[];
  managerInstances: Map<string, { instance: any; pluginId: string }>;
  componentRegistry: Map<string, RegisteredItem<ComponentConfig>>;
};

/**
 * Manages the registration of all plugin contributions.
 * This class is instantiated by the main PluginManager and operates on its registries.
 */
export class RegistrationManager {
  #registries: PluginRegistries;
  #dockviewApi: DockviewApi | null = null;

  constructor(registries: PluginRegistries) {
    this.#registries = registries;
  }

  public setDependencies(deps: { dockviewApi: DockviewApi | null }) {
    this.#dockviewApi = deps.dockviewApi;
  }

  /**
   * Processes and registers all contributions from a single plugin.
   * @param plugin The plugin to register.
   */
  public processPlugin(plugin: TeskooanoPlugin): void {
    this.registerPanels(plugin);
    this.registerFunctions(plugin);
    this.registerToolbarItems(plugin);
    this.registerManagerClasses(plugin);
    this.registerComponents(plugin);
  }

  private registerPanels(plugin: TeskooanoPlugin): void {
    plugin.panels?.forEach((panelConfig) => {
      if (this.#registries.panelRegistry.has(panelConfig.componentName)) {
        console.warn(
          `[PluginManager] Panel component name '${panelConfig.componentName}' from plugin '${plugin.id}' already registered by another plugin. Skipping panel registration.`,
        );
      } else {
        this.#registries.panelRegistry.set(panelConfig.componentName, {
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
          `[HMR] Custom element '${componentName}' from plugin '${plugin.id}' is already defined. A full page reload may be required to see changes.`,
        );
      }
    });
  }

  private registerFunctions(plugin: TeskooanoPlugin): void {
    plugin.functions?.forEach((funcConfig) => {
      if (this.#registries.functionRegistry.has(funcConfig.id)) {
        return;
      }
      this.#registries.functionRegistry.set(funcConfig.id, {
        ...funcConfig,
        pluginId: plugin.id,
      });
    });
  }

  private processPendingToolbarItems(): void {
    const stillPending: RegisteredItem<ToolbarRegistration>[] = [];
    this.#registries.pendingToolbarRegistrations.forEach(
      (pendingRegistration) => {
        const initializers = pendingRegistration.items
          ?.flatMap((item) => item.dependencies?.initializers)
          .filter((id): id is string => !!id);

        let allDepsMet = true;
        if (initializers && initializers.length > 0) {
          for (const initId of initializers) {
            if (!this.#registries.functionRegistry.has(initId)) {
              allDepsMet = false;
              break;
            }
          }
        }

        if (allDepsMet) {
          this.addToolbarRegistration(pendingRegistration);
        } else {
          stillPending.push(pendingRegistration);
        }
      },
    );
    this.#registries.pendingToolbarRegistrations = stillPending;
  }

  private addToolbarRegistration(
    registration: RegisteredItem<ToolbarRegistration>,
  ): void {
    const target = registration.target;
    if (!this.#registries.toolbarRegistry.has(target)) {
      this.#registries.toolbarRegistry.set(target, []);
    }
    const targetItems = this.#registries.toolbarRegistry.get(target)!;

    if (registration.items) {
      const itemsWithPluginId = registration.items.map((item) => ({
        ...item,
        target: target,
        pluginId: registration.pluginId,
      }));
      targetItems.push(
        ...(itemsWithPluginId as RegisteredItem<ToolbarItemConfig>[]),
      );
    }
    targetItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  private registerToolbarItems(plugin: TeskooanoPlugin): void {
    plugin.toolbarRegistrations?.forEach((registration) => {
      this.#registries.pendingToolbarRegistrations.push({
        ...registration,
        pluginId: plugin.id,
      });
    });

    this.processPendingToolbarItems();
  }

  private registerManagerClasses(plugin: TeskooanoPlugin): void {
    plugin.managerClasses?.forEach((managerConfig) => {
      if (this.#registries.managerInstances.has(managerConfig.id)) {
        return;
      }
      try {
        const ManagerClass = managerConfig.managerClass;
        const instance = new ManagerClass();
        this.#registries.managerInstances.set(managerConfig.id, {
          instance,
          pluginId: plugin.id,
        });

        if (
          typeof instance.setDependencies === "function" &&
          this.#dockviewApi
        ) {
          instance.setDependencies({ dockviewApi: this.#dockviewApi });
        }
      } catch (error) {
        console.error(
          `[PluginManager] Failed to instantiate manager '${managerConfig.id}' from plugin '${plugin.id}':`,
          error,
        );
      }
    });
  }

  private registerComponents(plugin: TeskooanoPlugin): void {
    plugin.components?.forEach((componentConfig) => {
      this.#registries.componentRegistry.set(componentConfig.tagName, {
        ...componentConfig,
        pluginId: plugin.id,
      });
      if (customElements.get(componentConfig.tagName)) {
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

  public unregisterPluginItems(pluginId: string) {
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
      });
    };

    unregister(this.#registries.panelRegistry, "Panel");
    unregister(this.#registries.functionRegistry, "Function");
    unregister(this.#registries.componentRegistry, "Component");

    for (const target of this.#registries.toolbarRegistry.keys()) {
      const items = this.#registries.toolbarRegistry.get(target) || [];
      const remainingItems = items.filter((item) => item.pluginId !== pluginId);
      this.#registries.toolbarRegistry.set(target, remainingItems);
    }

    const managersToRemove = [...this.#registries.managerInstances.entries()]
      .filter(([, manager]) => manager.pluginId === pluginId)
      .map(([key]) => key);

    managersToRemove.forEach((key) =>
      this.#registries.managerInstances.delete(key),
    );
  }
}
