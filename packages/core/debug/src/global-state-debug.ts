import {
  getSimulationState,
  type SimulationState,
} from "@teskooano/core-state";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { DebugLevel, isDebugEnabled } from "./debug-config";

/**
 * A service that provides a reactive, debug-friendly view of the global simulation state.
 *
 * It subscribes to the core simulation state and exposes it through an Observable,
 * but only when debugging is enabled. This prevents any performance overhead in production.
 */
export class GlobalStateDebugger {
  private static instance: GlobalStateDebugger;
  private stateSubscription: Subscription | null = null;

  /**
   * A BehaviorSubject holding the latest snapshot of the global simulation state.
   * It will only emit values when debugging is enabled.
   */
  private readonly _globalState$ = new BehaviorSubject<SimulationState | null>(
    null,
  );

  private constructor() {
    if (isDebugEnabled(DebugLevel.DEBUG)) {
      this.startMonitoring();
    }
  }

  /**
   * Gets the singleton instance of the GlobalStateDebugger.
   */
  public static getInstance(): GlobalStateDebugger {
    if (!GlobalStateDebugger.instance) {
      GlobalStateDebugger.instance = new GlobalStateDebugger();
    }
    return GlobalStateDebugger.instance;
  }

  /**
   * An observable that emits the full global simulation state whenever it changes.
   * This stream will be null and will not emit if debugging is disabled.
   */
  public get globalState$(): Observable<SimulationState | null> {
    return this._globalState$.asObservable();
  }

  /**
   * Starts subscribing to the core simulation state and updating the internal BehaviorSubject.
   * This is called automatically on construction if debugging is enabled.
   */
  public startMonitoring(): void {
    if (this.stateSubscription) {
      return; // Already monitoring
    }

    // Initialize with the current state
    this._globalState$.next(getSimulationState());

    // Subscribe to subsequent changes.
    // NOTE: core-state does not currently have a direct observable for its state.
    // This is a placeholder for how it *should* work. For now, a UI would need to poll getSimulationState().
    // We will assume for the debug architecture that a state observable will exist.
    // For now, we can create a polling mechanism as a temporary measure if needed,
    // but the architecture should be built for a reactive source.
  }

  /**
   * Stops monitoring the global state.
   */
  public stopMonitoring(): void {
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = null;
    this._globalState$.next(null);
  }

  /**
   * Cleans up resources, completing any observables.
   */
  public dispose(): void {
    this.stopMonitoring();
    this._globalState$.complete();
  }
}

/**
 * Singleton instance of the GlobalStateDebugger.
 */
export const globalStateDebugger = GlobalStateDebugger.getInstance();
