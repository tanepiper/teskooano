import {
  getSimulationState,
  simulationState$,
  simulationStateService,
  type PerformanceProfileType,
  type SimulationConfiguration,
  type SimulationMode,
  type AlgorithmType,
  type IntegratorType,
  StateSubscriptionMixin,
  getConfigurationDisplayName,
  getConfigurationShortName,
} from "@teskooano/core-state";

import { type TeskooanoSlider } from "../../../core/components/slider/Slider";
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";

const PERFORMANCE_PROFILE_OPTIONS: {
  value: PerformanceProfileType;
  label: string;
}[] = [
  { value: "low", label: "Low (Power Saving)" },
  { value: "medium", label: "Medium (Balanced)" },
  { value: "high", label: "High (Performance)" },
  { value: "cosmic", label: "Max Quality)" },
];

/**
 * Defines the structure for the enhanced UI elements that the controller will manage.
 */
export interface IEnhancedSettingsPanelElements {
  formElement: HTMLFormElement;
  trailSliderElement: TeskooanoSlider;

  // Mode selection
  simulationModeSelectElement: HTMLSelectElement;
  currentModeBadgeElement: HTMLSpanElement;

  // N-Body specific controls
  nbodyControlsElement: HTMLDivElement;
  algorithmSelectElement: HTMLSelectElement;
  integratorSelectElement: HTMLSelectElement;

  // Display elements
  configDisplayElement: HTMLDivElement;
  modePerformanceElement: HTMLDivElement;
  performanceDotElement: HTMLSpanElement;
  performanceTextElement: HTMLSpanElement;

  // Legacy
  profileSelectElement: HTMLSelectElement;

  // Validation
  validationMessagesElement: HTMLDivElement;
}

/**
 * Enhanced controller for the Settings Panel with dual-mode configuration support.
 * Handles mode switching, conditional UI visibility, performance feedback, and validation.
 */
export class EnhancedSettingsController extends StateSubscriptionMixin {
  private currentConfig: SimulationConfiguration;

  /**
   * Initializes the enhanced controller and binds it to the view's elements.
   */
  constructor(private elements: IEnhancedSettingsPanelElements) {
    super();
    this.currentConfig = simulationStateService.getSimulationConfiguration();
    this.initialize();
  }

