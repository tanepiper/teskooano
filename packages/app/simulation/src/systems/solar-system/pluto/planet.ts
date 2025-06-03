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

const PLUTO_MASS_KG = 1.303e22;
const PLUTO_RADIUS_M = 1188300;
const PLUTO_TEMP_K = 44;
const PLUTO_ALBEDO = 0.58;
const PLUTO_SMA_AU = 39.482;
const PLUTO_ECC = 0.2488;
const PLUTO_INC_DEG = 17.16;
const PLUTO_LAN_DEG = 110.3;
const PLUTO_AOP_DEG = 224.07;
const PLUTO_MA_DEG = 238.93;
const PLUTO_ORBITAL_PERIOD_S = 7.824e9;
const PLUTO_SIDEREAL_ROTATION_PERIOD_S = -551855.0;
const PLUTO_AXIAL_TILT_DEG = 119.59;

export function initializePlutoPlanet(parentId: string): string {
  const plutoId = "pluto";
  const plutoAxialTiltRad = PLUTO_AXIAL_TILT_DEG * DEG_TO_RAD;

  // Pluto procedural surface data (varied nitrogen and water ice)
  const plutoProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#606070", // Dark areas
    color2: "#808090", // Medium areas
    color3: "#B0B0C0", // Light areas
    color4: "#D0D0E0", // Bright nitrogen ice
    color5: "#F0F0F8", // Brilliant white ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.2,
    specularStrength: 0.1,
    roughness: 0.4,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: plutoId,
    name: "Pluto",
    seed: "pluto",
    type: CelestialType.DWARF_PLANET,
    parentId: parentId,
    realMass_kg: PLUTO_MASS_KG,
    realRadius_m: PLUTO_RADIUS_M,
    temperature: PLUTO_TEMP_K,
    albedo: PLUTO_ALBEDO,
    siderealRotationPeriod_s: PLUTO_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(plutoAxialTiltRad),
      Math.sin(plutoAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: PLUTO_SMA_AU * AU,
      eccentricity: PLUTO_ECC,
      inclination: PLUTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PLUTO_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (PLUTO_AOP_DEG - PLUTO_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: PLUTO_MA_DEG * DEG_TO_RAD,
      period_s: PLUTO_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.DWARF_PLANET,
      planetType: PlanetType.ICE_WORLD,
      isMoon: false,
      composition: [
        "nitrogen ice",
        "water ice crust",
        "methane ice",
        "carbon monoxide ice",
        "rocky core",
        "tholins",
      ],
      atmosphere: undefined,
      surface: {
        ...plutoProceduralSurface,
        type: SurfaceType.VARIED,
        surfaceType: SurfaceType.VARIED,

        planetType: PlanetType.ICE_WORLD,
        color: "#F5E8D1",
      },
    } as PlanetProperties,
  });
  return plutoId;
}
