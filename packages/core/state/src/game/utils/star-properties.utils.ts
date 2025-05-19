import { SpectralClass, ExoticStellarType } from "@teskooano/data-types";

interface StarThermalPropertiesInput {
  mainSpectralClass?: SpectralClass;
  exoticType?: ExoticStellarType;
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
 * spectral class and exotic type, if these properties are not already provided.
 *
 * @param {StarThermalPropertiesInput} options - The input properties to base the determination on.
 * @param {SpectralClass} [options.mainSpectralClass] - The main spectral class of the star (e.g., G, K, M).
 * @param {ExoticStellarType} [options.exoticType] - The exotic type of the star, if applicable (e.g., WHITE_DWARF, NEUTRON_STAR).
 * @param {number} [options.currentTemperature] - The star's current temperature, if already known.
 * @param {number} [options.currentLuminosity] - The star's current luminosity, if already known.
 * @param {string} [options.currentColor] - The star's current color, if already known.
 * @returns {StarThermalPropertiesOutput} An object containing the determined temperature, luminosity, and color.
 */
export function determineStarThermalProperties({
  mainSpectralClass,
  exoticType,
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

    if (exoticType) {
      // If an exotic type is present, it might override the spectral class defaults or provide its own.
      // We use the original currentTemperature/Luminosity/Color to see if the exotic type should set them
      // or if they were already explicitly provided for the exotic star.
      switch (exoticType) {
        case ExoticStellarType.WHITE_DWARF:
          temperature = currentTemperature ?? 25000;
          luminosity = currentLuminosity ?? 0.01;
          color = currentColor ?? "#FFFFFF";
          break;
        case ExoticStellarType.NEUTRON_STAR:
          temperature = currentTemperature ?? 1000000;
          luminosity = currentLuminosity ?? 0.1;
          color = currentColor ?? "#CCFFFF";
          break;
        case ExoticStellarType.BLACK_HOLE:
          temperature = currentTemperature ?? 0;
          luminosity = currentLuminosity ?? 0;
          color = currentColor ?? "#000000";
          break;
        case ExoticStellarType.PULSAR:
          temperature = currentTemperature ?? 1000000;
          luminosity = currentLuminosity ?? 0.5;
          color = currentColor ?? "#00FFFF";
          break;
        case ExoticStellarType.WOLF_RAYET:
          temperature = currentTemperature ?? 50000;
          luminosity = currentLuminosity ?? 100000;
          color = currentColor ?? "#99FFFF";
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
