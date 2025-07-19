import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const EARTH_MASS_KG = 5.972168e24;
const EARTH_RADIUS_KM = 6371.0; // Mean radius
const EARTH_TEMP_K = 255; // Blackbody temperature
const EARTH_ALBEDO = 0.294; // Bond albedo
const EARTH_ORBITAL_PERIOD_S = 365.256363004 * 24 * 60 * 60; // 365.256363004 days in seconds
const EARTH_SIDEREAL_ROTATION_PERIOD_S = 86164.09054; // Exact sidereal day (physics-based)

/**
 * Earth configuration object for modular solar system initialization.
 */
export const earth: CelestialObject<PlanetProperties> = {
  id: "earth",
  name: "Earth",
  seed: "earth",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: EARTH_MASS_KG,
  realRadius_m: kmToM(EARTH_RADIUS_KM),
  temperature: EARTH_TEMP_K,
  albedo: EARTH_ALBEDO,
  orbit: createOrbitalElements({
    // Earth's orbital elements (J2000 epoch)
    semiMajorAxisAU: 149598023 / 149597870.7, // 149,598,023 km converted to AU
    eccentricity: 0.0167086,
    inclinationDeg: 0.00005, // Relative to J2000 ecliptic
    longitudeOfAscendingNodeDeg: -11.26064, // Relative to J2000 ecliptic
    argumentOfPeriapsisDeg: 114.20783,
    meanAnomalyDeg: 358.617,
    period_s: EARTH_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: EARTH_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: 23.4392811,
    // Additional parameters from Wikipedia
    aphelionAU: 152097597 / 149597870.7, // 152,097,597 km converted to AU
    perihelionAU: 147098450 / 149597870.7, // 147,098,450 km converted to AU
    averageOrbitalSpeedKmps: 29.7827,
    timeOfPerihelion: "2023-01-04", // Time of perihelion
    epoch: "J2000",
  }),
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.TERRESTRIAL,
    isMoon: false,
    composition: [
      "silicates",
      "iron core",
      "liquid water",
      "nitrogen-oxygen atmosphere",
    ],
    atmosphere: {
      glowColor: "#87CEEB",
      intensity: 0.6,
      power: 1.2,
      thickness: 0.25,
    },
    surface: {
      roughness: 0.12,
      persistence: 0.54,
      lacunarity: 2.2,
      simplePeriod: 18,
      octaves: 9,
      bumpScale: 2.7,
      color1: "#1E3A5F",
      color2: "#3F7CAC",
      color3: "#8FBC8F",
      color4: "#9ACD32",
      color5: "#FFFAFA",
      height1: 0,
      height2: 0.09,
      height3: 0.26,
      height4: 0.4,
      height5: 0.67,
      shininess: 8.5,
      specularStrength: 0.32,
      ambientLightIntensity: 0.01, // Minimal ambient for dark space
      undulation: 0.8,
      terrainType: 3,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.7,
      terrainOffset: -0.5,
    },
  },
};
