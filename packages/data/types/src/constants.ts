/**
 * Centralized physical constants, SI units, and astronomical measurements
 *
 * This file serves as the single source of truth for all physical constants
 * and measurements used throughout the Open Space engine. All packages should
 * import from this file rather than defining their own constants.
 */

// ============================================================================
// FUNDAMENTAL PHYSICAL CONSTANTS (SI Units)
// ============================================================================

/** Gravitational constant in m³/(kg·s²) */
export const GRAVITATIONAL_CONSTANT = 6.6743e-11;

/** Speed of light in m/s */
export const SPEED_OF_LIGHT = 2.99792458e8;

/** Planck constant in J·s */
export const PLANCK_CONSTANT = 6.62607015e-34;

/** Boltzmann constant in J/K */
export const BOLTZMANN_CONSTANT = 1.380649e-23;

/** Stefan-Boltzmann constant in W/(m²·K⁴) */
export const STEFAN_BOLTZMANN_CONSTANT = 5.670374419e-8;

// ============================================================================
// ASTRONOMICAL UNITS AND MEASUREMENTS
// ============================================================================

/** Astronomical Unit in meters (average distance from Earth to Sun) */
export const AU_METERS = 149597870700;

/** Light year in meters */
export const LIGHT_YEAR_METERS = 9.4607304725808e15;

/** Parsec in meters */
export const PARSEC_METERS = 3.085677581491367e16;

/** Solar mass in kilograms */
export const SOLAR_MASS = 1.989e30;

/** Solar radius in meters */
export const SOLAR_RADIUS = 6.957e8;

/** Solar luminosity in watts */
export const SOLAR_LUMINOSITY = 3.828e26;

/** Earth mass in kilograms */
export const EARTH_MASS = 5.972e24;

/** Earth radius in meters */
export const EARTH_RADIUS = 6.371e6;

/** Earth's gravitational parameter (μ = GM) in m³/s² */
export const EARTH_GRAVITATIONAL_PARAMETER = 3.986e14;

/** Earth orbital period in seconds (sidereal year) */
export const EARTH_ORBITAL_PERIOD = 365.256363004 * 24 * 60 * 60;

/** Jupiter mass in kilograms */
export const JUPITER_MASS = 1.898e27;

/** Jupiter radius in meters */
export const JUPITER_RADIUS = 6.9911e7;

// ============================================================================
// CONVERSION FACTORS
// ============================================================================

/** Kilometers to meters */
export const KM = 1000;

/** Megameters to meters */
export const MM = 1e6;

/** Gigameters to meters */
export const GM = 1e9;

/** Terameters to meters */
export const TM = 1e12;

/** Petameters to meters */
export const PM = 1e15;

/** Days to seconds */
export const DAYS_TO_SECONDS = 24 * 60 * 60;

/** Years to seconds (Julian year) */
export const YEARS_TO_SECONDS = 365.25 * 24 * 60 * 60;

/** Seconds in a minute */
export const SECONDS_PER_MINUTE = 60;

/** Seconds in an hour */
export const SECONDS_PER_HOUR = 3600;

/** Seconds in a day */
export const SECONDS_PER_DAY = 86400;

/** Seconds in a year (Julian year) */
export const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

/** Seconds in a year (Gregorian approximation) */
export const SECONDS_PER_YEAR_GREGORIAN = 31536000;

// ============================================================================
// SIMULATION LIMITS AND CONSTRAINTS
// ============================================================================

/** Maximum force magnitude to prevent numerical instability (N) */
export const MAX_FORCE = 1e25;

/** Maximum velocity magnitude to prevent numerical instability (m/s) */
export const MAX_VELOCITY = 1e7;

/** Minimum mass for stable physics calculations (kg) */
export const MIN_MASS = 1e10;

/** Maximum mass for stable physics calculations (kg) */
export const MAX_MASS = 1e35;

/** Minimum distance for collision detection (m) */
export const MIN_COLLISION_DISTANCE = 1e3;

/** Maximum distance for physics calculations (m) */
export const MAX_PHYSICS_DISTANCE = 1e20;

// ============================================================================
// RENDERING AND VISUALIZATION CONSTANTS
// ============================================================================

/** Default field of view for cameras (degrees) */
export const DEFAULT_FOV = 75;

/** Minimum field of view (degrees) */
export const MIN_FOV = 10;

/** Maximum field of view (degrees) */
export const MAX_FOV = 120;

/** Default near clipping plane */
export const DEFAULT_NEAR = 0.1;

/** Default far clipping plane */
export const DEFAULT_FAR = 10000;

