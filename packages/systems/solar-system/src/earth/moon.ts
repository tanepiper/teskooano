import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const LUNA_MASS_KG = 7.342e22; // Verified correct from NASA fact sheet
const LUNA_RADIUS_KM = 1737.4; // Verified correct (mean radius)
const LUNA_ALBEDO = 0.11; // Corrected to Bond albedo from NASA fact sheet

/**
 * Luna (Moon) configuration object for modular solar system initialization.
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
    semiMajorAxisAU: 384399 / 149597870.7, // 384,399 km converted to AU
    eccentricity: 0.0549,
    inclinationDeg: 5.145, // To ecliptic
    longitudeOfAscendingNodeDeg: 125.08, // Current value - variable due to precession
    argumentOfPeriapsisDeg: 318.15, // Current value - variable due to precession
    meanAnomalyDeg: 115.36, // Current value - variable
    period_s: 2.36059e6, // 27.321661 days - verified correct
    siderealRotationPeriod_s: 2.36059e6, // Synchronous rotation
    axialTiltDeg: 6.687, // Verified correct - obliquity to orbit
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
