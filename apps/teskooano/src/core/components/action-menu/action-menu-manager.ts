import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import { ActionMenuComponent, ActionMenuFactory } from "./view";
import { ActionMenuItem, type ActionMenuConfig } from "./controller";

/**
 * Manages the lifecycle of multiple {@link ActionMenuComponent} instances.
 * This class acts as a factory and state manager for action menus that are
 * associated with specific targets (like celestial rows or toolbar areas).
 *
 * This class is designed to be a singleton, instantiated via the
 * `action-menu:initialize` plugin function, which provides the
 * required {@link PluginExecutionContext}.
 */
export class ActionMenuManager {
  private activeMenus: Map<string, ActionMenuComponent> = new Map();
  private menuConfigs: Map<string, ActionMenuConfig> = new Map();
  private menuFactories: Map<string, ActionMenuFactory> = new Map();
  private _context: PluginExecutionContext;

  /**
   * Initializes a new instance of the ActionMenuManager.
   * @param context - The plugin execution context from the PluginManager.
   * @remark This constructor should only be called by its initialization function.
   */
  constructor(context: PluginExecutionContext) {
    this._context = context;
  }

  /**
   * Creates a factory for a specific menu type with base configuration.
   * @param factoryId - Unique identifier for the factory.
   * @param baseConfig - Base configuration for all menus created by this factory.
   * @returns The created factory instance.
   */
  public createFactory(
    factoryId: string,
    baseConfig: ActionMenuConfig = {},
  ): ActionMenuFactory {
    const factory = new ActionMenuFactory(baseConfig);

    // Set plugin manager for plugin integration
    factory.setPluginManager(this._context.pluginManager);

    this.menuFactories.set(factoryId, factory);
    return factory;
  }

  /**
   * Gets a factory by ID.
   * @param factoryId - The unique identifier of the factory.
   * @returns The factory instance, or undefined if not found.
   */
  public getFactory(factoryId: string): ActionMenuFactory | undefined {
    return this.menuFactories.get(factoryId);
  }

  /**
   * Creates and registers a new action menu for a specific target.
   * If a menu for the given ID already exists, it returns the existing instance.
   * @param menuId - A unique identifier for the menu instance.
   * @param parentElement - The HTML element to which the menu will be appended.
   * @param config - Configuration for the action menu.
   * @returns The created or existing {@link ActionMenuComponent} instance, or null on failure.
   */
  public createMenuForTarget(
    menuId: string,
    parentElement: HTMLElement,
    config: ActionMenuConfig = {},
  ): ActionMenuComponent | null {
    if (this.activeMenus.has(menuId)) {
      console.warn(
        `[ActionMenuManager] Menu already exists for ${menuId}. Returning existing instance.`,
      );
      return this.activeMenus.get(menuId) || null;
    }

    try {
      const newMenu = new ActionMenuComponent();
      newMenu.setAttribute("instance-id", menuId);

      // Apply configuration
      newMenu.setConfig(config);

      // Set plugin manager context for plugin integration
      newMenu.setPluginManager(this._context.pluginManager);

      // Store configuration for later reference
      this.menuConfigs.set(menuId, config);

      this.activeMenus.set(menuId, newMenu);

      // If parentElement is a web component with a shadowRoot, append to the shadowRoot.
      // Otherwise, append to the parentElement directly.
      const targetContainer =
        parentElement.shadowRoot instanceof ShadowRoot
          ? parentElement.shadowRoot
          : parentElement;
      targetContainer.appendChild(newMenu);

      return newMenu;
    } catch (error) {
      console.error(
        `[ActionMenuManager] Failed to create menu for ${menuId}:`,
        error,
      );

      return null;
    }
  }

  /**
   * Creates a hierarchy action menu factory with default configuration.
   * @returns A factory configured for hierarchy menus.
   */
  public createHierarchyFactory(): ActionMenuFactory {
    return this.createFactory("hierarchy", {
      buttonSize: "xs",
      direction: "right",
      closeOnAction: false,
      toggleTitle: "More Options",
    });
  }

