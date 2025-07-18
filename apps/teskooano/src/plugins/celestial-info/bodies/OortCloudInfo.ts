import { CelestialObject, OortCloudProperties } from "@teskooano/data-types";
import {
  BaseCelestialInfoComponent,
  CardConfig,
} from "./common/BaseCelestialInfoComponent.js";

export class OortCloudInfoComponent extends BaseCelestialInfoComponent<OortCloudProperties> {
  constructor() {
    super("Loading Oort Cloud data...");
  }

  protected getTitle(celestial: CelestialObject<OortCloudProperties>): string {
    return celestial.name;
  }

  protected getSubtitle(
    celestial: CelestialObject<OortCloudProperties>,
  ): string {
    return "Oort Cloud";
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
