import {
  CelestialObject,
  CelestialType,
  GasGiantProperties,
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

export class GasGiantInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading gas giant data...");
  }

  protected render(celestial: CelestialObject): string {
    const giantProps = celestial.properties as GasGiantProperties;

    return `
      <h3>${celestial.name}</h3>
      <dl class="info-grid">
          <dt>Type:</dt><dd>Gas Giant</dd>
          <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
          <dt>Class:</dt><dd>${giantProps?.gasGiantClass ?? "N/A"}</dd>
          
          ${renderMainProperties(celestial)}
          
          <dt>Atmosphere:</dt><dd>${giantProps?.atmosphereColor ? `${giantProps.atmosphereColor}` : "N/A"}</dd>
          <dt>Cloud Color:</dt><dd>${giantProps?.cloudColor ?? "N/A"}</dd>
          <dt>Cloud Speed:</dt><dd>${FormatUtils.formatFix(giantProps?.cloudSpeed, 2)}</dd>
          
          ${giantProps?.stormColor ? `<dt>Storm Color:</dt><dd>${giantProps.stormColor}</dd>` : ""}
          
          ${renderRingSystem(celestial.id)}
          ${renderOrbit(celestial.orbit)}
          ${renderRotation(celestial.siderealRotationPeriod_s)}
          ${renderAlbedo(celestial.albedo)}
      </dl>
    `;
  }
}
