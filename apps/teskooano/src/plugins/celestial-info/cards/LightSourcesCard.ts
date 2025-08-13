import { BaseCelestialCard } from "./BaseCelestialCard.js";
import { renderableStore } from "@teskooano/core-state";
import { CelestialObject } from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters.js";
import { SCALE } from "@teskooano/core-physics";
import { AU_METERS } from "@teskooano/data-values";

// Calculate the scale factor to convert scene units to meters
const SCENE_UNITS_TO_METERS = AU_METERS / SCALE.RENDER_SCALE_AU;

export class LightSourcesCard extends BaseCelestialCard {
  static componentName = "light-sources-card";

  constructor() {
    super("Light Sources");
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

    // Check parent panel
    if (!this.parentPanel) {
      contentDiv.innerHTML = "<p>Parent panel not set</p>";
      return;
    }

    // Check renderer
    const renderer = this.parentPanel.getRenderer();
    if (!renderer) {
      contentDiv.innerHTML = "<p>Renderer not initialized yet</p>";
      return;
    }

    // Check lighting manager
    const lightingManager = this.parentPanel?.lightSourceManager;
    if (!lightingManager) {
      contentDiv.innerHTML = "<p>Light source manager not found</p>";
      return;
    }

    // Try to render light sources
    const content = this.renderLightSources(
      this.currentCelestial,
      lightingManager,
    );

    if (!content) {
      contentDiv.innerHTML =
        "<p>No light sources found affecting this object</p>";
      return;
    }

    contentDiv.innerHTML = content;
  }

  /**
   * Renders light sources in table format.
   */
  private renderLightSources(
    celestial: CelestialObject,
    lightingManager: any,
  ): string {
    // Get the current renderable objects from the store
    const currentRenderableObjects = renderableStore.getRenderableObjects();
    const renderableObject = currentRenderableObjects[celestial.id];

    if (!renderableObject) {
      // If the object isn't in the renderable store yet, there are no light sources to calculate
      return "";
    }

    try {
      const influentialLights =
        lightingManager.getInfluentialLights(renderableObject);

      if (!influentialLights || influentialLights.length === 0) return "";

      // Build table header
      let tableHTML = `
        <table class="light-sources-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Distance</th>
              <th>Luminosity</th>
              <th>Irradiance</th>
              <th>% Solar</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Build table rows
      const rows = influentialLights.map((lightComponent: any) => {
        const light = lightComponent.light;
        const lightCelestial = lightComponent.celestialObject;
        const distanceSceneUnits = renderableObject.position.distanceTo(
          light.position,
        );

        // Convert scene units to real-world meters and AU
        const distanceMeters = distanceSceneUnits * SCENE_UNITS_TO_METERS;
        const distanceAU = distanceMeters / AU_METERS;

        // Get the actual luminosity from the star's properties
        let stellarLuminosity = 1.0; // Default to 1 solar luminosity
        if (
          lightCelestial &&
          lightCelestial.properties &&
          lightCelestial.properties.luminosity
        ) {
          stellarLuminosity = lightCelestial.properties.luminosity;
        }

        // Calculate irradiance using the inverse square law and stellar luminosity
        // Solar constant at 1 AU: 1361 W/m²
        // Irradiance = (Luminosity_star / Luminosity_sun) × Solar_constant × (1 AU / distance)²
        const solarConstant = 1361; // W/m² at 1 AU from a 1 L☉ star
        const irradiance =
          stellarLuminosity * solarConstant * Math.pow(1.0 / distanceAU, 2);

        // Calculate percentage relative to Earth's solar irradiance
        const earthSolarIrradiance = 1361; // W/m²
        const percentageOfEarth = (irradiance / earthSolarIrradiance) * 100;

        // Format values
        const sourceName = lightComponent.celestialObject.name || "Unknown";
        const distanceStr = FormatUtils.formatDistanceAU(distanceMeters, 2);

        // Format luminosity with appropriate precision
        let luminosityStr: string;
        if (stellarLuminosity >= 1) {
          luminosityStr = `${stellarLuminosity.toFixed(2)} L☉`;
        } else if (stellarLuminosity >= 0.01) {
          luminosityStr = `${stellarLuminosity.toFixed(3)} L☉`;
        } else if (stellarLuminosity >= 0.001) {
          luminosityStr = `${stellarLuminosity.toFixed(4)} L☉`;
        } else {
          // Use scientific notation for very small values
          luminosityStr = `${stellarLuminosity.toExponential(2)} L☉`;
        }

        const irradianceStr =
          irradiance >= 1000
            ? `${(irradiance / 1000).toFixed(1)}k W/m²`
            : irradiance >= 1
              ? `${irradiance.toFixed(0)} W/m²`
              : `${irradiance.toFixed(2)} W/m²`;
        const percentageStr =
          percentageOfEarth >= 1000
            ? `${(percentageOfEarth / 1000).toFixed(1)}k%`
            : percentageOfEarth >= 1
              ? `${percentageOfEarth.toFixed(1)}%`
              : percentageOfEarth >= 0.01
                ? `${percentageOfEarth.toFixed(2)}%`
                : `${FormatUtils.formatExp(percentageOfEarth / 100, 2)}`;

        return `
          <tr>
            <td class="source-name">${sourceName}</td>
            <td class="distance">${distanceStr}</td>
            <td class="luminosity">${luminosityStr}</td>
            <td class="irradiance">${irradianceStr}</td>
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
    } catch (error) {
      console.warn("Error getting influential lights:", error);
      return "";
    }
  }

  private addTableStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .light-sources-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
      
      .light-sources-table th,
      .light-sources-table td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #333);
      }
      
      .light-sources-table th {
        background-color: var(--color-card-header, #2a2a2a);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary, #aaa);
      }
      
      .light-sources-table td {
        font-family: 'Courier New', monospace;
      }
      
      .light-sources-table .source-name {
        font-family: inherit;
        font-weight: 500;
        color: var(--color-text-primary, #fff);
      }
      
      .light-sources-table .distance {
        color: var(--color-accent, #4fc3f7);
      }
      
      .light-sources-table .luminosity {
        color: var(--color-warning, #ffc107);
      }
      
      .light-sources-table .irradiance {
        color: var(--color-success, #4caf50);
      }
      
      .light-sources-table .percentage {
        color: var(--color-info, #17a2b8);
        font-weight: 500;
      }
      
      .light-sources-table tr:hover {
        background-color: var(--color-hover, rgba(255, 255, 255, 0.05));
      }
    `;

    this.shadowRoot?.appendChild(style);
  }
}
