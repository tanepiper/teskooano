import { CelestialObject } from "@teskooano/data-types";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import {
  renderCard,
  renderGravitationalInfluences,
  renderHierarchy,
  renderLightSources,
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
    const gravity = renderGravitationalInfluences(celestial);
    const lighting = renderLightSources(
      celestial,
      this.parentPanel?.lightSourceManager,
    );

    return `
        ${renderMainBody(celestial.name, celestial.type, celestial)}
        <div class="cards-container">
            ${renderCard("Hierarchy", hierarchy)}
            ${renderCard("Orbital Mechanics", orbit)}
            ${renderCard("Physical Properties", physical)}
            ${renderCard("Gravitational Forces", gravity)}
            ${renderCard("Light Sources", lighting)}
            ${renderCard("Real-time Physics", physics, "physics-card")}
        </div>
    `;
  }
}
