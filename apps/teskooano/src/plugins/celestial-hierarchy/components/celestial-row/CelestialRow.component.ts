import { CelestialIconComponent } from "../../../celestial-icons";
import { FormatUtils } from "../../../celestial-info/utils/formatters";
import { ActionMenuComponent } from "../../../../core/components/action-menu";
import { CelestialRowController } from "./controller/CelestialRow.controller";
import { template } from "./CelestialRow.template.js";

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
  /** Reference to the action menu component */
  private actionMenuEl: ActionMenuComponent | null = null;
  /** Controller that handles all business logic */
  private controller: CelestialRowController;

  /**
   * Creates an instance of CelestialRowComponent.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Initialize controller
    this.controller = new CelestialRowController(this);

    // Cache element references
    this.iconEl = this.shadowRoot!.getElementById(
      "icon",
    ) as CelestialIconComponent;
    this.nameEl = this.shadowRoot!.getElementById("name");
    this.distanceEl = this.shadowRoot!.getElementById("distance");
    // focusBtn, followBtn, and actionMenuEl will be initialized in connectedCallback
  }

  /**
   * Called when the element is added to the DOM.
   * Caches element references and attaches event listeners.
   */
  connectedCallback() {
    this.focusBtn = this.shadowRoot!.getElementById("focus-btn");
    this.followBtn = this.shadowRoot!.getElementById("follow-btn");
    this.actionMenuEl = this.shadowRoot!.getElementById(
      "action-menu",
    ) as ActionMenuComponent;

    if (this.focusBtn) {
      this.focusBtn.addEventListener("click", this.handleFocusClick);
    }
    if (this.followBtn) {
      this.followBtn.addEventListener("click", this.handleFollowClick);
    }

    this.updateButtonTitles();

    // Set up action menu when the element is ready
    this.initializeActionMenu();

    // Listen for action menu updates
    this.addEventListener("action-menu-update", this.handleActionMenuUpdate);
  }

  /**
   * Called when the element is removed from the DOM.
   * Removes event listeners to prevent memory leaks.
   */
  disconnectedCallback() {
    this.focusBtn?.removeEventListener("click", this.handleFocusClick);
    this.followBtn?.removeEventListener("click", this.handleFollowClick);
    this.actionMenuEl?.removeEventListener(
      "action-triggered",
      this.handleActionTriggered as EventListener,
    );
    this.removeEventListener("action-menu-update", this.handleActionMenuUpdate);
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

    // Update controller state
    this.controller.updateFromAttributes({
      objectId: name === "object-id" ? newValue : undefined,
      objectName: name === "object-name" ? newValue : undefined,
      objectType: name === "object-type" ? newValue : undefined,
      inactive: name === "inactive" ? newValue !== null : undefined,
      focused: name === "focused" ? newValue !== null : undefined,
      following: name === "following" ? newValue !== null : undefined,
    });

    // Handle view updates
    switch (name) {
      case "object-id":
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
        this.toggleAttribute("inactive", newValue !== null);
        break;
      case "focused":
        this.toggleAttribute("focused", newValue !== null);
        break;
      case "following":
        this.updateButtonTitles();
        this.updateActionMenuState();
        break;
    }
  }

  /**
   * Updates the button titles based on the current object name and following state.
   */
  private updateButtonTitles() {
    const displayName = this.controller.getDisplayName();

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
   * Delegates to controller for business logic.
   */
  private handleFocusClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.controller.handleFocusClick();
  };

  /**
   * Handles the click event for the follow button.
   * Delegates to controller for business logic.
   */
  private handleFollowClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.controller.handleFollowClick();
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
   */
  get objectId(): string | null {
    return this.controller.objectId;
  }

  /**
   * Gets whether the row is currently inactive/disabled.
   */
  get isInactive(): boolean {
    return this.controller.isInactive;
  }

  /**
   * Gets whether this object is currently focused.
   */
  get isFocused(): boolean {
    return this.controller.isFocused;
  }

  /**
   * Sets the parent panel reference for accessing renderer and state.
   */
  public setParentPanel(panel: any): void {
    this.controller.setParentPanel(panel);
    this.updateActionMenuState();
  }

  /**
   * Initializes the action menu when the element is ready.
   */
  private async initializeActionMenu(): Promise<void> {
    if (!this.actionMenuEl || !this.controller.objectId) return;

    // Wait for the action menu custom element to be fully defined
    await customElements.whenDefined("teskooano-action-menu");

    // Small delay to ensure the element is fully constructed
    await new Promise((resolve) => setTimeout(resolve, 10));

    this.setupActionMenu();
  }

  /**
   * Sets up the action menu with celestial-specific actions.
   */
  private setupActionMenu(): void {
    if (!this.actionMenuEl || !this.controller.objectId) return;

    // Ensure the action menu has the required methods
    if (typeof this.actionMenuEl.setConfig !== "function") {
      console.warn(
        `[CelestialRow] Action menu element not ready for ${this.controller.objectId}`,
      );
      return;
    }

    // Set unique instance ID based on object ID
    this.actionMenuEl.setAttribute(
      "instance-id",
      `celestial-${this.controller.objectId}`,
    );

    // Configure the action menu
    this.actionMenuEl.setConfig({
      instanceId: `celestial-${this.controller.objectId}`,
      buttonSize: "xs",
      direction: "left",
      closeOnAction: false,
      toggleTitle: "Object Actions",
    });

    // Set up the actions
    this.updateActionMenuActions();

    // Listen for action events
    this.actionMenuEl.addEventListener(
      "action-triggered",
      this.handleActionTriggered as EventListener,
    );
  }

  /**
   * Updates the action menu actions based on current object state.
   */
  private updateActionMenuActions(): void {
    if (!this.actionMenuEl || !this.controller.objectId) return;

    const actions = this.controller.createActionMenuItems();
    this.actionMenuEl.setActions(actions);
  }

  /**
   * Handles action menu events.
   */
  private handleActionTriggered = (event: Event): void => {
    const customEvent = event as CustomEvent;
    // Actions are handled by their individual action handlers
    // This method can be used for additional logging or state updates
    console.debug(`[CelestialRow] Action triggered:`, customEvent.detail);
  };

  /**
   * Updates the action menu state to reflect current visibility settings.
   */
  private updateActionMenuState(): void {
    if (!this.actionMenuEl) return;

    // Get updated actions from controller and refresh the menu
    this.updateActionMenuActions();
  }

  /**
   * Handles action menu update events to refresh the menu state.
   */
  private handleActionMenuUpdate = (): void => {
    this.updateActionMenuActions();
  };
}
