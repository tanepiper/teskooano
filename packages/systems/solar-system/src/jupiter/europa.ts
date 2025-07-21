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

// Verified Wikipedia/NASA data for Europa
const EUROPA_MASS_KG = 4.799844e22; // Wikipedia verified: (4.799844±0.000013)×10²² kg
const EUROPA_RADIUS_KM = 1560.8; // Wikipedia verified: 1560.8±0.5 km
const EUROPA_ALBEDO = 0.67; // Wikipedia verified: 0.67 ± 0.03
const EUROPA_TEMP_K = 102; // Wikipedia verified: mean 102 K

/**
 * Europa moon configuration object for modular solar system initialization.
 */
export const europa: CelestialObject<PlanetProperties> = {
  id: "europa",
  name: "Europa",
  seed: "europa_seed_3551",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: EUROPA_MASS_KG,
  realRadius_m: kmToM(EUROPA_RADIUS_KM),
  temperature: EUROPA_TEMP_K,
  albedo: EUROPA_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 670900 / 149597870.7, // 670,900 km converted to AU
    eccentricity: 0.009,
    inclinationDeg: 0.47, // To Jupiter's equator
    longitudeOfAscendingNodeDeg: 219.106,
    argumentOfPeriapsisDeg: 88.97,
    meanAnomalyDeg: 171.016,
    period_s: 3.551181 * 24 * 3600, // 3.551181 days (synchronous)
    siderealRotationPeriod_s: 3.551181 * 24 * 3600, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: [
      "water ice shell",
      "silicate mantle",
      "iron core",
      "subsurface ocean",
    ],
    atmosphere: {
      glowColor: "#FFFFFF",
      intensity: 0.02,
      power: 0.5,
      thickness: 0.01,
    },
    surface: {
      roughness: 0.3,
      persistence: 0.53,
      lacunarity: 2.15,
      simplePeriod: 0.86,
      octaves: 8,
      bumpScale: 10,
      color1: "#E8F4F8",
      color2: "#F0F4F8",
      color3: "#F8F8F8",
      color4: "#FFFFFF",
      color5: "#F0FFFF",
      height1: 0.088,
      height2: 0.41,
      height3: 0.4,
      height4: 0.43,
      height5: 0.43,
      shininess: 24,
      specularStrength: 0.7,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.1,
      terrainType: 3,
      terrainAmplitude: 0.19,
      terrainSharpness: 1.3,
      terrainOffset: 0.25,
    },
  },
};
