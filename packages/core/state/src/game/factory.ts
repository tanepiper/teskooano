import { OSVector3 } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
  type PhysicsStateReal,
} from "@teskooano/core-physics";
import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  OrbitalParameters,
  StarProperties,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  CustomEvents,
  StellarType,
} from "@teskooano/data-types";
import { celestialActions } from "./celestialActions";
import { simulationStateService } from "./simulation";
import { gameStateService } from "./stores";
import { CelestialObjectCreationInput, ClearStateOptions } from "./types";
import { determineStarThermalProperties } from "./utils/star-properties.utils";

/**
 * @class CelestialFactoryService
 * @description Service responsible for creating and managing celestial objects within the game state.
 * Implemented as a singleton.
 */
class CelestialFactoryService {
  private static instance: CelestialFactoryService;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Gets the singleton instance of the CelestialFactoryService.
   * @returns {CelestialFactoryService} The singleton instance.
   */
  public static getInstance(): CelestialFactoryService {
    if (!CelestialFactoryService.instance) {
      CelestialFactoryService.instance = new CelestialFactoryService();
    }
    return CelestialFactoryService.instance;
  }

  /**
   * Internal method to create and add a celestial object to the game state.
   * It sets up the core object properties, physics state, and hierarchy.
   * @private
   * @param {CelestialObjectCreationInput} data - The input data for creating the celestial object.
   * @param {PhysicsStateReal} calculatedPhysicsStateReal - The pre-calculated real physics state of the object.
   * @param {CelestialSpecificPropertiesUnion | undefined} processedProperties - The specific properties of the celestial object (e.g., StarProperties, PlanetProperties).
   * @param {number} processedTemperature - The processed temperature of the object.
   * @param {number} processedAlbedo - The processed albedo of the object.
   */
  private _createCelestialObjectInternal(
    data: CelestialObjectCreationInput,
    calculatedPhysicsStateReal: PhysicsStateReal,
    processedProperties: CelestialSpecificPropertiesUnion | undefined,
    processedTemperature: number,
    processedAlbedo: number,
  ): void {
    const seedString =
      typeof data.seed === "number"
        ? data.seed.toString()
        : (data.seed ?? `${Math.floor(Math.random() * 1000000)}`);

    const coreObject: CelestialObject = {
      id: data.id,
      name: data.name,
      type: data.type,
      parentId: data.parentId,
      realMass_kg: data.realMass_kg,
      realRadius_m: data.realRadius_m,
      status: CelestialStatus.ACTIVE,
      orbit: data.orbit!,
      temperature: processedTemperature,
      albedo: processedAlbedo,
      siderealRotationPeriod_s: data.siderealRotationPeriod_s,
      axialTilt: data.axialTilt,
      atmosphere: data.atmosphere,
      properties: processedProperties,
      seed: seedString,
      physicsStateReal: calculatedPhysicsStateReal,
      currentParentId: data.parentId,
      ignorePhysics: data.ignorePhysics,
    };
    celestialActions.addCelestialObject(coreObject);

    if (data.parentId) {
      const currentHierarchy = gameStateService.getCelestialHierarchy();
      const siblings = currentHierarchy[data.parentId] || [];
      if (!siblings.includes(data.id)) {
        const newHierarchy = {
          ...currentHierarchy,
          [data.parentId]: [...siblings, data.id],
        };
        gameStateService.setCelestialHierarchy(newHierarchy);
      }
    }
  }

