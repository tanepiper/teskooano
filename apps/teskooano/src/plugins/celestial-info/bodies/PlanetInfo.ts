import {
  CelestialObject,
  CelestialType,
  PlanetProperties,
} from "@teskooano/data-types";
import {
  renderAlbedo,
  renderMainBody,
  renderCard,
  renderGravitationalInfluences,
  renderHierarchy,
  renderLightSources,
  renderOrbitalParameters,
  renderPhysicalCharacteristics,
  renderRingSystem,
  renderRotationalParameters,
  renderPhysics,
} from "./common/render-helpers.js";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";

export class PlanetInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading planet data...");
  }

  protected renderDetails(celestial: CelestialObject): string {
    const planetProps = celestial.properties as PlanetProperties;
    const subtitle =
      celestial.type === CelestialType.DWARF_PLANET ? "Dwarf Planet" : "Planet";

    const physical = renderPhysicalCharacteristics(celestial);
    const rotation = renderRotationalParameters(
      celestial.siderealRotationPeriod_s,
    );
    const albedo = renderAlbedo(celestial.albedo);
    const rings = renderRingSystem(celestial.id);

    const hierarchy = renderHierarchy(celestial);
    const orbit = renderOrbitalParameters(celestial.orbit);
    const physics = renderPhysics(celestial.id, celestial.physicsStateReal);
    const gravity = renderGravitationalInfluences(celestial);
    const lighting = renderLightSources(
      celestial,
      this.parentPanel?.lightSourceManager,
    );

    return `
      ${renderMainBody(celestial.name, subtitle, celestial)}
      <div class="cards-container">
        ${renderCard("Hierarchy", hierarchy)}
        ${renderCard("Orbital Mechanics", orbit)}
        ${renderCard("Physical Properties", `${physical}${rotation}${albedo}${rings}`)}
        ${renderCard("Gravitational Forces", gravity)}
        ${renderCard("Light Sources", lighting)}
        ${renderCard("Real-time Physics", physics, "physics-card")}
      </div>
    `;
  }
}
