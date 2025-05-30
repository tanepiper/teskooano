import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
  CompositionType,
} from "@teskooano/data-types";

const EARTH_MASS_KG = 5.97237e24;
const EARTH_RADIUS_M = 6371000;
const EARTH_TEMP_K = 288;
const EARTH_ALBEDO = 0.306;
const EARTH_SMA_AU = 1.0;
const EARTH_ECC = 0.01671;
const EARTH_INC_DEG = 0.00005;
const EARTH_LAN_DEG = -11.26064;
const EARTH_AOP_DEG = 102.94719;
const EARTH_MA_DEG = 100.46435;
const EARTH_ORBITAL_PERIOD_S = 3.15581e7;
const EARTH_SIDEREAL_ROTATION_PERIOD_S = 86164.1;
const EARTH_AXIAL_TILT_DEG = 23.43928;

/**
 * Initializes Earth planet data.
 */
export function initializeEarthPlanet(parentId: string): string {
  const earthId = "earth";
  const earthAxialTiltRad = EARTH_AXIAL_TILT_DEG * DEG_TO_RAD;

  const earthProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.59,
    lacunarity: 2.0,
    simplePeriod: 5.2,
    octaves: 8,
    bumpScale: 0.1,
    color1: "#003B8F",
    color2: "#1E90FF",
    color3: "#32CD32",
    color4: "#228B22",
    color5: "#FFFFFF",
    height1: 0.06,
    height2: 0.15,
    height3: 0.24,
    height4: 0.27,
    height5: 0.82,
    shininess: 50,
    specularStrength: 0.14,
    roughness: 0.3,
    ambientLightIntensity: 0.15,
    undulation: 0.4,
    terrainType: 2,
    terrainAmplitude: 1.2,
    terrainSharpness: 1.9,
    terrainOffset: -0.4,
  };

  actions.addCelestial({
    id: earthId,
    name: "Earth",
    seed: "earth",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: EARTH_MASS_KG,
    realRadius_m: EARTH_RADIUS_M,
    temperature: EARTH_TEMP_K,
    albedo: EARTH_ALBEDO,
    siderealRotationPeriod_s: EARTH_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(earthAxialTiltRad),
      Math.sin(earthAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: EARTH_SMA_AU * AU,
      eccentricity: EARTH_ECC,
      inclination: EARTH_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: EARTH_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: EARTH_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: EARTH_MA_DEG * DEG_TO_RAD,
      period_s: EARTH_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.TERRESTRIAL,
      isMoon: false,
      composition: [
        "silicates",
        "iron core",
        "liquid water",
        "nitrogen-oxygen atmosphere",
      ],
      atmosphere: {
        glowColor: "#87CEEB",
        intensity: 0.6,
        power: 1.2,
        thickness: 0.25,
      },
      surface: {
        ...earthProceduralSurface,
        type: SurfaceType.VARIED,
        surfaceType: SurfaceType.VARIED,
        composition: [
          CompositionType.SILICATE,
          CompositionType.IRON,
          CompositionType.WATER_ICE,
        ],
        planetType: PlanetType.TERRESTRIAL,
        color: "#1E90FF",
      },
    } as PlanetProperties,
  });
  return earthId;
}
