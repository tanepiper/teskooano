import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { celestial } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const TRITON_SMA_M = 354759 * KM;
const TRITON_SIDEREAL_ROTATION_PERIOD_S = -5.877 * 24 * 3600;

/**
 * Initializes Triton.
 * @param parentId The ID of the parent object (Neptune).
 */
export function initializeTriton(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0).normalize();

  celestial.addCelestial({
    id: "triton",
    name: "Triton",
    seed: "triton_seed_5877",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: 2.139e22,
    realRadius_m: 1353.4 * KM,
    orbit: {
      realSemiMajorAxis_m: TRITON_SMA_M,
      eccentricity: 0.000016,
      inclination: 156.885 * DEG_TO_RAD,
      longitudeOfAscendingNode: 249.7 * DEG_TO_RAD,
      argumentOfPeriapsis: 275.1 * DEG_TO_RAD,
      meanAnomaly: 296.6 * DEG_TO_RAD,
      siderealRotationPeriod_s: TRITON_SIDEREAL_ROTATION_PERIOD_S,
      axialTilt: defaultMoonAxialTilt,
      period_s: Math.abs(TRITON_SIDEREAL_ROTATION_PERIOD_S),
    },
    temperature: 38,

    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      composition: ["nitrogen ice", "water ice", "methane ice", "rocky core"],
      surface: {
        type: SurfaceType.VARIED,
        color: "#E0F0F0",
        roughness: 0.5,
        classType: PlanetType.BARREN,
        persistence: 0.53,
        lacunarity: 2.14,
        simplePeriod: 0.87,
        octaves: 8,
        bumpScale: 10,
        color1: "#B0C0D0",
        color2: "#D0E0F0",
        color3: "#E0F0F0",
        color4: "#F0F8FF",
        color5: "#FFFFFF",
        height1: 0.088,
        height2: 0.41,
        height3: 0.4,
        height4: 0.43,
        height5: 0.43,
        shininess: 23,
        specularStrength: 0.47,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.1,
        terrainType: 3,
        terrainAmplitude: 0.2,
        terrainSharpness: 1.3,
        terrainOffset: 0.25,
      },
    } as PlanetProperties,
  });
}
