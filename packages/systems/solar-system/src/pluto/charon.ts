import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
  type CelestialObject,
} from "@teskooano/data-types";

const CHARON_MASS_KG = 1.586e21;
const CHARON_RADIUS_M = 606 * KM;
const CHARON_SMA_M = 19591.4 * KM;
const CHARON_ECC = 0.00005;
const CHARON_INC_DEG = 0.001;
const CHARON_SIDEREAL_PERIOD_S = 551855.0;
const CHARON_ALBEDO = 0.38;
const CHARON_AXIAL_TILT_DEG = 119.59; // Same as Pluto

/**
 * Charon configuration object for modular solar system initialization.
 */
export const charon: CelestialObject<PlanetProperties> = {
  id: "charon",
  name: "Charon",
  seed: "charon",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "pluto", // Will be replaced during initialization
  realMass_kg: CHARON_MASS_KG,
  realRadius_m: CHARON_RADIUS_M,
  temperature: 53,
  albedo: CHARON_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: CHARON_SMA_M,
    eccentricity: CHARON_ECC,
    inclination: CHARON_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: 223.0 * DEG_TO_RAD,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: CHARON_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: CHARON_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(CHARON_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(CHARON_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "ammonia ice (hydrates)", "rocky interior"],
    surface: {
      roughness: 0.6,
      persistence: 0.52,
      lacunarity: 2.2,
      simplePeriod: 2.5,
      octaves: 9,
      bumpScale: 2.8,
      color1: "#8B4513",
      color2: "#A0A8B0",
      color3: "#B0B8C0",
      color4: "#D0D8E0",
      color5: "#F0F8FF",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 18,
      specularStrength: 0.4,
      ambientLightIntensity: 0.0,
      undulation: 0.25,
      terrainType: 2,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  },
};
