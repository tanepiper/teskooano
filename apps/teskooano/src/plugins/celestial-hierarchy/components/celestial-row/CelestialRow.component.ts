import { CelestialIconComponent } from "../../../celestial-icons";
import { FormatUtils } from "../../../celestial-info/utils/formatters";
import { template } from "./CelestialRow.template.js";
import { engineSignalsService } from "../../../core/controllers/engine/EngineSignals.service";

/**
 * A custom element to display a single row in the celestial hierarchy list.
 *
 * This component shows the object's name, an icon representing its type, distance from origin,
 * and buttons to focus or follow the object. It's designed to be used within the celestial
 * hierarchy tree structure.
 */
export class CelestialRowComponent extends HTMLElement {
  /** Observed attributes for automatic updates */
  static observedAttributes = [
    "object-id",
    "object-name",
    "object-type",
    "config",
    "inactive",
    "focused",
    "following",
  ];

  /** The unique identifier of the celestial object */
  private _objectId: string | null = null;
  /** Whether the row is currently inactive/disabled */
  private _isInactive: boolean = false;
  /** Whether this object is currently focused */
  private _isFocused: boolean = false;

  /** Reference to the celestial icon component */
  private iconEl: CelestialIconComponent | null = null;
  /** Reference to the name display element */
  private nameEl: HTMLElement | null = null;
  /** Reference to the distance display element */
  private distanceEl: HTMLElement | null = null;
  /** Reference to the focus button */
  private focusBtn: HTMLElement | null = null;
  /** Reference to the follow button */
  private followBtn: HTMLElement | null = null;

  /**
   * Creates an instance of CelestialRowComponent.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Cache element references
    this.iconEl = this.shadowRoot!.getElementById(
      "icon",
    ) as CelestialIconComponent;
    this.nameEl = this.shadowRoot!.getElementById("name");
    this.distanceEl = this.shadowRoot!.getElementById("distance");
    // focusBtn and followBtn will be initialized in connectedCallback
  }

  /**
   * Called when the element is added to the DOM.
   * Caches element references and attaches event listeners.
   */
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

  /**
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
   *
   * @param name - The name of the attribute that changed
   * @param oldValue - The previous value of the attribute
   * @param newValue - The new value of the attribute
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
        this.title = `Type: ${newValue}`;
        break;
      case "config":
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
   * Updates the button titles based on the current object name and following state.
   */
  private updateButtonTitles() {
    const objectName = this.getAttribute("object-name");
    const id = this._objectId;
    const displayName = objectName || id || "Unknown";

    if (this.focusBtn) {
      this.focusBtn.setAttribute("title", `Focus ${displayName}`);
    }
    if (this.followBtn) {
      this.followBtn.setAttribute("title", `Follow ${displayName}`);
    }
  }

  /**
   * Updates the displayed name of the object.
   *
   * @param name - The new name to display
   */
  private updateName(name: string | null) {
    if (this.nameEl) {
      this.nameEl.textContent = name ?? "Unknown";
    }
  }

  /**
   * Updates the icon by passing the config to the celestial-icon component.
   *
   * @param configJson - The celestial icon configuration as a JSON string
   */
  private updateIcon(configJson: string | null) {
    if (this.iconEl && configJson) {
      this.iconEl.setAttribute("config", configJson);
    }
  }

  /**
   * Handles the click event for the focus button.
   */
  private handleFocusClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (this._objectId && !this._isInactive) {
      engineSignalsService.focusObject(this._objectId);
    }
  };

  /**
   * Handles the click event for the follow button.
   */
  private handleFollowClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (this._objectId && !this._isInactive) {
      engineSignalsService.focusObject(this._objectId);
    }
  };

  /**
   * Updates the displayed distance from the system origin.
   *
   * @param distanceInMeters - The distance in meters
   */
  public updateDistance(distanceInMeters: number) {
    if (this.distanceEl) {
      this.distanceEl.textContent =
        FormatUtils.formatDistanceAdaptive(distanceInMeters);
    }
  }

  /**
   * Gets the unique identifier of the celestial object.
   *
   * @returns The object ID or null if not set
   */
  get objectId(): string | null {
    return this._objectId;
  }

  /**
   * Gets whether the row is currently inactive/disabled.
   *
   * @returns True if the row is inactive
   */
  get isInactive(): boolean {
    return this._isInactive;
  }

  /**
   * Gets whether this object is currently focused.
   *
   * @returns True if the object is focused
   */
  get isFocused(): boolean {
    return this._isFocused;
  }
}
