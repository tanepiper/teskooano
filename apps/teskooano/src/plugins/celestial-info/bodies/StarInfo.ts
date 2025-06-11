import {
  CelestialObject,
  CelestialType,
  StarProperties,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils.js";
import { renderMainProperties } from "./common/render-helpers.js";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";

export class StarInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading star data...");
  }

  protected render(celestial: CelestialObject): string {
    const starProps = celestial.properties as StarProperties;

    let spectralDescription = "";
    if (starProps?.spectralClass) {
      if (starProps.spectralClass.includes("D")) {
        spectralDescription = ` (White Dwarf)`;
      } else if (starProps.spectralClass === "N") {
        spectralDescription = ` (Neutron Star)`;
      }
    }

    const colorName = FormatUtils.getStarColorName(starProps?.color);
    const colorDisplay = starProps?.color
      ? `${colorName} (${starProps.color})`
      : "N/A";

    return `
      <h3>${celestial.name}</h3>
      <dl class="info-grid">
          <dt>Type:</dt><dd>Star</dd>
          ${starProps?.isMainStar ? `<dt>Main Star:</dt><dd>Yes</dd>` : ""}
          ${!starProps?.isMainStar ? `<dt>Orbiting:</dt><dd>${celestial.parentId ?? "N/A"}</dd>` : ""}
          
          ${renderMainProperties(celestial)}

          <dt>Spectral:</dt><dd>${starProps?.spectralClass ?? "N/A"}${spectralDescription}</dd>
          <dt>Luminosity:</dt><dd>${FormatUtils.formatExp(starProps?.luminosity, 2)} L☉</dd>
          <dt>Color:</dt><dd>${colorDisplay}</dd>
          
          ${celestial.orbit?.realSemiMajorAxis_m ? `<dt>Orbit Size:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m)}</dd>` : ""}
          ${celestial.orbit?.eccentricity ? `<dt>Eccentricity:</dt><dd>${FormatUtils.formatFix(celestial.orbit.eccentricity, 4)}</dd>` : ""}
          ${celestial.orbit?.period_s ? `<dt>Period:</dt><dd>${FormatUtils.formatPeriod(celestial.orbit.period_s)}</dd>` : ""}
          
          ${starProps?.stellarType ? `<dt>Stellar Type:</dt><dd>${starProps.stellarType}</dd>` : ""}
          
          ${starProps?.partnerStars && starProps.partnerStars.length > 0 ? `<dt>Partners:</dt><dd>${starProps.partnerStars.join(", ")}</dd>` : ""}
      </dl>
    `;
  }
}
