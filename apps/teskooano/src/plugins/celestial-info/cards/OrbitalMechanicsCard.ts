import { BaseCelestialCard } from "./BaseCelestialCard.js";
import { OrbitalParameters } from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters.js";

export class OrbitalMechanicsCard extends BaseCelestialCard {
  static componentName = "orbital-mechanics-card";

  constructor() {
    super("Orbital Mechanics");
    this.addTableStyles();
  }

  protected shouldAutoUpdate(): boolean {
    return false; // Static orbital data, no need for auto-update
  }

  protected renderContent(): void {
    const contentDiv = this.shadowRoot?.querySelector(
      ".card-content",
    ) as HTMLElement;
    if (!contentDiv) return;

    if (!this.currentCelestial) {
      contentDiv.innerHTML = "<p>Loading...</p>";
      return;
    }

    const content = this.renderOrbitalParameters(this.currentCelestial.orbit);
    if (!content) {
      contentDiv.innerHTML = "<p>This object has no defined orbit</p>";
      return;
    }

    contentDiv.innerHTML = content;
  }

  /**
   * Renders orbital parameters in table format.
   */
  private renderOrbitalParameters(
    orbit: OrbitalParameters | undefined | null,
  ): string {
    if (!orbit) return "";

    const parameters = [
      {
        parameter: "Semi-Major Axis",
        value: FormatUtils.formatDistanceAU(orbit.realSemiMajorAxis_m),
      },
      {
        parameter: "Eccentricity",
        value: FormatUtils.formatFix(orbit.eccentricity, 4),
      },
      {
        parameter: "Inclination",
        value: FormatUtils.formatDegrees(orbit.inclination),
      },
      {
        parameter: "Period",
        value: FormatUtils.formatPeriod(orbit.period_s),
      },
    ];

    // Build table header
    let tableHTML = `
      <table class="orbital-parameters-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Build table rows
    const rows = parameters.map((param) => {
      return `
        <tr>
          <td class="parameter-name">${param.parameter}</td>
          <td class="parameter-value">${param.value}</td>
        </tr>
      `;
    });

    tableHTML += rows.join("");
    tableHTML += `
        </tbody>
      </table>
    `;

    return tableHTML;
  }

  private addTableStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .orbital-parameters-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
      
      .orbital-parameters-table th,
      .orbital-parameters-table td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #333);
      }
      
      .orbital-parameters-table th {
        background-color: var(--color-card-header, #2a2a2a);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary, #aaa);
      }
      
      .orbital-parameters-table td {
        font-family: 'Courier New', monospace;
      }
      
      .orbital-parameters-table .parameter-name {
        font-family: inherit;
        font-weight: 500;
        color: var(--color-text-primary, #fff);
        width: 40%;
      }
      
      .orbital-parameters-table .parameter-value {
        color: var(--color-accent, #4fc3f7);
        font-weight: 500;
      }
      
      .orbital-parameters-table tr:hover {
        background-color: var(--color-hover, rgba(255, 255, 255, 0.05));
      }
    `;

    this.shadowRoot?.appendChild(style);
  }
}
