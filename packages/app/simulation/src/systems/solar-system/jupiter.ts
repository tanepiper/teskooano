import { DEG_TO_RAD, OSVector3 } from '@teskooano/core-math';
import { AU, KM } from '@teskooano/core-physics';
import { actions } from '@teskooano/core-state';
import { CelestialType, GasGiantClass, IceSurfaceProperties, LavaSurfaceProperties, PlanetType, RockyType, SurfaceType, type GasGiantProperties } from '@teskooano/data-types';

// --- Jupiter Constants (NASA Planetary Fact Sheet / JPL HORIZONS J2000) ---
const JUPITER_REAL_MASS_KG = 1.89819e27; // More precise mass
const JUPITER_REAL_RADIUS_M = 69911000; // Equatorial radius (volumetric mean is slightly different)
const JUPITER_TEMP_K = 165; // 1 bar level temperature
const JUPITER_ALBEDO = 0.538; // Geometric Albedo
const JUPITER_SMA_AU = 5.2044;
const JUPITER_ECC = 0.0489;
const JUPITER_INC_DEG = 1.305;
const JUPITER_LAN_DEG = 100.464;
const JUPITER_AOP_DEG = 14.331 + JUPITER_LAN_DEG; // Longitude of Perihelion = AOP + LAN
const JUPITER_MA_DEG = 34.351; // Mean Anomaly at J2000 Epoch
const JUPITER_SIDEREAL_PERIOD_S = 3.74336e8; // Sidereal Orbit Period (~11.86 years)
const JUPITER_AXIAL_TILT_DEG = 3.13;

// --- Io Constants ---
const IO_MASS_KG = 8.9319e22;
const IO_RADIUS_M = 1821600;
const IO_SMA_M = 421700 * KM;
const IO_ECC = 0.0041;
const IO_INC_DEG = 0.050; // Relative to Jupiter's equator
const IO_SIDEREAL_PERIOD_S = 152854; // ~1.769 days
const IO_ALBEDO = 0.63;

// --- Europa Constants ---
const EUROPA_MASS_KG = 4.7998e22;
const EUROPA_RADIUS_M = 1560800;
const EUROPA_SMA_M = 671034 * KM;
const EUROPA_ECC = 0.0094;
const EUROPA_INC_DEG = 0.471; // Relative to Jupiter's equator
const EUROPA_SIDEREAL_PERIOD_S = 306822; // ~3.551 days
const EUROPA_ALBEDO = 0.67;

// --- Ganymede Constants ---
const GANYMEDE_MASS_KG = 1.4819e23;
const GANYMEDE_RADIUS_M = 2631200;
const GANYMEDE_SMA_M = 1070412 * KM;
const GANYMEDE_ECC = 0.0013;
const GANYMEDE_INC_DEG = 0.204; // Relative to Jupiter's equator
const GANYMEDE_SIDEREAL_PERIOD_S = 618153; // ~7.155 days
const GANYMEDE_ALBEDO = 0.43;

// --- Callisto Constants ---
const CALLISTO_MASS_KG = 1.0759e23;
const CALLISTO_RADIUS_M = 2410300;
const CALLISTO_SMA_M = 1882709 * KM;
const CALLISTO_ECC = 0.0074;
const CALLISTO_INC_DEG = 0.205; // Relative to Jupiter's equator
const CALLISTO_SIDEREAL_PERIOD_S = 1441902; // ~16.689 days
const CALLISTO_ALBEDO = 0.17;

/**
 * Initializes Jupiter and its Galilean moons using accurate data.
 */
