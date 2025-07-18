import {
  CelestialObject,
  PlanetProperties,
  PlanetType,
} from "@teskooano/data-types";
import {
  BaseCelestialInfoComponent,
  CardConfig,
} from "./common/BaseCelestialInfoComponent.js";

export class PlanetInfoComponent extends BaseCelestialInfoComponent<PlanetProperties> {
  constructor() {
    super("Loading planet data...");
  }

  protected getTitle(celestial: CelestialObject<PlanetProperties>): string {
    return celestial.name;
  }

  protected getSubtitle(celestial: CelestialObject<PlanetProperties>): string {
    const props = celestial.properties!;
    const planetType = props.classType || PlanetType.ROCKY;
    return `${planetType} ${celestial.type.toLowerCase()}`;
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
