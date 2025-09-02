import { Subject } from "rxjs";
import type {
  ActionMenuConfig,
  ActionMenuEvent,
  ActionMenuItem,
  ActionMenuContext,
} from "./types";

/**
 * Controller for the Action Menu component.
 * Manages menu state, action configuration, and event handling.
 */
export class ActionMenuController {
  private _host: HTMLElement;
  private _config: ActionMenuConfig;
  private _actions: ActionMenuItem[] = [];
  private _isExpanded = false;
  private _instanceId: string;
  private _pluginManager: any = null;

  private _toggleButton: HTMLElement | null = null;
  private _menuContainer: HTMLElement | null = null;

  /** Observable that emits when an action is triggered */
  public readonly actionTriggered$ = new Subject<ActionMenuEvent>();

  constructor(
    host: HTMLElement,
    config: ActionMenuConfig,
  ) {
    this._host = host;
    this._instanceId = config.instanceId;
    this._config = {
      buttonSize: "xs",
      direction: "right",
      closeOnAction: false,
      toggleTitle: "Celestial Actions",
      ...config,
    };

    this._cacheElementReferences();
    this._attachEventListeners();
    this._applyConfigurationToDOM();
  }

  /**
   * Gets the instance ID of this menu.
   */
  public get instanceId(): string {
    return this._instanceId;
  }

  /**
   * Updates the instance ID of this menu.
   */
  public updateInstanceId(newInstanceId: string): void {
    this._instanceId = newInstanceId;
  }

  /**
   * Sets the configuration for the action menu.
   * This method handles all visual updates based on the new configuration.
   */
  public setConfig(config: Partial<ActionMenuConfig>): void {
    this._config = { ...this._config, ...config };
    this._applyConfigurationToDOM();
  }

  /**
   * Applies the current configuration to the DOM elements.
   */
  private _applyConfigurationToDOM(): void {
    this._updateDirection();
    this._updateToggleButton();
    this._renderActions();
  }

  /**
   * Sets the actions to display in the menu.
   */
  public setActions(actions: ActionMenuItem[]): void {
    this._actions = actions;
    this._renderActions();
  }

  /**
   * Adds a single action to the menu.
   */
  public addAction(action: ActionMenuItem): void {
    this._actions.push(action);
    this._renderActions();
  }

  /**
   * Removes an action from the menu by ID.
   */
  public removeAction(actionId: string): void {
    this._actions = this._actions.filter((action) => action.id !== actionId);
    this._renderActions();
  }

  /**
   * Updates the active state of an action.
   */
  public setActionActive(actionId: string, active: boolean): void {
    const action = this._actions.find((a) => a.id === actionId);
    if (action) {
      action.active = active;
      this._renderActions();
    }
  }

  /**
   * Updates the disabled state of an action.
   */
  public setActionDisabled(actionId: string, disabled: boolean): void {
    const action = this._actions.find((a) => a.id === actionId);
    if (action) {
      action.disabled = disabled;
      this._renderActions();
    }
  }

  /**
   * Opens the menu.
   */
  public openMenu(): void {
    if (!this._isExpanded) {
      this._isExpanded = true;
      this._menuContainer?.classList.add("expanded");
    }
  }

  /**
   * Closes the menu.
   */
  public closeMenu(): void {
    if (this._isExpanded) {
      this._isExpanded = false;
      this._menuContainer?.classList.remove("expanded");
    }
  }

