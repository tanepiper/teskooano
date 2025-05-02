import { DEG_TO_RAD } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type RockyTerrestrialSurfaceProperties,
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
  actions.addCelestial({
    id: "mercury",
    name: "Mercury",
    seed: "mercury",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: MERCURY_MASS_KG,
    realRadius_m: MERCURY_RADIUS_M,
    visualScaleRadius: 0.38,
    temperature: MERCURY_TEMP_K,
    albedo: MERCURY_ALBEDO,
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
      composition: ["O2", "Na", "H2", "He"],
      pressure: 1e-14,
      color: "#E0E0E0",
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: "#9E9E9E",
      roughness: 0.8,

      color1: "#9E9E9E",
      color2: "#757575",
      color3: "#BDBDBD",
      color4: "#616161",
      color5: "#E0E0E0",
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.1,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ["silicates", "iron core"],
    },
  });
}