/** Default camera movement speed */
export const DEFAULT_CAMERA_SPEED = 1.0;

/** Default camera rotation speed */
export const DEFAULT_CAMERA_ROTATION_SPEED = 0.5;

/** Default camera zoom speed */
export const DEFAULT_CAMERA_ZOOM_SPEED = 1.0;

// ============================================================================
// TIME AND ANIMATION CONSTANTS
// ============================================================================

/** Default simulation time step (seconds) */
export const DEFAULT_TIME_STEP = 1.0;

/** Minimum time step (seconds) */
export const MIN_TIME_STEP = 0.001;

/** Maximum time step (seconds) */
export const MAX_TIME_STEP = 86400; // 1 day

/** Default time scale multiplier */
export const DEFAULT_TIME_SCALE = 1.0;

/** Minimum time scale */
export const MIN_TIME_SCALE = 0.001;

/** Maximum time scale */
export const MAX_TIME_SCALE = 1000000;

// ============================================================================
// PERFORMANCE AND OPTIMIZATION CONSTANTS
// ============================================================================

/** Target frame rate for performance calculations */
export const TARGET_FPS = 60;

/** Minimum frame rate before performance degradation */
export const MIN_FPS = 30;

/** Maximum number of celestial objects for stable performance */
export const MAX_CELESTIAL_OBJECTS = 80;

/** Maximum number of particles for asteroid fields */
export const MAX_PARTICLES = 10000;

/** Maximum number of trail points per object */
export const MAX_TRAIL_POINTS = 1000;

/** Distance threshold for LOD transitions (scene units) */
export const LOD_DISTANCE_THRESHOLD = 1000;

// ============================================================================
// PHYSICAL PROPERTY RANGES
// ============================================================================

/** Minimum stellar temperature (K) */
export const MIN_STELLAR_TEMPERATURE = 2000;

/** Maximum stellar temperature (K) */
export const MAX_STELLAR_TEMPERATURE = 50000;

/** Minimum planetary temperature (K) */
export const MIN_PLANETARY_TEMPERATURE = 50;

/** Maximum planetary temperature (K) */
export const MAX_PLANETARY_TEMPERATURE = 3000;

/** Minimum albedo (reflectivity) */
export const MIN_ALBEDO = 0.0;

/** Maximum albedo (reflectivity) */
export const MAX_ALBEDO = 1.0;

/** Minimum orbital eccentricity */
export const MIN_ECCENTRICITY = 0.0;

/** Maximum orbital eccentricity (hyperbolic) */
export const MAX_ECCENTRICITY = 2.0;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert astronomical units to meters
 */
export function auToMeters(au: number): number {
  return au * AU_METERS;
}

/**
 * Convert meters to astronomical units
 */
export function metersToAu(meters: number): number {
  return meters / AU_METERS;
}

/**
 * Convert light years to meters
 */
export function lightYearsToMeters(ly: number): number {
  return ly * LIGHT_YEAR_METERS;
}

/**
 * Convert meters to light years
 */
export function metersToLightYears(meters: number): number {
  return meters / LIGHT_YEAR_METERS;
}

/**
 * Convert parsecs to meters
 */
export function parsecsToMeters(pc: number): number {
  return pc * PARSEC_METERS;
}

/**
 * Convert meters to parsecs
 */
export function metersToParsecs(meters: number): number {
  return meters / PARSEC_METERS;
}

/**
 * Convert solar masses to kilograms
 */
export function solarMassesToKg(solarMasses: number): number {
  return solarMasses * SOLAR_MASS;
}

/**
 * Convert kilograms to solar masses
 */
export function kgToSolarMasses(kg: number): number {
  return kg / SOLAR_MASS;
}

/**
 * Convert solar radii to meters
 */
export function solarRadiiToMeters(solarRadii: number): number {
  return solarRadii * SOLAR_RADIUS;
}

/**
 * Convert meters to solar radii
 */
export function metersToSolarRadii(meters: number): number {
  return meters / SOLAR_RADIUS;
}

/**
 * Convert days to seconds
 */
export function daysToSeconds(days: number): number {
  return days * DAYS_TO_SECONDS;
}

/**
 * Convert seconds to days
 */
export function secondsToDays(seconds: number): number {
  return seconds / DAYS_TO_SECONDS;
}

/**
 * Convert years to seconds
 */
export function yearsToSeconds(years: number): number {
  return years * YEARS_TO_SECONDS;
}

/**
 * Convert seconds to years
 */
export function secondsToYears(seconds: number): number {
  return seconds / YEARS_TO_SECONDS;
}
