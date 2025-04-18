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

// --- Saturn Constants (NASA Planetary Fact Sheet / JPL HORIZONS J2000) ---
const SATURN_MASS_KG = 5.6834e26;
const SATURN_REAL_RADIUS_M = 58232 * KM; // Equatorial radius
const SATURN_TEMP_K = 134; // 1 bar level temperature
const SATURN_ALBEDO = 0.499; // Geometric Albedo
const SATURN_SMA_AU = 9.5826;
const SATURN_ECC = 0.0565;
const SATURN_INC_DEG = 2.485;
const SATURN_LAN_DEG = 113.665;
const SATURN_AOP_DEG = 93.056 + SATURN_LAN_DEG; // Longitude of Perihelion
const SATURN_MA_DEG = 49.954; // Mean Anomaly at J2000 Epoch
const SATURN_SIDEREAL_PERIOD_S = 9.29598e8; // Sidereal Orbit Period (~29.45 years)
const SATURN_AXIAL_TILT_DEG = 26.73;

// --- Titan Constants ---
const TITAN_MASS_KG = 1.3452e23;
const TITAN_RADIUS_M = 2574700;
const TITAN_SMA_M = 1221870 * KM;
const TITAN_ECC = 0.0288;
const TITAN_INC_DEG = 0.3485; // Relative to Saturn's equator
const TITAN_SIDEREAL_PERIOD_S = 1377700; // ~15.945 days
const TITAN_ALBEDO = 0.22;

// --- Rhea Constants ---
const RHEA_MASS_KG = 2.306e21;
const RHEA_RADIUS_M = 763800;
const RHEA_SMA_M = 527108 * KM;
const RHEA_ECC = 0.001;
const RHEA_INC_DEG = 0.345;
const RHEA_SIDEREAL_PERIOD_S = 390262; // ~4.518 days
const RHEA_ALBEDO = 0.949;

// --- Iapetus Constants ---
const IAPETUS_MASS_KG = 1.806e21;
const IAPETUS_RADIUS_M = 734500;
const IAPETUS_SMA_M = 3560820 * KM;
const IAPETUS_ECC = 0.0283;
const IAPETUS_INC_DEG = 15.47; // Inclined to Saturn's equator!
const IAPETUS_SIDEREAL_PERIOD_S = 6855300; // ~79.33 days
const IAPETUS_ALBEDO = 0.04; // Two-toned! Dark leading, bright trailing (using average/darker here)

// --- Dione Constants ---
const DIONE_MASS_KG = 1.095e21;
const DIONE_RADIUS_M = 561400;
const DIONE_SMA_M = 377396 * KM;
const DIONE_ECC = 0.0022;
const DIONE_INC_DEG = 0.019;
const DIONE_SIDEREAL_PERIOD_S = 236518; // ~2.737 days
const DIONE_ALBEDO = 0.998;

// --- Tethys Constants ---
const TETHYS_MASS_KG = 6.174e20;
const TETHYS_RADIUS_M = 531100;
const TETHYS_SMA_M = 294619 * KM;
const TETHYS_ECC = 0.0001;
const TETHYS_INC_DEG = 1.12;
const TETHYS_SIDEREAL_PERIOD_S = 163475; // ~1.89 days
const TETHYS_ALBEDO = 1.229; // Very bright!

/**
 * Initializes Saturn, its rings, and major moons using accurate data.
 */
