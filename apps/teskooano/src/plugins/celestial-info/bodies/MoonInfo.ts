import { CelestialObject, PlanetProperties } from "@teskooano/data-types";
import {
  BaseCelestialInfoComponent,
  CardConfig,
} from "./common/BaseCelestialInfoComponent.js";

export class MoonInfoComponent extends BaseCelestialInfoComponent<PlanetProperties> {
  constructor() {
    super("Loading moon data...");
  }

  protected getTitle(celestial: CelestialObject<PlanetProperties>): string {
    return celestial.name;
  }

  protected getSubtitle(celestial: CelestialObject<PlanetProperties>): string {
    return "Moon";
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
