import type { CelestialObject, OrbitalParameters } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import {
  getCelestialObjects,
  setCelestialObject,
  getCelestialHierarchy,
  setCelestialHierarchy,
  removeCelestialObject as removeObjectFromStore,
  removeCelestialHierarchyEntry,
} from "./stores";
import { renderableActions } from "./renderableStore";
import { CustomEvents } from "@teskooano/data-types";

/**
 * Actions for managing celestial objects
 */
export const celestialActions = {
  addCelestialObject: (object: CelestialObject) => {
    try {
      // Get current objects and add the new one
      const currentObjects = getCelestialObjects();
      // Use the setter which handles creating the new map
      setCelestialObject(object.id, object);

      // Update hierarchy
      const parentId = object.parentId;
      if (parentId) {
        const currentHierarchy = getCelestialHierarchy();
        const siblings = currentHierarchy[parentId] || [];
        if (!siblings.includes(object.id)) {
          // Create new hierarchy object for the update
          const newHierarchy = {
            ...currentHierarchy,
            [parentId]: [...siblings, object.id],
          };
          setCelestialHierarchy(newHierarchy); // Update using the setter
        }
      } else if (object.type === CelestialType.STAR) {
        // Ensure top-level star entry exists even without parent
        const currentHierarchy = getCelestialHierarchy();
        if (!currentHierarchy[object.id]) {
          const newHierarchy = {
            ...currentHierarchy,
            [object.id]: [],
          };
          setCelestialHierarchy(newHierarchy);
        }
      }

      // Dispatch event after loading
      document.dispatchEvent(
        new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
          // Use the new object map from the setter indirectly
          detail: { count: Object.keys(getCelestialObjects()).length },
        }),
      );
    } catch (error) {
      console.error(`[celestialActions] Error adding ${object.id}:`, error);
    }
  },

  updateCelestialObject: (
    objectId: string,
    updates: Partial<CelestialObject>,
  ) => {
    const currentObjects = getCelestialObjects();
    const object = currentObjects[objectId];

    if (object) {
      // Use the setter function
      setCelestialObject(objectId, { ...object, ...updates });
    } else {
      console.warn(
        `[celestialActions] updateCelestialObject: Object ${objectId} not found.`,
      );
    }
  },

  updateOrbitalParameters: (
    objectId: string,
    parameters: Partial<OrbitalParameters>,
  ) => {
    const objects = getCelestialObjects();
    const object = objects[objectId];

    if (object && object.orbit) {
      // Use setter function
      setCelestialObject(objectId, {
        ...object,
        orbit: {
          ...object.orbit,
          ...parameters,
        },
      });
    } else if (object) {
      console.warn(
        `Object ${objectId} doesn't have an 'orbit' property to update`,
      );
    }
  },

  /**
   * Marks a celestial object as 'destroyed'.
   * This updates its status property but does not remove it from the store.
   * @param objectId The ID of the object to mark as destroyed.
   */
  markObjectDestroyed: (objectId: string) => {
    const currentObjects = getCelestialObjects();
    const object = currentObjects[objectId];
    if (object) {
      if (object.status === CelestialStatus.DESTROYED) {
        return; // Avoid unnecessary updates
      }
      // Use setter function
      setCelestialObject(objectId, {
        ...object,
        status: CelestialStatus.DESTROYED,
      });

      // Dispatch event after destruction
      document.dispatchEvent(
        new CustomEvent(CustomEvents.CELESTIAL_OBJECT_DESTROYED, {
          detail: { objectId: objectId },
        }),
      );
    } else {
      console.warn(
        `[celestialActions] markObjectDestroyed: Object ${objectId} not found.`,
      );
    }
  },

  removeCelestialObject: (objectId: string) => {
    const currentObjects = getCelestialObjects();
    if (currentObjects[objectId]) {
      // Use the new store function to remove the object
      removeObjectFromStore(objectId);

      // Remove from hierarchy
      removeCelestialHierarchyEntry(objectId);

      // Also remove the corresponding renderable object
      renderableActions.removeRenderableObject(objectId);

      // Dispatch event after destruction
      document.dispatchEvent(
        new CustomEvent(CustomEvents.CELESTIAL_OBJECT_DESTROYED, {
          detail: { objectId: objectId },
        }),
      );
    } else {
      console.warn(
        `[celestialActions] removeCelestialObject: Object ${objectId} not found.`,
      );
    }
  },
};
