import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type RockyTerrestrialSurfaceProperties,
  type PlanetAtmosphereProperties,
} from "@teskooano/data-types";

const MERCURY_MASS_KG = 3.3011e23;
const MERCURY_RADIUS_M = 2439700;
const MERCURY_TEMP_K = 340;
const MERCURY_ALBEDO = 0.142;
const MERCURY_SMA_AU = 0.387098;
const MERCURY_ECC = 0.20563;
const MERCURY_INC_DEG = 7.00487;
const MERCURY_LAN_DEG = 48.33167;
const MERCURY_AOP_DEG = 77.45645;
const MERCURY_MA_DEG = 252.25084;
const MERCURY_SIDEREAL_PERIOD_S = 7.60053e6;
const MERCURY_AXIAL_TILT_DEG = 0.034;

/**
 * Initializes Mercury using accurate data.
 */
export function initializeMercury(parentId: string): void {
  const mercuryAxialTiltRad = MERCURY_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: "mercury",
    name: "Mercury",
    seed: "mercury",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: MERCURY_MASS_KG,
    realRadius_m: MERCURY_RADIUS_M,
    temperature: MERCURY_TEMP_K,
    albedo: MERCURY_ALBEDO,
    siderealRotationPeriod_s: MERCURY_SIDEREAL_PERIOD_S,
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
      period_s: MERCURY_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      glowColor: "#E0E0E033",
      intensity: 0.05,
      power: 1.0,
      thickness: 0.02,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: "#9E9E9E",
      roughness: 0.8,

      persistence: 0.45,
      lacunarity: 2.2,
      simplePeriod: 8.0,
      octaves: 6,
      bumpScale: 0.1,
      color1: "#9E9E9E",
      color2: "#757575",
      color3: "#888888",
      color4: "#A0A0A0",
      color5: "#BDBDBD",
      height1: 0.0,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 1.0,
      shininess: 0.05,
      specularStrength: 0.05,
      ambientLightIntensity: 0.1,
      undulation: 0.2,
      terrainType: 1,
      terrainAmplitude: 0.4,
      terrainSharpness: 0.6,
      terrainOffset: 0.0,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.ROCKY,
      isMoon: false,
      composition: ["silicates", "iron core"],
    },
  });
}
