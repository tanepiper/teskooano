import {
  getCelestialObjects,
  simulationStateService,
} from "@teskooano/core-state";
import { CelestialType, StarProperties } from "@teskooano/data-types";
import { SystemGeneratorModalTemplate } from "./modal-system-generator.template";

/**
 * @element teskooano-system-generator-modal
 * @description
 * A custom element that displays information about a newly generated star system.
 * It shows system statistics, star information, and other relevant details.
 *
 * @attr {string} seed - The seed used to generate the system
 */
export class SystemGeneratorModal extends HTMLElement {
  // Shadow DOM
  private _shadowRoot: ShadowRoot;

  // Attributes
  private _seed: string = "";

  // Elements
  private _content: HTMLElement | null = null;

  static get observedAttributes() {
    return ["seed"];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.appendChild(
      SystemGeneratorModalTemplate.content.cloneNode(true),
    );

    this._content = this._shadowRoot.querySelector(
      ".system-generator-modal-content",
    );
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (name === "seed") {
      this._seed = newValue;
    }

    this.render();
  }

  /**
   * Sets the seed for the generated system
   */
  set seed(value: string) {
    this.setAttribute("seed", value);
  }

  /**
   * Gets the current seed
   */
  get seed(): string {
    return this._seed;
  }

  /**
   * Renders the modal content based on the current seed and system name
   */
  private render() {
    if (!this._content) return;

    const objects = getCelestialObjects();
    const stars = Object.values(objects).filter(
      (obj) => obj.type === CelestialType.STAR,
    );
    const planets = Object.values(objects).filter(
      (obj) => obj.type === CelestialType.PLANET,
    );
    const moons = Object.values(objects).filter(
      (obj) => obj.type === CelestialType.MOON,
    );
    const gasGiants = Object.values(objects).filter(
      (obj) => obj.type === CelestialType.GAS_GIANT,
    );
    const dwarfPlanets = Object.values(objects).filter(
      (obj) => obj.type === CelestialType.DWARF_PLANET,
    );
    const asteroidFields = Object.values(objects).filter(
      (obj) => obj.type === CelestialType.ASTEROID_FIELD,
    );
    const totalObjects = Object.values(objects).length;

    // Determine system name based on the primary star
    const mainStar = stars.length > 0 ? stars[0] : null;
    const systemName = mainStar
      ? `${mainStar.name} System`
      : `Generated System (${this._seed})`;

    this._content.innerHTML = `
      <div class="system-header">
        <h4 class="system-title">🌌 ${systemName}</h4>
        <p class="system-description">
          A new procedurally generated star system has been created.
        </p>
      </div>

      <div class="physics-info">
        <h5 class="section-title">ℹ️ Physics Options</h5>
        <p class="section-content">
          <strong>Accurate Physics (Recommended):</strong> N-Body Verlet integration provides realistic orbital mechanics. Orbits will evolve over time as gravitational interactions affect the bodies.
          <br/><br/>
          <strong>Ideal Physics:</strong> Kepler orbital mechanics keeps bodies on perfect elliptical paths. Useful for stable visualization but less realistic.
        </p>
      </div>

      <div class="system-summary">
        <h5 class="section-title">📊 System Summary</h5>
        <div class="summary-grid">
          <div><strong>Total Objects:</strong> ${totalObjects}</div>
          <div><strong>Seed:</strong> ${this._seed}</div>
          <div><strong>Stars:</strong> ${stars.length}</div>
          <div><strong>Terrestrial Planets:</strong> ${planets.length}</div>
          <div><strong>Gas Giants:</strong> ${gasGiants.length}</div>
          <div><strong>Moons:</strong> ${moons.length}</div>
          <div><strong>Dwarf Planets:</strong> ${dwarfPlanets.length}</div>
          <div><strong>Asteroid Fields:</strong> ${asteroidFields.length}</div>
        </div>
      </div>

      ${
        mainStar
          ? `
      <div class="star-info">
        <h5 class="section-title">🌟 Primary Star: ${mainStar.name}</h5>
        <div class="star-details">
          <p>
            <strong>Mass:</strong> ${(mainStar.realMass_kg / 1.989e30).toFixed(3)} Solar Masses<br>
            <strong>Temperature:</strong> ${mainStar.temperature} K<br>
            <strong>Radius:</strong> ${(mainStar.realRadius_m / 1000).toExponential(2)} km<br>
            ${(mainStar.properties as StarProperties)?.spectralClass ? `<strong>Spectral Class:</strong> ${(mainStar.properties as StarProperties).spectralClass}<br>` : ""}
            ${
              (mainStar.properties as StarProperties)?.stellarType
                ? `<strong>Stellar Type:</strong> ${(
                    mainStar.properties as StarProperties
                  ).stellarType
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())}<br>`
                : ""
            }
            ${(mainStar.properties as StarProperties)?.color ? `<strong>Color:</strong> ${(mainStar.properties as StarProperties).color}<br>` : ""}
            ${(mainStar.properties as StarProperties)?.luminosity ? `<strong>Luminosity:</strong> ${(mainStar.properties as StarProperties).luminosity.toExponential(2)} L☉<br>` : ""}
            ${mainStar.orbit?.realSemiMajorAxis_m ? `<strong>Orbit Size:</strong> ${(mainStar.orbit.realSemiMajorAxis_m / 149597870700).toFixed(2)} AU<br>` : ""}
            ${mainStar.orbit?.eccentricity ? `<strong>Eccentricity:</strong> ${mainStar.orbit.eccentricity.toFixed(4)}<br>` : ""}
            ${mainStar.orbit?.period_s ? `<strong>Period:</strong> ${(mainStar.orbit.period_s / 86400).toFixed(1)} days<br>` : ""}
            ${(() => {
              const starProps = mainStar.properties as StarProperties;
              if (
                starProps?.partnerStars &&
                starProps.partnerStars.length > 0
              ) {
                return `<strong>Partner Stars:</strong> ${starProps.partnerStars.length}<br>`;
              }
              return "";
            })()}
          </p>
          ${(() => {
            const starProps = mainStar.properties as StarProperties;
            const characteristics = starProps?.characteristics;
            if (characteristics && Object.keys(characteristics).length > 0) {
              return `<p>
                <strong>Special Characteristics:</strong><br>
                ${Object.entries(characteristics)
                  .map(([key, value]) => {
                    // Format special characteristics for better readability
                    const formattedKey = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase());

                    // Format the value based on its type
                    let formattedValue = value;
                    if (typeof value === "number") {
                      formattedValue = value.toFixed(2);
                    } else if (typeof value === "boolean") {
                      formattedValue = value ? "Yes" : "No";
                    }

                    return `${formattedKey}: ${formattedValue}`;
                  })
                  .join("<br>")}
              </p>`;
            }
            return "";
          })()}
        </div>
      </div>
      `
          : ""
      }

      <div class="footer-info">
        Seed: ${this._seed}
      </div>
    `;
  }
}

