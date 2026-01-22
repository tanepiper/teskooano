import {
  simulationManager,
  StateSubscriptionMixin,
} from "@teskooano/core-state";

/**
 * Defines the structure for the Keplerian specific UI elements.
 */
export interface IKeplerianSettingsElements {
  keplerianControlsElement: HTMLDivElement;
  orbitModeSelectElement: HTMLSelectElement;
}

/**
 * Controller for Keplerian specific settings (Full vs Trail orbit visualization).
 * Handles the conditional display and management of Keplerian orbit mode.
 */
export class KeplerianSettingsController extends StateSubscriptionMixin {
  private currentMode: "full" | "trail";

  constructor(
    private elements: IKeplerianSettingsElements,
    private parentController: {
      showValidationMessage: (
        message: string,
        type?: "error" | "warning",
      ) => void;
      clearValidationMessages: () => void;
    },
  ) {
    super();
    this.currentMode =
      simulationManager.getSimulationState().visualSettings.keplerOrbitMode ||
      "full";
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
      this.handleStateChange,
    );
  }

  /**
   * Sets up event listeners for Keplerian specific controls.
   */
  private setupEventListeners(): void {
    this.elements.orbitModeSelectElement.addEventListener(
      "change",
      this.handleModeChange,
    );
  }

  /**
   * Removes all event listeners.
   */
  private removeEventListeners(): void {
    this.elements.orbitModeSelectElement.removeEventListener(
      "change",
      this.handleModeChange,
    );
  }

  /**
   * Updates the Keplerian specific UI based on current settings.
   */
  public updateKeplerianControls(): void {
    const state = simulationManager.getSimulationState();
    this.currentMode = state.visualSettings.keplerOrbitMode || "full";

    // Update select value
    this.elements.orbitModeSelectElement.value = this.currentMode;
  }

  /**
   * Shows or hides Keplerian specific controls based on current simulation mode.
   */
  public updateKeplerianVisibility(): void {
    const state = simulationManager.getSimulationState();
    const isIdealMode = state.simulationConfig.mode === "ideal";

    if (isIdealMode) {
      this.elements.keplerianControlsElement.classList.add("visible");
    } else {
      this.elements.keplerianControlsElement.classList.remove("visible");
    }
  }

  /**
   * Handles orbit mode changes.
   */
  private handleModeChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const mode = target.value as "full" | "trail";

    try {
      simulationManager.setKeplerOrbitMode(mode);
      this.parentController.clearValidationMessages();
    } catch (error) {
      console.error("Failed to set Kepler orbit mode:", error);
      this.parentController.showValidationMessage(
        `Failed to change orbit mode: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Revert selection
      target.value = this.currentMode;
    }
  };

  /**
   * Handles global simulation state changes.
   */
  private handleStateChange = (): void => {
    this.updateKeplerianControls();
    this.updateKeplerianVisibility();
  };
}
