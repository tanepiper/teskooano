import { CustomEvents } from "@teskooano/data-types";
import { CelestialIconComponent } from "../../../celestial-icons";
import { FormatUtils } from "../../../celestial-info/utils/formatters";
import { template } from "./CelestialRow.template.js";
import { buttonTemplate } from "./CelestialRow.buttons.js";
import { DistanceStateService } from "../../services/DistanceStateService.js";
import { Subscription } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";

/**
 * A custom element to display a single row in the celestial hierarchy list.
 *
 * This component shows the object's name, an icon representing its type, distance from origin,
 * and buttons to focus or follow the object. It's designed to be used within the celestial
 * hierarchy tree structure.
 *
 * @fires CustomEvents.FOCUS_REQUEST - Dispatched when the focus button is clicked.
 * @fires CustomEvents.FOLLOW_REQUEST - Dispatched when the follow button is clicked.
 *
 * @attr object-id - The unique ID of the celestial object.
 * @attr object-name - The display name of the celestial object.
 * @attr object-type - The type of the celestial object (e.g., 'Star', 'Planet'), used for the hover tooltip.
 * @attr {string} config - A JSON string representing the CelestialIconConfig.
 * @attr {boolean} inactive - When present, styles the row as inactive/disabled.
 * @attr {boolean} focused - When present, styles the row as the currently focused item.
 * @attr {boolean} following - When present, indicates the camera is following this object.
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
  /** Subscription to distance updates */
  private distanceSubscription: Subscription | null = null;
  /** Reference to the distance state service */
  private distanceService: DistanceStateService;

  /**
   * Creates an instance of CelestialRowComponent.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Append the button template
    this.shadowRoot!.appendChild(buttonTemplate.content.cloneNode(true));

    // Initialize distance service
    this.distanceService = DistanceStateService.getInstance();

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
    this.setupDistanceSubscription();
  }

  /**
   * Called when the element is removed from the DOM.
   * Removes event listeners to prevent memory leaks.
   */
  disconnectedCallback() {
    this.focusBtn?.removeEventListener("click", this.handleFocusClick);
    this.followBtn?.removeEventListener("click", this.handleFollowClick);
    this.cleanupDistanceSubscription();
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
        this.setupDistanceSubscription();
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
   * Dispatches a `focus-request` custom event if the object is active.
   *
   * @param event - The click event
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
   * Dispatches a `follow-request` custom event if the object is active.
   *
   * @param event - The click event
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

  /**
   * Sets up the subscription to distance updates for this object.
   * Only updates the DOM when the formatted distance string actually changes.
   */
  private setupDistanceSubscription(): void {
    this.cleanupDistanceSubscription();

    if (!this._objectId) return;

    this.distanceSubscription = this.distanceService
      .getDistance$(this._objectId)
      .pipe(
        // Only emit when the formatted distance string changes
        distinctUntilChanged((prev, curr) => {
          if (prev === undefined && curr === undefined) return true;
          if (prev === undefined || curr === undefined) return false;

          const prevFormatted = FormatUtils.formatDistanceAdaptive(prev);
          const currFormatted = FormatUtils.formatDistanceAdaptive(curr);
          return prevFormatted === currFormatted;
        }),
      )
      .subscribe((distance) => {
        if (distance !== undefined && this.distanceEl) {
          this.distanceEl.textContent =
            FormatUtils.formatDistanceAdaptive(distance);
        }
      });
  }

  /**
   * Cleans up the distance subscription to prevent memory leaks.
   */
  private cleanupDistanceSubscription(): void {
    if (this.distanceSubscription) {
      this.distanceSubscription.unsubscribe();
      this.distanceSubscription = null;
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
