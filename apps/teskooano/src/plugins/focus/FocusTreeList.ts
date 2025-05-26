import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import "./CelestialRow";

/**
 * Custom web component that displays a hierarchical tree of celestial objects.
 * Handles collapsible/expandable nodes and focus highlighting.
 *
 * @element focus-tree-list
 *
 * @fires focus-object - Fired when a celestial object is clicked
 *
 * @example
 * ```html
 * <focus-tree-list></focus-tree-list>
 * ```
 *
 * ```javascript
 * const treeList = document.querySelector('focus-tree-list');
 * treeList.updateObjects(celestialObjects);
 * treeList.setFocusedObject('object-id');
 * ```
 */
export class FocusTreeList extends HTMLElement {
  private _objects: Record<string, CelestialObject> = {};
  private _focusedId: string | null = null;
  private _rootUl: HTMLUListElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Create the root UL element
    this._rootUl = document.createElement("ul");
    this._rootUl.id = "focus-tree-list";
    this._rootUl.classList.add("focus-tree");

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
        position: relative;
      }
      
      .list-item-content {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .leaf-node {
        padding-left: 20px;
      }
      
      .caret {
        cursor: pointer;
        user-select: none;
        display: inline-block;
        width: 16px;
        transition: transform 0.2s;
      }
      
      .caret::before {
        content: '▶';
        font-size: 12px;
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
        padding-left: 20px;
      }
      
      .nested.active {
        display: block;
      }
      
      .destroyed {
        opacity: 0.7;
      }
      
      .annihilated {
        opacity: 0.5;
      }
      
      .empty-message {
        padding: 16px;
        text-align: center;
        opacity: 0.6;
        font-style: italic;
      }
    `;

    this.shadowRoot!.appendChild(style);
    this.shadowRoot!.appendChild(this._rootUl);

    // Set up event delegation
    this._rootUl.addEventListener("click", this._handleClick.bind(this));
  }

  /**
   * Updates the celestial objects and rebuilds the tree.
   * @param objects - The celestial objects to display
   * @returns The count of active objects
   */
  updateObjects(objects: Record<string, CelestialObject>): number {
    this._objects = objects;
    return this._rebuild();
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

  private _rebuild(): number {
    this._rootUl.innerHTML = "";

    // Filter out destroyed/annihilated objects
    const activeObjects: Record<string, CelestialObject> = {};
    Object.entries(this._objects).forEach(([id, obj]) => {
      if (obj.status === CelestialStatus.ACTIVE) {
        activeObjects[id] = obj;
      }
    });

    const objectMap = new Map(Object.entries(activeObjects));
    const dynamicHierarchy = new Map<string | null, string[]>();

    // Build hierarchy
    objectMap.forEach((obj, id) => {
      const parentKey = obj.currentParentId ?? obj.parentId ?? null;
      if (!dynamicHierarchy.has(parentKey)) {
        dynamicHierarchy.set(parentKey, []);
      }
      dynamicHierarchy.get(parentKey)!.push(id);
    });

    // Find root objects - use a Set to prevent duplicates
    const rootIdsSet = new Set<string>();

    // Add objects with no parent
    const directRoots = dynamicHierarchy.get(null) || [];
    directRoots.forEach((id) => rootIdsSet.add(id));

    // Handle orphaned objects (whose parents don't exist)
    dynamicHierarchy.forEach((children, parentId) => {
      if (parentId !== null && !objectMap.has(parentId)) {
        children.forEach((id) => rootIdsSet.add(id));
      }
    });

    // Ensure all stars without parents are included
    objectMap.forEach((obj, id) => {
      if (
        obj.type === CelestialType.STAR &&
        !obj.parentId &&
        !obj.currentParentId
      ) {
        rootIdsSet.add(id);
      }
    });

    // Convert to array for sorting
    const rootIds = Array.from(rootIdsSet);

    // Sort root objects
    rootIds.sort((a, b) => {
      const objA = objectMap.get(a);
      const objB = objectMap.get(b);
      if (!objA || !objB) return 0;

      if (objA.type === CelestialType.STAR && objB.type !== CelestialType.STAR)
        return -1;
      if (objA.type !== CelestialType.STAR && objB.type === CelestialType.STAR)
        return 1;

      return (objA.name ?? "").localeCompare(objB.name ?? "");
    });

    if (rootIds.length === 0 && objectMap.size > 0) {
      this._rootUl.innerHTML =
        '<li class="empty-message">Loading hierarchy...</li>';
    } else if (objectMap.size === 0) {
      this._rootUl.innerHTML =
        '<li class="empty-message">No active celestial objects</li>';
    } else {
      rootIds.forEach((id) => {
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

      // Sort children
      childrenIds.sort((a, b) => {
        const childA = objectMap.get(a);
        const childB = objectMap.get(b);
        if (!childA || !childB) return 0;
        return (childA.name ?? "").localeCompare(childB.name ?? "");
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

  private _handleClick(event: Event): void {
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

    // Check if the event is a focus-request from a celestial-row
    if (event.type === "focus-request") {
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

    // Check if the event is a follow-request from a celestial-row
    if (event.type === "follow-request") {
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
  }

  connectedCallback() {
    // Listen for focus-request and follow-request events from celestial-row components
    this._rootUl.addEventListener(
      "focus-request",
      this._handleClick.bind(this),
    );
    this._rootUl.addEventListener(
      "follow-request",
      this._handleClick.bind(this),
    );
  }

  disconnectedCallback() {
    this._rootUl.removeEventListener(
      "focus-request",
      this._handleClick.bind(this),
    );
    this._rootUl.removeEventListener(
      "follow-request",
      this._handleClick.bind(this),
    );
  }
}
