import {
  AU_METERS,
  CelestialObject,
  OortCloudProperties,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import {
  renderCard,
  renderHierarchy,
  renderMainBody,
  renderPhysics,
} from "./common/render-helpers.js";

export class OortCloudInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading Oort cloud data...");
  }

  protected renderDetails(celestial: CelestialObject): string {
    const properties = celestial.properties as OortCloudProperties;
    const physical = `
          ${properties.innerRadiusAU ? `<dt>Inner Radius:</dt><dd>${FormatUtils.formatDistanceAU(properties.innerRadiusAU * AU_METERS)}</dd>` : ""} 
          ${properties.outerRadiusAU ? `<dt>Outer Radius:</dt><dd>${FormatUtils.formatDistanceAU(properties.outerRadiusAU * AU_METERS)}</dd>` : ""} 
          ${properties.visualParticleCount ? `<dt>Particle Count:</dt><dd>${properties.visualParticleCount.toLocaleString()}</dd>` : ""}
          ${properties.visualDensity ? `<dt>Density (visual):</dt><dd>${FormatUtils.formatFix(properties.visualDensity, 3)}</dd>` : ""}
          ${properties.composition ? `<dt>Composition:</dt><dd>${properties.composition.join(", ")}</dd>` : ""}
          ${properties.visualParticleColor ? `<dt>Color (visual):</dt><dd>${properties.visualParticleColor}</dd>` : ""}
          ${celestial.temperature ? `<dt>Temp:</dt><dd>${FormatUtils.formatFix(celestial.temperature)} K</dd>` : ""}
    `;

    const hierarchy = renderHierarchy(celestial);
    const physics = renderPhysics(celestial.id, celestial.physicsStateReal);

    return `
      ${renderMainBody(celestial.name, "Oort Cloud", celestial)}
        <div class="cards-container">
            ${renderCard("Hierarchy", hierarchy)}
            ${renderCard("Physical Properties", physical)}
            ${renderCard("Real-time Physics", physics, "physics-card")}
        </div>
    `;
  }
}
