import {
  CelestialObject,
  CelestialType,
  PlanetProperties,
} from "@teskooano/data-types";
import {
  BaseCelestialInfoComponent,
  CardConfig,
} from "./common/BaseCelestialInfoComponent.js";

export class PlanetInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading planet data...");
  }

  protected getTitle(celestial: CelestialObject): string {
    return celestial.name;
  }

  protected getSubtitle(celestial: CelestialObject): string {
    return celestial.type === CelestialType.DWARF_PLANET
      ? "Dwarf Planet"
      : "Planet";
  }

  protected getCardConfigs(): CardConfig[] {
    return [
      { title: "Hierarchy", tagName: "hierarchy-card" },
      { title: "Orbital Mechanics", tagName: "orbital-mechanics-card" },
      { title: "Physical Properties", tagName: "physical-properties-card" },
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