  /**
   * Creates a celestial action menu factory with default configuration.
   * @returns A factory configured for celestial object menus.
   */
  public createCelestialFactory(): ActionMenuFactory {
    return this.createFactory("celestial", {
      buttonSize: "xs",
      direction: "right",
      closeOnAction: false,
      toggleTitle: "Celestial Actions",
    });
  }

  /**
   * Creates a toolbar action menu factory with default configuration.
   * @returns A factory configured for toolbar menus.
   */
  public createToolbarFactory(): ActionMenuFactory {
    return this.createFactory("toolbar", {
      buttonSize: "sm",
      direction: "bottom",
      closeOnAction: true,
      toggleTitle: "More Tools",
    });
  }

  /**
   * Disposes and cleans up a menu associated with a given ID.
   * This removes the menu from the DOM and releases any related resources.
   * @param menuId - The unique identifier of the menu to dispose.
   */
  public disposeMenuForTarget(menuId: string): void {
    const menuInstance = this.activeMenus.get(menuId);

    if (menuInstance) {
      try {
        menuInstance.remove();
        this.activeMenus.delete(menuId);
        this.menuConfigs.delete(menuId);
      } catch (error) {
        console.error(
          `[ActionMenuManager] Error disposing menu for ${menuId}:`,
          error,
        );
      }
    } else {
      console.warn(
        `[ActionMenuManager] Menu not found for disposal: ${menuId}`,
      );
    }
  }

  /**
   * Gets an existing menu instance by ID.
   * @param menuId - The unique identifier of the menu.
   * @returns The menu instance, or undefined if not found.
   */
  public getMenu(menuId: string): ActionMenuComponent | undefined {
    return this.activeMenus.get(menuId);
  }

  /**
   * Updates the configuration for a specific menu.
   * @param menuId - The unique identifier of the menu.
   * @param config - The new configuration to apply.
   */
  public updateMenuConfig(
    menuId: string,
    config: Partial<ActionMenuConfig>,
  ): void {
    const menu = this.activeMenus.get(menuId);
    if (menu) {
      menu.setConfig(config);

      // Update stored configuration
      const existingConfig = this.menuConfigs.get(menuId) || {};
      this.menuConfigs.set(menuId, { ...existingConfig, ...config });
    } else {
      console.warn(
        `[ActionMenuManager] Menu not found for config update: ${menuId}`,
      );
    }
  }

  /**
   * Sets actions for a specific menu.
   * @param menuId - The unique identifier of the menu.
   * @param actions - The actions to set.
   */
  public setMenuActions(menuId: string, actions: ActionMenuItem[]): void {
    const menu = this.activeMenus.get(menuId);
    if (menu) {
      menu.setActions(actions);
    } else {
      console.warn(
        `[ActionMenuManager] Menu not found for action update: ${menuId}`,
      );
    }
  }

  /**
   * Adds an action to a specific menu.
   * @param menuId - The unique identifier of the menu.
   * @param action - The action to add.
   */
  public addMenuAction(menuId: string, action: ActionMenuItem): void {
    const menu = this.activeMenus.get(menuId);
    if (menu) {
      menu.addAction(action);
    } else {
      console.warn(
        `[ActionMenuManager] Menu not found for action add: ${menuId}`,
      );
    }
  }

  /**
   * Removes an action from a specific menu.
   * @param menuId - The unique identifier of the menu.
   * @param actionId - The ID of the action to remove.
   */
  public removeMenuAction(menuId: string, actionId: string): void {
    const menu = this.activeMenus.get(menuId);
    if (menu) {
      menu.removeAction(actionId);
    } else {
      console.warn(
        `[ActionMenuManager] Menu not found for action remove: ${menuId}`,
      );
    }
  }

  /**
   * Gets all active menu IDs.
   * @returns An array of active menu IDs.
   */
  public getActiveMenuIds(): string[] {
    return Array.from(this.activeMenus.keys());
  }

  /**
   * Gets the count of active menus.
   * @returns The number of active menus.
   */
  public getActiveMenuCount(): number {
    return this.activeMenus.size;
  }

  /**
   * Gets all factory IDs.
   * @returns An array of factory IDs.
   */
  public getFactoryIds(): string[] {
    return Array.from(this.menuFactories.keys());
  }
}
