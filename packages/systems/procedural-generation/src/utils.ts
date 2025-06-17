import {
  CelestialType,
  ExoticStellarType,
  GRAVITATIONAL_CONSTANT,
  GasGiantClass,
  PlanetType,
  ProceduralSurfaceProperties,
  SpectralClass,
  StellarType,
} from "@teskooano/data-types";
import * as CONST from "./constants";

/**
 * Retrieves a random item from an array using a seeded random function.
 * @param arr The array to select an item from.
 * @param randomFn The seeded pseudo-random number generator function.
 * @returns A random item from the array, or `undefined` if the array is empty.
 */
export function getRandomItem<T>(arr: T[], randomFn: () => number): T {
  if (!arr || arr.length === 0) {
    return undefined as T;
  }
  return arr[Math.floor(randomFn() * arr.length)];
}

/**
 * Calculates the orbital period in seconds using Kepler's Third Law.
 * T = 2 * PI * sqrt(a^3 / (G * (M_parent + M_child)))
 * @param parentMass_kg Mass of the parent body (kg).
 * @param semiMajorAxis_m Semi-major axis of the orbit (m).
 * @param childMass_kg Mass of the orbiting body (kg). This is often negligible
 *   for planets around stars but is important for binary systems.
 * @returns The orbital period in seconds (s), or 0 if inputs are invalid.
 */
export function calculateOrbitalPeriod_s(
  parentMass_kg: number,
  semiMajorAxis_m: number,
  childMass_kg: number = 0,
): number {
  if (parentMass_kg <= 0 || semiMajorAxis_m <= 0) {
    console.warn(
      `[calculateOrbitalPeriod] Invalid input: parentMass=${parentMass_kg}, sma=${semiMajorAxis_m}. Returning 0.`,
    );
    return 0;
  }
  const totalMass = parentMass_kg + childMass_kg;
  if (totalMass <= 0) {
    console.warn(
      `[calculateOrbitalPeriod] Total mass is non-positive: ${totalMass}. Returning 0.`,
    );
    return 0;
  }
  const mu = GRAVITATIONAL_CONSTANT * totalMass;
  const aCubed = semiMajorAxis_m ** 3;
  const termInsideSqrt = aCubed / mu;
  if (termInsideSqrt < 0) {
    console.warn(
      `[calculateOrbitalPeriod] Term inside sqrt is negative: ${termInsideSqrt}. Returning 0.`,
    );
    return 0;
  }
  const period = 2 * Math.PI * Math.sqrt(termInsideSqrt);
  return period;
}

/**
 * Calculates the radius of a sphere given its mass and average density.
 * @param mass_kg Mass of the sphere in kilograms.
 * @param density_kg_m3 Average density in kilograms per cubic meter.
 * @returns The calculated radius in meters.
 */
export function calculateRadius(
  mass_kg: number,
  density_kg_m3: number,
): number {
  if (density_kg_m3 <= 0) return 0;
  const volume_m3 = mass_kg / density_kg_m3;
  return Math.cbrt((3 * volume_m3) / (4 * Math.PI));
}

/**
 * Estimates the spectral class of a star based on its temperature.
 * @param temperature The star's surface temperature in Kelvin.
 * @returns The corresponding `SpectralClass` enum.
 */
export function getSpectralClass(temperature: number): SpectralClass {
  if (temperature >= 30000) return SpectralClass.O;
  if (temperature >= 10000) return SpectralClass.B;
  if (temperature >= 7500) return SpectralClass.A;
  if (temperature >= 6000) return SpectralClass.F;
  if (temperature >= 5200) return SpectralClass.G;
  if (temperature >= 3700) return SpectralClass.K;
  if (temperature >= 2400) return SpectralClass.M;
  return SpectralClass.M;
}

/**
 * Calculates the true luminosity of a star relative to the Sun, based on the
 * Stefan-Boltzmann law. This value is used for physics-based calculations
 * like determining celestial zones.
 *
 * @param radius_m The star's radius in meters.
 * @param temperature_k The star's surface temperature in Kelvin.
 * @returns The calculated luminosity relative to the Sun (L☉), without any
 *   visual multipliers.
 */
