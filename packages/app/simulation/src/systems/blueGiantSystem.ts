import { AU, JUPITER_MASS, SOLAR_MASS, SOLAR_RADIUS } from '@teskooano/core-physics'; // Removed VISUAL_AU_SCALE
import { actions } from '@teskooano/core-state';
import { DEG_TO_RAD } from '@teskooano/core-math';
import {
  CelestialType,
  GasGiantClass,
  GasGiantProperties,
  OceanSurfaceProperties,
  PlanetProperties,
  PlanetType,
  RockyTerrestrialSurfaceProperties,
  StarProperties,
  StellarType,
  SurfaceType
} from '@teskooano/data-types';

/**
 * Initialize a blue giant (O or B class) star system
 * Blue giants are rare, massive, extremely luminous stars
 */
export function initializeBlueGiantSystem(): string {
  // Create a blue giant star
  const starId = actions.createSolarSystem({
    id: 'rigel',
    name: 'Rigel',
    type: CelestialType.STAR,
    seed: 'rigel_star_seed',
    realMass_kg: 23 * SOLAR_MASS,
    realRadius_m: 78.9 * SOLAR_RADIUS,
    visualScaleRadius: 25.0,
    temperature: 12100,
    albedo: 0.3,
    orbit: {
      realSemiMajorAxis_m: 0, eccentricity: 0, inclination: 0, longitudeOfAscendingNode: 0, argumentOfPeriapsis: 0, meanAnomaly: 0, period_s: 0
    },
    properties: {
      type: CelestialType.STAR,
      isMainStar: true,
      spectralClass: 'B',
      luminosity: 120000,
      color: '#9BB0FF',
      stellarType: StellarType.MAIN_SEQUENCE
    } as StarProperties
  });

  // Add a gas giant "hot jupiter" in a highly inclined, eccentric orbit
  const rigelB_SMA_AU = 0.85;
  actions.addCelestial({
    id: 'rigel-b',
    name: 'Rigel b',
    type: CelestialType.GAS_GIANT,
    seed: 'rigel_b_seed',
    visualScaleRadius: 3.0,
    realMass_kg: 3.2 * JUPITER_MASS,
    realRadius_m: 1.1 * 69911000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: rigelB_SMA_AU * AU,
      eccentricity: 0.48,
      inclination: 35 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 2.1e5
    },
    temperature: 1400,
    albedo: 0.15,
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_IV,
      atmosphereColor: '#FF8C00',
      cloudColor: '#F0E68C',
      cloudSpeed: 300,
      emissiveColor: '#FF4500',
      emissiveIntensity: 0.2
    } as GasGiantProperties
  });

  // Add an extremely eccentric comet-like small rocky planet in a near-perpendicular orbit
  const rigelC_SMA_AU = 6.5;
  actions.addCelestial({
    id: 'rigel-c',
    name: 'Rigel c',
    type: CelestialType.PLANET,
    seed: 'rigel_c_seed',
    visualScaleRadius: 0.4,
    realMass_kg: 0.01 * JUPITER_MASS,
    realRadius_m: 2000000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: rigelC_SMA_AU * AU,
      eccentricity: 0.93,
      inclination: (Math.PI / 2 - 0.05),
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 8.7 * 1e6
    },
    temperature: 350,
    albedo: 0.15,
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: '#464646',
      roughness: 0.8,
      color1: '#464646',
      color2: '#333333',
      color3: '#666666',
      color4: '#222222',
      color5: '#888888',
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.1,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['silicates', 'iron', 'carbon'],
      seed: 'seed_rigel_c'
    } as PlanetProperties
  });

  // Add a distant gas giant in a perfect polar orbit
  const rigelD_SMA_AU = 15.0;
  actions.addCelestial({
    id: 'rigel-d',
    name: 'Rigel d',
    type: CelestialType.GAS_GIANT,
    seed: 'rigel_d_seed',
    visualScaleRadius: 4.0,
    realMass_kg: 5.5 * JUPITER_MASS,
    realRadius_m: 1.3 * 69911000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: rigelD_SMA_AU * AU,
      eccentricity: 0.38,
      inclination: (Math.PI / 2) - 0.08,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 2.2 * 1e7
    },
    temperature: 120,
    albedo: 0.65,
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_I,
      atmosphereColor: '#4169E1',
      cloudColor: '#6495ED',
      cloudSpeed: 0.0002,
    } as GasGiantProperties
  });
  
  // Add a retrograde ice planet
  const rigelE_SMA_AU = 18.0;
  actions.addCelestial({
    id: 'rigel-e',
    name: 'Rigel e',
    type: CelestialType.GAS_GIANT,
    seed: 'rigel_e_seed',
    visualScaleRadius: 1.5,
    realMass_kg: 0.2 * JUPITER_MASS,
    realRadius_m: 0.8 * 69911000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: rigelE_SMA_AU * AU,
      eccentricity: 0.30,
      inclination: Math.PI * 0.85,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 3.1 * 1e7
    },
    temperature: 90,
    albedo: 0.80,
    properties: {
      gasGiantClass: GasGiantClass.CLASS_III,
      type: CelestialType.GAS_GIANT,
      atmosphereColor: '#B3E5FC',
      cloudColor: '#F5F5F5',
      cloudSpeed: 0.0001,
    } as GasGiantProperties
  });
  
  // Add a super-Earth in a perpendicular orbit to all others
  const rigelF_SMA_AU = 12.0;
  actions.addCelestial({
    id: 'rigel-f',
    name: 'Rigel f',
    type: CelestialType.PLANET,
    seed: 'rigel_f_seed',
    visualScaleRadius: 1.2,
    realMass_kg: 8.3 * 5.97237e24,
    realRadius_m: 1.9 * 6371000,
    parentId: starId,
      orbit: {
      realSemiMajorAxis_m: rigelF_SMA_AU * AU,
      eccentricity: 0.42,
      inclination: (Math.PI / 2) + 0.05,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 1.8 * 1e7
    },
    temperature: 180,
    albedo: 0.45,
    atmosphere: {
      composition: ['CO2', 'N2', 'O2'],
      pressure: 1.2,
      color: '#90CAF9'
    },
    surface: {
      type: SurfaceType.OCEAN,
      planetType: PlanetType.OCEAN,
      color: '#1565C0',
      oceanColor: '#1565C0',
      deepOceanColor: '#0D47A1',
      landColor: '#689F38',
      landRatio: 0.35,
      waveHeight: 0.5,
      roughness: 0.45
    } as OceanSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['silicates', 'iron', 'water'],
      seed: 'seed_rigel_f'
    } as PlanetProperties
  });
  
  return starId;
} 