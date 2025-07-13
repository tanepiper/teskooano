import { StellarType, type CelestialObject } from "@teskooano/data-types";
import { CelestialZone, type StellarSystemConfiguration } from "./types";
import * as CONST from "../constants";

/**
 * Handles scaling zones based on stellar properties
 */
export class ZoneScaler {
  /**
   * Calculate scaling factor based on star characteristics
   * Capped for gameplay to prevent systems from being too spread out
   */
  static calculateScalingFactor(star: CelestialObject): number {
    // Use the pre-calculated luminosity from properties if it exists.
    // This is more accurate than the mass-based approximation.
    let luminosity = (star.properties as any)?.luminosity;

    if (!luminosity) {
      // Fallback to mass-based calculation if luminosity property is missing.
      const mass = star.realMass_kg || CONST.SOLAR_MASS_KG;
      const solarMasses = mass / CONST.SOLAR_MASS_KG;
      // Main sequence mass-luminosity relation: L ∝ M^3.5
      luminosity = Math.pow(solarMasses, 3.5);
    }

    // Get star properties for more sophisticated zone calculation
    const starProps = star.properties as any;
    const spectralClass = starProps?.spectralClass || "G";
    const stellarType = starProps?.classType || "MAIN_SEQUENCE"; // Fixed: was stellarType, now matches actual property name

    // Calculate zone scaling based on star characteristics
    // Use a damped scaling to prevent systems from being too spread out
    let scalingFactor = Math.sqrt(luminosity);

    // Cap the scaling factor for gameplay purposes
    // Min: 0.1 (very small stars), Max: 5.0 (very large stars)
    scalingFactor = Math.max(0.1, Math.min(5.0, scalingFactor));

    // Adjust scaling based on stellar type
    scalingFactor *= this.getStellarTypeScalingMultiplier(stellarType);

    // Additional adjustments based on spectral class
    scalingFactor *= this.getSpectralClassScalingMultiplier(spectralClass);

    // Final cap to ensure systems stay reasonable
    return Math.max(0.1, Math.min(5.0, scalingFactor));
  }

  /**
   * Get stellar type scaling multiplier
   */
  private static getStellarTypeScalingMultiplier(stellarType: string): number {
    switch (stellarType) {
      case StellarType.WHITE_DWARF:
        return 0.1; // 10% of normal scaling
      case StellarType.NEUTRON_STAR:
      case StellarType.BLACK_HOLE:
      case StellarType.KERR_BLACK_HOLE:
        return 0.05; // 5% of normal scaling
      case StellarType.WOLF_RAYET:
        return 2.0; // 200% of normal scaling
      case StellarType.MAIN_SEQUENCE:
      default:
        return 1.0; // Standard scaling
    }
  }

  /**
   * Get spectral class scaling multiplier
   */
  private static getSpectralClassScalingMultiplier(
    spectralClass: string,
  ): number {
    if (spectralClass.startsWith("M")) {
      return 0.3; // Red dwarfs are cool and dim - zones should be closer
    } else if (spectralClass.startsWith("O") || spectralClass.startsWith("B")) {
      return 3.0; // Hot, massive stars have much larger zones
    } else if (spectralClass.startsWith("A")) {
      return 2.0; // A-type stars are hot but not as extreme as O/B
    } else if (spectralClass.startsWith("F")) {
      return 1.5; // F-type stars are slightly hotter than G
    } else if (spectralClass.startsWith("K")) {
      return 0.7; // K-type stars are cooler than G
    } else if (spectralClass.startsWith("W")) {
      return 4.0; // Wolf-Rayet stars are extremely hot
    }
    // G-type stars (like our Sun) use the base scaling factor
    return 1.0;
  }

  /**
   * Calculate combined luminosity for multi-star systems
   */
  static calculateCombinedLuminosity(stars: CelestialObject[]): number {
    return stars.reduce((sum, star) => {
      // Use the pre-calculated luminosity from properties if it exists.
      const starLuminosity = (star.properties as any)?.luminosity;
      if (starLuminosity) {
        return sum + starLuminosity;
      }

      // Fallback to mass-based calculation if luminosity property is missing.
      const mass = star.realMass_kg || CONST.SOLAR_MASS_KG;
      const solarMasses = mass / CONST.SOLAR_MASS_KG;
      // Main sequence mass-luminosity relation: L ∝ M^3.5
      return sum + Math.pow(solarMasses, 3.5);
    }, 0);
  }

  /**
   * Gets formation probability modifier based on system complexity
   */
  static getComplexityFactor(config: StellarSystemConfiguration): number {
    switch (config.type) {
      case "SINGLE_STAR":
        return 1.0;
      case "BINARY_CLOSE":
        return 0.8; // Slightly reduced formation in close binaries
      case "BINARY_WIDE":
        return 1.1; // Enhanced formation in wide binaries
      case "TRIPLE_HIERARCHICAL":
        return 0.9;
      case "MULTIPLE_COMPLEX":
        return 0.7; // Reduced formation in complex systems
      default:
        return 1.0;
    }
  }

  /**
   * Scale zones based on stellar properties
   */
  static scaleZones(
    zones: CelestialZone[],
    stars: CelestialObject[],
    config: StellarSystemConfiguration,
  ): CelestialZone[] {
    if (stars.length === 0) return zones;

    const totalLuminosity = this.calculateCombinedLuminosity(stars);
    const complexity = this.getComplexityFactor(config);
    const scaledLuminosity = totalLuminosity * complexity;

    // Adjust zone boundaries based on luminosity
    const luminosityFactor = Math.sqrt(scaledLuminosity);

    return zones.map((zone) => ({
      ...zone,
      minAU: Math.min(
        zone.baseMinAU * luminosityFactor,
        CONST.SYSTEM_MAX_DISTANCE_AU,
      ),
      maxAU: Math.min(
        zone.baseMaxAU * luminosityFactor,
        CONST.SYSTEM_MAX_DISTANCE_AU,
      ),
      // Adjust formation probability based on system complexity
      formationProbability: zone.formationProbability * complexity,
    }));
  }
}
