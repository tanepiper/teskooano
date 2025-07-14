import { PhysicalPropertiesCard } from "./PhysicalPropertiesCard.js";
import { StarProperties, StellarType } from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters.js";

export class StarPhysicalPropertiesCard extends PhysicalPropertiesCard {
  static componentName = "star-physical-properties-card";

  constructor() {
    super();
    this.container.classList.add("star-properties");
  }

  protected gatherPhysicalProperties(): Array<{
    property: string;
    value: string;
  }> {
    // Get base physical properties first
    const properties = super.gatherPhysicalProperties();

    if (!this.currentCelestial) return properties;

    const starProps = this.currentCelestial.properties as StarProperties;

    // Add stellar-specific properties
    if (starProps?.spectralClass) {
      let spectralDescription = "";
      if (starProps.spectralClass.includes("D")) {
        spectralDescription = " (White Dwarf)";
      } else if (starProps.spectralClass === "N") {
        spectralDescription = " (Neutron Star)";
      }

      properties.push({
        property: "Spectral Class",
        value: `${starProps.spectralClass}${spectralDescription}`,
      });
    }

    if (starProps?.luminosity) {
      properties.push({
        property: "Luminosity",
        value: `${FormatUtils.formatExp(starProps.luminosity, 2)} L☉`,
      });
    }

    if (starProps?.color) {
      const colorName = FormatUtils.getStarColorName(starProps.color);
      properties.push({
        property: "Color",
        value: `${colorName} (${starProps.color})`,
      });
    }

    if (starProps?.stellarType) {
      properties.push({
        property: "Stellar Type",
        value: this.formatStellarType(starProps.stellarType),
      });
    }

    return properties;
  }

  /**
   * Formats stellar type names and adds descriptive information.
   */
  private formatStellarType(stellarType: StellarType): string {
    switch (stellarType) {
      case StellarType.MAIN_SEQUENCE:
        return "Main Sequence (Hydrogen-fusing star)";
      case StellarType.NEUTRON_STAR:
        return "Neutron Star (Dense stellar remnant)";
      case StellarType.WHITE_DWARF:
        return "White Dwarf (Low-mass stellar remnant)";
      case StellarType.WOLF_RAYET:
        return "Wolf-Rayet (Hot, massive star with strong winds)";
      case StellarType.BLACK_HOLE:
        return "Black Hole (Collapsed massive star)";
      default:
        // Fallback for any raw string values that might exist
        return String(stellarType)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }
}
