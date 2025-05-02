import { DEG_TO_RAD } from "@teskooano/core-math";
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
const SATURN_SIDEREAL_PERIOD_S = 9.29598e8;
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

  actions.addCelestial({
    id: saturnId,
    name: "Saturn",
    seed: "saturn",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: SATURN_MASS_KG,
    realRadius_m: SATURN_REAL_RADIUS_M,
    visualScaleRadius: 9.45,
    temperature: SATURN_TEMP_K,
    albedo: SATURN_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: SATURN_SMA_AU * AU,
      eccentricity: SATURN_ECC,
      inclination: SATURN_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: SATURN_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (SATURN_AOP_DEG - SATURN_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: SATURN_MA_DEG * DEG_TO_RAD,
      period_s: SATURN_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_II,
      atmosphereColor: "#F0E68C",
      cloudColor: "#FFF8DC",
      cloudSpeed: 80,
      stormSpeed: 50,
      rings: [
        {
          innerRadius: 66900,
          outerRadius: 74510,
          density: 0.05,
          opacity: 0.1,
          color: "#A0522D",
          type: RockyType.DUST,
        },
        {
          innerRadius: 74510,
          outerRadius: 92000,
          density: 0.4,
          opacity: 0.3,
          color: "#B8860B",
          type: RockyType.ICE,
        },
        {
          innerRadius: 92000,
          outerRadius: 117580,
          density: 1.0,
          opacity: 0.8,
          color: "#F5F5DC",
          type: RockyType.ICE,
        },

        {
          innerRadius: 122170,
          outerRadius: 136775,
          density: 0.6,
          opacity: 0.6,
          color: "#FFFFF0",
          type: RockyType.ICE,
        },

        {
          innerRadius: 136775,
          outerRadius: 139380,
          density: 0.1,
          opacity: 0.2,
          color: "#D3D3D3",
          type: RockyType.DUST,
        },
        {
          innerRadius: 165800,
          outerRadius: 173800,
          density: 0.01,
          opacity: 0.05,
          color: "#C0C0C0",
          type: RockyType.DUST,
        },
        {
          innerRadius: 120000,
          outerRadius: 480000,
          density: 0.001,
          opacity: 0.01,
          color: "#E6E6FA",
          type: RockyType.DUST,
        },
      ].map((ring) => ({
        ...ring,
        innerRadius: ring.innerRadius * KM,
        outerRadius: ring.outerRadius * KM,
      })) as RingProperties[],
      axialTiltDeg: SATURN_AXIAL_TILT_DEG,
      emissiveIntensity: 0.1,
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
    visualScaleRadius: 0.4,
    temperature: 94,
    albedo: TITAN_ALBEDO,
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
      composition: ["N2", "CH4", "C2H6"],
      pressure: 1.45,
      color: "#FFA500A0",
    },
    surface: {
      type: SurfaceType.FLAT,
      planetType: PlanetType.ICE,
      color: "#B8860B",
      secondaryColor: "#00008B",
      roughness: 0.2,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["nitrogen", "methane", "water ice", "rock"],
    },
  });

  actions.addCelestial({
    id: "rhea",
    name: "Rhea",
    seed: "rhea",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: RHEA_MASS_KG,
    realRadius_m: RHEA_RADIUS_M,
    visualScaleRadius: 0.12,
    temperature: 73,
    albedo: RHEA_ALBEDO,
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
      composition: ["O2", "CO2"],
      pressure: 5e-12,
      color: "#FFFFFF00",
    },
    surface: {
      type: SurfaceType.ICE_FLATS,
      planetType: PlanetType.ICE,
      color: "#F5F5F5",
      roughness: 0.6,
      glossiness: 0.4,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock"],
    },
  });

  actions.addCelestial({
    id: "iapetus",
    name: "Iapetus",
    seed: "iapetus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: IAPETUS_MASS_KG,
    realRadius_m: IAPETUS_RADIUS_M,
    visualScaleRadius: 0.115,
    temperature: 110,
    albedo: IAPETUS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: IAPETUS_SMA_M,
      eccentricity: IAPETUS_ECC,
      inclination: IAPETUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: IAPETUS_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: "#FFFFFF00" },
    surface: {
      type: SurfaceType.ICE_FLATS,
      planetType: PlanetType.ICE,
      color: "#F0F0F0",
      secondaryColor: "#303030",
      roughness: 0.7,
      glossiness: 0.2,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock", "carbonaceous material"],
    },
  });

  actions.addCelestial({
    id: "dione",
    name: "Dione",
    seed: "dione",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: DIONE_MASS_KG,
    realRadius_m: DIONE_RADIUS_M,
    visualScaleRadius: 0.088,
    temperature: 87,
    albedo: DIONE_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: DIONE_SMA_M,
      eccentricity: DIONE_ECC,
      inclination: DIONE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: DIONE_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: "#FFFFFF00" },
    surface: {
      type: SurfaceType.ICE_CRACKED,
      planetType: PlanetType.ICE,
      color: "#E8E8E8",
      secondaryColor: "#FFFFFF",
      roughness: 0.5,
      glossiness: 0.5,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock"],
    },
  });

  actions.addCelestial({
    id: "tethys",
    name: "Tethys",
    seed: "tethys",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: TETHYS_MASS_KG,
    realRadius_m: TETHYS_RADIUS_M,
    visualScaleRadius: 0.083,
    temperature: 86,
    albedo: TETHYS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: TETHYS_SMA_M,
      eccentricity: TETHYS_ECC,
      inclination: TETHYS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: TETHYS_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: "#FFFFFF00" },
    surface: {
      type: SurfaceType.ICE_CRACKED,
      planetType: PlanetType.ICE,
      color: "#FFFFFF",
      secondaryColor: "#DCDCDC",
      roughness: 0.4,
      glossiness: 0.7,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock"],
    },
  });
}
