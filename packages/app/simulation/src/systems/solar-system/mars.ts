import { DEG_TO_RAD } from '@teskooano/core-math';
import { AU } from '@teskooano/core-physics';
import { actions } from '@teskooano/core-state';
import { CelestialType, PlanetType, SurfaceType, type DesertSurfaceProperties, type RockyTerrestrialSurfaceProperties } from '@teskooano/data-types';

// --- Mars Constants (NASA Planetary Fact Sheet / JPL HORIZONS J2000) ---
const MARS_MASS_KG = 6.4171e23;
const MARS_RADIUS_M = 3389500; // Volumetric mean radius
const MARS_TEMP_K = 210; // Mean surface temperature
const MARS_ALBEDO = 0.170; // Geometric Albedo
const MARS_SMA_AU = 1.523679;
const MARS_ECC = 0.093405;
const MARS_INC_DEG = 1.85061;
const MARS_LAN_DEG = 49.57854;
const MARS_AOP_DEG = 336.04084;
const MARS_MA_DEG = 355.45332; // Mean Anomaly at J2000 Epoch
const MARS_SIDEREAL_PERIOD_S = 5.93550e7; // Sidereal Orbit Period (~686.98 days)
const MARS_AXIAL_TILT_DEG = 25.19; // Obliquity to Orbit

// --- Phobos Constants (NASA) ---
const PHOBOS_MASS_KG = 1.0659e16;
const PHOBOS_RADIUS_M = 11267; // Mean radius (approx, irregular shape)
const PHOBOS_SMA_M = 9376000; // Semi-major axis around Mars
const PHOBOS_ECC = 0.0151;
const PHOBOS_INC_DEG = 1.093; // Inclination to Mars equator
const PHOBOS_SIDEREAL_PERIOD_S = 27553; // Sidereal Orbit Period (~0.319 days)
const PHOBOS_ALBEDO = 0.071;

// --- Deimos Constants (NASA) ---
const DEIMOS_MASS_KG = 1.4762e15;
const DEIMOS_RADIUS_M = 6200; // Mean radius (approx, irregular shape)
const DEIMOS_SMA_M = 23463200;
const DEIMOS_ECC = 0.00033;
const DEIMOS_INC_DEG = 0.93; // Inclination to Mars equator (close to Phobos)
const DEIMOS_SIDEREAL_PERIOD_S = 109075; // Sidereal Orbit Period (~1.262 days)
const DEIMOS_ALBEDO = 0.068;

/**
 * Initializes Mars and its moons (Phobos, Deimos) using accurate data.
 */
export function initializeMars(parentId: string): void {
  const marsId = 'mars'; // Define Mars' ID

  // --- Initialize Mars ---
  actions.addCelestial({
    id: marsId,
    name: 'Mars',
    seed: 'mars',
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: MARS_MASS_KG,
    realRadius_m: MARS_RADIUS_M,
    visualScaleRadius: 0.53, // Changed from radius
    temperature: MARS_TEMP_K,
    albedo: MARS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: MARS_SMA_AU * AU,
      eccentricity: MARS_ECC,
      inclination: MARS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MARS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MARS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MARS_MA_DEG * DEG_TO_RAD,
      period_s: MARS_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ['CO2', 'N2', 'Ar'], // Thin CO2 atmosphere
      pressure: 0.006, // ~0.6% of Earth's pressure
      color: '#FFB07A', // Pale reddish/orange sky
    },
    surface: {
      type: SurfaceType.DUNES, // Changed from planetType: PlanetType.ROCKY
      planetType: PlanetType.DESERT, // Added appropriate planetType
      color: '#C1440E', // Reddish-brown base
      roughness: 0.6,
      secondaryColor: '#8B4513' // Darker sienna/brown rock
    } as DesertSurfaceProperties, // Use DesertSurfaceProperties
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['silicates', 'iron oxide', 'basalt'],
    },
  });

  // --- Initialize Phobos ---
  actions.addCelestial({
    id: 'phobos',
    name: 'Phobos',
    type: CelestialType.MOON,
    parentId: marsId,
    realMass_kg: PHOBOS_MASS_KG,
    realRadius_m: PHOBOS_RADIUS_M,
    visualScaleRadius: 0.02, // Changed from radius
    temperature: 233, // Approx. temp
    albedo: PHOBOS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: PHOBOS_SMA_M,
      eccentricity: PHOBOS_ECC,
      inclination: PHOBOS_INC_DEG * DEG_TO_RAD, // Relative to Mars equator
      // LAN, AOP, MA are often omitted or randomized for small irregular moons
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: PHOBOS_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: '#00000000' }, // No atmosphere
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: '#606060', // Dark grey
      roughness: 0.9,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: marsId,
      composition: ['carbonaceous chondrite'], // Likely captured asteroid
    },
  });

  // --- Initialize Deimos ---
  actions.addCelestial({
    id: 'deimos',
    name: 'Deimos',
    type: CelestialType.MOON,
    parentId: marsId,
    realMass_kg: DEIMOS_MASS_KG,
    realRadius_m: DEIMOS_RADIUS_M,
    visualScaleRadius: 0.01, // Changed from radius
    temperature: 233,
    albedo: DEIMOS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: DEIMOS_SMA_M,
      eccentricity: DEIMOS_ECC,
      inclination: DEIMOS_INC_DEG * DEG_TO_RAD, // Relative to Mars equator
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: DEIMOS_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: '#00000000' },
    surface: {
      type: SurfaceType.CRATERED, // Smoother than Phobos due to regolith
      planetType: PlanetType.ROCKY,
      color: '#808080', // Slightly lighter grey than Phobos
      roughness: 0.6,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: marsId,
      composition: ['carbonaceous chondrite'],
    },
  });
}

// REMOVED DUPLICATED FUNCTION
// export function createMarsSystemData(parentId: string): CelestialObjectInputData[] { ... } 