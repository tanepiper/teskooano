import { CelestialObject } from "@teskooano/data-types";
import {
  renderAlbedo,
  renderCard,
  renderHierarchy,
  renderMainBody,
  renderOrbitalParameters,
  renderPhysicalCharacteristics,
  renderPhysics,
  renderRingSystem,
  renderRotationalParameters,
} from "./common/render-helpers.js";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";

export class MoonInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading moon data...");
  }

  protected renderDetails(celestial: CelestialObject): string {
    const physical = renderPhysicalCharacteristics(celestial);
    const rotation = renderRotationalParameters(
      celestial.siderealRotationPeriod_s,
    );
    const albedo = renderAlbedo(celestial.albedo);
    const rings = renderRingSystem(celestial.id);

    const hierarchy = renderHierarchy(celestial);
    const orbit = renderOrbitalParameters(celestial.orbit);
    const physics = renderPhysics(celestial.id, celestial.physicsStateReal);

    return `
      ${renderMainBody(celestial.name, "Moon", celestial)}
      <div class="cards-container">
        ${renderCard("Hierarchy", hierarchy)}
        ${renderCard("Orbital Mechanics", orbit)}
        ${renderCard("Physical Properties", `${physical}${rotation}${albedo}${rings}`)}
        ${renderCard("Real-time Physics", physics, "physics-card")}
      </div>
    `;
  }
}
