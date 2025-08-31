import {
  actions,
  PhysicsStateProvider,
  simulationManager,
  StateAccessor,
} from "@teskooano/core-state";
import { SimulationMode } from "@teskooano/data-types";
import { finalize, of, Subject, switchMap, takeUntil, tap, timer } from "rxjs";
import { EditableDateInput } from "./editable-date-input";
import { SimpleDateCalculator } from "./simple-date-calculator";

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
    const currentDate = new Date();
    actions.setStartDate(currentDate);
    if (this.editableDateInput) {
      this.editableDateInput.setDate(currentDate);
    }
  }

  /**
   * Sets a custom start date for the simulation
   */
  public setStartDate(startDate: Date): void {
    actions.setStartDate(startDate);
    if (this.editableDateInput) {
      this.editableDateInput.setDate(startDate);
    }
  }

  /**
   * Gets the current simulation start date
   */
  public getCurrentDate(): Date {
    const state = StateAccessor.getSimulationState();
    return new Date(state.startDate);
  }

  /**
   * Jumps directly to a target date and recalculates all planetary positions
   */
  private calculatePlanetaryPositionsForDate(targetDate: Date): void {
    // Pause simulation to prevent any interference
    const currentState = StateAccessor.getSimulationState();
    const wasPaused = currentState.paused;
    if (!wasPaused) {
      actions.togglePause();
    }

    // Get all current celestial objects
    const celestialObjects = StateAccessor.getCelestialObjects();

    // Use the simplified calculator to get new positions
    const calculationResult = SimpleDateCalculator.calculatePositionsForDate(
      targetDate,
      celestialObjects,
    );

    // Update all objects with their new positions and orbital elements
    calculationResult.results.forEach((result) => {
      const object = celestialObjects[result.objectId];
      if (object) {
        const updatedObject = {
          ...object,
          orbit: result.updatedOrbitalElements,
        };

        // Update the object in the state
        actions.updateCelestialObject(object.id, updatedObject);

        // Clear the physics state cache to force recalculation with new orbital elements

        // Clear the physics state cache to force recalculation
        PhysicsStateProvider.clearCache();
      }
    });

    // Remove objects that shouldn't exist at the target date
    calculationResult.objectsToRemove.forEach((objectId) => {
      actions.removeCelestialObject(objectId);
    });

    // Set simulation baseline to target date with time=0
    actions.resetToStartDate(targetDate);

    // Resume if it wasn't originally paused
    if (!wasPaused) {
      actions.togglePause();
    }
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
      return;
    }

    this.lastDateChangeTime = now;

    // Cancel any ongoing date jump
    this.dateJumpCancel$.next();

    try {
      const currentState = StateAccessor.getSimulationState();
      const currentTime = currentState.time;

      // Validate the date change
      const validation = SimpleDateCalculator.validateDateChange(
        StateAccessor.getSimulationState().startDate,
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
        (newDate.getTime() -
          StateAccessor.getSimulationState().startDate.getTime()) /
        1000;
      const currentTimeSeconds = currentTime;
      const timeDifference = targetTimeSeconds - currentTimeSeconds;

      // If we're already at the target time, no need to jump
      if (Math.abs(timeDifference) < 1) {
        return;
      }

      // For large time jumps (>1 hour), calculate positions directly without animation
      if (Math.abs(timeDifference) > 3600) {
        this.calculatePlanetaryPositionsForDate(newDate);
        this.config.onDateChange?.(newDate);
        return;
      }

      // For large time jumps (>1 hour), calculate positions directly without animation
      if (Math.abs(timeDifference) > 3600) {
        this.calculatePlanetaryPositionsForDate(newDate);
        this.config.onDateChange?.(newDate);
        return;
      }

      // Start the RxJS-based date jump flow
      this.performDateJump(newDate, timeDifference)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
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
  private performDateJump(targetDate: Date, timeDifference: number) {
    // Store original simulation state
    const simulationState = StateAccessor.getSimulationState();
    const originalMode = simulationState.simulationConfig?.mode;
    const needsModeSwitch =
      originalMode && originalMode !== SimulationMode.IDEAL;

    return of(null).pipe(
      // Step 1: Switch to ideal mode if needed
      tap(() => {
        if (needsModeSwitch) {
          simulationManager.setSimulationMode(SimulationMode.IDEAL);
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

        actions.setTimeScale(timeScale);

        document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
        document.dispatchEvent(new CustomEvent("teskooano-clear-predictions"));
        document.dispatchEvent(
          new CustomEvent("teskooano-clear-position-history"),
        );
      }),

      // Step 3: Wait for the jump duration or monitor progress
      switchMap(() => {
        const jumpDurationMs = 2000;

        return timer(jumpDurationMs).pipe(takeUntil(this.dateJumpCancel$));
      }),

      // Step 4: Update simulation base state with proper timing
      switchMap(() => {
        // Use atomic resetToStartDate to eliminate race conditions
        actions.resetToStartDate(targetDate);

        // Clear all orbital visualizations after state reset for clean new timeline

        document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
        document.dispatchEvent(new CustomEvent("teskooano-clear-predictions"));
        document.dispatchEvent(
          new CustomEvent("teskooano-clear-position-history"),
        );

        // Restore original simulation mode if we switched it
        if (needsModeSwitch && originalMode) {
          simulationManager.setSimulationMode(originalMode);
        }

        // Short delay to ensure state propagates before completing
        return timer(100);
      }),

      // Final cleanup
      finalize(() => {}),
    );
  }

  private hasActiveSimulation(): boolean {
    const celestialObjects = StateAccessor.getCelestialObjects();
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
      // Calculate current date from state start date + elapsed time
      const state = StateAccessor.getSimulationState();
      const currentDate = new Date(
        state.startDate.getTime() + timeSeconds * 1000,
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
      initialDate: StateAccessor.getSimulationState().startDate,
      onDateChange: this.handleDateChange,
      compact: this.config.compact || false,
    });
  }
}
