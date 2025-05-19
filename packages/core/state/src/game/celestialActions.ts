import type { CelestialObject, OrbitalParameters } from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import { gameStateService } from "./stores";
import { renderableStore } from "./renderableStore";
import { CustomEvents } from "@teskooano/data-types";

/**
 * Service responsible for managing actions related to celestial objects.
 * Implemented as a singleton.
 */
class CelestialActionsService {
  private static instance: CelestialActionsService;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Gets the singleton instance of the CelestialActionsService.
   * @returns {CelestialActionsService} The singleton instance.
   */
  public static getInstance(): CelestialActionsService {
    if (!CelestialActionsService.instance) {
      CelestialActionsService.instance = new CelestialActionsService();
    }
    return CelestialActionsService.instance;
  }

  /**
   * Adds a new celestial object to the game state and updates the hierarchy.
   * Dispatches a `CELESTIAL_OBJECTS_LOADED` event after adding.
   * @param {CelestialObject} object - The celestial object to add.
   */
  public addCelestialObject(object: CelestialObject): void {
    try {
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
        if (!(object.id in currentHierarchy)) {
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
      console.error(
        `[CelestialActionsService] Error adding ${object.id}:`,
        error,
      );
    }
  }

  /**
   * Updates properties of an existing celestial object.
   * @param {string} objectId - The ID of the celestial object to update.
   * @param {Partial<CelestialObject>} updates - An object containing the properties to update.
   */
  public updateCelestialObject(
    objectId: string,
    updates: Partial<CelestialObject>,
  ): void {
    const currentObjects = gameStateService.getCelestialObjects();
    const object = currentObjects[objectId];

    if (object) {
      gameStateService.setCelestialObject(objectId, { ...object, ...updates });
    } else {
      console.warn(
        `[CelestialActionsService] updateCelestialObject: Object ${objectId} not found.`,
      );
    }
  }

  /**
   * Updates the orbital parameters of a celestial object.
   * @param {string} objectId - The ID of the celestial object whose orbit is to be updated.
   * @param {Partial<OrbitalParameters>} parameters - An object containing the orbital parameters to update.
   */
  public updateOrbitalParameters(
    objectId: string,
    parameters: Partial<OrbitalParameters>,
  ): void {
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
        `[CelestialActionsService] Object ${objectId} doesn't have an 'orbit' property to update orbital parameters.`,
      );
    } else {
      console.warn(
        `[CelestialActionsService] updateOrbitalParameters: Object ${objectId} not found.`,
      );
    }
  }

  /**
   * Marks a celestial object as 'destroyed' by updating its status.
   * Dispatches a `CELESTIAL_OBJECT_DESTROYED` event if the object's status changes.
   * Does not remove the object from the store.
   * @param {string} objectId - The ID of the object to mark as destroyed.
   */
  public markObjectDestroyed(objectId: string): void {
    const currentObjects = gameStateService.getCelestialObjects();
    const object = currentObjects[objectId];
    if (object) {
      if (object.status === CelestialStatus.DESTROYED) {
        return; // Already destroyed
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
        `[CelestialActionsService] markObjectDestroyed: Object ${objectId} not found.`,
      );
    }
  }

  /**
   * Removes a celestial object from the game state, its hierarchy, and the renderable store.
   * Dispatches a `CELESTIAL_OBJECT_DESTROYED` event.
   * @param {string} objectId - The ID of the celestial object to remove.
   */
  public removeCelestialObject(objectId: string): void {
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
        `[CelestialActionsService] removeCelestialObject: Object ${objectId} not found.`,
      );
    }
  }
}

/**
 * Singleton instance of CelestialActionsService for managing celestial objects.
 */
export const celestialActions = CelestialActionsService.getInstance();
