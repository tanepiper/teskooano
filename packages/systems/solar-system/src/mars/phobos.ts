import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

// Verified Wikipedia data for Phobos
const PHOBOS_MASS_KG = 1.072e16; // Wikipedia verified: 1.072×10¹⁶ kg
const PHOBOS_RADIUS_KM = 11.1; // Wikipedia verified: 11.1 km mean radius
const PHOBOS_ALBEDO = 0.071; // Wikipedia verified
const PHOBOS_TEMP_K = 233; // Wikipedia verified: ~233 K

/**
 * Phobos moon configuration object for modular solar system initialization.
 */
export const phobos: CelestialObject<PlanetProperties> = {
  id: "phobos",
  name: "Phobos",
  seed: "phobos_fear_mars_moon",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "mars", // Will be replaced during initialization
  realMass_kg: PHOBOS_MASS_KG,
  realRadius_m: kmToM(PHOBOS_RADIUS_KM),
  temperature: PHOBOS_TEMP_K,
  albedo: PHOBOS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 9377.2 / 149597870.7, // 9,377.2 km converted to AU
    eccentricity: 0.0151,
    inclinationDeg: 1.093, // To Mars's equator
    longitudeOfAscendingNodeDeg: 169.2,
    argumentOfPeriapsisDeg: 216.3,
    meanAnomalyDeg: 189.7,
    period_s: 0.31891023 * 24 * 3600, // 0.31891023 days (synchronous)
    siderealRotationPeriod_s: 0.31891023 * 24 * 3600, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: [
      "carbonaceous chondrite",
      "C-type rock",
      "meteoroid impact debris",
      "fine dust regolith",
    ],
    shapeModel: "asteroid",
    atmosphere: undefined,
    surface: {
      roughness: 0.9,
      persistence: 0.4,
      lacunarity: 2.0,
      simplePeriod: 3.0,
      octaves: 5,
      bumpScale: 0.2,
      color1: "#404040",
      color2: "#505050",
      color3: "#606060",
      color4: "#707070",
      color5: "#808080",
      height1: 0.0,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 1.0,
      shininess: 0.01,
      specularStrength: 0.01,
      ambientLightIntensity: 0.01,
      undulation: 0.3,
      terrainType: 1,
      terrainAmplitude: 0.5,
      terrainSharpness: 0.8,
      terrainOffset: 0.0,
    },
  },
};
