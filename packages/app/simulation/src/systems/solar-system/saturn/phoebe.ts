import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const PHOEBE_MASS_KG = 8.28e18;
const PHOEBE_RADIUS_M = 106500;
const PHOEBE_SMA_M = 12947780 * KM;
const PHOEBE_ECC = 0.158;
const PHOEBE_INC_DEG = 173.04; // Retrograde orbit
const PHOEBE_LAN_DEG = 229.3;
const PHOEBE_AOP_DEG = 102.7;
const PHOEBE_MA_DEG = 308.2;
const PHOEBE_ORBITAL_PERIOD_S = -47369347; // Retrograde
const PHOEBE_ROTATION_PERIOD_S = 33419;
const PHOEBE_ALBEDO = 0.081;

/**
 * Initializes Phoebe, a dark, retrograde moon of Saturn, likely a captured object.
 */
export function initializePhoebe(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "phoebe",
    name: "Phoebe",
    seed: "phoebe",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: PHOEBE_MASS_KG,
    realRadius_m: PHOEBE_RADIUS_M,
    temperature: 75,
    albedo: PHOEBE_ALBEDO,
    siderealRotationPeriod_s: PHOEBE_ROTATION_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: PHOEBE_SMA_M,
      eccentricity: PHOEBE_ECC,
      inclination: PHOEBE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PHOEBE_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: PHOEBE_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: PHOEBE_MA_DEG * DEG_TO_RAD,
      period_s: PHOEBE_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "rock", "carbonaceous material"],
      atmosphere: {
        glowColor: "#FFFFFF",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.VARIED,
        color: "#504030",
        roughness: 0.8,
        classType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.2,
        simplePeriod: 1.9,
        octaves: 9,
        bumpScale: 3.0,
        color1: "#100804",
        color2: "#302010",
        color3: "#504030",
        color4: "#605040",
        color5: "#706050",
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.9,
        shininess: 10,
        specularStrength: 0.2,
        ambientLightIntensity: 0.3,
        undulation: 0.3,
        terrainType: 2,
        terrainAmplitude: 0.7,
        terrainSharpness: 1.5,
        terrainOffset: -0.1,
      },
    } as PlanetProperties,
  });
}
