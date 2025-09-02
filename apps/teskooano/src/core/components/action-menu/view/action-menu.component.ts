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
 * @attr toggle-icon-svg - The SVG icon to use for the toggle button (defaults to more horizontal icon)
 * @attr instance-id - The unique instance ID for this menu
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
    "toggle-icon-svg",
    "instance-id",
  ];

  private _controller: ActionMenuController;
  private _instanceId: string;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Get instance ID from attribute or generate one
    this._instanceId =
      this.getAttribute("instance-id") || this._generateInstanceId();

    // Create controller with instance ID and initial config from attributes
    this._controller = new ActionMenuController(
      this,
      this._getConfigFromAttributes()
    );

    // Subscribe to controller events and forward them
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
   * This will also update the corresponding attributes.
   */
  public setConfig(config: Partial<ActionMenuConfig>): void {
    // Update attributes to reflect the config
    this._updateAttributesFromConfig(config);
    // The controller will be updated via attributeChangedCallback
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
    this._controller.setPluginManager(pluginManager);
  }

  /**
   * Sets the actions and integrates plugin-registered actions for the action-menu target.
   * This combines built-in actions with plugin-registered actions.
   */
  public setActionsWithPlugins(actions: ActionMenuItem[]): void {
    this._controller.setActionsWithPlugins(actions);
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
    if (oldValue === newValue || !this._controller) return;

    switch (name) {
      case "instance-id":
        if (newValue) {
          this._instanceId = newValue;
          this._controller.updateInstanceId(newValue);
        }
        break;
      default:
        // For all other attributes, update the controller with new config
        this._controller.setConfig(this._getConfigFromAttributes());
        break;
    }
  }

  /**
   * Gets configuration from current attributes.
   */
  private _getConfigFromAttributes(): ActionMenuConfig {
    return {
      instanceId: this.getAttribute("instance-id") || "action-menu",
      buttonSize: (this.getAttribute("button-size") as any) || "xs",
      direction: (this.getAttribute("direction") as any) || "right",
      closeOnAction: this.getAttribute("close-on-action") === "true",
      toggleTitle: this.getAttribute("toggle-title") || "More Options",
      toggleIconSvg: this.getAttribute("toggle-icon-svg") || undefined,
    };
  }

  /**
   * Updates attributes from configuration object.
   */
  private _updateAttributesFromConfig(config: Partial<ActionMenuConfig>): void {
    if (config.buttonSize !== undefined) {
      this.setAttribute("button-size", config.buttonSize);
    }
    if (config.direction !== undefined) {
      this.setAttribute("direction", config.direction);
    }
    if (config.closeOnAction !== undefined) {
      this.setAttribute("close-on-action", config.closeOnAction.toString());
    }
    if (config.toggleTitle !== undefined) {
      this.setAttribute("toggle-title", config.toggleTitle);
    }
    if (config.toggleIconSvg !== undefined) {
      this.setAttribute("toggle-icon-svg", config.toggleIconSvg);
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

  constructor(baseConfig: ActionMenuConfig) {
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
