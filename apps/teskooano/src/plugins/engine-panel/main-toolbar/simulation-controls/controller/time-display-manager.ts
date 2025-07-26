import { StateAccessor, actions } from "@teskooano/core-state";
import { EditableDateInput } from "./editable-date-input";
import { TimeStepCalculator } from "./time-step-calculator";

export interface TimeDisplayConfig {
  element: HTMLElement;
  compact?: boolean;
  onDateChange?: (newDate: Date) => void;
}

/**
 * Manages the time display for the simulation controls.
 * Handles switching between "No Simulation Loaded" and editable date input.
 */
export class TimeDisplayManager {
  private element: HTMLElement;
  private editableDateInput: EditableDateInput | null = null;
  private simulationStartDate: Date = new Date();
  private config: TimeDisplayConfig;
  private lastDateChangeTime: number = 0;
  private readonly dateChangeDebounceMs: number = 1000; // 1 second debounce

  constructor(config: TimeDisplayConfig) {
    this.config = config;
    this.element = config.element;
    this.resetStartDate();
  }

  /**
   * Updates the time display based on simulation state
   */
  public updateDisplay(timeSeconds: number = 0): void {
    if (!this.element) return;

    const hasSimulation = this.hasActiveSimulation();

    if (!hasSimulation) {
      this.showNoSimulationState();
      return;
    }

    this.showSimulationState(timeSeconds);
  }

  /**
   * Resets the simulation start date to the current time
   */
  public resetStartDate(): void {
    this.simulationStartDate = new Date();
    if (this.editableDateInput) {
      this.editableDateInput.setDate(this.simulationStartDate);
    }
  }

  /**
   * Sets a custom start date for the simulation
   */
  public setStartDate(startDate: Date): void {
    this.simulationStartDate = new Date(startDate);
    if (this.editableDateInput) {
      this.editableDateInput.setDate(this.simulationStartDate);
    }
  }

  /**
   * Gets the current simulation date
   */
  public getCurrentDate(): Date {
    return new Date(this.simulationStartDate);
  }

  /**
   * Cleans up resources
   */
  public dispose(): void {
    if (this.editableDateInput) {
      this.editableDateInput.destroy();
      this.editableDateInput = null;
    }
  }

  /**
   * Handles date changes from the editable input.
   * Uses time stepping approach rather than complex orbital calculations.
   */
  private handleDateChange = (newDate: Date): void => {
    const now = Date.now();

    // Debounce: ignore rapid successive calls
    if (now - this.lastDateChangeTime < this.dateChangeDebounceMs) {
      console.log(
        `[TimeDisplayManager] Ignoring duplicate date change (debounced)`,
      );
      return;
    }

    this.lastDateChangeTime = now;

    console.log(
      `[TimeDisplayManager] Date change requested: ${newDate.toISOString()}`,
    );

    try {
      const currentState = StateAccessor.getCurrentSimulationState();
      const currentTime = currentState.time;

      // Validate the date change
      const validation = TimeStepCalculator.validateDateChange(
        this.simulationStartDate,
        newDate,
      );

      if (!validation.isValid) {
        console.warn(
          `[TimeDisplayManager] Invalid date change: ${validation.reason}`,
        );
        alert(`Cannot change date: ${validation.reason}`);
        return;
      }

      // Calculate time steps needed
      const timeDifference =
        newDate.getTime() - this.simulationStartDate.getTime();
      const timeDifferenceSeconds = timeDifference / 1000;

      // Get optimal step size for the time jump
      const stepSize = TimeStepCalculator.getOptimalStepSize(
        timeDifferenceSeconds,
      );

      const stepCalculation = TimeStepCalculator.calculateTimeSteps(
        this.simulationStartDate,
        currentTime,
        newDate,
        stepSize,
      );

      console.log(
        `[TimeDisplayManager] Time step calculation:`,
        stepCalculation,
      );

      // Update the simulation start date and reset simulation time
      this.simulationStartDate = new Date(newDate);

      // Reset simulation time to 0 since we're jumping to a new date
      actions.resetTime();

      // Calculate the time scale needed to complete the jump in a reasonable time
      const jumpDurationSeconds = 2; // Complete the jump in 2 seconds
      const requiredTimeScale =
        Math.abs(stepCalculation.totalTimeSeconds) / jumpDurationSeconds;

      // Apply direction to the time scale
      const timeScale =
        stepCalculation.direction === "forward"
          ? requiredTimeScale
          : -requiredTimeScale;

      console.log(
        `[TimeDisplayManager] Setting time scale to ${timeScale} for ${stepCalculation.direction} time jump (${stepCalculation.totalTimeSeconds}s in ${jumpDurationSeconds}s)`,
      );

      // Set the calculated time scale to perform the jump
      actions.setTimeScale(timeScale);

      // After the jump duration, reset to normal speed
      setTimeout(() => {
        actions.setTimeScale(1); // Reset to normal speed
        console.log(
          `[TimeDisplayManager] Time jump completed, reset to normal speed`,
        );
      }, jumpDurationSeconds * 1000);

      // Clear visualizations to prevent showing incorrect paths
      document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
      document.dispatchEvent(new CustomEvent("teskooano-clear-predictions"));

      // Call external callback if provided
      this.config.onDateChange?.(newDate);

      console.log(
        `[TimeDisplayManager] Date jump completed to: ${newDate.toISOString()}`,
      );
    } catch (error) {
      console.error(
        "[TimeDisplayManager] Failed to process date change:",
        error,
      );
      alert("Failed to change date. Please try again.");
    }
  };

  private hasActiveSimulation(): boolean {
    const celestialObjects = StateAccessor.getCurrentCelestialObjects();
    return Object.keys(celestialObjects).length > 0;
  }

  private showNoSimulationState(): void {
    this.element.textContent = "🌑 No Simulation Loaded";
    this.element.style.cursor = "not-allowed";
    this.element.style.color = "var(--color-error)";
    this.element.title = "No simulation is currently loaded";

    if (this.editableDateInput) {
      this.editableDateInput.destroy();
      this.editableDateInput = null;
    }
  }

  private showSimulationState(timeSeconds: number): void {
    this.element.style.cursor = "pointer";
    this.element.style.color = "var(--color-text-primary)";

    if (!this.editableDateInput) {
      this.createEditableDateInput();
    }

    if (this.editableDateInput) {
      const currentDate = new Date(
        this.simulationStartDate.getTime() + timeSeconds * 1000,
      );
      this.editableDateInput.setDate(currentDate);
    }
  }

  private createEditableDateInput(): void {
    if (this.editableDateInput) {
      this.editableDateInput.destroy();
      this.editableDateInput = null;
    }

    this.element.textContent = "";

    this.editableDateInput = new EditableDateInput(this.element, {
      initialDate: this.simulationStartDate,
      onDateChange: this.handleDateChange,
      compact: this.config.compact || false,
    });
  }
}
