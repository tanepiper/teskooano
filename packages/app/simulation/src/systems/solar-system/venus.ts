import { DEG_TO_RAD } from '@teskooano/core-math';
import { AU } from '@teskooano/core-physics';
import { actions } from '@teskooano/core-state';
import { CelestialType, PlanetType, SurfaceType, type LavaSurfaceProperties } from '@teskooano/data-types';

// --- Constants (NASA Planetary Fact Sheet / JPL HORIZONS J2000) ---
const VENUS_MASS_KG = 4.8675e24;
const VENUS_RADIUS_M = 6051800; // Volumetric mean radius
const VENUS_TEMP_K = 737; // Surface Temperature (Mean - very hot!)
const VENUS_ALBEDO = 0.76; // Geometric Albedo (high due to clouds)
const VENUS_SMA_AU = 0.723332;
const VENUS_ECC = 0.006773;
const VENUS_INC_DEG = 3.39471;
const VENUS_LAN_DEG = 76.68069;
const VENUS_AOP_DEG = 131.53298;
const VENUS_MA_DEG = 181.97973; // Mean Anomaly at J2000 Epoch
const VENUS_SIDEREAL_PERIOD_S = 1.94142e7; // Sidereal Orbit Period (~224.7 days)
const VENUS_AXIAL_TILT_DEG = 177.36; // Retrograde rotation (large tilt)

/**
 * Initializes Venus using accurate data.
 */
export function initializeVenus(parentId: string): void {
  actions.addCelestial({
    id: 'venus',
    name: 'Venus',
    seed: 'venus',
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: VENUS_MASS_KG,
    realRadius_m: VENUS_RADIUS_M,
    visualScaleRadius: 0.95, // Changed from radius
    temperature: VENUS_TEMP_K,
    albedo: VENUS_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: VENUS_SMA_AU * AU,
      eccentricity: VENUS_ECC,
      inclination: VENUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: VENUS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: VENUS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: VENUS_MA_DEG * DEG_TO_RAD,
      period_s: VENUS_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ['CO2', 'N2', 'SO2'], // Thick CO2 atmosphere
      pressure: 92, // Surface pressure in atm
      color: '#FDD835', // Yellow/Orange/Tan thick haze
    },
    surface: {
      // Venus' surface is obscured, but radar shows volcanic features
      type: SurfaceType.VOLCANIC,
      planetType: PlanetType.LAVA, // Represent as Lava-like due to heat/pressure
      color: '#FFA000', // Base orange/brown rock
      lavaColor: '#EF6C00', // Suggestion of molten rock/heat
      roughness: 0.7,
      rockColor: '#795548', // Darker rock
    } as LavaSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['silicates', 'iron core', 'sulfuric acid clouds'],
    },
  });
} 