  /**
   * Clears the current game state, including celestial objects and hierarchy.
   * Optionally resets camera, time, and selection state.
   * Dispatches a `CELESTIAL_OBJECTS_LOADED` event with count 0 after clearing.
   * @param {ClearStateOptions} [options={}] - Options to control what parts of the state are reset.
   * @public
   */
  public clearState(options: ClearStateOptions = {}): void {
    const {
      resetCamera = false,
      resetTime = true,
      resetSelection = true,
    } = options;

    gameStateService.setAllCelestialObjects({});
    gameStateService.setAllCelestialHierarchy({});

    const currentState = simulationStateService.getCurrentState();

    const newState: any = { ...currentState };

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

  /**
   * Creates a new solar system, typically centered around a star.
   * This involves clearing the current state (partially, camera isn't reset by default),
   * processing the primary star's properties, and adding it to the game state.
   * Dispatches a `CELESTIAL_OBJECTS_LOADED` event with count 1 and systemId after creation.
   * @param {CelestialObjectCreationInput} data - The input data for the primary star of the solar system.
   *                                              Must be of type `CelestialType.STAR`.
   * @returns {string} The ID of the created star, or an empty string if creation failed.
   * @public
   */
  public createSolarSystem(data: CelestialObjectCreationInput): string {
    if (data.type !== CelestialType.STAR) {
      console.error(
        `[CelestialFactoryService] createSolarSystem called with non-star type: ${data.type}. Aborting.`,
      );
      return "";
    }

    this.clearState({ resetCamera: false });

    const inputStarProps =
      data.properties?.type === CelestialType.STAR
        ? data.properties
        : undefined;
    const isMainStar = inputStarProps?.isMainStar ?? true;
    const spectralClass = inputStarProps?.spectralClass || "G2V";
    const stellarType =
      inputStarProps?.stellarType ?? StellarType.MAIN_SEQUENCE;
    const partnerStars = inputStarProps?.partnerStars;

    let albedo = data.albedo;

    const thermalProps = determineStarThermalProperties({
      stellarType: stellarType,
      currentTemperature: data.temperature,
      currentLuminosity: inputStarProps?.luminosity,
      currentColor: inputStarProps?.color,
    });

    const temperature = thermalProps.temperature;
    const defaultLuminosity = thermalProps.luminosity;
    const defaultColor = thermalProps.color;

    if (albedo === undefined) albedo = 0.3;

    // Ensure shaderUniforms are present
    let shaderUniformsData = inputStarProps?.shaderUniforms;
    if (!shaderUniformsData) {
      // If not provided in input, set up defaults.
      // These defaults should ideally match procedural generation's defaults
      // and/or material defaults for consistency.
      shaderUniformsData = {
        baseStar: {
          coronaIntensity: 1,
          pulseSpeed: 0.5,
          glowIntensity: 1,
          temperatureVariation: 0.2,
          metallicEffect: 0.1,
          noiseEvolutionSpeed: 0.05,
        },
        corona: {
          opacity: 0.5,
          pulseSpeed: 0.7,
          noiseScale: 1,
          noiseEvolutionSpeed: 1.0,
        },
      };
    }

    const processedProperties: StarProperties = {
      type: CelestialType.STAR,
      isMainStar,
      spectralClass,
      luminosity: defaultLuminosity,
      color: defaultColor,
      stellarType,
      partnerStars,
      shaderUniforms: shaderUniformsData,
      timeOffset: inputStarProps?.timeOffset ?? Math.random() * 1000.0,
    };

    const starPhysicsReal: PhysicsStateReal = {
      id: data.id,
      mass_kg: data.realMass_kg,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    };

    this._createCelestialObjectInternal(
      data,
      starPhysicsReal,
      processedProperties,
      temperature,
      albedo,
    );

    const currentHierarchy = gameStateService.getCelestialHierarchy();
    gameStateService.setCelestialHierarchy({
      ...currentHierarchy,
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
   * Adds a celestial object (e.g., planet, moon, secondary star) to the game state.
   * Calculates its initial physics state based on its orbital parameters and parent object.
   * For objects like RING_SYSTEM, OORT_CLOUD, ASTEROID_FIELD, or parentless stars, specific
   * logic is applied for their physics state.
   * @param {CelestialObjectCreationInput} data - The input data for the celestial object to add.
   * @public
   */
  public addCelestial(data: CelestialObjectCreationInput): void {
    if (data.type === CelestialType.STAR) {
      if (!data.parentId) {
        console.error(
          `[CelestialFactoryService] addCelestial (for object ID: ${data.id}) was called for a STAR type object that has no parentId. ` +
            `Root/primary stars should be created using the 'createSolarSystem()' method instead. ` +
            `Proceeding with addCelestial logic for a root star is not standard and may lead to unexpected system configuration.`,
        );
        // Note: The current logic will still attempt to process this star as a root object
        // in the physicsStateReal calculation section below if not returned here.
        // This error serves as a strong warning for API misuse.
      }
      // No general warning for stars with a parentId, as they are valid companion stars.
    }

    if (!data.parentId) {
      if (data.type !== CelestialType.STAR) {
        console.error(
          `[CelestialFactoryService] Cannot add non-star object ${data.id}. Missing parentId.`,
        );
        return;
      }
    }

    let physicsStateReal: PhysicsStateReal;
    let orbitalParams: OrbitalParameters | undefined = data.orbit;

    const objects = gameStateService.getCelestialObjects();
    const parent = data.parentId ? objects[data.parentId] : null;

    if (data.type === CelestialType.RING_SYSTEM) {
      if (!parent) {
        console.error(
          `[CelestialFactoryService] Cannot add RING_SYSTEM ${data.id}. Parent ${data.parentId} not found.`,
        );
        return;
      }
      if (!parent.physicsStateReal) {
        console.error(
          `[CelestialFactoryService] Cannot add RING_SYSTEM ${data.id}. Parent ${data.parentId} is missing real physics state.`,
        );
        return;
      }

      physicsStateReal = {
        id: data.id,
        mass_kg: 0,
        position_m: parent.physicsStateReal.position_m.clone(),
        velocity_mps: parent.physicsStateReal.velocity_mps.clone(),
      };
      orbitalParams = undefined;
    } else if (data.type === CelestialType.OORT_CLOUD) {
      if (!parent) {
        console.error(
          `[CelestialFactoryService] Cannot add OORT_CLOUD ${data.id}. Parent ${data.parentId} not found.`,
        );
        return;
      }
      if (!parent.physicsStateReal) {
        console.error(
          `[CelestialFactoryService] Cannot add OORT_CLOUD ${data.id}. Parent ${data.parentId} is missing real physics state.`,
        );
        return;
      }

      physicsStateReal = {
        id: data.id,
        mass_kg: 0,
        position_m: parent.physicsStateReal.position_m.clone(),
        velocity_mps: parent.physicsStateReal.velocity_mps.clone(),
      };
      orbitalParams = undefined;
    } else if (data.type === CelestialType.ASTEROID_FIELD) {
      if (!parent) {
        console.error(
          `[CelestialFactoryService] Cannot add ASTEROID_FIELD ${data.id}. Parent ${data.parentId} not found.`,
        );
        return;
      }
      if (!parent.physicsStateReal) {
        console.error(
          `[CelestialFactoryService] Cannot add ASTEROID_FIELD ${data.id}. Parent ${data.parentId} is missing real physics state.`,
        );
        return;
      }
      physicsStateReal = {
        id: data.id,
        mass_kg: 0,
        position_m: parent.physicsStateReal.position_m.clone(),
        velocity_mps: parent.physicsStateReal.velocity_mps.clone(),
      };
      orbitalParams = undefined;
    } else if (data.type === CelestialType.STAR && !data.parentId) {
      physicsStateReal = {
        id: data.id,
        mass_kg: data.realMass_kg,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };
      orbitalParams = undefined;
    } else {
      if (!orbitalParams) {
        console.error(
          `[CelestialFactoryService] Cannot add object ${data.id} (Type: ${data.type}). Missing orbit parameters.`,
        );
        return;
      }
      if (!parent) {
        console.error(
          `[CelestialFactoryService] Cannot add object ${data.id}. Parent ${data.parentId} not found.`,
        );
        return;
      }
      if (!parent.physicsStateReal) {
        console.error(
          `[CelestialFactoryService] Cannot add object ${data.id}. Parent ${data.parentId} is missing real physics state.`,
        );
        return;
      }

      let initialWorldPosReal: OSVector3;
      let initialWorldVelReal: OSVector3;
      try {
        const initialRelativePosReal = calculateOrbitalPosition(
          parent.physicsStateReal,
          orbitalParams,
          0,
        );
        initialWorldVelReal = calculateOrbitalVelocity(
          parent.physicsStateReal,
          orbitalParams,
          0,
        );
        initialWorldPosReal = initialRelativePosReal
          .clone()
          .add(parent.physicsStateReal.position_m);
      } catch (error) {
        console.error(
          `[CelestialFactoryService] Error calculating initial physics state for ${data.id}:`,
          error,
        );
        console.error("Input Data:", {
          parentState: parent.physicsStateReal,
          orbitParams: orbitalParams,
        });
        return;
      }
      const posOk =
        initialWorldPosReal &&
        Number.isFinite(initialWorldPosReal.x) &&
        Number.isFinite(initialWorldPosReal.y) &&
        Number.isFinite(initialWorldPosReal.z);
      const velOk =
        initialWorldVelReal &&
        Number.isFinite(initialWorldVelReal.x) &&
        Number.isFinite(initialWorldVelReal.y) &&
        Number.isFinite(initialWorldVelReal.z);
      if (!posOk || !velOk) {
        console.error(
          `[CelestialFactoryService] Calculated non-finite initial state for ${data.id}. Aborting add. PosOK: ${posOk}, VelOK: ${velOk}`,
          {
            orbitParams: orbitalParams,
            parentState: parent.physicsStateReal,
            calcWorldVel: initialWorldVelReal,
            calcWorldPos: initialWorldPosReal,
          },
        );
        return;
      }

      physicsStateReal = {
        id: data.id,
        mass_kg: data.realMass_kg,
        position_m: initialWorldPosReal,
        velocity_mps: initialWorldVelReal,
      };
    }

    const processedTemperature = data.temperature ?? 100;
    const processedAlbedo = data.albedo ?? 0.3;

    const processedProperties = data.properties;

    this._createCelestialObjectInternal(
      data,
      physicsStateReal,
      processedProperties,
      processedTemperature,
      processedAlbedo,
    );
  }
}

/**
 * Singleton instance of CelestialFactoryService for creating celestial objects and systems.
 */
export const celestialFactory = CelestialFactoryService.getInstance();
