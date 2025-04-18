import { DEG_TO_RAD } from '@teskooano/core-math';
import { AU } from '@teskooano/core-physics';
import { actions } from '@teskooano/core-state';
import { CelestialType, PlanetType, SurfaceType, type RockyTerrestrialSurfaceProperties } from '@teskooano/data-types';

// --- Constants (NASA Planetary Fact Sheet / JPL HORIZONS J2000) ---
const MERCURY_MASS_KG = 3.3011e23;
const MERCURY_RADIUS_M = 2439700; // Volumetric mean radius
const MERCURY_TEMP_K = 340; // Surface Temperature (Mean)
const MERCURY_ALBEDO = 0.142; // Geometric Albedo
const MERCURY_SMA_AU = 0.387098; // Semi-major axis
const MERCURY_ECC = 0.205630; // Eccentricity
const MERCURY_INC_DEG = 7.00487; // Inclination (degrees)
const MERCURY_LAN_DEG = 48.33167; // Longitude of Ascending Node (degrees)
const MERCURY_AOP_DEG = 77.45645; // Argument of Periapsis (degrees)
const MERCURY_MA_DEG = 252.25084; // Mean Anomaly at J2000 Epoch (degrees)
const MERCURY_SIDEREAL_PERIOD_S = 7.60053e6; // Sidereal Orbit Period (~87.969 days)
const MERCURY_AXIAL_TILT_DEG = 0.034; // Very small axial tilt

/**
 * Initializes Mercury using accurate data.
 */
export function initializeMercury(parentId: string): void {
  actions.addCelestial({
    id: 'mercury',
    name: 'Mercury',
    seed: 'mercury',
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: MERCURY_MASS_KG,
    realRadius_m: MERCURY_RADIUS_M,
    visualScaleRadius: 0.38, // Changed from radius
    temperature: MERCURY_TEMP_K,
    albedo: MERCURY_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: MERCURY_SMA_AU * AU,
      eccentricity: MERCURY_ECC,
      inclination: MERCURY_INC_DEG * DEG_TO_RAD, // Convert to radians
      longitudeOfAscendingNode: MERCURY_LAN_DEG * DEG_TO_RAD, // Convert to radians
      argumentOfPeriapsis: MERCURY_AOP_DEG * DEG_TO_RAD, // Convert to radians
      meanAnomaly: MERCURY_MA_DEG * DEG_TO_RAD, // Convert to radians
      period_s: MERCURY_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ['O2', 'Na', 'H2', 'He'], // Very tenuous exosphere
      pressure: 1e-14, // Approx pressure in atm
      color: '#E0E0E0', // Near-transparent/grey
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: '#9E9E9E', // Base grey color
      roughness: 0.8,
      // Optional detailed colors for procedural generation
      color1: '#9E9E9E',
      color2: '#757575',
      color3: '#BDBDBD',
      color4: '#616161',
      color5: '#E0E0E0',
      transition2: 0.3, transition3: 0.5, transition4: 0.7, transition5: 0.9,
      blend12: 0.1, blend23: 0.1, blend34: 0.1, blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['silicates', 'iron core'],
    },
  });
} 