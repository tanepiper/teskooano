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
      gasGiantClass: GasGiantClass.CLASS_II,
      atmosphereColor: "#F0E68C",
      cloudColor: "#FFF8DC",
      cloudSpeed: 80,
      stormSpeed: 50,
      emissiveColor: "#F0E68C20",
      emissiveIntensity: 0.05,
      rings: [
        {
          innerRadius: 66900 * KM,
          outerRadius: 74510 * KM,
          density: 0.02,
          opacity: 0.05,
          color: "#BDB7AB",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.002,
          composition: ["fine dust"],
        } as RingProperties,
        {
          innerRadius: 74658 * KM,
          outerRadius: 92000 * KM,
          density: 0.2,
          opacity: 0.15,
          color: "#A9A190",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_c_ring.png",
          rotationRate: 0.0018,
          composition: ["dirty ice", "dust"],
        } as RingProperties,
        {
          innerRadius: 92000 * KM,
          outerRadius: 117580 * KM,
          density: 0.8,
          opacity: 0.7,
          color: "#E0DDCF",
          type: RockyType.ICE,
          texture: "textures/ring_b_ring.png",
          rotationRate: 0.0015,
          composition: ["water ice particles"],
        } as RingProperties,
        {
          innerRadius: 122170 * KM,
          outerRadius: 136775 * KM,
          density: 0.5,
          opacity: 0.5,
          color: "#DAD4C5",
          type: RockyType.ICE,
          texture: "textures/ring_a_ring.png",
          rotationRate: 0.0012,
          composition: ["water ice"],
        } as RingProperties,
        {
          innerRadius: 140180 * KM,
          outerRadius: 140230 * KM,
          density: 0.1,
          opacity: 0.3,
          color: "#CCC5B8",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_f_ring.png",
          rotationRate: 0.0011,
          composition: ["ice particles", "dust"],
        } as RingProperties,
        {
          innerRadius: 170000 * KM,
          outerRadius: 175000 * KM,
          density: 0.005,
          opacity: 0.02,
          color: "#B8B0A2",
          type: RockyType.DUST,
          texture: "textures/ring_g_ring.png",
          rotationRate: 0.0009,
          composition: ["micrometer dust"],
        } as RingProperties,
        {
          innerRadius: 181000 * KM,
          outerRadius: 483000 * KM,
          density: 0.0001,
          opacity: 0.005,
          color: "#A8A09533",
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
    atmosphere: {
      glowColor: "#FFA50060",
      intensity: 0.7,
      power: 1.3,
      thickness: 0.35,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.FLAT,
      planetType: PlanetType.ICE,
      color: "#A06A42",
      secondaryColor: "#4A2A0A",
      roughness: 0.2,
      glossiness: 0.1,
      crackIntensity: 0.05,
      iceThickness: 5.0,
    } as IceSurfaceProperties,
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
    atmosphere: {
      glowColor: "#FFFFFF03",
      intensity: 0.01,
      power: 0.5,
      thickness: 0.005,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.ICE_FLATS,
      planetType: PlanetType.ICE,
      color: "#EAEAEA",
      roughness: 0.7,
      glossiness: 0.6,
      crackIntensity: 0.4,
      iceThickness: 20.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
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
    atmosphere: {
      glowColor: "#FFFFFF00",
      intensity: 0,
      power: 0,
      thickness: 0,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.VARIED,
      planetType: PlanetType.ICE,
      color: "#A0A0A0",
      secondaryColor: "#201008",
      roughness: 0.7,
      glossiness: 0.2,
      crackIntensity: 0.1,
      iceThickness: 30.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock", "carbonaceous material on one side"],
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
    atmosphere: {
      glowColor: "#FFFFFF00",
      intensity: 0,
      power: 0,
      thickness: 0,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.ICE_CRACKED,
      planetType: PlanetType.ICE,
      color: "#E0E0E0",
      secondaryColor: "#B0B0B0",
      roughness: 0.5,
      glossiness: 0.6,
      crackIntensity: 0.5,
      iceThickness: 25.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
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
    atmosphere: {
      glowColor: "#FFFFFF00",
      intensity: 0,
      power: 0,
      thickness: 0,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.ICE_CRACKED,
      planetType: PlanetType.ICE,
      color: "#F8F8F8",
      secondaryColor: "#C8C8C8",
      roughness: 0.4,
      glossiness: 0.8,
      crackIntensity: 0.7,
      iceThickness: 30.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["mostly water ice", "small amount of rock"],
    } as PlanetProperties,
  });
}
