import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  AtmosphereType,
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  SurfaceType,
  type GasGiantProperties,
  type IceSurfaceProperties,
  type RingProperties,
  type RingSystemProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
} from "@teskooano/data-types";

const SATURN_MASS_KG = 5.6834e26;
const SATURN_REAL_RADIUS_M = 58232 * KM;
const SATURN_TEMP_K = 134;
const SATURN_ALBEDO = 0.499;
const SATURN_SMA_AU = 9.5826;
const SATURN_ECC = 0.0565;
const SATURN_INC_DEG = 2.485;
const SATURN_LAN_DEG = 113.665;
const SATURN_AOP_DEG = 93.056 + SATURN_LAN_DEG;
const SATURN_MA_DEG = 49.954;
const SATURN_ORBITAL_PERIOD_S = 9.29598e8;
const SATURN_SIDEREAL_ROTATION_PERIOD_S = 38362.0;
const SATURN_AXIAL_TILT_DEG = 26.73;

const TITAN_MASS_KG = 1.3452e23;
const TITAN_RADIUS_M = 2574700;
const TITAN_SMA_M = 1221870 * KM;
const TITAN_ECC = 0.0288;
const TITAN_INC_DEG = 0.3485;
const TITAN_SIDEREAL_PERIOD_S = 1377700;
const TITAN_ALBEDO = 0.22;

const RHEA_MASS_KG = 2.306e21;
const RHEA_RADIUS_M = 763800;
const RHEA_SMA_M = 527108 * KM;
const RHEA_ECC = 0.001;
const RHEA_INC_DEG = 0.345;
const RHEA_SIDEREAL_PERIOD_S = 390262;
const RHEA_ALBEDO = 0.949;

const IAPETUS_MASS_KG = 1.806e21;
const IAPETUS_RADIUS_M = 734500;
const IAPETUS_SMA_M = 3560820 * KM;
const IAPETUS_ECC = 0.0283;
const IAPETUS_INC_DEG = 15.47;
const IAPETUS_SIDEREAL_PERIOD_S = 6855300;
const IAPETUS_ALBEDO = 0.04;

const DIONE_MASS_KG = 1.095e21;
const DIONE_RADIUS_M = 561400;
const DIONE_SMA_M = 377396 * KM;
const DIONE_ECC = 0.0022;
const DIONE_INC_DEG = 0.019;
const DIONE_SIDEREAL_PERIOD_S = 236518;
const DIONE_ALBEDO = 0.998;

const TETHYS_MASS_KG = 6.174e20;
const TETHYS_RADIUS_M = 531100;
const TETHYS_SMA_M = 294619 * KM;
const TETHYS_ECC = 0.0001;
const TETHYS_INC_DEG = 1.12;
const TETHYS_SIDEREAL_PERIOD_S = 163475;
const TETHYS_ALBEDO = 1.229;

/**
 * Initializes Saturn, its rings, and major moons using accurate data.
 */
