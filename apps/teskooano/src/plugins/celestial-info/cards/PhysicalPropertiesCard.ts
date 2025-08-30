import { BaseCelestialCard } from "./BaseCelestialCard.js";
import { FormatUtils } from "../utils/formatters.js";
import { StateAccessor } from "@teskooano/core-state";
import { RingSystemProperties } from "@teskooano/data-types";

export class PhysicalPropertiesCard extends BaseCelestialCard {
  static componentName = "physical-properties-card";

  constructor() {
    super("Physical Properties");
    this.addTableStyles();
  }

  protected shouldAutoUpdate(): boolean {
    return false; // Static physical data, no need for auto-update
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

    const content = this.buildPhysicalPropertiesTable();
    contentDiv.innerHTML = content;
  }

  /**
   * Builds a complete physical properties table.
   * Can be overridden by subclasses to add type-specific properties.
   */
  protected buildPhysicalPropertiesTable(): string {
    if (!this.currentCelestial) return "";

    const properties = this.gatherPhysicalProperties();

    if (properties.length === 0) {
      return "<p>No physical properties available</p>";
    }

    // Build table
    let tableHTML = `
      <table class="physical-characteristics-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Build table rows
    const rows = properties.map((prop) => {
      return `
        <tr>
          <td class="property-name">${prop.property}</td>
          <td class="property-value">${prop.value}</td>
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

  /**
   * Gathers all physical properties for the current celestial object.
   * Can be overridden by subclasses to add type-specific properties.
   */
  protected gatherPhysicalProperties(): Array<{
    property: string;
    value: string;
  }> {
    const properties: Array<{ property: string; value: string }> = [];

    if (!this.currentCelestial) return properties;

    // Basic physical characteristics
    if (this.currentCelestial.realMass_kg) {
      properties.push({
        property: "Mass",
        value: `${FormatUtils.formatExp(this.currentCelestial.realMass_kg, 4)} kg`,
      });
    }

    if (this.currentCelestial.realRadius_m) {
      properties.push({
        property: "Radius",
        value: FormatUtils.formatDistanceKm(this.currentCelestial.realRadius_m),
      });
    }

    if (this.currentCelestial.temperature) {
      properties.push({
        property: "Temperature",
        value: `${FormatUtils.formatFix(this.currentCelestial.temperature)} K`,
      });
    }

    // Rotational parameters
    if (this.currentCelestial.orbit.siderealRotationPeriod_s) {
      properties.push({
        property: "Rotation Period",
        value: FormatUtils.formatPeriod(
          this.currentCelestial.orbit.siderealRotationPeriod_s,
        ),
      });
    }

    // Albedo
    if (this.currentCelestial.albedo) {
      properties.push({
        property: "Albedo",
        value: FormatUtils.formatFix(this.currentCelestial.albedo, 2),
      });
    }

    // Ring system
    const ringInfo = this.getRingSystemInfo();
    if (ringInfo) {
      properties.push({
        property: "Rings",
        value: ringInfo,
      });
    }

    return properties;
  }

  /**
   * Gets ring system information for the current celestial object.
   */
  private getRingSystemInfo(): string | null {
    if (!this.currentCelestial) return null;

    const allObjects = StateAccessor.getCelestialObjects();
    const ringSystem = Object.values(allObjects).find(
      (obj) =>
        obj.parentId === this.currentCelestial!.id &&
        obj.type === "RING_SYSTEM",
    );

    if (!ringSystem) return null;

    const ringSystemProps = ringSystem.properties as RingSystemProperties;
    return `Yes (${ringSystemProps?.rings?.length || 0} defined)`;
  }

  private addTableStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .physical-characteristics-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
      
      .physical-characteristics-table th,
      .physical-characteristics-table td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #333);
      }
      
      .physical-characteristics-table th {
        background-color: var(--color-card-header, #2a2a2a);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary, #aaa);
      }
      
      .physical-characteristics-table td {
        font-family: 'Courier New', monospace;
      }
      
      .physical-characteristics-table .property-name {
        font-family: inherit;
        font-weight: 500;
        color: var(--color-text-primary, #fff);
        width: 40%;
      }
      
      .physical-characteristics-table .property-value {
        color: var(--color-accent, #4fc3f7);
        font-weight: 500;
      }
      
      .physical-characteristics-table tr:hover {
        background-color: var(--color-hover, rgba(255, 255, 255, 0.05));
      }
    `;

    this.shadowRoot?.appendChild(style);
  }
}
