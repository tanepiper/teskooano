import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const THEBE_MASS_KG = 4.3e17;
const THEBE_RADIUS_M = 49300;
const THEBE_SMA_M = 222000 * KM;
const THEBE_ECC = 0.0175;
const THEBE_INC_DEG = 1.076;
const THEBE_SIDEREAL_PERIOD_S = 58275;
const THEBE_ALBEDO = 0.047;

/**
 * Thebe moon configuration object for modular solar system initialization.
 */
export const thebe = {
  id: "thebe",
  name: "Thebe",
  seed: "thebe_seed_2024",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: THEBE_MASS_KG,
  realRadius_m: THEBE_RADIUS_M,
  temperature: 120, // Generic temperature
  albedo: THEBE_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: THEBE_SMA_M,
    eccentricity: THEBE_ECC,
    inclination: THEBE_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: THEBE_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: THEBE_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["rocky materials", "ice"],
    surface: {
      type: SurfaceType.CRATERED,
      color: "#888888",
      roughness: 0.8,
      classType: PlanetType.ROCKY,
      persistence: 0.5,
      lacunarity: 2.0,
      simplePeriod: 2.0,
      octaves: 6,
      bumpScale: 0.5,
      color1: "#A9A9A9",
      color2: "#696969",
      color3: "#808080",
      color4: "#BEBEBE",
      color5: "#D3D3D3",
      height1: 0.2,
      height2: 0.4,
      height3: 0.6,
      height4: 0.8,
      height5: 1.0,
      shininess: 5,
      specularStrength: 0.1,
      ambientLightIntensity: 0.01,
      undulation: 0.1,
      terrainType: 1,
      terrainAmplitude: 0.2,
      terrainSharpness: 1.5,
      terrainOffset: 0.1,
    },
  } as PlanetProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the thebe configuration object instead.
 */
export function initializeThebe(parentId: string): void {
  const thebeConfig = { ...thebe, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
