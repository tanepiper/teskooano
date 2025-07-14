import {
  CelestialObject,
  StarProperties,
  StellarType,
} from "@teskooano/data-types";
import {
  BaseCelestialInfoComponent,
  CardConfig,
} from "./common/BaseCelestialInfoComponent.js";

export class StarInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading star data...");
  }

  protected getTitle(celestial: CelestialObject): string {
    return celestial.name;
  }

  protected getSubtitle(celestial: CelestialObject): string {
    const props = celestial.properties as StarProperties;
    const stellarTypeFormatted = props.stellarType
      ? this.formatStellarType(props.stellarType)
      : celestial.type;
    return `${props.spectralClass} ${stellarTypeFormatted}`;
  }

  /**
   * Formats stellar type names properly.
   */
  private formatStellarType(stellarType: StellarType): string {
    switch (stellarType) {
      case StellarType.MAIN_SEQUENCE:
        return "Main Sequence Star";
      case StellarType.NEUTRON_STAR:
        return "Neutron Star";
      case StellarType.WHITE_DWARF:
        return "White Dwarf";
      case StellarType.WOLF_RAYET:
        return "Wolf-Rayet Star";
      case StellarType.BLACK_HOLE:
        return "Black Hole";

      default:
        // Fallback for any raw string values that might exist
        return String(stellarType)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  protected getCardConfigs(): CardConfig[] {
    return [
      { title: "Hierarchy", tagName: "star-hierarchy-card" },
      { title: "Orbital Mechanics", tagName: "orbital-mechanics-card" },
      {
        title: "Physical Properties",
        tagName: "star-physical-properties-card",
      },
      { title: "Gravitational Forces", tagName: "gravitational-forces-card" },
      {
        title: "Real-time Physics",
        tagName: "physics-card",
        extraClasses: "physics-card",
      },
    ];
  }
}
