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
  public addObject(object: CelestialObject): void {
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
  public updateObject(id: string, updates: Partial<CelestialObject>): void {
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
  public createSolarSystem(
    data: CelestialObject,
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
  public addObjects(data: CelestialObject[]): void {
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
  public addCelestial(data: CelestialObject): void {
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

    const physicsState: PhysicsStateReal = {
      id: data.id,
      mass_kg: data.realMass_kg,
      position_m:
        data.physicsStateReal?.position_m?.clone() ?? new OSVector3().setZero(),
      velocity_mps:
        data.physicsStateReal?.velocity_mps?.clone() ??
        new OSVector3().setZero(),
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
      physicsStateReal: physicsState,
      parentId: data.parentId,
    };
  }

  private processCelestialData(data: CelestialObject): CelestialObject | null {
    // Validate basic requirements
    if (!this.validateCelestialData(data)) {
      return null;
    }

    // Calculate physics state based on object type
    const physicsState = this.calculatePhysicsState(data);
    if (!physicsState) {
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
      physicsStateReal: physicsState,
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

  private calculatePhysicsState(
    data: CelestialObject,
  ): PhysicsStateReal | undefined {
    const objects = celestialStore.getObjects();
    const parent = data.parentId ? objects[data.parentId] : undefined;

    // Handle special object types
    if (this.isSpecialObject(data.type)) {
      return this.calculateSpecialObjectPhysics(data, parent);
    }

    // Handle root stars
    if (data.type === CelestialType.STAR && !data.parentId) {
      return {
        id: data.id,
        mass_kg: data.realMass_kg,
        position_m: new OSVector3().setZero(),
        velocity_mps: new OSVector3().setZero(),
      };
    }

    // Handle rogue planets/satellites
    if (this.isRogueObject(data)) {
      return this.calculateRogueObjectPhysics(data);
    }

    // Handle normal orbital objects
    return this.calculateOrbitalPhysics(data, parent);
  }

  private isSpecialObject(type: CelestialType): boolean {
    return [
      CelestialType.RING_SYSTEM,
      CelestialType.OORT_CLOUD,
      CelestialType.ASTEROID_FIELD,
    ].includes(type);
  }

  private calculateSpecialObjectPhysics(
    data: CelestialObject,
    parent: CelestialObject | undefined,
  ): PhysicsStateReal | undefined {
    if (!parent?.physicsStateReal) {
      console.error(
        `[CelestialManager] Parent not found or missing physics state for ${data.id}`,
      );
      return undefined;
    }

    return {
      id: data.id,
      mass_kg: 0,
      position_m: parent.physicsStateReal.position_m.clone(),
      velocity_mps: parent.physicsStateReal.velocity_mps.clone(),
    };
  }

  private isRogueObject(data: CelestialObject): boolean {
    return (
      (data.type === CelestialType.PLANET ||
        data.type === CelestialType.GAS_GIANT ||
        data.type === CelestialType.SATELLITE) &&
      !data.parentId &&
      data.orbit &&
      data.orbit.realSemiMajorAxis_m === 0 &&
      data.orbit.eccentricity === 0 &&
      data.orbit.period_s === 0
    );
  }

  private calculateRogueObjectPhysics(data: CelestialObject): PhysicsStateReal {
    const random = createSeededRandomSync(
      `rogue-${data.id}-${data.seed ?? "default"}`,
    );
    const baseDistance = data.orbit?.meanAnomaly || random() * 100 + 50;
    const minRogueDistanceAU = 50;
    const safeDistanceAU = Math.max(baseDistance, minRogueDistanceAU);
    const AU_TO_METERS = 1.496e11;

    return {
      id: data.id,
      mass_kg: data.realMass_kg,
      position_m: new OSVector3().setFromArray([
        safeDistanceAU * AU_TO_METERS,
        (random() - 0.5) * safeDistanceAU * AU_TO_METERS * 0.1,
        (random() - 0.5) * safeDistanceAU * AU_TO_METERS * 0.1,
      ]),
      velocity_mps: new OSVector3().setFromArray([
        (random() - 0.5) * 500,
        (random() - 0.5) * 500,
        (random() - 0.5) * 500,
      ]),
    };
  }

  private calculateOrbitalPhysics(
    data: CelestialObject,
    parent: CelestialObject | undefined,
  ): PhysicsStateReal | undefined {
    if (!data.orbit || !parent?.physicsStateReal) {
      console.error(
        `[CelestialManager] Missing orbit or parent physics state for ${data.id}`,
      );
      return undefined;
    }

    try {
      const initialRelativePos = calculateOrbitalPosition(
        parent.physicsStateReal,
        data.orbit,
        0,
      );
      const initialWorldVel = calculateOrbitalVelocity(
        parent.physicsStateReal,
        data.orbit,
        0,
      );
      const initialWorldPos = initialRelativePos
        .clone()
        .add(parent.physicsStateReal.position_m);

      return {
        id: data.id,
        mass_kg: data.realMass_kg,
        position_m: initialWorldPos,
        velocity_mps: initialWorldVel,
      };
    } catch (error) {
      console.error(
        `[CelestialManager] Error calculating orbital physics for ${data.id}:`,
        error,
      );
      return undefined;
    }
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
