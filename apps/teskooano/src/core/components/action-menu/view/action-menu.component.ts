import { ActionMenuController } from "../controller/action-menu.controller.js";
import { type ActionMenuConfig } from "../controller/types.js";
import { template } from "./action-menu.template.js";

/**
 * Custom element for a configurable action menu.
 * This component is purely slot-based - buttons are provided via the default slot.
 *
 * @attr button-size - The size of buttons in the menu (xs, sm, md, lg)
 * @attr direction - The direction the menu appears (left, right, top, bottom)
 * @attr close-on-action - Whether to close menu when action is clicked (true/false)
 * @attr toggle-title - The title for the toggle button
 * @attr instance-id - The unique instance ID for this menu
 * @attr icon - The SVG icon to use for the toggle button (defaults to more horizontal icon)
 *
 * @slot - The default slot for action buttons
 * @fires menu-toggled - Dispatched when the menu is opened or closed
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
    this._controller.menuToggled$.subscribe(({ isExpanded, instanceId }) => {
      this.dispatchEvent(
        new CustomEvent("menu-toggled", {
          bubbles: true,
          composed: true,
          detail: { isExpanded, instanceId },
        }),
      );
    });
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

// Ensure the custom element is defined
if (!customElements.get("teskooano-action-menu")) {
  customElements.define("teskooano-action-menu", ActionMenuComponent);
}
