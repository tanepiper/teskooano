import {
  CelestialObject,
  CelestialType,
  StarProperties,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils";
import { baseStyles } from "../utils/CelestialStyles";
import { CelestialInfoComponent } from "../utils/CelestialInfoInterface";

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

    // Get stellar type description from our data-driven approach
    const getStellarTypeDescription = (stellarType?: string): string => {
      switch (stellarType) {
        case "MAIN_SEQUENCE":
          return "Main Sequence";
        case "RED_GIANT":
          return "Red Giant";
        case "BLUE_GIANT":
          return "Blue Giant";
        case "SUPERGIANT":
          return "Supergiant";
        case "HYPERGIANT":
          return "Hypergiant";
        case "SUBGIANT":
          return "Subgiant";
        case "WOLF_RAYET":
          return "Wolf-Rayet";
        case "CARBON_STAR":
          return "Carbon Star";
        case "VARIABLE_STAR":
          return "Variable Star";
        case "PROTOSTAR":
          return "Protostar";
        case "T_TAURI":
          return "T Tauri";
        case "HERBIG_AE_BE":
          return "Herbig Ae/Be";
        case "WHITE_DWARF":
          return "White Dwarf";
        case "NEUTRON_STAR":
          return "Neutron Star";
        case "BLACK_HOLE":
          return "Black Hole";
        default:
          return stellarType || "Unknown";
      }
    };

    const stellarTypeDescription = getStellarTypeDescription(
      starProps?.stellarType,
    );

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
                  4,
                )} kg</dd>
                <dt>Radius:</dt><dd>${FormatUtils.formatDistanceKm(
                  celestial.realRadius_m,
                )}</dd>
                <dt>Temp:</dt><dd>${FormatUtils.formatFix(
                  celestial.temperature,
                )} K</dd>
                
                <dt>Stellar Type:</dt><dd>${stellarTypeDescription}</dd>
                <dt>Spectral Class:</dt><dd>${starProps?.spectralClass ?? "N/A"}</dd>
                <dt>Luminosity:</dt><dd>${FormatUtils.formatExp(
                  starProps?.luminosity,
                  2,
                )} L☉</dd>
                <dt>Color:</dt><dd>${colorDisplay}</dd>
                
                ${
                  celestial.orbit?.realSemiMajorAxis_m
                    ? `
                <dt>Orbit Size:</dt><dd>${FormatUtils.formatDistanceAU(
                  celestial.orbit.realSemiMajorAxis_m,
                )}</dd>
                <dt>Eccentricity:</dt><dd>${FormatUtils.formatFix(
                  celestial.orbit.eccentricity,
                  4,
                )}</dd>
                <dt>Period:</dt><dd>${FormatUtils.formatPeriod(
                  celestial.orbit.period_s,
                )}</dd>
                `
                    : ""
                }
                
                ${
                  starProps?.characteristics &&
                  Object.keys(starProps.characteristics).length > 0
                    ? `<dt>Special Properties:</dt><dd>${Object.entries(
                        starProps.characteristics,
                      )
                        .map(([key, value]) => {
                          // Format special characteristics for better readability
                          const formattedKey = key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase());
                          let formattedValue = value;

                          // Format specific types of values
                          if (typeof value === "number") {
                            if (key.includes("Rate") || key.includes("rate")) {
                              formattedValue = FormatUtils.formatExp(value, 2);
                            } else if (
                              key.includes("Period") ||
                              key.includes("period")
                            ) {
                              formattedValue = `${FormatUtils.formatFix(value, 1)} days`;
                            } else if (
                              key.includes("Velocity") ||
                              key.includes("velocity")
                            ) {
                              formattedValue = `${FormatUtils.formatFix(value, 0)} km/s`;
                            } else if (
                              key.includes("Ratio") ||
                              key.includes("ratio")
                            ) {
                              formattedValue = FormatUtils.formatFix(value, 2);
                            } else {
                              formattedValue = FormatUtils.formatFix(value, 2);
                            }
                          } else if (typeof value === "boolean") {
                            formattedValue = value ? "Yes" : "No";
                          }

                          return `${formattedKey}: ${formattedValue}`;
                        })
                        .join("<br/>")}</dd>`
                    : ""
                }
                
                ${
                  starProps?.partnerStars && starProps.partnerStars.length > 0
                    ? `<dt>Partners:</dt><dd>${starProps.partnerStars.join(
                        ", ",
                      )}</dd>`
                    : ""
                }
            </dl>
        `;
  }
}
