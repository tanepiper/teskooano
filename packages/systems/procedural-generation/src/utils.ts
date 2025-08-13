import {
  BlackHoleSubtype,
  CelestiaClassType,
  CelestialType,
  GasGiantClass,
  NeutronStarSubtype,
  PlanetType,
  ProtostarSubtype,
  SpectralClass,
  StellarType,
  WhiteDwarfSubtype,
} from "@teskooano/data-types";
import * as CONST from "./constants";
import {
  AU_METERS,
  GRAVITATIONAL_CONSTANT,
  SOLAR_LUMINOSITY,
  STEFAN_BOLTZMANN_CONSTANT,
} from "@teskooano/data-values";

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
 * Calculates the stellar luminosity using the Stefan-Boltzmann law.
 * L = 4πR²σT⁴
 * @param radius_m The star's radius in meters.
 * @param temperature_k The star's surface temperature in Kelvin.
 * @returns The luminosity in watts.
 */
export function calculateStellarLuminosity(
  radius_m: number,
  temperature_k: number,
): number {
  if (radius_m <= 0 || temperature_k <= 0) {
    console.warn(
      `[calculateStellarLuminosity] Invalid input: radius=${radius_m}, temp=${temperature_k}. Returning 0.`,
    );
    return 0;
  }
  const surfaceArea = 4 * Math.PI * radius_m * radius_m;
  const temperatureToFourth = Math.pow(temperature_k, 4);
  return surfaceArea * STEFAN_BOLTZMANN_CONSTANT * temperatureToFourth;
}

/**
 * Gets the color of a star based on its temperature.
 * Uses a simplified blackbody radiation approximation.
 * @param temperature The star's surface temperature in Kelvin.
 * @returns A hex color string representing the star's color.
 */
export function getStarColor(temperature: number): string {
  if (temperature <= 0) {
    return "#ffffff"; // Default to white for invalid temperatures
  }

  // Simplified blackbody radiation color approximation
  if (temperature >= 40000) return "#9bb0ff"; // O-type: blue-white
  if (temperature >= 20000) return "#aabfff"; // B-type: blue-white
  if (temperature >= 9500) return "#cad7ff"; // A-type: white
  if (temperature >= 7000) return "#faf0ff"; // F-type: yellow-white
  if (temperature >= 5200) return "#fff4ea"; // G-type: yellow
  if (temperature >= 3700) return "#ffd2a1"; // K-type: orange
  if (temperature >= 2400) return "#ff8c69"; // M-type: red
  return "#ff6b35"; // Very cool stars: deep red
}

/**
 * Validates that an orbit stays within the system boundary by checking aphelion.
 * For elliptical orbits, aphelion = semiMajorAxis × (1 + eccentricity).
 * This ensures that the entire orbital path stays within the system boundary,
 * not just the semi-major axis.
 *
 * @param semiMajorAxisAU The semi-major axis of the orbit in AU.
 * @param eccentricity The orbital eccentricity (0 = circular, < 1 = elliptical).
 * @param maxDistanceAU The maximum allowed distance from the star in AU.
 * @returns True if the entire orbit stays within the boundary, false otherwise.
 */
