import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
  CompositionType,
} from "@teskooano/data-types";

const LUNA_MASS_KG = 7.342e22;
const LUNA_RADIUS_M = 1737400;
const LUNA_SMA_M = 384399000;
const LUNA_ECC = 0.0549;
const LUNA_INC_DEG = 5.145;
const LUNA_LAN_DEG = 125.08;
const LUNA_AOP_DEG = 318.15;
const LUNA_MA_DEG = 115.36;
const LUNA_SIDEREAL_PERIOD_S = 2.36059e6;
const LUNA_AXIAL_TILT_DEG = 6.687;
const LUNA_ALBEDO = 0.136;

/**
 * Initializes Earth's moon (Luna).
 */
export function initializeEarthMoons(parentId: string): void {
  const lunaProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.5,
    lacunarity: 2.1,
    simplePeriod: 6.0,
    octaves: 7,
    bumpScale: 0.15,
    color1: "#808080",
    color2: "#A9A9A9",
    color3: "#BEBEBE",
    color4: "#D3D3D3",
    color5: "#E0E0E0",
    height1: 0.0,
    height2: 0.3,
    height3: 0.55,
    height4: 0.75,
    height5: 1.0,
    shininess: 0.02,
    specularStrength: 0.02,
    roughness: 0.75,
    ambientLightIntensity: 0.05,
    undulation: 0.1,
    terrainType: 1,
    terrainAmplitude: 0.35,
    terrainSharpness: 0.7,
    terrainOffset: 0.0,
  };

  const lunaAxialTiltRad = LUNA_AXIAL_TILT_DEG * DEG_TO_RAD;
  actions.addCelestial({
    id: "luna",
    name: "Moon",
    type: CelestialType.MOON,
    seed: "luna",
    parentId: parentId,
    realMass_kg: LUNA_MASS_KG,
    realRadius_m: LUNA_RADIUS_M,
    temperature: 250, // Simplified temperature for Luna
    albedo: LUNA_ALBEDO,
    siderealRotationPeriod_s: LUNA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(lunaAxialTiltRad),
      Math.sin(lunaAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: LUNA_SMA_M,
      eccentricity: LUNA_ECC,
      inclination: LUNA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: LUNA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: LUNA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: LUNA_MA_DEG * DEG_TO_RAD,
      period_s: LUNA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["silicates", "anorthosite crust", "possible small core"],
      atmosphere: undefined,
      surface: {
        ...lunaProceduralSurface,
        type: SurfaceType.VARIED, // Changed from CRATERED to VARIED for more nuance
        surfaceType: SurfaceType.VARIED,
        composition: [CompositionType.SILICATE],
        planetType: PlanetType.ROCKY,
        color: "#BEBEBE",
      },
    } as PlanetProperties,
  });
}
