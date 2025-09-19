import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import { ActionMenuComponent } from "./view";
import { type ActionMenuConfig } from "./controller";

/**
 * Manages the lifecycle of multiple {@link ActionMenuComponent} instances.
 * This class provides a centralized way to create and manage slot-based action menus
 * that are associated with specific targets (like celestial rows or toolbar areas).
 *
 * This class is designed to be a singleton, instantiated via the
 * `action-menu:initialize` plugin function, which provides the
 * required {@link PluginExecutionContext}.
 */
export class ActionMenuManager {
  private activeMenus: Map<string, ActionMenuComponent> = new Map();
  private menuConfigs: Map<string, ActionMenuConfig> = new Map();

  /**
   * Initializes a new instance of the ActionMenuManager.
   * @param _context - The plugin execution context from the PluginManager (unused in slot-based approach).
   * @remark This constructor should only be called by its initialization function.
   */
  constructor(_context: PluginExecutionContext) {
    // Context is kept for compatibility with plugin system but not used in slot-based approach
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
}
