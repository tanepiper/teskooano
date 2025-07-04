import {
  AsteroidFieldProperties,
  CelestialObject,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import {
  renderCard,
  renderHierarchy,
  renderMainBody,
  renderOrbitalParameters,
  renderPhysics,
} from "./common/render-helpers.js";

export class AsteroidFieldInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading asteroid field data...");
  }

  protected renderDetails(celestial: CelestialObject): string {
    const properties = celestial.properties as AsteroidFieldProperties;

    const physical = `
          ${properties.count ? `<dt>Count:</dt><dd>${properties.count.toLocaleString()}</dd>` : ""}
          ${properties.composition ? `<dt>Composition:</dt><dd>${properties.composition.join(", ")}</dd>` : ""}
          ${properties.color ? `<dt>Color:</dt><dd>${properties.color}</dd>` : ""}
    `;

    const hierarchy = renderHierarchy(celestial);
    const orbit = renderOrbitalParameters(celestial.orbit);
    const physics = renderPhysics(celestial.id, celestial.physicsStateReal);

    return `
      ${renderMainBody(celestial.name, "Asteroid Field", celestial)}
      <div class="cards-container">
          ${renderCard("Hierarchy", hierarchy)}
          ${renderCard("Orbital Mechanics", orbit)}
          ${renderCard("Physical Properties", physical)}
          ${renderCard("Real-time Physics", physics, "physics-card")}
      </div>
    `;
  }
}
