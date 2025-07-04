import { CelestialObject, StarProperties } from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters";
import { BaseCelestialInfoComponent } from "./common/BaseCelestialInfoComponent.js";
import {
  renderCard,
  renderHierarchy,
  renderMainBody,
  renderOrbitalParameters,
  renderPhysicalCharacteristics,
  renderPhysics,
} from "./common/render-helpers.js";

export class StarInfoComponent extends BaseCelestialInfoComponent {
  constructor() {
    super("Loading star data...");
  }

  protected renderDetails(celestial: CelestialObject): string {
    const starProps = celestial.properties as StarProperties;

    let spectralDescription = "";
    if (starProps?.spectralClass) {
      if (starProps.spectralClass.includes("D")) {
        spectralDescription = ` (White Dwarf)`;
      } else if (starProps.spectralClass === "N") {
        spectralDescription = ` (Neutron Star)`;
      }
    }
    const subtitle = `Star - ${starProps?.spectralClass ?? "Unknown Class"}${spectralDescription}`;

    const colorName = FormatUtils.getStarColorName(starProps?.color);
    const colorDisplay = starProps?.color
      ? `${colorName} (${starProps.color})`
      : "N/A";

    const physical = renderPhysicalCharacteristics(celestial);
    const starSpecifics = `
        <dt>Spectral:</dt><dd>${starProps?.spectralClass ?? "N/A"}${spectralDescription}</dd>
        <dt>Luminosity:</dt><dd>${FormatUtils.formatExp(starProps?.luminosity, 2)} L☉</dd>
        <dt>Color:</dt><dd>${colorDisplay}</dd>
        ${starProps?.classType ? `<dt>Stellar Type:</dt><dd>${starProps.classType}</dd>` : ""}
    `;

    const hierarchy = renderHierarchy(celestial);
    const orbit = renderOrbitalParameters(celestial.orbit);
    const physics = renderPhysics(celestial.id, celestial.physicsStateReal);

    const partners =
      starProps?.partnerStars && starProps.partnerStars.length > 0
        ? `<dt>Partners:</dt><dd>${starProps.partnerStars.join(", ")}</dd>`
        : "";

    return `
      ${renderMainBody(celestial.name, subtitle, celestial)}
      <div class="cards-container">
        ${renderCard("Hierarchy", `${hierarchy}${partners}`)}
        ${renderCard("Orbital Mechanics", orbit)}
        ${renderCard("Physical Properties", `${physical}${starSpecifics}`)}
        ${renderCard("Real-time Physics", physics, "physics-card")}
      </div>
    `;
  }
}
