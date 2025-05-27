import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
} from "@teskooano/data-types";

const MERCURY_MASS_KG = 3.3011e23;
const MERCURY_RADIUS_M = 2439700;
const MERCURY_TEMP_K = 440;
const MERCURY_ALBEDO = 0.088;
const MERCURY_SMA_AU = 0.38709;
const MERCURY_ECC = 0.20563;
const MERCURY_INC_DEG = 7.005;
const MERCURY_LAN_DEG = 48.331;
const MERCURY_AOP_DEG = 29.124 + MERCURY_LAN_DEG;
const MERCURY_MA_DEG = 174.796;
const MERCURY_ORBITAL_PERIOD_S = 7.60047e6;
const MERCURY_SIDEREAL_ROTATION_PERIOD_S = 5.067e6;
const MERCURY_AXIAL_TILT_DEG = 0.034;

/**
 * Initializes Mercury using accurate data.
 */
export function initializeMercury(parentId: string): void {
  const mercuryId = "mercury";
  const mercuryAxialTiltRad = MERCURY_AXIAL_TILT_DEG * DEG_TO_RAD;

  // Mercury procedural surface data (heavily cratered, airless world)
  const mercuryProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.48,
    lacunarity: 2.0,
    simplePeriod: 4.0,
    octaves: 8,
    bumpScale: 0.25,
    color1: "#696063", // Dark crater floors
    color2: "#81787C", // Crater walls
    color3: "#968F93", // Mid-elevation plains
    color4: "#A6A1A5", // Highland regions
    color5: "#B2AFB0", // Bright crater rims
    height1: 0.0,
    height2: 0.3,
    height3: 0.55,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.04,
    specularStrength: 0.05,
    roughness: 0.8,
    ambientLightIntensity: 0.2,
    undulation: 0.1,
    terrainType: 1,
    terrainAmplitude: 0.25,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

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
    siderealRotationPeriod_s: MERCURY_SIDEREAL_ROTATION_PERIOD_S,
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
      argumentOfPeriapsis: (MERCURY_AOP_DEG - MERCURY_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: MERCURY_MA_DEG * DEG_TO_RAD,
      period_s: MERCURY_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.ROCKY,
      isMoon: false,
      composition: ["silicates", "iron core"],
      atmosphere: undefined,
      surface: {
        ...mercuryProceduralSurface,
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ROCKY,
        color: "#8A7F80",
      },
    } as PlanetProperties,
  });
}
