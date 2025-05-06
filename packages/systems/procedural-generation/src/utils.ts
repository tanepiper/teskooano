import {
  GRAVITATIONAL_CONSTANT,
  GasGiantClass,
  PlanetType,
  ProceduralSurfaceProperties,
  SpectralClass,
} from "@teskooano/data-types";
import * as CONST from "./constants";

/**
 * Gets a random item from an array using the provided random function.
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
 * @param childMass_kg Mass of the orbiting body (kg) - often negligible for planets around stars.
 * @returns The orbital period in seconds (s).
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
  if (density_kg_m3 <= 0) return 0;
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
  if (temperature >= 5200) return SpectralClass.G;
  if (temperature >= 3700) return SpectralClass.K;
  if (temperature >= 2400) return SpectralClass.M;
  return SpectralClass.M;
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
  return totalPowerWatts / CONST.SOLAR_LUMINOSITY;
}

/**
 * Gets a representative star color based on its temperature (simplified).
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

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .padStart(6, "0")
  );
}

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
 * Classifies a gas giant based on estimated temperature.
 * Uses simplified temperature thresholds based on Sudan classification.
 */
export function classifyGasGiantByTemperature(
  random: () => number,
  distanceAU: number,
  starTemperature: number,
  starRadius: number,
): GasGiantClass {
  const starLuminosity = calculateLuminosity(starRadius, starTemperature);
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
 * Creates detailed procedural surface properties based on planet type.
 */
export function createProceduralSurfaceProperties(
  random: () => number,
  planetType: PlanetType,
): ProceduralSurfaceProperties {
  // Default procedural values - can be overridden by specific types
  let persistence = getRandomInRange(0.45, 0.65, random);
  let lacunarity = getRandomInRange(1.9, 2.4, random);
  let simplePeriod = getRandomInRange(2.5, 7.0, random);
  let octaves = Math.floor(getRandomInRange(5, 9, random));
  let bumpScale = getRandomInRange(2, 3, random);
  let roughness = getRandomInRange(0.5, 0.9, random); // Base roughness
  let shininess = getRandomInRange(16, 64, random); // Default shininess
  let specularStrength = getRandomInRange(0.2, 0.5, random); // Default specular strength

  let colorLow: string;
  let colorMid1: string;
  let colorMid2: string;
  let colorHigh: string;

  switch (planetType) {
    case PlanetType.TERRESTRIAL:
      colorLow = getRandomItem(["#1E4F6F", "#2A6F97", "#01497C"], random); // Blues (Water)
      colorMid1 = getRandomItem(["#4C9341", "#6A994E", "#8AA36F"], random); // Greens (Land)
      colorMid2 = getRandomItem(["#D4A373", "#E6B88A", "#C09463"], random); // Browns (Mountains)
      colorHigh = getRandomItem(["#FFFFFF", "#F5F5F5", "#E8E8E8"], random); // White (Peaks/Snow)

      persistence = getRandomInRange(0.5, 0.6, random);
      lacunarity = getRandomInRange(1.5, 2.3, random);
      simplePeriod = getRandomInRange(0.7, 1.0, random);
      octaves = Math.floor(getRandomInRange(5, 9, random));
      bumpScale = getRandomInRange(1, 2, random);
      roughness = getRandomInRange(0.1, 0.2, random);
      shininess = getRandomInRange(3, 7, random); // Moderate shine for Terran
      specularStrength = getRandomInRange(0.3, 0.6, random);
      break;

    case PlanetType.ROCKY:
      console.log("Rocky", planetType);
      colorLow = getRandomItem(["#4f2214", "#171719", "#312b2e"], random);
      colorMid1 = getRandomItem(["#522f28", "#631100", "#3d1c15"], random);
      colorMid2 = getRandomItem(["#3b3837", "#5d4a41", "#4d4542"], random);
      colorHigh = getRandomItem(["#59392e", "#662d1a", "#242327"], random);

      persistence = getRandomInRange(0.1, 0.3, random);
      lacunarity = getRandomInRange(2, 3, random);
      simplePeriod = getRandomInRange(1.5, 5.0, random); // More detailed features possible
      octaves = Math.floor(getRandomInRange(5, 9, random));
      bumpScale = getRandomInRange(2, 3, random);
      roughness = getRandomInRange(0.7, 0.95, random);
      shininess = getRandomInRange(5, 10, random); // Very low shine
      specularStrength = getRandomInRange(0.1, 0.9, random); // Very low strength
      break;

    case PlanetType.BARREN:
      console.log("Barren", planetType);
      colorLow = getRandomItem(["#262323", "#201818", "#2e2a2a"], random); // Dark Grays
      colorMid1 = getRandomItem(["#1d2422", "#111c19", "#2a2b2b"], random); // Medium Grays
      colorMid2 = getRandomItem(["#5c3e3e", "#312727", "#2e290f"], random); // Lighter Grays
      colorHigh = getRandomItem(["#333333", "#292525", "#1f0e0e"], random); // Light Grays

      persistence = getRandomInRange(0.2, 0.25, random); // Less variation
      lacunarity = getRandomInRange(3, 4, random); // Smoother transitions
      simplePeriod = getRandomInRange(1.5, 5.0, random); // More detailed features possible
      octaves = Math.floor(getRandomInRange(4, 6, random));
      bumpScale = getRandomInRange(2, 3, random);
      roughness = getRandomInRange(0.01, 0.09, random); // High roughness
      shininess = getRandomInRange(1, 3, random); // Very low shine
      specularStrength = getRandomInRange(0.01, 0.05, random); // Very low strength
      break;

    case PlanetType.DESERT:
      colorLow = getRandomItem(["#A0522D", "#B8860B", "#8B4513"], random); // Sienna, DarkGoldenrod, SaddleBrown (Deep Dunes/Rock)
      colorMid1 = getRandomItem(["#D2B48C", "#F4A460", "#CD853F"], random); // Tan, SandyBrown, Peru (Sand)
      colorMid2 = getRandomItem(["#E0C9A6", "#FFDEAD", "#DEB887"], random); // Lighter Tan, NavajoWhite, BurlyWood (Highlights)
      colorHigh = getRandomItem(["#F5E6CA", "#FFF8DC", "#FAF0E6"], random); // Beige, Cornsilk, Linen (Peaks/Bright Sand)

      persistence = getRandomInRange(0.1, 0.5, random); // Smoother dunes
      lacunarity = getRandomInRange(12, 20, random); // Sharper dune details potentially
      simplePeriod = getRandomInRange(2.0, 6.0, random); // Larger dune structures
      octaves = Math.floor(getRandomInRange(4, 6, random));
      bumpScale = getRandomInRange(0.01, 0.04, random); // Lower bump for ice
      roughness = getRandomInRange(0.65, 0.9, random);
      shininess = getRandomInRange(128, 512, random); // Very low shine
      specularStrength = getRandomInRange(0.05, 0.15, random); // Slightly higher than barren/rocky but still low
      break;

    case PlanetType.ICE:
      colorLow = getRandomItem(["#ffffff", "#edfbff", "#def4f9"], random); // CadetBlue, CornflowerBlue, SteelBlue (Deep Ice/Shadows)
      colorMid1 = getRandomItem(["#fff3f3", "#ffffff", "#52c8ff"], random); // PowderBlue, LightBlue (Main Ice Field)
      colorMid2 = getRandomItem(["#80ecff", "#ffffff", "#f5fdff"], random); // Lighter Blues/Cyans (Snow/Frost)
      colorHigh = getRandomItem(["#FFFFFF", "#F0FFFF", "#c9c9c9"], random); // White, Azure, MintCream (Glints/Pure Snow)

      persistence = getRandomInRange(0.2, 0.5, random);
      lacunarity = getRandomInRange(3, 3, random);
      simplePeriod = getRandomInRange(1, 2, random);
      octaves = Math.floor(getRandomInRange(5, 9, random));
      bumpScale = 3; //getRandomInRange(1, 2, random); // Lower bump for ice
      roughness = getRandomInRange(0.1, 0.3, random);
      shininess = getRandomInRange(10, 20, random); // Higher shine for ice
      specularStrength = getRandomInRange(0.4, 0.8, random); // Stronger specular for ice
      break;

    case PlanetType.LAVA:
      colorLow = getRandomItem(["#1A0000", "#2B0B00", "#000000"], random); // Very Dark Red/Black (Cooled Rock)
      colorMid1 = getRandomItem(["#4E0000", "#6B0000", "#8B0000"], random); // Dark Reds (Cooling Lava/Rock)
      colorMid2 = getRandomItem(["#AE1000", "#CC3300", "#FF4500"], random); // Bright Reds/Oranges (Hot Lava)
      colorHigh = getRandomItem(["#FF8C00", "#FFA500", "#FFFF00"], random); // Orange/Yellow (Hottest Lava)

      persistence = getRandomInRange(0.5, 0.65, random);
      lacunarity = getRandomInRange(2, 3, random);
      simplePeriod = getRandomInRange(1, 4, random);
      octaves = Math.floor(getRandomInRange(5, 9, random));
      bumpScale = getRandomInRange(2, 3, random);
      roughness = getRandomInRange(0.1, 1, random);
      shininess = getRandomInRange(10, 30, random); // Moderate shine for Terran
      specularStrength = getRandomInRange(0.3, 0.6, random);
      break;

    case PlanetType.OCEAN:
      colorLow = getRandomItem(["#001F3F", "#003366", "#004080"], random); // Deep Ocean Blue
      colorMid1 = getRandomItem(["#0055A4", "#1E90FF", "#4169E1"], random); // Mid Ocean Blue, DodgerBlue, RoyalBlue
      colorMid2 = getRandomItem(["#87CEEB", "#ADD8E6", "#B0E0E6"], random); // SkyBlue, LightBlue, PowderBlue (Shallows)
      colorHigh = getRandomItem(["#F0F8FF", "#E0FFFF", "#FFFFFF"], random); // AliceBlue, LightCyan, White (Foam/Ice Caps?)

      persistence = getRandomInRange(0.6, 0.75, random); // Very smooth generally
      lacunarity = getRandomInRange(1.8, 2.1, random); // Few sharp transitions
      simplePeriod = getRandomInRange(8.0, 15.0, random); // Large, gentle swells
      octaves = Math.floor(getRandomInRange(4, 6, random)); // Less detail needed
      bumpScale = getRandomInRange(0.005, 0.02, random); // Very low bump for water surface
      roughness = getRandomInRange(0.1, 0.4, random); // Water is smooth
      shininess = getRandomInRange(32, 96, random); // Water shine
      specularStrength = getRandomInRange(0.5, 0.9, random); // Strong water reflections
      break;

    default:
      console.warn(
        `[createProceduralSurfaceProperties] Unhandled planetType: ${planetType}, using fallback TERRESTRIAL palette.`,
      );
      // Fallback to Terrestrial-like palette
      colorLow = "#1E4F6F";
      colorMid1 = "#4C9341";
      colorMid2 = "#D4A373";
      colorHigh = "#FFFFFF";
      break;
  }

  // Construct the final properties object
  return {
    persistence: persistence,
    lacunarity: lacunarity,
    simplePeriod: simplePeriod,
    octaves: octaves,
    bumpScale: bumpScale,
    colorLow: colorLow,
    colorMid1: colorMid1,
    colorMid2: colorMid2,
    colorHigh: colorHigh,
    shininess: shininess,
    specularStrength: specularStrength,
  };
}
