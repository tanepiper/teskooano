import { BaseCelestialCard } from "./BaseCelestialCard.js";
import { renderableStore, StateAccessor } from "@teskooano/core-state";
import {
  CelestialObject,
  AU_METERS,
  SCALE,
  CelestialType,
} from "@teskooano/data-types";
import { FormatUtils } from "../utils/formatters.js";

// Calculate the scale factor to convert scene units to meters
const SCENE_UNITS_TO_METERS = AU_METERS / SCALE.RENDER_SCALE_AU;

interface ShadowCaster {
  name: string;
  distance: number;
  angularSize: number;
  lightSource: string;
  shadowStrength: number;
  radius: number;
  objectType: string;
}

export class ShadowSourcesCard extends BaseCelestialCard {
  static componentName = "shadow-sources-card";

  constructor() {
    super("Shadow Sources");
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

    // Try to use the celestial lighting manager for shadow calculations
    const content = this.renderShadowSourcesFromCelestialManager(
      this.currentCelestial,
    );

    if (!content) {
      contentDiv.innerHTML =
        "<p>No shadow-casting objects found affecting this object</p>";
      return;
    }

    contentDiv.innerHTML = content;
  }

  /**
   * Renders shadow sources using the proper celestial lighting manager approach.
   */
  private renderShadowSourcesFromCelestialManager(
    celestial: CelestialObject,
  ): string {
    if (!celestial.physicsStateReal) return "";

    try {
      // Get the current renderable objects from the store (same as other cards)
      const currentRenderableObjects = renderableStore.getRenderableObjects();
      const renderableObject = currentRenderableObjects[celestial.id];

      if (!renderableObject) {
        return "";
      }

      // Use the light source manager from the renderer to find shadow casters
      const lightSourceManager = this.parentPanel?.lightSourceManager;
      if (!lightSourceManager) {
        return "<p>Light source manager not available</p>";
      }

      const shadowCasters = this.calculateShadowSourcesFromCelestialManager(
        celestial,
        renderableObject,
        lightSourceManager,
        currentRenderableObjects,
      );

      if (!shadowCasters || shadowCasters.length === 0) return "";

      // Build table header
      let tableHTML = `
        <table class="shadow-sources-table">
          <thead>
            <tr>
              <th>Shadow Caster</th>
              <th>Type</th>
              <th>Distance</th>
              <th>Angular Size</th>
              <th>Shadow Strength</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Build table rows
      const rows = shadowCasters.map((caster) => {
        const sourceName = caster.name;
        const typeStr = caster.objectType;
        const distanceStr = FormatUtils.formatDistanceAdaptive(caster.distance);
        const angularSizeStr = `${caster.angularSize.toFixed(3)}°`;
        const shadowStrengthStr = `${(caster.shadowStrength * 100).toFixed(1)}%`;

        return `
          <tr>
            <td class="shadow-caster-name">${sourceName}</td>
            <td class="object-type">${typeStr}</td>
            <td class="distance">${distanceStr}</td>
            <td class="angular-size">${angularSizeStr}</td>
            <td class="shadow-strength">${shadowStrengthStr}</td>
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
      console.warn("Error calculating shadow sources:", error);
      return "";
    }
  }

