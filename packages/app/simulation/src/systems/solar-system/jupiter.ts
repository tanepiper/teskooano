import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  type IceSurfaceProperties,
  type LavaSurfaceProperties,
  PlanetType,
  RockyType,
  SurfaceType,
  type GasGiantProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
  type RingProperties,
  type RingSystemProperties,
} from "@teskooano/data-types";

const JUPITER_REAL_MASS_KG = 1.89819e27;
const JUPITER_REAL_RADIUS_M = 69911000;
const JUPITER_TEMP_K = 165;
const JUPITER_ALBEDO = 0.538;
const JUPITER_SMA_AU = 5.2044;
const JUPITER_ECC = 0.0489;
const JUPITER_INC_DEG = 1.305;
const JUPITER_LAN_DEG = 100.464;
const JUPITER_AOP_DEG = 14.331 + JUPITER_LAN_DEG;
const JUPITER_MA_DEG = 34.351;
const JUPITER_ORBITAL_PERIOD_S = 3.74336e8;
const JUPITER_SIDEREAL_ROTATION_PERIOD_S = 35730.0;
const JUPITER_AXIAL_TILT_DEG = 3.13;

const IO_MASS_KG = 8.9319e22;
const IO_RADIUS_M = 1821600;
const IO_SMA_M = 421700 * KM;
const IO_ECC = 0.0041;
const IO_INC_DEG = 0.05;
const IO_SIDEREAL_PERIOD_S = 152854;
const IO_ALBEDO = 0.63;

const EUROPA_MASS_KG = 4.7998e22;
const EUROPA_RADIUS_M = 1560800;
const EUROPA_SMA_M = 671034 * KM;
const EUROPA_ECC = 0.0094;
const EUROPA_INC_DEG = 0.471;
const EUROPA_SIDEREAL_PERIOD_S = 306822;
const EUROPA_ALBEDO = 0.67;

const GANYMEDE_MASS_KG = 1.4819e23;
const GANYMEDE_RADIUS_M = 2631200;
const GANYMEDE_SMA_M = 1070412 * KM;
const GANYMEDE_ECC = 0.0013;
const GANYMEDE_INC_DEG = 0.204;
const GANYMEDE_SIDEREAL_PERIOD_S = 618153;
const GANYMEDE_ALBEDO = 0.43;

const CALLISTO_MASS_KG = 1.0759e23;
const CALLISTO_RADIUS_M = 2410300;
const CALLISTO_SMA_M = 1882709 * KM;
const CALLISTO_ECC = 0.0074;
const CALLISTO_INC_DEG = 0.205;
const CALLISTO_SIDEREAL_PERIOD_S = 1441902;
const CALLISTO_ALBEDO = 0.17;

/**
 * Initializes Jupiter and its Galilean moons using accurate data.
 */
