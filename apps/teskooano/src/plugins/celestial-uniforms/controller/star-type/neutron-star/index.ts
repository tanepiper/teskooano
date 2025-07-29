import type { CelestialObject, StarProperties } from "@teskooano/data-types";
import type { Subscription } from "rxjs";
import { BaseUniformsRenderer } from "../../uniform-renderers/BaseUniformsRenderer";

/**
 * Renders UI controls specifically for Neutron Stars.
 * Focuses on their unique properties like pulsar effects and extreme density.
 */
export class NeutronStarUniformsRenderer extends BaseUniformsRenderer {
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
    this._createNeutronStarEffectsSection(container, celestial, subscriptions);

    return subscriptions;
  }

  private _createBasicPropertiesSection(
    container: HTMLElement,
    celestial: CelestialObject,
    subscriptions: Subscription[],
  ): void {
    const basicHeader = document.createElement("h3");
    basicHeader.textContent = "Neutron Star Colors";
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

    // Hot Color - for pulsar beams and hotspots
    const hotColorControl = this._createColorInput(
      "Hot Color (Pulsar Beams):",
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

    // Cool Color - for magnetar effects
    const coolColorControl = this._createColorInput(
      "Cool Color (Magnetar):",
      celestial.id,
      celestial,
      ["coolColor"],
    );
    container.appendChild(coolColorControl.element);
    subscriptions.push(coolColorControl.subscription);
  }

  private _createNeutronStarEffectsSection(
    container: HTMLElement,
    celestial: CelestialObject,
    subscriptions: Subscription[],
  ): void {
    const effectsHeader = document.createElement("h3");
    effectsHeader.textContent = "Neutron Star Effects";
    effectsHeader.style.cssText = `
      margin: 1rem 0 0.5rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--color-border, #333);
      color: var(--color-text-primary, #fff);
      font-size: 1rem;
    `;
    container.appendChild(effectsHeader);

    // Noise Scale - controls the size of surface patterns
    const noiseScaleControl = this._createNumericInput(
      "Noise Scale:",
      celestial.id,
      celestial,
      ["materialParams", "noiseScale"],
      { min: 0, max: 1.2, step: 1e-6 },
    );
    container.appendChild(noiseScaleControl.element);
    subscriptions.push(noiseScaleControl.subscription);

    // Noise Intensity - controls the strength of surface effects
    const noiseIntensityControl = this._createNumericInput(
      "Noise Intensity:",
      celestial.id,
      celestial,
      ["materialParams", "noiseIntensity"],
      { min: 0, max: 0.5, step: 1e-6 },
    );
    container.appendChild(noiseIntensityControl.element);
    subscriptions.push(noiseIntensityControl.subscription);

    // Plasma Turbulence - controls the chaotic nature
    const plasmaTurbulenceControl = this._createNumericInput(
      "Plasma Turbulence:",
      celestial.id,
      celestial,
      ["materialParams", "plasmaTurbulence"],
      { min: 0, max: 2.0, step: 1e-6 },
    );
    container.appendChild(plasmaTurbulenceControl.element);
    subscriptions.push(plasmaTurbulenceControl.subscription);

    // Lighting Intensity - controls overall brightness
    const lightingIntensityControl = this._createNumericInput(
      "Lighting Intensity:",
      celestial.id,
      celestial,
      ["materialParams", "lightingIntensity"],
      { min: 0, max: 2.0, step: 1e-6 },
    );
    container.appendChild(lightingIntensityControl.element);
    subscriptions.push(lightingIntensityControl.subscription);
  }
}