/**
 * Shows a modal with information about a newly generated system
 * @param seed The seed used to generate the system
 */
export async function showGeneratedSystemModal(seed: string): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { pluginManager } = await import("@teskooano/ui-plugin");

    // Get the modal manager instance
    const modalManager = pluginManager.getManagerInstance("modal-manager");

    if (!modalManager) {
      console.warn("Modal manager not available, skipping system info modal");
      return;
    }

    // Create the system generator modal element
    const modalElement = document.createElement(
      "teskooano-system-generator-modal",
    );
    modalElement.setAttribute("seed", seed);

    // Pause simulation while showing information
    const wasPaused = simulationStateService.getCurrentState().paused;
    if (!wasPaused) {
      simulationStateService.togglePause();
    }

    const result = await modalManager.show({
      title: "🪐 New System Generated",
      content: modalElement,
      width: 500,
      height: 620,
      confirmText: "Accurate Physics",
      secondaryText: "Ideal Physics",
      closeText: "Close",
      hideCloseButton: false,
      hideSecondaryButton: false,
    });

    // Handle physics engine selection
    if (result === "confirm") {
      // Accurate physics (N-Body) - preferred
      simulationStateService.setPhysicsEngine("verlet");
    } else if (result === "secondary") {
      // Ideal orbits (Kepler)
      simulationStateService.setPhysicsEngine("kepler");
    }
    // If "close" was clicked, keep the current physics engine

    // Resume simulation if it was running before modal
    if (!wasPaused) {
      simulationStateService.togglePause();
    }

    console.log("Generated system modal result:", result);
  } catch (error) {
    console.warn("Could not show generated system modal:", error);
    // Don't throw - modal is optional, system loading should still work
  }
}
