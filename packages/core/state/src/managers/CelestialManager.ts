import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  OrbitalParameters,
} from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import { PhysicsStateProvider } from "../services/PhysicsStateProvider";
import { celestialStore } from "../stores/CelestialStore";
import { renderableStore } from "../stores/RenderableStore";
import { ClearStateOptions } from "../types/types";
import {
  validateCelestialData,
  processStarData,
  processCelestialData,
  sortByDependency,
  createHierarchyFromObjects,
  dispatchObjectDestroyedEvent,
  dispatchObjectsLoadedEvent,
  dispatchObjectsLoadedEventFromMap,
  isValidRootObject,
} from "../utils/CelestialUtils";

/**
 * Manages celestial object creation, updates, and lifecycle operations.
 * Consolidates business logic from factory and actions into a cleaner API.
 */
export class CelestialManager {
  private static instance: CelestialManager;

  private constructor() {}

  public static getInstance(): CelestialManager {
    if (!CelestialManager.instance) {
      CelestialManager.instance = new CelestialManager();
    }
    return CelestialManager.instance;
  }

  /**
   * Adds a celestial object to the store and updates hierarchy.
   * Dispatches events for UI updates.
   */
  public addObject<T extends CelestialSpecificPropertiesUnion>(
    object: CelestialObject<T>,
  ): void {
    try {
      celestialStore.setObject(object.id, object);

      // Update hierarchy efficiently
      if (object.parentId) {
        celestialStore.addChild(object.parentId, object.id);
      } else if (object.type === CelestialType.STAR) {
        // Root stars get their own hierarchy entry
        const hierarchy = celestialStore.getHierarchy();
        if (!(object.id in hierarchy)) {
          const newHierarchy = { ...hierarchy };
          newHierarchy[object.id] = [];
          celestialStore.setHierarchy(newHierarchy);
        }
      }

      dispatchObjectsLoadedEventFromMap(celestialStore.getObjects());
    } catch (error) {
      console.error(`[CelestialManager] Error adding ${object.id}:`, error);
    }
  }

  /**
   * Updates properties of an existing celestial object.
   */
  public updateObject<T extends CelestialSpecificPropertiesUnion>(
    id: string,
    updates: Partial<CelestialObject<T>>,
  ): void {
    const object = celestialStore.getObject(id);
    if (object) {
      // Only update if there are actual changes
      const hasChanges = Object.keys(updates).some(
        (key) =>
          object[key as keyof CelestialObject<T>] !==
          updates[key as keyof CelestialObject<T>],
      );

      if (hasChanges) {
        const updatedObject = { ...object, ...updates };
        celestialStore.setObject(id, updatedObject);
      }
    } else {
      console.warn(`[CelestialManager] Object ${id} not found for update.`);
    }
  }

  /**
   * Updates orbital parameters of a celestial object.
   */
  public updateOrbit(id: string, parameters: Partial<OrbitalParameters>): void {
    const object = celestialStore.getObject(id);
    if (object?.orbit) {
      this.updateObject(id, {
        orbit: { ...object.orbit, ...parameters },
      });
    } else {
      console.warn(`[CelestialManager] Object ${id} has no orbit to update.`);
    }
  }

  /**
   * Marks an object as destroyed and dispatches events.
   */
  public markDestroyed(id: string): void {
    const object = celestialStore.getObject(id);
    if (object && object.status !== CelestialStatus.DESTROYED) {
      this.updateObject(id, { status: CelestialStatus.DESTROYED });
      dispatchObjectDestroyedEvent(id);
    }
  }

  /**
   * Removes an object completely from all stores.
   * Note: renderableStore cleanup should be handled separately to avoid circular dependencies.
   */
  public removeObject(id: string): void {
    if (celestialStore.getObject(id)) {
      celestialStore.removeObject(id);
      celestialStore.removeHierarchyEntry(id);
      dispatchObjectDestroyedEvent(id);
    }
  }

