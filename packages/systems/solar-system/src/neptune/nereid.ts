import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  type CelestialObject,
  type PlanetProperties,
} from "@teskooano/data-types";

/**
 * Nereid configuration object for modular solar system initialization.
 */
export const nereid: CelestialObject<PlanetProperties> = {
  id: "nereid",
  name: "Nereid",
  seed: "nereid_seed_360",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "neptune", // Will be replaced during initialization
  realMass_kg: 3.1e19,
  realRadius_m: 170 * 1000, // Convert km to m
  temperature: 50,
  albedo: 0.14,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.03685, // Approximately 5,513,400 km (real value)
    eccentricity: 0.7507,
    inclinationDeg: 7.232,
    longitudeOfAscendingNodeDeg: 329.9,
    argumentOfPeriapsisDeg: 268.2,
    meanAnomalyDeg: 49.3,
    period_s: 1.614e7,
    siderealRotationPeriod_s: 11.52 * 3600,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rock?"],
    shapeModel: "asteroid",
    surface: {
      roughness: 0.7,
      persistence: 0.55,
      lacunarity: 2.3,
      simplePeriod: 3.2,
      octaves: 10,
      bumpScale: 3.0,
      color1: "#606068", // Dark base
      color2: "#808088", // Medium gray
      color3: "#A0A0A8", // Nereid's surface
      color4: "#C0C0C8", // Lighter areas
      color5: "#D0D0D8", // Brightest spots
      height1: 0.08,
      height2: 0.25,
      height3: 0.45,
      height4: 0.7,
      height5: 0.9,
      shininess: 8,
      specularStrength: 0.2,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.35,
      terrainType: 2,
      terrainAmplitude: 1.0,
      terrainSharpness: 1.8,
      terrainOffset: -0.1,
    },
  },
};
