import { mount, unmount } from "svelte";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import { generateIconConfig } from "../../celestial-icons";
import { formatDetailedType } from "../utils/type-formatter";
import { StateAccessor, FlatHierarchyService } from "@teskooano/core-state";
import CelestialRowSvelte from "../components/celestial-row/CelestialRow.svelte";

/**
 * Manages the DOM representation of the celestial object list.
 * This class handles the creation, updating, and interaction logic
 * for the hierarchical list displayed in the FocusControl view.
 */
export class FocusListManager {
  private _rootUlElement: HTMLElement;
  private _destroyedUlElement: HTMLElement;
  private _flatHierarchyService: FlatHierarchyService;
  private _activeRowInstances: ReturnType<typeof mount>[] = [];
  private _destroyedRowInstances: ReturnType<typeof mount>[] = [];

  /**
   * Creates an instance of FocusListManager.
   * @param rootUlElement The root UL element that will contain the tree.
   * @param destroyedUlElement The root UL element for destroyed objects.
   */
  constructor(rootUlElement: HTMLElement, destroyedUlElement: HTMLElement) {
    this._rootUlElement = rootUlElement;
    this._destroyedUlElement = destroyedUlElement;
    this._flatHierarchyService = FlatHierarchyService.getInstance();
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
    for (const instance of this._destroyedRowInstances) unmount(instance);
    this._destroyedRowInstances = [];
    this._destroyedUlElement.innerHTML = "";
    if (destroyedObjects.length === 0) {
      this._destroyedUlElement.innerHTML =
        '<li class="empty-message">No destroyed objects.</li>';
      return;
    }

    // Sort by name
    destroyedObjects.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

    for (const instance of this._destroyedRowInstances) unmount(instance);
    this._destroyedRowInstances = [];

    destroyedObjects.forEach((obj) => {
      const listItem = document.createElement("li");
      listItem.dataset.id = obj.id;

      const instance = mount(CelestialRowSvelte, {
        target: listItem,
        props: {
          objectId: obj.id,
          objectName: obj.name,
          objectType: formatDetailedType(obj),
          config: JSON.stringify(generateIconConfig(obj)),
          inactive: true,
        },
      });
      this._destroyedRowInstances.push(instance);

      this._destroyedUlElement.appendChild(listItem);
    });
  }

  /**
   * Populates the focus list container with a collapsible tree structure.
   * Now uses the FlatHierarchyService for improved performance and consistency.
   * @param objects The current map of all active celestial objects.
   * @param currentFocusedId The ID of the currently focused object, if any.
   */
  public populateHierarchy(
    objects: Record<string, CelestialObject>,
    currentFocusedId: string | null,
  ): void {
    for (const instance of this._activeRowInstances) unmount(instance);
    this._activeRowInstances = [];
    this._rootUlElement.innerHTML = "";

    const hierarchyState = this._flatHierarchyService.getHierarchyState();
    const rootIds = hierarchyState.roots;

    // Sort root objects (stars first, then alphabetically)
    rootIds.sort((a, b) => {
      const objA = objects[a];
      const objB = objects[b];
      if (!objA || !objB) return 0;
      if (objA.type === CelestialType.STAR && objB.type !== CelestialType.STAR)
        return -1;
      if (objA.type !== CelestialType.STAR && objB.type === CelestialType.STAR)
        return 1;
      return (objA.name ?? "").localeCompare(objB.name ?? "");
    });

    if (rootIds.length === 0 && Object.keys(objects).length > 0) {
      this._rootUlElement.innerHTML =
        '<li class="empty-message">Loading hierarchy...</li>';
    } else if (Object.keys(objects).length === 0) {
      this._rootUlElement.innerHTML =
        '<li class="empty-message">No active celestial objects loaded.</li>';
    } else {
      const addItem = (obj: CelestialObject, parentUl: HTMLElement) => {
        const isInactive =
          obj.status === CelestialStatus.DESTROYED ||
          obj.status === CelestialStatus.ANNIHILATED;
        if (isInactive) return; // Should not happen with pre-filtered list, but good safeguard.

        const hierarchyEntry = hierarchyState.entries[obj.id];
        const childrenIds = hierarchyEntry?.children || [];
        const hasChildren = childrenIds.length > 0;
        const isFocused = obj.id === currentFocusedId;

        const listItem = document.createElement("li");
        listItem.dataset.id = obj.id;

        if (isFocused) listItem.classList.add("focused-item");

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
          const rowInstance = mount(CelestialRowSvelte, {
            target: contentDiv,
            props: {
              objectId: obj.id,
              objectName: obj.name,
              objectType: formatDetailedType(obj),
              config: JSON.stringify(generateIconConfig(obj)),
              inactive: false,
            },
          });
          this._activeRowInstances.push(rowInstance);
          listItem.appendChild(contentDiv);

          const nestedUl = document.createElement("ul");
          nestedUl.classList.add("nested");
          nestedUl.setAttribute("id", `subtree-${obj.id}`);

          if (shouldExpand) {
            nestedUl.classList.add("active");
          }

          childrenIds.sort((a, b) =>
            (objects[a]?.name ?? "").localeCompare(objects[b]?.name ?? ""),
          );
          childrenIds.forEach((childId) => {
            const childObj = objects[childId];
            if (childObj) addItem(childObj, nestedUl);
          });
          listItem.appendChild(nestedUl);
        } else {
          contentDiv.classList.add("leaf-node");
          const leafInstance = mount(CelestialRowSvelte, {
            target: contentDiv,
            props: {
              objectId: obj.id,
              objectName: obj.name,
              objectType: formatDetailedType(obj),
              config: JSON.stringify(generateIconConfig(obj)),
              inactive: false,
            },
          });
          this._activeRowInstances.push(leafInstance);
          listItem.appendChild(contentDiv);
        }

        parentUl.appendChild(listItem);
      };

      rootIds.forEach((id) => {
        const rootObj = objects[id];
        if (rootObj) addItem(rootObj, this._rootUlElement);
      });
    }
  }

  /**
   * Updates the visual highlight on the appropriate <celestial-row> component.
   * @param focusedId The ID of the object to highlight, or null.
   */
  public updateHighlight(focusedId: string | null): void {
    const currentlyFocused =
      this._rootUlElement.querySelector<HTMLElement>("li.focused-item");
    currentlyFocused?.classList.remove("focused-item");

    if (focusedId) {
      const targetLi = this._rootUlElement.querySelector<HTMLElement>(
        `li[data-id="${focusedId}"]`,
      );
      const isInactive =
        targetLi?.classList.contains("destroyed") ||
        targetLi?.classList.contains("annihilated");

      if (targetLi && !isInactive) {
        targetLi.classList.add("focused-item");
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
