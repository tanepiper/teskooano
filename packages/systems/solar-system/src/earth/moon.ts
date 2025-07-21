import {
  J2000_EPOCH,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const LUNA_MASS_KG = 7.346e22; // J2000 epoch value from NASA fact sheet
const LUNA_RADIUS_KM = 1737.4; // Verified correct (mean radius)
const LUNA_ALBEDO = 0.136; // J2000 epoch Bond albedo from NASA fact sheet

/**
 * Luna (Moon) configuration object for modular solar system initialization.
 * Uses J2000 epoch orbital elements and physical properties.
 */
export const luna: CelestialObject<PlanetProperties> = {
  id: "luna",
  name: "Moon",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  seed: "luna",
  parentId: "earth", // Will be replaced during initialization
  realMass_kg: LUNA_MASS_KG,
  realRadius_m: kmToM(LUNA_RADIUS_KM),
  temperature: 250, // Mean temperature (verified from NASA - range 95-390K equator)
  albedo: LUNA_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 384399 / 149597870.7, // 384,399 km converted to AU (J2000)
    eccentricity: 0.0549, // J2000 epoch value
    inclinationDeg: 5.145, // To ecliptic (J2000)
    longitudeOfAscendingNodeDeg: 125.08, // J2000 epoch value - regressing by one revolution in 18.61 years
    argumentOfPeriapsisDeg: 318.15, // J2000 epoch value - progressing by one revolution in 8.85 years
    meanAnomalyDeg: 115.36, // J2000 epoch value
    period_s: 2.36059e6, // 27.321661 days - verified correct (sidereal)
    siderealRotationPeriod_s: 2.36059e6, // Synchronous rotation
    axialTiltDeg: 6.687, // To orbit plane (J2000)
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.MOON,
    isMoon: true,
    classType: PlanetType.ROCKY,
    composition: ["silicates", "anorthosite crust", "possible small core"],
    surface: {
      roughness: 0.75,
      persistence: 0.5,
      lacunarity: 2.1,
      simplePeriod: 6.0,
      octaves: 7,
      bumpScale: 0.15,
      color1: "#808080",
      color2: "#A9A9A9",
      color3: "#BEBEBE",
      color4: "#D3D3D3",
      color5: "#E0E0E0",
      height1: 0.0,
      height2: 0.3,
      height3: 0.55,
      height4: 0.75,
      height5: 1.0,
      shininess: 0.02,
      specularStrength: 0.02,
      ambientLightIntensity: 0.01, // Minimal ambient for dark space
      undulation: 0.1,
      terrainType: 3,
      terrainAmplitude: 0.35,
      terrainSharpness: 0.7,
      terrainOffset: 0.0,
    },
  },
};
