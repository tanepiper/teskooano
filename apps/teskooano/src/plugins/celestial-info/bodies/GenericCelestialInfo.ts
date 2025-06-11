import { CelestialObject } from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils.js";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import { renderMainProperties, renderOrbit } from "./common/render-helpers.js";

export class GenericCelestialInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading celestial data...");
  }

  protected render(celestial: CelestialObject): string {
    return `
      <h3>${celestial.name}</h3>
      <dl class="info-grid">
          <dt>Type:</dt><dd>${celestial.type ?? "Unknown"}</dd>
          <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
          
          ${renderMainProperties(celestial)}
          ${renderOrbit(celestial.orbit)}
      </dl>
    `;
  }
}
