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
  ExoticStellarType,
  SpectralClass,
} from "@teskooano/data-types";
import { celestialActions } from "./celestialActions";
import { simulationStateService } from "./simulation";
import { gameStateService } from "./stores";
import { CelestialObjectCreationInput, ClearStateOptions } from "./types";

const _createCelestialObjectInternal = (
  data: CelestialObjectCreationInput,
  calculatedPhysicsStateReal: PhysicsStateReal,
  processedProperties: CelestialSpecificPropertiesUnion | undefined,
  processedTemperature: number,
  processedAlbedo: number,
) => {
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
    surface: data.surface,
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
};

/**
 * Factory methods for creating celestial systems
 */
export const celestialFactory = {
  /**
   * Clear all state before creating a new system
   * @param options - Optional settings to customize what gets reset
   */
  clearState: (options: ClearStateOptions = {}) => {
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
  },

  createSolarSystem: (data: CelestialObjectCreationInput): string => {
    if (data.type !== CelestialType.STAR) {
      console.error(
        `[celestialFactory] createSolarSystem called with non-star type: ${data.type}. Aborting.`,
      );
      return "";
    }

    celestialFactory.clearState({ resetCamera: false });

    const inputStarProps =
      data.properties?.type === CelestialType.STAR
        ? data.properties
        : undefined;
    const isMainStar = inputStarProps?.isMainStar ?? true;
    const spectralClass = inputStarProps?.spectralClass || "G2V";
    let mainSpectralClass = inputStarProps?.mainSpectralClass;
    let luminosityClass = inputStarProps?.luminosityClass;
    const specialSpectralClass = inputStarProps?.specialSpectralClass;
    const exoticType = inputStarProps?.exoticType;
    const whiteDwarfType = inputStarProps?.whiteDwarfType;
    const luminosity = inputStarProps?.luminosity;
    const color = inputStarProps?.color;
    const stellarType = inputStarProps?.stellarType;
    const partnerStars = inputStarProps?.partnerStars;
    let temperature = data.temperature;
    let defaultLuminosity = luminosity;
    let defaultColor = color;
    let albedo = data.albedo;

    if (!temperature || !defaultLuminosity || !defaultColor) {
      switch (mainSpectralClass) {
        case SpectralClass.O:
          temperature = temperature ?? 40000;
          defaultLuminosity = defaultLuminosity ?? 100000;
          defaultColor = defaultColor ?? "#9BB0FF";
          break;
        case SpectralClass.B:
          temperature = temperature ?? 20000;
          defaultLuminosity = defaultLuminosity ?? 1000;
          defaultColor = defaultColor ?? "#AABFFF";
          break;
        case SpectralClass.A:
          temperature = temperature ?? 8500;
          defaultLuminosity = defaultLuminosity ?? 20;
          defaultColor = defaultColor ?? "#F8F7FF";
          break;
        case SpectralClass.F:
          temperature = temperature ?? 6500;
          defaultLuminosity = defaultLuminosity ?? 4;
          defaultColor = defaultColor ?? "#FFF4EA";
          break;
        case SpectralClass.G:
          temperature = temperature ?? 5778;
          defaultLuminosity = defaultLuminosity ?? 1.0;
          defaultColor = defaultColor ?? "#FFF9E5";
          break;
        case SpectralClass.K:
          temperature = temperature ?? 4500;
          defaultLuminosity = defaultLuminosity ?? 0.4;
          defaultColor = defaultColor ?? "#FFAA55";
          break;
        case SpectralClass.M:
          temperature = temperature ?? 3000;
          defaultLuminosity = defaultLuminosity ?? 0.04;
          defaultColor = defaultColor ?? "#FF6644";
          break;
        case SpectralClass.L:
          temperature = temperature ?? 2000;
          defaultLuminosity = defaultLuminosity ?? 0.001;
          defaultColor = defaultColor ?? "#FF3300";
          break;
        case SpectralClass.T:
          temperature = temperature ?? 1300;
          defaultLuminosity = defaultLuminosity ?? 0.0001;
          defaultColor = defaultColor ?? "#CC2200";
          break;
        case SpectralClass.Y:
          temperature = temperature ?? 500;
          defaultLuminosity = defaultLuminosity ?? 0.00001;
          defaultColor = defaultColor ?? "#991100";
          break;
        default:
          temperature = temperature ?? 5778;
          defaultLuminosity = defaultLuminosity ?? 1.0;
          defaultColor = defaultColor ?? "#FFF9E5";
      }

      if (exoticType) {
        switch (exoticType) {
          case ExoticStellarType.WHITE_DWARF:
            temperature = temperature ?? 25000;
            defaultLuminosity = defaultLuminosity ?? 0.01;
            defaultColor = defaultColor ?? "#FFFFFF";
            break;
          case ExoticStellarType.NEUTRON_STAR:
            temperature = temperature ?? 1000000;
            defaultLuminosity = defaultLuminosity ?? 0.1;
            defaultColor = defaultColor ?? "#CCFFFF";
            break;
          case ExoticStellarType.BLACK_HOLE:
            temperature = temperature ?? 0;
            defaultLuminosity = defaultLuminosity ?? 0;
            defaultColor = defaultColor ?? "#000000";
            break;
          case ExoticStellarType.PULSAR:
            temperature = temperature ?? 1000000;
            defaultLuminosity = defaultLuminosity ?? 0.5;
            defaultColor = defaultColor ?? "#00FFFF";
            break;
          case ExoticStellarType.WOLF_RAYET:
            temperature = temperature ?? 50000;
            defaultLuminosity = defaultLuminosity ?? 100000;
            defaultColor = defaultColor ?? "#99FFFF";
            break;
        }
      }
    }
    if (albedo === undefined) albedo = 0.3;

    const processedProperties: StarProperties = {
      type: CelestialType.STAR,
      isMainStar,
      spectralClass,
      luminosity: defaultLuminosity,
      color: defaultColor,
      stellarType,
      partnerStars,
      mainSpectralClass,
      luminosityClass,
      specialSpectralClass,
      exoticType,
      whiteDwarfType,
    };

    const starPhysicsReal: PhysicsStateReal = {
      id: data.id,
      mass_kg: data.realMass_kg,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    };

    _createCelestialObjectInternal(
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
  },

  addCelestial: (data: CelestialObjectCreationInput): void => {
    if (data.type === CelestialType.STAR) {
      console.warn(
        `[celestialFactory] addCelestial called with star type: ${data.id}. Use createSolarSystem for the primary star.`,
      );

      if (!data.parentId) {
        console.error(
          `[celestialFactory] This appears to be a primary star. Using addCelestial for primary stars is not recommended. Please use createSolarSystem instead.`,
        );
      } else {
      }
    }

    if (!data.parentId) {
      if (data.type !== CelestialType.STAR) {
        console.error(
          `[celestialFactory] Cannot add non-star object ${data.id}. Missing parentId.`,
        );
        return;
      }
    }

    let physicsStateReal: PhysicsStateReal;
    let orbitalParams = data.orbit;

    const objects = gameStateService.getCelestialObjects();
    const parent = data.parentId ? objects[data.parentId] : null;

    if (data.type === CelestialType.RING_SYSTEM) {
      if (!parent) {
        console.error(
          `[celestialFactory] Cannot add RING_SYSTEM ${data.id}. Parent ${data.parentId} not found.`,
        );
        return;
      }
      if (!parent.physicsStateReal) {
        console.error(
          `[celestialFactory] Cannot add RING_SYSTEM ${data.id}. Parent ${data.parentId} is missing real physics state.`,
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
          `[celestialFactory] Cannot add OORT_CLOUD ${data.id}. Parent ${data.parentId} not found.`,
        );
        return;
      }
      if (!parent.physicsStateReal) {
        console.error(
          `[celestialFactory] Cannot add OORT_CLOUD ${data.id}. Parent ${data.parentId} is missing real physics state.`,
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
          `[celestialFactory] Cannot add ASTEROID_FIELD ${data.id}. Parent ${data.parentId} not found.`,
        );
        return;
      }
      if (!parent.physicsStateReal) {
        console.error(
          `[celestialFactory] Cannot add ASTEROID_FIELD ${data.id}. Parent ${data.parentId} is missing real physics state.`,
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
          `[celestialFactory] Cannot add object ${data.id} (Type: ${data.type}). Missing orbit parameters.`,
        );
        return;
      }
      if (!parent) {
        console.error(
          `[celestialFactory] Cannot add object ${data.id}. Parent ${data.parentId} not found.`,
        );
        return;
      }
      if (!parent.physicsStateReal) {
        console.error(
          `[celestialFactory] Cannot add object ${data.id}. Parent ${data.parentId} is missing real physics state.`,
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
          `[celestialFactory] Error calculating initial physics state for ${data.id}:`,
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
          `[celestialFactory] Calculated non-finite initial state for ${data.id}. Aborting add. PosOK: ${posOk}, VelOK: ${velOk}`,
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

    _createCelestialObjectInternal(
      data,
      physicsStateReal,
      processedProperties,
      processedTemperature,
      processedAlbedo,
    );
  },
};
