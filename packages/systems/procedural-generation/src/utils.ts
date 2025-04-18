import * as CONST from "./constants";
import {
  GRAVITATIONAL_CONSTANT,
  GasGiantClass,
  // Add necessary types for surface properties
  PlanetType,
  SurfaceType,
  SurfacePropertiesUnion,
  ProceduralSurfaceProperties,
  DesertSurfaceProperties,
  LavaSurfaceProperties,
  OceanSurfaceProperties,
  IceSurfaceProperties,
  SpectralClass,
} from "@teskooano/data-types";

// --- Utility Functions ---

/**
 * Gets a random item from an array using the provided random function.
 */
export function getRandomItem<T>(arr: T[], randomFn: () => number): T {
  if (!arr || arr.length === 0) {
    // Handle empty array case if necessary, perhaps return a default or throw error
    // For now, returning undefined, but this might need adjustment based on usage
    return undefined as T;
  }
  return arr[Math.floor(randomFn() * arr.length)];
}

/**
 * Calculates the orbital period in seconds using Kepler's Third Law.
 * T = 2 * PI * sqrt(a^3 / (G * (M_parent + M_child)))
 * @param parentMass_kg Mass of the parent body (kg).
 * @param semiMajorAxis_m Semi-major axis of the orbit (m).
 * @param childMass_kg Mass of the orbiting body (kg) - often negligible for planets around stars.
 * @returns The orbital period in seconds (s).
 */
export function calculateOrbitalPeriod_s(
  parentMass_kg: number,
  semiMajorAxis_m: number,
  childMass_kg: number = 0, // Default child mass to 0 if negligible
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
 * Gets a random number within a specified range using the provided random function.
 */
export function getRandomInRange(
  min: number,
  max: number,
  randomFn: () => number,
): number {
  return min + randomFn() * (max - min);
}

/**
 * Calculates the radius of a sphere given its mass and average density.
 */
export function calculateRadius(
  mass_kg: number,
  density_kg_m3: number,
): number {
  if (density_kg_m3 <= 0) return 0; // Avoid division by zero or negative density
  const volume_m3 = mass_kg / density_kg_m3;
  return Math.cbrt((3 * volume_m3) / (4 * Math.PI));
}

/**
 * Estimates the spectral class of a star based on its temperature (simplified).
 */
export function getSpectralClass(temperature: number): SpectralClass {
  if (temperature >= 30000) return SpectralClass.O;
  if (temperature >= 10000) return SpectralClass.B;
  if (temperature >= 7500) return SpectralClass.A;
  if (temperature >= 6000) return SpectralClass.F;
  if (temperature >= 5200) return SpectralClass.G; // Sun-like
  if (temperature >= 3700) return SpectralClass.K;
  if (temperature >= 2400) return SpectralClass.M;
  return SpectralClass.M; // Default to M for cooler temps
}

/**
 * Calculates the luminosity of a star relative to the Sun
 * using the Stefan-Boltzmann law (simplified).
 */
export function calculateLuminosity(
  radius_m: number,
  temperature_k: number,
): number {
  if (radius_m <= 0 || temperature_k <= 0) return 0;
  const surfaceArea = 4 * Math.PI * radius_m ** 2;
  const totalPowerWatts =
    surfaceArea * CONST.STEFAN_BOLTZMANN * temperature_k ** 4;
  return totalPowerWatts / CONST.SOLAR_LUMINOSITY; // Relative to Solar Luminosity (L☉)
}

/**
 * Gets a representative star color based on its temperature (simplified).
 */
export function getStarColor(temperature: number): string {
  if (temperature >= 25000) return "#aaccff"; // O/B - Blueish white
  if (temperature >= 10000) return "#cadfff"; // B - Light blue
  if (temperature >= 7500) return "#fbf8ff"; // A - White
  if (temperature >= 6000) return "#fff4f3"; // F - Yellowish white
  if (temperature >= 5200) return "#fffadc"; // G - Yellow (like Sun)
  if (temperature >= 3700) return "#ffddb4"; // K - Orange
  if (temperature >= 2400) return "#ffbd6f"; // M - Reddish orange
  return "#ffae57"; // Default for cooler M - Deeper orange/red
}

// --- Helper function to parse hex color to RGB array ---
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

// --- Helper function to format RGB array back to hex color ---
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .padStart(6, "0")
  );
}

