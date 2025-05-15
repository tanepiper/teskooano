import { startSimulationLoop } from "@teskooano/app-simulation";
import { BehaviorSubject } from "rxjs";

/**
 * Subject to track whether the main simulation loop has been initiated.
 * Defaults to false.
 */
const simulationLoopStartedSubject = new BehaviorSubject<boolean>(false);

/**
 * Observable stream for the simulation loop's started status.
 * Emits true once the loop has been started, false otherwise.
 */
export const simulationLoopStarted$ =
  simulationLoopStartedSubject.asObservable();

/**
 * Ensures that the main simulation loop is started, but only starts it once.
 * This function is idempotent after the first successful call.
 */
export function ensureSimulationLoopStarted(): void {
  if (!simulationLoopStartedSubject.getValue()) {
    try {
      startSimulationLoop();
      simulationLoopStartedSubject.next(true);
      console.debug("[SimulationLoopState] Main simulation loop initiated.");
    } catch (error) {
      console.error(
        "[SimulationLoopState] Failed to start simulation loop:",
        error,
      );
      // Optionally, you might want to keep the subject as false or handle error state
    }
  } else {
    // console.debug("[SimulationLoopState] Simulation loop already started."); // Optional: for verbose logging
  }
}

/**
 * Utility to get the current status of the simulation loop.
 * @returns true if the loop has been started, false otherwise.
 */
export function getIsSimulationLoopStarted(): boolean {
  return simulationLoopStartedSubject.getValue();
}
