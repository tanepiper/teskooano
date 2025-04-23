import { CelestialType } from "@teskooano/data-types";
import { template, iconStyles } from "./CelestialRow.template";

export class CelestialRow extends HTMLElement {
  static observedAttributes = [
    "object-id",
    "object-name",
    "object-type",
    "inactive",
    "focused",
  ];

  private _objectId: string | null = null;
  private _isInactive: boolean = false;
  private _isFocused: boolean = false;

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
    this.focusBtn = this.shadowRoot!.getElementById("focus-btn");
    this.followBtn = this.shadowRoot!.getElementById("follow-btn");
  }

  connectedCallback() {
    this.focusBtn?.addEventListener("click", this.handleFocusClick);
    this.followBtn?.addEventListener("click", this.handleFollowClick);
  }

  disconnectedCallback() {
    this.focusBtn?.removeEventListener("click", this.handleFocusClick);
    this.followBtn?.removeEventListener("click", this.handleFollowClick);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    switch (name) {
      case "object-id":
        this._objectId = newValue;
        // Update titles maybe?
        this.focusBtn?.setAttribute(
          "title",
          `Focus ${this.getAttribute("object-name") || newValue}`,
        );
        this.followBtn?.setAttribute(
          "title",
          `Follow ${this.getAttribute("object-name") || newValue}`,
        );
        break;
      case "object-name":
        if (this.nameEl) this.nameEl.textContent = newValue ?? "Unknown";
        this.focusBtn?.setAttribute(
          "title",
          `Focus ${newValue || this._objectId}`,
        );
        this.followBtn?.setAttribute(
          "title",
          `Follow ${newValue || this._objectId}`,
        );
        break;
      case "object-type":
        const type = (newValue as CelestialType) ?? "default";
        const style = iconStyles[type] || iconStyles.default;
        this.iconEl?.setAttribute("style", style);
        // Optionally set a class too: this.iconEl?.setAttribute('class', `celestial-icon ${type}-icon`);
        break;
      case "inactive":
        this._isInactive = newValue !== null;
        this.toggleAttribute("inactive", this._isInactive); // Reflect attribute for styling
        break;
      case "focused":
        this._isFocused = newValue !== null;
        this.toggleAttribute("focused", this._isFocused); // Reflect attribute for styling
        break;
    }
  }

  // --- Event Handlers ---
  private handleFocusClick = (event: MouseEvent) => {
    event.stopPropagation(); // Prevent triggering parent listeners if needed
    if (this._objectId && !this._isInactive) {
      this.dispatchEvent(
        new CustomEvent("focus-request", {
          bubbles: true, // Allow event to bubble up
          composed: true, // Allow event to cross shadow DOM boundary
          detail: { objectId: this._objectId },
        }),
      );
    }
  };

  private handleFollowClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (this._objectId && !this._isInactive) {
      console.log(`Follow requested for ${this._objectId}`); // Placeholder
      this.dispatchEvent(
        new CustomEvent("follow-request", {
          bubbles: true,
          composed: true,
          detail: { objectId: this._objectId },
        }),
      );
      // TODO: Implement follow logic trigger - maybe toggle a 'following' state/attribute?
    }
  };

  // --- Getters for attributes (optional but good practice) ---
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

customElements.define("celestial-row", CelestialRow);
