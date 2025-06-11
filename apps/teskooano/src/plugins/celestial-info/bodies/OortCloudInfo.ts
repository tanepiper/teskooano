import {
  CelestialObject,
  CelestialType,
  OortCloudProperties,
  AU_METERS,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils.js";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";

export class OortCloudInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading Oort cloud data...");
  }

  protected render(celestial: CelestialObject): string {
    const properties = celestial.properties as OortCloudProperties;
    return `
      <h3>${celestial.name}</h3>
      <dl class="info-grid">
          <dt>Type:</dt><dd>Oort Cloud</dd>
          <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
          
          ${properties.innerRadiusAU ? `<dt>Inner Radius:</dt><dd>${FormatUtils.formatDistanceAU(properties.innerRadiusAU * AU_METERS)}</dd>` : ""} 
          ${properties.outerRadiusAU ? `<dt>Outer Radius:</dt><dd>${FormatUtils.formatDistanceAU(properties.outerRadiusAU * AU_METERS)}</dd>` : ""} 
          ${properties.visualParticleCount ? `<dt>Particle Count:</dt><dd>${properties.visualParticleCount.toLocaleString()}</dd>` : ""}
          ${properties.visualDensity ? `<dt>Density (visual):</dt><dd>${FormatUtils.formatFix(properties.visualDensity, 3)}</dd>` : ""}
          ${properties.composition ? `<dt>Composition:</dt><dd>${properties.composition.join(", ")}</dd>` : ""}
          ${properties.visualParticleColor ? `<dt>Color (visual):</dt><dd>${properties.visualParticleColor}</dd>` : ""}
          ${celestial.temperature ? `<dt>Temp:</dt><dd>${FormatUtils.formatFix(celestial.temperature)} K</dd>` : ""}
      </dl>
    `;
  }
}
