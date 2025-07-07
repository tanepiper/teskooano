import { CelestialObject } from "@teskooano/data-types";
import {
  BaseCelestialInfoComponent,
  CardConfig,
} from "./common/BaseCelestialInfoComponent.js";

export class GenericCelestialInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading celestial data...");
  }

  protected getTitle(celestial: CelestialObject): string {
    return celestial.name;
  }

  protected getSubtitle(celestial: CelestialObject): string {
    return celestial.type;
  }

  protected getCardConfigs(): CardConfig[] {
    return [
      { title: "Hierarchy", tagName: "hierarchy-card" },
      { title: "Orbital Mechanics", tagName: "orbital-mechanics-card" },
      { title: "Physical Properties", tagName: "physical-properties-card" },
      { title: "Gravitational Forces", tagName: "gravitational-forces-card" },
      { title: "Light Sources", tagName: "light-sources-card" },
      {
        title: "Real-time Physics",
        tagName: "physics-card",
        extraClasses: "physics-card",
      },
    ];
  }
}
