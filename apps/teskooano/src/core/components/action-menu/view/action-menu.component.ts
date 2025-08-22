import { ActionMenuController } from "../controller/action-menu.controller.js";
import {
  type ActionMenuConfig,
  type ActionMenuItem,
} from "../controller/types.js";
import { template } from "./action-menu.template.js";

/**
 * Custom element for a configurable action menu.
 *
 * @attr button-size - The size of buttons in the menu (xs, sm, md, lg)
 * @attr direction - The direction the menu appears (left, right, top, bottom)
 * @attr close-on-action - Whether to close menu when action is clicked (true/false)
 * @attr toggle-title - The title for the toggle button
 * @attr instance-id - The unique instance ID for this menu
 * @attr icon - The SVG icon to use for the toggle button (defaults to more horizontal icon)
 *
 * @fires action-triggered - Dispatched when an action is clicked
 */
export class ActionMenuComponent extends HTMLElement {
  static readonly componentName = "teskooano-action-menu";
  static readonly observedAttributes = [
    "button-size",
    "direction",
    "close-on-action",
    "toggle-title",
    "instance-id",
    "icon",
  ];

  private _controller: ActionMenuController;
  private _instanceId: string;
  private _pluginManager: any = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Get instance ID from attribute or generate one
    this._instanceId =
      this.getAttribute("instance-id") || this._generateInstanceId();

    // Get configuration from attributes
    const config: ActionMenuConfig = {
      buttonSize: (this.getAttribute("button-size") as any) || "xs",
      direction: (this.getAttribute("direction") as any) || "right",
      closeOnAction: this.getAttribute("close-on-action") === "true",
      toggleTitle: this.getAttribute("toggle-title") || "Celestial Actions",
      toggleIconSvg: this.getAttribute("icon") || undefined,
    };

    // Create controller with instance ID
    this._controller = new ActionMenuController(this, this._instanceId, config);

