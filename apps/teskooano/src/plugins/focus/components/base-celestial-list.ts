import { CelestialObject } from "@teskooano/data-types";

/**
 * Abstract base class for celestial object lists.
 * Provides common functionality for displaying lists of celestial objects.
 */
export abstract class BaseCelestialList extends HTMLElement {
  protected _objects: Record<string, CelestialObject> = {};
  protected _rootUl: HTMLUListElement;
  protected _emptyMessage: HTMLLIElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Create the root UL element
    this._rootUl = document.createElement("ul");
    this._rootUl.classList.add("celestial-list");

    // Create empty message element
    this._emptyMessage = document.createElement("li");
    this._emptyMessage.classList.add("empty-message");
    this._emptyMessage.textContent = this.getEmptyMessage();

    // Set up common styles
    const style = document.createElement("style");
    style.textContent = this.getBaseStyles();

    this.shadowRoot!.appendChild(style);
    this.shadowRoot!.appendChild(this._rootUl);

    // Set up event delegation for focus/follow events
    this._rootUl.addEventListener("click", this._handleClick.bind(this));
    this._rootUl.addEventListener(
      "focus-request",
      this._handleFocusRequest.bind(this),
    );
    this._rootUl.addEventListener(
      "follow-request",
      this._handleFollowRequest.bind(this),
    );
  }

  /**
   * Updates the celestial objects and rebuilds the list.
   * @param objects - The celestial objects to display
   * @returns The count of objects displayed
   */
  updateObjects(objects: Record<string, CelestialObject>): number {
    this._objects = objects;
    return this._rebuild();
  }

  /**
   * Abstract method for filtering objects to display.
   * Subclasses must implement this to define which objects to show.
   */
  protected abstract filterObjects(
    objects: Record<string, CelestialObject>,
  ): CelestialObject[];

  /**
   * Abstract method for rendering individual items.
   * Subclasses must implement this to define how items are displayed.
   */
  protected abstract renderItem(
    obj: CelestialObject,
    parentUl: HTMLElement,
  ): void;

  /**
   * Abstract method for getting the empty message text.
   */
  protected abstract getEmptyMessage(): string;

  /**
   * Gets the base CSS styles for the list.
   * Subclasses can override to add additional styles.
   */
  protected getBaseStyles(): string {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      li {
        position: relative;
      }
      
      .empty-message {
        padding: var(--spacing-md); /* 16px */
        text-align: center;
        opacity: 0.6;
        font-style: italic;
      }
      
      .destroyed {
        opacity: 0.7;
      }
      
      .annihilated {
        opacity: 0.5;
      }
    `;
  }

  /**
   * Rebuilds the entire list from scratch.
   * @returns The number of items displayed
   */
  protected _rebuild(): number {
    this._rootUl.innerHTML = "";

    const filteredObjects = this.filterObjects(this._objects);

    if (filteredObjects.length === 0) {
      this._rootUl.appendChild(this._emptyMessage);
      return 0;
    }

    filteredObjects.forEach((obj) => {
      this.renderItem(obj, this._rootUl);
    });

    return filteredObjects.length;
  }

  /**
   * Handles click events within the list.
   * Subclasses can override to add custom click handling.
   */
  protected _handleClick(event: Event): void {
    // Base implementation - subclasses can override
  }

  /**
   * Handles focus request events from celestial-row components.
   */
  private _handleFocusRequest(event: Event): void {
    const customEvent = event as CustomEvent<{ objectId: string }>;
    if (customEvent.detail?.objectId) {
      // Re-dispatch as focus-object event at the component level
      this.dispatchEvent(
        new CustomEvent("focus-object", {
          detail: { objectId: customEvent.detail.objectId },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  /**
   * Handles follow request events from celestial-row components.
   */
  private _handleFollowRequest(event: Event): void {
    const customEvent = event as CustomEvent<{ objectId: string }>;
    if (customEvent.detail?.objectId) {
      // Re-dispatch as follow-object event at the component level
      this.dispatchEvent(
        new CustomEvent("follow-object", {
          detail: { objectId: customEvent.detail.objectId },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  connectedCallback() {
    // Subclasses can override to add additional setup
  }

  disconnectedCallback() {
    // Subclasses can override to add cleanup
  }
}
