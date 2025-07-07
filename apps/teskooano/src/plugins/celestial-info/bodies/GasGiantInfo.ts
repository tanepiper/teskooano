import {
  CelestialObject,
  GasGiantProperties,
  GasGiantClass,
} from "@teskooano/data-types";
import {
  BaseCelestialInfoComponent,
  CardConfig,
} from "./common/BaseCelestialInfoComponent.js";

export class GasGiantInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading gas giant data...");
  }

  protected getTitle(celestial: CelestialObject): string {
    return celestial.name;
  }

  protected getSubtitle(celestial: CelestialObject): string {
    const props = celestial.properties as GasGiantProperties;
    const formattedClass = this.formatGasGiantClass(props.classType);
    return `${formattedClass} Gas Giant`;
  }

  /**
   * Formats gas giant class names properly.
   */
  private formatGasGiantClass(classType: GasGiantClass): string {
    switch (classType) {
      case GasGiantClass.CLASS_I:
        return "Class I";
      case GasGiantClass.CLASS_II:
        return "Class II";
      case GasGiantClass.CLASS_III:
        return "Class III";
      case GasGiantClass.CLASS_IV:
        return "Class IV";
      case GasGiantClass.CLASS_V:
        return "Class V";
      default:
        // Fallback for any raw string values that might exist
        return String(classType).replace(/_/g, " ").replace(/CLASS/g, "Class");
    }
  }

  protected getCardConfigs(): CardConfig[] {
    return [
      { title: "Hierarchy", tagName: "hierarchy-card" },
      { title: "Orbital Mechanics", tagName: "orbital-mechanics-card" },
      {
        title: "Physical Properties",
        tagName: "gas-giant-physical-properties-card",
      },
      { title: "Gravitational Forces", tagName: "gravitational-forces-card" },
      { title: "Light Sources", tagName: "light-sources-card" },
      { title: "Shadow Sources", tagName: "shadow-sources-card" },
      {
        title: "Real-time Physics",
        tagName: "physics-card",
        extraClasses: "physics-card",
      },
    ];
  }
}
