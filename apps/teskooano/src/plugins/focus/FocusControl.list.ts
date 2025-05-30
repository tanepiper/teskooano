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
 */
export function populateFocusList(
  rootUlElement: HTMLElement,
  objects: Record<string, CelestialObject>,
  currentFocusedId: string | null,
): void {
  rootUlElement.innerHTML = "";

  const objectMap = new Map(Object.entries(objects));
  const dynamicHierarchy = new Map<string | null, string[]>();
  objectMap.forEach((obj, id) => {
    const parentKey = obj.currentParentId ?? obj.parentId ?? null;
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
      !obj.currentParentId &&
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
    rootUlElement.innerHTML =
      '<li class="empty-message">Loading hierarchy...</li>';
  } else if (objectMap.size === 0) {
    rootUlElement.innerHTML =
      '<li class="empty-message">No celestial objects loaded.</li>';
  } else {
    const addItem = (obj: CelestialObject, parentUl: HTMLElement) => {
      const isDestroyed = obj.status === CelestialStatus.DESTROYED;
      const isAnnihilated = obj.status === CelestialStatus.ANNIHILATED;
      const isInactive = isDestroyed || isAnnihilated;
      const childrenIds = dynamicHierarchy.get(obj.id) || [];
      const hasChildren = childrenIds.length > 0;
      const isFocused = !isInactive && obj.id === currentFocusedId;

      const listItem = document.createElement("li");
      listItem.dataset.id = obj.id;
      if (isDestroyed) listItem.classList.add("destroyed");
      if (isAnnihilated) listItem.classList.add("annihilated");

      const row = document.createElement("celestial-row");
      row.setAttribute("object-id", obj.id);
      row.setAttribute("object-name", obj.name);
      row.setAttribute("object-type", obj.type);
      if (isInactive) row.setAttribute("inactive", "");
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
      if (rootObj) addItem(rootObj, rootUlElement);
    });
  }
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
    if (isInactive) {
      caretElement.classList.remove("caret-down");
      caretElement.setAttribute("aria-expanded", "false");
      const nestedUl =
        listItem.querySelector<HTMLUListElement>(":scope > .nested");
      nestedUl?.classList.remove("active");
    }
  }
  return false;
}