export function initializeJupiter(parentId: string): void {
  const jupiterId = 'jupiter'; // Define Jupiter's ID

  // --- Initialize Jupiter ---
  actions.addCelestial({
    id: jupiterId,
    name: 'Jupiter',
    seed: 'jupiter',
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: JUPITER_REAL_MASS_KG,
    realRadius_m: JUPITER_REAL_RADIUS_M,
    visualScaleRadius: 11.2, // Approx visual scale relative to Earth
    temperature: JUPITER_TEMP_K,
    albedo: JUPITER_ALBEDO,
    siderealRotationPeriod_s: JUPITER_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(JUPITER_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(JUPITER_AXIAL_TILT_DEG * DEG_TO_RAD)
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: JUPITER_SMA_AU * AU,
      eccentricity: JUPITER_ECC,
      inclination: JUPITER_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: JUPITER_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (JUPITER_AOP_DEG - JUPITER_LAN_DEG) * DEG_TO_RAD, // Calculate AOP from Lon of Peri
      meanAnomaly: JUPITER_MA_DEG * DEG_TO_RAD,
      period_s: JUPITER_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_I,
      atmosphereColor: '#D8C8A8', // Tan/beige cloud bands
      cloudColor: '#FFFFFF', // White zones
      cloudSpeed: 100, // Representative wind speed (m/s)
      stormColor: '#B7410E', // Great Red Spot color
      stormSpeed: 50,
      rings: [
        { // Faint main ring
          innerRadius: 1.72 * JUPITER_REAL_RADIUS_M, // Approx 122,500 km
          outerRadius: 1.81 * JUPITER_REAL_RADIUS_M, // Approx 129,000 km
          density: 0.05,
          opacity: 0.05,
          color: '#A0522D', // Dusty brown
          type: RockyType.DUST,
        },
        { // Halo ring (inner, toroidal)
          innerRadius: 1.29 * JUPITER_REAL_RADIUS_M, // Approx 92,000 km
          outerRadius: 1.72 * JUPITER_REAL_RADIUS_M, // Approx 122,500 km
          density: 0.01,
          opacity: 0.02,
          color: '#A0522D', // Faint dust
          type: RockyType.DUST,
        }
        // Gossamer rings are even fainter
      ],
      axialTiltDeg: JUPITER_AXIAL_TILT_DEG,
    } as GasGiantProperties,
  });

  // --- Initialize Io ---
  actions.addCelestial({
    id: 'io',
    name: 'Io',
    seed: 'io_seed_1769',
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: IO_MASS_KG,
    realRadius_m: IO_RADIUS_M,
    visualScaleRadius: 0.29, // Relative visual scale
    temperature: 110, // Average surface K (volcanically heated)
    albedo: IO_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: IO_SMA_M,
      eccentricity: IO_ECC,
      inclination: IO_INC_DEG * DEG_TO_RAD, // Relative to Jupiter equator
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI, // Often randomized for moons
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: IO_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ['SO2'], // Thin sulfur dioxide atmosphere
      pressure: 1e-9,
      color: '#FFFF0030' // Faint yellow tint, near transparent
    },
    surface: {
      type: SurfaceType.VOLCANIC,
      planetType: PlanetType.LAVA, // Representative surface type
      color: '#FFFFA0', // Yellow/orange/white/black mottled surface
      lavaColor: '#FF4500',
      roughness: 0.5,
      rockColor: '#303030',
    } as LavaSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ['sulfur compounds', 'silicates', 'iron core'],
    },
  });

  // --- Initialize Europa ---
  actions.addCelestial({
    id: 'europa',
    name: 'Europa',
    seed: 'europa_seed_3551',
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: EUROPA_MASS_KG,
    realRadius_m: EUROPA_RADIUS_M,
    visualScaleRadius: 0.25, // Relative visual scale
    temperature: 102, // Average surface K
    albedo: EUROPA_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: EUROPA_SMA_M,
      eccentricity: EUROPA_ECC,
      inclination: EUROPA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: EUROPA_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ['O2'], // Very thin oxygen atmosphere
      pressure: 1e-11,
      color: '#FFFFFF00' // Transparent
    },
    surface: {
      type: SurfaceType.ICE_CRACKED,
      planetType: PlanetType.ICE,
      color: '#F0F8FF', // Alice blue / off-white ice
      roughness: 0.3,
      glossiness: 0.6,
      color1: '#F0F8FF', // Ice base
      color2: '#ADD8E6', // Light blue cracks/features
      color3: '#FFE4B5', // Brownish deposits (Moccasin)
      color4: '#FFFFFF', // Bright ice
      color5: '#D2B48C', // Tan deposits
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ['water ice shell', 'silicate mantle', 'iron core', 'subsurface ocean'],
    },
  });

  // --- Initialize Ganymede ---
  actions.addCelestial({
    id: 'ganymede',
    name: 'Ganymede',
    seed: 'ganymede_seed_7155',
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: GANYMEDE_MASS_KG,
    realRadius_m: GANYMEDE_RADIUS_M,
    visualScaleRadius: 0.41, // Largest moon
    temperature: 110, // Average surface K
    albedo: GANYMEDE_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: GANYMEDE_SMA_M,
      eccentricity: GANYMEDE_ECC,
      inclination: GANYMEDE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: GANYMEDE_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ['O2'], // Very thin oxygen atmosphere
      pressure: 1e-12,
      color: '#FFFFFF00' // Transparent
    },
    surface: {
      type: SurfaceType.ICE_FLATS, // Changed: Represent mix of dark/light terrain
      planetType: PlanetType.ICE,
      color: '#D3D3D3', // Light grey base (bright terrain)
      secondaryColor: '#A9A9A9', // Dark grey (dark terrain)
      roughness: 0.4,
      glossiness: 0.5,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ['water ice', 'silicates', 'iron core', 'possible subsurface ocean'],
    },
  });

  // --- Initialize Callisto ---
  actions.addCelestial({
    id: 'callisto',
    name: 'Callisto',
    seed: 'callisto_seed_16689',
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: CALLISTO_MASS_KG,
    realRadius_m: CALLISTO_RADIUS_M,
    visualScaleRadius: 0.38, // Slightly smaller than Ganymede
    temperature: 134, // Average surface K
    albedo: CALLISTO_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: CALLISTO_SMA_M,
      eccentricity: CALLISTO_ECC,
      inclination: CALLISTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: CALLISTO_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ['CO2', 'O2'], // Very thin atmosphere
      pressure: 7.5e-12,
      color: '#FFFFFF00' // Transparent
    },
    surface: {
      type: SurfaceType.ICE_CRACKED, // Changed: Heavily cratered ancient ICE surface
      planetType: PlanetType.ICE, // Primarily ice/rock mix
      color: '#A9A9A9', // Dark grey ice
      roughness: 0.8,
      glossiness: 0.2, // Ice is somewhat glossy, but old/dirty
      color1: '#696969', // Dimgrey
      color2: '#808080', // Grey
      color3: '#A9A9A9', // Darkgrey
      color4: '#BEBEBE', // Lightgrey
      color5: '#FFFFFF', // White crater ejecta highlights
    } as IceSurfaceProperties, // Changed: Use IceSurfaceProperties
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ['ice', 'rock', 'possible subsurface ocean'],
    },
  });
} 