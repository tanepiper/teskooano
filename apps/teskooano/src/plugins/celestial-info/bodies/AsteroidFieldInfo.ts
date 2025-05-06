import {
  CelestialObject,
  CelestialType,
  AsteroidFieldProperties,
  AU_METERS,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils";
import { baseStyles } from "../utils/CelestialStyles";
import { CelestialInfoComponent } from "../utils/CelestialInfoInterface";

export class AsteroidFieldInfoComponent
  extends HTMLElement
  implements CelestialInfoComponent
{
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
            <style>${baseStyles}</style>
            <div id="container" class="placeholder">Loading asteroid field data...</div>
        `;
  }

  updateData(celestial: CelestialObject): void {
    if (celestial.type !== CelestialType.ASTEROID_FIELD) {
      console.warn(
        "AsteroidFieldInfoComponent received non-asteroid field data",
      );
      return;
    }

    const container = this.shadow.getElementById("container");
    if (!container) return;

    if (
      celestial.type === CelestialType.ASTEROID_FIELD &&
      celestial.properties
    ) {
      const properties = celestial.properties as AsteroidFieldProperties;

      container.innerHTML = `
                <h3>${celestial.name}</h3>
                <dl class="info-grid">
                    <dt>Type:</dt><dd>Asteroid Field</dd>
                    <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
                    
                    ${
                      celestial.orbit
                        ? `
                    <dt>Inner Radius:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m * (1 - celestial.orbit.eccentricity))}</dd>
                    <dt>Outer Radius:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m * (1 + celestial.orbit.eccentricity))}</dd>
                    <dt>Width:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m * celestial.orbit.eccentricity * 2)}</dd>
                    <dt>Inclination:</dt><dd>${FormatUtils.formatDegrees(celestial.orbit.inclination)}</dd>
                    `
                        : ""
                    }
                    
                    ${properties.innerRadiusAU ? `<dt>Inner Radius (Prop):</dt><dd>${FormatUtils.formatDistanceAU(properties.innerRadiusAU * AU_METERS)}</dd>` : ""} 
                    ${properties.outerRadiusAU ? `<dt>Outer Radius (Prop):</dt><dd>${FormatUtils.formatDistanceAU(properties.outerRadiusAU * AU_METERS)}</dd>` : ""} 
                    ${properties.count ? `<dt>Count:</dt><dd>${properties.count.toLocaleString()}</dd>` : ""} 
                    ${properties.composition ? `<dt>Composition:</dt><dd>${properties.composition.join(", ")}</dd>` : ""}
                    ${properties.color ? `<dt>Color:</dt><dd>${properties.color}</dd>` : ""} 
                </dl>
            `;
    } else {
      container.innerHTML = `<div class="placeholder">Asteroid field data incomplete.</div>`;
    }
  }
}

customElements.define("asteroid-field-info", AsteroidFieldInfoComponent);