export function initializeJupiter(parentId: string): void {
  const jupiterId = "jupiter";
  const jupiterAxialTiltRad = JUPITER_AXIAL_TILT_DEG * DEG_TO_RAD;

  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: jupiterId,
    name: "Jupiter",
    seed: "jupiter",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: JUPITER_REAL_MASS_KG,
    realRadius_m: JUPITER_REAL_RADIUS_M,
    temperature: JUPITER_TEMP_K,
    albedo: JUPITER_ALBEDO,
    siderealRotationPeriod_s: JUPITER_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(jupiterAxialTiltRad),
      Math.sin(jupiterAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: JUPITER_SMA_AU * AU,
      eccentricity: JUPITER_ECC,
      inclination: JUPITER_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: JUPITER_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (JUPITER_AOP_DEG - JUPITER_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: JUPITER_MA_DEG * DEG_TO_RAD,
      period_s: JUPITER_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_I,
      atmosphereColor: "#D8C8A8",
      cloudColor: "#FFFFFF",
      cloudSpeed: 100,
      stormColor: "#B7410E",
      stormSpeed: 50,
      ringTilt: {
        x: 0,
        y: Math.cos(jupiterAxialTiltRad),
        z: Math.sin(jupiterAxialTiltRad),
      },
    } as GasGiantProperties,
  });

  // Jupiter Ring System - Create as separate celestial object
  actions.addCelestial({
    id: "jupiter-rings",
    name: "Jupiter Rings",
    seed: "jupiter-rings",
    type: CelestialType.RING_SYSTEM,
    parentId: jupiterId,
    realMass_kg: 0,
    realRadius_m: 0,
    temperature: JUPITER_TEMP_K,
    albedo: 0.05,
    siderealRotationPeriod_s: JUPITER_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(jupiterAxialTiltRad),
      Math.sin(jupiterAxialTiltRad),
    ).normalize(),
    orbit: {} as any,
    properties: {
      type: CelestialType.RING_SYSTEM,
      parentId: jupiterId,
      rings: [
        {
          innerRadius: 1.4,
          outerRadius: 1.5,
          density: 0.2,
          opacity: 0.15,
          color: "#B0B0B8",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.001,
          composition: ["dark dust", "meteorite debris"],
        },
        {
          innerRadius: 1.5,
          outerRadius: 1.75,
          density: 0.15,
          opacity: 0.12,
          color: "#A0A0A8",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0008,
          composition: ["fine dust", "ring moon debris"],
        },
      ],
    } as RingSystemProperties,
  });

  // Io procedural surface data (volcanic world)
  const ioProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.6,
    lacunarity: 2.3,
    simplePeriod: 4.0,
    octaves: 7,
    bumpScale: 0.4,
    color1: "#201000", // Dark volcanic rock
    color2: "#8B4513", // Brown volcanic surface
    color3: "#CD853F", // Lighter volcanic areas
    color4: "#FFFFA0", // Sulfur deposits
    color5: "#FF2000", // Active lava flows
    height1: 0.0,
    height2: 0.2,
    height3: 0.5,
    height4: 0.8,
    height5: 0.95,
    shininess: 0.1,
    specularStrength: 0.2,
    roughness: 0.6,
    ambientLightIntensity: 0.15,
    undulation: 0.3,
    terrainType: 2,
    terrainAmplitude: 0.5,
    terrainSharpness: 0.8,
    terrainOffset: 0.1,
  };

  actions.addCelestial({
    id: "io",
    name: "Io",
    seed: "io_seed_1769",
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: IO_MASS_KG,
    realRadius_m: IO_RADIUS_M,
    temperature: 110,
    albedo: IO_ALBEDO,
    siderealRotationPeriod_s: IO_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: IO_SMA_M,
      eccentricity: IO_ECC,
      inclination: IO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: IO_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.LAVA,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: [
        "sulfur compounds",
        "silicates",
        "iron core",
        "molten interior",
      ],
      atmosphere: {
        glowColor: "#FFFF00",
        intensity: 0.1,
        power: 0.8,
        thickness: 0.05,
      },
      surface: {
        ...ioProceduralSurface,
        type: SurfaceType.VOLCANIC,
        planetType: PlanetType.LAVA,
        color: "#FFFFA0",
      },
    } as PlanetProperties,
  });

  // Europa procedural surface data (icy world with cracks)
  const europaProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.4,
    lacunarity: 2.0,
    simplePeriod: 8.0,
    octaves: 6,
    bumpScale: 0.1,
    color1: "#E0F0FF", // Pure ice
    color2: "#F0F8FF", // Clean ice
    color3: "#FFFFFF", // Bright ice
    color4: "#F8F8FF", // Reflective ice
    color5: "#FFFAFA", // Snow-like ice
    height1: 0.0,
    height2: 0.4,
    height3: 0.6,
    height4: 0.8,
    height5: 1.0,
    shininess: 0.8,
    specularStrength: 0.7,
    roughness: 0.3,
    ambientLightIntensity: 0.2,
    undulation: 0.05,
    terrainType: 1,
    terrainAmplitude: 0.1,
    terrainSharpness: 0.4,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "europa",
    name: "Europa",
    seed: "europa_seed_3551",
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: EUROPA_MASS_KG,
    realRadius_m: EUROPA_RADIUS_M,
    temperature: 102,
    albedo: EUROPA_ALBEDO,
    siderealRotationPeriod_s: EUROPA_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: EUROPA_SMA_M,
      eccentricity: EUROPA_ECC,
      inclination: EUROPA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: EUROPA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ["water ice", "silicates", "iron core", "subsurface ocean"],
      atmosphere: {
        glowColor: "#AAFFFF",
        intensity: 0.05,
        power: 0.5,
        thickness: 0.03,
      },
      surface: {
        ...europaProceduralSurface,
        type: SurfaceType.ICE_CRACKED,
        planetType: PlanetType.ICE,
        color: "#FFFFFF",
      },
    } as PlanetProperties,
  });

  // Ganymede procedural surface data (mixed ice and rock)
  const ganymedeProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.5,
    lacunarity: 2.1,
    simplePeriod: 6.0,
    octaves: 7,
    bumpScale: 0.2,
    color1: "#666666", // Dark terrain
    color2: "#888888", // Mixed terrain
    color3: "#AAAAAA", // Intermediate terrain
    color4: "#C0C0C0", // Bright terrain
    color5: "#E0E0E0", // Very bright ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.9,
    shininess: 0.4,
    specularStrength: 0.3,
    roughness: 0.5,
    ambientLightIntensity: 0.1,
    undulation: 0.1,
    terrainType: 1,
    terrainAmplitude: 0.2,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "ganymede",
    name: "Ganymede",
    seed: "ganymede_seed_7155",
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: GANYMEDE_MASS_KG,
    realRadius_m: GANYMEDE_RADIUS_M,
    temperature: 110,
    albedo: GANYMEDE_ALBEDO,
    siderealRotationPeriod_s: GANYMEDE_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: GANYMEDE_SMA_M,
      eccentricity: GANYMEDE_ECC,
      inclination: GANYMEDE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: GANYMEDE_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ["water ice", "silicates", "iron core", "internal ocean"],
      atmosphere: {
        glowColor: "#CCDDFF",
        intensity: 0.02,
        power: 0.3,
        thickness: 0.02,
      },
      surface: {
        ...ganymedeProceduralSurface,
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#B8B8C0",
      },
    } as PlanetProperties,
  });

  // Callisto procedural surface data (heavily cratered dark surface)
  const callistoProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.0,
    simplePeriod: 5.0,
    octaves: 6,
    bumpScale: 0.25,
    color1: "#1A1A1A", // Very dark ancient surface
    color2: "#2A2A2A", // Dark terrain
    color3: "#3A3A3A", // Medium dark terrain
    color4: "#4A4A4A", // Lighter dark terrain
    color5: "#5A5A5A", // Brightest areas
    height1: 0.0,
    height2: 0.25,
    height3: 0.5,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.05,
    specularStrength: 0.05,
    roughness: 0.7,
    ambientLightIntensity: 0.05,
    undulation: 0.15,
    terrainType: 1,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.7,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "callisto",
    name: "Callisto",
    seed: "callisto_seed_16690",
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: CALLISTO_MASS_KG,
    realRadius_m: CALLISTO_RADIUS_M,
    temperature: 134,
    albedo: CALLISTO_ALBEDO,
    siderealRotationPeriod_s: CALLISTO_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: CALLISTO_SMA_M,
      eccentricity: CALLISTO_ECC,
      inclination: CALLISTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: CALLISTO_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ["water ice", "silicates", "possible iron core"],
      atmosphere: undefined, // Callisto has no significant atmosphere
      surface: {
        ...callistoProceduralSurface,
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ICE,
        color: "#443322",
      },
    } as PlanetProperties,
  });
}