export function initializeSaturn(parentId: string): void {
  const saturnId = "saturn";
  const saturnAxialTiltRad = SATURN_AXIAL_TILT_DEG * DEG_TO_RAD;
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: saturnId,
    name: "Saturn",
    seed: "saturn",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: SATURN_MASS_KG,
    realRadius_m: SATURN_REAL_RADIUS_M,
    temperature: SATURN_TEMP_K,
    albedo: SATURN_ALBEDO,
    siderealRotationPeriod_s: SATURN_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(saturnAxialTiltRad),
      Math.sin(saturnAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: SATURN_SMA_AU * AU,
      eccentricity: SATURN_ECC,
      inclination: SATURN_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: SATURN_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (SATURN_AOP_DEG - SATURN_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: SATURN_MA_DEG * DEG_TO_RAD,
      period_s: SATURN_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_II,
      atmosphereColor: "#F0E68C",
      cloudColor: "#FFF8DC",
      cloudSpeed: 80,
      atmosphere: {
        composition: ["H2", "He", "CH4"],
        pressure: 900000,
        type: AtmosphereType.VERY_DENSE,
        glowColor: "#F0E68C",
        intensity: 0.6,
        power: 1.2,
        thickness: 0.25,
      },
      stormColor: "#E6D9A3",
      stormSpeed: 50,
      emissiveColor: "#F0E68C",
      emissiveIntensity: 0.05,
      ringTilt: { x: 0, y: 0, z: 0 },
    } as GasGiantProperties,
  });

  // Saturn Ring System - Create as separate celestial object
  // Note: Ring systems need to be positioned at the same location as their parent
  actions.addCelestial({
    id: "saturn-rings",
    name: "Saturn Rings",
    seed: "saturn-rings",
    type: CelestialType.RING_SYSTEM,
    parentId: saturnId,
    realMass_kg: 0,
    realRadius_m: 0,
    temperature: SATURN_TEMP_K,
    albedo: 0.1,
    siderealRotationPeriod_s: SATURN_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(saturnAxialTiltRad),
      Math.sin(saturnAxialTiltRad),
    ).normalize(),
    orbit: {} as any, // Empty orbit like procedural generation
    properties: {
      type: CelestialType.RING_SYSTEM,
      parentId: saturnId,
      rings: [
        {
          innerRadius: 1.15,
          outerRadius: 1.28,
          density: 0.2,
          opacity: 0.25,
          color: "#BDB7AB",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.002,
          composition: ["fine dust"],
        },
        {
          innerRadius: 1.28,
          outerRadius: 1.58,
          density: 0.4,
          opacity: 0.45,
          color: "#A9A190",
          type: RockyType.ICE_DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0018,
          composition: ["dirty ice", "dust"],
        },
        {
          innerRadius: 1.58,
          outerRadius: 2.02,
          density: 0.9,
          opacity: 0.8,
          color: "#E0DDCF",
          type: RockyType.ICE,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0015,
          composition: ["water ice particles"],
        },
        {
          innerRadius: 2.1,
          outerRadius: 2.35,
          density: 0.7,
          opacity: 0.7,
          color: "#DAD4C5",
          type: RockyType.ICE,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0012,
          composition: ["water ice"],
        },
        {
          innerRadius: 2.41,
          outerRadius: 2.42,
          density: 0.3,
          opacity: 0.5,
          color: "#CCC5B8",
          type: RockyType.ICE_DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0011,
          composition: ["ice particles", "dust"],
        },
      ],
    } as RingSystemProperties,
  });

  // Titan procedural surface data (orange hazy surface)
  const titanProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#606070", // Dark terrain
    color2: "#808090", // Mid terrain
    color3: "#B0B0C0", // Light terrain
    color4: "#D0D0E0", // Bright terrain
    color5: "#F0F0F8", // Very bright areas
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.2,
    specularStrength: 0.1,
    roughness: 0.2,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "titan",
    name: "Titan",
    seed: "titan",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: TITAN_MASS_KG,
    realRadius_m: TITAN_RADIUS_M,
    temperature: 94,
    albedo: TITAN_ALBEDO,
    siderealRotationPeriod_s: TITAN_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: TITAN_SMA_M,
      eccentricity: TITAN_ECC,
      inclination: TITAN_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: TITAN_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: [
        "nitrogen atmosphere",
        "methane clouds",
        "water ice mantle",
        "rocky core",
        "liquid methane/ethane lakes",
      ],
      atmosphere: {
        glowColor: "#FFA500",
        intensity: 0.7,
        power: 1.3,
        thickness: 0.35,
      },
      surface: {
        ...titanProceduralSurface,
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#A06A42",
      },
    } as PlanetProperties,
  });

  // Rhea procedural surface data (bright icy surface)
  const rheaProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#C0C0C8", // Light grayish ice
    color2: "#D0D0D8", // Lighter ice
    color3: "#E0E0E8", // Bright ice
    color4: "#F0F0F8", // Very bright ice
    color5: "#FFFFFF", // Pure white ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.6,
    specularStrength: 0.5,
    roughness: 0.7,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "rhea",
    name: "Rhea",
    seed: "rhea",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: RHEA_MASS_KG,
    realRadius_m: RHEA_RADIUS_M,
    temperature: 73,
    albedo: RHEA_ALBEDO,
    siderealRotationPeriod_s: RHEA_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: RHEA_SMA_M,
      eccentricity: RHEA_ECC,
      inclination: RHEA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: RHEA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
      atmosphere: undefined, // Rhea has essentially no atmosphere
      surface: {
        ...rheaProceduralSurface,
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#EAEAEA",
      },
    } as PlanetProperties,
  });

  // Iapetus procedural surface data (two-toned surface)
  const iapetusProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#201008", // Very dark carbonaceous material
    color2: "#404028", // Dark terrain
    color3: "#808080", // Mixed terrain
    color4: "#C0C0C0", // Bright ice
    color5: "#F0F0F8", // Very bright ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.2,
    specularStrength: 0.1,
    roughness: 0.7,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "iapetus",
    name: "Iapetus",
    seed: "iapetus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: IAPETUS_MASS_KG,
    realRadius_m: IAPETUS_RADIUS_M,
    temperature: 110,
    albedo: IAPETUS_ALBEDO,
    siderealRotationPeriod_s: IAPETUS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: IAPETUS_SMA_M,
      eccentricity: IAPETUS_ECC,
      inclination: IAPETUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: IAPETUS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock", "carbonaceous material on one side"],
      atmosphere: undefined, // Iapetus has no significant atmosphere
      surface: {
        ...iapetusProceduralSurface,
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#A0A0A0",
      },
    } as PlanetProperties,
  });

  // Dione procedural surface data (bright icy surface with some features)
  const dioneProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#B0B0B8", // Gray-white ice
    color2: "#C0C0C8", // Light ice
    color3: "#D0D0D8", // Bright ice
    color4: "#E0E0E8", // Very bright ice
    color5: "#F0F0F8", // Brilliant white ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.7,
    specularStrength: 0.6,
    roughness: 0.5,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "dione",
    name: "Dione",
    seed: "dione",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: DIONE_MASS_KG,
    realRadius_m: DIONE_RADIUS_M,
    temperature: 87,
    albedo: DIONE_ALBEDO,
    siderealRotationPeriod_s: DIONE_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: DIONE_SMA_M,
      eccentricity: DIONE_ECC,
      inclination: DIONE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: DIONE_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
      atmosphere: undefined, // Dione has no significant atmosphere
      surface: {
        ...dioneProceduralSurface,
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#E0E0E0",
      },
    } as PlanetProperties,
  });

  // Tethys procedural surface data (very bright icy surface)
  const tethysProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#D0D0D8", // Bright ice
    color2: "#E0E0E8", // Very bright ice
    color3: "#F0F0F8", // Brilliant ice
    color4: "#F8F8FC", // Near white ice
    color5: "#FFFFFF", // Pure white ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.8,
    specularStrength: 0.7,
    roughness: 0.4,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "tethys",
    name: "Tethys",
    seed: "tethys",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: TETHYS_MASS_KG,
    realRadius_m: TETHYS_RADIUS_M,
    temperature: 86,
    albedo: TETHYS_ALBEDO,
    siderealRotationPeriod_s: TETHYS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: TETHYS_SMA_M,
      eccentricity: TETHYS_ECC,
      inclination: TETHYS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: TETHYS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
      atmosphere: undefined, // Tethys has no significant atmosphere
      surface: {
        ...tethysProceduralSurface,
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#F8F8F8",
      },
    } as PlanetProperties,
  });

  // --- BEGIN: Additional Major Moons (NASA/JPL data, see https://ssd.jpl.nasa.gov/sats/elem/) ---
  // Mimas
  actions.addCelestial({
    id: "mimas",
    name: "Mimas",
    seed: "mimas",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 3.7493e19,
    realRadius_m: 198200,
    temperature: 64,
    albedo: 0.96,
    siderealRotationPeriod_s: 0.942422 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 186000 * KM,
      eccentricity: 0.02,
      inclination: 1.6 * DEG_TO_RAD,
      longitudeOfAscendingNode: 66.2 * DEG_TO_RAD,
      argumentOfPeriapsis: 160.4 * DEG_TO_RAD,
      meanAnomaly: 275.3 * DEG_TO_RAD,
      period_s: 0.942422 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock"],
      surface: { type: SurfaceType.CRATERED, color: "#E0E0E0" },
    } as PlanetProperties,
  });

  // Enceladus
  actions.addCelestial({
    id: "enceladus",
    name: "Enceladus",
    seed: "enceladus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 1.0802e20,
    realRadius_m: 252100,
    temperature: 75,
    albedo: 1.0,
    siderealRotationPeriod_s: 1.370218 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 238400 * KM,
      eccentricity: 0.005,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 119.5 * DEG_TO_RAD,
      meanAnomaly: 57.0 * DEG_TO_RAD,
      period_s: 1.370218 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "subsurface ocean"],
      surface: { type: SurfaceType.ICE_CRACKED, color: "#F8F8FF" },
    } as PlanetProperties,
  });

  // Hyperion
  actions.addCelestial({
    id: "hyperion",
    name: "Hyperion",
    seed: "hyperion",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 5.6e18,
    realRadius_m: 135000,
    temperature: 70,
    albedo: 0.3,
    siderealRotationPeriod_s: 21.276658 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 1481500 * KM,
      eccentricity: 0.105,
      inclination: 0.6 * DEG_TO_RAD,
      longitudeOfAscendingNode: 87.1 * DEG_TO_RAD,
      argumentOfPeriapsis: 214.0 * DEG_TO_RAD,
      meanAnomaly: 122.9 * DEG_TO_RAD,
      period_s: 21.276658 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "porous rock"],
      surface: { type: SurfaceType.CRATERED, color: "#D2B48C" },
    } as PlanetProperties,
  });

  // Phoebe
  actions.addCelestial({
    id: "phoebe",
    name: "Phoebe",
    seed: "phoebe",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 8.292e18,
    realRadius_m: 106500,
    temperature: 75,
    albedo: 0.08,
    siderealRotationPeriod_s: 550.30391 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 12929400 * KM,
      eccentricity: 0.164,
      inclination: 175.2 * DEG_TO_RAD,
      longitudeOfAscendingNode: 192.7 * DEG_TO_RAD,
      argumentOfPeriapsis: 240.3 * DEG_TO_RAD,
      meanAnomaly: 308.0 * DEG_TO_RAD,
      period_s: 550.30391 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["rock", "ice"],
      surface: { type: SurfaceType.CRATERED, color: "#808080" },
    } as PlanetProperties,
  });

  // Janus
  actions.addCelestial({
    id: "janus",
    name: "Janus",
    seed: "janus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 1.897e18,
    realRadius_m: 89200,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.697353 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 151500 * KM,
      eccentricity: 0.007,
      inclination: 0.2 * DEG_TO_RAD,
      longitudeOfAscendingNode: 159.9 * DEG_TO_RAD,
      argumentOfPeriapsis: 11.1 * DEG_TO_RAD,
      meanAnomaly: 111.7 * DEG_TO_RAD,
      period_s: 0.697353 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["rock", "ice"],
      surface: { type: SurfaceType.CRATERED, color: "#C2B280" },
    } as PlanetProperties,
  });

  // Epimetheus
  actions.addCelestial({
    id: "epimetheus",
    name: "Epimetheus",
    seed: "epimetheus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 5.3e17,
    realRadius_m: 58200,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.697012 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 151400 * KM,
      eccentricity: 0.02,
      inclination: 0.3 * DEG_TO_RAD,
      longitudeOfAscendingNode: 189.8 * DEG_TO_RAD,
      argumentOfPeriapsis: 96.3 * DEG_TO_RAD,
      meanAnomaly: 197.2 * DEG_TO_RAD,
      period_s: 0.697012 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["rock", "ice"],
      surface: { type: SurfaceType.CRATERED, color: "#C2B280" },
    } as PlanetProperties,
  });

  // Pandora
  actions.addCelestial({
    id: "pandora",
    name: "Pandora",
    seed: "pandora",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 1.37e17,
    realRadius_m: 40600,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.631369 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 141700 * KM,
      eccentricity: 0.004,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 217.9 * DEG_TO_RAD,
      meanAnomaly: 123.9 * DEG_TO_RAD,
      period_s: 0.631369 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["rock", "ice"],
      surface: { type: SurfaceType.CRATERED, color: "#C2B280" },
    } as PlanetProperties,
  });

  // Prometheus
  actions.addCelestial({
    id: "prometheus",
    name: "Prometheus",
    seed: "prometheus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 1.59e17,
    realRadius_m: 43100,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.615878 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 139400 * KM,
      eccentricity: 0.002,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 341.9 * DEG_TO_RAD,
      meanAnomaly: 135.4 * DEG_TO_RAD,
      period_s: 0.615878 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["rock", "ice"],
      surface: { type: SurfaceType.CRATERED, color: "#C2B280" },
    } as PlanetProperties,
  });

  // Pan
  actions.addCelestial({
    id: "pan",
    name: "Pan",
    seed: "pan",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 4.95e15,
    realRadius_m: 14000,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.575051 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 133600 * KM,
      eccentricity: 0.0,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 0.0,
      meanAnomaly: 146.6 * DEG_TO_RAD,
      period_s: 0.575051 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["rock", "ice"],
      surface: { type: SurfaceType.CRATERED, color: "#C2B280" },
    } as PlanetProperties,
  });

  // Atlas
  actions.addCelestial({
    id: "atlas",
    name: "Atlas",
    seed: "atlas",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 6.6e15,
    realRadius_m: 15100,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.604602 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 137700 * KM,
      eccentricity: 0.001,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 82.3 * DEG_TO_RAD,
      meanAnomaly: 289.1 * DEG_TO_RAD,
      period_s: 0.604602 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["rock", "ice"],
      surface: { type: SurfaceType.CRATERED, color: "#C2B280" },
    } as PlanetProperties,
  });

  // Daphnis
  actions.addCelestial({
    id: "daphnis",
    name: "Daphnis",
    seed: "daphnis",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 6.8e13,
    realRadius_m: 4000,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.59408 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 136500 * KM,
      eccentricity: 0.0,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 0.0,
      meanAnomaly: 153.6 * DEG_TO_RAD,
      period_s: 0.59408 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["rock", "ice"],
      surface: { type: SurfaceType.CRATERED, color: "#C2B280" },
    } as PlanetProperties,
  });
  // --- END: Additional Major Moons ---
}
