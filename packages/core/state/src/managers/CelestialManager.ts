import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  OrbitalParameters,
} from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import { PhysicsStateProvider } from "../services/PhysicsStateProvider";
import { FlatHierarchyService } from "../services/FlatHierarchyService";
import { celestialStore } from "../stores/CelestialStore";
import {
  dispatchObjectDestroyedEvent,
  dispatchObjectsLoadedEvent,
  dispatchObjectsLoadedEventFromMap,
  processCelestialData,
  processStarData,
  sortByDependency,
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

      // Update the flat hierarchy service with the new object
      const hierarchyService = FlatHierarchyService.getInstance();
      hierarchyService.addObject(object);

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

        // Update hierarchy if parentId changed
        if (
          updates.parentId !== undefined &&
          updates.parentId !== object.parentId
        ) {
          const hierarchyService = FlatHierarchyService.getInstance();
          hierarchyService.updateParent(id, updates.parentId);
        }
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
      // Remove from hierarchy service first
      const hierarchyService = FlatHierarchyService.getInstance();
      hierarchyService.removeObject(id);

      celestialStore.removeObject(id);
      dispatchObjectDestroyedEvent(id);
    }
  }

  /**
   * Clears all celestial objects and optionally resets other state.
   */
  public clearState(): void {
    celestialStore.setAllObjects({});
    dispatchObjectsLoadedEvent(0);
  }

  /**
   * Creates a solar system with a primary star.
   */
  public createSolarSystem<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>,
  ): string {
    if (data.type !== CelestialType.STAR) {
      console.error(
        `[CelestialManager] createSolarSystem called with non-star type: ${data.type}`,
      );
      return "";
    }

    this.clearState();

    const processedObject = processStarData(data);
    this.addObject(processedObject);

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

    // Build the complete objects map first.
    const allObjects = celestialStore.getObjects();
    const newObjectsMap: Record<string, CelestialObject> = { ...allObjects };

    // Add all objects to the map without triggering store updates.
    for (const objectData of sortedData) {
      newObjectsMap[objectData.id] = objectData;
    }

    // Update objects store.
    celestialStore.setAllObjects(newObjectsMap);

    // Update hierarchy service with all new objects
    const hierarchyService = FlatHierarchyService.getInstance();
    for (const objectData of sortedData) {
      hierarchyService.addObject(objectData);
    }

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

  // Note: Private helper methods have been moved to shared utilities in CelestialUtils.ts
  // to reduce code duplication between CelestialStore and CelestialManager
}

export const celestialManager = CelestialManager.getInstance();
