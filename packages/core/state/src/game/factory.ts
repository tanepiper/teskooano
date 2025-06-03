import { OSVector3 } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";

import {
  CelestialObject,
  GenericCelestialObject,
  type CelestialObjectConstructorParams,
  type CelestialPhysicsState,
  type CelestialPhysicalProperties,
  type CelestialOrbitalProperties,
  type CelestialCoreProperties,
  CelestialStatus,
  CelestialType,
} from "@teskooano/celestial-object";
import { celestialActions } from "./celestialActions";
import { simulationStateService } from "./simulation";
import { gameStateService } from "./stores";
import { ClearStateOptions } from "./types";
import { CustomEvents } from "@teskooano/data-types";
import { Quaternion } from "three";

/**
 * Input data for the CelestialFactoryService.
 * Caller provides physical properties and initial physics parameters (including mass).
 * The factory calculates full physics state (position, velocity) if not fully specified,
 * especially for orbiting objects.
 */
export interface CelestialFactoryInput {
  id: string;
  name: string;
  type: CelestialType;
  seed: string | number; // Factory will convert to string

  physicalProperties: CelestialPhysicalProperties; // Directly provided by caller

  // Caller provides mass_kg. Other physics properties are optional.
  // Factory will calculate/default position, velocity, orientation, angularVelocity if not provided.
  // The 'id' for the final CelestialPhysicsState will be this object's 'id'.
  initialPhysicsParams: Partial<
    Omit<CelestialPhysicsState, "id" | "mass_kg">
  > & { mass_kg: number };

  orbit?: CelestialOrbitalProperties; // Provided by caller if object orbits another

  parentId?: string;
  ignorePhysics?: boolean;
  isMainStar?: boolean; // Optional: if not provided, will be deduced for stars
  status?: CelestialStatus; // Optional: defaults to ACTIVE
}

const defaultOrbit: CelestialOrbitalProperties = {
  semiMajorAxis_m: 0,
  eccentricity: 0,
  inclination: 0,
  longitudeOfAscendingNode: 0,
  argumentOfPeriapsis: 0,
  meanAnomaly: 0,
  period_s: 0,
};

/**
 * @class CelestialFactoryService
 * @description Service responsible for orchestrating the creation of celestial objects
 * and adding them to the game state.
 */
class CelestialFactoryService {
  private static instance: CelestialFactoryService;

  private constructor() {}

  public static getInstance(): CelestialFactoryService {
    if (!CelestialFactoryService.instance) {
      CelestialFactoryService.instance = new CelestialFactoryService();
    }
    return CelestialFactoryService.instance;
  }

  private _createAndAddCelestial(
    data: CelestialFactoryInput, // Changed input type
    finalPhysicsState: CelestialPhysicsState, // Fully constructed physics state
    parentForNewObject?: CelestialObject,
  ): CelestialObject | undefined {
    const constructorParams: CelestialObjectConstructorParams = {
      id: data.id,
      name: data.name,
      type: data.type,
      status: data.status ?? CelestialStatus.ACTIVE,
      physicalProperties: data.physicalProperties,
      orbit: data.orbit ?? defaultOrbit, // Use provided orbit or default
      physicsState: finalPhysicsState, // Use the fully constructed physics state
      isMainStar:
        typeof data.isMainStar === "boolean"
          ? data.isMainStar
          : data.type === CelestialType.STAR &&
            !parentForNewObject &&
            !data.parentId,
      parent: parentForNewObject, // CelestialObject should be assignable to CelestialCoreProperties
      seed: `${data.seed}`,
      ignorePhysics: data.ignorePhysics,
    };

    const newCelestialObj = CelestialObject.createBasic(constructorParams);
    celestialActions.addCelestialObject(newCelestialObj);
    return newCelestialObj;
  }

