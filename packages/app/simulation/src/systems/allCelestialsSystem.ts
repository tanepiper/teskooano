import { actions } from '@teskooano/core-state';
import {
  AsteroidFieldProperties,
  CelestialType,
  CometProperties,
  GasGiantClass,
  GasGiantProperties,
  IceSurfaceProperties,
  LavaSurfaceProperties,
  OceanSurfaceProperties,
  OrbitalParameters,
  PlanetProperties,
  PlanetType,
  RockyTerrestrialSurfaceProperties,
  RockyType,
  SCALE,
  StellarType,
  SurfaceType,
  DesertSurfaceProperties,
  StarProperties,
  RingProperties,
  OortCloudProperties
} from '@teskooano/data-types';

import { DEG_TO_RAD, OSVector3 } from '@teskooano/core-math'; // Math constants and types
import { AU, GRAVITATIONAL_CONSTANT, KM, JUPITER_MASS, SOLAR_MASS, SOLAR_RADIUS } from '@teskooano/core-physics'; // Core physics constants

/**
 * Calculate initial position and velocity in REAL units (m, m/s)
 * for a body based on its orbital parameters relative to a parent.
 *
 * Assumes a circular orbit in the XY plane initially for simplicity.
 *
 * @param orbit Orbital parameters (using REAL units like semiMajorAxis_m).
 * @param parentMass_kg Mass of the parent body (kg).
 * @param parentVelocity_mps Velocity of the parent body (m/s).
 * @returns Initial position and velocity vectors relative to the parent (OSVector3).
 */
export function calculateInitialState(
  orbit: OrbitalParameters,
  parentMass_kg: number,
  parentVelocity_mps: OSVector3 = new OSVector3(0, 0, 0), // Default to static parent
): { position: OSVector3; velocity: OSVector3 } {
  const semiMajorAxis_m = orbit.realSemiMajorAxis_m ?? 0;
  const eccentricity = orbit.eccentricity ?? 0;

  // --- Input Validation ---
  const zeroState = { position: new OSVector3(0, 0, 0), velocity: new OSVector3(0, 0, 0) };
  if (parentMass_kg <= 0 || !Number.isFinite(parentMass_kg)) {
    console.warn(`[calculateInitialState] Invalid parent mass: ${parentMass_kg}. Returning zero state.`);
    return zeroState;
  }
  if (semiMajorAxis_m <= 0 || !Number.isFinite(semiMajorAxis_m)) {
    console.warn(`[calculateInitialState] Invalid semi-major axis: ${semiMajorAxis_m}. Returning zero state.`);
    return zeroState;
  }
  if (eccentricity < 0 || eccentricity >= 1 || !Number.isFinite(eccentricity)) {
    // Allow eccentricity >= 1 only if specifically handled for hyperbolic/parabolic
    console.warn(`[calculateInitialState] Invalid or unhandled eccentricity: ${eccentricity}. Returning zero state.`);
    return zeroState;
  }
  // --- End Validation ---

  // For simplicity, start at periapsis (closest point)
  // Position: x = a * (1 - e), y = 0, z = 0 (relative to parent)
  const distanceAtPeriapsis = semiMajorAxis_m * (1 - eccentricity);
  const position = new OSVector3(distanceAtPeriapsis, 0, 0);

  // Velocity at periapsis
  // v = sqrt( G * M_parent * ( (1+e) / (a*(1-e)) ) ) - More accurate for elliptical
  // simplified: v = sqrt(G * M / r) using periapsis distance
  let orbitalSpeed = 0;
  if (distanceAtPeriapsis > 1e-6) { // Avoid division by zero
    const speedSquared = GRAVITATIONAL_CONSTANT * parentMass_kg / distanceAtPeriapsis;
    if (speedSquared < 0 || !Number.isFinite(speedSquared)) {
      console.warn(`[calculateInitialState] Calculated non-finite orbital speed (sqrt input: ${speedSquared}). Periapsis: ${distanceAtPeriapsis}. Returning zero state.`);
      return zeroState;
    }
    orbitalSpeed = Math.sqrt(speedSquared);
    // More accurate calc (vis-viva eq. special case at periapsis):
    // orbitalSpeed = Math.sqrt((GRAVITATIONAL_CONSTANT * parentMass_kg / semiMajorAxis_m) * ((1 + eccentricity) / (1 - eccentricity)));
  }

  // Velocity vector: x = 0, y = orbitalSpeed, z = 0 (relative to parent in XY plane)
  const relativeVelocity = new OSVector3(0, orbitalSpeed, 0);

  // TODO: Incorporate inclination, longitude of ascending node, argument of periapsis
  // This would involve rotating the initial position and velocity vectors based on orbital plane.
  // For now, we assume orbits are co-planar in the XY plane.

  // Add parent's velocity to get absolute velocity
  const velocity = relativeVelocity.add(parentVelocity_mps); // OSVector3.add

  return { position, velocity }; // Return OSVector3 directly
}

