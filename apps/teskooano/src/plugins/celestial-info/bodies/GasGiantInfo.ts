import { CelestialObject, GasGiantProperties } from "@teskooano/data-types";
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
    return `${props.classType} Gas Giant`;
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
      {
        title: "Real-time Physics",
        tagName: "physics-card",
        extraClasses: "physics-card",
      },
    ];
  }
}
