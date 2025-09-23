import {
  simulationManager,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import type {
  AlgorithmType,
  IntegratorType,
  SimulationConfiguration,
} from "@teskooano/data-types";
import { getConfigurationDisplayName, getConfigurationShortName } from "../../../plugins/engine-panel/main-toolbar/simulation-controls/controller/simulation-controls.utils";


/**
 * Defines the structure for the N-Body specific UI elements.
 */
export interface INBodySettingsElements {
  nbodyControlsElement: HTMLDivElement;
  algorithmSelectElement: HTMLSelectElement;
  integratorSelectElement: HTMLSelectElement;
  configDisplayElement: HTMLDivElement;
  modePerformanceElement: HTMLDivElement;
  performanceDotElement: HTMLSpanElement;
  performanceTextElement: HTMLSpanElement;
  validationMessagesElement: HTMLDivElement;
}

/**
 * Controller for N-Body specific settings (algorithm and integrator selection).
 * Handles the conditional display and management of N-Body controls.
 */
export class NBodySettingsController extends StateSubscriptionMixin {
  private currentConfig: SimulationConfiguration;

  constructor(
    private elements: INBodySettingsElements,
    private parentController: {
      showValidationMessage: (message: string, type?: "error" | "warning") => void;
      clearValidationMessages: () => void;
    }
  ) {
    super();
    this.currentConfig = simulationManager.getSimulationConfiguration();
    this.initialize();
  }

  /**
   * Cleans up all subscriptions and event listeners.
   */
  public dispose(): void {
    this.removeEventListeners();
    super.dispose();
  }

  /**
   * Initializes the controller by setting up event listeners and subscribing to state changes.
   */
  private initialize(): void {
    this.setupEventListeners();
    this.subscribeToState(
      simulationManager.getSimulationState$(),
      this.handleStateChange
    );
  }

  /**
   * Sets up event listeners for N-Body specific controls.
   */
  private setupEventListeners(): void {
    this.elements.algorithmSelectElement.addEventListener(
      "change",
      this.handleAlgorithmChange
    );
    this.elements.integratorSelectElement.addEventListener(
      "change",
      this.handleIntegratorChange
    );
  }

  /**
   * Removes all event listeners.
   */
  private removeEventListeners(): void {
    this.elements.algorithmSelectElement.removeEventListener(
      "change",
      this.handleAlgorithmChange
    );
    this.elements.integratorSelectElement.removeEventListener(
      "change",
      this.handleIntegratorChange
    );
  }

  /**
   * Updates the N-Body specific UI based on current configuration.
   */
  public updateNBodyControls(): void {
    const state = simulationManager.getSimulationState();
    this.currentConfig = state.simulationConfig;

    // Update N-Body specific controls
    if (this.currentConfig.mode === "nbody") {
      this.elements.algorithmSelectElement.value =
        this.currentConfig.algorithm || "barnes-hut";
      this.elements.integratorSelectElement.value =
        this.currentConfig.integrator || "pefrl";
    }

    this.updateConfigurationDisplay();
    this.updatePerformanceIndicator();
  }

  /**
   * Shows or hides N-Body specific controls based on current mode.
   */
  public updateNBodyVisibility(): void {
    const isNBodyMode = this.currentConfig.mode === "nbody";

    if (isNBodyMode) {
      this.elements.nbodyControlsElement.classList.add("visible");
    } else {
      this.elements.nbodyControlsElement.classList.remove("visible");
    }
  }

  /**
   * Updates the configuration display with current settings.
   */
  private updateConfigurationDisplay(): void {
    
    const displayName = getConfigurationDisplayName(this.currentConfig);
    const shortName = getConfigurationShortName(this.currentConfig);

    this.elements.configDisplayElement.textContent = `${displayName} | Config: ${shortName}`;
  }

  /**
   * Updates the performance indicator based on current configuration.
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
   * Handles algorithm changes in N-Body mode.
   */
  private handleAlgorithmChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const algorithm = target.value as AlgorithmType;

    try {
      simulationManager.setNBodyAlgorithm(algorithm);
      this.parentController.clearValidationMessages();
    } catch (error) {
      console.error("Failed to set algorithm:", error);
      this.parentController.showValidationMessage(
        `Failed to change algorithm: ${error instanceof Error ? error.message : String(error)}`
      );

      // Revert selection
      target.value = this.currentConfig.algorithm || "barnes-hut";
    }
  };

  /**
   * Handles integrator changes in N-Body mode.
   */
  private handleIntegratorChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const integrator = target.value as IntegratorType;

    try {
      simulationManager.setNBodyIntegrator(integrator);
      this.parentController.clearValidationMessages();
    } catch (error) {
      console.error("Failed to set integrator:", error);
      this.parentController.showValidationMessage(
        `Failed to change integrator: ${error instanceof Error ? error.message : String(error)}`
      );

      // Revert selection
      target.value = this.currentConfig.integrator || "verlet";
    }
  };

  /**
   * Handles global simulation state changes.
   */
  private handleStateChange = (): void => {
    this.updateNBodyControls();
    this.updateNBodyVisibility();
  };
}
