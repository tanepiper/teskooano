import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type PlanetAtmosphereProperties,
} from "@teskooano/data-types";

const VENUS_MASS_KG = 4.8675e24;
const VENUS_RADIUS_M = 6051800;
const VENUS_TEMP_K = 737;
const VENUS_ALBEDO = 0.76;
const VENUS_SMA_AU = 0.723332;
const VENUS_ECC = 0.006773;
const VENUS_INC_DEG = 3.39471;
const VENUS_LAN_DEG = 76.68069;
const VENUS_AOP_DEG = 131.53298;
const VENUS_MA_DEG = 181.97973;
const VENUS_ORBITAL_PERIOD_S = 1.94142e7;
const VENUS_SIDEREAL_ROTATION_PERIOD_S = -20997151;
const VENUS_AXIAL_TILT_DEG = 177.36;

/**
 * Initializes Venus using accurate data.
 */
export function initializeVenus(parentId: string): void {
  const venusId = "venus";
  const venusAxialTiltRad = VENUS_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: venusId,
    name: "Venus",
    seed: "venus",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: VENUS_MASS_KG,
    realRadius_m: VENUS_RADIUS_M,
    temperature: VENUS_TEMP_K,
    albedo: VENUS_ALBEDO,
    siderealRotationPeriod_s: VENUS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(venusAxialTiltRad),
      Math.sin(venusAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: VENUS_SMA_AU * AU,
      eccentricity: VENUS_ECC,
      inclination: VENUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: VENUS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: VENUS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: VENUS_MA_DEG * DEG_TO_RAD,
      period_s: VENUS_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.ROCKY,
      isMoon: false,
      composition: [
        "silicates",
        "sulfur compounds",
        "dense CO2 atmosphere",
        "sulfuric acid clouds",
      ],
      atmosphere: {
        glowColor: "#FFFF99",
        intensity: 1.2,
        power: 1.8,
        thickness: 0.9,
      },
      surface: {
        // Base surface properties
        type: SurfaceType.VOLCANIC,
        color: "#DAA520", // Goldenrod base (sulfurous)
        roughness: 0.7,
        planetType: PlanetType.ROCKY,
        // Venus-like sulfurous/volcanic procedural properties
        persistence: 0.55,
        lacunarity: 2.0,
        simplePeriod: 1.8,
        octaves: 8,
        bumpScale: 2.2,
        color1: "#B8860B", // Dark goldenrod (sulfur deposits)
        color2: "#DAA520", // Goldenrod (sulfurous rock)
        color3: "#FFFF00", // Yellow (pure sulfur areas)
        color4: "#ADFF2F", // Green yellow (sulfur compounds)
        color5: "#F0E68C", // Khaki (sulfuric weathering)
        height1: 0.1,
        height2: 0.25,
        height3: 0.45,
        height4: 0.7,
        height5: 0.9,
        shininess: 14,
        specularStrength: 0.25,
        ambientLightIntensity: 0.35,
        undulation: 0.3,
        terrainType: 2,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.1,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });
}
