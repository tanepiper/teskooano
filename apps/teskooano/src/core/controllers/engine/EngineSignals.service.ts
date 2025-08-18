import { BehaviorSubject, Subject } from "rxjs";

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

  /** Derived state: is a generation currently in progress. */
  public readonly isGenerating$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.systemGenerationStart$.subscribe(() => this.isGenerating$.next(true));
    this.systemGenerationComplete$.subscribe(() =>
      this.isGenerating$.next(false),
    );
  }
}

export const engineSignalsService = new EngineSignalsService();

