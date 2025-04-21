import { actions, currentSeed, updateSeed } from "@teskooano/core-state";
import { CelestialType, StarProperties } from "@teskooano/data-types";
import { generateSystem } from "@teskooano/procedural-generation";
import { dispatchTextureGenerationComplete } from "@teskooano/systems-celestial";
import { DockviewApi } from "dockview-core";
import { TeskooanoButton } from "../shared/Button";
import "../shared/Button.js"; // Assuming Button.ts compiles to .js

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
      align-items: baseline;
      gap: var(--space-sm, 8px);
      font-family: var(--font-family, sans-serif);
    }

    /* Styles for the native input */
    #seed-input {
      box-sizing: border-box;
      width: 120px;
      padding: var(--space-xs, 4px) var(--space-sm, 8px);
      border: 1px solid var(--color-border, #50506a);
      border-radius: var(--border-radius-sm, 3px);
      background-color: var(--color-surface-inset, #1a1a2e);
      color: var(--color-text, #e0e0fc);
      font-size: var(--font-size-md, 1em);
      line-height: 1.5;
      vertical-align: baseline;
    }

    #seed-input:focus {
      outline: 2px solid var(--color-primary-light, #9fa8da);
      outline-offset: 1px;
      border-color: var(--color-primary-light, #9fa8da);
    }

    .seed-label {
      font-size: var(--font-size-sm, 0.9em);
      color: var(--color-text-secondary, #aaa);
      font-weight: var(--font-weight-medium, 500);
      margin-right: var(--space-xxs, 2px);
    }

    :host([mobile]) #seed-input {
      width: 80px;
    }

    /* Target the text span we added earlier */
    :host([mobile]) #generate-button span:not([slot='icon']) {
       display: none; /* Hide text, keep icon */
    }

    :host([mobile]) #generate-button span[slot="icon"] {
      margin-right: 0; /* Remove margin when text is hidden */
    }
  </style>
  <span class="seed-label">Seed:</span>
  <input type="text" id="seed-input" placeholder="System seed" />
  <teskooano-button id="generate-button">
    <span slot="icon">🌍</span>
    <span>Generate</span>
  </teskooano-button>
`;

export class ToolbarSeedForm extends HTMLElement {
  private inputElement: HTMLInputElement | null = null;
  private buttonElement: TeskooanoButton | null = null;
  private _isGenerating = false; // Prevent multiple clicks
  private static dockviewApi: DockviewApi | null = null; // Static reference to dockview API
  private unsubscribeSeed: (() => void) | null = null; // Use function type

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.inputElement = this.shadowRoot!.getElementById(
      "seed-input",
    ) as HTMLInputElement;
    this.buttonElement = this.shadowRoot!.getElementById(
      "generate-button",
    ) as TeskooanoButton;

    // Set initial value from the store and subscribe to changes
    if (this.inputElement) {
      const initialSeed = currentSeed.get(); // Get current value from store
      this.inputElement.value = initialSeed;

      // Subscribe to the seed store
      this.unsubscribeSeed = currentSeed.subscribe((seed) => {
        if (this.inputElement && this.inputElement.value !== seed) {
          this.inputElement.value = seed;
        }
      });
    }

    this.buttonElement.addEventListener("click", this.handleGenerate);
    this.inputElement.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback() {
    this.buttonElement?.removeEventListener("click", this.handleGenerate);
    this.inputElement?.removeEventListener("keydown", this.handleKeydown);
    // Unsubscribe from the store when the element is removed
    if (this.unsubscribeSeed) {
      this.unsubscribeSeed();
      this.unsubscribeSeed = null;
    }
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
    if (!ToolbarSeedForm.dockviewApi || !this.inputElement) {
      console.error(
        "Dockview API not set or input element not found in ToolbarSeedForm!",
      );
      return;
    }
    if (this._isGenerating) return;

    this._isGenerating = true;
    if (this.buttonElement) this.buttonElement.disabled = true;

    // Use icon to indicate progress
    const iconElement = this.buttonElement?.querySelector('span[slot="icon"]');
    const originalIcon = iconElement?.textContent || "🌍";
    if (iconElement) iconElement.textContent = "⏳";

    const inputSeed = this.inputElement.value; // Get seed from input

    // --- Update the central seed store (this also updates localStorage) ---
    updateSeed(inputSeed);
    const finalSeed = currentSeed.get(); // Get the potentially defaulted seed from the store
    // --- End Update State ---

    // --- Clear state FIRST ---
    actions.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
    actions.resetTime();
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
      systemData = await generateSystem(finalSeed);
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
