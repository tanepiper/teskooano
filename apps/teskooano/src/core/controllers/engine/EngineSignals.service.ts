import { BehaviorSubject, Subject } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { StateAccessor, simulationStateService } from "@teskooano/core-state";
import type { SimulationState } from "@teskooano/core-state";

/**
 * Service: EngineSignalsService
 * Centralizes engine-level signals using RxJS instead of DOM CustomEvents.
 *
 * Signals include system generation lifecycle and simulation time reset.
 * Consumers subscribe to these subjects to react declaratively.
 */
class EngineSignalsService {
  /** Emits when system generation starts. */
  public readonly systemGenerationStart$ = new Subject<void>();
  /** Emits when system generation completes. */
  public readonly systemGenerationComplete$ = new Subject<void>();
  /** Emits when simulation time should be reset. */
  public readonly simulationResetTime$ = new Subject<void>();
  /** Orbits/predictions/trails clear signals (replaces DOM events). */
  public readonly clearOrbits$ = new Subject<void>();
  public readonly clearPredictions$ = new Subject<void>();
  public readonly clearPositionHistory$ = new Subject<void>();

  /** Derived state: is a generation currently in progress. */
  public readonly isGenerating$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.systemGenerationStart$.subscribe(() => this.isGenerating$.next(true));
    this.systemGenerationComplete$.subscribe(() =>
      this.isGenerating$.next(false),
    );
  }

  // --- Global simulation state selectors (pass-through with operators) ---
  public selectSimulation$() {
    return StateAccessor.getSimulationStateStream();
  }

  public selectFocusedObjectId$() {
    return this.selectSimulation$().pipe(
      map((s: SimulationState) => s.focusedObjectId),
      distinctUntilChanged(),
    );
  }

  public selectSelectedObjectId$() {
    return this.selectSimulation$().pipe(
      map((s: SimulationState) => s.selectedObject),
      distinctUntilChanged(),
    );
  }

  // --- Global simulation state mutations ---
  public focusObject(objectId: string | null) {
    simulationStateService.setFocusedObject(objectId);
  }

  public selectObject(objectId: string | null) {
    simulationStateService.selectObject(objectId);
  }
}

export const engineSignalsService = new EngineSignalsService();