// --- Helper function to interpolate between two hex colors ---
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
    return colorAHex; // Return original color on error
  }

  const clampedFactor = Math.max(0, Math.min(1, factor)); // Ensure factor is 0-1
  const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * clampedFactor);
  const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * clampedFactor);
  const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * clampedFactor);

  return rgbToHex(r, g, b);
}

/**
 * Estimates the equilibrium temperature of a planet.
 * Simplified: Ignores albedo and greenhouse effect for classification purposes.
 * @param starLuminosity Luminosity of the star (relative to Sun, L☉).
 * @param distanceAU Distance from the star (AU).
 * @returns Estimated equilibrium temperature (K).
 */
export function estimateTemperature(
  starLuminosity: number,
  distanceAU: number,
): number {
  if (distanceAU <= 0) return 10000; // Arbitrarily high temp if too close

  const luminosityWatts = starLuminosity * CONST.SOLAR_LUMINOSITY;
  const distanceMeters = distanceAU * CONST.AU_TO_METERS;

  // Simplified Stefan-Boltzmann T = (L / (16 * pi * sigma * d^2))^(1/4)
  const denominator =
    16 * Math.PI * CONST.STEFAN_BOLTZMANN * distanceMeters ** 2;
  if (denominator <= 0) return 0; // Avoid division by zero

  const tempKelvin = Math.pow(luminosityWatts / denominator, 0.25);

  return Math.max(0, tempKelvin); // Ensure temp is not negative
}

/**
 * Classifies a gas giant based on estimated temperature.
 * Uses simplified temperature thresholds based on Sudan classification.
 */
export function classifyGasGiantByTemperature(
  random: () => number, // Keep random for potential future use
  distanceAU: number,
  starTemperature: number,
  starRadius: number,
): GasGiantClass {
  const starLuminosity = calculateLuminosity(starRadius, starTemperature); // Use relative luminosity
  const estimatedTemp = estimateTemperature(starLuminosity, distanceAU);

  // Sudan Classification Temperature Thresholds (Approximate)
  const CLASS_V_THRESHOLD = 1000; // K (Hot Jupiters)
  const CLASS_II_THRESHOLD = 250; // K (Water Clouds)
  const CLASS_I_THRESHOLD = 150; // K (Ammonia Clouds)
  // Below Class I are generally Class III/IV (Ice Giants)

  if (estimatedTemp >= CLASS_V_THRESHOLD) {
    return GasGiantClass.CLASS_V;
  } else if (estimatedTemp >= CLASS_II_THRESHOLD) {
    return GasGiantClass.CLASS_II;
  } else if (estimatedTemp >= CLASS_I_THRESHOLD) {
    return GasGiantClass.CLASS_I;
  } else {
    // Colder than Class I - Treat as Ice Giant (Class III or IV)
    // Could add mass check here later if needed to distinguish III/IV
    return getRandomItem(
      [GasGiantClass.CLASS_III, GasGiantClass.CLASS_IV],
      random,
    );
  }
}

/**
 * Creates the appropriate detailed surface properties object based on planet and surface type.
 */