  /**
   * Clears all celestial objects and optionally resets other state.
   */
  public clearState(options: ClearStateOptions = {}): void {
    const {
      resetCamera = false,
      resetTime = true,
      resetSelection = true,
    } = options;

    celestialStore.setAllObjects({});
    celestialStore.setHierarchy({});

    // Note: Time and camera reset would be handled by simulation manager
    // This keeps the celestial manager focused on celestial data only

    dispatchObjectsLoadedEvent(0);
  }

  /**
   * Creates a solar system with a primary star.
   */
  public createSolarSystem<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>,
    clearStateFirst = true,
  ): string {
    if (data.type !== CelestialType.STAR) {
      console.error(
        `[CelestialManager] createSolarSystem called with non-star type: ${data.type}`,
      );
      return "";
    }

    if (clearStateFirst) {
      this.clearState();
    }

    const processedObject = processStarData(data);
    this.addObject(processedObject);

    // Create hierarchy entry for the star
    const hierarchy = celestialStore.getHierarchy();
    celestialStore.setHierarchy({
      ...hierarchy,
      [data.id]: [],
    });

    dispatchObjectsLoadedEvent(1, data.id);

    return data.id;
  }

  /**
   * Adds multiple celestial objects with dependency-aware sorting.
   */
  public addObjects<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>[],
  ): void {
    if (data.length === 0) return;

    const sortedData = sortByDependency(data);

    // Build the complete objects map first
    const allObjects = celestialStore.getObjects();
    const newObjectsMap: Record<string, CelestialObject> = { ...allObjects };
    const newHierarchy = createHierarchyFromObjects(sortedData);

    // Add all objects to the map without triggering store updates
    for (const objectData of sortedData) {
      newObjectsMap[objectData.id] = objectData;
    }

    // Update both stores at once to trigger only one renderer update
    celestialStore.setAllObjects(newObjectsMap);
    celestialStore.setHierarchy(newHierarchy);

    // Clear the physics state cache to force recalculation with complete object set
    PhysicsStateProvider.clearCache();

    const totalObjects = Object.keys(newObjectsMap).length;
    const systemId = sortedData.find((d) => d.type === CelestialType.STAR)?.id;

    // Dispatch event after physics states are calculated to prevent race conditions
    dispatchObjectsLoadedEvent(totalObjects, systemId);
  }

  /**
   * Adds a single celestial object with proper physics state calculation.
   */
  public addCelestial<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>,
  ): void {
    const processedObject = processCelestialData(data);
    if (processedObject) {
      this.addObject(processedObject);
    }
  }

  /**
   * Sets the visibility of labels for a specific celestial object.
   * This method provides a convenient way to control label visibility
   * on an individual object basis.
   *
   * Note: This method now operates on the renderableStore since UI options
   * are specific to the rendering layer, not the core celestial data.
   *
   * @param id The unique identifier of the celestial object
   * @param visible Whether labels should be visible for this object
   * @returns true if the object was found and updated, false otherwise
   */
  public setLabelVisibility(id: string, visible: boolean): boolean {
    return renderableStore.setLabelVisibility(id, visible);
  }

  /**
   * Gets the current label visibility for a specific celestial object.
   *
   * Note: This method now reads from the renderableStore since UI options
   * are specific to the rendering layer, not the core celestial data.
   *
   * @param id The unique identifier of the celestial object
   * @returns The current label visibility state, or undefined if object not found
   */
  public getLabelVisibility(id: string): boolean | undefined {
    return renderableStore.getLabelVisibility(id);
  }

  /**
   * Sets label visibility for multiple celestial objects at once.
   * This is useful for bulk operations like hiding all labels or
   * showing labels for specific object types.
   *
   * Note: This method now operates on the renderableStore since UI options
   * are specific to the rendering layer, not the core celestial data.
   *
   * @param ids Array of object IDs to update
   * @param visible Whether labels should be visible for these objects
   * @returns Number of objects successfully updated
   */
  public setLabelVisibilityForMultiple(
    ids: string[],
    visible: boolean,
  ): number {
    return renderableStore.setLabelVisibilityForMultiple(ids, visible);
  }

  // Note: Private helper methods have been moved to shared utilities in CelestialUtils.ts
  // to reduce code duplication between CelestialStore and CelestialManager
}

export const celestialManager = CelestialManager.getInstance();
