import { simulationManager } from "@teskooano/app-simulation";
import { celestialObjects$ } from "@teskooano/core-state";
import { BehaviorSubject, Observable } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";

/**
 * Subject to track whether the main simulation loop has been initiated.
 * Defaults to false.
 */
const simulationLoopStartedSubject = new BehaviorSubject<boolean>(false);

/**
 * Observable stream for the simulation loop's started status.
 * Emits true once the loop has been started, false otherwise.
 */
export const simulationLoopStarted$: Observable<boolean> =
  simulationLoopStartedSubject.asObservable();

/**
 * Subscribes to the celestial objects store and automatically starts or stops
 * the simulation loop based on whether any objects exist.
 */
celestialObjects$
  .pipe(
    map((objects) => Object.keys(objects).length > 0),
    distinctUntilChanged(),
  )
  .subscribe((hasObjects) => {
    if (hasObjects) {
      ensureSimulationLoopStarted();
    } else {
      if (simulationManager.isLoopRunning) {
        simulationManager.stopLoop();
        simulationLoopStartedSubject.next(false);
        console.log(
          "[State] Main simulation loop stopped as no objects exist.",
        );
      }
    }
  });

/**
 * Ensures that the main simulation loop is started if it hasn't been already.
 * This also updates the `simulationLoopStarted$` observable.
 */
export function ensureSimulationLoopStarted(): void {
  if (!simulationManager.isLoopRunning) {
    try {
      simulationManager.startLoop();
      simulationLoopStartedSubject.next(true);
      console.log(
        "[State] Main simulation loop initiated by ensureSimulationLoopStarted via SimulationManager.",
      );
    } catch (error) {
      console.error(
        "[State] Failed to start simulation loop via SimulationManager:",
        error,
      );
      simulationLoopStartedSubject.next(false);
    }
  } else {
    if (!simulationLoopStartedSubject.getValue()) {
      simulationLoopStartedSubject.next(true);
    }
  }
}

/**
 * Utility to get the current status of the simulation loop.
 * @returns true if the loop has been started, false otherwise.
 */
export function getIsSimulationLoopStarted(): boolean {
  return simulationLoopStartedSubject.getValue();
}
