import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  AtmosphereType,
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
} from "@teskooano/data-types";

const MARS_MASS_KG = 6.4171e23;
const MARS_RADIUS_M = 3389500;
const MARS_TEMP_K = 210;
const MARS_ALBEDO = 0.17;
const MARS_SMA_AU = 1.52368;
const MARS_ECC = 0.0935;
const MARS_INC_DEG = 1.85;
const MARS_LAN_DEG = 49.562;
const MARS_AOP_DEG = 336.041 - MARS_LAN_DEG;
const MARS_MA_DEG = 355.453;
const MARS_ORBITAL_PERIOD_S = 5.9354e7;
const MARS_SIDEREAL_ROTATION_PERIOD_S = 88642.66;
const MARS_AXIAL_TILT_DEG = 25.19;

/**
 * Initializes Mars planet data.
 */
export function initializeMarsPlanet(parentId: string): string {
  const marsId = "mars";
  const marsAxialTiltRad = MARS_AXIAL_TILT_DEG * DEG_TO_RAD;

  const marsProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.5,
    lacunarity: 2.5,
    simplePeriod: 5.0,
    octaves: 6,
    bumpScale: 0.2,
    color1: "#7F2929",
    color2: "#BC5A4D",
    color3: "#CD7F32",
    color4: "#E5AA70",
    color5: "#F5DEB3",
    height1: 0.0,
    height2: 0.3,
    height3: 0.6,
    height4: 0.8,
    height5: 0.95,
    shininess: 0.05,
    specularStrength: 0.08,
    roughness: 0.7,
    ambientLightIntensity: 0.1,
    undulation: 0.15,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.65,
    terrainOffset: 0.05,
  };

  actions.addCelestial({
    id: marsId,
    name: "Mars",
    seed: "mars",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: MARS_MASS_KG,
    realRadius_m: MARS_RADIUS_M,
    temperature: MARS_TEMP_K,
    albedo: MARS_ALBEDO,
    siderealRotationPeriod_s: MARS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(marsAxialTiltRad),
      Math.sin(marsAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: MARS_SMA_AU * AU,
      eccentricity: MARS_ECC,
      inclination: MARS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MARS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MARS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MARS_MA_DEG * DEG_TO_RAD,
      period_s: MARS_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.TERRESTRIAL,
      isMoon: false,
      composition: ["basaltic rock", "iron oxide dust"],
      atmosphere: {
        type: AtmosphereType.THIN,
        composition: ["carbon dioxide", "nitrogen", "argon"],
        pressure_pa: 610,
        density_kgm3: 0.02,
        scaleHeight_m: 11100,
        glowColor: "#FF4500",
        intensity: 0.2,
        power: 1.0,
        thickness: 0.1,
      },
      surface: {
        surfaceType: SurfaceType.VARIED,
        proceduralData: {
          ...marsProceduralSurface,
          planetType: PlanetType.TERRESTRIAL,
        },
      },
    } as PlanetProperties,
  });
  return marsId;
}
