import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import "./CelestialRow"; // Ensure the component is defined before use

/**
 * Gets the appropriate CSS class for a celestial object type icon.
 */
function getIconClass(type: CelestialType): string {
  switch (type) {
    case CelestialType.STAR:
      return "star-icon";
    case CelestialType.PLANET:
      return "planet-icon";
    case CelestialType.GAS_GIANT:
      return "gas-giant-icon";
    case CelestialType.DWARF_PLANET:
      return "planet-icon"; // Reusing planet icon
    case CelestialType.MOON:
      return "moon-icon";
    case CelestialType.ASTEROID_FIELD:
      return "asteroid-field-icon";
    case CelestialType.OORT_CLOUD:
      return "oort-cloud-icon";
    default:
      return "default-icon";
  }
}

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
  rootUlElement.innerHTML = ""; // Clear previous list

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

  // Sort roots
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
    // Recursive function to add items
    const addItem = (obj: CelestialObject, parentUl: HTMLElement) => {
      const isDestroyed = obj.status === CelestialStatus.DESTROYED;
      const isAnnihilated = obj.status === CelestialStatus.ANNIHILATED;
      const isInactive = isDestroyed || isAnnihilated;
      const childrenIds = dynamicHierarchy.get(obj.id) || [];
      const hasChildren = childrenIds.length > 0;
      const isFocused = !isInactive && obj.id === currentFocusedId;

      const listItem = document.createElement("li");
      listItem.dataset.id = obj.id; // Keep ID on li for hierarchy/status targeting
      if (isDestroyed) listItem.classList.add("destroyed");
      if (isAnnihilated) listItem.classList.add("annihilated");

      // Create the Celestial Row element
      const row = document.createElement("celestial-row");
      row.setAttribute("object-id", obj.id);
      row.setAttribute("object-name", obj.name);
      row.setAttribute("object-type", obj.type);
      if (isInactive) row.setAttribute("inactive", "");
      if (isFocused) row.setAttribute("focused", "");
      // Add a class to easily find the row within the LI
      row.classList.add("focus-row-item");

      // Content container within the LI
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("list-item-content"); // For styling flex/grid

      if (hasChildren) {
        // --- Item with children: Add caret SPAN and the ROW ---
        const caretSpan = document.createElement("span");
        caretSpan.classList.add("caret");
        // Add WAI-ARIA attributes for accessibility
        caretSpan.setAttribute("role", "button");
        caretSpan.setAttribute("aria-controls", `subtree-${obj.id}`); // Link to the nested UL

        // --- START: Default expand for stars ---
        const shouldExpand = obj.type === CelestialType.STAR;
        caretSpan.setAttribute("aria-expanded", shouldExpand.toString());
        if (shouldExpand) {
          caretSpan.classList.add("caret-down");
        }
        // --- END: Default expand for stars ---

        // No text content for the caret itself, it's just the ::before pseudo-element
        contentDiv.appendChild(caretSpan);
        contentDiv.appendChild(row); // Row is next to the caret
        listItem.appendChild(contentDiv);

        // Create nested list
        const nestedUl = document.createElement("ul");
        nestedUl.classList.add("nested");
        nestedUl.setAttribute("id", `subtree-${obj.id}`); // ID for aria-controls

        // --- START: Default expand for stars (UL part) ---
        if (shouldExpand) {
          nestedUl.classList.add("active");
        }
        // --- END: Default expand for stars (UL part) ---

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
        // --- Leaf node: Just add the ROW ---
        contentDiv.classList.add("leaf-node"); // Add class for potential specific styling (e.g., indent)
        contentDiv.appendChild(row); // Only the row is needed
        listItem.appendChild(contentDiv);
      }

      parentUl.appendChild(listItem);
    };

    // Start recursion
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
  // Remove focused attribute from previously focused row
  const currentlyFocused = listContainer.querySelector(
    "celestial-row[focused]",
  );
  currentlyFocused?.removeAttribute("focused");

  // Add focused attribute to the new target row if it exists and is not inactive
  if (focusedId) {
    const targetLi = listContainer.querySelector(`li[data-id="${focusedId}"]`);
    const targetRow = targetLi?.querySelector<HTMLElement>(
      "celestial-row.focus-row-item",
    ); // Find the specific row
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
  ); // Direct child caret

  const isDestroyed = status === CelestialStatus.DESTROYED;
  const isAnnihilated = status === CelestialStatus.ANNIHILATED;
  const isInactive = isDestroyed || isAnnihilated;

  // Update LI classes
  listItem.classList.toggle("destroyed", isDestroyed);
  listItem.classList.toggle("annihilated", isAnnihilated);

  // Update row attribute
  if (rowElement) {
    rowElement.toggleAttribute("inactive", isInactive);
    if (isInactive) {
      rowElement.removeAttribute("focused"); // Remove focus if it becomes inactive
    }
  }

  // Update caret state (if applicable)
  if (caretElement) {
    caretElement.classList.toggle("inactive-caret", isInactive); // Add class for specific styling
    if (isInactive) {
      // Collapse if it becomes inactive while expanded
      caretElement.classList.remove("caret-down");
      caretElement.setAttribute("aria-expanded", "false");
      const nestedUl =
        listItem.querySelector<HTMLUListElement>(":scope > .nested");
      nestedUl?.classList.remove("active");
    }
  }

  console.debug(
    `[FocusControl.list] Updated status for LI/Row ${objectId} to ${status}.`,
  );
  return false;
}
