import {
  getCelestialObjects,
  simulationStateService,
} from "@teskooano/core-state";
import { CelestialType } from "@teskooano/data-types";
import { SolarSystemModalTemplate } from "./modal-solar-system.template";

/**
 * @element teskooano-solar-system-modal
 * @description
 * A custom element that displays information about the Solar System.
 * It shows system statistics, star information, and other relevant details.
 */
export class SolarSystemModal extends HTMLElement {
  // Shadow DOM
  private _shadowRoot: ShadowRoot;

  // Elements
  private _content: HTMLElement | null = null;
  private _summaryGrid: HTMLElement | null = null;

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.appendChild(
      SolarSystemModalTemplate.content.cloneNode(true),
    );

    this._content = this._shadowRoot.querySelector(
      ".solar-system-modal-content",
    );
    this._summaryGrid = this._shadowRoot.querySelector("#summary-grid");
  }

  connectedCallback() {
    this.updateSummary();
  }

  /**
   * Updates the summary grid with information from the current celestial objects
   */
  private updateSummary() {
    if (!this._summaryGrid) return;

    const objects = getCelestialObjects();
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

    // Create the summary items
    this._summaryGrid.innerHTML = `
      <div><strong>Total Objects:</strong> ${totalObjects}</div>
      <div><strong>Seed:</strong> SOLARSYSTEM</div>
      <div><strong>Terrestrial Planets:</strong> ${planets.length}</div>
      <div><strong>Gas Giants:</strong> ${gasGiants.length}</div>
      <div><strong>Natural Satellites:</strong> ${moons.length}</div>
      <div><strong>Dwarf Planets:</strong> ${dwarfPlanets.length}</div>
      <div><strong>Asteroid Fields:</strong> ${asteroidFields.length}</div>
      <div><strong>System Type:</strong> G-type Main Sequence</div>
    `;
  }
}

/**
 * Shows a modal with Solar System information using the modal manager
 */
export async function showSolarSystemModal(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { pluginManager } = await import("@teskooano/ui-plugin");

    // Get the modal manager instance
    const modalManager = pluginManager.getManagerInstance("modal-manager");

    if (!modalManager) {
      console.warn("Modal manager not available, skipping system info modal");
      return;
    }

    // Create the solar system modal element
    const modalElement = document.createElement("teskooano-solar-system-modal");

    // Pause simulation while the user chooses physics mode
    const wasPaused = simulationStateService.getCurrentState().paused;
    if (!wasPaused) {
      simulationStateService.togglePause();
    }

    const result = await modalManager.show({
      title: "Solar System Loaded",
      content: modalElement,
      width: 500,
      height: 620,
      confirmText: "Ideal Physics",
      secondaryText: "Accurate Physics",
      closeText: "Close",
      hideSecondaryButton: false,
    });

    // Handle selection – default to Kepler/Ideal
    if (result === "secondary") {
      simulationStateService.setPhysicsEngine("verlet");
    } else {
      // "confirm", "close", or anything else defaults to ideal rails
      simulationStateService.setPhysicsEngine("kepler");
    }

    // Resume simulation if it was running before modal
    if (!wasPaused) {
      simulationStateService.togglePause();
    }

    console.log("Solar System modal result:", result);
  } catch (error) {
    console.warn("Could not show Solar System modal:", error);
    // Don't throw - modal is optional, system loading should still work
  }
}
