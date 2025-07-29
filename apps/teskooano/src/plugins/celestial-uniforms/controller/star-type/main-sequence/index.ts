import type { CelestialObject, StarProperties } from "@teskooano/data-types";
import type { Subscription } from "rxjs";
import { BaseUniformsRenderer } from "../../uniform-renderers/BaseUniformsRenderer";

/**
 * Renders UI controls specifically for Main Sequence stars.
 * Simplified to focus on 3 colors and plasma noise effects.
 */
export class MainSequenceStarUniformsRenderer extends BaseUniformsRenderer {
  public render(
    container: HTMLElement,
    celestial: CelestialObject,
  ): Subscription[] {
    const subscriptions: Subscription[] = [];
    const starProps = celestial.properties as StarProperties;

    if (!starProps || !starProps.spectralClass) {
      return subscriptions;
    }

    // Add padding to ensure all controls are visible
    container.style.paddingBottom = "2rem";

    // Create sections for different types of controls
    this._createBasicPropertiesSection(container, celestial, subscriptions);
    this._createPlasmaEffectsSection(container, celestial, subscriptions);

    return subscriptions;
  }

  private _createBasicPropertiesSection(
    container: HTMLElement,
    celestial: CelestialObject,
    subscriptions: Subscription[],
  ): void {
    const basicHeader = document.createElement("h3");
    basicHeader.textContent = "Star Colors";
    basicHeader.style.cssText = `
      margin: 1rem 0 0.5rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--color-border, #333);
      color: var(--color-text-primary, #fff);
      font-size: 1rem;
    `;
    container.appendChild(basicHeader);

    // Star Color - most fundamental property
    const colorControl = this._createColorInput(
      "Star Color:",
      celestial.id,
      celestial,
      ["color"],
    );
    container.appendChild(colorControl.element);
    subscriptions.push(colorControl.subscription);

    // Hot Color - for plasma, flares, and convection centers
    const hotColorControl = this._createColorInput(
      "Hot Color (Plasma):",
      celestial.id,
      celestial,
      ["hotColor"],
    );
    container.appendChild(hotColorControl.element);
    subscriptions.push(hotColorControl.subscription);

    // Surface Color - normal surface areas
    const surfaceColorControl = this._createColorInput(
      "Surface Color (Normal):",
      celestial.id,
      celestial,
      ["surfaceColor"],
    );
    container.appendChild(surfaceColorControl.element);
    subscriptions.push(surfaceColorControl.subscription);

    // Cool Color - for sunspots and darker regions
    const coolColorControl = this._createColorInput(
      "Cool Color (Dark Areas):",
      celestial.id,
      celestial,
      ["coolColor"],
    );
    container.appendChild(coolColorControl.element);
    subscriptions.push(coolColorControl.subscription);
  }

