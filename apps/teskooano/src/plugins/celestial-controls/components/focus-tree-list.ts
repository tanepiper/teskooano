import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  StarProperties,
} from "@teskooano/data-types";
import { BaseCelestialList } from "./base-celestial-list.js";
import "./celestial-row.js";
import { buildHierarchy } from "../utils/hierarchy-builder.js";

/**
 * Helper function to get the orbital distance for sorting.
 * Returns the real semi-major axis in meters, or 0 for objects without orbits (like stars).
 */
function getOrbitalDistance(obj: CelestialObject): number {
  return obj.orbit?.realSemiMajorAxis_m || 0;
}

/**
 * Custom web component that displays a hierarchical tree of celestial objects.
 * Handles collapsible/expandable nodes and focus highlighting.
 *
 * @element focus-tree-list
 *
 * @fires focus-object - Fired when a celestial object is clicked
 * @fires follow-object - Fired when a celestial object follow is requested
 *
 * @example
 * ```html
 * <focus-tree-list></focus-tree-list>
 * ```
 */
export class FocusTreeList extends BaseCelestialList {
  private _focusedId: string | null = null;

  constructor() {
    super();
    this._rootUl.id = "focus-tree-list";
    this._rootUl.classList.add("focus-tree");
  }

  /**
   * Sets the currently focused object ID.
   * @param objectId - The ID of the object to focus, or null
   */
  setFocusedObject(objectId: string | null): void {
    this._focusedId = objectId;
    this._updateFocusHighlight();
  }

  /**
   * Updates the status of a specific object in the list.
   * @param objectId - The ID of the object to update
   * @param status - The new status
   * @returns True if the object was not found
   */
  updateObjectStatus(objectId: string, status: CelestialStatus): boolean {
    const listItem = this._rootUl.querySelector(`li[data-id="${objectId}"]`);
    if (!listItem) {
      console.warn(
        `[FocusTreeList] List item for object ${objectId} not found.`,
      );
      return true;
    }

    const rowElement = listItem.querySelector<HTMLElement>(
      "celestial-row.focus-row-item",
    );
    const caretElement = listItem.querySelector<HTMLElement>(
      ":scope > .list-item-content > .caret",
    );

    const isDestroyed = status === CelestialStatus.DESTROYED;
    const isAnnihilated = status === CelestialStatus.ANNIHILATED;
    const isInactive = isDestroyed || isAnnihilated;

    listItem.classList.toggle("destroyed", isDestroyed);
    listItem.classList.toggle("annihilated", isAnnihilated);

    if (rowElement) {
      rowElement.toggleAttribute("inactive", isInactive);
      if (isInactive) {
        rowElement.removeAttribute("focused");
      }
    }

    if (caretElement) {
      caretElement.classList.toggle("inactive-caret", isInactive);
      if (isInactive) {
        caretElement.style.pointerEvents = "none";
        caretElement.style.opacity = "0.5";
      } else {
        caretElement.style.pointerEvents = "";
        caretElement.style.opacity = "";
      }
    }

    return false;
  }

  /**
   * Gets the count of active objects currently displayed.
   */
  get activeObjectCount(): number {
    return Object.values(this._objects).filter(
      (obj) => obj.status === CelestialStatus.ACTIVE,
    ).length;
  }

  protected getEmptyMessage(): string {
    return "No active celestial objects";
  }

  protected getBaseStyles(): string {
    return (
      super.getBaseStyles() +
      `
      .list-item-content {
        display: flex;
        align-items: center;
        gap: var(--space-1); /* 4px */
      }
      
      .leaf-node {
        padding-left: var(--spacing-md); /* 20px -> 16px */
      }
      
      .caret {
        cursor: pointer;
        user-select: none;
        display: inline-block;
        width: var(--spacing-md); /* 16px */
        transition: transform var(--transition-duration-fast);
      }
      
      .caret::before {
        content: '▶';
        font-size: var(--font-size-1); /* 12px */
      }
      
      .caret-down {
        transform: rotate(90deg);
      }
      
      .caret.inactive-caret {
        opacity: 0.5;
        pointer-events: none;
      }
      
      .nested {
        display: none;
        padding-left: var(--spacing-md); /* 20px -> 16px */
      }
      
      .nested.active {
        display: block;
      }
    `
    );
  }

  protected filterObjects(
    objects: Record<string, CelestialObject>,
  ): CelestialObject[] {
    // Filter out destroyed/annihilated objects
    return Object.values(objects).filter(
      (obj) => obj.status === CelestialStatus.ACTIVE,
    );
  }