  public clearState(options: ClearStateOptions = {}): void {
    const {
      resetCamera = false,
      resetTime = true,
      resetSelection = true,
    } = options;

    gameStateService.setAllCelestialObjects({});
    gameStateService.setAllCelestialHierarchy({});

    const currentState = simulationStateService.getCurrentState();
    const newState: any = { ...currentState }; // Cast to any to avoid SimulationState type issues if changing structure

    if (resetTime) {
      newState.time = 0;
      newState.timeScale = 1;
      newState.paused = false;
    }
    if (resetSelection) {
      newState.selectedObject = null;
      newState.focusedObjectId = null;
    }
    if (resetCamera) {
      newState.camera = {
        position: new OSVector3(0, 0, 1000),
        target: new OSVector3(0, 0, 0),
        fov: 60,
      };
    }
    simulationStateService.setState(newState);
    document.dispatchEvent(
      new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
        detail: { count: 0 },
      }),
    );
  }

  public createSolarSystem(data: CelestialFactoryInput): string {
    // Changed input type
    if (data.type !== CelestialType.STAR) {
      console.error(
        `[CelestialFactoryService] createSolarSystem called with non-star type: ${data.type}. Aborting.`,
      );
      return "";
    }

    this.clearState({ resetCamera: false });

    const finalPhysicsState: CelestialPhysicsState = {
      id: data.id,
      mass_kg: data.initialPhysicsParams.mass_kg,
      position_m:
        data.initialPhysicsParams.position_m ?? new OSVector3(0, 0, 0),
      velocity_mps:
        data.initialPhysicsParams.velocity_mps ?? new OSVector3(0, 0, 0),
      orientation:
        data.initialPhysicsParams.orientation ?? new Quaternion(0, 0, 0, 1),
      angularVelocity_radps:
        data.initialPhysicsParams.angularVelocity_radps ??
        new OSVector3(0, 0, 0),
      ticksSinceLastPhysicsUpdate:
        data.initialPhysicsParams.ticksSinceLastPhysicsUpdate ?? 0,
    };

    const star = this._createAndAddCelestial(
      data,
      finalPhysicsState,
      undefined,
    );

    if (star) {
      document.dispatchEvent(
        new CustomEvent(CustomEvents.CELESTIAL_OBJECTS_LOADED, {
          detail: { count: 1, systemId: star.id },
        }),
      );
      return star.id;
    }
    return "";
  }

  public addCelestial(
    data: CelestialFactoryInput,
  ): CelestialObject | undefined {
    // Changed input type
    const allObjects = gameStateService.getCelestialObjects();
    let parentObject: CelestialObject | undefined = undefined;

    if (data.parentId) {
      parentObject = allObjects[data.parentId];
      if (!parentObject) {
        console.error(
          `[CelestialFactoryService] Cannot add object ${data.id}. Parent ${data.parentId} not found.`,
        );
        return undefined;
      }
    }

    let worldPos: OSVector3;
    let worldVel: OSVector3;

    // Determine position and velocity
    if (data.initialPhysicsParams.position_m) {
      worldPos = data.initialPhysicsParams.position_m;
    } else if (data.orbit && parentObject) {
      try {
        worldPos = calculateOrbitalPosition(
          parentObject.physicsState,
          data.orbit, // data.orbit should be defined here due to the condition
          0, // timeOffset = 0 for initial placement
        ).add(parentObject.physicsState.position_m);
      } catch (error) {
        console.error(
          `[CelestialFactoryService] Error calculating initial position for ${data.id}:`,
          error,
        );
        return undefined;
      }
    } else if (data.type === CelestialType.STAR && !parentObject) {
      worldPos = new OSVector3(0, 0, 0);
    } else {
      // Fallback for unusual cases or if orbit is expected but missing for non-star
      if (data.type !== CelestialType.STAR && !data.orbit) {
        console.error(
          `[CelestialFactoryService] Non-star object ${data.id} (Type: ${data.type}) is missing orbit parameters and explicit position.`,
        );
        // Potentially return undefined or place at origin with a stronger warning
      }
      console.warn(
        `[CelestialFactoryService] Object ${data.id} (Type: ${data.type}) has an unusual configuration or missing orbital data for position. Placing at origin.`,
      );
      worldPos = new OSVector3(0, 0, 0);
    }

    if (data.initialPhysicsParams.velocity_mps) {
      worldVel = data.initialPhysicsParams.velocity_mps;
    } else if (data.orbit && parentObject) {
      try {
        worldVel = calculateOrbitalVelocity(
          parentObject.physicsState,
          data.orbit, // data.orbit should be defined here
          0,
        );
      } catch (error) {
        console.error(
          `[CelestialFactoryService] Error calculating initial velocity for ${data.id}:`,
          error,
        );
        return undefined;
      }
    } else if (data.type === CelestialType.STAR && !parentObject) {
      worldVel = new OSVector3(0, 0, 0);
    } else {
      // Similar fallback for velocity
      console.warn(
        `[CelestialFactoryService] Object ${data.id} (Type: ${data.type}) has an unusual configuration or missing orbital data for velocity. Setting to zero.`,
      );
      worldVel = new OSVector3(0, 0, 0);
    }

    const finalPhysicsState: CelestialPhysicsState = {
      id: data.id,
      mass_kg: data.initialPhysicsParams.mass_kg,
      position_m: worldPos,
      velocity_mps: worldVel,
      orientation:
        data.initialPhysicsParams.orientation ?? new Quaternion(0, 0, 0, 1),
      angularVelocity_radps:
        data.initialPhysicsParams.angularVelocity_radps ??
        new OSVector3(0, 0, 0),
      ticksSinceLastPhysicsUpdate:
        data.initialPhysicsParams.ticksSinceLastPhysicsUpdate ?? 0,
    };

    return this._createAndAddCelestial(data, finalPhysicsState, parentObject);
  }
}

export const celestialFactory = CelestialFactoryService.getInstance();
