import {
  actions,
  PhysicsStateProvider,
  simulationStateService,
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
    console.log(
      `[TimeDisplayManager] 🔄 Setting new start date: ${startDate.toISOString()} (${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()})`,
    );

    actions.setStartDate(startDate);
    if (this.editableDateInput) {
      this.editableDateInput.setDate(startDate);
    }
  }

  /**
   * Gets the current simulation start date
   */
  public getCurrentDate(): Date {
    const state = StateAccessor.getCurrentSimulationState();
    return new Date(state.startDate);
  }

  /**
   * Jumps directly to a target date and recalculates all planetary positions
   */
  private calculatePlanetaryPositionsForDate(targetDate: Date): void {
    console.log(
      `[TimeDisplayManager] Jumping to ${targetDate.toISOString()} and recalculating positions`,
    );

    // Pause simulation to prevent any interference
    const currentState = StateAccessor.getCurrentSimulationState();
    const wasPaused = currentState.paused;
    if (!wasPaused) {
      actions.togglePause();
    }

    // Get all current celestial objects
    const celestialObjects = StateAccessor.getCurrentCelestialObjects();

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
        console.log(
          `[TimeDisplayManager] Updating physics state for ${object.id}:`,
          {
            newPosition: result.position.toArray(),
            newVelocity: result.velocity.toArray(),
          },
        );

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

    console.log(
      `[TimeDisplayManager] Position calculation and date jump complete`,
    );
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
      `[TimeDisplayManager] 🎯 Date change requested: ${newDate.toISOString()} (${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()})`,
    );

    // Cancel any ongoing date jump
    this.dateJumpCancel$.next();

    try {
      const currentState = StateAccessor.getCurrentSimulationState();
      const currentTime = currentState.time;

      // Validate the date change
      const validation = SimpleDateCalculator.validateDateChange(
        StateAccessor.getCurrentSimulationState().startDate,
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
          StateAccessor.getCurrentSimulationState().startDate.getTime()) /
        1000;
      const currentTimeSeconds = currentTime;
      const timeDifference = targetTimeSeconds - currentTimeSeconds;

      // If we're already at the target time, no need to jump
      if (Math.abs(timeDifference) < 1) {
        console.log(
          `[TimeDisplayManager] Already at target date, no jump needed`,
        );
        return;
      }

      // For large time jumps (>1 hour), calculate positions directly without animation
      if (Math.abs(timeDifference) > 3600) {
        console.log(
          `[TimeDisplayManager] Large time jump detected (${Math.abs(timeDifference)}s), calculating positions directly`,
        );

        this.calculatePlanetaryPositionsForDate(newDate);
        this.config.onDateChange?.(newDate);
        return;
      }

      // For large time jumps (>1 hour), calculate positions directly without animation
      if (Math.abs(timeDifference) > 3600) {
        console.log(
          `[TimeDisplayManager] Large time jump detected (${Math.abs(timeDifference)}s), calculating positions directly`,
        );

        this.calculatePlanetaryPositionsForDate(newDate);
        this.config.onDateChange?.(newDate);
        return;
      }

      // For smaller jumps, use the existing animation system
      console.log(
        `[TimeDisplayManager] Small time jump (${Math.abs(timeDifference)}s), using animation`,
      );

      // Start the RxJS-based date jump flow
      this.performDateJump(newDate, timeDifference)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(
              `[TimeDisplayManager] ✅ Date jump completed to: ${newDate.toISOString()} (${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()})`,
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
  private performDateJump(targetDate: Date, timeDifference: number) {
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
          `[TimeDisplayManager] Setting time scale to ${timeScale} for time jump (${Math.abs(timeDifference)}s in ${jumpDurationSeconds}s)`,
        );

        actions.setTimeScale(timeScale);

        // Clear visualizations to prevent showing incorrect paths during jump
        console.log(
          `[TimeDisplayManager] 🧹 Clearing orbit visualizations for date jump`,
        );
        document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
        document.dispatchEvent(new CustomEvent("teskooano-clear-predictions"));
        document.dispatchEvent(
          new CustomEvent("teskooano-clear-position-history"),
        );
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

      // Step 4: Update simulation base state with proper timing
      switchMap(() => {
        console.log(
          `[TimeDisplayManager] Finalizing date jump - updating base state and resetting`,
        );

        // Use the target date directly - no recalculation to avoid drift from animation
        console.log(
          `[TimeDisplayManager] Using target date directly: ${targetDate.toISOString()}`,
        );
        console.log(
          `[TimeDisplayManager] Original start date: ${StateAccessor.getCurrentSimulationState().startDate.toISOString()}`,
        );

        // Use atomic resetToStartDate to eliminate race conditions
        actions.resetToStartDate(targetDate);
        console.log(
          `[TimeDisplayManager] 🔄 Atomic reset to: ${targetDate.toISOString()}`,
        );

        // Clear all orbital visualizations after state reset for clean new timeline
        console.log(
          `[TimeDisplayManager] 🧹 Final cleanup - clearing all orbital visualizations`,
        );
        document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
        document.dispatchEvent(new CustomEvent("teskooano-clear-predictions"));
        document.dispatchEvent(
          new CustomEvent("teskooano-clear-position-history"),
        );

        // Restore original simulation mode if we switched it
        if (needsModeSwitch && originalMode) {
          console.log(
            `[TimeDisplayManager] Restoring original simulation mode: ${originalMode}`,
          );
          simulationStateService.setSimulationMode(originalMode);
        }

        console.log(`[TimeDisplayManager] ✅ Date jump completed`);

        // Short delay to ensure state propagates before completing
        return timer(100);
      }),

      // Final cleanup
      finalize(() => {
        console.log(`[TimeDisplayManager] Date jump operation completed`);
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
      // Calculate current date from state start date + elapsed time
      const state = StateAccessor.getCurrentSimulationState();
      const currentDate = new Date(
        state.startDate.getTime() + timeSeconds * 1000,
      );

      console.log(
        `[TimeDisplayManager] 📅 UI updating to display: ${currentDate.toISOString()} (${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}) | Elapsed: ${timeSeconds}s`,
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
      initialDate: StateAccessor.getCurrentSimulationState().startDate,
      onDateChange: this.handleDateChange,
      compact: this.config.compact || false,
    });
  }
}
