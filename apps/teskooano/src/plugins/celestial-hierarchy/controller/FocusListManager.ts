import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import { generateIconConfig } from "../../celestial-icons";
import { formatDetailedType } from "../utils/type-formatter";
import { StateAccessor } from "@teskooano/core-state";

/**
 * Manages the DOM representation of the celestial object list.
 * This class handles the creation, updating, and interaction logic
 * for the hierarchical list displayed in the FocusControl view.
 */
export class FocusListManager {
  private _rootUlElement: HTMLElement;
  private _destroyedUlElement: HTMLElement;
  private _parentPanel: any = null;

  /**
   * Creates an instance of FocusListManager.
   * @param rootUlElement The root UL element that will contain the tree.
   * @param destroyedUlElement The root UL element for destroyed objects.
   */
  constructor(rootUlElement: HTMLElement, destroyedUlElement: HTMLElement) {
    this._rootUlElement = rootUlElement;
    this._destroyedUlElement = destroyedUlElement;
  }

  /**
   * Sets the parent panel reference for accessing renderer.
   */
  public setParentPanel(panel: any): void {
    this._parentPanel = panel;
  }

  /**
   * Populates both the hierarchy and destroyed lists by partitioning the objects.
   * @param objects The current map of all celestial objects.
   * @param currentFocusedId The ID of the currently focused object, if any.
   */
  public populate(
    _objects: Record<string, CelestialObject>,
    currentFocusedId: string | null,
  ): void {
    // Use pre-filtered objects instead of manual filtering
    const activeObjects = StateAccessor.getActiveObjects();
    const destroyedObjects = Object.values(StateAccessor.getDestroyedObjects());

    this.populateHierarchy(activeObjects, currentFocusedId);
    this.populateDestroyedList(destroyedObjects);
  }

  /**
   * Populates the destroyed list container with a simple list of objects.
   * @param destroyedObjects An array of celestial objects that are destroyed or annihilated.
   */
  private populateDestroyedList(destroyedObjects: CelestialObject[]): void {
    this._destroyedUlElement.innerHTML = "";
    if (destroyedObjects.length === 0) {
      this._destroyedUlElement.innerHTML =
        '<li class="empty-message">No destroyed objects.</li>';
      return;
    }

    // Sort by name
    destroyedObjects.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

    destroyedObjects.forEach((obj) => {
      const listItem = document.createElement("li");
      listItem.dataset.id = obj.id;

      const row = document.createElement("celestial-row");
      row.setAttribute("object-id", obj.id);
      row.setAttribute("object-name", obj.name);
      row.setAttribute("object-type", formatDetailedType(obj));

      const iconConfig = generateIconConfig(obj);
      row.setAttribute("config", JSON.stringify(iconConfig));
      row.setAttribute("inactive", ""); // Always inactive

      // Set parent panel reference for action menu functionality
      if (
        this._parentPanel &&
        typeof (row as any).setParentPanel === "function"
      ) {
        (row as any).setParentPanel(this._parentPanel);
      }

      listItem.appendChild(row);
      this._destroyedUlElement.appendChild(listItem);
    });
  }