export function initializeAllCelestialsSystem(): string {
  // --- Main Star ---
  const sunName = 'Solara Prime'; // Define name separately
  const sunData = {
    id: 'star-main',
    name: sunName, // Use variable
    type: CelestialType.STAR,
    seed: 'seed_star_1000',
    realMass_kg: 1.989e30,
    realRadius_m: 696340000,
    visualScaleRadius: 10, // Fixed property name
    temperature: 6000,
    albedo: 0.3, // Added placeholder
    orbitalParameters: { // Placeholder for stars
        realSemiMajorAxis_m: 0, eccentricity: 0, inclination: 0, longitudeOfAscendingNode: 0, argumentOfPeriapsis: 0, meanAnomaly: 0, period_s: 0
    },
    properties: { // Renamed
      type: CelestialType.STAR,
      starName: sunName, // Use variable
      isMainStar: true,
      spectralClass: 'G0V',
      luminosity: 1.2,
      color: '#FFFFDD',
      stellarType: StellarType.MAIN_SEQUENCE,
    } as StarProperties,
  };
  const sunId = actions.createSolarSystem(sunData);

  // --- Rocky Planet --- Cinder (Mercury-like)
  const cinderSMA_AU = 0.387;
  const cinderData = {
    id: 'planet-rocky',
    name: 'Cinder',
    type: CelestialType.PLANET,
    parentId: sunId,
    seed: 'seed_cinder_1001',
    realMass_kg: 3.3011e23,
    realRadius_m: 2439700,
    visualScaleRadius: 0.2, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: cinderSMA_AU * AU,
      eccentricity: 0.21,
      inclination: 7.5 * DEG_TO_RAD,
      longitudeOfAscendingNode: 48.3 * DEG_TO_RAD,
      argumentOfPeriapsis: 29.1 * DEG_TO_RAD,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 7.6e6 // ~88 days
    },
    temperature: 340,
    albedo: 0.14,
    atmosphere: {
      composition: ['minimal'],
      pressure: 1e-14, // Very tenuous
      color: '#999999'
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: '#A89078',
      roughness: 0.9,
      color1: '#A89078',
      color2: '#8C7864',
      color3: '#C4A88C',
      color4: '#6F5F50',
      color5: '#D4C0A8',
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.1,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: { // Renamed
      type: CelestialType.PLANET,
      isMoon: false,
      surfaceType: SurfaceType.CRATERED,
      composition: ['silicates', 'iron'],
    } as PlanetProperties,
  };
  actions.addCelestial(cinderData);

  // --- Terrestrial Planet --- Gaia Secundus (Earth-like)
  const gaiaSMA_AU = 1.05;
  const gaiaId = 'planet-terrestrial'; // Store ID
  const gaiaData = {
    id: gaiaId,
    name: 'Gaia Secundus',
    type: CelestialType.PLANET,
    parentId: sunId,
    seed: 'seed_gaia_1002',
    realMass_kg: 5.97e24,
    realRadius_m: 6371000,
    visualScaleRadius: 0.5, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: gaiaSMA_AU * AU,
      eccentricity: 0.018,
      inclination: 0.1 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 3.154e7 // ~365.25 days
    },
    temperature: 288, // Average K
    albedo: 0.3, // Earth average
    atmosphere: {
      composition: ['N2', 'O2', 'Ar'],
      pressure: 1, // atm
      color: '#87CEEB', // Light blue sky
    },
    surface: {
      type: SurfaceType.VARIED,
      planetType: PlanetType.TERRESTRIAL,
      color: '#228B22', // Green land base
      roughness: 0.3,
      secondaryColor: '#1E90FF', // Blue water
      color1: '#228B22', // Green land
      color2: '#1E90FF', // Blue water
      color3: '#3CB371', // Medium sea green
      color4: '#8FBC8F', // Dark sea green (mountains?)
      color5: '#F4A460', // Sandy brown (beaches/deserts)
      transition2: 0.2, transition3: 0.4, transition4: 0.6, transition5: 0.8,
      blend12: 0.2, blend23: 0.1, blend34: 0.1, blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: { // Renamed
      type: CelestialType.PLANET,
      isMoon: false,
      surfaceType: SurfaceType.VARIED,
      composition: ['silicates', 'iron', 'nickel'],
    } as PlanetProperties,
  };
  actions.addCelestial(gaiaData);

  // --- Terrestrial Moon --- Luna Minor (Moon-like)
  const lunaSMA_m = 384400 * KM;
  const lunaData = {
    id: 'moon-terrestrial',
    name: 'Luna Minor',
    type: CelestialType.MOON,
    parentId: gaiaId, // Use stored ID
    seed: 'seed_luna_1003',
    realMass_kg: 7.34e22,
    realRadius_m: 1737400,
    visualScaleRadius: 0.15, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: lunaSMA_m,
      eccentricity: 0.06,
      inclination: 5.5 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 2.36e6 // ~27.3 days
    },
    temperature: 220, // Average K (varies wildly)
    albedo: 0.12, // Moon average
    atmosphere: {
      composition: ['minimal'],
      pressure: 3e-15, // Very tenuous
      color: '#999999'
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: '#AAAAAA',
      roughness: 0.7,
      color1: '#AAAAAA',
      color2: '#888888',
      color3: '#CCCCCC',
      color4: '#666666',
      color5: '#E0E0E0',
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.1,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: { // Renamed
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: gaiaId,
      composition: ['silicates', 'anorthosite'],
    } as PlanetProperties,
  };
  actions.addCelestial(lunaData);

  // --- Desert Planet --- Arrakis Prime (Mars-like)
  const arrakisSMA_AU = 1.6;
  const arrakisData = {
    id: 'planet-desert',
    name: 'Arrakis Prime',
    type: CelestialType.PLANET,
    parentId: sunId,
    seed: 'seed_arrakis_1004',
    realMass_kg: 6.417e23,
    realRadius_m: 3389500,
    visualScaleRadius: 0.25, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: arrakisSMA_AU * AU,
      eccentricity: 0.1,
      inclination: 2.1 * DEG_TO_RAD,
      longitudeOfAscendingNode: 49.56 * DEG_TO_RAD,
      argumentOfPeriapsis: 286.5 * DEG_TO_RAD,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 5.94e7 // ~687 days
    },
    temperature: 210, // Average K
    albedo: 0.25, // Mars average
    atmosphere: {
      composition: ['CO2', 'N2', 'Ar'],
      pressure: 0.006, // atm
      color: '#FFDEAD', // Pale orange/pink sky
    },
    surface: {
      type: SurfaceType.DUNES,
      planetType: PlanetType.DESERT,
      color: '#D2B48C', // Tan/Reddish
      roughness: 0.5,
      secondaryColor: '#A0522D' // Darker rock color
    } as DesertSurfaceProperties,
    properties: { // Renamed
      type: CelestialType.PLANET,
      isMoon: false,
      surfaceType: SurfaceType.DUNES,
      composition: ['silicates', 'iron oxide'],
    } as PlanetProperties,
  };
  actions.addCelestial(arrakisData);

  // --- Ice Planet --- Hoth Beta (Fictional - between Mars/Jupiter)
  const hothSMA_AU = 3.5;
  const hothData = {
    id: 'planet-ice',
    name: 'Hoth Beta',
    type: CelestialType.PLANET,
    parentId: sunId,
    seed: 'seed_hoth_1005',
    realMass_kg: 1.5e24, // Fictional mass
    realRadius_m: 4000000, // Fictional radius
    visualScaleRadius: 0.6, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: hothSMA_AU * AU,
      eccentricity: 0.08,
      inclination: 2.5 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 1.5e8 // Approx 4.7 years
    },
    temperature: 150, // K
    albedo: 0.7, // High albedo for ice
    atmosphere: {
      composition: ['N2', 'CH4'],
      pressure: 0.5, // atm
      color: '#ADD8E6', // Light blue/grey
    },
    surface: {
      type: SurfaceType.ICE_FLATS,
      planetType: PlanetType.ICE,
      color: '#FFFFFF',
      roughness: 0.2,
      glossiness: 0.8,
    } as IceSurfaceProperties,
    properties: { // Renamed
      type: CelestialType.PLANET,
      isMoon: false,
      surfaceType: SurfaceType.ICE_FLATS,
      composition: ['water ice', 'rock'],
    } as PlanetProperties,
  };
  actions.addCelestial(hothData);

  // --- Lava Planet --- Mustafar Gamma (Fictional - Inner system)
  const mustafarSMA_AU = 0.15;
  const mustafarData = {
    id: 'planet-lava',
    name: 'Mustafar Gamma',
    type: CelestialType.PLANET,
    parentId: sunId,
    seed: 'seed_mustafar_1006',
    realMass_kg: 4e24, // Fictional mass
    realRadius_m: 5000000, // Fictional radius
    visualScaleRadius: 0.6, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: mustafarSMA_AU * AU,
      eccentricity: 0.05,
      inclination: 4.0 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 3.9e6 // Approx 45 days
    },
    temperature: 1200, // K
    albedo: 0.1, // Low albedo
    atmosphere: {
      composition: ['SO2', 'CO2'],
      pressure: 0.1, // atm
      color: '#FFA500', // Orange/Yellow haze
    },
    surface: {
      type: SurfaceType.VOLCANIC,
      planetType: PlanetType.LAVA,
      lavaColor: '#FF4500',
      roughness: 0.8,
      rockColor: '#2F4F4F',
    } as LavaSurfaceProperties,
    properties: { // Renamed
      type: CelestialType.PLANET,
      isMoon: false,
      surfaceType: SurfaceType.VOLCANIC,
      composition: ['silicates', 'sulfur'],
    } as PlanetProperties,
  };
  actions.addCelestial(mustafarData);

  // --- Ocean Planet --- Aqualon (Fictional - Habitable Zone)
  const aqualonSMA_AU = 1.3;
  const aqualonData = {
    id: 'planet-ocean',
    name: 'Aqualon',
    type: CelestialType.PLANET,
    parentId: sunId,
    seed: 'seed_aqualon_1007',
    realMass_kg: 6.5e24,
    realRadius_m: 6500000,
    visualScaleRadius: 0.7, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: aqualonSMA_AU * AU,
      eccentricity: 0.03,
      inclination: 0.5 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 4.2e7 // Approx 1.3 years
    },
    temperature: 295, // K
    albedo: 0.4,
    atmosphere: {
      composition: ['N2', 'O2', 'H2O'],
      pressure: 1.1, // atm
      color: '#87CEFA', // Light Sky Blue
    },
    surface: {
      type: SurfaceType.OCEAN,
      planetType: PlanetType.OCEAN,
      oceanColor: '#4682B4',
      roughness: 0.1,
      deepOceanColor: '#2F4F4F',
      landColor: '#8FBC8F',
      landRatio: 0.0,
    } as OceanSurfaceProperties,
    properties: { // Renamed
      type: CelestialType.PLANET,
      isMoon: false,
      surfaceType: SurfaceType.OCEAN,
      composition: ['water', 'silicates'],
    } as PlanetProperties,
  };
  actions.addCelestial(aqualonData);

  // --- Asteroid Field --- The Divide (Main Belt analog)
  const asteroidFieldInnerAU = 2.2;
  const asteroidFieldOuterAU = 3.2;
  const asteroidFieldHeightAU = 0.5;
  const asteroidFieldData = {
      id: 'asteroid-field-1',
      name: 'The Divide',
      type: CelestialType.ASTEROID_FIELD,
      parentId: sunId,
      seed: 'seed_divide_1009',
      realMass_kg: 3e21, // Total estimated mass of asteroid belt
      realRadius_m: asteroidFieldOuterAU * AU, // Use outer radius for size reference
      orbitalParameters: { // Orbit of the field center
          realSemiMajorAxis_m: (asteroidFieldInnerAU + asteroidFieldOuterAU) / 2 * AU,
          eccentricity: 0.08,
          inclination: 10 * DEG_TO_RAD,
          longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
          argumentOfPeriapsis: Math.random() * 2 * Math.PI,
          meanAnomaly: Math.random() * 2 * Math.PI,
          period_s: 1.6e8 // Approx 5 years
      },
      temperature: 165, // Average K
      properties: { // Renamed
          type: CelestialType.ASTEROID_FIELD,
          innerRadiusAU: asteroidFieldInnerAU,
          outerRadiusAU: asteroidFieldOuterAU,
          heightAU: asteroidFieldHeightAU,
          count: 10000, // Number of asteroids to simulate/render
          color: '#8B4513', // Saddle Brown
          composition: ['rock', 'iron', 'nickel'],
          visualDensity: 100, // Density for visualization
      } as AsteroidFieldProperties,
  };
  actions.addCelestial(asteroidFieldData);

  // --- Asteroid --- Nomad (Large rogue asteroid/dwarf planet in belt)
  const nomadSMA_AU = 2.8;
  const nomadData = {
    id: 'asteroid-nomad',
    name: 'Nomad',
    type: CelestialType.DWARF_PLANET,
    parentId: sunId,
    seed: 'seed_nomad_1010',
    realMass_kg: 5e15, // ~10km radius size
    realRadius_m: 10000,
    visualScaleRadius: 0.05, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: nomadSMA_AU * AU,
      eccentricity: 0.18,
      inclination: 7.5 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 1.64e8 // Approx 5.2 years
    },
    temperature: 175, // Approx K
    albedo: 0.06, // Dark asteroid
    atmosphere: {
      composition: ['minimal'],
      pressure: 0,
      color: '#999999'
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: '#B8B8B8',
      roughness: 0.9,
      color1: '#B8B8B8',
      color2: '#909090',
      color3: '#D0D0D0',
      color4: '#606060',
      color5: '#E8E8E8',
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.1,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: { // Added back for Dwarf Planet
      type: CelestialType.DWARF_PLANET,
      isMoon: false,
      composition: ['rock', 'ice'] // Example composition
    } as PlanetProperties,
  };
  actions.addCelestial(nomadData);

  // --- Gas Giant Class I --- Jovian Prime (Jupiter analog)
  const jovianPrimeSMA_AU = 5.2;
  const jovianId = 'gas-giant-1'; // Store ID
  const jovianData = {
    id: jovianId,
    name: 'Jovian Prime',
    type: CelestialType.GAS_GIANT,
    parentId: sunId,
    seed: 'seed_jovian_1011',
    realMass_kg: 1.898e27,
    realRadius_m: 69911000,
    visualScaleRadius: 2.0, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: jovianPrimeSMA_AU * AU,
      eccentricity: 0.055,
      inclination: 1.5 * DEG_TO_RAD,
      longitudeOfAscendingNode: 100.46 * DEG_TO_RAD,
      argumentOfPeriapsis: 273.87 * DEG_TO_RAD,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 3.74e8 // Approx 11.86 years
    },
    temperature: 165, // Cloud top temp K
    albedo: 0.52,
    properties: { // Renamed
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_I,
      atmosphereColor: '#D2B48C', // Tan
      cloudColor: '#FFFFFF', // White bands
      cloudSpeed: 100, // Estimated cloud speed
      stormColor: '#B22222', // Firebrick red spot
      stormSpeed: 50, // m/s?
      rings: [
        { // Faint main ring analog
          innerRadius: 1.7 * 69911000,
          outerRadius: 1.8 * 69911000,
          density: 0.1,
          opacity: 0.1,
          color: '#8B4513', // Saddle Brown (dusty)
          rotationRate: 0.0001, // rad/s?
          texture: 'ring_texture_dusty.png',
          composition: ['dust', 'rock'],
          type: RockyType.DARK_ROCK
        },
      ],
    } as GasGiantProperties,
  };
  actions.addCelestial(jovianData);

  // --- Ice Moon orbiting Gas Giant I --- Europa Minor (Europa analog)
  const europaSMA_m = 671100 * KM;
  const europaData = {
    id: 'moon-ice-1',
    name: 'Europa Minor',
    type: CelestialType.MOON,
    parentId: jovianId, // Use stored ID
    seed: 'seed_europa_1008',
    realMass_kg: 4.8e22,
    realRadius_m: 1560800,
    visualScaleRadius: 0.15, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: europaSMA_m,
      eccentricity: 0.015,
      inclination: 0.8 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 3.07e5 // Approx 3.55 days
    },
    temperature: 102, // K
    albedo: 0.67,
    atmosphere: {
      composition: ['O2'],
      pressure: 1e-11, // atm
      color: '#FFFFFF00'
    },
    surface: {
      type: SurfaceType.ICE_CRACKED,
      planetType: PlanetType.ICE,
      color: '#E0FFFF', // Light Cyan
      roughness: 0.3,
      glossiness: 0.7,
      color1: '#E0FFFF',
      color2: '#AFEEEE',
      color3: '#FFFFFF',
      color4: '#ADD8E6',
      color5: '#F0FFFF',
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.1,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as IceSurfaceProperties,
    properties: { // Renamed
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: jovianId,
      composition: ['water ice', 'silicates'],
    } as PlanetProperties,
  };
  actions.addCelestial(europaData);

  // --- Gas Giant Class II --- Saturnus Secundus (Saturn analog)
  const saturnusSMA_AU = 9.58;
  const saturnusData = {
    id: 'gas-giant-2',
    name: 'Saturnus Secundus',
    type: CelestialType.GAS_GIANT,
    parentId: sunId,
    seed: 'seed_saturnus_1012',
    realMass_kg: 5.683e26,
    realRadius_m: 58232000,
    visualScaleRadius: 1.8, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: saturnusSMA_AU * AU,
      eccentricity: 0.06,
      inclination: 2.8 * DEG_TO_RAD,
      longitudeOfAscendingNode: 113.66 * DEG_TO_RAD,
      argumentOfPeriapsis: 339.39 * DEG_TO_RAD,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 9.3e8 // Approx 29.5 years
    },
    temperature: 134, // Cloud top K
    albedo: 0.47,
    properties: { // Renamed
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_II,
      atmosphereColor: '#F5F5DC', // Beige
      cloudColor: '#FFF8DC', // Cornsilk white
      cloudSpeed: 80,
      rings: [
        { innerRadius: 66900 * KM, outerRadius: 92000 * KM, density: 0.3, opacity: 0.2, color: '#A0522D', rotationRate: 0.00007, texture: 'ring_texture_sparse.png', composition: ['rock', 'dust'], type: RockyType.DARK_ROCK }, // C Ring
        { innerRadius: 92000 * KM, outerRadius: 117580 * KM, density: 0.8, opacity: 0.7, color: '#F0E68C', rotationRate: 0.00008, texture: 'ring_texture_icy.png', composition: ['water ice'], type: RockyType.ICE }, // B Ring
        { innerRadius: 117580 * KM, outerRadius: 136775 * KM, density: 0.5, opacity: 0.4, color: '#FFFFF0', rotationRate: 0.00009, texture: 'ring_texture_dense.png', composition: ['water ice'], type: RockyType.ICE }, // A Ring
      ],
    } as GasGiantProperties,
  };
  actions.addCelestial(saturnusData);

  // --- Ice Giant --- Azureus (Uranus analog)
  const azureusSMA_AU = 19.2;
  const azureusData = {
    id: 'ice-giant-1',
    name: 'Azureus',
    type: CelestialType.GAS_GIANT,
    parentId: sunId,
    seed: 'seed_azureus_1013',
    realMass_kg: 8.681e25,
    realRadius_m: 25362000,
    visualScaleRadius: 1.0, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: azureusSMA_AU * AU,
      eccentricity: 0.05,
      inclination: 0.9 * DEG_TO_RAD,
      longitudeOfAscendingNode: 74.0 * DEG_TO_RAD,
      argumentOfPeriapsis: 96.9 * DEG_TO_RAD,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 2.65e9 // Approx 84 years
    },
    temperature: 76, // Cloud top K
    albedo: 0.51,
    properties: { // Renamed
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphereColor: '#AFEEEE', // Pale Turquoise
      cloudColor: '#E0FFFF', // Light cyan clouds
      cloudSpeed: 100, // Estimated cloud speed
      rings: [ // Faint, dark rings
        { innerRadius: 41837 * KM, outerRadius: 51149 * KM, density: 0.1, opacity: 0.1, color: '#696969', rotationRate: 0.00005, texture: 'ring_texture_dark.png', composition: ['dark dust', 'rock'], type: RockyType.DARK_ROCK }, // Epsilon ring is brightest, others fainter
      ],
    } as GasGiantProperties,
  };
  actions.addCelestial(azureusData);

  // --- Ice Giant --- Poseidon Prime (Neptune analog)
  const poseidonSMA_AU = 30.1;
  const poseidonData = {
    id: 'ice-giant-2',
    name: 'Poseidon Prime',
    type: CelestialType.GAS_GIANT,
    parentId: sunId,
    seed: 'seed_poseidon_1014',
    realMass_kg: 1.024e26,
    realRadius_m: 24622000,
    visualScaleRadius: 0.95, // Fixed property name
    orbitalParameters: {
        realSemiMajorAxis_m: poseidonSMA_AU * AU,
        eccentricity: 0.015,
        inclination: 2.0 * DEG_TO_RAD,
        longitudeOfAscendingNode: 131.78 * DEG_TO_RAD,
        argumentOfPeriapsis: 276.3 * DEG_TO_RAD,
        meanAnomaly: Math.random() * 2 * Math.PI,
        period_s: 5.2e9 // Approx 164.8 years
    },
    temperature: 72, // Cloud top K
    albedo: 0.41,
    properties: { // Renamed
          type: CelestialType.GAS_GIANT,
        gasGiantClass: GasGiantClass.CLASS_III,
        atmosphereColor: '#6495ED', // Cornflower Blue
        cloudColor: '#F0FFFF', // Azure white clouds
        cloudSpeed: 50,
        rings: [ // Faint rings/arcs
            { innerRadius: 41900 * KM, outerRadius: 53200 * KM, density: 0.05, opacity: 0.05, color: '#808080', rotationRate: 0.00004, texture: 'ring_texture_dark.png', composition: ['dust'], type: RockyType.DUST }, // Galle/LeVerrier
            { innerRadius: 62930 * KM, outerRadius: 62930 * KM + 500, density: 0.1, opacity: 0.1, color: '#A9A9A9', rotationRate: 0.000045, texture: 'ring_texture_dark.png', composition: ['dust'], type: RockyType.DUST } // Adams ring (with arcs - simplified here)
        ],
    } as GasGiantProperties,
  };
  actions.addCelestial(poseidonData);

  // --- Hot Jupiter Class IV --- Inferno (Fictional)
  const infernoSMA_AU = 0.05;
  const infernoData = {
    id: 'hot-jupiter-1',
    name: 'Inferno',
    type: CelestialType.GAS_GIANT,
    parentId: sunId,
    seed: 'seed_inferno_1015',
    realMass_kg: 1.5 * JUPITER_MASS,
    realRadius_m: 1.2 * 69911000,
    visualScaleRadius: 2.5, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: infernoSMA_AU * AU,
      eccentricity: 0.03,
      inclination: 2.5 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 3.37e5 // Approx 3.9 days based on Kepler's 3rd
    },
    temperature: 1500, // K
    albedo: 0.1,
    properties: { // Renamed
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_IV,
      atmosphereColor: '#FF7F50', // Coral
      cloudColor: '#FFE4B5', // Moccasin (alkali clouds)
      cloudSpeed: 200,
      emissiveColor: '#FF4500', // OrangeRed glow
      emissiveIntensity: 0.3
    } as GasGiantProperties,
  };
  actions.addCelestial(infernoData);

  // --- Hot Jupiter Class V --- Forge (Fictional, very massive)
  const forgeSMA_AU = 0.04;
  const forgeData = {
    id: 'hot-jupiter-2',
    name: 'Forge',
    type: CelestialType.GAS_GIANT,
    parentId: sunId,
    seed: 'seed_forge_1016',
    realMass_kg: 6 * JUPITER_MASS,
    realRadius_m: 1.1 * 69911000,
    visualScaleRadius: 2.4, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: forgeSMA_AU * AU,
      eccentricity: 0.04,
      inclination: 48 * DEG_TO_RAD, // Highly inclined
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 2.42e5 // Approx 2.8 days
    },
    temperature: 1600, // K
    albedo: 0.05,
    properties: { // Renamed
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_V,
      atmosphereColor: '#DC143C', // Crimson
      cloudColor: '#C0C0C0', // Silver (silicate clouds)
      cloudSpeed: 250,
      emissiveColor: '#FF4500',
      emissiveIntensity: 0.4
    } as GasGiantProperties,
  };
  actions.addCelestial(forgeData);

  // --- Comet --- Harbinger (Long period)
  const cometPerihelionAU = 0.5;
  const cometAphelionAU = 100;
  const cometSemiMajorAxisAU = (cometPerihelionAU + cometAphelionAU) / 2;
  const cometEccentricity = (cometAphelionAU - cometPerihelionAU) / (cometAphelionAU + cometAphelionAU);
  const cometData = {
    id: 'comet-1',
    name: 'Harbinger',
    type: CelestialType.COMET,
    parentId: sunId,
    seed: 'seed_harbinger_1017',
    realMass_kg: 1e13,
    realRadius_m: 5000,
    visualScaleRadius: 0.05, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: cometSemiMajorAxisAU * AU,
      eccentricity: cometEccentricity,
      inclination: 25 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: 0.1, // Start slightly past perihelion (radians)
      period_s: 1.15e9 // Approx 365 years (recalculated based on SMA)
    },
    temperature: 200, // Temperature near sun (variable)
    albedo: 0.04,
    properties: { // Renamed
      type: CelestialType.COMET,
      composition: ['water ice', 'dust', 'CO2', 'methane'],
      activity: 0.9, // Current activity level (0-1)
      // Visual properties
      visualComaRadius: 10, // Visual scale units
      visualComaColor: '#90EE90A0', // Light green with alpha
      visualMaxTailLength: 15.0 * SCALE.RENDER_SCALE_AU, // Max visual tail length in scaled units
      visualTailColor: '#ADD8E6A0', // Light blue with alpha
    } as CometProperties,
  };
  actions.addCelestial(cometData);

  // --- Oort Cloud --- The Veil (Outer boundary)
  const oortInnerAU = 2000;
  const oortOuterAU = 50000;
  const oortData = {
      id: 'oort-cloud-1',
      name: 'The Veil',
      type: CelestialType.OORT_CLOUD,
      parentId: sunId,
      seed: 'seed_oort_1018',
      realMass_kg: 1e25, // Estimated total mass
      realRadius_m: oortOuterAU * AU, // Outer boundary
      orbitalParameters: { // Placeholder for the cloud center
          realSemiMajorAxis_m: (oortInnerAU + oortOuterAU) / 2 * AU,
          eccentricity: 0, inclination: 0, longitudeOfAscendingNode: 0, argumentOfPeriapsis: 0, meanAnomaly: 0, period_s: 1e13
      },
      temperature: 10, // K
      ignorePhysics: true, // Exclude from physics calculations
      properties: { // Renamed
          type: CelestialType.OORT_CLOUD,
          composition: ['ice', 'ammonia', 'methane'],
          innerRadiusAU: oortInnerAU,
          outerRadiusAU: oortOuterAU,
          visualDensity: 1e-9, // For rendering
          visualParticleCount: 20000,
          visualParticleColor: '#E6E6FA' // Lavender tint
      } as OortCloudProperties,
  };
  actions.addCelestial(oortData);

  return sunId; // Return primary star ID
}

