import {
  actions,
  StateAccessor,
  simulationState$,
  type SimulationState,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import type { TeskooanoButton } from "../../../../../core/components/button/Button";
import { PauseIcon, PlayIcon } from "../view/simulation-controls.template";
import {
  formatScale,
  formatTime,
  formatSimulationDate,
  getEngineShortName,
  getConfigurationShortName,
  getConfigurationDisplayName,
} from "./simulation-controls.utils";
import { EditableDateInput } from "./editable-date-input";
import { KeplerDateCalculator } from "./kepler-date-calculator";
import {
  simulationStateService,
  physicsSystemAdapter,
  celestialManager,
  PhysicsStateProvider,
} from "@teskooano/core-state";

/**
 * Defines the structure for an object holding references to the UI elements
 * that the controller will interact with.
 */
export interface SimulationUIElements {
  playPauseButton: TeskooanoButton | null;
  speedUpButton: TeskooanoButton | null;
  speedDownButton: TeskooanoButton | null;
  reverseButton: TeskooanoButton | null;
  scaleValueDisplay: HTMLElement | null;
  scaleSelect: HTMLSelectElement | null;
  timeValueDisplay: HTMLElement | null;
  engineValueDisplay: HTMLElement | null;
}

/**
 * Controller for the SimulationControls component.
 *
 * This class embodies the "Controller" in an MVC-like pattern. It is
 * responsible for all business logic, including:
 * - Handling user interactions from the view (e.g., button clicks).
 * - Updating the view's DOM elements in response to state changes.
 * - Managing component-level state and logic (e.g., speed constants).
 * - Setting up and tearing down all event listeners.
 */
export class SimulationControlsController extends StateSubscriptionMixin {
  private uiElements: SimulationUIElements;
  private simulationStartDate: Date = new Date(); // Start from current time
  private editableDateInput: EditableDateInput | null = null;
  private readonly speedValues = [
    0.0625, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24,
    32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 2048, 4096, 8192, 16384,
    32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608,
    10000000,
  ];

  /**
   * Constructs the controller.
   * @param {HTMLElement} view - The view instance this controller will manage.
   * @param {SimulationUIElements} uiElements - The collection of UI elements from the view.
   */
  constructor(uiElements: SimulationUIElements) {
    super();
    this.uiElements = uiElements;
  }

  /**
   * Initializes the controller by attaching all necessary event handlers and subscribing to state.
   */
  public init(): void {
    this.addEventListeners();
    // Reset start date to current time when initializing
    this.resetStartDate();
    // Initialize display with current state
    this.handleStateUpdate(StateAccessor.getCurrentSimulationState());

    // Initialize editable date input
    this.initializeEditableDateInput();

    // ✅ Using StateSubscriptionMixin for clean subscription management
    this.subscribeToState(simulationState$, (state: SimulationState) => {
      this.handleStateUpdate(state);
    });
  }

  /**
   * Resets the simulation start date to the current time.
   * This should be called when a new simulation begins.
   */
  public resetStartDate(): void {
    this.simulationStartDate = new Date();
  }

  /**
   * Sets a custom start date for the simulation.
   * @param {Date} startDate - The custom start date
   */
  public setStartDate(startDate: Date): void {
    this.simulationStartDate = new Date(startDate);
  }

  /**
   * Gets the current simulation date.
   * @returns {Date} The current simulation date
   */
  public getCurrentDate(): Date {
    return new Date(this.simulationStartDate);
  }

  /**
   * Initializes the editable date input component.
   */
  private initializeEditableDateInput(): void {
    if (!this.uiElements.timeValueDisplay) return;

    // Clear the existing content
    this.uiElements.timeValueDisplay.textContent = "";

    // Create the editable date input
    this.editableDateInput = new EditableDateInput(
      this.uiElements.timeValueDisplay,
      {
        initialDate: this.simulationStartDate,
        onDateChange: (newDate: Date) => this.handleDateChange(newDate),
        compact: this.uiElements.timeValueDisplay.closest("[mobile]") !== null,
      },
    );
  }

  /**
   * Handles date changes from the editable input.
   * Calculates celestial positions for the new date using Kepler's laws.
   */
  private handleDateChange(newDate: Date): void {
    console.log(`Calculating positions for date: ${newDate.toISOString()}`);

    try {
      // Update the simulation start date to the new date
      this.simulationStartDate = new Date(newDate);

      // Get current celestial objects and orbital parameters
      const celestialObjects = StateAccessor.getCurrentCelestialObjects();
      const orbitalParameters =
        physicsSystemAdapter.getOrbitalParametersSnapshot();

      console.log(
        `Found ${Object.keys(celestialObjects).length} celestial objects`,
      );
      console.log(`Found ${orbitalParameters.size} orbital parameters`);

      // Calculate positions for the new date
      const calculationResponse =
        KeplerDateCalculator.calculatePositionsForDate(
          newDate,
          celestialObjects,
          orbitalParameters,
        );

      console.log(
        `Calculated positions for ${calculationResponse.results.length} objects`,
      );
      console.log(
        `Objects to remove: ${calculationResponse.objectsToRemove.length}`,
      );

      // Remove objects that shouldn't exist at this date
      calculationResponse.objectsToRemove.forEach((objectId) => {
        console.log(`Removing object ${objectId} from simulation`);
        celestialManager.removeObject(objectId);
      });

      // Apply the calculated positions to the simulation state
      calculationResponse.results.forEach((result) => {
        const object = celestialObjects[result.objectId];
        if (object) {
          // Create the new physics state
          const newPhysicsState = {
            id: result.objectId,
            mass_kg: object.realMass_kg,
            position_m: result.position,
            velocity_mps: result.velocity,
          };

          // Update the physics state cache directly
          PhysicsStateProvider.updateCacheWithSimulationResult(
            result.objectId,
            newPhysicsState,
          );
        }
      });

      // Reset the simulation time to 0 since we're starting from the new date
      const currentState = StateAccessor.getCurrentSimulationState();
      simulationStateService.setSimulationState({
        ...currentState,
        time: 0,
      });

      // Clear orbit trails and prediction lines to prevent drawing incorrect paths
      // This ensures a clean visual state when jumping to a new date
      document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
      document.dispatchEvent(new CustomEvent("teskooano-clear-predictions"));

      console.log(
        `Updated ${calculationResponse.results.length} objects with new positions for date: ${newDate.toISOString()}`,
      );
    } catch (error) {
      console.error("Failed to calculate positions for date:", error);
    }
  }

  /**
   * Cleans up the controller by removing all event listeners and unsubscribing.
   */
  public dispose(): void {
    this.removeEventListeners();

    // Clean up editable date input
    if (this.editableDateInput) {
      this.editableDateInput.destroy();
      this.editableDateInput = null;
    }

    // ✅ Using StateSubscriptionMixin for automatic subscription cleanup
    super.dispose();
  }

  /**
   * The main state update handler.
   * It calls specific UI update methods to reflect the current state.
   * @param {SimulationState} state - The new simulation state from the store.
   */
  public handleStateUpdate(state: SimulationState): void {
    this._updateTimeDisplay(state.time);
    this._updatePlayPauseButton(state.paused);
    this._updateScaleDisplay(state.timeScale);
    this._updateReverseButton(state.timeScale);
    this._updateSpeedButtons(state.paused, state.timeScale);
    this._updateEngineDisplay(state.simulationConfig);
  }

  private addEventListeners(): void {
    this.uiElements.playPauseButton?.addEventListener(
      "click",
      this.playPauseHandler,
    );
    this.uiElements.speedUpButton?.addEventListener(
      "click",
      this.speedUpHandler,
    );
    this.uiElements.speedDownButton?.addEventListener(
      "click",
      this.speedDownHandler,
    );
    this.uiElements.reverseButton?.addEventListener(
      "click",
      this.reverseHandler,
    );
    this.uiElements.scaleValueDisplay?.addEventListener(
      "click",
      this.showScaleSelect,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "change",
      this.handleScaleSelectChange,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "blur",
      this.handleScaleSelectBlur,
    );
    this.uiElements.scaleSelect?.addEventListener(
      "keydown",
      this.handleScaleSelectKeydown,
    );
  }

  private removeEventListeners(): void {
    this.uiElements.playPauseButton?.removeEventListener(
      "click",
      this.playPauseHandler,
    );
    this.uiElements.speedUpButton?.removeEventListener(
      "click",
      this.speedUpHandler,
    );
    this.uiElements.speedDownButton?.removeEventListener(
      "click",
      this.speedDownHandler,
    );
    this.uiElements.reverseButton?.removeEventListener(
      "click",
      this.reverseHandler,
    );
    this.uiElements.scaleValueDisplay?.removeEventListener(
      "click",
      this.showScaleSelect,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "change",
      this.handleScaleSelectChange,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "blur",
      this.handleScaleSelectBlur,
    );
    this.uiElements.scaleSelect?.removeEventListener(
      "keydown",
      this.handleScaleSelectKeydown,
    );
  }

  // Event Handlers (bound to the class instance)
  private playPauseHandler = () => actions.togglePause();
  private speedUpHandler = () => {
    const currentScale = StateAccessor.getCurrentSimulationState().timeScale;
    if (currentScale === 0) {
      actions.setTimeScale(1);
      return;
    }
    const absScale = Math.abs(currentScale);
    const sign = Math.sign(currentScale);
    const nextSpeed =
      this.speedValues.find((v) => v > absScale) ||
      this.speedValues[this.speedValues.length - 1];
    actions.setTimeScale(nextSpeed * sign);
  };
  private speedDownHandler = () => {
    const currentScale = StateAccessor.getCurrentSimulationState().timeScale;
    if (currentScale === 0) {
      actions.setTimeScale(-1);
      return;
    }
    const absScale = Math.abs(currentScale);
    const sign = Math.sign(currentScale);
    const prevSpeed =
      [...this.speedValues].reverse().find((v) => v < absScale) ||
      this.speedValues[0];
    actions.setTimeScale(prevSpeed * sign);
  };
  private reverseHandler = () => {
    const currentScale = StateAccessor.getCurrentSimulationState().timeScale;
    actions.setTimeScale(currentScale === 0 ? -1 : -currentScale);
  };

  private showScaleSelect = () => {
    const { scaleValueDisplay, scaleSelect } = this.uiElements;
    if (!scaleValueDisplay || !scaleSelect) return;

    scaleValueDisplay.style.display = "none";
    scaleSelect.style.display = "inline-block";
    scaleSelect.innerHTML = "";

    let currentScale = StateAccessor.getCurrentSimulationState().timeScale;
    currentScale =
      currentScale < 0
        ? Math.abs(currentScale)
        : currentScale === 0
          ? 1
          : currentScale;

    this.speedValues.forEach((val) => {
      const option = document.createElement("option");
      option.value = val.toString();
      option.textContent = formatScale(val);
      scaleSelect.appendChild(option);
      if (val === currentScale) {
        option.selected = true;
      }
    });

    scaleSelect.focus();
  };

  private hideScaleSelectAndApply = (applyChange: boolean) => {
    const { scaleValueDisplay, scaleSelect } = this.uiElements;
    if (!scaleValueDisplay || !scaleSelect) return;

    if (applyChange) {
      const selectedValue = parseFloat(scaleSelect.value);
      if (!isNaN(selectedValue)) {
        const currentSimState = StateAccessor.getCurrentSimulationState();
        const newScale =
          currentSimState.timeScale < 0 ? -selectedValue : selectedValue;
        actions.setTimeScale(newScale);
      }
    }
    scaleSelect.style.display = "none";
    scaleValueDisplay.style.display = "";
  };

  private handleScaleSelectChange = () => this.hideScaleSelectAndApply(true);
  private handleScaleSelectBlur = () => {
    // Use setTimeout to allow a potential 'change' event to fire first
    setTimeout(() => {
      if (document.activeElement !== this.uiElements.scaleSelect) {
        this.hideScaleSelectAndApply(false);
      }
    }, 100);
  };

  private handleScaleSelectKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      this.hideScaleSelectAndApply(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.hideScaleSelectAndApply(false);
    }
  };

  // UI Updaters
  private _updateTimeDisplay = (timeSeconds: number = 0): void => {
    if (this.editableDateInput) {
      // Update the editable date input with the new time
      const currentDate = new Date(
        this.simulationStartDate.getTime() + timeSeconds * 1000,
      );
      this.editableDateInput.setDate(currentDate);
    }
  };

  private _updatePlayPauseButton = (isPaused: boolean): void => {
    const button = this.uiElements.playPauseButton;
    if (button) {
      const stateText = isPaused ? "Play" : "Pause";
      const tooltipText = `${stateText} Simulation`;
      const iconSvg = isPaused ? PlayIcon : PauseIcon;

      const iconSpan = button.querySelector('[slot="icon"]');
      if (iconSpan) {
        iconSpan.innerHTML = iconSvg;
      } else {
        button.innerHTML = `<span slot="icon">${iconSvg}</span>`;
      }

      button.title = tooltipText;
      // Note: Assuming teskooano-button has a method to refresh its tooltip content if needed.
      // button.refreshTooltipContent();
      button.toggleAttribute("active", !isPaused);
    }
  };

  private _updateScaleDisplay = (timeScale: number): void => {
    const element = this.uiElements.scaleValueDisplay;
    if (element) {
      element.textContent = formatScale(timeScale);
      element.style.color =
        timeScale < 0
          ? "var(--color-warning-emphasis)"
          : "var(--color-text-secondary)";
    }
  };

  private _updateReverseButton = (timeScale: number): void => {
    const button = this.uiElements.reverseButton;
    if (button) {
      button.toggleAttribute("active", timeScale < 0);
    }
  };

  private _updateSpeedButtons = (
    isPaused: boolean,
    timeScale: number,
  ): void => {
    const { speedDownButton, speedUpButton } = this.uiElements;
    if (speedDownButton) {
      speedDownButton.disabled =
        isPaused ||
        (Math.abs(timeScale) <= this.speedValues[0] && timeScale !== 0);
    }
    if (speedUpButton) {
      speedUpButton.disabled =
        isPaused ||
        Math.abs(timeScale) >= this.speedValues[this.speedValues.length - 1];
    }
  };

  private _updateEngineDisplay = (config: any): void => {
    const element = this.uiElements.engineValueDisplay;
    if (element) {
      const shortName = getConfigurationShortName(config);
      const fullName = getConfigurationDisplayName(config);
      element.textContent = shortName;
      element.setAttribute("data-full-name", fullName);
    }
  };
}