export function calculateStellarLuminosity(
  radius_m: number,
  temperature_k: number,
): number {
  if (radius_m <= 0 || temperature_k <= 0) return 0;
  const surfaceArea = 4 * Math.PI * radius_m ** 2;
  const totalPowerWatts =
    surfaceArea * CONST.STEFAN_BOLTZMANN * temperature_k ** 4;
  return totalPowerWatts / CONST.SOLAR_LUMINOSITY;
}

/**
 * Calculates a visually-enhanced luminosity of a star.
 * This includes an artificial multiplier to make brightness differences more
 * apparent in the renderer and should not be used for physics calculations.
 *
 * @param radius_m The star's radius in meters.
 * @param temperature_k The star's surface temperature in Kelvin.
 * @param luminosity_multiplier An artificial multiplier to enhance visual brightness.
 * @returns The calculated visual luminosity relative to the Sun (L☉).
 */
export function calculateVisualLuminosity(
  radius_m: number,
  temperature_k: number,
  luminosity_multiplier: number = 750,
): number {
  const stellarLuminosity = calculateStellarLuminosity(radius_m, temperature_k);
  return stellarLuminosity * luminosity_multiplier;
}

/**
 * Gets a representative star color as a hex string based on its temperature.
 * @param temperature The star's surface temperature in Kelvin.
 * @returns A hex color string (e.g., "#aaccff").
 */
export function getStarColor(temperature: number): string {
  if (temperature >= 25000) return "#aaccff";
  if (temperature >= 10000) return "#cadfff";
  if (temperature >= 7500) return "#fbf8ff";
  if (temperature >= 6000) return "#fff4f3";
  if (temperature >= 5200) return "#fffadc";
  if (temperature >= 3700) return "#ffddb4";
  if (temperature >= 2400) return "#ffbd6f";
  return "#ffae57";
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

/**
 * @internal
 * Converts an RGB color array to a hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .padStart(6, "0")
  );
}

/**
 * Blends two hex colors together by a given factor.
 * @param colorAHex The first color as a hex string.
 * @param colorBHex The second color as a hex string.
 * @param factor The blend factor (0-1). 0 returns colorA, 1 returns colorB.
 * @returns The resulting blended hex color string.
 */
export function mixColors(
  colorAHex: string,
  colorBHex: string,
  factor: number,
): string {
  const colorA = hexToRgb(colorAHex);
  const colorB = hexToRgb(colorBHex);

  if (!colorA || !colorB) {
    console.warn(
      "[mixColors] Failed to parse one or both hex colors:",
      colorAHex,
      colorBHex,
    );
    return colorAHex;
  }

  const clampedFactor = Math.max(0, Math.min(1, factor));
  const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * clampedFactor);
  const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * clampedFactor);
  const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * clampedFactor);

  return rgbToHex(r, g, b);
}

/**
 * Ignores albedo and greenhouse effects for simplicity, intended for initial
 * classification rather than precise physics.
 *
 * @param starLuminosity Luminosity of the star relative to the Sun (L☉).
 * @param distanceAU Distance from the star in Astronomical Units (AU).
 * @returns The estimated equilibrium temperature in Kelvin (K).
 */
export function estimateTemperature(
  starLuminosity: number,
  distanceAU: number,
): number {
  if (distanceAU <= 0) return 10000;

  const luminosityWatts = starLuminosity * CONST.SOLAR_LUMINOSITY;
  const distanceMeters = distanceAU * CONST.AU_TO_METERS;

  const denominator =
    16 * Math.PI * CONST.STEFAN_BOLTZMANN * distanceMeters ** 2;
  if (denominator <= 0) return 0;

  const tempKelvin = Math.pow(luminosityWatts / denominator, 0.25);

  return Math.max(0, tempKelvin);
}

/**
 * Classifies a gas giant based on its estimated temperature, using a simplified
 * version of the Sudan classification system.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param distanceAU The planet's distance from its star in AU.
 * @param starTemperature The temperature of the parent star in Kelvin.
 * @param starRadius The radius of the parent star in meters.
 * @returns The `GasGiantClass` enum (e.g., CLASS_I, CLASS_V).
 */
