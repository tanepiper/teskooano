import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

// Verified Wikipedia/NASA data for Deimos
const DEIMOS_MASS_KG = 1.51e15; // Wikipedia verified: 1.51×10¹⁵ kg
const DEIMOS_RADIUS_KM = 6.27; // Wikipedia verified: 6.27±0.07 km mean radius
const DEIMOS_ALBEDO = 0.068; // Wikipedia verified
const DEIMOS_TEMP_K = 233; // Wikipedia verified: ≈233 K

/**
 * Deimos moon configuration object for modular solar system initialization.
 */
export const deimos: CelestialObject<PlanetProperties> = {
  id: "deimos",
  name: "Deimos",
  seed: "deimos_dread_mars_moon",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "mars", // Will be replaced during initialization
  realMass_kg: DEIMOS_MASS_KG,
  realRadius_m: kmToM(DEIMOS_RADIUS_KM),
  temperature: DEIMOS_TEMP_K,
  albedo: DEIMOS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 23463.2 / 149597870.7, // 23,463.2 km converted to AU
    eccentricity: 0.00033,
    inclinationDeg: 0.93, // To Mars's equator
    longitudeOfAscendingNodeDeg: 54.3,
    argumentOfPeriapsisDeg: 0.0,
    meanAnomalyDeg: 205.0,
    period_s: 30.312 * 3600, // 30.312 hours (synchronous)
    siderealRotationPeriod_s: 30.312 * 3600, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
    epoch: "JD 2456191.5",
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: [
      "C-type carbonaceous chondrite",
      "D-type asteroid material",
      "thick regolith layer",
      "meteoroid impact debris",
    ],
    shapeModel: "asteroid",
    atmosphere: undefined,
    surface: {
      roughness: 0.6,
      persistence: 0.45,
      lacunarity: 2.1,
      simplePeriod: 4.0,
      octaves: 5,
      bumpScale: 0.15,
      color1: "#606060",
      color2: "#707070",
      color3: "#808080",
      color4: "#909090",
      color5: "#A0A0A0",
      height1: 0.0,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 1.0,
      shininess: 0.01,
      specularStrength: 0.01,
      ambientLightIntensity: 0.01,
      undulation: 0.2,
      terrainType: 1,
      terrainAmplitude: 0.3,
      terrainSharpness: 0.6,
      terrainOffset: 0.0,
    },
  },
};
