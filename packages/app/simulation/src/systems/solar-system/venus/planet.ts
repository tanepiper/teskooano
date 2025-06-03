import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
} from "@teskooano/data-types";

const VENUS_MASS_KG = 4.867e24;
const VENUS_RADIUS_M = 6051800;
const VENUS_TEMP_K = 737;
const VENUS_ALBEDO = 0.77;
const VENUS_SMA_AU = 0.72333;
const VENUS_ECC = 0.0068;
const VENUS_INC_DEG = 3.395;
const VENUS_LAN_DEG = 76.68;
const VENUS_AOP_DEG = 54.85 + VENUS_LAN_DEG;
const VENUS_MA_DEG = 50.44;
const VENUS_ORBITAL_PERIOD_S = 1.9402e7;
const VENUS_SIDEREAL_ROTATION_PERIOD_S = -5.8164e6; // Note: Retrograde rotation
const VENUS_AXIAL_TILT_DEG = 177.36;

/**
 * Initializes Venus planet data.
 */
export function initializeVenusPlanet(parentId: string): void {
  const venusId = "venus";
  const venusAxialTiltRad = VENUS_AXIAL_TILT_DEG * DEG_TO_RAD;

  const venusProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.5,
    lacunarity: 2.2,
    simplePeriod: 5.0,
    octaves: 6,
    bumpScale: 0.3,
    color1: "#8B4513",
    color2: "#A0522D",
    color3: "#CD853F",
    color4: "#DEB887",
    color5: "#F5DEB3",
    height1: 0.0,
    height2: 0.3,
    height3: 0.55,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.06,
    specularStrength: 0.08,
    roughness: 0.8,
    ambientLightIntensity: 0.25,
    undulation: 0.2,
    terrainType: 2,
    terrainAmplitude: 0.4,
    terrainSharpness: 0.7,
    terrainOffset: 0.05,
  };

  actions.addCelestial({
    id: venusId,
    name: "Venus",
    seed: "venus",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: VENUS_MASS_KG,
    realRadius_m: VENUS_RADIUS_M,
    temperature: VENUS_TEMP_K,
    albedo: VENUS_ALBEDO,
    siderealRotationPeriod_s: VENUS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(venusAxialTiltRad),
      Math.sin(venusAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: VENUS_SMA_AU * AU,
      eccentricity: VENUS_ECC,
      inclination: VENUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: VENUS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (VENUS_AOP_DEG - VENUS_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: VENUS_MA_DEG * DEG_TO_RAD,
      period_s: VENUS_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.TERRESTRIAL,
      isMoon: false,
      composition: [
        "silicates",
        "iron core",
        "carbon dioxide atmosphere",
        "sulfuric acid clouds",
      ],
      atmosphere: {
        glowColor: "#FFCC80",
        intensity: 1.8,
        power: 1.1,
        thickness: 0.3,
      },
      surface: {
        ...venusProceduralSurface,
        type: SurfaceType.VOLCANIC,
        surfaceType: SurfaceType.VOLCANIC,
        planetType: PlanetType.TERRESTRIAL,
        color: "#D2B48C",
      },
    } as PlanetProperties,
  });
}
