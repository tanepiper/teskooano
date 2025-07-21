import {
  createOrbitalElements,
  kmToM,
  J2000_EPOCH,
} from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

// Verified Wikipedia data for Ganymede - largest moon in Solar System
const GANYMEDE_MASS_KG = 1.4819e23; // Wikipedia verified
const GANYMEDE_RADIUS_KM = 2634.1; // Wikipedia verified: 2634.1±0.3 km
const GANYMEDE_ALBEDO = 0.43; // Wikipedia verified: 0.43±0.02
const GANYMEDE_TEMP_K = 110; // Wikipedia verified: mean 110 K

/**
 * Ganymede moon configuration object for modular solar system initialization.
 */
export const ganymede: CelestialObject<PlanetProperties> = {
  id: "ganymede",
  name: "Ganymede",
  seed: "ganymede_seed_7155",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: GANYMEDE_MASS_KG,
  realRadius_m: kmToM(GANYMEDE_RADIUS_KM),
  temperature: GANYMEDE_TEMP_K,
  albedo: GANYMEDE_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 1070400 / 149597870.7, // 1,070,400 km converted to AU
    eccentricity: 0.0013,
    inclinationDeg: 0.2, // To Jupiter's equator
    longitudeOfAscendingNodeDeg: 63.552,
    argumentOfPeriapsisDeg: 192.417,
    meanAnomalyDeg: 317.54,
    period_s: 7.15455296 * 24 * 3600, // 7.15455296 days (synchronous)
    siderealRotationPeriod_s: 7.15455296 * 24 * 3600, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: [
      "water ice",
      "silicates",
      "iron-rich core",
      "subsurface ocean",
    ],
    atmosphere: {
      glowColor: "#FFFFFF",
      intensity: 0.01,
      power: 0.4,
      thickness: 0.005,
    },
    surface: {
      roughness: 0.4,
      persistence: 0.5,
      lacunarity: 2.0,
      simplePeriod: 2.5,
      octaves: 9,
      bumpScale: 2.7,
      color1: "#A0A8B0",
      color2: "#C0C8D0",
      color3: "#D0D8E0",
      color4: "#E0E8F0",
      color5: "#F0F8FF",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 20,
      specularStrength: 0.5,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.2,
      terrainType: 2,
      terrainAmplitude: 0.75,
      terrainSharpness: 1.2,
      terrainOffset: 0.05,
    },
  },
};
