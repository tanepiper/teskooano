import {
  CelestialType,
  CustomEvents,
  StellarType,
} from "@teskooano/data-types";
import { getCelestialIconStyle } from "../utils/celestial-icon-styles";
import { template } from "./celestial-row.template";

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
    "stellar-type",
    "inactive",
    "focused",
  ];

  private _objectId: string | null = null;
  private _isInactive = false;
  private _isFocused = false;
  private _isFollowed = false;

  private iconEl: HTMLElement | null = null;
  private nameEl: HTMLElement | null = null;
  private moveToBtn: HTMLElement | null = null;
  private lookAtBtn: HTMLElement | null = null;
  private followBtn: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this.iconEl = this.shadowRoot!.getElementById("icon");
    this.nameEl = this.shadowRoot!.getElementById("name");
  }

  connectedCallback() {
    this.moveToBtn = this.shadowRoot!.getElementById("move-to-btn");
    this.lookAtBtn = this.shadowRoot!.getElementById("look-at-btn");
    this.followBtn = this.shadowRoot!.getElementById("follow-btn");

    this.moveToBtn?.addEventListener("click", this.handleMoveToClick);
    this.lookAtBtn?.addEventListener("click", this.handleLookAtClick);
    this.followBtn?.addEventListener("click", this.handleFollowClick);

    this.updateButtonTitles();
  }

  disconnectedCallback() {
    this.moveToBtn?.removeEventListener("click", this.handleMoveToClick);
    this.lookAtBtn?.removeEventListener("click", this.handleLookAtClick);
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
      case "stellar-type":
        this.updateIconStyle();
        break;
      case "inactive":
        this._isInactive = newValue !== null;
        this.toggleAttribute("inactive", this._isInactive);
        break;
      case "focused":
        this._isFocused = newValue !== null;
        this.toggleAttribute("focused", this._isFocused);
        break;
      case "followed":
        this._isFollowed = newValue !== null;
        this.toggleAttribute("followed", this._isFollowed);
        break;
    }
  }

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  private updateIconStyle() {
    if (!this.iconEl) return;

    const celestialType = this.getAttribute("object-type") as CelestialType;
    const stellarType = this.getAttribute("stellar-type") as StellarType;

    const style = getCelestialIconStyle(celestialType, stellarType);
    this.iconEl.setAttribute("style", style);
  }

  private updateButtonTitles() {
    const objectName = this.getAttribute("object-name");
    const id = this._objectId;

    if (this.moveToBtn) {
      this.moveToBtn.setAttribute(
        "title",
        `Move camera to orbit ${objectName || id || "Unknown"}`,
      );
    }
    if (this.lookAtBtn) {
      this.lookAtBtn.setAttribute(
        "title",
        `Look at ${objectName || id || "Unknown"} from current position`,
      );
    }
    if (this.followBtn) {
      this.followBtn.setAttribute(
        "title",
        `Follow ${objectName || id || "Unknown"} with camera`,
      );
    }
  }

  private handleMoveToClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (this._objectId && !this._isInactive) {
      this.dispatchEvent(
        new CustomEvent(CustomEvents.MOVE_TO_REQUEST, {
          bubbles: true,
          composed: true,
          detail: { objectId: this._objectId },
        }),
      );
    }
  };

  private handleLookAtClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (this._objectId && !this._isInactive) {
      this.dispatchEvent(
        new CustomEvent(CustomEvents.LOOK_AT_REQUEST, {
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
  get isFollowed(): boolean {
    return this._isFollowed;
  }
}

// Register the custom element with its kebab-case tag name.
customElements.define("celestial-row", CelestialRow);
