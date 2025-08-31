import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  OrbitalParameters,
  PlanetAtmosphereProperties,
  StarProperties,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  CustomEvents,
} from "@teskooano/data-types";
import { renderableStore } from "../stores/renderableStore";
import { PhysicsStateProvider } from "../services/PhysicsStateProvider";
import { celestialStore } from "../stores/celestialStore";
import { ClearStateOptions } from "../types/types";

// Cache for frequently accessed data
const ROOT_OBJECT_TYPES = new Set([
  CelestialType.STAR,
  CelestialType.PLANET,
  CelestialType.GAS_GIANT,
  CelestialType.SATELLITE,
]);

// Pre-allocated objects to reduce garbage collection
const DEFAULT_STAR_PROPERTIES: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: true,
  spectralClass: "G2V",
  luminosity: 1.0,
  color: "#FFF9E5",
};

const DEFAULT_CELESTIAL_PROPERTIES = {
  status: CelestialStatus.ACTIVE,
  temperature: 100,
  albedo: 0.3,
  seed: "",
};

/**
 * Type guard to check if an object is of type PlanetAtmosphereProperties.
 */
function isPlanetAtmosphere(props: any): props is PlanetAtmosphereProperties {
  return (
    props &&
    typeof props.thickness === "number" &&
    typeof props.power === "number" &&
    typeof props.intensity === "number" &&
    props.glowColor !== undefined
  );
}

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

      this.dispatchObjectsLoadedEvent();
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

      document.dispatchEvent(
        new CustomEvent(CustomEvents.CELESTIAL_OBJECT_DESTROYED, {
          detail: { objectId: id },
        }),
      );
    }
  }

  /**
   * Removes an object completely from all stores.
   */
  public removeObject(id: string): void {
    if (celestialStore.getObject(id)) {
      celestialStore.removeObject(id);
      celestialStore.removeHierarchyEntry(id);
      renderableStore.removeRenderableObject(id);

      document.dispatchEvent(
        new CustomEvent(CustomEvents.CELESTIAL_OBJECT_DESTROYED, {
          detail: { objectId: id },
        }),
      );
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

    document.dispatchEvent(
      new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
        detail: { count: 0 },
      }),
    );
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

    const processedObject = this.processStarData(data);
    this.addObject(processedObject);

    // Create hierarchy entry for the star
    const hierarchy = celestialStore.getHierarchy();
    celestialStore.setHierarchy({
      ...hierarchy,
      [data.id]: [],
    });

    document.dispatchEvent(
      new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
        detail: { count: 1, systemId: data.id },
      }),
    );

    return data.id;
  }

  /**
   * Adds multiple celestial objects with dependency-aware sorting.
   */
  public addObjects<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>[],
  ): void {
    if (data.length === 0) return;

    const sortedData = this.sortByDependency(data);

    // Build the complete objects map first
    const allObjects = celestialStore.getObjects();
    const newObjectsMap: Record<string, CelestialObject> = { ...allObjects };
    const hierarchy = celestialStore.getHierarchy();
    const newHierarchy: Record<string, string[]> = { ...hierarchy };

    // Pre-allocate arrays for better performance
    const parentIds = new Set<string>();
    const starIds = new Set<string>();

    // First pass: collect all parent IDs and star IDs
    for (const objectData of sortedData) {
      if (objectData.parentId) {
        parentIds.add(objectData.parentId);
      }
      if (objectData.type === CelestialType.STAR) {
        starIds.add(objectData.id);
      }
    }

    // Pre-allocate hierarchy entries
    for (const parentId of parentIds) {
      if (!newHierarchy[parentId]) {
        newHierarchy[parentId] = [];
      }
    }
    for (const starId of starIds) {
      if (!newHierarchy[starId]) {
        newHierarchy[starId] = [];
      }
    }

    // Add all objects to the map without triggering store updates
    for (const objectData of sortedData) {
      newObjectsMap[objectData.id] = objectData;

      // Update hierarchy
      if (objectData.parentId) {
        newHierarchy[objectData.parentId].push(objectData.id);
      }
    }

    // Update both stores at once to trigger only one renderer update
    celestialStore.setAllObjects(newObjectsMap);
    celestialStore.setHierarchy(newHierarchy);

    // Clear the physics state cache to force recalculation with complete object set
    PhysicsStateProvider.clearCache();

    const totalObjects = Object.keys(newObjectsMap).length;
    const systemId = sortedData.find((d) => d.type === CelestialType.STAR)?.id;

    // Dispatch event after physics states are calculated to prevent race conditions
    document.dispatchEvent(
      new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
        detail: { count: totalObjects, systemId },
      }),
    );
  }

  /**
   * Adds a single celestial object with proper physics state calculation.
   */
  public addCelestial<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>,
  ): void {
    const processedObject = this.processCelestialData(data);
    if (processedObject) {
      this.addObject(processedObject);
    }
  }

  // Private helper methods

  private processStarData(data: CelestialObject): CelestialObject {
    const inputStarProps =
      data.properties?.type === CelestialType.STAR
        ? data.properties
        : undefined;

    // Use pre-allocated default properties to reduce object creation
    const processedProperties: StarProperties = {
      ...DEFAULT_STAR_PROPERTIES,
      isMainStar: inputStarProps?.isMainStar ?? true,
      spectralClass: inputStarProps?.spectralClass || "G2V",
      luminosity: inputStarProps?.luminosity ?? 1.0,
      color: inputStarProps?.color ?? "#FFF9E5",
      stellarType: inputStarProps?.stellarType,
      partnerStars: inputStarProps?.partnerStars,
      mainSpectralClass: inputStarProps?.mainSpectralClass,
      luminosityClass: inputStarProps?.luminosityClass,
      specialSpectralClass: inputStarProps?.specialSpectralClass,
    };

    return {
      ...data,
      status: CelestialStatus.ACTIVE,
      temperature: data.temperature ?? 5778,
      albedo: data.albedo ?? 0.3,
      atmosphere: isPlanetAtmosphere(data.atmosphere)
        ? data.atmosphere
        : undefined,
      properties: processedProperties,
      seed: data.seed ?? `${Math.floor(Date.now() % 1000000)}`,
      parentId: data.parentId,
    };
  }

  private processCelestialData<T extends CelestialSpecificPropertiesUnion>(
    data: CelestialObject<T>,
  ): CelestialObject<T> | null {
    // Validate basic requirements
    if (!this.validateCelestialData(data)) {
      return null;
    }

    // Generate seed once to avoid multiple Date.now() calls
    const seed = data.seed ?? `${Math.floor(Date.now() % 1000000)}`;

    return {
      ...data,
      status: CelestialStatus.ACTIVE,
      temperature: data.temperature ?? 100,
      albedo: data.albedo ?? 0.3,
      atmosphere: isPlanetAtmosphere(data.atmosphere)
        ? data.atmosphere
        : undefined,
      seed,
      parentId: data.parentId,
    };
  }

  private validateCelestialData(data: CelestialObject): boolean {
    if (data.type === CelestialType.STAR && !data.parentId) {
      console.error(
        `[CelestialManager] Root stars should use createSolarSystem() method.`,
      );
      return false;
    }

    if (!data.parentId && !this.isValidRootObject(data.type)) {
      console.error(
        `[CelestialManager] Cannot add ${data.type} without parentId.`,
      );
      return false;
    }

    return true;
  }

  private isValidRootObject(type: CelestialType): boolean {
    return ROOT_OBJECT_TYPES.has(type);
  }

  private sortByDependency(objects: CelestialObject[]): CelestialObject[] {
    if (objects.length <= 1) return objects;

    const objectMap = new Map(objects.map((obj) => [obj.id, obj]));
    const sorted: CelestialObject[] = [];
    const visited = new Set<string>();

    function visit(objectId: string) {
      if (visited.has(objectId)) return;
      visited.add(objectId);

      const obj = objectMap.get(objectId);
      if (obj) {
        if (obj.parentId && objectMap.has(obj.parentId)) {
          visit(obj.parentId);
        }
        sorted.push(obj);
      }
    }

    for (const obj of objects) {
      visit(obj.id);
    }

    return sorted;
  }

  private dispatchObjectsLoadedEvent(): void {
    const count = Object.keys(celestialStore.getObjects()).length;
    document.dispatchEvent(
      new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
        detail: { count },
      }),
    );
  }
}

export const celestialManager = CelestialManager.getInstance();
