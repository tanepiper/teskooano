import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  StarProperties,
} from "@teskooano/data-types";
import { BaseCelestialList } from "./base-celestial-list";
import "./celestial-row.js";
import "./relative-time";

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
export class DestroyedObjectsList extends BaseCelestialList {
  private _destroyedObjects: DestroyedObjectInfo[] = [];
  private _lastUpdateTime: number = Date.now();

  constructor() {
    super();
    this._rootUl.id = "destroyed-list";
    this._rootUl.classList.add("destroyed-list");
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
    this._rebuild();
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
    this._rebuild();
  }

  protected getEmptyMessage(): string {
    return "No destroyed objects";
  }

  protected getBaseStyles(): string {
    return (
      super.getBaseStyles() +
      `
      li {
        padding: calc(var(--space-1) / 2) 0; /* 2px 0 */
        opacity: 0.7;
      }
      
      li.annihilated {
        opacity: 0.5;
      }
      
      .destruction-info {
        display: flex;
        align-items: center;
        gap: var(--space-2); /* 8px */
      }
      
      celestial-row {
        flex: 1;
      }
    `
    );
  }

  protected filterObjects(
    objects: Record<string, CelestialObject>,
  ): CelestialObject[] {
    // This method is not used for destroyed objects list since we manage our own array
    return this._destroyedObjects.map((info) => info.object);
  }

  protected renderItem(obj: CelestialObject, parentUl: HTMLElement): void {
    // Find the destroyed object info for this object
    const destroyedInfo = this._destroyedObjects.find(
      (info) => info.object.id === obj.id,
    );
    if (!destroyedInfo) return;

    const listItem = document.createElement("li");
    listItem.dataset.id = obj.id;

    if (obj.status === CelestialStatus.ANNIHILATED) {
      listItem.classList.add("annihilated");
    }

    const infoDiv = document.createElement("div");
    infoDiv.classList.add("destruction-info");

    // Create celestial row
    const row = document.createElement("celestial-row");
    row.setAttribute("object-id", obj.id);
    row.setAttribute("object-name", obj.name);
    row.setAttribute("object-type", obj.type);

    // Add stellar type for stars
    if (obj.type === CelestialType.STAR && obj.properties) {
      const starProps = obj.properties as StarProperties;
      if (starProps.stellarType) {
        row.setAttribute("stellar-type", starProps.stellarType);
      }
    }

    row.setAttribute("inactive", "");

    // Create relative time element
    const timeElement = document.createElement("relative-time");
    timeElement.setAttribute(
      "timestamp",
      destroyedInfo.destroyedTime.toString(),
    );

    infoDiv.appendChild(row);
    infoDiv.appendChild(timeElement);
    listItem.appendChild(infoDiv);

    parentUl.appendChild(listItem);
  }

  protected _rebuild(): number {
    this._rootUl.innerHTML = "";

    if (this._destroyedObjects.length === 0) {
      this._rootUl.appendChild(this._emptyMessage);
      return 0;
    }

    // Render each destroyed object
    this._destroyedObjects.forEach(({ object }) => {
      this.renderItem(object, this._rootUl);
    });

    return this._destroyedObjects.length;
  }
}

// Register the custom element
customElements.define("destroyed-objects-list", DestroyedObjectsList);
