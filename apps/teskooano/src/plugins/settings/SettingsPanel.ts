import { IContentRenderer, IDockviewPanelProps } from "dockview-core";
// Import state and actions
import {
  getSimulationState,
  simulationState$,
  simulationActions,
  type PhysicsEngineType,
  type PerformanceProfileType,
} from "@teskooano/core-state";

import { type TeskooanoSlider } from "../../core/components/slider/Slider";
import { template } from "./Settings.template"; // Import the template
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";
import { Subscription } from "rxjs";

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
  { value: "cosmic", label: "Max Quality)" },
];
// --- END ADD ---

/**
 * Renders the content for the settings panel within Dockview.
 * Implemented as a Custom Element.
 */
export class SettingsPanel extends HTMLElement implements IContentRenderer {
  // Define the custom element tag name
  public static readonly componentName = "teskooano-settings-panel";

  // Standard HTML Form element
  private formElement: HTMLFormElement | null = null;
  private trailSliderElement: TeskooanoSlider | null = null;
  private engineSelectElement: HTMLSelectElement | null = null;
  private profileSelectElement: HTMLSelectElement | null = null;
  private unsubscribeSimState: Subscription | null = null;

  constructor() {
    super();
    // Attach shadow DOM and append template
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  // --- IContentRenderer implementation ---
  get element(): HTMLElement {
    return this;
  }

  /**
   * Called by Dockview to initialize the panel content.
   * @param params - Initialization parameters provided by Dockview (currently unused).
   */
  init(params: IDockviewPanelProps<any>): void {
    // Initialization logic now happens in connectedCallback
    // We might pass params through if needed later
  }

  // --- Custom Element Lifecycle Callbacks ---
  connectedCallback() {
    // Find elements within the shadow DOM
    this.formElement =
      this.shadowRoot!.querySelector<HTMLFormElement>("#settings-form");
    this.trailSliderElement = this.shadowRoot!.querySelector<TeskooanoSlider>(
      "#setting-trail-length",
    );
    this.engineSelectElement =
      this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-physics-engine",
      );
    this.profileSelectElement =
      this.shadowRoot!.querySelector<HTMLSelectElement>(
        "#setting-performance-profile",
      );

    if (
      !this.formElement ||
      !this.trailSliderElement ||
      !this.engineSelectElement ||
      !this.profileSelectElement
    ) {
      console.error(
        "[SettingsPanel] Failed to find essential elements in template!",
      );
      // Maybe add a user-facing error message in the shadow DOM?
      this.shadowRoot!.innerHTML =
        "<p style='color:red'>Error loading settings panel content.</p>";
      return;
    }

    // Add styling to the host element (moved from constructor)
    this.style.display = "block";
    this.style.padding = "var(--space-md, 12px)";
    this.style.height = "100%";
    this.style.overflowY = "auto";
    this.style.boxSizing = "border-box";

    // --- Add Event Listeners and Populate Data ---
    this.addEventListenersAndPopulate();
  }

  disconnectedCallback() {
    // Remove listeners and unsubscribe
    this.removeEventListenersAndUnsubscribe();
  }

  // --- Helper methods --- //

  private addEventListenersAndPopulate(): void {
    if (
      !this.formElement ||
      !this.trailSliderElement ||
      !this.engineSelectElement ||
      !this.profileSelectElement
    ) {
      return; // Already handled in connectedCallback
    }

    // Prevent default form submission
    this.formElement.addEventListener("submit", this.handleFormSubmit);

    // Populate Selects
    this.populateSelect(this.engineSelectElement, ENGINE_OPTIONS);
    this.populateSelect(this.profileSelectElement, PERFORMANCE_PROFILE_OPTIONS);

    // Set Initial Values & Attach Listeners
    const initialState = getSimulationState();

    // Trail Slider
    this.trailSliderElement.value =
      initialState.visualSettings.trailLengthMultiplier;
    this.trailSliderElement.addEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );

    // Physics Engine Select
    this.engineSelectElement.value = initialState.physicsEngine;
    this.engineSelectElement.addEventListener(
      "change",
      this.handleEngineChange,
    );

    // Performance Profile Select
    this.profileSelectElement.value = initialState.performanceProfile;
    this.profileSelectElement.addEventListener(
      "change",
      this.handleProfileChange,
    );

    // Subscribe to state changes AFTER initial setup
    this.unsubscribeSimState = simulationState$.subscribe(
      this.updateControlStates,
    );
  }

  private removeEventListenersAndUnsubscribe(): void {
    this.formElement?.removeEventListener("submit", this.handleFormSubmit);
    this.trailSliderElement?.removeEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );
    this.engineSelectElement?.removeEventListener(
      "change",
      this.handleEngineChange,
    );
    this.profileSelectElement?.removeEventListener(
      "change",
      this.handleProfileChange,
    );

    // Unsubscribe from state changes
    this.unsubscribeSimState?.unsubscribe();
    this.unsubscribeSimState = null;
    // Clear references
    this.formElement = null;
    this.trailSliderElement = null;
    this.engineSelectElement = null;
    this.profileSelectElement = null;
  }

  private handleFormSubmit = (e: Event) => e.preventDefault();

  private populateSelect(
    selectElement: HTMLSelectElement,
    options: { value: string; label: string }[],
  ): void {
    // Clear existing options first
    selectElement.innerHTML = "";
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      selectElement.appendChild(optionElement);
    });
  }

  private handleTrailChange = (
    event: CustomEvent<SliderValueChangePayload>,
  ): void => {
    const value = event.detail.value;
    if (typeof value === "number" && !isNaN(value)) {
      simulationActions.setTrailLengthMultiplier(value);
    }
  };

  private handleEngineChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as PhysicsEngineType;
    if (ENGINE_OPTIONS.some((opt) => opt.value === value)) {
      simulationActions.setPhysicsEngine(value);
    }
  };

  private handleProfileChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as PerformanceProfileType;
    if (PERFORMANCE_PROFILE_OPTIONS.some((opt) => opt.value === value)) {
      simulationActions.setPerformanceProfile(value);
    }
  };

  private updateControlStates = (): void => {
    const state = getSimulationState();
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
}
