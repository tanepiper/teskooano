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
  let persistence = getRandomInRange(0.5, 0.7, random); // Adjusted for more detail
  let lacunarity = getRandomInRange(1.8, 2.2, random); // Tightened and slightly lowered
  let simplePeriod = getRandomInRange(1.5, 4.0, random); // Higher frequency on average
  let octaves = Math.floor(getRandomInRange(8, 12, random)); // Increased octaves
  let bumpScale = getRandomInRange(2, 3, random);
  let roughness = getRandomInRange(0.5, 0.9, random);
  let shininess = getRandomInRange(8, 32, random);
  let specularStrength = getRandomInRange(0.1, 0.3, random);
  let ambientLightIntensity = 0.5;
  let undulation = getRandomInRange(0.1, 0.3, random);

  // Default terrain generation values
  let terrainType = 2; // Default to sharp peaks
  let terrainAmplitude = 1.0;
  let terrainSharpness = 1.0;
  let terrainOffset = 0.0;

  let height1 = getRandomInRange(0.1, 0.2, random);
  let height2 = getRandomInRange(0.2, 0.4, random);
  let height3 = getRandomInRange(0.4, 0.6, random);
  let height4 = getRandomInRange(0.6, 0.8, random);
  let height5 = getRandomInRange(0.8, 1.0, random);

  let color1: string;
  let color2: string;
  let color3: string;
  let color4: string;
  let color5: string;

  switch (planetType) {
    case PlanetType.TERRESTRIAL:
      color1 = getRandomItem(["#1E4F6F", "#2A6F97", "#01497C"], random); // Blues (Water)
      color2 = getRandomItem(["#4C9341", "#6A994E", "#8AA36F"], random); // Greens (Land)
      color3 = getRandomItem(["#D4A373", "#E6B88A", "#C09463"], random); // Browns (Mountains)
      color4 = getRandomItem(["#FFFFFF", "#F5F5F5", "#E8E8E8"], random); // White (Peaks/Snow)
      color5 = getRandomItem(["#FFFFFF", "#F5F5F5", "#E8E8E8"], random); // White (Peaks/Snow)

      height1 = getRandomInRange(0.2, 0.3, random);
      height2 = getRandomInRange(0.3, 0.45, random);
      height3 = getRandomInRange(0.45, 0.6, random);
      height4 = getRandomInRange(0.6, 0.75, random);
      height5 = getRandomInRange(0.75, 1.0, random);

      persistence = getRandomInRange(0.55, 0.65, random); // Slightly increased
      lacunarity = getRandomInRange(1.8, 2.2, random); // Tightened range
      simplePeriod = getRandomInRange(0.5, 0.9, random); // Higher frequency
      octaves = Math.floor(getRandomInRange(10, 14, random)); // Increased octaves
      bumpScale = getRandomInRange(1, 2, random);
      roughness = getRandomInRange(0.1, 0.2, random);
      //shininess = getRandomInRange(3, 7, random); // Moderate shine for Terran
      specularStrength = getRandomInRange(0.3, 0.6, random);
      //ambientLightIntensity = getRandomInRange(0.2, 0.4, random); // Higher ambient for Earth-like planets
      undulation = getRandomInRange(0.3, 0.5, random); // Higher undulation for continent-like features
      terrainType = 2; // Sharp peaks for mountains
      terrainAmplitude = getRandomInRange(0.8, 1.2, random);
      terrainSharpness = getRandomInRange(0.8, 1.2, random);
      terrainOffset = getRandomInRange(-0.1, 0.1, random);
      break;

    case PlanetType.ROCKY:
      console.log("Rocky", planetType);
      color1 = getRandomItem(["#4f2214", "#171719", "#312b2e"], random);
      color2 = getRandomItem(["#522f28", "#631100", "#3d1c15"], random);
      color3 = getRandomItem(["#3b3837", "#5d4a41", "#4d4542"], random);
      color4 = getRandomItem(["#59392e", "#662d1a", "#242327"], random);
      color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random); // Darker browns for rocky peaks

      persistence = getRandomInRange(0.45, 0.6, random); // Significantly increased for detail
      lacunarity = getRandomInRange(1.9, 2.3, random); // Adjusted range
      simplePeriod = getRandomInRange(1.0, 3.0, random); // Smaller period for more detail
      octaves = Math.floor(getRandomInRange(9, 13, random)); // Increased octaves
      bumpScale = getRandomInRange(2, 3, random);
      roughness = getRandomInRange(0.7, 0.95, random);
      //shininess = getRandomInRange(5, 10, random); // Very low shine
      specularStrength = getRandomInRange(0.1, 0.9, random); // Very low strength
      //ambientLightIntensity = getRandomInRange(0.1, 0.2, random); // Lower ambient for rocky planets
      ambientLightIntensity = 0.9;
      undulation = getRandomInRange(0.2, 0.4, random); // Moderate undulation for rocky terrain
      terrainType = 2; // Sharp peaks for rocky terrain
      terrainAmplitude = getRandomInRange(1.0, 1.5, random);
      terrainSharpness = getRandomInRange(1.2, 1.8, random);
      terrainOffset = getRandomInRange(-0.2, 0.0, random);
      break;

    case PlanetType.BARREN:
      console.log("Barren", planetType);
      // low: "#583C3C", // Dark Gray
      // mid1: "#544A59", // Medium Gray
      // mid2: "#733217", // Slightly Lighter Gray
      // high: "#756C61", // Light Gray

      //background-image: linear-gradient(to top, #583c3c, #5f3937, #653732, #6b352b, #6f3323, #703523, #723722, #733922, #723e2a, #714332, #6f4739, #6d4c41);

      color1 = getRandomItem(["#583C3C", "#6d4c41", "#6f3323"], random); // Dark Grays
      color2 = getRandomItem(["#544A59", "#111c19", "#2a2b2b"], random); // Medium Grays
      color3 = getRandomItem(["#733217", "#312727", "#544A59"], random); // Lighter Grays
      color4 = getRandomItem(["#756C61", "#292525", "#1f0e0e"], random); // Light Grays
      color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

      persistence = getRandomInRange(0.4, 0.55, random); // Significantly increased
      lacunarity = getRandomInRange(2.0, 2.5, random); // Reduced to avoid overly chaotic noise
      simplePeriod = getRandomInRange(1.0, 3.5, random); // Smaller period for more detail
      octaves = Math.floor(getRandomInRange(8, 12, random)); // Increased octaves
      bumpScale = getRandomInRange(2, 3, random);
      roughness = getRandomInRange(0.01, 0.09, random); // High roughness
      //shininess = getRandomInRange(1, 3, random); // Very low shine
      specularStrength = getRandomInRange(0.01, 0.05, random); // Very low strength
      //ambientLightIntensity = getRandomInRange(0.05, 0.15, random); // Very low ambient for barren planets
      ambientLightIntensity = 0.9;
      undulation = getRandomInRange(0.1, 0.2, random); // Lower undulation for barren planets
      terrainType = 3; // Sharp valleys for barren planets
      terrainAmplitude = getRandomInRange(0.5, 0.8, random);
      terrainSharpness = getRandomInRange(1.5, 2.0, random);
      terrainOffset = getRandomInRange(0.0, 0.2, random);
      break;

    case PlanetType.DESERT:
      color1 = getRandomItem(["#A0522D", "#B8860B", "#8B4513"], random); // Sienna, DarkGoldenrod, SaddleBrown (Deep Dunes/Rock)
      color2 = getRandomItem(["#D2B48C", "#F4A460", "#CD853F"], random); // Tan, SandyBrown, Peru (Sand)
      color3 = getRandomItem(["#E0C9A6", "#FFDEAD", "#DEB887"], random); // Lighter Tan, NavajoWhite, BurlyWood (Highlights)
      color4 = getRandomItem(["#F5E6CA", "#FFF8DC", "#FAF0E6"], random); // Beige, Cornsilk, Linen (Peaks/Bright Sand)
      color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

      persistence = getRandomInRange(0.4, 0.6, random); // Adjusted for more consistent detail
      lacunarity = getRandomInRange(1.9, 2.4, random); // Corrected from very high range
      simplePeriod = getRandomInRange(1.5, 4.0, random); // Adjusted for finer details
      octaves = Math.floor(getRandomInRange(8, 12, random)); // Increased octaves
      bumpScale = getRandomInRange(0.01, 0.04, random); // Lower bump for ice
      roughness = getRandomInRange(0.65, 0.9, random);
      //shininess = getRandomInRange(128, 512, random); // Very low shine
      specularStrength = getRandomInRange(0.05, 0.15, random); // Slightly higher than barren/rocky but still low
      //  ambientLightIntensity = getRandomInRange(0.3, 0.5, random); // Higher ambient for desert planets
      undulation = getRandomInRange(0.15, 0.25, random); // Moderate undulation for desert dunes
      terrainType = 1; // Simple noise for dunes
      terrainAmplitude = getRandomInRange(0.3, 0.6, random);
      terrainSharpness = getRandomInRange(0.5, 0.8, random);
      terrainOffset = getRandomInRange(0.1, 0.3, random);
      break;

    case PlanetType.ICE:
      color1 = getRandomItem(["#ffffff", "#edfbff", "#def4f9"], random); // CadetBlue, CornflowerBlue, SteelBlue (Deep Ice/Shadows)
      color2 = getRandomItem(["#fff3f3", "#ffffff", "#52c8ff"], random); // PowderBlue, LightBlue (Main Ice Field)
      color3 = getRandomItem(["#80ecff", "#ffffff", "#f5fdff"], random); // Lighter Blues/Cyans (Snow/Frost)
      color4 = getRandomItem(["#FFFFFF", "#F0FFFF", "#c9c9c9"], random); // White, Azure, MintCream (Glints/Pure Snow)
      color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

      persistence = getRandomInRange(0.45, 0.6, random); // Adjusted persistence
      lacunarity = getRandomInRange(1.9, 2.2, random); // Corrected lacunarity for smoother ice
      simplePeriod = getRandomInRange(0.8, 1.8, random); // Adjusted for finer ice details
      octaves = Math.floor(getRandomInRange(8, 12, random)); // Increased octaves
      bumpScale = 3; //getRandomInRange(1, 2, random); // Lower bump for ice
      roughness = getRandomInRange(0.1, 0.3, random);
      //shininess = getRandomInRange(10, 20, random); // Higher shine for ice
      specularStrength = getRandomInRange(0.4, 0.8, random); // Stronger specular for ice
      //ambientLightIntensity = getRandomInRange(0.4, 0.6, random); // High ambient for ice planets
      ambientLightIntensity = 0.5;
      undulation = getRandomInRange(0.05, 0.15, random); // Very low undulation for ice planets
      terrainType = 1; // Simple noise for ice
      terrainAmplitude = getRandomInRange(0.2, 0.4, random);
      terrainSharpness = getRandomInRange(0.3, 0.6, random);
      terrainOffset = getRandomInRange(0.2, 0.4, random);
      break;

    case PlanetType.LAVA:
      color1 = getRandomItem(["#1A0000", "#2B0B00", "#000000"], random); // Very Dark Red/Black (Cooled Rock)
      color2 = getRandomItem(["#4E0000", "#6B0000", "#8B0000"], random); // Dark Reds (Cooling Lava/Rock)
      color3 = getRandomItem(["#AE1000", "#CC3300", "#FF4500"], random); // Bright Reds/Oranges (Hot Lava)
      color4 = getRandomItem(["#FF8C00", "#FFA500", "#FFFF00"], random); // Orange/Yellow (Hottest Lava)
      color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

      persistence = getRandomInRange(0.5, 0.65, random);
      lacunarity = getRandomInRange(1.9, 2.3, random); // Adjusted range
      simplePeriod = getRandomInRange(1, 4, random);
      octaves = Math.floor(getRandomInRange(9, 13, random)); // Increased octaves
      bumpScale = getRandomInRange(2, 3, random);
      roughness = getRandomInRange(0.1, 1, random);
      //shininess = getRandomInRange(10, 30, random); // Moderate shine for Terran
      specularStrength = getRandomInRange(0.3, 0.6, random);
      //ambientLightIntensity = getRandomInRange(0.2, 0.4, random); // Moderate ambient for lava planets
      ambientLightIntensity = 0.9;
      undulation = getRandomInRange(0.2, 0.3, random); // Moderate undulation for lava flows
      terrainType = 2; // Sharp peaks for volcanic terrain
      terrainAmplitude = getRandomInRange(1.2, 1.8, random);
      terrainSharpness = getRandomInRange(1.0, 1.5, random);
      terrainOffset = getRandomInRange(-0.3, -0.1, random);
      break;

    case PlanetType.OCEAN:
      color1 = getRandomItem(["#001F3F", "#003366", "#004080"], random); // Deep Ocean Blue
      color2 = getRandomItem(["#0055A4", "#1E90FF", "#4169E1"], random); // Mid Ocean Blue, DodgerBlue, RoyalBlue
      color3 = getRandomItem(["#87CEEB", "#ADD8E6", "#B0E0E6"], random); // SkyBlue, LightBlue, PowderBlue (Shallows)
      color4 = getRandomItem(["#F0F8FF", "#E0FFFF", "#FFFFFF"], random); // AliceBlue, LightCyan, White (Foam/Ice Caps?)
      color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

      persistence = getRandomInRange(0.6, 0.75, random); // Very smooth generally
      lacunarity = getRandomInRange(1.8, 2.1, random); // Few sharp transitions
      simplePeriod = getRandomInRange(8.0, 15.0, random); // Large, gentle swells
      octaves = Math.floor(getRandomInRange(4, 6, random)); // Less detail needed
      bumpScale = getRandomInRange(0.005, 0.02, random); // Very low bump for water surface
      roughness = getRandomInRange(0.1, 0.4, random); // Water is smooth
      //shininess = getRandomInRange(32, 96, random); // Water shine
      specularStrength = getRandomInRange(0.5, 0.9, random); // Strong water reflections
      //ambientLightIntensity = getRandomInRange(0.3, 0.5, random); // Higher ambient for ocean planets
      undulation = getRandomInRange(0.4, 0.6, random); // High undulation for ocean planets
      terrainType = 1; // Simple noise for ocean
      terrainAmplitude = getRandomInRange(0.4, 0.7, random);
      terrainSharpness = getRandomInRange(0.4, 0.7, random);
      terrainOffset = getRandomInRange(0.3, 0.5, random);
      break;

    default:
      console.warn(
        `[createProceduralSurfaceProperties] Unhandled planetType: ${planetType}, using fallback TERRESTRIAL palette.`,
      );
      // Fallback to Terrestrial-like palette
      color1 = "#1E4F6F";
      color2 = "#4C9341";
      color3 = "#D4A373";
      color4 = "#FFFFFF";
      color5 = "#795548";
      //ambientLightIntensity = getRandomInRange(0.2, 0.3, random); // Default ambient
      undulation = getRandomInRange(0.1, 0.3, random); // Default undulation
      terrainType = 2;
      terrainAmplitude = 1.0;
      terrainSharpness = 1.0;
      terrainOffset = 0.0;
      break;
  }

  // Construct the final properties object
  return {
    persistence: persistence,
    lacunarity: lacunarity,
    simplePeriod: simplePeriod,
    octaves: octaves,
    bumpScale: bumpScale,
    color1: color1,
    color2: color2,
    color3: color3,
    color4: color4,
    color5: color5,
    height1: height1,
    height2: height2,
    height3: height3,
    height4: height4,
    height5: height5,
    shininess: shininess,
    specularStrength: specularStrength,
    roughness: roughness,
    ambientLightIntensity: ambientLightIntensity,
    undulation: undulation,
    terrainType: terrainType,
    terrainAmplitude: terrainAmplitude,
    terrainSharpness: terrainSharpness,
    terrainOffset: terrainOffset,
  };
}
