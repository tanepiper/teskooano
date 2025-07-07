import { CelestialObject, StarProperties } from "@teskooano/data-types";
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
    return `${props.spectralClass} ${celestial.type}`;
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
      { title: "Light Sources", tagName: "light-sources-card" },
      {
        title: "Real-time Physics",
        tagName: "physics-card",
        extraClasses: "physics-card",
      },
    ];
  }
}
