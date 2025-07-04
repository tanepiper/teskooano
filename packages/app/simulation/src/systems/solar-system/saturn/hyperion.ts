import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const HYPERION_MASS_KG = 5.58e18;
const HYPERION_RADIUS_M = 135000;
const HYPERION_SMA_M = 1481109 * KM;
const HYPERION_ECC = 0.123;
const HYPERION_INC_DEG = 0.648;
const HYPERION_LAN_DEG = 161.4;
const HYPERION_AOP_DEG = 156.4;
const HYPERION_MA_DEG = 199.3;
const HYPERION_SIDEREAL_PERIOD_S = 1838531;
const HYPERION_ALBEDO = 0.3;

/**
 * Initializes Hyperion, a moon of Saturn known for its irregular shape and chaotic rotation.
 */
export function initializeHyperion(parentId: string): void {
  // Hyperion's rotation is chaotic, so axial tilt is not constant.
  // We use a default value for simulation purposes.
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "hyperion",
    name: "Hyperion",
    seed: "hyperion",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: HYPERION_MASS_KG,
    realRadius_m: HYPERION_RADIUS_M,
    temperature: 94,
    albedo: HYPERION_ALBEDO,
    // Its rotation is chaotic. For simplicity, we use its orbital period.
    siderealRotationPeriod_s: HYPERION_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: HYPERION_SMA_M,
      eccentricity: HYPERION_ECC,
      inclination: HYPERION_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: HYPERION_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: HYPERION_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: HYPERION_MA_DEG * DEG_TO_RAD,
      period_s: HYPERION_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "rocky material"],
      atmosphere: {
        glowColor: "#FFFFFF",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        color: "#BDB7AB",
        roughness: 0.9,
        classType: PlanetType.ICE,
        persistence: 0.45,
        lacunarity: 2.5,
        simplePeriod: 1.5,
        octaves: 10,
        bumpScale: 5.0,
        color1: "#A9A190",
        color2: "#BDB7AB",
        color3: "#D1CDC1",
        color4: "#E0E0E0",
        color5: "#F0F0F0",
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.9,
        shininess: 20,
        specularStrength: 0.3,
        ambientLightIntensity: 0.35,
        undulation: 0.4,
        terrainType: 1,
        terrainAmplitude: 0.9,
        terrainSharpness: 2.0,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });
}
