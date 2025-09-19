import { Subject } from "rxjs";
import type { ActionMenuConfig } from "./types";

/**
 * Controller for the Action Menu component.
 * Manages menu state, action configuration, and event handling.
 */
export class ActionMenuController {
  private _host: HTMLElement;
  private _config: ActionMenuConfig;
  private _isExpanded = false;
  private _instanceId: string;

  private _toggleButton: HTMLElement | null = null;
  private _menuContainer: HTMLElement | null = null;

  /** Observable that emits when the menu is toggled */
  public readonly menuToggled$ = new Subject<{
    isExpanded: boolean;
    instanceId: string;
  }>();

  constructor(
    host: HTMLElement,
    instanceId: string,
    config: ActionMenuConfig = {},
  ) {
    this._host = host;
    this._instanceId = instanceId;
    this._config = {
      buttonSize: "xs",
      direction: "right",
      closeOnAction: false,
      toggleTitle: "Celestial Actions",
      ...config,
    };

    this._cacheElementReferences();
    this._attachEventListeners();
    this._updateDirection();
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
   */
  public setConfig(config: Partial<ActionMenuConfig>): void {
    this._config = { ...this._config, ...config };
    this._updateDirection();
    this._updateToggleButton();
  }

  /**
   * Opens the menu.
   */
  public openMenu(): void {
    if (!this._isExpanded) {
      this._isExpanded = true;
      this._menuContainer?.classList.add("expanded");
      this.menuToggled$.next({
        isExpanded: true,
        instanceId: this._instanceId,
      });
    }
  }

  /**
   * Closes the menu.
   */
  public closeMenu(): void {
    if (this._isExpanded) {
      this._isExpanded = false;
      this._menuContainer?.classList.remove("expanded");
      this.menuToggled$.next({
        isExpanded: false,
        instanceId: this._instanceId,
      });
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
   * Disposes of the controller and cleans up resources.
   */
  public dispose(): void {
    this.menuToggled$.complete();
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
      if (this._config.toggleIconSvg) {
        const iconSlot = this._toggleButton.querySelector("span[slot='icon']");
        if (iconSlot) {
          iconSlot.innerHTML = this._config.toggleIconSvg;
        }
      }
    }
  }
}
