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
  type PlanetProperties,
} from "@teskooano/data-types";

const MARS_MASS_KG = 6.4171e23;
const MARS_RADIUS_KM = 3389.5; // Mean radius
const MARS_TEMP_K = 209; // Blackbody temperature
const MARS_ALBEDO = 0.25; // Bond albedo

/**
 * Mars configuration object for modular solar system initialization.
 */
export const mars: CelestialObject<PlanetProperties> = {
  id: "mars",
  name: "Mars",
  seed: "mars",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: MARS_MASS_KG,
  realRadius_m: kmToM(MARS_RADIUS_KM),
  temperature: MARS_TEMP_K,
  albedo: MARS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 1.52368055, // Mars's semi-major axis
    eccentricity: 0.0934,
    inclinationDeg: 1.85,
    longitudeOfAscendingNodeDeg: 49.57854,
    argumentOfPeriapsisDeg: 286.5,
    meanAnomalyDeg: 19.412,
    period_s: 5.935e7, // 686.98 Earth days
    siderealRotationPeriod_s: 8.864e4, // 24.6229 hours
    axialTiltDeg: 25.19,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.TERRESTRIAL,
    isMoon: false,
    composition: [
      "silicates",
      "iron oxide",
      "thin CO2 atmosphere",
      "water ice caps",
    ],
    atmosphere: {
      glowColor: "#FF6B35",
      intensity: 0.3,
      power: 1.5,
      thickness: 0.15,
    },
    surface: {
      roughness: 0.8,
      persistence: 0.65,
      lacunarity: 2.1,
      simplePeriod: 3.2,
      octaves: 9,
      bumpScale: 2.8,
      color1: "#8B0000",
      color2: "#CD5C5C",
      color3: "#DC143C",
      color4: "#FF6347",
      color5: "#FFA07A",
      height1: 0.1,
      height2: 0.25,
      height3: 0.45,
      height4: 0.7,
      height5: 0.9,
      shininess: 10,
      specularStrength: 0.25,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.6,
      terrainType: 3,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.4,
      terrainOffset: 0.1,
    },
  },
};
