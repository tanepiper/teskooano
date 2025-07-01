import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  SurfaceType,
  type GasGiantProperties,
  type IceSurfaceProperties,
  type RingProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
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
      planetType: GasGiantClass.CLASS_II,
      gasGiantClass: GasGiantClass.CLASS_II,
      atmosphere: {
        atmosphereColor: "#F0E68C",
        cloudColor: "#FFF8DC",
        cloudSpeed: 80,
        stormSpeed: 50,
        emissiveColor: "#F0E68C20",
        emissiveIntensity: 0.05,
      },
      rings: [
        {
          innerRadius: SATURN_REAL_RADIUS_M * 1.15,
          outerRadius: SATURN_REAL_RADIUS_M * 1.28,
          density: 0.02,
          opacity: 0.05,
          color: "#BDB7AB",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.002,
          composition: ["fine dust"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 1.28,
          outerRadius: SATURN_REAL_RADIUS_M * 1.58,
          density: 0.2,
          opacity: 0.15,
          color: "#A9A190",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_c_ring.png",
          rotationRate: 0.0018,
          composition: ["dirty ice", "dust"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 1.58,
          outerRadius: SATURN_REAL_RADIUS_M * 2.02,
          density: 0.8,
          opacity: 0.7,
          color: "#E0DDCF",
          type: RockyType.ICE,
          texture: "textures/ring_b_ring.png",
          rotationRate: 0.0015,
          composition: ["water ice particles"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 2.1,
          outerRadius: SATURN_REAL_RADIUS_M * 2.35,
          density: 0.5,
          opacity: 0.5,
          color: "#DAD4C5",
          type: RockyType.ICE,
          texture: "textures/ring_a_ring.png",
          rotationRate: 0.0012,
          composition: ["water ice"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 2.41,
          outerRadius: SATURN_REAL_RADIUS_M * 2.415,
          density: 0.1,
          opacity: 0.3,
          color: "#CCC5B8",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_f_ring.png",
          rotationRate: 0.0011,
          composition: ["ice particles", "dust"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 2.92,
          outerRadius: SATURN_REAL_RADIUS_M * 2.93,
          density: 0.005,
          opacity: 0.02,
          color: "#B8B0A2",
          type: RockyType.DUST,
          texture: "textures/ring_g_ring.png",
          rotationRate: 0.0009,
          composition: ["micrometer dust"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 3.11,
          outerRadius: SATURN_REAL_RADIUS_M * 8.29,
          density: 0.0001,
          opacity: 0.005,
          color: "#95a0a8",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_e_ring.png",
          rotationRate: 0.0005,
          composition: ["ice crystals", "dust"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

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
      planetType: PlanetType.ROCKY,
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
        type: SurfaceType.FLAT,
        color: "#A06A42",
        roughness: 0.2,
        planetType: PlanetType.ROCKY,
        persistence: 0.53,
        lacunarity: 2.14,
        simplePeriod: 0.87,
        octaves: 8,
        bumpScale: 10,
        color1: "#A06A42",
        color2: "#8B4513",
        color3: "#2F4F4F",
        color4: "#F5DEB3",
        color5: "#FFFAFA",
        height1: 0.088,
        height2: 0.42,
        height3: 0.41,
        height4: 0.44,
        height5: 0.44,
        shininess: 23,
        specularStrength: 0.47,
        ambientLightIntensity: 0.42,
        undulation: 0.1,
        terrainType: 3,
        terrainAmplitude: 0.2,
        terrainSharpness: 1.3,
        terrainOffset: 0.25,
      },
    } as PlanetProperties,
  });

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
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
      atmosphere: {
        glowColor: "#FFFFFF",
        intensity: 0.01,
        power: 0.5,
        thickness: 0.005,
      },
      surface: {
        type: SurfaceType.ICE_FLATS,
        color: "#EAEAEA",
        roughness: 0.7,
        planetType: PlanetType.BARREN,
        persistence: 0.52,
        lacunarity: 2.2,
        simplePeriod: 2.5,
        octaves: 9,
        bumpScale: 2.8,
        color1: "#EAEAEA",
        color2: "#D3D3D3",
        color3: "#C0C0C0",
        color4: "#F0F0F0",
        color5: "#FFFFFF",
        height1: 0.1,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 0.95,
        shininess: 32,
        specularStrength: 0.6,
        ambientLightIntensity: 0.45,
        undulation: 0.2,
        terrainType: 2,
        terrainAmplitude: 0.6,
        terrainSharpness: 1.5,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });

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
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock", "carbonaceous material on one side"],
      atmosphere: {
        glowColor: "#FFFF00",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.VARIED,
        color: "#A0A0A0",
        roughness: 0.7,
        planetType: PlanetType.BARREN,
        persistence: 0.48,
        lacunarity: 2.3,
        simplePeriod: 1.8,
        octaves: 10,
        bumpScale: 2.5,
        color1: "#201008",
        color2: "#404040",
        color3: "#808080",
        color4: "#C0C0C0",
        color5: "#F0F0F0",
        height1: 0.15,
        height2: 0.35,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 16,
        specularStrength: 0.4,
        ambientLightIntensity: 0.35,
        undulation: 0.25,
        terrainType: 2,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.4,
        terrainOffset: -0.05,
      },
    } as PlanetProperties,
  });

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
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
      atmosphere: {
        glowColor: "#FFFF00",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.ICE_CRACKED,
        color: "#E0E0E0",
        roughness: 0.5,
        planetType: PlanetType.BARREN,
        persistence: 0.55,
        lacunarity: 2.0,
        simplePeriod: 2.2,
        octaves: 8,
        bumpScale: 2.4,
        color1: "#B0B0B0",
        color2: "#D0D0D0",
        color3: "#E0E0E0",
        color4: "#F0F0F0",
        color5: "#FFFFFF",
        height1: 0.12,
        height2: 0.28,
        height3: 0.5,
        height4: 0.72,
        height5: 0.88,
        shininess: 28,
        specularStrength: 0.6,
        ambientLightIntensity: 0.4,
        undulation: 0.18,
        terrainType: 3,
        terrainAmplitude: 0.65,
        terrainSharpness: 1.2,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });

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
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["mostly water ice", "small amount of rock"],
      atmosphere: {
        glowColor: "#FFFF00",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.ICE_CRACKED,
        color: "#F8F8F8",
        roughness: 0.4,
        planetType: PlanetType.BARREN,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 1.9,
        octaves: 9,
        bumpScale: 2.6,
        color1: "#C8C8C8",
        color2: "#E0E0E0",
        color3: "#F0F0F0",
        color4: "#F8F8F8",
        color5: "#FFFFFF",
        height1: 0.08,
        height2: 0.22,
        height3: 0.45,
        height4: 0.7,
        height5: 0.9,
        shininess: 36,
        specularStrength: 0.8,
        ambientLightIntensity: 0.45,
        undulation: 0.15,
        terrainType: 3,
        terrainAmplitude: 0.7,
        terrainSharpness: 1.6,
        terrainOffset: 0.15,
      },
    } as PlanetProperties,
  });
}
