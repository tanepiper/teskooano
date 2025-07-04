import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const MIMAS_MASS_KG = 3.75e19;
const MIMAS_RADIUS_M = 198200;
const MIMAS_SMA_M = 185539 * KM;
const MIMAS_ECC = 0.0196;
const MIMAS_INC_DEG = 1.566;
const MIMAS_LAN_DEG = 123.5;
const MIMAS_AOP_DEG = 312.4;
const MIMAS_MA_DEG = 159.2;
const MIMAS_SIDEREAL_PERIOD_S = 81443;
const MIMAS_ALBEDO = 0.962;

/**
 * Initializes Mimas, Saturn's "Death Star" moon due to its large crater, Herschel.
 */
export function initializeMimas(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "mimas",
    name: "Mimas",
    seed: "mimas",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: MIMAS_MASS_KG,
    realRadius_m: MIMAS_RADIUS_M,
    temperature: 63,
    albedo: MIMAS_ALBEDO,
    siderealRotationPeriod_s: MIMAS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: MIMAS_SMA_M,
      eccentricity: MIMAS_ECC,
      inclination: MIMAS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MIMAS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MIMAS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MIMAS_MA_DEG * DEG_TO_RAD,
      period_s: MIMAS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "rocky core"],
      atmosphere: {
        glowColor: "#FFFFFF",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        color: "#E0E0E0",
        roughness: 0.8,
        planetType: PlanetType.BARREN,
        persistence: 0.6,
        lacunarity: 2.1,
        simplePeriod: 2.0,
        octaves: 8,
        bumpScale: 3.5,
        color1: "#B0B0B0",
        color2: "#D0D0D0",
        color3: "#E0E0E0",
        color4: "#F0F0F0",
        color5: "#FFFFFF",
        height1: 0.1,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 35,
        specularStrength: 0.7,
        ambientLightIntensity: 0.4,
        undulation: 0.22,
        terrainType: 1, // Cratered terrain
        terrainAmplitude: 0.8,
        terrainSharpness: 1.8,
        terrainOffset: 0.2,
      },
    } as PlanetProperties,
  });
}
