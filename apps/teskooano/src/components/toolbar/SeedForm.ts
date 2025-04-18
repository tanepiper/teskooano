import { actions } from "@teskooano/core-state";
import { CelestialType, StarProperties } from "@teskooano/data-types";
import { generateSystem } from "@teskooano/procedural-generation";
import { dispatchTextureGenerationComplete } from "@teskooano/systems-celestial";
import { DockviewApi } from "dockview-core";
import { TeskooanoButton } from "../shared/Button";
import "../shared/Button.js"; // Assuming Button.ts compiles to .js
import { TeskooanoInputField } from "../shared/InputField";
import "../shared/InputField.js"; // Assuming InputField.ts compiles to .js

// Custom event name for simulation time reset
const RESET_SIMULATION_TIME_EVENT = "resetSimulationTime";

// Define the custom event for resetting simulation accumulated time
export function dispatchSimulationTimeReset() {
  const event = new CustomEvent(RESET_SIMULATION_TIME_EVENT);
  window.dispatchEvent(event);
}

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm, 8px);
      font-family: var(--font-family, sans-serif);
    }
    
    /* Compact styles for toolbar */
    teskooano-input-field {
      width: 120px;
      margin-bottom: 0;
    }
    
    /* Make the input appear inline in the toolbar context */
    teskooano-input-field::part(input) {
      height: 28px;
      padding-top: 4px;
      padding-bottom: 4px;
    }
    
    .seed-label {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-secondary, #aaa);
      font-weight: var(--font-weight-medium, 500);
      margin-right: var(--space-xxs, 2px);
    }
  </style>
  <span class="seed-label">Seed:</span>
  <teskooano-input-field id="seed-input" value="42" placeholder="System seed" label=""></teskooano-input-field>
  <teskooano-button id="generate-button">
    <span slot="icon">🌍</span>
    Generate
  </teskooano-button>
