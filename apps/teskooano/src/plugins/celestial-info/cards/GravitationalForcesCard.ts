import { BaseCelestialCard } from "./BaseCelestialCard.js";
import { StateAccessor, PhysicsStateProvider } from "@teskooano/core-state";
import { CelestialObject, GRAVITATIONAL_CONSTANT } from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters.js";

export class GravitationalForcesCard extends BaseCelestialCard {
  static componentName = "gravitational-forces-card";

  constructor() {
    super("Gravitational Forces");
    this.addTableStyles();
  }

  protected shouldAutoUpdate(): boolean {
    return true; // This card updates in real-time
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

    const content = this.renderGravitationalInfluences(this.currentCelestial);
    if (!content) {
      contentDiv.innerHTML = "<p>No gravitational influences detected</p>";
      return;
    }

    contentDiv.innerHTML = content;
  }

  /**
   * Renders gravitational influences in table format.
   */
  private renderGravitationalInfluences(celestial: CelestialObject): string {
    const celestialPhysicsState =
      PhysicsStateProvider.getPhysicsState(celestial);
    if (!celestialPhysicsState) return "";

    const allObjects = StateAccessor.getCurrentCelestialObjects();
    const influences: {
      name: string;
      force: number;
      distance: number;
      mass: number;
    }[] = [];

    for (const other of Object.values(allObjects)) {
      if (other.id === celestial.id) continue;

      const otherPhysicsState = PhysicsStateProvider.getPhysicsState(other);
      if (!otherPhysicsState) continue;

      const distance = celestialPhysicsState.position_m.distanceTo(
        otherPhysicsState.position_m,
      );
      if (distance === 0) continue;

      const force =
        (GRAVITATIONAL_CONSTANT * (celestial.realMass_kg * other.realMass_kg)) /
        (distance * distance);

      influences.push({
        name: other.name,
        force,
        distance,
        mass: other.realMass_kg,
      });
    }

    // Sort by force descending and take the top 5
    const topInfluences = influences
      .sort((a, b) => b.force - a.force)
      .slice(0, 5);

    if (topInfluences.length === 0) return "";

    // Calculate total force for percentage calculations
    const totalForce = topInfluences.reduce((sum, inf) => sum + inf.force, 0);

    // Build table header
    let tableHTML = `
      <table class="gravitational-forces-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Distance</th>
            <th>Mass</th>
            <th>Force</th>
            <th>% Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Build table rows
    const rows = topInfluences.map((inf) => {
      const sourceName = inf.name;
      const distanceStr = FormatUtils.formatDistanceAdaptive(inf.distance);
      const massStr = FormatUtils.formatExp(inf.mass, 2);
      const forceStr = FormatUtils.formatExp(inf.force, 3);
      const percentageOfTotal = (inf.force / totalForce) * 100;
      const percentageStr =
        percentageOfTotal >= 1
          ? `${percentageOfTotal.toFixed(1)}%`
          : `${percentageOfTotal.toFixed(2)}%`;

      return `
        <tr>
          <td class="source-name">${sourceName}</td>
          <td class="distance">${distanceStr}</td>
          <td class="mass">${massStr} kg</td>
          <td class="force">${forceStr} N</td>
          <td class="percentage">${percentageStr}</td>
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
      .gravitational-forces-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
      
      .gravitational-forces-table th,
      .gravitational-forces-table td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #333);
      }
      
      .gravitational-forces-table th {
        background-color: var(--color-card-header, #2a2a2a);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary, #aaa);
      }
      
      .gravitational-forces-table td {
        font-family: 'Courier New', monospace;
      }
      
      .gravitational-forces-table .source-name {
        font-family: inherit;
        font-weight: 500;
        color: var(--color-text-primary, #fff);
      }
      
      .gravitational-forces-table .distance {
        color: var(--color-accent, #4fc3f7);
      }
      
      .gravitational-forces-table .mass {
        color: var(--color-warning, #ffc107);
      }
      
      .gravitational-forces-table .force {
        color: var(--color-success, #4caf50);
      }
      
      .gravitational-forces-table .percentage {
        color: var(--color-info, #17a2b8);
        font-weight: 500;
      }
      
      .gravitational-forces-table tr:hover {
        background-color: var(--color-hover, rgba(255, 255, 255, 0.05));
      }
    `;

    this.shadowRoot?.appendChild(style);
  }
}
