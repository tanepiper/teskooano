import {
  StateAccessor,
  actions,
  simulationStateService,
} from "@teskooano/core-state";
import { EditableDateInput } from "./editable-date-input";
import { TimeStepCalculator } from "./time-step-calculator";
import { SimulationMode } from "@teskooano/data-types";
import {
  Subject,
  timer,
  takeUntil,
  switchMap,
  tap,
  finalize,
  EMPTY,
  of,
} from "rxjs";

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

  // RxJS subjects for managing date change flow
  private destroy$ = new Subject<void>();
  private dateJumpCancel$ = new Subject<void>();

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
    this.destroy$.next();
    this.destroy$.complete();
    this.dateJumpCancel$.complete();

    if (this.editableDateInput) {
      this.editableDateInput.destroy();
      this.editableDateInput = null;
    }
  }

  /**
   * Handles date changes from the editable input using RxJS flow.
   * Fixes the date calculation to properly handle target dates.
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

    // Cancel any ongoing date jump
    this.dateJumpCancel$.next();

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

      // Calculate target time in seconds from original start date
      const targetTimeSeconds =
        (newDate.getTime() - this.simulationStartDate.getTime()) / 1000;
      const currentTimeSeconds = currentTime;
      const timeDifference = targetTimeSeconds - currentTimeSeconds;

      // If we're already at the target time, no need to jump
      if (Math.abs(timeDifference) < 1) {
        console.log(
          `[TimeDisplayManager] Already at target date, no jump needed`,
        );
        return;
      }

      // Get optimal step size for the time jump
      const stepSize = TimeStepCalculator.getOptimalStepSize(
        Math.abs(timeDifference),
      );

      const stepCalculation = TimeStepCalculator.calculateTimeSteps(
        this.simulationStartDate,
        currentTimeSeconds,
        newDate,
        stepSize,
      );

      console.log(
        `[TimeDisplayManager] Time step calculation:`,
        stepCalculation,
      );

      // Start the RxJS-based date jump flow
      this.performDateJump(targetTimeSeconds, timeDifference, stepCalculation)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(
              `[TimeDisplayManager] Date jump completed to: ${newDate.toISOString()}`,
            );
            this.config.onDateChange?.(newDate);
          },
          error: (error) => {
            console.error("[TimeDisplayManager] Date jump failed:", error);
            alert("Failed to change date. Please try again.");
          },
        });
    } catch (error) {
      console.error(
        "[TimeDisplayManager] Failed to process date change:",
        error,
      );
      alert("Failed to change date. Please try again.");
    }
  };

  /**
   * Performs the date jump using RxJS flow to avoid race conditions
   */
  private performDateJump(
    targetTimeSeconds: number,
    timeDifference: number,
    stepCalculation: any,
  ) {
    // Store original simulation state
    const simulationState = StateAccessor.getCurrentSimulationState();
    const originalMode = simulationState.simulationConfig?.mode;
    const needsModeSwitch =
      originalMode && originalMode !== SimulationMode.IDEAL;

    console.log(`[TimeDisplayManager] Starting date jump flow`);

    return of(null).pipe(
      // Step 1: Switch to ideal mode if needed
      tap(() => {
        if (needsModeSwitch) {
          console.log(
            `[TimeDisplayManager] Temporarily switching from ${originalMode} to IDEAL mode for time jump`,
          );
          simulationStateService.setSimulationMode(SimulationMode.IDEAL);
        }
      }),

      // Step 2: Calculate and set time scale for the jump
      tap(() => {
        const jumpDurationSeconds = 2; // Complete the jump in 2 seconds
        const requiredTimeScale =
          Math.abs(timeDifference) / jumpDurationSeconds;

        // Apply direction to the time scale
        const timeScale =
          timeDifference >= 0 ? requiredTimeScale : -requiredTimeScale;

        console.log(
          `[TimeDisplayManager] Setting time scale to ${timeScale} for ${stepCalculation.direction} time jump (${Math.abs(timeDifference)}s in ${jumpDurationSeconds}s)`,
        );

        actions.setTimeScale(timeScale);

        // Clear visualizations to prevent showing incorrect paths
        document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
        document.dispatchEvent(new CustomEvent("teskooano-clear-predictions"));
      }),

      // Step 3: Wait for the jump duration or monitor progress
      switchMap(() => {
        const jumpDurationMs = 2000;

        return timer(jumpDurationMs).pipe(
          takeUntil(this.dateJumpCancel$),
          tap(() => {
            console.log(`[TimeDisplayManager] Jump duration completed`);
          }),
        );
      }),

      // Step 4: Cleanup - reset time scale and restore mode
      finalize(() => {
        console.log(
          `[TimeDisplayManager] Finalizing date jump - resetting time scale and mode`,
        );

        actions.setTimeScale(1); // Reset to normal speed

        if (needsModeSwitch && originalMode) {
          console.log(
            `[TimeDisplayManager] Restoring original simulation mode: ${originalMode}`,
          );
          simulationStateService.setSimulationMode(originalMode);
        }
      }),
    );
  }

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
      // Fix: Calculate current date properly from start date + elapsed time
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