  /**
   * Toggles the menu open/closed state.
   */
  public toggleMenu(): void {
    if (this._isExpanded) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Gets the current expanded state.
   */
  public get isExpanded(): boolean {
    return this._isExpanded;
  }

  /**
   * Sets the plugin manager for this controller.
   */
  public setPluginManager(pluginManager: any): void {
    this._pluginManager = pluginManager;
  }

  /**
   * Sets the actions and integrates plugin-registered actions for the action-menu target.
   */
  public setActionsWithPlugins(actions: ActionMenuItem[]): void {
    // Get plugin-registered actions for the action-menu target
    const pluginActions = this._getPluginActions();

    // Combine built-in actions with plugin actions
    const allActions = [...actions, ...pluginActions];

    this.setActions(allActions);
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
                `[ActionMenuController] Error executing plugin action ${item.id}:`,
                error,
              );
            }
          },
        }));

      return pluginActions;
    } catch (error) {
      console.warn(
        "[ActionMenuController] Error getting plugin actions:",
        error,
      );
      return [];
    }
  }

  /**
   * Disposes of the controller and cleans up resources.
   */
  public dispose(): void {
    this.actionTriggered$.complete();
    document.removeEventListener("click", this._handleOutsideClick);
  }

  private _cacheElementReferences(): void {
    this._toggleButton =
      this._host.shadowRoot?.getElementById("menu-toggle-btn") || null;
    this._menuContainer =
      this._host.shadowRoot?.getElementById("menu-container") || null;
  }

  private _attachEventListeners(): void {
    this._toggleButton?.addEventListener("click", this._handleToggleClick);
    document.addEventListener("click", this._handleOutsideClick);
  }

  private _handleToggleClick = (event: MouseEvent): void => {
    event.stopPropagation();
    this.toggleMenu();
  };

  private _handleOutsideClick = (event: Event): void => {
    if (
      this._isExpanded &&
      !this._host.shadowRoot?.contains(event.target as Node)
    ) {
      this.closeMenu();
    }
  };

  private _handleActionClick =
    (action: ActionMenuItem) =>
    async (event: MouseEvent): Promise<void> => {
      event.stopPropagation();

      if (action.disabled) {
        return;
      }

      // Create action context
      const context: ActionMenuContext = {
        action,
        event,
        instanceId: this._instanceId,
      };

      // Execute explicit action function if provided
      if (action.action) {
        try {
          await action.action(context);
        } catch (error) {
          console.error(
            `[ActionMenuController] Error executing action ${action.id}:`,
            error,
          );
        }
      }
      this.actionTriggered$.next({
        action,
        event,
        instanceId: this._instanceId,
      });

      // Close menu if configured to do so
      if (this._config.closeOnAction) {
        this.closeMenu();
      }
    };

  private _updateDirection(): void {
    if (this._menuContainer) {
      this._menuContainer.setAttribute(
        "data-direction",
        this._config.direction || "right",
      );
    }
  }

  private _updateToggleButton(): void {
    if (this._toggleButton) {
      // Update button size
      this._toggleButton.setAttribute("size", this._config.buttonSize || "xs");

      // Update title
      this._toggleButton.setAttribute(
        "title",
        this._config.toggleTitle || "More Options",
      );

      // Update icon if provided
      this._updateToggleIcon();
    }
  }

  /**
   * Updates the toggle button icon.
   */
  private _updateToggleIcon(): void {
    const iconSlot = this._toggleButton?.querySelector("span[slot='icon']");
    if (iconSlot) {
      if (this._config.toggleIconSvg) {
        iconSlot.innerHTML = this._config.toggleIconSvg;
      } else {
        // Keep default icon if no custom icon is provided
        // The template already includes the default MoreHorizontalIcon
      }
    }
  }

  private _renderActions(): void {
    if (!this._menuContainer) return;

    // Clear existing actions
    this._menuContainer.innerHTML = "";

    // Create action buttons
    this._actions.forEach((action, index) => {
      const button = document.createElement("teskooano-button");
      button.id = `${this._config.instanceId || 'action-menu'}-btn-${index}`;
      button.setAttribute("size", this._config.buttonSize || "xs");
      button.setAttribute("title", action.title);
      button.setAttribute("variant", "ghost");

      if (action.disabled) {
        button.setAttribute("disabled", "");
      }

      if (action.active) {
        button.classList.add("active");
      }

      // Create icon slot
      const iconSlot = document.createElement("span");
      iconSlot.setAttribute("slot", "icon");
      iconSlot.innerHTML = action.iconSvg;
      button.appendChild(iconSlot);

      // Add click handler
      button.addEventListener("click", this._handleActionClick(action));

      // Prevent mouse events from bubbling to parent elements
      button.addEventListener("mouseenter", (e) => e.stopPropagation());
      button.addEventListener("mouseleave", (e) => e.stopPropagation());
      button.addEventListener("focusin", (e) => e.stopPropagation());
      button.addEventListener("focusout", (e) => e.stopPropagation());

      this._menuContainer!.appendChild(button);
    });
  }
}
