import { CelestialObject } from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils";
import { baseStyles } from "../utils/CelestialStyles";
import { CelestialInfoComponent } from "../utils/CelestialInfoInterface";

export class GenericCelestialInfoComponent
  extends HTMLElement
  implements CelestialInfoComponent
{
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
            <style>${baseStyles}</style>
            <div id="container" class="placeholder">Loading celestial data...</div>
        `;
  }

  updateData(celestial: CelestialObject): void {
    const container = this.shadow.getElementById("container");
    if (!container) return;

    container.innerHTML = `
            <h3>${celestial.name}</h3>
            <dl class="info-grid">
                <dt>Type:</dt><dd>${celestial.type ?? "Unknown"}</dd>
                <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
                ${celestial.realMass_kg ? `<dt>Mass:</dt><dd>${FormatUtils.formatExp(celestial.realMass_kg, 4)} kg</dd>` : ""}
                ${celestial.realRadius_m ? `<dt>Radius:</dt><dd>${FormatUtils.formatDistanceKm(celestial.realRadius_m)}</dd>` : ""}
                ${celestial.temperature ? `<dt>Temp:</dt><dd>${FormatUtils.formatFix(celestial.temperature)} K</dd>` : ""}
                
                ${
                  celestial.orbit
                    ? `
                <dt>Semi-Major:</dt><dd>${FormatUtils.formatDistanceAU(celestial.orbit.realSemiMajorAxis_m)}</dd>
                <dt>Eccentricity:</dt><dd>${FormatUtils.formatFix(celestial.orbit.eccentricity, 4)}</dd>
                <dt>Inclination:</dt><dd>${FormatUtils.formatDegrees(celestial.orbit.inclination)}</dd>
                <dt>Period:</dt><dd>${FormatUtils.formatPeriod(celestial.orbit.period_s)}</dd>
                `
                    : ""
                }
            </dl>
        `;
  }
}

customElements.define("generic-celestial-info", GenericCelestialInfoComponent);
