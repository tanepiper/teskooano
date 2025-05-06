import { getCelestialObjects } from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialType,
  GasGiantProperties,
  RingSystemProperties,
} from "@teskooano/data-types";
import { CelestialInfoComponent } from "../utils/CelestialInfoInterface";
import { baseStyles } from "../utils/CelestialStyles";
import { FormatUtils } from "../utils/FormatUtils";

export class GasGiantInfoComponent
  extends HTMLElement
  implements CelestialInfoComponent
{
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
            <style>${baseStyles}</style>
            <div id="container" class="placeholder">Loading gas giant data...</div>
        `;
  }

  updateData(celestial: CelestialObject): void {
    if (celestial.type !== CelestialType.GAS_GIANT) {
      console.warn("GasGiantInfoComponent received non-gas giant data");
      return;
    }

    const container = this.shadow.getElementById("container");
    if (!container) return;

    const giantProps = celestial.properties as GasGiantProperties;

    const allObjects = getCelestialObjects();
    const ringSystem = Object.values(allObjects).find(
      (obj) =>
        obj.type === CelestialType.RING_SYSTEM && obj.parentId === celestial.id,
    );
    const ringSystemProps = ringSystem?.properties as
      | RingSystemProperties
      | undefined;

    container.innerHTML = `
            <h3>${celestial.name}</h3>
            <dl class="info-grid">
                <dt>Type:</dt><dd>Gas Giant</dd>
                <dt>Parent:</dt><dd>${celestial.parentId ?? "N/A"}</dd>
                <dt>Class:</dt><dd>${giantProps?.gasGiantClass ?? "N/A"}</dd>
                <dt>Mass:</dt><dd>${FormatUtils.formatExp(celestial.realMass_kg, 4)} kg</dd>
                <dt>Radius:</dt><dd>${FormatUtils.formatDistanceKm(celestial.realRadius_m)}</dd>
                <dt>Temp:</dt><dd>${FormatUtils.formatFix(celestial.temperature)} K</dd>
                
                <dt>Atmosphere:</dt><dd>${giantProps?.atmosphereColor ? `${giantProps.atmosphereColor}` : "N/A"}</dd>
                <dt>Cloud Color:</dt><dd>${giantProps?.cloudColor ?? "N/A"}</dd>
                <dt>Cloud Speed:</dt><dd>${FormatUtils.formatFix(giantProps?.cloudSpeed, 2)}</dd>
                
                ${giantProps?.stormColor ? `<dt>Storm Color:</dt><dd>${giantProps.stormColor}</dd>` : ""}
                
                ${
                  ringSystem
                    ? `
                <dt>Rings:</dt><dd>Yes (${ringSystemProps?.rings?.length || 0} defined)</dd>
                `
                    : ""
                }
                
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
                
                ${
                  celestial.siderealRotationPeriod_s
                    ? `
                <dt>Rotation Period:</dt><dd>${FormatUtils.formatPeriod(celestial.siderealRotationPeriod_s)}</dd>
                `
                    : ""
                }
                
                ${celestial.albedo ? `<dt>Albedo:</dt><dd>${FormatUtils.formatFix(celestial.albedo, 2)}</dd>` : ""}
            </dl>
        `;
  }
}

customElements.define("gas-giant-info", GasGiantInfoComponent);