`;

export class ToolbarSeedForm extends HTMLElement {
  private inputElement: TeskooanoInputField | null = null;
  private buttonElement: TeskooanoButton | null = null;
  private _isGenerating = false; // Prevent multiple clicks
  private static dockviewApi: DockviewApi | null = null; // Static reference to dockview API

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.inputElement = this.shadowRoot!.getElementById(
      "seed-input",
    ) as TeskooanoInputField;
    this.buttonElement = this.shadowRoot!.getElementById(
      "generate-button",
    ) as TeskooanoButton;

    // Ensure label is cleared on the input field
    if (this.inputElement) {
      this.inputElement.setAttribute("label", "");
    }

    this.buttonElement.addEventListener("click", this.handleGenerate);
    this.inputElement.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback() {
    this.buttonElement?.removeEventListener("click", this.handleGenerate);
    this.inputElement?.removeEventListener("keydown", this.handleKeydown);
  }

  // Static method to set the Dockview API reference
  public static setDockviewApi(api: DockviewApi): void {
    ToolbarSeedForm.dockviewApi = api;
  }

  private handleKeydown = (e: KeyboardEvent) => {
    // Generate system when pressing Enter in the input field
    if (e.key === "Enter") {
      this.handleGenerate();
    }
  };

  public tourGenerate = async () => {
    this.handleGenerate();
  };

  private handleGenerate = async () => {
    if (!ToolbarSeedForm.dockviewApi) {
      console.error("Dockview API not set on ToolbarSeedForm!");
      return;
    }
    if (this._isGenerating) {
      return;
    }
    this._isGenerating = true;
    if (this.buttonElement) this.buttonElement.disabled = true;

    // Use icon to indicate progress
    const iconElement = this.buttonElement?.querySelector('span[slot="icon"]');
    const originalIcon = iconElement?.textContent || "🌍";
    if (iconElement) iconElement.textContent = "⏳";

    let seed = "42";
    if (this.inputElement) {
      const inputSeed = String(this.inputElement.value).trim();
      if (inputSeed) {
        seed = inputSeed;
      } else {
        console.warn('Seed input is empty, using default seed "42".');
        this.inputElement.value = "42";
      }
    }

    // --- Clear state FIRST ---
    actions.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });

    // Force an explicit time reset immediately after clearing state
    actions.resetTime();
    // Dispatch the custom event to reset accumulated time in the simulation loop
    dispatchSimulationTimeReset();

    // --- Show Progress Panel (After clearing state) ---
    const progressPanelId = "texture-progress-panel";
    // Close existing progress panel first, if any
    ToolbarSeedForm.dockviewApi.panels
      .find((p) => p.id === progressPanelId)
      ?.api.close();

    // Generate the system data
    let systemData: any[] = [];
    let planetList: { id: string; name: string }[] = [];

    try {
      systemData = await generateSystem(seed);
      planetList = systemData
        .filter(
          (obj) =>
            obj.type === CelestialType.PLANET ||
            obj.type === CelestialType.GAS_GIANT,
        )
        .map((planet) => ({ id: planet.id, name: planet.name }));

      // Show the progress panel
      ToolbarSeedForm.dockviewApi.addPanel({
        id: progressPanelId,
        component: "progress_view",
        title: "Generating Textures...",
        params: { planetList: planetList },
        floating: {
          position: { top: 100, left: 100 },
          width: 400,
          height: 300,
        },
      });

      // --- Add objects to the state store ---
      if (systemData && systemData.length > 0) {
        // Find the primary star first (should have isMainStar=true in properties)
        let primaryStar = systemData.find((obj) => {
          if (obj.type !== CelestialType.STAR) return false;
          const props = obj.properties as StarProperties;
          return props?.isMainStar === true;
        });

        // Fallback to any star if no isMainStar flag is found
        if (!primaryStar) {
          console.warn(
            "[ToolbarSeedForm] No star with isMainStar=true found. Falling back to first star in system.",
          );
          primaryStar = systemData.find(
            (obj) =>
              obj.type === CelestialType.STAR || obj.id.startsWith("star-"),
          );
        }

        if (primaryStar) {
          // Create the system with the primary star first
          console.log(
            `[ToolbarSeedForm] Creating solar system with primary star: ${primaryStar.id}`,
          );
          actions.createSolarSystem(primaryStar);

          // Add all *other* objects, ensuring no stars are added with addCelestial
          systemData.forEach((objData) => {
            if (objData.id !== primaryStar.id) {
              // Check if this is a secondary star with no parent (should use createSolarSystem)
              if (objData.type === CelestialType.STAR && !objData.parentId) {
                console.warn(
                  `[ToolbarSeedForm] Found another primary star: ${objData.id}. Using createSolarSystem.`,
                );
                actions.createSolarSystem(objData);
              } else {
                // Add other objects normally
                actions.addCelestial(objData);
              }
            }
          });
        } else {
          // Fallback or error handling if no primary star found (shouldn't happen with generator)
          console.error(
            "[ToolbarSeedForm] No primary star found in generated data! Adding stars with createSolarSystem and other objects with addCelestial.",
          );

          // First add all stars using createSolarSystem
          const stars = systemData.filter(
            (obj) => obj.type === CelestialType.STAR && !obj.parentId,
          );
          stars.forEach((star) => {
            console.log(
              `[ToolbarSeedForm] Creating solar system with star: ${star.id}`,
            );
            actions.createSolarSystem(star);
          });

          // Then add non-primary-stars and other objects
          systemData.forEach((objData) => {
            if (!(objData.type === CelestialType.STAR && !objData.parentId)) {
              actions.addCelestial(objData);
            }
          });
        }

        // IMPORTANT: Reset simulation time at the end to ensure we start from time 0
        actions.resetTime();

        // Force a more direct time reset by importing the simulation state directly
        try {
          // Try to get simulationState to force a direct reset as a fallback
          const { simulationState } = await import("@teskooano/core-state");
          simulationState.set({
            ...simulationState.get(),
            time: 0,
          });
        } catch (err) {
          console.warn(
            "[ToolbarSeedForm] Couldn't import simulationState directly:",
            err,
          );
        }

        // Dispatch custom event to reset accumulated time in the simulation loop
        dispatchSimulationTimeReset();

        // Dispatch completion event AFTER state update and time resets
        dispatchTextureGenerationComplete(true);
      } else {
        console.warn("[ToolbarSeedForm] Generator returned no objects.");
        ToolbarSeedForm.dockviewApi.panels
          .find((p) => p.id === progressPanelId)
          ?.api.close();
        dispatchTextureGenerationComplete(true);
      }
    } catch (error) {
      console.error(
        "[ToolbarSeedForm] Error during system generation or state update:",
        error,
      );
      ToolbarSeedForm.dockviewApi.panels
        .find((p) => p.id === progressPanelId)
        ?.api.close();
      dispatchTextureGenerationComplete(false, 1);
    } finally {
      this._isGenerating = false;
      if (this.buttonElement) this.buttonElement.disabled = false;

      // Restore original icon - no need to manipulate the DOM structure
      if (iconElement) iconElement.textContent = originalIcon;
      // No need to append the icon again since we never removed it from the DOM
    }
  };
}

// Define the custom element
customElements.define("toolbar-seed-form", ToolbarSeedForm);