export function initializeSaturn(parentId: string): void {
  const saturnId = "saturn"; // Define Saturn's ID

  // --- Initialize Saturn ---
  actions.addCelestial({
    id: saturnId,
    name: "Saturn",
    seed: "saturn",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: SATURN_MASS_KG,
    realRadius_m: SATURN_REAL_RADIUS_M,
    visualScaleRadius: 9.45, // Changed from radius
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
      atmosphereColor: "#F0E68C", // Pale yellow/khaki
      cloudColor: "#FFF8DC", // Cornsilk white bands
      cloudSpeed: 80, // Representative wind speed (m/s)
      stormSpeed: 50,
      rings: [
        // Radii in KM from Saturn center (Source: NASA Saturn Rings Fact Sheet)
        {
          innerRadius: 66900,
          outerRadius: 74510,
          density: 0.05,
          opacity: 0.1,
          color: "#A0522D",
          type: RockyType.DUST,
        }, // D Ring (very faint)
        {
          innerRadius: 74510,
          outerRadius: 92000,
          density: 0.4,
          opacity: 0.3,
          color: "#B8860B",
          type: RockyType.ICE,
        }, // C Ring
        {
          innerRadius: 92000,
          outerRadius: 117580,
          density: 1.0,
          opacity: 0.8,
          color: "#F5F5DC",
          type: RockyType.ICE,
        }, // B Ring (brightest)
        // Cassini Division (Gap: 117580 - 122170)
        {
          innerRadius: 122170,
          outerRadius: 136775,
          density: 0.6,
          opacity: 0.6,
          color: "#FFFFF0",
          type: RockyType.ICE,
        }, // A Ring
        // Roche Division (Gap within A Ring: 133589)
        {
          innerRadius: 136775,
          outerRadius: 139380,
          density: 0.1,
          opacity: 0.2,
          color: "#D3D3D3",
          type: RockyType.DUST,
        }, // F Ring (narrow, complex)
        {
          innerRadius: 165800,
          outerRadius: 173800,
          density: 0.01,
          opacity: 0.05,
          color: "#C0C0C0",
          type: RockyType.DUST,
        }, // G Ring (faint)
        {
          innerRadius: 120000,
          outerRadius: 480000,
          density: 0.001,
          opacity: 0.01,
          color: "#E6E6FA",
          type: RockyType.DUST,
        }, // E Ring (very wide, diffuse, sourced by Enceladus)
      ].map((ring) => ({
        // Convert KM radii to meters for consistency
        ...ring,
        innerRadius: ring.innerRadius * KM, // Using KM constant
        outerRadius: ring.outerRadius * KM,
      })) as RingProperties[],
      axialTiltDeg: SATURN_AXIAL_TILT_DEG,
      emissiveIntensity: 0.1,
    } as GasGiantProperties,
  });

  // --- Initialize Titan ---
  actions.addCelestial({
    id: "titan",
    name: "Titan",
    seed: "titan",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: TITAN_MASS_KG,
    realRadius_m: TITAN_RADIUS_M,
    visualScaleRadius: 0.4, // Changed from radius
    temperature: 94, // Surface K
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
      composition: ["N2", "CH4", "C2H6"], // Thick nitrogen/methane atmosphere
      pressure: 1.45, // atm
      color: "#FFA500A0", // Opaque orange haze
    },
    surface: {
      type: SurfaceType.FLAT, // Corrected: Use existing type
      planetType: PlanetType.ICE, // Fundamentally icy body
      color: "#B8860B", // Dark goldenrod / brown (surface beneath haze)
      secondaryColor: "#00008B", // Dark blue (liquid methane/ethane lakes)
      roughness: 0.2, // Smooth surface under haze
    } as IceSurfaceProperties, // Represent as icy despite thick atmosphere
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["nitrogen", "methane", "water ice", "rock"],
    },
  });

  // --- Initialize Rhea ---
  actions.addCelestial({
    id: "rhea",
    name: "Rhea",
    seed: "rhea",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: RHEA_MASS_KG,
    realRadius_m: RHEA_RADIUS_M,
    visualScaleRadius: 0.12, // Changed from radius
    temperature: 73, // K
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
    }, // Tenuous
    surface: {
      type: SurfaceType.ICE_FLATS, // Corrected: Use existing type
      planetType: PlanetType.ICE,
      color: "#F5F5F5", // Very bright white/grey ice
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

  // --- Initialize Iapetus ---
  actions.addCelestial({
    id: "iapetus",
    name: "Iapetus",
    seed: "iapetus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: IAPETUS_MASS_KG,
    realRadius_m: IAPETUS_RADIUS_M,
    visualScaleRadius: 0.115, // Changed from radius
    temperature: 110, // K
    albedo: IAPETUS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: IAPETUS_SMA_M,
      eccentricity: IAPETUS_ECC,
      inclination: IAPETUS_INC_DEG * DEG_TO_RAD, // Highly inclined!
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: IAPETUS_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: "#FFFFFF00" },
    surface: {
      type: SurfaceType.ICE_FLATS, // Corrected: Use existing type
      planetType: PlanetType.ICE,
      color: "#F0F0F0", // Bright trailing hemisphere
      secondaryColor: "#303030", // Dark leading hemisphere (like asphalt)
      roughness: 0.7,
      glossiness: 0.2, // Dark side is very non-reflective
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock", "carbonaceous material"],
    },
  });

  // --- Initialize Dione ---
  actions.addCelestial({
    id: "dione",
    name: "Dione",
    seed: "dione",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: DIONE_MASS_KG,
    realRadius_m: DIONE_RADIUS_M,
    visualScaleRadius: 0.088, // Changed from radius
    temperature: 87, // K
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
      type: SurfaceType.ICE_CRACKED, // Corrected: Use existing type
      planetType: PlanetType.ICE,
      color: "#E8E8E8", // Bright ice
      secondaryColor: "#FFFFFF", // Brighter cliff faces
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

  // --- Initialize Tethys ---
  actions.addCelestial({
    id: "tethys",
    name: "Tethys",
    seed: "tethys",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: TETHYS_MASS_KG,
    realRadius_m: TETHYS_RADIUS_M,
    visualScaleRadius: 0.083, // Changed from radius
    temperature: 86, // K
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
      type: SurfaceType.ICE_CRACKED, // Corrected: Use existing type
      planetType: PlanetType.ICE,
      color: "#FFFFFF", // Very bright white ice
      secondaryColor: "#DCDCDC", // Greyer canyon floors/walls
      roughness: 0.4,
      glossiness: 0.7, // Very bright surface
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock"],
    },
  });
}
