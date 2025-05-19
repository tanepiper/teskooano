import type { CelestialObject, OrbitalParameters } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import { gameStateService } from "./stores";
import { renderableStore } from "./renderableStore";
import { CustomEvents } from "@teskooano/data-types";

/**
 * Actions for managing celestial objects
 */
export const celestialActions = {
  addCelestialObject: (object: CelestialObject) => {
    try {
      const currentObjects = gameStateService.getCelestialObjects();

      gameStateService.setCelestialObject(object.id, object);

      const parentId = object.parentId;
      if (parentId) {
        const currentHierarchy = gameStateService.getCelestialHierarchy();
        const siblings = currentHierarchy[parentId] || [];
        if (!siblings.includes(object.id)) {
          const newHierarchy = {
            ...currentHierarchy,
            [parentId]: [...siblings, object.id],
          };
          gameStateService.setCelestialHierarchy(newHierarchy);
        }
      } else if (object.type === CelestialType.STAR) {
        const currentHierarchy = gameStateService.getCelestialHierarchy();
        if (!currentHierarchy[object.id]) {
          const newHierarchy = {
            ...currentHierarchy,
            [object.id]: [],
          };
          gameStateService.setCelestialHierarchy(newHierarchy);
        }
      }

      document.dispatchEvent(
        new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
          detail: {
            count: Object.keys(gameStateService.getCelestialObjects()).length,
          },
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
    const currentObjects = gameStateService.getCelestialObjects();
    const object = currentObjects[objectId];

    if (object) {
      gameStateService.setCelestialObject(objectId, { ...object, ...updates });
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
    const objects = gameStateService.getCelestialObjects();
    const object = objects[objectId];

    if (object && object.orbit) {
      gameStateService.setCelestialObject(objectId, {
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
    const currentObjects = gameStateService.getCelestialObjects();
    const object = currentObjects[objectId];
    if (object) {
      if (object.status === CelestialStatus.DESTROYED) {
        return;
      }

      gameStateService.setCelestialObject(objectId, {
        ...object,
        status: CelestialStatus.DESTROYED,
      });

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
    const currentObjects = gameStateService.getCelestialObjects();
    if (currentObjects[objectId]) {
      gameStateService.removeCelestialObject(objectId);

      gameStateService.removeCelestialHierarchyEntry(objectId);

      renderableStore.removeRenderableObject(objectId);

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
