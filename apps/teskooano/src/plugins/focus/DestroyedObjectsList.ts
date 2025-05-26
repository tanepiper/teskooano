import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import "./CelestialRow";

interface DestroyedObjectInfo {
  object: CelestialObject;
  destroyedTime: number;
}

/**
 * Custom web component that displays a list of destroyed celestial objects.
 * Shows destruction time and manages its own DOM lifecycle.
 *
 * @element destroyed-objects-list
 *
 * @fires focus-object - Fired when a destroyed object is clicked
 *
 * @example
 * ```html
 * <destroyed-objects-list></destroyed-objects-list>
 * ```
 */
export class DestroyedObjectsList extends HTMLElement {
  private _destroyedObjects: DestroyedObjectInfo[] = [];
  private _listElement: HTMLUListElement;
  private _emptyMessage: HTMLLIElement;
  private _lastUpdateTime: number = Date.now();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Create the list element
    this._listElement = document.createElement("ul");
    this._listElement.id = "destroyed-list";
    this._listElement.classList.add("destroyed-list");

    // Create empty message element
    this._emptyMessage = document.createElement("li");
    this._emptyMessage.classList.add("empty-message");
    this._emptyMessage.textContent = "No destroyed objects";

    // Set up styles
    const style = document.createElement("style");
    style.textContent = `
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
        padding: 2px 0;
        opacity: 0.7;
      }
      
      li.annihilated {
        opacity: 0.5;
      }
      
      .destruction-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .destruction-time {
        font-size: 0.8em;
        color: var(--color-text-secondary, #888);
        margin-left: auto;
        white-space: nowrap;
      }
      
      .empty-message {
        padding: 10px;
        color: var(--color-text-secondary, #aaa);
        text-align: center;
        font-style: italic;
        opacity: 1;
      }
      
      celestial-row {
        flex: 1;
      }
    `;

    this.shadowRoot!.appendChild(style);
    this.shadowRoot!.appendChild(this._listElement);

    // Initial render
    this._render();
  }

  /**
   * Updates the list with new destroyed objects data.
   * @param objects - All celestial objects (filters for destroyed ones)
   * @param currentTime - Current simulation time (unused, we use real time for display)
   */
  updateDestroyedObjects(
    objects: Record<string, CelestialObject>,
    currentTime: number,
  ): void {
    const now = Date.now();

    // Filter and map destroyed objects
    this._destroyedObjects = Object.values(objects)
      .filter(
        (obj) =>
          obj.status === CelestialStatus.DESTROYED ||
          obj.status === CelestialStatus.ANNIHILATED,
      )
      .map((obj) => ({
        object: obj,
        // Use the stored destruction time if available, otherwise use current time
        destroyedTime: (obj as any).destroyedTime || now,
      }))
      .sort((a, b) => b.destroyedTime - a.destroyedTime); // Most recent first

    this._lastUpdateTime = now;
    this._render();
  }

  /**
   * Gets the count of destroyed objects.
   */
  get destroyedCount(): number {
    return this._destroyedObjects.length;
  }

  /**
   * Clears the destroyed objects list.
   */
  clear(): void {
    this._destroyedObjects = [];
    this._render();
  }

  private _render(): void {
    // Clear existing content
    this._listElement.innerHTML = "";

    if (this._destroyedObjects.length === 0) {
      this._listElement.appendChild(this._emptyMessage);
      return;
    }

    // Render each destroyed object
    this._destroyedObjects.forEach(({ object, destroyedTime }) => {
      const listItem = document.createElement("li");
      listItem.dataset.id = object.id;

      if (object.status === CelestialStatus.ANNIHILATED) {
        listItem.classList.add("annihilated");
      }

      const infoDiv = document.createElement("div");
      infoDiv.classList.add("destruction-info");

      // Create celestial row
      const row = document.createElement("celestial-row");
      row.setAttribute("object-id", object.id);
      row.setAttribute("object-name", object.name);
      row.setAttribute("object-type", object.type);
      row.setAttribute("inactive", "");

      // Create destruction time element
      const timeSpan = document.createElement("span");
      timeSpan.classList.add("destruction-time");
      timeSpan.textContent = this._formatDestructionTime(destroyedTime);

      infoDiv.appendChild(row);
      infoDiv.appendChild(timeSpan);
      listItem.appendChild(infoDiv);

      this._listElement.appendChild(listItem);
    });
  }

  private _formatDestructionTime(destroyedTime: number): string {
    // Calculate elapsed time in milliseconds
    const elapsedMs = this._lastUpdateTime - destroyedTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    if (elapsedSeconds < 60) {
      return `${elapsedSeconds}s ago`;
    } else if (elapsedSeconds < 3600) {
      const minutes = Math.floor(elapsedSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      return `${hours}h ${minutes}m ago`;
    }
  }
}

// Register the custom element
customElements.define("destroyed-objects-list", DestroyedObjectsList);
