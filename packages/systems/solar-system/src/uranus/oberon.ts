import {
  createOrbitalElements,
  J2000_EPOCH,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";
import { SolarSystemBodies } from "../shared/const";

const OBERON_REAL_RADIUS_KM = 761.4;

/**
 * Oberon configuration object for modular solar system initialization.
 */
export const oberon: CelestialObject<PlanetProperties> = {
  id: "oberon",
  name: "Oberon",
  seed: "oberon_seed_1346",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: SolarSystemBodies.URANUS, // Will be replaced during initialization
  realMass_kg: 3.014e21,
  realRadius_m: kmToM(OBERON_REAL_RADIUS_KM),
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00390017,
    eccentricity: 0.0014,
    inclinationDeg: 0.058,
    longitudeOfAscendingNodeDeg: 169.5,
    argumentOfPeriapsisDeg: 218.8,
    meanAnomalyDeg: 108.6,
    period_s: 1.162e6,
    siderealRotationPeriod_s: 1.162e6, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
    epoch: J2000_EPOCH,
  }),
  temperature: 75,
  albedo: 0.35,
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rock", "dark carbonaceous material"],
    surface: {
      roughness: 0.8,
      persistence: 0.55,
      lacunarity: 2.2,
      simplePeriod: 2.8,
      octaves: 10,
      bumpScale: 3.0,
      color1: "#603838", // Dark carbonaceous
      color2: "#808080", // Medium gray
      color3: "#9898A0", // Oberon's gray
      color4: "#B0B0B8", // Lighter areas
      color5: "#C8C8D0", // Brightest spots
      height1: 0.08,
      height2: 0.25,
      height3: 0.45,
      height4: 0.7,
      height5: 0.9,
      shininess: 10,
      specularStrength: 0.1,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.3,
      terrainType: 2,
      terrainAmplitude: 0.9,
      terrainSharpness: 1.6,
      terrainOffset: -0.1,
    },
  },
};