  /**
   * Uses the light source manager's shadow finding utilities (same as renderers use).
   */
  private calculateShadowSourcesFromCelestialManager(
    celestial: CelestialObject,
    renderableObject: any,
    lightSourceManager: any,
    currentRenderableObjects: Record<string, any>,
  ): ShadowCaster[] {
    const shadowCasters: ShadowCaster[] = [];

    try {
      // Get influential lights for this object (same as LightSourcesCard)
      const influentialLights =
        lightSourceManager.getInfluentialLights(renderableObject);

      if (!influentialLights || influentialLights.length === 0) {
        return this.calculateShadowSourcesFallback(
          celestial,
          renderableObject,
          currentRenderableObjects,
        );
      }

      // For each light source, find objects that could cast shadows
      influentialLights.forEach((lightComponent: any) => {
        const light = lightComponent.light;
        const lightPosition = light.position;
        const lightCelestial = lightComponent.celestialObject;

        if (!lightCelestial || !lightPosition) return;

        // Find potential shadow casters (same logic as fallback but more targeted)
        const potentialCasters = this.findPotentialShadowCasters(
          celestial,
          lightCelestial,
          currentRenderableObjects,
        );

        potentialCasters.forEach((casterObject) => {
          const casterRenderable = currentRenderableObjects[casterObject.id];
          if (!casterRenderable) return;

          const distance =
            renderableObject.position.distanceTo(casterRenderable.position) *
            SCENE_UNITS_TO_METERS;
          const angularSize = this.calculateAngularSize(
            casterObject.realRadius_m || 0,
            distance,
          );

          // Simple shadow strength based on angular size
          const shadowStrength = Math.min(1.0, angularSize / 0.5);

          if (shadowStrength > 0.01) {
            // Only meaningful shadows
            shadowCasters.push({
              name: casterObject.name,
              distance: distance,
              angularSize: angularSize,
              lightSource: lightCelestial.name || "Unknown",
              shadowStrength: shadowStrength,
              radius: casterObject.realRadius_m || 0,
              objectType: this.getObjectTypeDisplayName(casterObject.type),
            });
          }
        });
      });

      // Remove duplicates and sort by shadow strength
      const uniqueShadowCasters = new Map<string, ShadowCaster>();
      shadowCasters.forEach((caster) => {
        const existing = uniqueShadowCasters.get(caster.name);
        if (!existing || caster.shadowStrength > existing.shadowStrength) {
          uniqueShadowCasters.set(caster.name, caster);
        }
      });

      return Array.from(uniqueShadowCasters.values())
        .sort((a, b) => b.shadowStrength - a.shadowStrength)
        .slice(0, 10);
    } catch (error) {
      console.warn(
        "Error in calculateShadowSourcesFromCelestialManager:",
        error,
      );

      // Fallback to simple approach based on object type relationships
      return this.calculateShadowSourcesFallback(
        celestial,
        renderableObject,
        currentRenderableObjects,
      );
    }
  }

  /**
   * Finds potential shadow casters for a given celestial object and light source.
   */
  private findPotentialShadowCasters(
    celestial: CelestialObject,
    lightCelestial: CelestialObject,
    currentRenderableObjects: Record<string, any>,
  ): CelestialObject[] {
    const allObjects = StateAccessor.getCurrentCelestialObjects();
    const potentialCasters: CelestialObject[] = [];

    // Simple logic based on object types:
    // - For planets/gas giants: their moons can cast shadows
    // - For moons: their parent planet and sibling moons can cast shadows
    if (
      celestial.type === CelestialType.PLANET ||
      celestial.type === CelestialType.DWARF_PLANET ||
      celestial.type === CelestialType.GAS_GIANT
    ) {
      // Find moons of this planet
      const moons = Object.values(allObjects).filter(
        (obj): obj is CelestialObject =>
          obj.type === CelestialType.MOON &&
          obj.parentId === celestial.id &&
          obj.realRadius_m !== undefined &&
          obj.realRadius_m > 1000, // At least 1km radius
      );

      potentialCasters.push(...moons);
    } else if (celestial.type === CelestialType.MOON && celestial.parentId) {
      // Find the parent planet
      const parentPlanet = allObjects[celestial.parentId];
      if (parentPlanet && parentPlanet.realRadius_m) {
        potentialCasters.push(parentPlanet);
      }

      // Find sibling moons
      const siblingMoons = Object.values(allObjects).filter(
        (obj): obj is CelestialObject =>
          obj.type === CelestialType.MOON &&
          obj.parentId === celestial.parentId &&
          obj.id !== celestial.id &&
          obj.realRadius_m !== undefined &&
          obj.realRadius_m > 1000,
      );

      potentialCasters.push(...siblingMoons);
    }

    // Filter to only objects that have renderable representations
    return potentialCasters.filter((obj) => currentRenderableObjects[obj.id]);
  }

