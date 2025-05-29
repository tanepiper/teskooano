import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
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

const PHOBOS_MASS_KG = 1.072e16;
const PHOBOS_RADIUS_M = 11100;
const PHOBOS_SMA_M = 9378 * KM;
const PHOBOS_ECC = 0.0151;
const PHOBOS_INC_DEG = 1.082;
const PHOBOS_SIDEREAL_PERIOD_S = 27554;
const PHOBOS_ALBEDO = 0.071;
const PHOBOS_LAN_DEG = 16.946;
const PHOBOS_AOP_DEG = 157.116;
const PHOBOS_MA_DEG = 290.132;

const DEIMOS_MASS_KG = 1.476e15;
const DEIMOS_RADIUS_M = 6200;
const DEIMOS_SMA_M = 23459 * KM;
const DEIMOS_ECC = 0.0005;
const DEIMOS_INC_DEG = 1.793;
const DEIMOS_SIDEREAL_PERIOD_S = 109123;
const DEIMOS_ALBEDO = 0.0068;
const DEIMOS_LAN_DEG = 47.402;
const DEIMOS_AOP_DEG = 285.131;
const DEIMOS_MA_DEG = 243.577;

/**
 * Initializes Mars and its moons Phobos and Deimos using accurate data.
 */
export function initializeMars(parentId: string): void {
  const marsId = "mars";
  const marsAxialTiltRad = MARS_AXIAL_TILT_DEG * DEG_TO_RAD;
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  // Mars procedural surface data (desert planet)
  const marsProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.5,
    lacunarity: 2.5,
    simplePeriod: 5.0,
    octaves: 6,
    bumpScale: 0.2,
    color1: "#7F2929", // Dark red valleys
    color2: "#BC5A4D", // Red lowlands
    color3: "#CD7F32", // Bronze mid-elevations
    color4: "#E5AA70", // Sandy highlands
    color5: "#F5DEB3", // Light sand peaks
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
      planetType: PlanetType.DESERT,
      isMoon: false,
      composition: [
        "iron oxide",
        "silicates",
        "iron core",
        "thin CO2 atmosphere",
      ],
      atmosphere: {
        glowColor: "#FB8C00",
        intensity: 0.2,
        power: 1.2,
        thickness: 0.15,
      },
      surface: {
        ...marsProceduralSurface,
        type: SurfaceType.VARIED,
        planetType: PlanetType.DESERT,
        color: "#CD5C5C",
      },
    } as PlanetProperties,
  });

  // Phobos procedural surface data
  const phobosProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.0,
    simplePeriod: 3.0,
    octaves: 5,
    bumpScale: 0.35,
    color1: "#3E2723", // Dark brown/black
    color2: "#4E342E", // Dark brown
    color3: "#5D4037", // Medium brown
    color4: "#6D4C41", // Light brown
    color5: "#795548", // Lightest brown
    height1: 0.0,
    height2: 0.25,
    height3: 0.5,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.02,
    specularStrength: 0.01,
    roughness: 0.9,
    ambientLightIntensity: 0.05,
    undulation: 0.2,
    terrainType: 1,
    terrainAmplitude: 0.4,
    terrainSharpness: 0.8,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "phobos",
    name: "Phobos",
    seed: "phobos",
    type: CelestialType.MOON,
    parentId: marsId,
    realMass_kg: PHOBOS_MASS_KG,
    realRadius_m: PHOBOS_RADIUS_M,
    temperature: 200,
    albedo: PHOBOS_ALBEDO,
    siderealRotationPeriod_s: PHOBOS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: PHOBOS_SMA_M,
      eccentricity: PHOBOS_ECC,
      inclination: PHOBOS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PHOBOS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: PHOBOS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: PHOBOS_MA_DEG * DEG_TO_RAD,
      period_s: PHOBOS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: marsId,
      composition: ["carbon-rich silicates", "possibly captured asteroid"],
      atmosphere: {
        glowColor: "#333333",
        intensity: 0.0,
        power: 0.0,
        thickness: 0.0,
      },
      surface: {
        ...phobosProceduralSurface,
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ROCKY,
        color: "#5D4037",
      },
    } as PlanetProperties,
  });

  // Deimos procedural surface data
  const deimosProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.0,
    simplePeriod: 3.0,
    octaves: 5,
    bumpScale: 0.3,
    color1: "#424242", // Dark gray
    color2: "#525252", // Medium dark gray
    color3: "#616161", // Medium gray
    color4: "#757575", // Light gray
    color5: "#9E9E9E", // Lightest gray
    height1: 0.0,
    height2: 0.25,
    height3: 0.5,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.03,
    specularStrength: 0.02,
    roughness: 0.85,
    ambientLightIntensity: 0.05,
    undulation: 0.15,
    terrainType: 1,
    terrainAmplitude: 0.35,
    terrainSharpness: 0.75,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "deimos",
    name: "Deimos",
    seed: "deimos",
    type: CelestialType.MOON,
    parentId: marsId,
    realMass_kg: DEIMOS_MASS_KG,
    realRadius_m: DEIMOS_RADIUS_M,
    temperature: 190,
    albedo: DEIMOS_ALBEDO,
    siderealRotationPeriod_s: DEIMOS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: DEIMOS_SMA_M,
      eccentricity: DEIMOS_ECC,
      inclination: DEIMOS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: DEIMOS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: DEIMOS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: DEIMOS_MA_DEG * DEG_TO_RAD,
      period_s: DEIMOS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: marsId,
      composition: ["carbon-rich silicates", "possibly captured asteroid"],
      atmosphere: {
        glowColor: "#333333",
        intensity: 0.0,
        power: 0.0,
        thickness: 0.0,
      },
      surface: {
        ...deimosProceduralSurface,
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ROCKY,
        color: "#6D6E70",
      },
    } as PlanetProperties,
  });
}
