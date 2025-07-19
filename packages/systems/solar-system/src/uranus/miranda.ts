import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const MIRANDA_REAL_RADIUS_M = 235.8 * KM;

/**
 * Miranda configuration object for modular solar system initialization.
 */
export const miranda: CelestialObject<PlanetProperties> = {
  id: "miranda",
  name: "Miranda",
  seed: "miranda_seed_1413",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "uranus", // Will be replaced during initialization
  realMass_kg: 6.59e19,
  realRadius_m: MIRANDA_REAL_RADIUS_M,
  orbit: {
    realSemiMajorAxis_m: 129390 * KM,
    eccentricity: 0.0013,
    inclination: 4.232 * DEG_TO_RAD,
    longitudeOfAscendingNode: 169.5 * DEG_TO_RAD,
    argumentOfPeriapsis: 289.7 * DEG_TO_RAD,
    meanAnomaly: 182.4 * DEG_TO_RAD,
    period_s: 1.22e5,
    siderealRotationPeriod_s: 1.22e5,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  temperature: 60,
  albedo: 0.32,
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "silicates", "methane clathrates?"],
    surface: {
      roughness: 0.75,
      persistence: 0.65,
      lacunarity: 2.5,
      simplePeriod: 1.5,
      octaves: 12,
      bumpScale: 4.0,
      color1: "#707078",
      color2: "#909098",
      color3: "#B8B8C0",
      color4: "#D0D0D8",
      color5: "#E8E8F0",
      height1: 0.05,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 0.95,
      shininess: 15,
      specularStrength: 0.35,
      ambientLightIntensity: 0.01,
      undulation: 0.5,
      terrainType: 1,
      terrainAmplitude: 1.5,
      terrainSharpness: 2.5,
      terrainOffset: 0.0,
    },
  },
};
