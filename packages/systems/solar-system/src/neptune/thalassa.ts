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

const THALASSA_MASS_KG = 4e17; // Estimate similar to Naiad
const THALASSA_RADIUS_M = 40000; // 40 km
const THALASSA_SMA_M = 50074 * KM;
const THALASSA_ECC = 0.0002;
const THALASSA_INC_DEG = 0.21;
const THALASSA_SIDEREAL_PERIOD_S = 7.5 * 3600;
const THALASSA_ALBEDO = 0.07;

/**
 * Initializes Thalassa, Neptune's second innermost moon.
 */
export function initializeThalassa(parentId: string): void {
  const tilt = new OSVector3(0, 1, 0).normalize();
  celestialManager.addCelestial({
    id: "thalassa",
    name: "Thalassa",
    seed: "thalassa",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: THALASSA_MASS_KG,
    realRadius_m: THALASSA_RADIUS_M,
    temperature: 60,
    albedo: THALASSA_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: THALASSA_SMA_M,
      eccentricity: THALASSA_ECC,
      inclination: THALASSA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: THALASSA_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: THALASSA_SIDEREAL_PERIOD_S,
      axialTilt: tilt,
    },

    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      composition: ["water ice", "rock"],
      surface: {
        type: SurfaceType.CRATERED,
        color: "#888888",
        roughness: 0.8,
        classType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 3.0,
        octaves: 6,
        bumpScale: 0.6,
        color1: "#666666",
        color2: "#7A7A7A",
        color3: "#888888",
        color4: "#A0A0A0",
        color5: "#B8B8B8",
        height1: 0.05,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 4,
        specularStrength: 0.05,
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
