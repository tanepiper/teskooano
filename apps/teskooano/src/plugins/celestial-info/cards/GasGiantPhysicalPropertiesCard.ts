import { PhysicalPropertiesCard } from "./PhysicalPropertiesCard.js";
import { GasGiantProperties } from "@teskooano/data-types";
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
        value: giantProps.classType,
      });
    }

    return properties;
  }
}
