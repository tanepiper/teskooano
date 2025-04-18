import {
  CelestialObject,
  CelestialType,
  StarProperties,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils";
import { baseStyles } from "../utils/CelestialStyles";
import { CelestialInfoComponent } from "../utils/CelestialInfoInterface";

// --- STAR INFO COMPONENT ---
export class StarInfoComponent
  extends HTMLElement
  implements CelestialInfoComponent
{
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
            <style>${baseStyles}</style>
            <div id="container" class="placeholder">Loading star data...</div>
        `;
  }

  updateData(celestial: CelestialObject): void {
    if (celestial.type !== CelestialType.STAR) {
      console.warn("StarInfoComponent received non-star data");
      return;
    }

    const container = this.shadow.getElementById("container");
    if (!container) return;

    const starProps = celestial.properties as StarProperties;

    // Add descriptive text for special star types
    let spectralDescription = "";
    if (starProps?.spectralClass) {
      // Check for white dwarf (ends with D)
      if (starProps.spectralClass.includes("D")) {
        spectralDescription = ` (White Dwarf)`;
      }
      // Check for neutron star
      else if (starProps.spectralClass === "N") {
        spectralDescription = ` (Neutron Star)`;
      }
    }

    // Get descriptive color name
    const colorName = FormatUtils.getStarColorName(starProps?.color);
    const colorDisplay = starProps?.color
      ? `${colorName} (${starProps.color})`
      : "N/A";

    container.innerHTML = `
            <h3>${celestial.name}</h3>
            <dl class="info-grid">
                <dt>Type:</dt><dd>Star</dd>
                ${
                  starProps?.isMainStar ? `<dt>Main Star:</dt><dd>Yes</dd>` : ""
                }
                ${
                  !starProps?.isMainStar
                    ? `<dt>Orbiting:</dt><dd>${
                        celestial.parentId ?? "N/A"
                      }</dd>`
                    : ""
                }
                <dt>Mass:</dt><dd>${FormatUtils.formatExp(
                  celestial.realMass_kg,
                  4
                )} kg</dd>
                <dt>Radius:</dt><dd>${FormatUtils.formatDistanceKm(
                  celestial.realRadius_m
                )}</dd>
                <dt>Temp:</dt><dd>${FormatUtils.formatFix(
                  celestial.temperature
                )} K</dd>
                
                <dt>Spectral:</dt><dd>${
                  starProps?.spectralClass ?? "N/A"
                }${spectralDescription}</dd>
                <dt>Luminosity:</dt><dd>${FormatUtils.formatExp(
                  starProps?.luminosity,
                  2
                )} L☉</dd>
                <dt>Color:</dt><dd>${colorDisplay}</dd>
                
                ${
                  celestial.orbit?.realSemiMajorAxis_m
                    ? `
                <dt>Orbit Size:</dt><dd>${FormatUtils.formatDistanceAU(
                  celestial.orbit.realSemiMajorAxis_m
                )}</dd>
                <dt>Eccentricity:</dt><dd>${FormatUtils.formatFix(
                  celestial.orbit.eccentricity,
                  4
                )}</dd>
                <dt>Period:</dt><dd>${FormatUtils.formatPeriod(
                  celestial.orbit.period_s
                )}</dd>
                `
                    : ""
                }
                
                ${
                  starProps?.stellarType
                    ? `<dt>Stellar Type:</dt><dd>${starProps.stellarType}</dd>`
                    : ""
                }
                
                ${
                  starProps?.partnerStars && starProps.partnerStars.length > 0
                    ? `<dt>Partners:</dt><dd>${starProps.partnerStars.join(
                        ", "
                      )}</dd>`
                    : ""
                }
            </dl>
        `;
  }
}

// Define the custom element
customElements.define("star-info", StarInfoComponent);
