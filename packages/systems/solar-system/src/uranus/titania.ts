import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const TITANIA_REAL_RADIUS_KM = 788.4;

/**
 * Titania configuration object for modular solar system initialization.
 */
export const titania: CelestialObject<PlanetProperties> = {
  id: "titania",
  name: "Titania",
  seed: "titania_seed_8706",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "uranus", // Will be replaced during initialization
  realMass_kg: 3.527e21,
  realRadius_m: kmToM(TITANIA_REAL_RADIUS_KM),
  orbit: createOrbitalElements({
    semiMajorAxisAU: 436300 / 149597870.7, // 436,300 km converted to AU
    eccentricity: 0.0011,
    inclinationDeg: 0.34,
    longitudeOfAscendingNodeDeg: 169.5,
    argumentOfPeriapsisDeg: 110.1,
    meanAnomalyDeg: 15.9,
    period_s: 7.526e5,
    siderealRotationPeriod_s: 7.526e5, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
  }),
  temperature: 70,
  albedo: 0.27,
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rock", "carbon dioxide ice"],
    surface: {
      roughness: 0.7,
      persistence: 0.52,
      lacunarity: 2.1,
      simplePeriod: 2.3,
      octaves: 9,
      bumpScale: 2.8,
      color1: "#A0A8B0",
      color2: "#B0B0B8",
      color3: "#C0C8D0",
      color4: "#D0D8E0",
      color5: "#E0E8F0",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 18,
      specularStrength: 0.4,
      ambientLightIntensity: 0.01,
      undulation: 0.25,
      terrainType: 2,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  },
};
