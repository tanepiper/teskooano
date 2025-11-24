import {
  simulationManager,
  simulationState$,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import type {
  DeviceTier,
  SimulationConfiguration,
  SimulationMode,
} from "@teskooano/data-types";

import { type TeskooanoSlider } from "../../../core/components/slider/Slider";
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";
import type { NBodySettingsComponent } from "../view/NBodySettingsComponent";
import { RendererSettingsComponent } from "../view/RendererSettingsComponent";

const PERFORMANCE_PROFILE_OPTIONS: {
  value: DeviceTier;
  label: string;
}[] = [
  { value: "low", label: "Low (Power Saving)" },
  { value: "medium", label: "Medium (Balanced)" },
  { value: "high", label: "High (Performance)" },
  { value: "cosmic", label: "Cosmic (Max Quality)" },
];

/**
 * Defines the structure for the enhanced UI elements that the controller will manage.
 */
export interface IEnhancedSettingsPanelElements {
  formElement: HTMLFormElement;
  /** Slider for trail length multiplier (e.g., 2x = twice as long trails) */
  trailSliderElement: TeskooanoSlider;

  // Mode selection
  simulationModeSelectElement: HTMLSelectElement;
  currentModeBadgeElement: HTMLSpanElement;

  // N-Body component
  nbodySettingsComponent: NBodySettingsComponent;

  // Legacy
  profileSelectElement: HTMLSelectElement;

  // Renderer settings
  rendererSettingsContainer: HTMLElement;

  // Validation
  validationMessagesElement: HTMLDivElement;
}

/**
 * Enhanced controller for the Settings Panel with dual-mode configuration support.
 * Handles mode switching, conditional UI visibility, performance feedback, and validation.
 */
export class EnhancedSettingsController extends StateSubscriptionMixin {
  private currentConfig: SimulationConfiguration;
  private rendererSettingsComponent?: RendererSettingsComponent;

  /**
   * Initializes the enhanced controller and binds it to the view's elements.
   */
  constructor(private elements: IEnhancedSettingsPanelElements) {
    super();
    this.currentConfig = simulationManager.getSimulationConfiguration();
    this.initialize();
  }

  /**
   * Cleans up all subscriptions and event listeners to prevent memory leaks.
   */
  public dispose(): void {
    this.rendererSettingsComponent?.dispose();
    this.removeEventListeners();
    super.dispose();
  }

  /**
   * Initializes the controller by setting up event listeners, populating controls,
   * and subscribing to state changes.
   * @private
   */
  private initialize(): void {
    this.setupEventListeners();
    this.populateControls();

    // Ensure DOM is ready before updating UI and initializing components
    requestAnimationFrame(() => {
      this.initializeNBodyComponent();
      this.initializeRendererSettingsComponent();
      this.updateUI();
    });

    this.subscribeToState(simulationState$, this.handleStateChange);
  }

  /**
   * Sets up all event listeners for form controls.
   * @private
   */
  private setupEventListeners(): void {
    // Prevent form submission
    this.elements.formElement.addEventListener("submit", this.handleFormSubmit);

    // Trail length slider
    this.elements.trailSliderElement.addEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );

    // Mode selection
    this.elements.simulationModeSelectElement.addEventListener(
      "change",
      this.handleModeChange,
    );

    // Performance profile
    this.elements.profileSelectElement.addEventListener(
      "change",
      this.handleProfileChange,
    );
  }

  /**
   * Initializes the N-Body settings component.
   * @private
   */
  private initializeNBodyComponent(): void {
    // Ensure the custom element is fully connected before calling methods
    if (
      this.elements.nbodySettingsComponent &&
      typeof this.elements.nbodySettingsComponent.initialize === "function"
    ) {
      this.elements.nbodySettingsComponent.initialize({
        showValidationMessage: this.showValidationMessage.bind(this),
        clearValidationMessages: this.clearValidationMessages.bind(this),
      });
    } else {
      console.warn(
        "[EnhancedSettingsController] N-Body component not ready, retrying...",
      );
      // Retry after a short delay to allow the custom element to fully initialize
      setTimeout(() => {
        this.initializeNBodyComponent();
      }, 10);
    }
  }

  /**
   * Initializes the renderer settings component.
   * @private
   */
  private initializeRendererSettingsComponent(): void {
    if (this.elements.rendererSettingsContainer) {
      this.rendererSettingsComponent = new RendererSettingsComponent(
        this.elements.rendererSettingsContainer,
      );
    } else {
      console.warn(
        "[EnhancedSettingsController] Renderer settings container not found",
      );
    }
  }

  /**
   * Removes all event listeners.
   * @private
   */
  private removeEventListeners(): void {
    this.elements.formElement.removeEventListener(
      "submit",
      this.handleFormSubmit,
    );
    this.elements.trailSliderElement.removeEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );
    this.elements.simulationModeSelectElement.removeEventListener(
      "change",
      this.handleModeChange,
    );
    this.elements.profileSelectElement.removeEventListener(
      "change",
      this.handleProfileChange,
    );
  }

  /**
   * Populates all select elements with their options.
   * @private
   */
  private populateControls(): void {
    // Note: All options (mode, algorithm, integrator, performance profile) are defined
    // in the HTML template since they're static and benefit from the enhanced styling.
    // No need to populate them programmatically.
  }

  /**
   * Updates the entire UI to reflect the current state.
   * @private
   */
  private updateUI(): void {
    const state = simulationManager.getSimulationState();
    this.currentConfig = state.simulationConfig;

    // Update basic controls
    this.updateTrailSlider(state.visualSettings.trailLengthMultiplier);
    this.updatePerformanceProfile(state.performanceProfile);

    // Update mode-specific UI
    this.updateModeControls();
    this.updateModeBadge();

    // Delegate N-Body updates to the component (if it's ready)
    if (
      this.elements.nbodySettingsComponent &&
      typeof this.elements.nbodySettingsComponent.updateNBodyControls ===
        "function"
    ) {
      this.elements.nbodySettingsComponent.updateNBodyControls();
      this.elements.nbodySettingsComponent.updateNBodyVisibility();
    }
  }

  /**
   * Updates the trail length multiplier slider value.
   * @private
   */
  private updateTrailSlider(value: number): void {
    if (this.elements.trailSliderElement.value !== value) {
      this.elements.trailSliderElement.value = value;
    }
  }

  /**
   * Updates the performance profile select.
   * @private
   */
  private updatePerformanceProfile(profile: DeviceTier): void {
    if (this.elements.profileSelectElement.value !== profile) {
      this.elements.profileSelectElement.value = profile;
    }
  }

  /**
   * Updates mode-related controls based on current configuration.
   * @private
   */
  private updateModeControls(): void {
    // Update mode selector
    this.elements.simulationModeSelectElement.value = this.currentConfig.mode;
  }

  /**
   * Updates the mode badge in the section header.
   * @private
   */
  private updateModeBadge(): void {
    const badge = this.elements.currentModeBadgeElement;

    // Remove existing mode classes
    badge.classList.remove("ideal", "nbody");

    // Add current mode class and update text
    badge.classList.add(this.currentConfig.mode);
    badge.textContent =
      this.currentConfig.mode === "ideal" ? "Ideal" : "N-Body";
  }

  /**
   * Shows a validation message to the user.
   * @private
   */
  private showValidationMessage(
    message: string,
    type: "error" | "warning" = "error",
  ): void {
    const container = this.elements.validationMessagesElement;

    const messageElement = document.createElement("div");
    messageElement.className = `${type}-message`;
    messageElement.textContent = message;

    container.innerHTML = "";
    container.appendChild(messageElement);
    container.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      container.style.display = "none";
    }, 5000);
  }

  /**
   * Clears any validation messages.
   * @private
   */
  private clearValidationMessages(): void {
    this.elements.validationMessagesElement.style.display = "none";
  }

  // Event Handlers

  /**
   * Prevents default form submission.
   * @private
   */
  private handleFormSubmit = (e: Event) => e.preventDefault();

  /**
   * Handles trail length multiplier slider changes.
   * The slider value represents a multiplier (e.g., 2x = twice as long trails).
   * @private
   */
  private handleTrailChange = (
    event: CustomEvent<SliderValueChangePayload>,
  ): void => {
    const value = event.detail.value;
    if (typeof value === "number" && !isNaN(value)) {
      // Ensure the value is non-negative (validation is also done in the service)
      const multiplier = Math.max(0, value);
      simulationManager.setTrailLengthMultiplier(multiplier);
    }
  };

  /**
   * Handles simulation mode changes.
   * @private
   */
  private handleModeChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const mode = target.value as SimulationMode;

    try {
      simulationManager.setSimulationMode(mode);
      this.clearValidationMessages();
    } catch (error) {
      console.error("Failed to set simulation mode:", error);
      this.showValidationMessage(
        `Failed to change mode: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Revert selection
      target.value = this.currentConfig.mode;
    }
  };

  /**
   * Handles performance profile changes.
   * @private
   */
  private handleProfileChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as DeviceTier;

    if (PERFORMANCE_PROFILE_OPTIONS.some((opt) => opt.value === value)) {
      simulationManager.setPerformanceProfile(value);
    }
  };

  /**
   * Handles global simulation state changes.
   * @private
   */
  private handleStateChange = (): void => {
    this.updateUI();
  };
}
