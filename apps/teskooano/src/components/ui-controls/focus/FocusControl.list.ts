import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";
import { celestialObjectsStore } from "@teskooano/core-state"; // Import if needed for status text

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
 * Populates the focus list container with interactive buttons for celestial objects,
 * respecting hierarchy and status.
 *
 * @param listContainer - The HTMLElement to populate.
 * @param objects - The current map of all celestial objects.
 * @param currentFocusedId - The ID of the currently focused object, if any.
 */
export function populateFocusList(
  listContainer: HTMLElement,
  objects: Record<string, CelestialObject>,
  currentFocusedId: string | null
): void {
  listContainer.innerHTML = ""; // Clear previous list

  const objectMap = new Map(Object.entries(objects));

  // Build a dynamic hierarchy based on currentParentId
  const dynamicHierarchy = new Map<string | null, string[]>();
  objectMap.forEach((obj, id) => {
    const parentKey = obj.currentParentId ?? obj.parentId ?? null;
    if (!dynamicHierarchy.has(parentKey)) {
      dynamicHierarchy.set(parentKey, []);
    }
    dynamicHierarchy.get(parentKey)!.push(id);
  });

  // Find root objects
  const rootIds = dynamicHierarchy.get(null) || [];
  dynamicHierarchy.forEach((children, parentId) => {
    if (parentId !== null && !objectMap.has(parentId)) {
      rootIds.push(...children); // Add orphans as roots
    }
  });
  // Ensure stars without parents are roots
  objectMap.forEach((obj, id) => {
    if (
      obj.type === CelestialType.STAR &&
      obj.parentId === undefined &&
      obj.currentParentId === undefined &&
      !rootIds.includes(id)
    ) {
      rootIds.push(id);
    }
  });

  // Sort roots (e.g., stars first, then alphabetically)
  rootIds.sort((a, b) => {
    const objA = objectMap.get(a);
    const objB = objectMap.get(b);
    if (!objA || !objB) return 0; // Should not happen
    if (objA.type === CelestialType.STAR && objB.type !== CelestialType.STAR)
      return -1;
    if (objA.type !== CelestialType.STAR && objB.type === CelestialType.STAR)
      return 1;
    return (objA.name ?? "").localeCompare(objB.name ?? "");
  });

  if (rootIds.length === 0 && objectMap.size > 0) {
    listContainer.innerHTML =
      '<div class="empty-message">Loading hierarchy...</div>';
    console.warn(
      "[FocusControl.list] No root objects found in dynamic hierarchy, but objects exist.",
      dynamicHierarchy
    );
  } else if (objectMap.size === 0) {
    listContainer.innerHTML =
      '<div class="empty-message">No celestial objects loaded.</div>';
  } else {
    // Recursive function to add items
    const addItem = (obj: CelestialObject, indentLevel: number) => {
      const isDestroyed = obj.status === CelestialStatus.DESTROYED;
      const isAnnihilated = obj.status === CelestialStatus.ANNIHILATED;
      const isInactive = isDestroyed || isAnnihilated;

      const item = document.createElement("button");
      item.classList.add("focus-item");
      item.dataset.id = obj.id;
      item.disabled = isInactive; // Disable if destroyed or annihilated
      item.title = `${obj.name} (${obj.type})${isInactive ? ` - ${obj.status}` : ""}`;

      // Add status classes for styling
      if (isDestroyed) item.classList.add("destroyed");
      if (isAnnihilated) item.classList.add("annihilated");

      // Highlight if it's the currently focused item AND it's not inactive
      if (!isInactive && obj.id === currentFocusedId) {
        item.classList.add("active");
      }

      // Icon based on type
      const icon = document.createElement("span");
      icon.classList.add("celestial-icon", getIconClass(obj.type));
      item.appendChild(icon);

      // Text label
      const label = document.createElement("span");
      label.textContent = obj.name;
      item.appendChild(label);

      // Apply indentation
      if (indentLevel > 0) {
        item.style.marginLeft = `${indentLevel * 15}px`;
      }

      listContainer.appendChild(item);

      // Recursively add children
      const childrenIds = dynamicHierarchy.get(obj.id) || [];
      childrenIds.sort((a, b) => {
        const childA = objectMap.get(a);
        const childB = objectMap.get(b);
        return (childA?.name ?? "").localeCompare(childB?.name ?? "");
      });
      childrenIds.forEach((childId) => {
        const childObj = objectMap.get(childId);
        if (childObj) {
          addItem(childObj, indentLevel + 1);
        }
      });
    };
    // Start recursion from roots
    rootIds.forEach((id) => {
      const rootObj = objectMap.get(id);
      if (rootObj) {
        addItem(rootObj, 0);
      }
    });
  }
}

/**
 * Updates the visual highlight in the list container to reflect the currently focused object.
 *
 * @param listContainer - The HTMLElement containing the list items.
 * @param focusedId - The ID of the object to highlight, or null to remove highlight.
 */
export function updateFocusHighlight(
  listContainer: HTMLElement,
  focusedId: string | null
): void {
  listContainer.querySelectorAll("button.focus-item").forEach((el) => {
    const item = el as HTMLButtonElement; // Cast to button
    const itemId = item.dataset.id;
    const shouldBeActive = itemId === focusedId;

    // Only toggle if the state needs changing AND the item is not disabled
    // (inactive items should not be highlighted)
    if (
      item.classList.contains("active") !== shouldBeActive &&
      !item.disabled
    ) {
      item.classList.toggle("active", shouldBeActive);
    } else if (item.classList.contains("active") && item.disabled) {
      // Ensure disabled items lose active state if they somehow had it
      item.classList.remove("active");
    }
  });
}

/**
 * Updates the status (disabled state, class, title) of a single object's button in the list.
 *
 * @param listContainer - The HTMLElement containing the list items.
 * @param objectId - The ID of the object whose button needs updating.
 * @param status - The new status of the object.
 * @returns boolean - True if the button was not found (suggesting a full refresh might be needed), false otherwise.
 */
export function updateObjectStatusInList(
  listContainer: HTMLElement,
  objectId: string,
  status: CelestialStatus
): boolean {
  // Return true if button not found
  const button = listContainer.querySelector(
    `button.focus-item[data-id="${objectId}"]`
  ) as HTMLButtonElement;

  if (!button) {
    console.warn(
      `[FocusControl.list] Button for object ${objectId} not found during status update.`
    );
    return true; // Indicate button not found
  }

  const isDestroyed = status === CelestialStatus.DESTROYED;
  const isAnnihilated = status === CelestialStatus.ANNIHILATED;
  const isInactive = isDestroyed || isAnnihilated;

  // --- Update button state ---
  const wasInactive = button.disabled;
  button.disabled = isInactive;

  // Remove previous status classes
  button.classList.remove("destroyed", "annihilated", "active");

  // Add current status class if inactive
  if (isDestroyed) button.classList.add("destroyed");
  if (isAnnihilated) button.classList.add("annihilated");

  // Update title - Fetch object name for context if needed (optional)
  // This might require passing the objects map or using the store if the name isn't cached
  const objects = celestialObjectsStore.get(); // Fetch current state for name
  const obj = objects[objectId];
  const name = obj ? obj.name : `Object ${objectId}`; // Fallback name
  const type = obj ? obj.type : "Unknown Type";
  button.title = `${name} (${type})${isInactive ? ` - ${status}` : ""}`;

  console.debug(
    `[FocusControl.list] Updated status for ${objectId} to ${status}. Inactive: ${isInactive}`
  );
  return false; // Indicate button was found and updated
}
