import {
  CelestialObject,
  CelestialType,
  OortCloudProperties,
  AU_METERS,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/FormatUtils";
import { baseStyles } from "../utils/CelestialStyles";
import { CelestialInfoComponent } from "../utils/CelestialInfoInterface";

export class OortCloudInfoComponent
  extends HTMLElement
  implements CelestialInfoComponent
{
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
            <style>${baseStyles}</style>
            <div id="container" class="placeholder">Loading Oort cloud data...</div>
        `;
  }

  updateData(celestial: CelestialObject): void {
    if (celestial.type !== CelestialType.OORT_CLOUD) {
      console.warn("OortCloudInfoComponent received non-Oort cloud data");
      return;
    }

    const container = this.shadow.getElementById("container");
    if (!container) return;

    if (celestial.type === CelestialType.OORT_CLOUD && celestial.properties) {
      const properties = celestial.properties as OortCloudProperties;

      container.innerHTML = `
                <h3>${celestial.name}</h3>
                <dl class="info-grid">
                    <dt>Type:</dt><dd>Oort Cloud</dd>
                    <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
                    
                    ${properties.innerRadiusAU ? `<dt>Inner Radius:</dt><dd>${FormatUtils.formatDistanceAU(properties.innerRadiusAU * AU_METERS)}</dd>` : ""} 
                    ${properties.outerRadiusAU ? `<dt>Outer Radius:</dt><dd>${FormatUtils.formatDistanceAU(properties.outerRadiusAU * AU_METERS)}</dd>` : ""} 
                    ${properties.visualParticleCount ? `<dt>Particle Count:</dt><dd>${properties.visualParticleCount.toLocaleString()}</dd>` : ""}
                    ${properties.visualDensity ? `<dt>Density (visual):</dt><dd>${FormatUtils.formatFix(properties.visualDensity, 3)}</dd>` : ""}
                    ${properties.composition ? `<dt>Composition:</dt><dd>${properties.composition.join(", ")}</dd>` : ""}
                    ${properties.visualParticleColor ? `<dt>Color (visual):</dt><dd>${properties.visualParticleColor}</dd>` : ""}
                    ${celestial.temperature ? `<dt>Temp:</dt><dd>${FormatUtils.formatFix(celestial.temperature)} K</dd>` : ""}
                </dl>
            `;
    } else {
      container.innerHTML = `<div class="placeholder">Oort cloud data incomplete.</div>`;
    }
  }
}

customElements.define("oort-cloud-info", OortCloudInfoComponent);
