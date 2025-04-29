import { IContentRenderer, IDockviewPanelProps } from "dockview-core";
// Import state and actions
import {
  simulationState,
  simulationActions,
  type PhysicsEngineType,
  type PerformanceProfileType,
} from "@teskooano/core-state";

import { type TeskooanoSlider } from "../../core/components/slider/Slider";
import { template } from "./Settings.template"; // Import the template

// Define options for the select component
const ENGINE_OPTIONS: { value: PhysicsEngineType; label: string }[] = [
  { value: "euler", label: "Euler Integrator" },
  { value: "symplectic", label: "Symplectic Euler" },
  { value: "verlet", label: "Verlet Integration" },
];

// --- ADD Performance Profile Options ---
const PERFORMANCE_PROFILE_OPTIONS: {
  value: PerformanceProfileType;
  label: string;
}[] = [
  { value: "low", label: "Low (Power Saving)" },
  { value: "medium", label: "Medium (Balanced)" },
  { value: "high", label: "High (Performance)" },
  { value: "cosmic", label: "Cosmic (Max Quality)" },
];
// --- END ADD ---

/**
 * Renders the content for the settings panel within Dockview.
 */
export class SettingsPanel implements IContentRenderer {
  // The root element that Dockview provides and manages
  readonly element: HTMLElement;

  // Standard HTML Form element
  private formElement: HTMLFormElement | null = null;

  private trailSliderElement: TeskooanoSlider | null = null;
  private engineSelectElement: HTMLSelectElement | null = null; // Standard select
  private profileSelectElement: HTMLSelectElement | null = null; // Standard select
  private unsubscribeSimState: (() => void) | null = null;

  constructor() {
    // Create the main container element for this panel's content
    this.element = document.createElement("div");
    // Add some padding and ensure it can scroll if content overflows
    this.element.style.padding = "var(--space-md, 12px)";
    this.element.style.height = "100%";
    this.element.style.overflowY = "auto";
    this.element.style.boxSizing = "border-box";
  }

  /**
   * Called by Dockview to initialize the panel content.
   * @param params - Initialization parameters provided by Dockview.
   */
  init(params: IDockviewPanelProps<any>): void {
    // Clear previous content and append the template content
    this.element.innerHTML = "";
    this.element.appendChild(template.content.cloneNode(true));

    // Find elements within the rendered template
    this.formElement =
      this.element.querySelector<HTMLFormElement>("#settings-form");
    this.trailSliderElement = this.element.querySelector<TeskooanoSlider>(
      "#setting-trail-length",
    );
    this.engineSelectElement = this.element.querySelector<HTMLSelectElement>(
      "#setting-physics-engine",
    );
    this.profileSelectElement = this.element.querySelector<HTMLSelectElement>(
      "#setting-performance-profile",
    );

    // --- Guard against elements not found (shouldn't happen with static template) ---
    if (
      !this.formElement ||
      !this.trailSliderElement ||
      !this.engineSelectElement ||
      !this.profileSelectElement
    ) {
      console.error(
        "[SettingsPanel] Failed to find essential elements in template!",
      );
      return;
    }

    // Prevent default form submission
    this.formElement.addEventListener("submit", (e) => e.preventDefault());

    // --- Populate Selects ---
    // Physics Engine
    ENGINE_OPTIONS.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      this.engineSelectElement!.appendChild(optionElement);
    });
    // Performance Profile
    PERFORMANCE_PROFILE_OPTIONS.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      this.profileSelectElement!.appendChild(optionElement);
    });

    // --- Set Initial Values & Attach Listeners ---
    const initialState = simulationState.get();

    // Trail Slider
    this.trailSliderElement.value =
      initialState.visualSettings.trailLengthMultiplier;
    this.trailSliderElement.addEventListener("change", (event) => {
      const target = event.target as TeskooanoSlider;
      const value = target.value;
      if (!isNaN(value)) {
        simulationActions.setTrailLengthMultiplier(value);
      }
    });

    // Physics Engine Select
    this.engineSelectElement.value = initialState.physicsEngine;
    this.engineSelectElement.addEventListener("change", (event) => {
      const target = event.target as HTMLSelectElement;
      const value = target.value as PhysicsEngineType;
      if (ENGINE_OPTIONS.some((opt) => opt.value === value)) {
        simulationActions.setPhysicsEngine(value);
      }
    });

    // Performance Profile Select
    this.profileSelectElement.value = initialState.performanceProfile;
    this.profileSelectElement.addEventListener("change", (event) => {
      const target = event.target as HTMLSelectElement;
      const value = target.value as PerformanceProfileType;
      if (PERFORMANCE_PROFILE_OPTIONS.some((opt) => opt.value === value)) {
        simulationActions.setPerformanceProfile(value);
      }
    });

    // Subscribe to state changes AFTER initial setup
    this.unsubscribeSimState = simulationState.subscribe(
      this.updateControlStates,
    );
  }

  /**
   * Updates controls based on the current simulation state.
   */
  private updateControlStates = (): void => {
    const state = simulationState.get();

    // Update Trail Slider
    if (this.trailSliderElement) {
      const currentMultiplier = state.visualSettings.trailLengthMultiplier;
      if (currentMultiplier !== this.trailSliderElement.value) {
        this.trailSliderElement.value = currentMultiplier;
      }
    }

    // Update Engine Select
    if (this.engineSelectElement) {
      const currentEngine = state.physicsEngine;
      if (currentEngine !== this.engineSelectElement.value) {
        this.engineSelectElement.value = currentEngine;
      }
    }

    // Update Performance Profile Select
    if (this.profileSelectElement) {
      const currentProfile = state.performanceProfile;
      if (currentProfile !== this.profileSelectElement.value) {
        this.profileSelectElement.value = currentProfile;
      }
    }
  };

  /**
   * Optional cleanup method called by Dockview when the panel is closed.
   */
  dispose?(): void {
    // Unsubscribe from state changes
    this.unsubscribeSimState?.();
    this.unsubscribeSimState = null;
    // Clear references
    this.formElement = null; // Clear form reference
    this.trailSliderElement = null;
    this.engineSelectElement = null;
    this.profileSelectElement = null;
  }

  // Other IContentRenderer methods like onFocus, onBlur, onParamsChanged
  // can be implemented here if needed later.
}
