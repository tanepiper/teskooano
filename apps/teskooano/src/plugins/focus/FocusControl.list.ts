import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import "./CelestialRow";

/**
 * Populates the focus list container with a collapsible tree structure,
 * using <celestial-row> components for each item.
 *
 * @param rootUlElement - The root UL element to populate (should have id="focus-tree-list").
 * @param objects - The current map of all celestial objects.
 * @param currentFocusedId - The ID of the currently focused object, if any.
 * @returns The count of active objects
 */
export function populateFocusList(
  rootUlElement: HTMLElement,
  objects: Record<string, CelestialObject>,
  currentFocusedId: string | null,
): number {
  rootUlElement.innerHTML = "";

  // Filter out destroyed/annihilated objects
  const activeObjects: Record<string, CelestialObject> = {};
  Object.entries(objects).forEach(([id, obj]) => {
    if (obj.status === CelestialStatus.ACTIVE) {
      activeObjects[id] = obj;
    }
  });

  const objectMap = new Map(Object.entries(activeObjects));
  const dynamicHierarchy = new Map<string | null, string[]>();
  
  // Build hierarchy using currentParentId if available, otherwise fall back to parentId
  objectMap.forEach((obj, id) => {
    const parentKey = obj.currentParentId ?? obj.parentId ?? null;
    if (!dynamicHierarchy.has(parentKey)) {
      dynamicHierarchy.set(parentKey, []);
    }
    dynamicHierarchy.get(parentKey)!.push(id);
  });

  // Find root objects (objects with no parent)
  const rootIds = dynamicHierarchy.get(null) || [];
  
  // Handle objects whose parents no longer exist
  dynamicHierarchy.forEach((children, parentId) => {
    if (parentId !== null && !objectMap.has(parentId)) {
      // Parent doesn't exist, move children to root
      rootIds.push(...children);
    }
  });
  
  // Ensure all stars without parents are included at root level
  objectMap.forEach((obj, id) => {
    if (
      obj.type === CelestialType.STAR &&
      !obj.parentId &&
      !obj.currentParentId &&
      !rootIds.includes(id)
    ) {
      rootIds.push(id);
    }
  });

  // Sort root objects: stars first, then by name
  rootIds.sort((a, b) => {
    const objA = objectMap.get(a);
    const objB = objectMap.get(b);
    if (!objA || !objB) return 0;
    
    // Stars before non-stars
    if (objA.type === CelestialType.STAR && objB.type !== CelestialType.STAR)
      return -1;
    if (objA.type !== CelestialType.STAR && objB.type === CelestialType.STAR)
      return 1;
    
    return (objA.name ?? "").localeCompare(objB.name ?? "");
  });

  if (rootIds.length === 0 && objectMap.size > 0) {
    rootUlElement.innerHTML =
      '<li class="empty-message">Loading hierarchy...</li>';
  } else if (objectMap.size === 0) {
    rootUlElement.innerHTML =
      '<li class="empty-message">No active celestial objects</li>';
  } else {
    const addItem = (obj: CelestialObject, parentUl: HTMLElement) => {
      const childrenIds = dynamicHierarchy.get(obj.id) || [];
      const hasChildren = childrenIds.length > 0;
      const isFocused = obj.id === currentFocusedId;

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

        // Expand stars by default
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

        // Sort children by name
        childrenIds.sort((a, b) => {
          const childA = objectMap.get(a);
          const childB = objectMap.get(b);
          if (!childA || !childB) return 0;
          
          return (childA.name ?? "").localeCompare(childB.name ?? "");
        });
        
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
      if (rootObj) addItem(rootObj, rootUlElement);
    });
  }
  
  return objectMap.size;
}

/**
 * Updates the visual highlight by setting/removing the 'focused' attribute
 * on the appropriate <celestial-row> component.
 *
 * @param listContainer - The root UL element.
 * @param focusedId - The ID of the object to highlight, or null.
 */
export function updateFocusHighlight(
  listContainer: HTMLElement,
  focusedId: string | null,
): void {
  const currentlyFocused = listContainer.querySelector(
    "celestial-row[focused]",
  );
  currentlyFocused?.removeAttribute("focused");

  if (focusedId) {
    const targetLi = listContainer.querySelector(`li[data-id="${focusedId}"]`);
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
 * Sets classes on the LI and the 'inactive' attribute on the <celestial-row>.
 *
 * @param listContainer - The root UL element.
 * @param objectId - The ID of the object to update.
 * @param status - The new status.
 * @returns boolean - True if the LI element was not found.
 */
export function updateObjectStatusInList(
  listContainer: HTMLElement,
  objectId: string,
  status: CelestialStatus,
): boolean {
  const listItem = listContainer.querySelector(`li[data-id="${objectId}"]`);
  if (!listItem) {
    console.warn(
      `[FocusControl.list] List item LI for object ${objectId} not found.`,
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
    // Don't automatically collapse the hierarchy when a parent is destroyed
    // The children might still be active and accessible after parent reassignment
    // Only disable the caret interaction for the destroyed object itself
    if (isInactive) {
      // Keep the hierarchy expanded so users can still access child objects
      // that may have been reassigned to new parents
      caretElement.style.pointerEvents = "none"; // Disable caret interaction
      caretElement.style.opacity = "0.5"; // Visual indication it's disabled
    } else {
      // Re-enable caret interaction if object becomes active again
      caretElement.style.pointerEvents = "";
      caretElement.style.opacity = "";
    }
  }
  return false;
}