export function classifyGasGiantByTemperature(
  random: () => number,
  distanceAU: number,
  starTemperature: number,
  starRadius: number,
): GasGiantClass {
  const starLuminosity = calculateStellarLuminosity(
    starRadius,
    starTemperature,
  );
  const estimatedTemp = estimateTemperature(starLuminosity, distanceAU);

  const CLASS_V_THRESHOLD = 1000;
  const CLASS_II_THRESHOLD = 250;
  const CLASS_I_THRESHOLD = 150;

  if (estimatedTemp >= CLASS_V_THRESHOLD) {
    return GasGiantClass.CLASS_V;
  } else if (estimatedTemp >= CLASS_II_THRESHOLD) {
    return GasGiantClass.CLASS_II;
  } else if (estimatedTemp >= CLASS_I_THRESHOLD) {
    return GasGiantClass.CLASS_I;
  } else {
    return getRandomItem(
      [GasGiantClass.CLASS_III, GasGiantClass.CLASS_IV],
      random,
    );
  }
}

/**
 * Calculates a realistic albedo value for a planet based on its type.
 * @param planetType The type of the planet.
 * @param random A seeded random number generator.
 * @returns A value between 0 and 1 representing the planet's albedo.
 */
export function calculateAlbedo(
  celestialType: CelestialType,
  planetType: PlanetType | GasGiantClass | StellarType | ExoticStellarType,
  random: () => number,
): number {
  let baseAlbedo: number = 0.3;
  let range: number = 0;

  if (
    celestialType === CelestialType.PLANET ||
    celestialType === CelestialType.MOON
  ) {
    switch (planetType as PlanetType) {
      case PlanetType.ICE:
        baseAlbedo = 0.75;
        range = 0.25;
        break;
      case PlanetType.TERRESTRIAL:
        baseAlbedo = 0.5;
        range = 0.25; //
        break;
      case PlanetType.ROCKY:
        baseAlbedo = 0.25;
        range = 0.25;
        break;
      case PlanetType.BARREN:
        baseAlbedo = 0.1;
        range = 0.1;
        break;
      case PlanetType.LAVA:
        baseAlbedo = 0.4;
        range = 0.05;
        break;
      default:
        baseAlbedo = 0.3;
        range = 0;
    }
  }

  if (celestialType === CelestialType.GAS_GIANT) {
    switch (planetType as GasGiantClass) {
      case GasGiantClass.CLASS_I: // Ammonia clouds (Jupiter-like)
        baseAlbedo = 0.5;
        range = 0.1; // 0.3 - 0.4
        break;
      case GasGiantClass.CLASS_II: // Water clouds
        baseAlbedo = 0.7;
        range = 0.2;
        break;
      case GasGiantClass.CLASS_III: // Clear
        baseAlbedo = 0.3;
        range = 0.1;
        break;
      case GasGiantClass.CLASS_IV: // Alkali metals
        baseAlbedo = 0.4;
        range = 0.1;
        break;
      case GasGiantClass.CLASS_V: // Silicate clouds (Hot Jupiters)
        baseAlbedo = 0.7;
        range = 0.05; // 0.05 - 0.1 (very dark)
        break; // Fixed fallthrough
      default:
        baseAlbedo = 0.3;
        range = 0;
        break;
    }
  }

  if (celestialType === CelestialType.STAR) {
    // For stars, "albedo" is a proxy for billboard brightness
    switch (planetType as StellarType) {
      case StellarType.MAIN_SEQUENCE:
      case StellarType.MAIN_SEQUENCE_G:
        baseAlbedo = 0.4;
        range = 0.2; // 0.4 - 0.6
        break;
      case StellarType.WOLF_RAYET:
        baseAlbedo = 0.8;
        range = 0.15; // 0.8 - 0.95 (Extremely bright)
        break;
      case StellarType.NEUTRON_STAR:
        baseAlbedo = 0.7;
        range = 0.2; // 0.7 - 0.9 (Intensely bright spots)
        break;
      case StellarType.BLACK_HOLE:
      case StellarType.KERR_BLACK_HOLE:
        baseAlbedo = 0.01;
        range = 0.04; // 0.01 - 0.05 (Nearly black)
        break;
      case StellarType.WHITE_DWARF:
        baseAlbedo = 0.6;
        range = 0.2; // 0.6 - 0.8 (Very bright for its size)
        break;
      default:
        baseAlbedo = 0.3;
        range = 0;
        break;
    }
  }

  return (baseAlbedo + random() * range) * 2;
}
