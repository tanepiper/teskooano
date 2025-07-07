import { PhysicalPropertiesCard } from "./PhysicalPropertiesCard.js";
import { StarProperties } from "@teskooano/data-types";
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

    if (starProps?.classType) {
      properties.push({
        property: "Stellar Type",
        value: starProps.classType,
      });
    }

    return properties;
  }
}
