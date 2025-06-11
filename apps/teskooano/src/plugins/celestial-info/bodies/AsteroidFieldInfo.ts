import {
  CelestialObject,
  CelestialType,
  AsteroidFieldProperties,
  AU_METERS,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils.js";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";

export class AsteroidFieldInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading asteroid field data...");
  }

  protected render(celestial: CelestialObject): string {
    const properties = celestial.properties as AsteroidFieldProperties;

    return `
      <h3>${celestial.name}</h3>
      <dl class="info-grid">
          <dt>Type:</dt><dd>Asteroid Field</dd>
          <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
          
          ${
            celestial.orbit
              ? `
          <dt>Inner Radius:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m * (1 - celestial.orbit.eccentricity))}</dd>
          <dt>Outer Radius:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m * (1 + celestial.orbit.eccentricity))}</dd>
          <dt>Width:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m * celestial.orbit.eccentricity * 2)}</dd>
          <dt>Inclination:</dt><dd>${FormatUtils.formatDegrees(celestial.orbit.inclination)}</dd>
          `
              : ""
          }
          
          ${properties.innerRadiusAU ? `<dt>Inner Radius (Prop):</dt><dd>${FormatUtils.formatDistanceAU(properties.innerRadiusAU * AU_METERS)}</dd>` : ""} 
          ${properties.outerRadiusAU ? `<dt>Outer Radius (Prop):</dt><dd>${FormatUtils.formatDistanceAU(properties.outerRadiusAU * AU_METERS)}</dd>` : ""} 
          ${properties.count ? `<dt>Count:</dt><dd>${properties.count.toLocaleString()}</dd>` : ""} 
          ${properties.composition ? `<dt>Composition:</dt><dd>${properties.composition.join(", ")}</dd>` : ""}
          ${properties.color ? `<dt>Color:</dt><dd>${properties.color}</dd>` : ""} 
      </dl>
    `;
  }
}