export function createDetailedSurfaceProperties(
  random: () => number,
  planetType: PlanetType,
  surfaceType: SurfaceType,
): SurfacePropertiesUnion {
  // Define base properties (will be spread)
  const baseProps = {
    type: surfaceType,
    roughness: random() * 0.5 + 0.2,
    // color and planetType assigned below
  };

  switch (planetType) {
    case PlanetType.ROCKY:
    case PlanetType.TERRESTRIAL:
    case PlanetType.BARREN:
      return {
        ...baseProps,
        planetType: planetType,
        color: getRandomItem(CONST.ROCKY_COLOR_BANDS.midLight, random),
        color1: getRandomItem(CONST.ROCKY_COLOR_BANDS.dark, random),
        color2: getRandomItem(CONST.ROCKY_COLOR_BANDS.midDark, random),
        color3: getRandomItem(CONST.ROCKY_COLOR_BANDS.midLight, random),
        color4: getRandomItem(CONST.ROCKY_COLOR_BANDS.light, random),
        color5: getRandomItem(CONST.ROCKY_COLOR_BANDS.highlight, random),
        transition2: 0.2 + random() * 0.2,
        transition3: 0.4 + random() * 0.2,
        transition4: 0.6 + random() * 0.2,
        transition5: 0.8 + random() * 0.15,
        blend12: 0.05 + random() * 0.1,
        blend23: 0.05 + random() * 0.1,
        blend34: 0.05 + random() * 0.1,
        blend45: 0.05 + random() * 0.1,
      } as ProceduralSurfaceProperties;
    case PlanetType.DESERT:
      return {
        ...baseProps,
        planetType: planetType,
        color: getRandomItem(CONST.DESERT_COLORS.dunes, random),
        secondaryColor: getRandomItem(CONST.DESERT_COLORS.rocks, random),
      } as DesertSurfaceProperties;
    case PlanetType.LAVA:
      return {
        ...baseProps,
        planetType: planetType,
        color: getRandomItem(CONST.LAVA_COLORS.rock, random),
        lavaColor: getRandomItem(CONST.LAVA_COLORS.lava, random),
        rockColor: getRandomItem(CONST.LAVA_COLORS.rock, random),
      } as LavaSurfaceProperties;
    case PlanetType.OCEAN:
      return {
        ...baseProps,
        planetType: planetType,
        color: getRandomItem(CONST.OCEAN_COLORS.deep, random),
        oceanColor: getRandomItem(CONST.OCEAN_COLORS.deep, random),
        landColor: getRandomItem(CONST.OCEAN_COLORS.land, random),
        landRatio: 0.1 + random() * 0.4,
      } as OceanSurfaceProperties;
    case PlanetType.ICE:
      return {
        ...baseProps,
        planetType: planetType,
        color: getRandomItem(CONST.ICE_COLORS.main, random),
        secondaryColor: getRandomItem(CONST.ICE_COLORS.crevasse, random),
      } as IceSurfaceProperties;
    default: // Fallback to BARREN procedural properties
      console.warn(
        `[createDetailedSurfaceProperties] Unknown planetType: ${planetType}, falling back to Barren Procedural.`,
      );
      return {
        ...baseProps,
        planetType: PlanetType.BARREN, // Explicitly set fallback type
        color: getRandomItem(CONST.ROCKY_COLOR_BANDS.midLight, random),
        color1: getRandomItem(CONST.ROCKY_COLOR_BANDS.dark, random),
        color2: getRandomItem(CONST.ROCKY_COLOR_BANDS.midDark, random),
        color3: getRandomItem(CONST.ROCKY_COLOR_BANDS.midLight, random),
        color4: getRandomItem(CONST.ROCKY_COLOR_BANDS.light, random),
        color5: getRandomItem(CONST.ROCKY_COLOR_BANDS.highlight, random),
        transition2: 0.2 + random() * 0.2,
        transition3: 0.4 + random() * 0.2,
        transition4: 0.6 + random() * 0.2,
        transition5: 0.8 + random() * 0.15,
        blend12: 0.05 + random() * 0.1,
        blend23: 0.05 + random() * 0.1,
        blend34: 0.05 + random() * 0.1,
        blend45: 0.05 + random() * 0.1,
      } as ProceduralSurfaceProperties;
  }
}
