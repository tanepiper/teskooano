import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const MERCURY_MASS_KG = 3.3011e23;
const MERCURY_RADIUS_M = 2439700;
const MERCURY_TEMP_K = 437; // Blackbody temperature (Wikipedia)
const MERCURY_ALBEDO = 0.142;
const MERCURY_SMA_AU = 0.387098;
const MERCURY_ECC = 0.20563;
const MERCURY_INC_DEG = 7.005;
const MERCURY_LAN_DEG = 48.331;
const MERCURY_AOP_DEG = 29.124; // Argument of perihelion (corrected from Wikipedia)
const MERCURY_MA_DEG = 174.796; // Mean anomaly (corrected from Wikipedia)
const MERCURY_ORBITAL_PERIOD_S = 7.599154e6; // 87.9691 Earth days (sidereal year)
const MERCURY_ROTATION_PERIOD_S = 5.067014e6; // 58.646 Earth days (sidereal day)
const MERCURY_AXIAL_TILT_DEG = 0.034;

/**
 * Initializes Mercury using accurate data.
 */
export function initializeMercury(parentId: string): void {
  const mercuryId = "mercury";
  const mercuryAxialTiltRad = MERCURY_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: mercuryId,
    name: "Mercury",
    seed: "mercury",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: MERCURY_MASS_KG,
    realRadius_m: MERCURY_RADIUS_M,
    temperature: MERCURY_TEMP_K,
    albedo: MERCURY_ALBEDO,
    siderealRotationPeriod_s: MERCURY_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(mercuryAxialTiltRad),
      Math.sin(mercuryAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: MERCURY_SMA_AU * AU,
      eccentricity: MERCURY_ECC,
      inclination: MERCURY_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MERCURY_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MERCURY_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MERCURY_MA_DEG * DEG_TO_RAD,
      period_s: MERCURY_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.PLANET,
      classType: PlanetType.BARREN,
      isMoon: false,
      composition: ["iron core", "silicate mantle", "thin exosphere"],
      surface: {
        // Base surface properties
        type: SurfaceType.CRATERED,
        color: "#8C7853", // Brownish-gray
        roughness: 0.85,
        classType: PlanetType.BARREN,
        // Mercury-like barren procedural properties
        persistence: 0.5,
        lacunarity: 2.2,
        simplePeriod: 2.0,
        octaves: 10,
        bumpScale: 2.5,
        color1: "#6D6D6D", // Darker gray base
        color2: "#c0b6a2", // Brownish-gray (Mercury-like)
        color3: "#A9A9A9", // Light gray
        color4: "#dfd3c3", // Tan highlights
        color5: "#E1E1E1", // Brightest peaks
        height1: 0.08,
        height2: 0.18,
        height3: 0.35,
        height4: 0.68,
        height5: 0.92,
        shininess: 16,
        specularStrength: 0.45,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.15,
        terrainType: 2,
        terrainAmplitude: 0.7,
        terrainSharpness: 1.6,
        terrainOffset: -0.1,
      },
    } as PlanetProperties,
  });
}
