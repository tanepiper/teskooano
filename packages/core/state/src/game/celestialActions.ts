import type { CelestialObject, OrbitalParameters } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import { celestialObjectsStore, celestialHierarchyStore } from "./stores";
import { renderableActions } from "./renderableStore";
import { CustomEvents } from "@teskooano/data-types";

/**
 * Actions for managing celestial objects
 */
export const celestialActions = {
  addCelestialObject: (object: CelestialObject) => {
    try {
      // Get current objects and create a new map with the added object
      const currentObjects = celestialObjectsStore.get();
      const newObjects = {
        ...currentObjects,
        [object.id]: object,
      };
      // Set the entire new map to trigger subscribers
      celestialObjectsStore.set(newObjects);

      // Update hierarchy
      const parentId = object.parentId;
      if (parentId) {
        const currentHierarchy = celestialHierarchyStore.get();
        const siblings = currentHierarchy[parentId] || [];
        if (!siblings.includes(object.id)) {
          celestialHierarchyStore.setKey(parentId, [...siblings, object.id]);
        }
      } else if (object.type === CelestialType.STAR) {
        // Ensure top-level star entry exists even without parent
        celestialHierarchyStore.setKey(
          object.id,
          celestialHierarchyStore.get()[object.id] || [],
        );
      }

      // Dispatch event after loading
      document.dispatchEvent(
        new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
          detail: { count: Object.keys(newObjects).length },
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
    const currentObjects = celestialObjectsStore.get();
    const object = currentObjects[objectId];

    if (object) {
      // Create a new map with the updated object
      const newObjects = {
        ...currentObjects,
        [objectId]: { ...object, ...updates },
      };
      // Set the entire new map
      celestialObjectsStore.set(newObjects);
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
    const objects = celestialObjectsStore.get();
    const object = objects[objectId];

    if (object && object.orbit) {
      celestialObjectsStore.setKey(objectId, {
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
    const currentObjects = celestialObjectsStore.get();
    const object = currentObjects[objectId];
    if (object) {
      if (object.status === CelestialStatus.DESTROYED) {
        return; // Avoid unnecessary updates
      }
      // Create a new map with the updated object status
      const newObjects = {
        ...currentObjects,
        [objectId]: {
          ...object,
          status: CelestialStatus.DESTROYED,
        },
      };
      // Set the entire new map
      celestialObjectsStore.set(newObjects);

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
    const currentObjects = celestialObjectsStore.get();
    if (currentObjects[objectId]) {
      // Create a new map excluding the removed object
      const newObjects = { ...currentObjects };
      delete newObjects[objectId];
      // Set the entire new map
      celestialObjectsStore.set(newObjects);

      // Also remove the corresponding renderable object
      renderableActions.removeRenderableObject(objectId);

      // Update hierarchy (remove from parent's list)
      // TODO: Implement hierarchy removal logic if needed

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
