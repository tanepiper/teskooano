import { CelestialType } from "@teskooano/data-types";
import { template, iconStyles } from "./CelestialRow.template.js";
import { CustomEvents } from "@teskooano/data-types";
import { CelestialIconComponent } from "../../../celestial-icons";
import { AU_METERS } from "@teskooano/data-types";
import { FormatUtils } from "../../../celestial-info/utils/formatters";

/**
 * Simple touch handler for elements that need both click and touch support
 */
class SimpleTouchHandler {
  private element: HTMLElement;
  private clickHandler: (event: Event) => void;
  private isTouch: boolean = false;
  private touchStartTime: number = 0;

  constructor(element: HTMLElement, clickHandler: (event: Event) => void) {
    this.element = element;
    this.clickHandler = clickHandler;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener("touchstart", this.handleTouchStart, { passive: false });
    this.element.addEventListener("touchend", this.handleTouchEnd, { passive: false });
    this.element.addEventListener("click", this.handleClick);
  }

  private handleTouchStart = (event: TouchEvent): void => {
    this.isTouch = true;
    this.touchStartTime = Date.now();
    this.element.classList.add("touch-active");
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    this.element.classList.remove("touch-active");
    
    const touchDuration = Date.now() - this.touchStartTime;
    
    // Valid touch (not too quick, not too long)
    if (touchDuration >= 50 && touchDuration <= 1000) {
      event.preventDefault();
      event.stopPropagation();
      this.clickHandler(event);
    }
    
    // Reset isTouch after a delay to prevent ghost clicks
    setTimeout(() => {
      this.isTouch = false;
    }, 300);
  };

  private handleClick = (event: MouseEvent): void => {
    // If this click came after a touch, ignore it
    if (this.isTouch) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    // Normal click for non-touch devices
    this.clickHandler(event);
  };

  public destroy(): void {
    this.element.removeEventListener("touchstart", this.handleTouchStart);
    this.element.removeEventListener("touchend", this.handleTouchEnd);
    this.element.removeEventListener("click", this.handleClick);
    this.element.classList.remove("touch-active");
  }
}

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
 * @attr object-type - The type of the celestial object (e.g., 'Star', 'Planet'), used for the hover tooltip.
 * @attr {string} config - A JSON string representing the CelestialIconConfig.
 * @attr {boolean} inactive - When present, styles the row as inactive/disabled.
 * @attr {boolean} focused - When present, styles the row as the currently focused item.
 * @attr {boolean} following - When present, indicates the camera is following this object.
 */
export class CelestialRowComponent extends HTMLElement {
  static observedAttributes = [
    "object-id",
    "object-name",
    "object-type",
    "config",
    "inactive",
    "focused",
    "following",
  ];

  private _objectId: string | null = null;
  private _isInactive: boolean = false;
  private _isFocused: boolean = false;

  private iconEl: CelestialIconComponent | null = null;
  private nameEl: HTMLElement | null = null;
  private distanceEl: HTMLElement | null = null;
  private focusBtn: HTMLElement | null = null;
  private followBtn: HTMLElement | null = null;
  
  private focusTouchHandler: SimpleTouchHandler | null = null;
  private followTouchHandler: SimpleTouchHandler | null = null;

  /**
   * Creates an instance of CelestialRowComponent.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this.iconEl = this.shadowRoot!.getElementById(
      "icon",
    ) as CelestialIconComponent;
    this.nameEl = this.shadowRoot!.getElementById("name");
    this.distanceEl = this.shadowRoot!.getElementById("distance");
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
      this.focusTouchHandler = new SimpleTouchHandler(this.focusBtn, this.handleFocusClick);
    } else {
      console.error(
        `[CelestialRowComponent connectedCallback] focusBtn NOT FOUND for ${this.getAttribute("object-id")}`,
      );
    }
    
    if (this.followBtn) {
      this.followTouchHandler = new SimpleTouchHandler(this.followBtn, this.handleFollowClick);
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
    if (this.focusTouchHandler) {
      this.focusTouchHandler.destroy();
      this.focusTouchHandler = null;
    }
    
    if (this.followTouchHandler) {
      this.followTouchHandler.destroy();
      this.followTouchHandler = null;
    }
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
   * Updates the icon by passing the config to the celestial-icon component.
   * @param configJson The celestial icon configuration as a JSON string.
   */
  private updateIcon(configJson: string | null) {
    if (this.iconEl && configJson) {
      this.iconEl.setAttribute("config", configJson);
    }
  }

  /**
   * Handles the click event for the focus button.
   * Dispatches a `focus-request` custom event.
   */
  private handleFocusClick = (event: Event) => {
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
  private handleFollowClick = (event: Event) => {
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
   * Updates the displayed distance from the system origin.
   * @param distanceInMeters The distance in meters.
   */
  public updateDistance(distanceInMeters: number) {
    if (this.distanceEl) {
      this.distanceEl.textContent =
        FormatUtils.formatDistanceAdaptive(distanceInMeters);
    }
  }

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
