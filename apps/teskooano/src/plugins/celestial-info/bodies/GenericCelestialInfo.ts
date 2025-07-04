import { CelestialObject } from "@teskooano/data-types";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import {
  renderCard,
  renderHierarchy,
  renderMainBody,
  renderOrbitalParameters,
  renderPhysicalCharacteristics,
  renderPhysics,
} from "./common/render-helpers.js";

export class GenericCelestialInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading celestial data...");
  }

  protected renderDetails(celestial: CelestialObject): string {
    const physical = renderPhysicalCharacteristics(celestial);
    const hierarchy = renderHierarchy(celestial);
    const orbit = renderOrbitalParameters(celestial.orbit);
    const physics = renderPhysics(celestial.id, celestial.physicsStateReal);

    return `
        ${renderMainBody(celestial.name, celestial.type, celestial)}
        <div class="cards-container">
            ${renderCard("Hierarchy", hierarchy)}
            ${renderCard("Orbital Mechanics", orbit)}
            ${renderCard("Physical Properties", physical)}
            ${renderCard("Real-time Physics", physics, "physics-card")}
        </div>
    `;
  }
}
