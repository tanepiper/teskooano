import {
  celestialObjects$,
  currentSeed,
  getCelestialObjects,
  updateSeed,
} from "@teskooano/core-state";
import { pluginManager } from "@teskooano/ui-plugin";
import {
  BehaviorSubject,
  Subscription,
  combineLatest,
  from,
  fromEvent,
  merge,
  of,
} from "rxjs";
import {
  catchError,
  debounceTime,
  filter,
  map,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from "rxjs/operators";
import { SystemControlsTemplate } from "./SystemControls.template.js";
import * as systemActions from "./system-controls.actions.js";
import * as SystemControlsUI from "./system-controls.ui.js";

/**
 * @element teskooano-system-controls
 * @description
 * A custom element that provides UI controls for managing the star system generation,
 * loading, saving, and clearing within the Teskooano application.
 * It interacts with the core state stores (`celestialObjects$`, `currentSeed`)
 * and actions/functions to modify the application state.
 *
 * @attr {boolean} mobile - Indicates if the component should render in a mobile-friendly layout.
 *
 * @fires system-action - Dispatched when a system-level action (like clear) occurs.
 *                        (Note: This is currently handled internally via `actions.clearState`).
 * @fires resetSimulationTime - Dispatched after importing a system to reset the simulation loop timer.
 */
class SystemControls
  extends HTMLElement
  implements SystemControlsUI.SystemControlsUIContract
{
  /** @internal The main container element for the controls. */
  private container: HTMLElement | null = null;
  /** @internal The element shown when no system is loaded. */
  private emptyState: HTMLElement | null = null;
  /** @internal The element shown when a system is loaded. */
  private loadedState: HTMLElement | null = null;
  /** @internal The input field for the system seed. */
  private seedInput: HTMLInputElement | null = null;
  /** @internal The form containing the seed input and submit button. */
  private seedForm: HTMLFormElement | null = null;
  /** @internal The element displaying the current system seed. */
  private systemSeedEl: HTMLElement | null = null;
  /** @internal The element displaying the number of celestial objects. */
  private celestialCountEl: HTMLElement | null = null;
  /** @internal A collection of all action buttons within the component. */
  private buttons: NodeListOf<HTMLElement> | null = null;
  /** @internal The overlay shown during loading/generation states. */
  private loadingOverlay: HTMLElement | null = null;

  private isGenerating$$ = new BehaviorSubject<boolean>(false);
  private mobile$$ = new BehaviorSubject<boolean>(false);
  private subscriptions = new Subscription();

  public isMobile(): boolean {
    return this.mobile$$.value;
  }
  public isGenerating(): boolean {
    return this.isGenerating$$.value;
  }

  public get _loadingOverlay(): HTMLElement | null {
    return this.loadingOverlay;
  }
  public get _buttons(): NodeListOf<HTMLElement> | null {
    return this.buttons;
  }
  public get _emptyState(): HTMLElement | null {
    return this.emptyState;
  }
  public get _loadedState(): HTMLElement | null {
    return this.loadedState;
  }
  public get _systemSeedEl(): HTMLElement | null {
    return this.systemSeedEl;
  }
  public get _celestialCountEl(): HTMLElement | null {
    return this.celestialCountEl;
  }
  public get _seedInput(): HTMLInputElement | null {
    return this.seedInput;
  }

  /**
   * Observed attributes for the custom element.
   * @returns {string[]} An array of attribute names to observe.
   */
  static get observedAttributes() {
    return ["mobile"];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(SystemControlsTemplate.content.cloneNode(true));
  }

  /**
   * Lifecycle callback executed when the element is connected to the DOM.
   * @internal
   */
  connectedCallback() {
    this.container =
      this.shadowRoot?.querySelector(".teskooano-system-controls-container") ||
      null;
    this.emptyState = this.shadowRoot?.querySelector(".state--empty") || null;
    this.loadedState = this.shadowRoot?.querySelector(".state--loaded") || null;
    this.seedInput = this.shadowRoot?.querySelector("#seed") || null;
    this.seedForm =
      (this.shadowRoot?.querySelector(".seed-form") as HTMLFormElement) || null;
    this.systemSeedEl = this.shadowRoot?.querySelector(".system-seed") || null;
    this.celestialCountEl =
      this.shadowRoot?.querySelector(".celestial-count") || null;
    this.buttons =
      this.shadowRoot?.querySelectorAll(
        'teskooano-button[data-action], teskooano-button[type="submit"]',
      ) || null;
    this.loadingOverlay =
      this.shadowRoot?.querySelector(".loading-overlay") || null;

    this.mobile$$.next(this.hasAttribute("mobile"));

    this.setupRxJSStreams();
  }

  /**
   * Lifecycle callback executed when the element is disconnected from the DOM.
   * @internal
   */
  disconnectedCallback() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Lifecycle callback executed when an observed attribute changes.
   * @param {string} name - The name of the attribute that changed.
   * @param {string | null} oldValue - The previous value of the attribute.
   * @param {string | null} newValue - The new value of the attribute.
   * @internal
   */
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === "mobile") {
      this.mobile$$.next(newValue !== null);
    }
  }

  /**
   * Sets up all the RxJS streams for event handling and state management.
   * @private
   */
  private setupRxJSStreams(): void {
    if (!this.shadowRoot) return;

    const generateSubmitButton = this.seedForm?.querySelector<HTMLElement>(
      'teskooano-button[type="submit"]',
    );
    const randomButton = this.shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="random"]',
    );
    const clearButton = this.shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="clear"]',
    );
    const exportButton = this.shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="export"]',
    );
    const importButton = this.shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="import"]',
    );
    const copySeedButton = this.shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="copy-seed"]',
    );
    const createBlankButton = this.shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="create-blank"]',
    );

    if (
      !this.seedForm ||
      !generateSubmitButton ||
      !randomButton ||
      !clearButton ||
      !exportButton ||
      !importButton ||
      !copySeedButton ||
      !createBlankButton ||
      !this.seedInput
    ) {
      console.error(
        "[SystemControls] One or more required elements not found.",
      );
      return;
    }

    const seedSubmit$ = fromEvent(generateSubmitButton, "click").pipe(
      map(() => this.seedInput!.value || ""),
    );

    const randomSubmit$ = fromEvent(randomButton, "click").pipe(
      map(() => Math.random().toString(36).substring(2, 10)),
    );

    const generateSystemTrigger$ = merge(seedSubmit$, randomSubmit$);

    const generateSystemAction$ = generateSystemTrigger$.pipe(
      filter(() => !this.isGenerating$$.value),
      tap(() => this.isGenerating$$.next(true)),

      switchMap((seed) =>
        from(
          pluginManager.execute("system:generate_random", { seed: seed }),
        ).pipe(
          tap((result: any) => {
            console.log("Generation result:", result);
            this.showFeedback(
              generateSubmitButton,
              result?.symbol || (result?.success ? "✅" : "❌"),
              !result?.success,
            );
            const originalTriggerSeed = this.seedInput?.value;
            if (
              result?.success &&
              result?.seed &&
              this.seedInput &&
              result.seed !== originalTriggerSeed
            ) {
              this.seedInput.value = result.seed;
            }
          }),
          catchError((err) => {
            console.error("Generation error:", err);
            this.showFeedback(generateSubmitButton, "❌", true);
            return of({
              success: false,
              symbol: "❌",
              message: "Generation failed",
            });
          }),
        ),
      ),
      tap(() => this.isGenerating$$.next(false)),
    );

    const clearSystemAction$ = fromEvent(clearButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      tap(() => this.isGenerating$$.next(true)),
      switchMap(() =>
        from(systemActions.clearSystem()).pipe(
          tap((result) => {
            console.log("Clear result:", result);
            this.showFeedback(
              clearButton,
              result.symbol || (result.success ? "🗑️" : "❌"),
              !result.success,
            );
          }),
          catchError((err) => {
            console.error("Clear error:", err);
            this.showFeedback(clearButton, "❌", true);
            return of({
              success: false,
              symbol: "❌",
              message: "Clear failed",
            });
          }),
        ),
      ),
      tap(() => this.isGenerating$$.next(false)),
    );

    const exportSystemAction$ = fromEvent(exportButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      withLatestFrom(currentSeed, celestialObjects$),
      tap(() => this.isGenerating$$.next(true)),
      switchMap(([_, seed, objects]) =>
        from(systemActions.exportSystem(seed, objects)).pipe(
          tap((result) => {
            console.log("Export result:", result);
            this.showFeedback(
              exportButton,
              result.symbol || (result.success ? "💾" : "❌"),
              !result.success,
            );
          }),
          catchError((err) => {
            console.error("Export error:", err);
            this.showFeedback(exportButton, "❌", true);
            return of({
              success: false,
              symbol: "❌",
              message: "Export failed",
            });
          }),
        ),
      ),
      tap(() => this.isGenerating$$.next(false)),
    );

    const importSystemAction$ = fromEvent(importButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      tap(() => this.isGenerating$$.next(true)),

      switchMap(() =>
        from(pluginManager.execute("system:trigger_import_dialog")).pipe(
          tap((result: any) => {
            console.log("Import result:", result);
            this.showFeedback(
              importButton,
              result?.symbol || (result?.success ? "✅" : "❌"),
              !result?.success,
            );
          }),
          catchError((err) => {
            console.error("Import error:", err);

            const message = err instanceof Error ? err.message : String(err);
            if (message === "File selection cancelled.") {
              this.showFeedback(importButton, "🤷", false, 1000);
            } else {
              this.showFeedback(importButton, "❌", true);
            }
            return of({
              success: false,
              symbol: "❌",
              message: "Import failed",
            });
          }),
        ),
      ),
      tap(() => this.isGenerating$$.next(false)),
    );

    const copySeedAction$ = fromEvent(copySeedButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      withLatestFrom(currentSeed),

      switchMap(([_, seed]) =>
        from(pluginManager.execute("system:copy_seed", seed)).pipe(
          tap((result: any) => {
            this.showFeedback(
              copySeedButton,
              result?.symbol || (result?.success ? "📋" : "❌"),
              !result?.success,
            );
          }),
          catchError((err) => {
            console.error("Copy seed error:", err);
            this.showFeedback(copySeedButton, "❌", true);
            return of({ success: false, symbol: "❌", message: "Copy failed" });
          }),
        ),
      ),
    );

    const createBlankAction$ = fromEvent(createBlankButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      tap(() => this.isGenerating$$.next(true)),

      switchMap(() =>
        from(pluginManager.execute("system:create_blank")).pipe(
          tap((result: any) => {
            this.showFeedback(
              createBlankButton,
              result?.symbol || (result?.success ? "📄" : "❌"),
              !result?.success,
            );
          }),
          catchError((err) => {
            console.error("Create blank system error:", err);
            this.showFeedback(createBlankButton, "❌", true);
            return of({
              success: false,
              symbol: "❌",
              message: "Create blank failed",
            });
          }),
        ),
      ),
      tap(() => this.isGenerating$$.next(false)),
    );

    const displayState$ = combineLatest([
      celestialObjects$.pipe(startWith(getCelestialObjects())),
      currentSeed.pipe(startWith(currentSeed.getValue())),
      this.isGenerating$$,
      this.mobile$$,
    ]).pipe(debounceTime(0));

    this.subscriptions.add(
      displayState$.subscribe(([objects, seed, isGenerating, isMobile]) => {
        if (this.loadingOverlay) {
          this.loadingOverlay.style.display = isGenerating ? "flex" : "none";
        }

        SystemControlsUI.updateDisplayUI(this, objects, seed);
        SystemControlsUI.updateButtonSizesUI(this);

        if (this.seedInput && !this.seedInput.matches(":focus")) {
          this.seedInput.value = seed || "";
        }
      }),
    );

    const seedInput$ = fromEvent(this.seedInput, "input").pipe(
      debounceTime(300),
      map((event) => {
        const inputEl = (event.target as HTMLElement).shadowRoot?.querySelector(
          "input#seed",
        ) as HTMLInputElement;
        return inputEl.value;
      }),
      tap((seed) => updateSeed(seed)),
    );

    this.subscriptions.add(generateSystemAction$.subscribe());
    this.subscriptions.add(clearSystemAction$.subscribe());
    this.subscriptions.add(exportSystemAction$.subscribe());
    this.subscriptions.add(importSystemAction$.subscribe());
    this.subscriptions.add(copySeedAction$.subscribe());
    this.subscriptions.add(createBlankAction$.subscribe());
    this.subscriptions.add(seedInput$.subscribe());
  }

  /**
   * Shows temporary feedback (symbol) on a button.
   * @param element The button element to show feedback on.
   * @param symbol The symbol (emoji/char) to display.
   * @param isError If true, adds an error class.
   * @param duration Duration in ms to show the feedback.
   * @private
   */
  private showFeedback(
    element: HTMLElement | null,
    symbol: string,
    isError: boolean = false,
    duration: number = 1500,
  ): void {
    if (!element) return;

    const originalContent = element.innerHTML;
    const feedbackClass = isError ? "feedback--error" : "feedback--success";

    const existingTimeout = parseInt(
      element.dataset.feedbackTimeoutId || "0",
      10,
    );
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      element.classList.remove("feedback--error", "feedback--success");

      element.innerHTML = element.dataset.originalContent || originalContent;
    }

    element.dataset.originalContent = originalContent;
    element.innerHTML = `<span class="feedback-symbol">${symbol}</span>`;
    element.classList.add(feedbackClass);
    element.setAttribute("disabled", "");

    const timeoutId = window.setTimeout(() => {
      element.innerHTML = element.dataset.originalContent || originalContent;
      element.classList.remove(feedbackClass);
      element.removeAttribute("disabled");
      delete element.dataset.feedbackTimeoutId;
      delete element.dataset.originalContent;
    }, duration);

    element.dataset.feedbackTimeoutId = timeoutId.toString();
  }
}

export { SystemControls };
