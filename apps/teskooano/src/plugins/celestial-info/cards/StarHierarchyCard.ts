import { HierarchyCard } from "./HierarchyCard.js";
import { StarProperties } from "@teskooano/data-types";

export class StarHierarchyCard extends HierarchyCard {
  static componentName = "star-hierarchy-card";

  constructor() {
    super();
    this.container.classList.add("star-hierarchy");
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

    const hierarchyContent = this.renderHierarchy(this.currentCelestial);
    const starProps = this.currentCelestial.properties as StarProperties;

    // Add partner stars information to the hierarchy content
    let combinedContent = hierarchyContent;

    if (starProps?.partnerStars && starProps.partnerStars.length > 0) {
      // If we have hierarchy content, we need to add partners to the existing table
      if (hierarchyContent) {
        // Insert partner row before the closing table tags
        const partnerRow = `
          <tr>
            <td class="relationship-name">Partners</td>
            <td class="object-name">${starProps.partnerStars.join(", ")}</td>
          </tr>
        `;
        combinedContent = hierarchyContent.replace(
          "</tbody>",
          partnerRow + "</tbody>",
        );
      } else {
        // Create a new table just for partners
        combinedContent = `
          <table class="hierarchy-table">
            <thead>
              <tr>
                <th>Relationship</th>
                <th>Object(s)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="relationship-name">Partners</td>
                <td class="object-name">${starProps.partnerStars.join(", ")}</td>
              </tr>
            </tbody>
          </table>
        `;
      }
    }

    if (!combinedContent.trim()) {
      contentDiv.innerHTML =
        "<p>This star has no parent, children, or partners</p>";
      return;
    }

    contentDiv.innerHTML = combinedContent;
  }
}