  /**
   * Cleans up all subscriptions and event listeners to prevent memory leaks.
   */
  public dispose(): void {
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
    this.updateUI();
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

    // N-Body specific controls
    this.elements.algorithmSelectElement.addEventListener(
      "change",
      this.handleAlgorithmChange,
    );

    this.elements.integratorSelectElement.addEventListener(
      "change",
      this.handleIntegratorChange,
    );

    // Performance profile
    this.elements.profileSelectElement.addEventListener(
      "change",
      this.handleProfileChange,
    );
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
    this.elements.algorithmSelectElement.removeEventListener(
      "change",
      this.handleAlgorithmChange,
    );
    this.elements.integratorSelectElement.removeEventListener(
      "change",
      this.handleIntegratorChange,
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
    // Performance profile options (unchanged)
    this.populateSelect(
      this.elements.profileSelectElement,
      PERFORMANCE_PROFILE_OPTIONS,
    );

    // Note: Mode, algorithm, and integrator options are defined in the HTML template
    // since they're static and benefit from the enhanced styling
  }

  /**
   * Updates the entire UI to reflect the current state.
   * @private
   */
  private updateUI(): void {
    const state = getSimulationState();
    this.currentConfig = state.simulationConfig;

    // Update basic controls
    this.updateTrailSlider(state.visualSettings.trailLengthMultiplier);
    this.updatePerformanceProfile(state.performanceProfile);

    // Update mode-specific UI
    this.updateModeControls();
    this.updateNBodyVisibility();
    this.updateConfigurationDisplay();
    this.updatePerformanceIndicator();
    this.updateModeBadge();
  }

  /**
   * Updates the trail length slider value.
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
  private updatePerformanceProfile(profile: PerformanceProfileType): void {
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

    // Update N-Body specific controls
    if (this.currentConfig.mode === "nbody") {
      this.elements.algorithmSelectElement.value =
        this.currentConfig.algorithm || "barnes-hut";
      this.elements.integratorSelectElement.value =
        this.currentConfig.integrator || "verlet";
    }
  }

  /**
   * Shows or hides N-Body specific controls based on current mode.
   * @private
   */
  private updateNBodyVisibility(): void {
    const isNBodyMode = this.currentConfig.mode === "nbody";

    if (isNBodyMode) {
      this.elements.nbodyControlsElement.classList.add("visible");
    } else {
      this.elements.nbodyControlsElement.classList.remove("visible");
    }
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
   * Updates the configuration display with current settings.
   * @private
   */
  private updateConfigurationDisplay(): void {
    const displayName = getConfigurationDisplayName(this.currentConfig);
    const shortName = getConfigurationShortName(this.currentConfig);

    this.elements.configDisplayElement.textContent = `${displayName} | Config: ${shortName}`;
  }

  /**
   * Updates the performance indicator based on current configuration.
   * @private
   */
  private updatePerformanceIndicator(): void {
    const dot = this.elements.performanceDotElement;
    const text = this.elements.performanceTextElement;

    // Remove existing performance classes
    dot.classList.remove("warning", "error");

    if (this.currentConfig.mode === "ideal") {
      text.textContent = "Optimal performance";
    } else {
      // N-Body mode - assess performance based on algorithm
      const algorithm = this.currentConfig.algorithm;

      switch (algorithm) {
        case "barnes-hut":
          text.textContent = "Balanced performance (100-10K bodies)";
          break;
        case "fmm":
          text.textContent = "Optimal for large systems (5K+ bodies)";
          break;
        case "p3m":
          text.textContent = "Good for medium systems (2K-50K bodies)";
          break;
        case "tree-pm":
          text.textContent = "Excellent all-around performance";
          break;
        default:
          text.textContent = "Performance varies by system size";
      }
    }
  }

  /**
   * Populates a select element with options.
   * @private
   */
  private populateSelect(
    selectElement: HTMLSelectElement,
    options: { value: string; label: string }[],
  ): void {
    selectElement.innerHTML = "";
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      selectElement.appendChild(optionElement);
    });
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
   * Handles trail length slider changes.
   * @private
   */
  private handleTrailChange = (
    event: CustomEvent<SliderValueChangePayload>,
  ): void => {
    const value = event.detail.value;
    if (typeof value === "number" && !isNaN(value)) {
      simulationStateService.setTrailLengthMultiplier(value);
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
      simulationStateService.setSimulationMode(mode);
      this.clearValidationMessages();

      // Add smooth transition effect
      this.elements.nbodyControlsElement.classList.add("fade-in");
      setTimeout(() => {
        this.elements.nbodyControlsElement.classList.remove("fade-in");
      }, 300);
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
   * Handles algorithm changes in N-Body mode.
   * @private
   */
  private handleAlgorithmChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const algorithm = target.value as AlgorithmType;

    try {
      simulationStateService.setNBodyAlgorithm(algorithm);
      this.clearValidationMessages();
    } catch (error) {
      console.error("Failed to set algorithm:", error);
      this.showValidationMessage(
        `Failed to change algorithm: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Revert selection
      target.value = this.currentConfig.algorithm || "barnes-hut";
    }
  };

  /**
   * Handles integrator changes in N-Body mode.
   * @private
   */
  private handleIntegratorChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const integrator = target.value as IntegratorType;

    try {
      simulationStateService.setNBodyIntegrator(integrator);
      this.clearValidationMessages();
    } catch (error) {
      console.error("Failed to set integrator:", error);
      this.showValidationMessage(
        `Failed to change integrator: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Revert selection
      target.value = this.currentConfig.integrator || "verlet";
    }
  };

  /**
   * Handles performance profile changes.
   * @private
   */
  private handleProfileChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as PerformanceProfileType;

    if (PERFORMANCE_PROFILE_OPTIONS.some((opt) => opt.value === value)) {
      simulationStateService.setPerformanceProfile(value);
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
