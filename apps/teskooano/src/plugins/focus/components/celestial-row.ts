import { CelestialType } from "@teskooano/data-types";
import { template } from "./celestial-row.template";
import { iconStyles } from "../utils/celestial-icon-styles";
import { CustomEvents } from "@teskooano/data-types";

/**
 * Web component representing a single row in any celestial list (active or destroyed).
 * Handles its own focus/follow button events and visual state.
 *
 * NOTE: File renamed to kebab-case to maintain consistency across component filenames.
 */
export class CelestialRow extends HTMLElement {
  static observedAttributes = [
    "object-id",
    "object-name",
    "object-type",
    "inactive",
    "focused",
  ];

  private _objectId: string | null = null;
  private _isInactive = false;
  private _isFocused = false;

  private iconEl: HTMLElement | null = null;
  private nameEl: HTMLElement | null = null;
  private focusBtn: HTMLElement | null = null;
  private followBtn: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this.iconEl = this.shadowRoot!.getElementById("icon");
    this.nameEl = this.shadowRoot!.getElementById("name");
  }

  connectedCallback() {
    this.focusBtn = this.shadowRoot!.getElementById("focus-btn");
    this.followBtn = this.shadowRoot!.getElementById("follow-btn");

    if (this.focusBtn) {
      this.focusBtn.addEventListener("click", this.handleFocusClick);
    }
    if (this.followBtn) {
      this.followBtn.addEventListener("click", this.handleFollowClick);
    }

    this.updateButtonTitles();
  }

  disconnectedCallback() {
    this.focusBtn?.removeEventListener("click", this.handleFocusClick);
    this.followBtn?.removeEventListener("click", this.handleFollowClick);
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ) {
    switch (name) {
      case "object-id":
        this._objectId = newValue;
        this.updateButtonTitles();
        break;
      case "object-name":
        if (this.nameEl) this.nameEl.textContent = newValue ?? "Unknown";
        this.updateButtonTitles();
        break;
      case "object-type":
        {
          const type = (newValue as CelestialType) ?? "default";
          const style = iconStyles[type] || iconStyles.default;
          this.iconEl?.setAttribute("style", style);
        }
        break;
      case "inactive":
        this._isInactive = newValue !== null;
        this.toggleAttribute("inactive", this._isInactive);
        break;
      case "focused":
        this._isFocused = newValue !== null;
        this.toggleAttribute("focused", this._isFocused);
        break;
    }
  }

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------
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

// Register the custom element with its kebab-case tag name.
customElements.define("celestial-row", CelestialRow);