export function isOrbitWithinSystemBoundary(
  semiMajorAxisAU: number,
  eccentricity: number,
  maxDistanceAU: number = CONST.SYSTEM_MAX_DISTANCE_AU,
): boolean {
  if (semiMajorAxisAU <= 0 || eccentricity < 0 || eccentricity >= 1) {
    return false;
  }

  // Calculate aphelion (farthest point from the star)
  const aphelionAU = semiMajorAxisAU * (1 + eccentricity);

  return aphelionAU <= maxDistanceAU;
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

  const luminosityWatts = starLuminosity * SOLAR_LUMINOSITY;
  const distanceMeters = distanceAU * AU_METERS;

  const denominator =
    16 * Math.PI * STEFAN_BOLTZMANN_CONSTANT * distanceMeters ** 2;
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
 * @param classType The type of the planet.
 * @param random A seeded random number generator.
 * @returns A value between 0 and 1 representing the planet's albedo.
 */
export function calculateAlbedo(
  celestialType: CelestialType,
  celestialClass: CelestiaClassType,
  random: () => number,
): number {
  let baseAlbedo: number = 0.3;
  let range: number = 0;

  if (
    celestialType === CelestialType.PLANET ||
    celestialType === CelestialType.MOON
  ) {
    switch (celestialClass as PlanetType) {
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
    switch (celestialClass as GasGiantClass) {
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
    switch (celestialClass as StellarType) {
      case StellarType.MAIN_SEQUENCE:
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

interface StarThermalPropertiesInput {
  mainSpectralClass?: SpectralClass;
  stellarType?: StellarType;
  neutronStarSubtype?: NeutronStarSubtype;
  blackHoleSubtype?: BlackHoleSubtype;
  whiteDwarfSubtype?: WhiteDwarfSubtype;
  protostarSubtype?: ProtostarSubtype;
  currentTemperature?: number;
  currentLuminosity?: number;
  currentColor?: string;
}

interface StarThermalPropertiesOutput {
  temperature: number;
  luminosity: number;
  color: string;
}

/**
 * Determines the default temperature, luminosity, and color for a star based on its
 * spectral class and stellar type, if these properties are not already provided.
 *
 * @param options - The input properties to base the determination on.
 * @param options.mainSpectralClass - The main spectral class of the star (e.g., G, K, M).
 * @param options.stellarType - The stellar type of the star, if applicable (e.g., WHITE_DWARF, NEUTRON_STAR).
 * @param options.neutronStarSubtype - The neutron star subtype, if applicable.
 * @param options.blackHoleSubtype - The black hole subtype, if applicable.
 * @param options.whiteDwarfSubtype - The white dwarf subtype, if applicable.
 * @param options.protostarSubtype - The pre-main-sequence star subtype, if applicable.
 * @param options.currentTemperature - The star's current temperature, if already known.
 * @param options.currentLuminosity - The star's current luminosity, if already known.
 * @param options.currentColor - The star's current color, if already known.
 * @returns An object containing the determined temperature, luminosity, and color.
 */
export function determineStarThermalProperties({
  mainSpectralClass,
  stellarType,
  neutronStarSubtype,
  blackHoleSubtype,
  whiteDwarfSubtype,
  protostarSubtype,
  currentTemperature,
  currentLuminosity,
  currentColor,
}: StarThermalPropertiesInput): StarThermalPropertiesOutput {
  let temperature = currentTemperature;
  let luminosity = currentLuminosity;
  let color = currentColor;

  if (
    temperature === undefined ||
    luminosity === undefined ||
    color === undefined
  ) {
    switch (mainSpectralClass) {
      case SpectralClass.O:
        temperature = temperature ?? 40000;
        luminosity = luminosity ?? 100000;
        color = color ?? "#9BB0FF";
        break;
      case SpectralClass.B:
        temperature = temperature ?? 20000;
        luminosity = luminosity ?? 1000;
        color = color ?? "#AABFFF";
        break;
      case SpectralClass.A:
        temperature = temperature ?? 8500;
        luminosity = luminosity ?? 20;
        color = color ?? "#F8F7FF";
        break;
      case SpectralClass.F:
        temperature = temperature ?? 6500;
        luminosity = luminosity ?? 4;
        color = color ?? "#FFF4EA";
        break;
      case SpectralClass.G:
        temperature = temperature ?? 5778;
        luminosity = luminosity ?? 1.0;
        color = color ?? "#FFF9E5";
        break;
      case SpectralClass.K:
        temperature = temperature ?? 4500;
        luminosity = luminosity ?? 0.4;
        color = color ?? "#FFAA55";
        break;
      case SpectralClass.M:
        temperature = temperature ?? 3000;
        luminosity = luminosity ?? 0.04;
        color = color ?? "#FF6644";
        break;
      case SpectralClass.L:
        temperature = temperature ?? 2000;
        luminosity = luminosity ?? 0.001;
        color = color ?? "#FF3300";
        break;
      case SpectralClass.T:
        temperature = temperature ?? 1300;
        luminosity = luminosity ?? 0.0001;
        color = color ?? "#CC2200";
        break;
      case SpectralClass.Y:
        temperature = temperature ?? 500;
        luminosity = luminosity ?? 0.00001;
        color = color ?? "#991100";
        break;
      default:
        // Default to G-type if mainSpectralClass is not provided or unrecognized,
        // but only if temperature, luminosity, or color are still undefined.
        if (temperature === undefined) temperature = 5778;
        if (luminosity === undefined) luminosity = 1.0;
        if (color === undefined) color = "#FFF9E5";
    }

    if (stellarType) {
      // If a stellar type is present, it might override the spectral class defaults or provide its own.
      // We use the original currentTemperature/Luminosity/Color to see if the stellar type should set them
      // or if they were already explicitly provided for the stellar object.
      switch (stellarType) {
        case StellarType.WHITE_DWARF:
          // Use subtype to determine specific white dwarf properties
          if (whiteDwarfSubtype === WhiteDwarfSubtype.DA) {
            // Hydrogen-dominated - white with slight blue tint
            temperature = currentTemperature ?? 25000;
            luminosity = currentLuminosity ?? 0.01;
            color = currentColor ?? "#F8FCFF";
          } else if (whiteDwarfSubtype === WhiteDwarfSubtype.DB) {
            // Helium-dominated - slightly bluer
            temperature = currentTemperature ?? 30000;
            luminosity = currentLuminosity ?? 0.015;
            color = currentColor ?? "#E8F4FF";
          } else if (whiteDwarfSubtype === WhiteDwarfSubtype.DC) {
            // Featureless spectrum - neutral white
            temperature = currentTemperature ?? 20000;
            luminosity = currentLuminosity ?? 0.008;
            color = currentColor ?? "#FFFFFF";
          } else if (whiteDwarfSubtype === WhiteDwarfSubtype.DO) {
            // Helium-rich with ionized helium - bluish
            temperature = currentTemperature ?? 40000;
            luminosity = currentLuminosity ?? 0.02;
            color = currentColor ?? "#D0E8FF";
          } else if (whiteDwarfSubtype === WhiteDwarfSubtype.DZ) {
            // Metal-rich - slightly reddish
            temperature = currentTemperature ?? 18000;
            luminosity = currentLuminosity ?? 0.006;
            color = currentColor ?? "#FFF8F0";
          } else if (whiteDwarfSubtype === WhiteDwarfSubtype.DQ) {
            // Carbon-rich - slightly yellowish
            temperature = currentTemperature ?? 22000;
            luminosity = currentLuminosity ?? 0.012;
            color = currentColor ?? "#FFFFF0";
          } else {
            // Default white dwarf properties
            temperature = currentTemperature ?? 25000;
            luminosity = currentLuminosity ?? 0.01;
            color = currentColor ?? "#FFFFFF";
          }
          break;
        case StellarType.NEUTRON_STAR:
          // Use subtype to determine specific neutron star properties
          if (neutronStarSubtype === NeutronStarSubtype.PULSAR) {
            // Pulsars - very hot, bright, cyan color
            temperature = currentTemperature ?? 1000000;
            luminosity = currentLuminosity ?? 0.3;
            color = currentColor ?? "#CCFFFF";
          } else if (neutronStarSubtype === NeutronStarSubtype.MAGNETAR) {
            // Magnetars - extremely hot, very bright, intense blue
            temperature = currentTemperature ?? 1500000;
            luminosity = currentLuminosity ?? 0.5;
            color = currentColor ?? "#99FFFF";
          } else {
            // Standard neutron stars
            temperature = currentTemperature ?? 1000000;
            luminosity = currentLuminosity ?? 0.1;
            color = currentColor ?? "#CCFFFF";
          }
          break;
        case StellarType.BLACK_HOLE:
          // Use subtype to determine specific black hole properties
          if (blackHoleSubtype === BlackHoleSubtype.KERR) {
            // Kerr black holes - may have accretion disk emissions
            temperature = currentTemperature ?? 2.7; // CMB temperature
            luminosity = currentLuminosity ?? 0.001; // Very low, but not zero due to accretion
            color = currentColor ?? "#000000";
          } else {
            // Schwarzschild black holes - completely dark
            temperature = currentTemperature ?? 0;
            luminosity = currentLuminosity ?? 0;
            color = currentColor ?? "#000000";
          }
          break;
        case StellarType.WOLF_RAYET:
          temperature = currentTemperature ?? 50000;
          luminosity = currentLuminosity ?? 100000;
          color = currentColor ?? "#99FFFF";
          break;
        case StellarType.HYPERGIANT:
          temperature = currentTemperature ?? 35000;
          luminosity = currentLuminosity ?? 500000;
          color = currentColor ?? "#FF6B6B";
          break;
        case StellarType.PROTOSTAR:
          // Protostars are still accreting and not yet optically visible
          // They have lower temperatures and are often obscured by dust
          temperature = currentTemperature ?? 2000;
          luminosity = currentLuminosity ?? 0.01;
          color = currentColor ?? "#8B4513"; // Brownish due to dust absorption
          break;
        case StellarType.PRE_MAIN_SEQUENCE:
          // Pre-main-sequence stars that have become optically visible
          // Use subtype to determine specific properties
          if (protostarSubtype === ProtostarSubtype.T_TAURI) {
            // T Tauri stars are pre-main-sequence stars < 2 solar masses
            temperature = currentTemperature ?? 4000;
            luminosity = currentLuminosity ?? 0.5;
            color = currentColor ?? "#FF8C42";
          } else if (protostarSubtype === ProtostarSubtype.HERBIG_AE_BE) {
            // Herbig Ae/Be stars are pre-main-sequence stars of 2-8 solar masses
            temperature = currentTemperature ?? 8000;
            luminosity = currentLuminosity ?? 10;
            color = currentColor ?? "#87CEEB";
          } else {
            // Default pre-main-sequence properties
            temperature = currentTemperature ?? 4000;
            luminosity = currentLuminosity ?? 0.5;
            color = currentColor ?? "#FF8C42";
          }
          break;
      }
    }
  }

  // Final fallback to ensure values are always defined.
  return {
    temperature: temperature ?? 5778,
    luminosity: luminosity ?? 1.0,
    color: color ?? "#FFF9E5",
  };
}
