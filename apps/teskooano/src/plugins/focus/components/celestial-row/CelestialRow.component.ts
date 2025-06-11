import { CelestialType } from "@teskooano/data-types";
import { template, iconStyles } from "./CelestialRow.template.js";
import { CustomEvents } from "@teskooano/data-types";

/**
 * A custom element to display a single row in the focus control list.
 * It shows the object's name, an icon representing its type, and
 * buttons to focus or follow the object.
 *
 * @fires CustomEvents.FOCUS_REQUEST - Dispatched when the focus button is clicked.
 * @fires CustomEvents.FOLLOW_REQUEST - Dispatched when the follow button is clicked.
 *
 * @attr object-id - The unique ID of the celestial object.
 * @attr object-name - The display name of the celestial object.
 * @attr object-type - The type of the celestial object (e.g., 'Star', 'Planet').
 * @attr {boolean} inactive - When present, styles the row as inactive/disabled.
 * @attr {boolean} focused - When present, styles the row as the currently focused item.
 * @attr {boolean} following - When present, indicates the camera is following this object.
 */
export class CelestialRowComponent extends HTMLElement {
  static observedAttributes = [
    "object-id",
    "object-name",
    "object-type",
    "inactive",
    "focused",
    "following",
  ];

  private _objectId: string | null = null;
  private _isInactive: boolean = false;
  private _isFocused: boolean = false;

  private iconEl: HTMLElement | null = null;
  private nameEl: HTMLElement | null = null;
  private focusBtn: HTMLElement | null = null;
  private followBtn: HTMLElement | null = null;

  /**
   * Creates an instance of CelestialRowComponent.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this.iconEl = this.shadowRoot!.getElementById("icon");
    this.nameEl = this.shadowRoot!.getElementById("name");
    // focusBtn and followBtn will be initialized in connectedCallback
  }

  /**
   * Standard lifecycle callback.
   * Called when the element is added to the DOM.
   * Caches element references and attaches event listeners.
   */
  connectedCallback() {
    this.focusBtn = this.shadowRoot!.getElementById("focus-btn");
    this.followBtn = this.shadowRoot!.getElementById("follow-btn");

    if (this.focusBtn) {
      this.focusBtn.addEventListener("click", this.handleFocusClick);
    } else {
      console.error(
        `[CelestialRowComponent connectedCallback] focusBtn NOT FOUND for ${this.getAttribute("object-id")}`,
      );
    }
    if (this.followBtn) {
      this.followBtn.addEventListener("click", this.handleFollowClick);
    } else {
      console.error(
        `[CelestialRowComponent connectedCallback] followBtn NOT FOUND for ${this.getAttribute("object-id")}`,
      );
    }
    this.updateButtonTitles();
  }

  /**
   * Standard lifecycle callback.
   * Called when the element is removed from the DOM.
   * Removes event listeners to prevent memory leaks.
   */
  disconnectedCallback() {
    this.focusBtn?.removeEventListener("click", this.handleFocusClick);
    this.followBtn?.removeEventListener("click", this.handleFollowClick);
  }

  /**
   * Handles changes to observed attributes.
   * Updates the component's UI to reflect the new attribute values.
   */
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;

    switch (name) {
      case "object-id":
        this._objectId = newValue;
        this.updateButtonTitles();
        break;
      case "object-name":
        this.updateName(newValue);
        break;
      case "object-type":
        this.updateIcon(newValue);
        break;
      case "inactive":
        this._isInactive = newValue !== null;
        this.toggleAttribute("inactive", this._isInactive);
        break;
      case "focused":
        this._isFocused = newValue !== null;
        this.toggleAttribute("focused", this._isFocused);
        break;
      case "following":
        this.updateButtonTitles();
        break;
    }
  }

  /**
   * Updates the button titles based on the 'following' state.
   */
  private updateButtonTitles() {
    const objectName = this.getAttribute("object-name");
    const id = this._objectId;

    if (this.focusBtn) {
      this.focusBtn.setAttribute(
        "title",
        `Focus ${objectName || id || "Unknown"}`,
      );
    }
    if (this.followBtn) {
      this.followBtn.setAttribute(
        "title",
        `Follow ${objectName || id || "Unknown"}`,
      );
    }
  }

  /**
   * Updates the displayed name of the object.
   * @param name The new name to display.
   */
  private updateName(name: string | null) {
    const nameEl = this.shadowRoot!.getElementById("name");
    if (nameEl) {
      nameEl.textContent = name ?? "Unknown";
    }
  }

  /**
   * Updates the icon style based on the object's type.
   * @param type The celestial object type.
   */
  private updateIcon(type: string | null) {
    const iconEl = this.shadowRoot!.getElementById("icon");
    if (iconEl) {
      iconEl.style.cssText =
        iconStyles[type as CelestialType] || iconStyles.default;
    }
  }

  /**
   * Handles the click event for the focus button.
   * Dispatches a `focus-request` custom event.
   */
  private handleFocusClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (this._objectId && !this._isInactive) {
      this.dispatchEvent(
        new CustomEvent(CustomEvents.FOCUS_REQUEST, {
          bubbles: true,
          composed: true,
          detail: { objectId: this._objectId },
        }),
      );
    }
  };

  /**
   * Handles the click event for the follow button.
   * Dispatches a `follow-request` custom event.
   */
  private handleFollowClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (this._objectId && !this._isInactive) {
      this.dispatchEvent(
        new CustomEvent(CustomEvents.FOLLOW_REQUEST, {
          bubbles: true,
          composed: true,
          detail: { objectId: this._objectId },
        }),
      );
    }
  };

  get objectId(): string | null {
    return this._objectId;
  }
  get isInactive(): boolean {
    return this._isInactive;
  }
  get isFocused(): boolean {
    return this._isFocused;
  }
}