// --- 70 Virginis System ---
export function initialize70VirSystem(): string {
  const starData = {
    id: 'star-70vir',
    name: '70 Virginis',
    type: CelestialType.STAR,
    seed: 'seed_70vir_star_1019',
    realMass_kg: 1.09 * SOLAR_MASS,
    realRadius_m: 1.94 * SOLAR_RADIUS,
    visualScaleRadius: 19, // Fixed property name
    temperature: 5473,
    albedo: 0.3, // Placeholder
    orbitalParameters: { // Placeholder for single star
        realSemiMajorAxis_m: 0, eccentricity: 0, inclination: 0, longitudeOfAscendingNode: 0, argumentOfPeriapsis: 0, meanAnomaly: 0, period_s: 0
    },
    properties: { // Renamed
      type: CelestialType.STAR,
      starName: '70 Virginis',
      isMainStar: true,
      spectralClass: 'G4V',
      luminosity: 3.05,
      color: '#FFFACD',
      stellarType: StellarType.MAIN_SEQUENCE_G,
    } as StarProperties,
  };
  const starId = actions.createSolarSystem(starData);

  // --- Exoplanet 70 Virginis b ---
  const seventyVirBSMA_AU = 0.484;
  const planetData = {
    id: 'planet-70vir-b',
    name: '70 Virginis b',
    type: CelestialType.GAS_GIANT,
    parentId: starId,
    seed: 'seed_70vir_b_1020',
    realMass_kg: 7.4 * JUPITER_MASS,
    realRadius_m: 1.1 * 69911000, // Estimated radius
    visualScaleRadius: 2.5, // Fixed property name
    orbitalParameters: {
      realSemiMajorAxis_m: seventyVirBSMA_AU * AU,
      eccentricity: 0.41,
      inclination: 5 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 116.6926 * 24 * 3600
    },
    temperature: 830, // K
    albedo: 0.1,
    properties: { // Renamed
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_IV,
      atmosphereColor: '#FF7F50',
      cloudColor: '#FFE4B5',
      cloudSpeed: 150,
      emissiveColor: '#FF4500',
      emissiveIntensity: 0.2
    } as GasGiantProperties,
  };
  actions.addCelestial(planetData);

  // --- Dust Disc ---
  const dustDiscInnerAU = 3.4;
  const dustDiscOuterAU = 16.5;
  const dustDiscData = {
      id: 'dust-disc-70vir',
      name: '70 Vir Dust Disc',
      type: CelestialType.ASTEROID_FIELD,
      parentId: starId,
      seed: 'seed_70vir_dust_1021',
      realMass_kg: 1e-5 * SOLAR_MASS,
      realRadius_m: dustDiscOuterAU * AU,
      orbitalParameters: { // Orbit of the disc center
          realSemiMajorAxis_m: (dustDiscInnerAU + dustDiscOuterAU) / 2 * AU,
          eccentricity: 0.05,
          inclination: 3 * DEG_TO_RAD,
          longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
          argumentOfPeriapsis: Math.random() * 2 * Math.PI,
          meanAnomaly: Math.random() * 2 * Math.PI,
          period_s: 4e8 // Approx 12 years
      },
      temperature: 100, // K
      properties: { // Renamed
          type: CelestialType.ASTEROID_FIELD,
          innerRadiusAU: dustDiscInnerAU,
          outerRadiusAU: dustDiscOuterAU,
          heightAU: 0.2, // Relatively thin disc
          count: 5000,
          color: '#A0522D',
          composition: ['dust', 'ice'],
          visualDensity: 10,
      } as AsteroidFieldProperties,
  };
  actions.addCelestial(dustDiscData);

  return starId;
} 