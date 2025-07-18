import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { celestialManager } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const NAIAD_MASS_KG = 4e17; // Estimate
const NAIAD_RADIUS_M = 33000; // 33 km
const NAIAD_SMA_M = 48224 * KM;
const NAIAD_ECC = 0.0047;
const NAIAD_INC_DEG = 4.75;
const NAIAD_SIDEREAL_PERIOD_S = 7.057 * 3600; // hours to seconds
const NAIAD_ALBEDO = 0.07;

/**
 * Initializes Naiad, Neptune's innermost moon.
 */
export function initializeNaiad(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0).normalize();

  celestialManager.addCelestial({
    id: "naiad",
    name: "Naiad",
    seed: "naiad",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: NAIAD_MASS_KG,
    realRadius_m: NAIAD_RADIUS_M,
    temperature: 60,
    albedo: NAIAD_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: NAIAD_SMA_M,
      eccentricity: NAIAD_ECC,
      inclination: NAIAD_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: NAIAD_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: NAIAD_SIDEREAL_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      composition: ["water ice", "rock"],
      surface: {
        type: SurfaceType.CRATERED,
        color: "#8A8A8A",
        roughness: 0.8,
        classType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 3.0,
        octaves: 6,
        bumpScale: 0.6,
        color1: "#6A6A6A",
        color2: "#8A8A8A",
        color3: "#A0A0A0",
        color4: "#B8B8B8",
        color5: "#D0D0D0",
        height1: 0.05,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 4,
        specularStrength: 0.08,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.2,
        terrainType: 1,
        terrainAmplitude: 0.3,
        terrainSharpness: 1.4,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
