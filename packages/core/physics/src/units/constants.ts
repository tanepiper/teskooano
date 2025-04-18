/**
 * Core physical constants for the simulation
 */

// Gravitational constant (G) in m^3 kg^-1 s^-2
export const GRAVITATIONAL_CONSTANT = 6.67430e-11;

// Mass of the Sun in kg
export const SOLAR_MASS = 1.989e30;

// Astronomical Unit (AU) in meters
export const AU = 1.496e11;

// Kilometers in meters
export const KM = 1000;

// Visual scale: Conversion factor from Astronomical Units (AU) to simulation units.
// Represents how many simulation distance units correspond to 1 AU.
// export const VISUAL_AU_SCALE = 1000;

// Radius of the Sun in meters
export const SOLAR_RADIUS = 6.957e8;

// Earth's orbital period in seconds (1 year)
export const EARTH_ORBITAL_PERIOD = 365.25 * 24 * 60 * 60;

// Earth's mass in kg
export const EARTH_MASS = 5.972e24;

// Earth's radius in meters
export const EARTH_RADIUS = 6.371e6;

// Jupiter's mass in kg
export const JUPITER_MASS = 1.898e27;

// Jupiter's radius in meters
export const JUPITER_RADIUS = 6.9911e7;

// Speed of light in m/s
export const SPEED_OF_LIGHT = 2.99792458e8;

// Simulation limits to prevent numerical instability (Consider moving to simulation package?)
export const MAX_FORCE = 1e25; // Maximum force magnitude
export const MAX_VELOCITY = 1e7; // Maximum velocity magnitude (m/s)

// Conversion factor from degrees to radians - MOVED to math/constants.ts
// export const DEG_TO_RAD = Math.PI / 180; 