  /**
   * Populates the focus list container with a collapsible tree structure.
   * @param objects The current map of all active celestial objects.
   * @param currentFocusedId The ID of the currently focused object, if any.
   */
  public populateHierarchy(
    objects: Record<string, CelestialObject>,
    currentFocusedId: string | null,
  ): void {
    this._rootUlElement.innerHTML = "";

    const objectMap = new Map(Object.entries(objects));
    const dynamicHierarchy = new Map<string | null, string[]>();
    objectMap.forEach((obj, id) => {
      const parentKey = obj.parentId ?? null;
      if (!dynamicHierarchy.has(parentKey)) {
        dynamicHierarchy.set(parentKey, []);
      }
      dynamicHierarchy.get(parentKey)!.push(id);
    });

    const rootIds = dynamicHierarchy.get(null) || [];
    dynamicHierarchy.forEach((children, parentId) => {
      if (parentId !== null && !objectMap.has(parentId)) {
        rootIds.push(...children);
      }
    });
    objectMap.forEach((obj, id) => {
      if (
        obj.type === CelestialType.STAR &&
        !obj.parentId &&
        !rootIds.includes(id)
      ) {
        rootIds.push(id);
      }
    });

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
      this._rootUlElement.innerHTML =
        '<li class="empty-message">Loading hierarchy...</li>';
    } else if (objectMap.size === 0) {
      this._rootUlElement.innerHTML =
        '<li class="empty-message">No active celestial objects loaded.</li>';
    } else {
      const addItem = (obj: CelestialObject, parentUl: HTMLElement) => {
        const isInactive =
          obj.status === CelestialStatus.DESTROYED ||
          obj.status === CelestialStatus.ANNIHILATED;
        if (isInactive) return; // Should not happen with pre-filtered list, but good safeguard.

        const childrenIds = dynamicHierarchy.get(obj.id) || [];
        const hasChildren = childrenIds.length > 0;
        const isFocused = obj.id === currentFocusedId;

        const listItem = document.createElement("li");
        listItem.dataset.id = obj.id;

        const row = document.createElement("celestial-row");
        row.setAttribute("object-id", obj.id);
        row.setAttribute("object-name", obj.name);
        row.setAttribute("object-type", formatDetailedType(obj));

        const iconConfig = generateIconConfig(obj);
        row.setAttribute("config", JSON.stringify(iconConfig));

        if (isFocused) row.setAttribute("focused", "");

        row.classList.add("focus-row-item");

        // Set parent panel reference for action menu functionality
        if (
          this._parentPanel &&
          typeof (row as any).setParentPanel === "function"
        ) {
          (row as any).setParentPanel(this._parentPanel);
        }

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

          childrenIds.sort((a, b) =>
            (objectMap.get(a)?.name ?? "").localeCompare(
              objectMap.get(b)?.name ?? "",
            ),
          );
          childrenIds.forEach((childId) => {
            const childObj = objectMap.get(childId);
            if (childObj) addItem(childObj, nestedUl);
          });
          listItem.appendChild(nestedUl);
        } else {
          contentDiv.classList.add("leaf-node");
          contentDiv.appendChild(row);
          listItem.appendChild(contentDiv);
        }

        parentUl.appendChild(listItem);
      };

      rootIds.forEach((id) => {
        const rootObj = objectMap.get(id);
        if (rootObj) addItem(rootObj, this._rootUlElement);
      });
    }
  }

  /**
   * Updates the visual highlight on the appropriate <celestial-row> component.
   * @param focusedId The ID of the object to highlight, or null.
   */
  public updateHighlight(focusedId: string | null): void {
    const currentlyFocused = this._rootUlElement.querySelector(
      "celestial-row[focused]",
    );
    currentlyFocused?.removeAttribute("focused");

    if (focusedId) {
      const targetLi = this._rootUlElement.querySelector(
        `li[data-id="${focusedId}"]`,
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

  /**
   * Updates the status of an object's representation in the list.
   * @param objectId The ID of the object to update.
   * @param status The new status.
   * @returns True if a full refresh is needed.
   */
  public updateObjectStatus(
    objectId: string,
    status: CelestialStatus,
  ): boolean {
    const listItem = this._rootUlElement.querySelector(
      `li[data-id="${objectId}"]`,
    );
    if (!listItem) {
      console.warn(
        `[FocusListManager] List item LI for object ${objectId} not found.`,
      );
      return true;
    }

    const isDestroyed = [
      CelestialStatus.DESTROYED,
      CelestialStatus.ANNIHILATED,
    ].includes(status);

    if (isDestroyed) {
      // The object has been destroyed, it needs to move to the other list.
      // The easiest and safest way to handle this structural change is to
      // trigger a full refresh of both lists.
      return true;
    }

    // This logic would handle non-destructive status changes, but we don't
    // have any right now. Returning false as no refresh is needed.
    return false;
  }
}
