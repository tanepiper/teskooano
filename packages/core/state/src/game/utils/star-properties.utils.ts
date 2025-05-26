import { StellarType } from "@teskooano/data-types";

interface StarThermalPropertiesInput {
  stellarType?: StellarType;
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
 * stellar type, if these properties are not already provided.
 * Uses data-driven approach with the new StellarType classification.
 *
 * @param {StarThermalPropertiesInput} options - The input properties to base the determination on.
 * @param {StellarType} [options.stellarType] - The stellar type (e.g., MAIN_SEQUENCE, RED_GIANT, WHITE_DWARF).
 * @param {number} [options.currentTemperature] - The star's current temperature, if already known.
 * @param {number} [options.currentLuminosity] - The star's current luminosity, if already known.
 * @param {string} [options.currentColor] - The star's current color, if already known.
 * @returns {StarThermalPropertiesOutput} An object containing the determined temperature, luminosity, and color.
 */
export function determineStarThermalProperties({
  stellarType,
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
    switch (stellarType) {
      // Main sequence stars - typical values
      case StellarType.MAIN_SEQUENCE:
        temperature = temperature ?? 5778; // G-type default
        luminosity = luminosity ?? 1.0;
        color = color ?? "#FFF9E5";
        break;

      // Evolved stars
      case StellarType.RED_GIANT:
        temperature = temperature ?? 4000;
        luminosity = luminosity ?? 100;
        color = color ?? "#FF8844";
        break;
      case StellarType.BLUE_GIANT:
        temperature = temperature ?? 25000;
        luminosity = luminosity ?? 10000;
        color = color ?? "#AABFFF";
        break;
      case StellarType.SUPERGIANT:
        temperature = temperature ?? 4500;
        luminosity = luminosity ?? 50000;
        color = color ?? "#FFAA44";
        break;
      case StellarType.HYPERGIANT:
        temperature = temperature ?? 5000;
        luminosity = luminosity ?? 500000;
        color = color ?? "#FFCC66";
        break;
      case StellarType.SUBGIANT:
        temperature = temperature ?? 5500;
        luminosity = luminosity ?? 5;
        color = color ?? "#FFF8E0";
        break;

      // Special evolved types
      case StellarType.WOLF_RAYET:
        temperature = temperature ?? 50000;
        luminosity = luminosity ?? 100000;
        color = color ?? "#99FFFF";
        break;
      case StellarType.CARBON_STAR:
        temperature = temperature ?? 3000;
        luminosity = luminosity ?? 1000;
        color = color ?? "#FF4422";
        break;
      case StellarType.VARIABLE_STAR:
        temperature = temperature ?? 6000;
        luminosity = luminosity ?? 10;
        color = color ?? "#FFFF88";
        break;

      // Pre-main sequence
      case StellarType.PROTOSTAR:
        temperature = temperature ?? 2000;
        luminosity = luminosity ?? 0.1;
        color = color ?? "#CC4400";
        break;
      case StellarType.T_TAURI:
        temperature = temperature ?? 4000;
        luminosity = luminosity ?? 0.5;
        color = color ?? "#FF6633";
        break;
      case StellarType.HERBIG_AE_BE:
        temperature = temperature ?? 8000;
        luminosity = luminosity ?? 50;
        color = color ?? "#CCDDFF";
        break;

      // Stellar remnants
      case StellarType.WHITE_DWARF:
        temperature = temperature ?? 25000;
        luminosity = luminosity ?? 0.01;
        color = color ?? "#FFFFFF";
        break;
      case StellarType.NEUTRON_STAR:
        temperature = temperature ?? 1000000;
        luminosity = luminosity ?? 0.1;
        color = color ?? "#CCFFFF";
        break;
      case StellarType.BLACK_HOLE:
        temperature = temperature ?? 2.7; // CMB temperature
        luminosity = luminosity ?? 0;
        color = color ?? "#000000";
        break;

      default:
        // Default to main sequence G-type if stellarType is not provided or unrecognized
        if (temperature === undefined) temperature = 5778;
        if (luminosity === undefined) luminosity = 1.0;
        if (color === undefined) color = "#FFF9E5";
    }
  }

  // Final fallback to ensure values are always defined.
  return {
    temperature: temperature ?? 5778,
    luminosity: luminosity ?? 1.0,
    color: color ?? "#FFF9E5",
  };
}
