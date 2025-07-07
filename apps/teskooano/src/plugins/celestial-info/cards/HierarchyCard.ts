import { BaseCelestialCard } from "./BaseCelestialCard.js";
import { StateAccessor } from "@teskooano/core-state";
import { CelestialObject } from "@teskooano/data-types";

export class HierarchyCard extends BaseCelestialCard {
  static componentName = "hierarchy-card";

  constructor() {
    super("Hierarchy");
    this.addTableStyles();
  }

  protected shouldAutoUpdate(): boolean {
    return false; // Static data, no need for auto-update
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

    const content = this.renderHierarchy(this.currentCelestial);
    if (!content) {
      contentDiv.innerHTML = "<p>This object has no parent or children</p>";
      return;
    }

    contentDiv.innerHTML = content;
  }

  /**
   * Renders hierarchy information in table format.
   */
  protected renderHierarchy(celestial: CelestialObject): string {
    const allObjects = StateAccessor.getCurrentCelestialObjects();
    const parent = allObjects[celestial.parentId || ""];
    const children = Object.values(allObjects).filter(
      (obj) => obj.parentId === celestial.id,
    );

    const hierarchyData = [];

    if (parent) {
      hierarchyData.push({
        relationship: "Parent",
        object: parent.name,
      });
    }

    if (children.length > 0) {
      hierarchyData.push({
        relationship: "Children",
        object: children.map((c) => c.name).join(", "),
      });
    }

    if (hierarchyData.length === 0) return "";

    // Build table header
    let tableHTML = `
      <table class="hierarchy-table">
        <thead>
          <tr>
            <th>Relationship</th>
            <th>Object(s)</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Build table rows
    const rows = hierarchyData.map((data) => {
      return `
        <tr>
          <td class="relationship-name">${data.relationship}</td>
          <td class="object-name">${data.object}</td>
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
      .hierarchy-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
      
      .hierarchy-table th,
      .hierarchy-table td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #333);
      }
      
      .hierarchy-table th {
        background-color: var(--color-card-header, #2a2a2a);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary, #aaa);
      }
      
      .hierarchy-table td {
        font-family: inherit;
      }
      
      .hierarchy-table .relationship-name {
        font-weight: 500;
        color: var(--color-text-primary, #fff);
        width: 30%;
      }
      
      .hierarchy-table .object-name {
        color: var(--color-accent, #4fc3f7);
        font-weight: 500;
      }
      
      .hierarchy-table tr:hover {
        background-color: var(--color-hover, rgba(255, 255, 255, 0.05));
      }
    `;

    this.shadowRoot?.appendChild(style);
  }
}
