import {
  CelestialObject,
  CelestialType,
  PlanetProperties,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils.js";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import {
  renderAlbedo,
  renderMainProperties,
  renderOrbit,
  renderRingSystem,
  renderRotation,
} from "./common/render-helpers.js";

export class PlanetInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading planet data...");
  }

  protected render(celestial: CelestialObject): string {
    const planetProps = celestial.properties as PlanetProperties;
    const surface = planetProps?.surface;
    const atmosphere = planetProps?.atmosphere;

    return `
      <h3>${celestial.name}</h3>
      <dl class="info-grid">
          <dt>Type:</dt><dd>${celestial.type === CelestialType.DWARF_PLANET ? "Dwarf Planet" : "Planet"}</dd>
          <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
          <dt>Planet Type:</dt><dd>${planetProps?.planetType ?? "N/A"}</dd>
          
          ${renderMainProperties(celestial)}
          
          ${surface ? `<dt>Surface:</dt><dd>${surface.type ?? "N/A"}</dd>` : ""}
          ${surface ? `<dt>Roughness:</dt><dd>${FormatUtils.formatFix(surface.roughness, 2)}</dd>` : ""}
          
          ${renderRingSystem(celestial.id)}
          ${renderOrbit(celestial.orbit)}
          ${renderRotation(celestial.siderealRotationPeriod_s)}
          ${renderAlbedo(celestial.albedo)}
      </dl>
    `;
  }
}
