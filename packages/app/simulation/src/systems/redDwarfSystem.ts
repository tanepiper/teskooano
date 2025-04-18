import { actions } from '@teskooano/core-state';
import { CelestialType, LavaSurfaceProperties, OceanSurfaceProperties, PlanetProperties, PlanetType, StarProperties, StellarType, SurfaceType, type RockyTerrestrialSurfaceProperties, type IceSurfaceProperties } from '@teskooano/data-types';
import { AU, JUPITER_MASS, KM, SOLAR_MASS, SOLAR_RADIUS } from '@teskooano/core-physics';
import { DEG_TO_RAD, OSVector3 } from '@teskooano/core-math';

/**
 * Initialize a red dwarf (M-class) star system
 * Red dwarfs are the most common type of star in the Milky Way
 */
export function initializeRedDwarfSystem(): string {
  // Create a red dwarf system
  const starId = actions.createSolarSystem({
    id: 'proxima-centauri',
    name: 'Proxima Centauri',
    type: CelestialType.STAR,
    seed: 'proxima_seed',
    visualScaleRadius: 2.0,
    realMass_kg: 0.12 * SOLAR_MASS,
    realRadius_m: 0.15 * SOLAR_RADIUS,
    temperature: 3042,
    albedo: 0.3,
    orbit: {
      realSemiMajorAxis_m: 0, eccentricity: 0, inclination: 0, longitudeOfAscendingNode: 0, argumentOfPeriapsis: 0, meanAnomaly: 0, period_s: 0
    },
    properties: {
      type: CelestialType.STAR,
      isMainStar: true,
      spectralClass: 'M5.5Ve',
      luminosity: 0.0017,
      color: '#FF6666',
      stellarType: StellarType.MAIN_SEQUENCE
    } as StarProperties
  });

  // Add a terrestrial planet in the habitable zone
  // For an M-class star, the habitable zone is much closer to the star
  const proximaB_SMA_AU = 0.05;
  actions.addCelestial({
    id: 'proxima-b',
    name: 'Proxima Centauri b',
    type: CelestialType.PLANET,
    seed: 'proxima_b_seed',
    visualScaleRadius: 0.5,
    realMass_kg: 1.2 * 5.97237e24,
    realRadius_m: 1.1 * 6371000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: proximaB_SMA_AU * AU,
      eccentricity: 0.02,
      inclination: 2 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 9.6e5
    },
    temperature: 234,
    albedo: 0.2,
    atmosphere: {
      composition: ['N2', 'CO2?'],
      pressure: 0.8,
      color: '#E6E6FA'
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.TERRESTRIAL,
      color: '#6A5ACD',
      secondaryColor: '#FFFAFA',
      roughness: 0.5
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['silicates', 'iron', 'ice?']
    } as PlanetProperties
  });
  
  // Add a second, more distant rocky planet
  const proximaC_SMA_AU = 1.5;
  actions.addCelestial({
    id: 'proxima-c',
    name: 'Proxima Centauri c',
    type: CelestialType.PLANET,
    seed: 'proxima_c_seed',
    visualScaleRadius: 1.0,
    realMass_kg: 7 * 5.97237e24,
    realRadius_m: 1.8 * 6371000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: proximaC_SMA_AU * AU,
      eccentricity: 0.04,
      inclination: 10 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 1.6e8
    },
    temperature: 39,
    albedo: 0.4,
    atmosphere: {
      composition: ['H2', 'He', 'CH4?'],
      pressure: 0.1,
      color: '#B0E0E6'
    },
    surface: {
      type: SurfaceType.ICE_FLATS,
      planetType: PlanetType.ICE,
      color: '#AFEEEE',
      roughness: 0.3
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['ice', 'rock', 'gas envelope?']
    } as PlanetProperties
  });
  
  // Add a third planet - hot super-Earth in a highly eccentric orbit
  const proximaD_SMA_AU = 0.01;
  actions.addCelestial({
    id: 'proxima-d',
    name: 'Proxima Centauri d',
    type: CelestialType.PLANET,
    seed: 'proxima_d_seed',
    visualScaleRadius: 0.3,
    realMass_kg: 0.3 * 5.97237e24,
    realRadius_m: 0.7 * 6371000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: proximaD_SMA_AU * AU,
      eccentricity: 0.1,
      inclination: 1 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 1.5e5
    },
    temperature: 500,
    albedo: 0.1,
    atmosphere: {
      composition: ['none'],
      pressure: 0,
      color: '#00000000'
    },
    surface: {
      type: SurfaceType.VOLCANIC,
      planetType: PlanetType.LAVA,
      lavaColor: '#DC143C',
      roughness: 0.8,
      rockColor: '#2F4F4F'
    } as LavaSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['iron', 'silicates']
    } as PlanetProperties
  });
  
  // Add a small planet in a retrograde orbit
  const proximaE_SMA_AU = 0.35;
  actions.addCelestial({
    id: 'proxima-e',
    name: 'Proxima Centauri e',
    type: CelestialType.PLANET,
    visualScaleRadius: 0.45,
    realMass_kg: 0.8 * 5.97237e24,
    realRadius_m: 0.85 * 6371000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: proximaE_SMA_AU * AU,
      eccentricity: 0.18,
      inclination: Math.PI - 0.1,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 6.8 * 1e5
    },
    temperature: 234,
    albedo: 0.2,
    atmosphere: {
      composition: ['CO2'],
      pressure: 0.01,
      color: '#FFCCBC'
    },
    surface: {
      type: SurfaceType.DUNES,
      planetType: PlanetType.DESERT,
      color: '#FFD54F',
      secondaryColor: '#E65100',
      roughness: 0.8
    },
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['silicates', 'metals'],
      seed: 'seed_proxima_e'
    } as PlanetProperties
  });
  
  // Add a planet with orbit perpendicular to all others
  const proximaF_SMA_AU = 0.25;
  actions.addCelestial({
    id: 'proxima-f',
    name: 'Proxima Centauri f',
    type: CelestialType.PLANET,
    visualScaleRadius: 0.55,
    realMass_kg: 2.1 * 5.97237e24,
    realRadius_m: 1.2 * 6371000,
    parentId: starId,
    orbit: {
      realSemiMajorAxis_m: proximaF_SMA_AU * AU,
      eccentricity: 0.48,
      inclination: 0.05,
      longitudeOfAscendingNode: (Math.PI/2) + 0.1,
      argumentOfPeriapsis: (Math.PI/4) + 0.1,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 4.2 * 1e5
    },
    temperature: 234,
    albedo: 0.2,
    atmosphere: {
      composition: ['O2', 'N2'],
      pressure: 0.8,
      color: '#81D4FA'
    },
    surface: {
      type: SurfaceType.VARIED,
      planetType: PlanetType.ROCKY,
      color: '#5D4037',
      secondaryColor: '#7CB342',
      roughness: 0.7,
      color1: '#5D4037',
      color2: '#7CB342',
      color3: '#8D6E63',
      color4: '#3E2723',
      color5: '#A1887F',
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.2,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ['silicates', 'water'],
      seed: 'seed_proxima_f'
    } as PlanetProperties
  });

  return starId;
} 