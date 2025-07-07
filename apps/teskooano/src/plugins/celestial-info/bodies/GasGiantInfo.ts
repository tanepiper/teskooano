import { CelestialObject, GasGiantProperties } from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters.js";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import {
  renderAlbedo,
  renderCard,
  renderGravitationalInfluences,
  renderHierarchy,
  renderLightSources,
  renderMainBody,
  renderOrbitalParameters,
  renderPhysicalCharacteristics,
  renderPhysics,
  renderRingSystem,
  renderRotationalParameters,
} from "./common/render-helpers.js";

export class GasGiantInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading gas giant data...");
  }

  protected renderDetails(celestial: CelestialObject): string {
    const giantProps = celestial.properties as GasGiantProperties;
    const subtitle = `Gas Giant - ${giantProps?.classType ?? "Unknown Class"}`;

    const physical = renderPhysicalCharacteristics(celestial);
    const rotation = renderRotationalParameters(
      celestial.siderealRotationPeriod_s,
    );
    const albedo = renderAlbedo(celestial.albedo);
    const rings = renderRingSystem(celestial.id);
    const giantSpecifics = `
        <dt>Atmosphere:</dt><dd>${giantProps?.atmosphereColor ? `${giantProps.atmosphereColor}` : "N/A"}</dd>
        <dt>Cloud Color:</dt><dd>${giantProps?.cloudColor ?? "N/A"}</dd>
        <dt>Cloud Speed:</dt><dd>${FormatUtils.formatFix(giantProps?.cloudSpeed, 2)}</dd>
        ${giantProps?.stormColor ? `<dt>Storm Color:</dt><dd>${giantProps.stormColor}</dd>` : ""}
    `;

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
        ${renderCard("Physical Properties", `${physical}${rotation}${albedo}${rings}${giantSpecifics}`)}
        ${renderCard("Gravitational Forces", gravity)}
        ${renderCard("Light Sources", lighting)}
        ${renderCard("Real-time Physics", physics, "physics-card")}
      </div>
    `;
  }
}
