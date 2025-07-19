import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const MIRANDA_REAL_RADIUS_KM = 235.8;

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
  realRadius_m: kmToM(MIRANDA_REAL_RADIUS_KM),
  orbit: createOrbitalElements({
    semiMajorAxisAU: 129390 / 149597870.7, // 129,390 km converted to AU
    eccentricity: 0.0013,
    inclinationDeg: 4.232,
    longitudeOfAscendingNodeDeg: 169.5,
    argumentOfPeriapsisDeg: 289.7,
    meanAnomalyDeg: 182.4,
    period_s: 1.22e5,
    siderealRotationPeriod_s: 1.22e5, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
  }),
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