  protected renderItem(obj: CelestialObject, parentUl: HTMLElement): void {
    // Build hierarchy for this specific render
    const activeObjects = this.filterObjects(this._objects);
    const objectMap = new Map(activeObjects.map((o) => [o.id, o]));
    const dynamicHierarchy = new Map<string | null, string[]>();

    // Build hierarchy
    objectMap.forEach((obj, id) => {
      const parentKey = obj.currentParentId ?? obj.parentId ?? null;
      if (!dynamicHierarchy.has(parentKey)) {
        dynamicHierarchy.set(parentKey, []);
      }
      dynamicHierarchy.get(parentKey)!.push(id);
    });

    this._addItem(obj, parentUl, dynamicHierarchy, objectMap);
  }

  protected _rebuild(): number {
    this._rootUl.innerHTML = "";

    const { objectMap, dynamicHierarchy, rootIds } = buildHierarchy(
      this._objects,
    );

    if (rootIds.length === 0 && objectMap.size > 0) {
      this._rootUl.innerHTML =
        '<li class="empty-message">Loading hierarchy...</li>';
    } else if (objectMap.size === 0) {
      this._rootUl.appendChild(this._emptyMessage);
    } else {
      rootIds.forEach((id: string) => {
        const rootObj = objectMap.get(id);
        if (rootObj)
          this._addItem(rootObj, this._rootUl, dynamicHierarchy, objectMap);
      });
    }

    this._updateFocusHighlight();
    return objectMap.size;
  }

  private _addItem(
    obj: CelestialObject,
    parentUl: HTMLElement,
    dynamicHierarchy: Map<string | null, string[]>,
    objectMap: Map<string, CelestialObject>,
  ): void {
    const childrenIds = dynamicHierarchy.get(obj.id) || [];
    const hasChildren = childrenIds.length > 0;
    const isFocused = obj.id === this._focusedId;

    const listItem = document.createElement("li");
    listItem.dataset.id = obj.id;

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

    if (isFocused) row.setAttribute("focused", "");
    row.classList.add("focus-row-item");

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("list-item-content");

    if (hasChildren) {
      const caretSpan = document.createElement("span");
      caretSpan.classList.add("caret");
      caretSpan.setAttribute("role", "button");
      caretSpan.setAttribute("aria-controls", `subtree-${obj.id}`);

      const shouldExpand = obj.type === CelestialType.STAR;
      caretSpan.setAttribute("aria-expanded", shouldExpand.toString());
      if (shouldExpand) {
        caretSpan.classList.add("caret-down");
      }

      contentDiv.appendChild(caretSpan);
      contentDiv.appendChild(row);
      listItem.appendChild(contentDiv);

      const nestedUl = document.createElement("ul");
      nestedUl.classList.add("nested");
      nestedUl.setAttribute("id", `subtree-${obj.id}`);

      if (shouldExpand) {
        nestedUl.classList.add("active");
      }

      // Sort children by distance from barycenter instead of name
      childrenIds.sort((a, b) => {
        const childA = objectMap.get(a);
        const childB = objectMap.get(b);
        if (!childA || !childB) return 0;

        const distanceA = getOrbitalDistance(childA);
        const distanceB = getOrbitalDistance(childB);
        return distanceA - distanceB;
      });

      childrenIds.forEach((childId) => {
        const childObj = objectMap.get(childId);
        if (childObj)
          this._addItem(childObj, nestedUl, dynamicHierarchy, objectMap);
      });

      listItem.appendChild(nestedUl);
    } else {
      contentDiv.classList.add("leaf-node");
      contentDiv.appendChild(row);
      listItem.appendChild(contentDiv);
    }

    parentUl.appendChild(listItem);
  }

  private _updateFocusHighlight(): void {
    const currentlyFocused = this._rootUl.querySelector(
      "celestial-row[focused]",
    );
    currentlyFocused?.removeAttribute("focused");

    if (this._focusedId) {
      const targetLi = this._rootUl.querySelector(
        `li[data-id="${this._focusedId}"]`,
      );
      const targetRow = targetLi?.querySelector<HTMLElement>(
        "celestial-row.focus-row-item",
      );
      const isInactive =
        targetLi?.classList.contains("destroyed") ||
        targetLi?.classList.contains("annihilated");

      if (targetRow && !isInactive) {
        targetRow.setAttribute("focused", "");
      }
    }
  }

  protected _handleClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Handle caret clicks
    if (target.classList.contains("caret")) {
      event.stopPropagation();
      const isExpanded = target.getAttribute("aria-expanded") === "true";
      target.setAttribute("aria-expanded", (!isExpanded).toString());
      target.classList.toggle("caret-down", !isExpanded);

      const controls = target.getAttribute("aria-controls");
      if (controls) {
        const nestedList = this._rootUl.querySelector(`#${controls}`);
        nestedList?.classList.toggle("active", !isExpanded);
      }
      return;
    }
  }
}

// Register the custom element
customElements.define("focus-tree-list", FocusTreeList);
