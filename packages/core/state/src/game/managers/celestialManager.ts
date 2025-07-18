import { OSVector3, createSeededRandomSync } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import type {
  CelestialObject,
  OrbitalParameters,
  PhysicsStateReal,
  PlanetAtmosphereProperties,
  StarProperties,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  CustomEvents,
} from "@teskooano/data-types";
import { renderableStore } from "../renderableStore";
import { celestialStore } from "../stores/celestialStore";
import { ClearStateOptions } from "../types";

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
  public addObject<
    T extends import("@teskooano/data-types").CelestialSpecificPropertiesUnion,
  >(object: CelestialObject<T>): void {
    try {
      celestialStore.setObject(object.id, object);

      // Update hierarchy
      if (object.parentId) {
        celestialStore.addChild(object.parentId, object.id);
      } else if (object.type === CelestialType.STAR) {
        // Root stars get their own hierarchy entry
        const hierarchy = celestialStore.getHierarchy();
        if (!(object.id in hierarchy)) {
          celestialStore.setHierarchy({
            ...hierarchy,
            [object.id]: [],
          });
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
  public updateObject<
    T extends import("@teskooano/data-types").CelestialSpecificPropertiesUnion,
  >(id: string, updates: Partial<CelestialObject<T>>): void {
    const object = celestialStore.getObject(id);
    if (object) {
      const updatedObject = { ...object, ...updates };
      celestialStore.setObject(id, updatedObject);
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
  public createSolarSystem<
    T extends import("@teskooano/data-types").CelestialSpecificPropertiesUnion,
  >(data: CelestialObject<T>, clearStateFirst = true): string {
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
  public addObjects<
    T extends import("@teskooano/data-types").CelestialSpecificPropertiesUnion,
  >(data: CelestialObject<T>[]): void {
    const sortedData = this.sortByDependency(data);

    for (const objectData of sortedData) {
      this.addObject(objectData);
    }

    const totalObjects = Object.keys(celestialStore.getObjects()).length;
    const systemId = sortedData.find((d) => d.type === CelestialType.STAR)?.id;

    document.dispatchEvent(
      new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
        detail: { count: totalObjects, systemId },
      }),
    );
  }

  /**
   * Adds a single celestial object with proper physics state calculation.
   */
  public addCelestial<
    T extends import("@teskooano/data-types").CelestialSpecificPropertiesUnion,
  >(data: CelestialObject<T>): void {
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

    const processedProperties: StarProperties = {
      type: CelestialType.STAR,
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

  private processCelestialData<
    T extends import("@teskooano/data-types").CelestialSpecificPropertiesUnion,
  >(data: CelestialObject<T>): CelestialObject<T> | null {
    // Validate basic requirements
    if (!this.validateCelestialData(data)) {
      return null;
    }

    return {
      ...data,
      status: CelestialStatus.ACTIVE,
      temperature: data.temperature ?? 100,
      albedo: data.albedo ?? 0.3,
      atmosphere: isPlanetAtmosphere(data.atmosphere)
        ? data.atmosphere
        : undefined,
      seed: data.seed ?? `${Math.floor(Date.now() % 1000000)}`,
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
    return [
      CelestialType.STAR,
      CelestialType.PLANET,
      CelestialType.GAS_GIANT,
      CelestialType.SATELLITE,
    ].includes(type);
  }

  private sortByDependency(objects: CelestialObject[]): CelestialObject[] {
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