  private _createPlasmaEffectsSection(
    container: HTMLElement,
    celestial: CelestialObject,
    subscriptions: Subscription[],
  ): void {
    const plasmaHeader = document.createElement("h3");
    plasmaHeader.textContent = "Plasma Effects";
    plasmaHeader.style.cssText = `
      margin: 1rem 0 0.5rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--color-border, #333);
      color: var(--color-text-primary, #fff);
      font-size: 1rem;
    `;
    container.appendChild(plasmaHeader);

    // Check spectral class for specialized ranges
    const starProps = celestial.properties as StarProperties;
    const spectralClass = starProps.spectralClass;
    const isOClass = spectralClass?.startsWith("O");
    const isBClass = spectralClass?.startsWith("B");
    const isAClass = spectralClass?.startsWith("A");
    const isFClass = spectralClass?.startsWith("F");
    const isGClass = spectralClass?.startsWith("G");
    const isKClass = spectralClass?.startsWith("K");
    const isMClass = spectralClass?.startsWith("M");

    // Get ranges based on spectral class
    const getRanges = () => {
      return {
        noiseScale: { min: 0.01, max: 1.0, step: 1e-6 },
        noiseIntensity: { min: 0.08, max: 0.2, step: 1e-6 },
        plasmaTurbulence: { min: 1.6, max: 1.9, step: 1e-6 },
        lightingIntensity: { min: 1, max: 5, step: 1e-6 },
      };

      // if (isOClass) {
      //   return {
      //     noiseScale: { min: 0.01, max: 0.04, step: 1e-6 },
      //     noiseIntensity: { min: 0.08, max: 0.2, step: 1e-6 },
      //     plasmaTurbulence: { min: 1.6, max: 1.9, step: 1e-6 },
      //     lightingIntensity: { min: 1, max: 5, step: 1e-6 },
      //   };
      // } else if (isBClass) {
      //   return {
      //     noiseScale: { min: 0.015, max: 0.025, step: 1e-6 },
      //     noiseIntensity: { min: 0.15, max: 0.25, step: 1e-6 },
      //     plasmaTurbulence: { min: 1.2, max: 1.8, step: 1e-6 },
      //     lightingIntensity: { min: 2, max: 4, step: 1e-6 },
      //   };
      // } else if (isAClass) {
      //   return {
      //     noiseScale: { min: 0.02, max: 0.03, step: 1e-6 },
      //     noiseIntensity: { min: 0.1, max: 0.15, step: 1e-6 },
      //     plasmaTurbulence: { min: 0.8, max: 1.2, step: 1e-6 },
      //     lightingIntensity: { min: 1.5, max: 2.5, step: 1e-6 },
      //   };
      // } else if (isFClass) {
      //   return {
      //     noiseScale: { min: 0.025, max: 0.035, step: 1e-6 },
      //     noiseIntensity: { min: 0.11, max: 0.16, step: 1e-6 },
      //     plasmaTurbulence: { min: 0.7, max: 1.1, step: 1e-6 },
      //     lightingIntensity: { min: 1.2, max: 2.0, step: 1e-6 },
      //   };
      // } else if (isGClass) {
      //   return {
      //     noiseScale: { min: 0.03, max: 0.04, step: 1e-6 },
      //     noiseIntensity: { min: 0.12, max: 0.18, step: 1e-6 },
      //     plasmaTurbulence: { min: 0.6, max: 1.0, step: 1e-6 },
      //     lightingIntensity: { min: 1.0, max: 1.8, step: 1e-6 },
      //   };
      // } else if (isKClass) {
      //   return {
      //     noiseScale: { min: 0.035, max: 0.045, step: 1e-6 },
      //     noiseIntensity: { min: 0.13, max: 0.19, step: 1e-6 },
      //     plasmaTurbulence: { min: 0.5, max: 0.9, step: 1e-6 },
      //     lightingIntensity: { min: 0.8, max: 1.5, step: 1e-6 },
      //   };
      // } else if (isMClass) {
      //   return {
      //     noiseScale: { min: 0.04, max: 0.05, step: 1e-6 },
      //     noiseIntensity: { min: 0.14, max: 0.2, step: 1e-6 },
      //     plasmaTurbulence: { min: 0.4, max: 0.8, step: 1e-6 },
      //     lightingIntensity: { min: 0.6, max: 1.2, step: 1e-6 },
      //   };
      // } else {
      //   // Default ranges for unknown spectral classes
      //   return {
      //     noiseScale: { min: 0, max: 1.2, step: 1e-6 },
      //     noiseIntensity: { min: 0, max: 0.5, step: 1e-6 },
      //     plasmaTurbulence: { min: 0, max: 2.0, step: 1e-6 },
      //     lightingIntensity: { min: 0, max: 2.0, step: 1e-6 },
      //   };
      // }
    };

    const ranges = getRanges();

    // Noise Scale - controls the size of plasma patterns
    const noiseScaleControl = this._createNumericInput(
      "Noise Scale:",
      celestial.id,
      celestial,
      ["materialParams", "noiseScale"],
      ranges.noiseScale,
    );
    container.appendChild(noiseScaleControl.element);
    subscriptions.push(noiseScaleControl.subscription);

    // Noise Intensity - controls the strength of plasma effects
    const noiseIntensityControl = this._createNumericInput(
      "Noise Intensity:",
      celestial.id,
      celestial,
      ["materialParams", "noiseIntensity"],
      ranges.noiseIntensity,
    );
    container.appendChild(noiseIntensityControl.element);
    subscriptions.push(noiseIntensityControl.subscription);

    // Plasma Turbulence - controls the chaotic nature
    const plasmaTurbulenceControl = this._createNumericInput(
      "Plasma Turbulence:",
      celestial.id,
      celestial,
      ["materialParams", "plasmaTurbulence"],
      ranges.plasmaTurbulence,
    );
    container.appendChild(plasmaTurbulenceControl.element);
    subscriptions.push(plasmaTurbulenceControl.subscription);

    // Lighting Intensity - controls overall brightness
    const lightingIntensityControl = this._createNumericInput(
      "Lighting Intensity:",
      celestial.id,
      celestial,
      ["materialParams", "lightingIntensity"],
      ranges.lightingIntensity,
    );
    container.appendChild(lightingIntensityControl.element);
    subscriptions.push(lightingIntensityControl.subscription);
  }
}
