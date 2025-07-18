import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { celestial } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const PHOEBE_MASS_KG = 8.28e18;
const PHOEBE_RADIUS_M = 106.5 * KM;
const PHOEBE_SMA_M = 12947780 * KM;
const PHOEBE_ECC = 0.158;
const PHOEBE_INC_DEG = 173.04; // Retrograde orbit
const PHOEBE_LAN_DEG = 229.3;
const PHOEBE_AOP_DEG = 102.7;
const PHOEBE_MA_DEG = 308.2;
const PHOEBE_ORBITAL_PERIOD_S = -47369347; // Retrograde
const PHOEBE_ROTATION_PERIOD_S = 33419;
const PHOEBE_ALBEDO = 0.081;

/**
 * Initializes Phoebe, a dark, retrograde moon of Saturn, likely a captured object.
 */
export function initializePhoebe(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  celestial.addCelestial({
    id: "phoebe",
    name: "Phoebe",
    seed: "phoebe",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: PHOEBE_MASS_KG,
    realRadius_m: PHOEBE_RADIUS_M,
    temperature: 75,
    albedo: PHOEBE_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: PHOEBE_SMA_M,
      eccentricity: PHOEBE_ECC,
      inclination: PHOEBE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PHOEBE_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: PHOEBE_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: PHOEBE_MA_DEG * DEG_TO_RAD,
      period_s: PHOEBE_ORBITAL_PERIOD_S,
      siderealRotationPeriod_s: PHOEBE_ROTATION_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
    },
    physicsStateReal: {
      id: "phoebe",
      mass_kg: PHOEBE_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "rock", "carbonaceous material"],
      atmosphere: undefined,
      surface: {
        type: SurfaceType.VARIED,
        color: "#76645b",
        roughness: 0.8,
        classType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.2,
        simplePeriod: 1.9,
        octaves: 9,
        bumpScale: 3.0,
        color1: "#76645b",
        color2: "#63574b",
        color3: "#7a6c5c",
        color4: "#77685a",
        color5: "#706050",
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.9,
        shininess: 10,
        specularStrength: 0.2,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.3,
        terrainType: 2,
        terrainAmplitude: 0.7,
        terrainSharpness: 1.5,
        terrainOffset: -0.1,
      },
    } as PlanetProperties,
  });
}
