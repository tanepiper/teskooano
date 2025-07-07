import { PhysicalPropertiesCard } from "./PhysicalPropertiesCard.js";
import { GasGiantProperties, GasGiantClass } from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters.js";

export class GasGiantPhysicalPropertiesCard extends PhysicalPropertiesCard {
  static componentName = "gas-giant-physical-properties-card";

  constructor() {
    super();
    this.container.classList.add("gas-giant-properties");
  }

  protected gatherPhysicalProperties(): Array<{
    property: string;
    value: string;
  }> {
    // Get base physical properties first
    const properties = super.gatherPhysicalProperties();

    if (!this.currentCelestial) return properties;

    const giantProps = this.currentCelestial.properties as GasGiantProperties;

    // Add gas giant-specific properties
    if (giantProps?.atmosphereColor) {
      properties.push({
        property: "Atmosphere Color",
        value: giantProps.atmosphereColor,
      });
    }

    if (giantProps?.cloudColor) {
      properties.push({
        property: "Cloud Color",
        value: giantProps.cloudColor,
      });
    }

    if (giantProps?.cloudSpeed !== undefined) {
      properties.push({
        property: "Cloud Speed",
        value: FormatUtils.formatFix(giantProps.cloudSpeed, 2),
      });
    }

    if (giantProps?.stormColor) {
      properties.push({
        property: "Storm Color",
        value: giantProps.stormColor,
      });
    }

    if (giantProps?.classType) {
      properties.push({
        property: "Gas Giant Class",
        value: this.formatGasGiantClass(giantProps.classType),
      });
    }

    return properties;
  }

  /**
   * Formats gas giant class names and adds descriptive information.
   */
  private formatGasGiantClass(classType: GasGiantClass): string {
    switch (classType) {
      case GasGiantClass.CLASS_I:
        return "Class I (Ammonia clouds, Jupiter-like)";
      case GasGiantClass.CLASS_II:
        return "Class II (Water clouds, Saturn-like)";
      case GasGiantClass.CLASS_III:
        return "Class III (Ice Giant, Uranus/Neptune-like)";
      case GasGiantClass.CLASS_IV:
        return "Class IV (Alkali metal clouds, very hot)";
      case GasGiantClass.CLASS_V:
        return "Class V (Silicate clouds, extremely hot)";
      default:
        // Fallback for any raw string values that might exist
        return String(classType).replace(/_/g, " ").replace(/CLASS/g, "Class");
    }
  }
}
