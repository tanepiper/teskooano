import { CelestialObject } from "@teskooano/data-types";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import { renderMainProperties, renderOrbit } from "./common/render-helpers.js";

export class GenericCelestialInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading celestial data...");
  }

  protected renderDetails(celestial: CelestialObject): string {
    return `
      <dl class="info-grid">
          <dt>Type:</dt><dd>${celestial.type ?? "Unknown"}</dd>
          <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
          
          ${renderMainProperties(celestial)}
          ${renderOrbit(celestial.orbit)}
      </dl>
    `;
  }
}