  /**
   * Fallback method that uses simple object type relationships.
   */
  private calculateShadowSourcesFallback(
    celestial: CelestialObject,
    renderableObject: any,
    currentRenderableObjects: Record<string, any>,
  ): ShadowCaster[] {
    const shadowCasters: ShadowCaster[] = [];
    const allObjects = StateAccessor.getCurrentCelestialObjects();

    console.warn("Using fallback method for:", celestial.name);

    // Simple logic based on object types:
    // - For planets/gas giants: their moons can cast shadows
    // - For moons: their parent planet can cast shadows
    if (
      celestial.type === CelestialType.PLANET ||
      celestial.type === CelestialType.DWARF_PLANET ||
      celestial.type === CelestialType.GAS_GIANT
    ) {
      // Find moons of this planet
      const moons = Object.values(allObjects).filter(
        (obj) =>
          obj.type === CelestialType.MOON && obj.parentId === celestial.id,
      );

      moons.forEach((moon) => {
        const moonRenderable = currentRenderableObjects[moon.id];
        if (moonRenderable && moon.realRadius_m) {
          const distance =
            renderableObject.position.distanceTo(moonRenderable.position) *
            SCENE_UNITS_TO_METERS;
          const angularSize = this.calculateAngularSize(
            moon.realRadius_m,
            distance,
          );

          if (angularSize > 0.01) {
            // Minimum meaningful size
            shadowCasters.push({
              name: moon.name,
              distance: distance,
              angularSize: angularSize,
              lightSource: "Sun",
              shadowStrength: Math.min(1.0, angularSize / 0.5),
              radius: moon.realRadius_m,
              objectType: this.getObjectTypeDisplayName(moon.type),
            });
          }
        }
      });
    } else if (celestial.type === CelestialType.MOON && celestial.parentId) {
      // Find the parent planet
      const parentPlanet = allObjects[celestial.parentId];
      if (parentPlanet) {
        const parentRenderable = currentRenderableObjects[parentPlanet.id];
        if (parentRenderable && parentPlanet.realRadius_m) {
          const distance =
            renderableObject.position.distanceTo(parentRenderable.position) *
            SCENE_UNITS_TO_METERS;
          const angularSize = this.calculateAngularSize(
            parentPlanet.realRadius_m,
            distance,
          );

          shadowCasters.push({
            name: parentPlanet.name,
            distance: distance,
            angularSize: angularSize,
            lightSource: "Sun",
            shadowStrength: Math.min(1.0, angularSize / 2.0), // Planets are big
            radius: parentPlanet.realRadius_m,
            objectType: this.getObjectTypeDisplayName(parentPlanet.type),
          });
        }
      }
    }

    console.warn(
      "Fallback found shadow casters:",
      shadowCasters.map((s) => s.name),
    );

    return shadowCasters
      .sort((a, b) => b.shadowStrength - a.shadowStrength)
      .slice(0, 10);
  }

  /**
   * Gets a display-friendly name for the celestial object type.
   */
  private getObjectTypeDisplayName(type: CelestialType): string {
    switch (type) {
      case CelestialType.PLANET:
        return "Planet";
      case CelestialType.DWARF_PLANET:
        return "Dwarf Planet";
      case CelestialType.GAS_GIANT:
        return "Gas Giant";
      case CelestialType.MOON:
        return "Moon";
      case CelestialType.ASTEROID_FIELD:
        return "Asteroid Field";
      case CelestialType.STAR:
        return "Star";
      default:
        return type;
    }
  }

  /**
   * Calculates the angular size of an object as seen from the observer.
   */
  private calculateAngularSize(radius: number, distance: number): number {
    if (distance === 0) return 0;
    // Angular size in degrees = 2 * arctan(radius / distance) * (180 / π)
    return 2 * Math.atan(radius / distance) * (180 / Math.PI);
  }

  private addTableStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .shadow-sources-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
      
      .shadow-sources-table th,
      .shadow-sources-table td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #333);
      }
      
      .shadow-sources-table th {
        background-color: var(--color-card-header, #2a2a2a);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary, #aaa);
      }
      
      .shadow-sources-table td {
        font-family: 'Courier New', monospace;
      }
      
      .shadow-sources-table .shadow-caster-name {
        font-family: inherit;
        font-weight: 500;
        color: var(--color-text-primary, #fff);
      }
      
      .shadow-sources-table .object-type {
        color: var(--color-info, #17a2b8);
        font-family: inherit;
      }
      
      .shadow-sources-table .distance {
        color: var(--color-accent, #4fc3f7);
      }
      
      .shadow-sources-table .angular-size {
        color: var(--color-warning, #ffc107);
      }
      
      .shadow-sources-table .shadow-strength {
        color: var(--color-success, #4caf50);
        font-weight: 500;
      }
      
      .shadow-sources-table tr:hover {
        background-color: var(--color-hover, rgba(255, 255, 255, 0.05));
      }
    `;

    this.shadowRoot?.appendChild(style);
  }
}
