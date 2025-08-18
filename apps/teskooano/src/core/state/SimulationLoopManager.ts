import { simulationOrchestrator } from "@teskooano/app-simulation";
import { StateAccessor } from "@teskooano/core-state";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";

/**
 * Manages the simulation loop state and automatically starts/stops
 * the simulation based on whether celestial objects exist.
 */
export class SimulationLoopManager {
  private simulationLoopStartedSubject = new BehaviorSubject<boolean>(false);
  private subscription?: Subscription;

  /**
   * Observable stream for the simulation loop's started status.
   * Emits true once the loop has been started, false otherwise.
   */
  readonly simulationLoopStarted$: Observable<boolean> =
    this.simulationLoopStartedSubject.asObservable();

  constructor() {
    this.initialize();
  }

  /**
   * Initializes the simulation loop manager by subscribing to celestial objects
   * and automatically managing the simulation state.
   */
  private initialize(): void {
    this.subscription = StateAccessor.getCelestialObjectsStream()
      .pipe(
        map((objects) => Object.keys(objects).length > 0),
        distinctUntilChanged(),
      )
      .subscribe(async (hasObjects: boolean) => {
        if (hasObjects) {
          await this.ensureSimulationLoopStarted();
        } else {
          if (simulationOrchestrator.isLoopRunning) {
            simulationOrchestrator.stopLoop();
            this.simulationLoopStartedSubject.next(false);
            console.log(
              "[SimulationLoopManager] Simulation state stopped as no objects exist.",
            );
          }
        }
      });
  }

  /**
   * Ensures that the simulation state is started if it hasn't been already.
   * This also updates the `simulationLoopStarted$` observable.
   */
  private async ensureSimulationLoopStarted(): Promise<void> {
    if (!simulationOrchestrator.isLoopRunning) {
      try {
        await simulationOrchestrator.startLoop();
        this.simulationLoopStartedSubject.next(true);
        console.log(
          "[SimulationLoopManager] Simulation state initiated by ensureSimulationLoopStarted via SimulationManager.",
        );
      } catch (error) {
        console.error(
          "[SimulationLoopManager] Failed to start simulation state via SimulationManager:",
          error,
        );
        this.simulationLoopStartedSubject.next(false);
      }
    } else {
      if (!this.simulationLoopStartedSubject.getValue()) {
        this.simulationLoopStartedSubject.next(true);
      }
    }
  }

  /**
   * Utility to get the current status of the simulation loop.
   * @returns true if the loop has been started, false otherwise.
   */
  getIsSimulationLoopStarted(): boolean {
    return this.simulationLoopStartedSubject.getValue();
  }

  /**
   * Manually starts the simulation loop.
   */
  async startSimulation(): Promise<void> {
    if (!simulationOrchestrator.isLoopRunning) {
      await simulationOrchestrator.startLoop();
      this.simulationLoopStartedSubject.next(true);
    }
  }

  /**
   * Manually stops the simulation loop.
   */
  stopSimulation(): void {
    if (simulationOrchestrator.isLoopRunning) {
      simulationOrchestrator.stopLoop();
      this.simulationLoopStartedSubject.next(false);
    }
  }

  /**
   * Disposes of the manager and cleans up subscriptions.
   */
  dispose(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
    this.simulationLoopStartedSubject.complete();
  }
}