    // Initialize icon if provided
    if (config.toggleIconSvg) {
      this._updateIcon(config.toggleIconSvg);
    }
    this._controller.actionTriggered$.subscribe(
      ({ action, event, instanceId }) => {
        this.dispatchEvent(
          new CustomEvent("action-triggered", {
            bubbles: true,
            composed: true,
            detail: { action, event, instanceId },
          }),
        );
      },
    );
  }

  /**
   * Gets the instance ID of this menu.
   */
  public get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Sets the configuration for the action menu.
   */
  public setConfig(config: Partial<ActionMenuConfig>): void {
    this._controller.setConfig(config);
  }

  /**
   * Sets the actions to display in the menu.
   */
  public setActions(actions: ActionMenuItem[]): void {
    this._controller.setActions(actions);
  }

  /**
   * Sets the plugin manager context for this action menu.
   * This allows the menu to fetch and display plugin-registered actions.
   */
  public setPluginManager(pluginManager: any): void {
    this._pluginManager = pluginManager;
  }

  /**
   * Sets the actions and integrates plugin-registered actions for the action-menu target.
   * This combines built-in actions with plugin-registered actions.
   */
  public setActionsWithPlugins(actions: ActionMenuItem[]): void {
    // Get plugin-registered actions for the action-menu target
    const pluginActions = this._getPluginActions();

    // Combine built-in actions with plugin actions
    const allActions = [...actions, ...pluginActions];

    console.log(allActions);

    this._controller.setActions(allActions);
  }

  /**
   * Gets plugin-registered actions for the action-menu target.
   */
  private _getPluginActions(): ActionMenuItem[] {
    try {
      if (!this._pluginManager) {
        return [];
      }

      // Get toolbar items for the action-menu target
      const toolbarItems =
        this._pluginManager.getToolbarItemsForTarget("action-menu");

      if (!toolbarItems || toolbarItems.length === 0) {
        return [];
      }

      // Convert toolbar items to ActionMenuItem format
      const pluginActions: ActionMenuItem[] = toolbarItems
        .filter((item: any) => item.type === "function") // Only function-type items
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.tooltipText || "Plugin Action",
          iconSvg: item.iconSvg || "",
          active: false,
          disabled: false,
          action: async () => {
            try {
              await this._pluginManager.execute(item.functionId);
            } catch (error) {
              console.error(
                `[ActionMenuComponent] Error executing plugin action ${item.id}:`,
                error,
              );
            }
          },
        }));

      return pluginActions;
    } catch (error) {
      console.warn(
        "[ActionMenuComponent] Error getting plugin actions:",
        error,
      );
      return [];
    }
  }

  /**
   * Adds a single action to the menu.
   */
  public addAction(action: ActionMenuItem): void {
    this._controller.addAction(action);
  }

  /**
   * Removes an action from the menu by ID.
   */
  public removeAction(actionId: string): void {
    this._controller.removeAction(actionId);
  }

  /**
   * Updates the active state of an action.
   */
  public setActionActive(actionId: string, active: boolean): void {
    this._controller.setActionActive(actionId, active);
  }

  /**
   * Updates the disabled state of an action.
   */
  public setActionDisabled(actionId: string, disabled: boolean): void {
    this._controller.setActionDisabled(actionId, disabled);
  }

  /**
   * Opens the menu.
   */
  public openMenu(): void {
    this._controller.openMenu();
  }

  /**
   * Closes the menu.
   */
  public closeMenu(): void {
    this._controller.closeMenu();
  }

  /**
   * Toggles the menu open/closed state.
   */
  public toggleMenu(): void {
    this._controller.toggleMenu();
  }

  /**
   * Gets the current expanded state.
   */
  public get isExpanded(): boolean {
    return this._controller.isExpanded;
  }

  /**
   * Gets the controller instance for advanced usage.
   */
  public get controller(): ActionMenuController {
    return this._controller;
  }

  /**
   * Handles attribute changes.
   */
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) return;

    switch (name) {
      case "instance-id":
        if (newValue) {
          this._instanceId = newValue;
          // Update the controller's instance ID
          this._controller.updateInstanceId(newValue);
        }
        break;
      case "icon":
        this._updateIcon(newValue);
        break;
      case "toggle-title":
        this._updateTitle(newValue);
        break;
      case "button-size":
      case "direction":
      case "close-on-action":
        // Recreate controller with new config
        this._controller.setConfig({
          buttonSize: (this.getAttribute("button-size") as any) || "xs",
          direction: (this.getAttribute("direction") as any) || "right",
          closeOnAction: this.getAttribute("close-on-action") === "true",
          toggleTitle: this.getAttribute("toggle-title") || "More Options",
          toggleIconSvg: this.getAttribute("icon") || undefined,
        });
        break;
    }
  }

  /**
   * Updates the toggle button icon.
   */
  private _updateIcon(iconSvg: string | null): void {
    const iconElement = this.shadowRoot?.getElementById("menu-icon");
    if (iconElement) {
      iconElement.innerHTML = iconSvg || "";
    }
  }

  /**
   * Updates the toggle button title.
   */
  private _updateTitle(title: string | null): void {
    const buttonElement = this.shadowRoot?.getElementById("menu-toggle-btn");
    if (buttonElement) {
      buttonElement.setAttribute("title", title || "More Options");
    }
  }

  /**
   * Cleanup when element is removed.
   */
  disconnectedCallback(): void {
    this._controller.dispose();
  }

  /**
   * Generates a unique instance ID.
   */
  private _generateInstanceId(): string {
    return `action-menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function for creating Action Menu instances with specific configurations.
 * This allows for creating multiple menu instances with different configurations.
 */
export class ActionMenuFactory {
  private _baseConfig: ActionMenuConfig;
  private _pluginManager: any = null;

  constructor(baseConfig: ActionMenuConfig = {}) {
    this._baseConfig = baseConfig;
  }

  /**
   * Sets the plugin manager for this factory.
   * All instances created by this factory will have access to plugin actions.
   */
  public setPluginManager(pluginManager: any): void {
    this._pluginManager = pluginManager;
  }

  /**
   * Creates a new Action Menu instance with the given instance ID.
   */
  public createInstance(
    instanceId: string,
    config: Partial<ActionMenuConfig> = {},
  ): ActionMenuComponent {
    const menu = new ActionMenuComponent();
    menu.setAttribute("instance-id", instanceId);

    // Apply base config and instance-specific config
    const finalConfig = { ...this._baseConfig, ...config };
    menu.setConfig(finalConfig);

    // Set plugin manager if available
    if (this._pluginManager) {
      menu.setPluginManager(this._pluginManager);
    }

    return menu;
  }

  /**
   * Creates a factory for celestial-specific action menus.
   */
  public forCelestial(
    celestialId: string,
    config: Partial<ActionMenuConfig> = {},
  ): ActionMenuComponent {
    return this.createInstance(`celestial-${celestialId}`, config);
  }

  /**
   * Creates a factory for hierarchy-specific action menus.
   */
  public forHierarchy(
    hierarchyId: string,
    config: Partial<ActionMenuConfig> = {},
  ): ActionMenuComponent {
    return this.createInstance(`hierarchy-${hierarchyId}`, config);
  }

  /**
   * Creates a factory for toolbar-specific action menus.
   */
  public forToolbar(
    toolbarId: string,
    config: Partial<ActionMenuConfig> = {},
  ): ActionMenuComponent {
    return this.createInstance(`toolbar-${toolbarId}`, config);
  }
}

// Ensure the custom element is defined
if (!customElements.get("teskooano-action-menu")) {
  customElements.define("teskooano-action-menu", ActionMenuComponent);
}
