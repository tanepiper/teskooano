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
import type { TeskooanoButton } from "../../../../core/components/button/Button.js";
import {
  CheckmarkIcon,
  CopyIcon,
  DeleteIcon,
  DocumentAddIcon,
  FolderOpenIcon,
  SaveIcon,
  SparkleIcon,
  SystemControlsTemplate,
} from "./SystemControls.template.js";
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
  // DOM elements
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

  // --- RxJS State --- //
  private isGenerating$$ = new BehaviorSubject<boolean>(false);
  private mobile$$ = new BehaviorSubject<boolean>(false);
  private subscriptions = new Subscription(); // Single subscription manager

  // Expose internal state for UI functions (implementing contract)
  public isMobile(): boolean {
    return this.mobile$$.value;
  }
  public isGenerating(): boolean {
    return this.isGenerating$$.value;
  }
  // Keep refs to elements needed by UI functions
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
    // Only observe mobile, other state comes from store
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
    // Cache DOM elements
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

    // Initialize mobile state
    this.mobile$$.next(this.hasAttribute("mobile"));

    // --- Setup RxJS Streams --- //
    this.setupRxJSStreams();

    // Add Tooltips (can remain as is)
    this.setupTooltips();
  }

  /**
   * Lifecycle callback executed when the element is disconnected from the DOM.
   * @internal
   */
  disconnectedCallback() {
    this.subscriptions.unsubscribe(); // Unsubscribe all streams
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

    // --- Event Sources --- //
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

    // Ensure all elements exist before creating streams
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

    // Seed generation from submit BUTTON CLICK
    const seedSubmit$ = fromEvent(generateSubmitButton, "click").pipe(
      map(() => this.seedInput!.value || ""),
    );

    // Random seed generation from button click
    const randomSubmit$ = fromEvent(randomButton, "click").pipe(
      map(() => Math.random().toString(36).substring(2, 10)), // Generate random seed
    );

    // Combined stream for triggering generation
    const generateSystemTrigger$ = merge(seedSubmit$, randomSubmit$);

    // Action: Generate System (now using pluginManager)
    const generateSystemAction$ = generateSystemTrigger$.pipe(
      filter(() => !this.isGenerating$$.value),
      tap(() => this.isGenerating$$.next(true)),
      // Use pluginManager.execute to call the registered generation function
      switchMap((seed) =>
        from(
          pluginManager.execute("system:generate_random", { seed: seed }),
        ).pipe(
          // The result from pluginManager.execute should already be ActionResult-like
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

    // Action: Clear System
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

    // Action: Export System
    const exportSystemAction$ = fromEvent(exportButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      withLatestFrom(currentSeed, celestialObjects$), // Get current seed and objects
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

    // Action: Import System (using pluginManager.execute)
    const importSystemAction$ = fromEvent(importButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      tap(() => this.isGenerating$$.next(true)),
      // Call pluginManager.execute for the import function
      switchMap(() =>
        from(pluginManager.execute("system:trigger_import_dialog")).pipe(
          tap((result: any) => {
            // pluginManager.execute resolves with the result of the function's execute method
            console.log("Import result:", result);
            this.showFeedback(
              importButton,
              result?.symbol || (result?.success ? "✅" : "❌"), // Add null checks
              !result?.success,
            );
          }),
          catchError((err) => {
            // Handle potential errors from pluginManager or the function execution
            console.error("Import error:", err);
            // Check if it's the cancellation error (might be nested)
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

    // Action: Copy Seed
    const copySeedAction$ = fromEvent(copySeedButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      withLatestFrom(currentSeed),
      // Call pluginManager for copy seed
      switchMap(([_, seed]) =>
        from(pluginManager.execute("system:copy_seed", seed)).pipe(
          // Pass seed as argument
          tap((result: any) => {
            // Add type assertion or check result type
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

    // Action: Create Blank System
    const createBlankAction$ = fromEvent(createBlankButton, "click").pipe(
      filter(() => !this.isGenerating$$.value),
      tap(() => this.isGenerating$$.next(true)),
      // Call pluginManager for create blank
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

    // --- State & UI Updates --- //

    // Combined state stream for UI updates
    const displayState$ = combineLatest([
      // Combine latest values from relevant streams
      celestialObjects$.pipe(startWith(getCelestialObjects())), // Ensure initial value
      currentSeed.pipe(startWith(currentSeed.getValue())), // Ensure initial value
      this.isGenerating$$,
      this.mobile$$,
    ]).pipe(
      debounceTime(0), // Coalesce rapid updates
    );

    // Subscribe to combined state for UI updates
    this.subscriptions.add(
      displayState$.subscribe(([objects, seed, isGenerating, isMobile]) => {
        // Update loading overlay directly
        if (this.loadingOverlay) {
          this.loadingOverlay.style.display = isGenerating ? "flex" : "none";
        }
        // Call UI update functions, passing the component instance (this)
        SystemControlsUI.updateDisplayUI(this, objects, seed);
        SystemControlsUI.updateButtonSizesUI(this);
        // Update seed input only if it doesn't have focus
        if (this.seedInput && !this.seedInput.matches(":focus")) {
          this.seedInput.value = seed || "";
        }
      }),
    );

    // Update seed store when input changes (debounced)
    const seedInput$ = fromEvent(this.seedInput, "input").pipe(
      debounceTime(300),
      map((event) => (event.target as HTMLInputElement).value),
      tap((seed) => updateSeed(seed)), // Update core state store
    );

    // --- Subscribe to Actions --- //
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

    // Clear previous feedback timeouts if any
    const existingTimeout = parseInt(
      element.dataset.feedbackTimeoutId || "0",
      10,
    );
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      element.classList.remove("feedback--error", "feedback--success");
      // Attempt to restore original content if stored
      element.innerHTML = element.dataset.originalContent || originalContent;
    }

    // Store original content before changing
    element.dataset.originalContent = originalContent;
    element.innerHTML = `<span class="feedback-symbol">${symbol}</span>`;
    element.classList.add(feedbackClass);
    element.setAttribute("disabled", ""); // Disable button during feedback

    const timeoutId = window.setTimeout(() => {
      element.innerHTML = element.dataset.originalContent || originalContent; // Restore original
      element.classList.remove(feedbackClass);
      element.removeAttribute("disabled");
      delete element.dataset.feedbackTimeoutId;
      delete element.dataset.originalContent;
    }, duration);

    element.dataset.feedbackTimeoutId = timeoutId.toString();
  }

  /**
   * Iterates through buttons and sets tooltip attributes based on action.
   * @private
   */
  private setupTooltips(): void {
    const submitButton = this.seedForm?.querySelector(
      'teskooano-button[type="submit"]',
    ) as TeskooanoButton | null;

    if (submitButton) {
      this.setButtonTooltip(
        submitButton,
        "Generate",
        "Generate system from entered seed",
        CheckmarkIcon,
      );
    }

    this.buttons?.forEach((button) => {
      const actionButton = button as TeskooanoButton; // Cast to specific type
      const action = actionButton.dataset.action;
      switch (action) {
        case "random":
          this.setButtonTooltip(
            actionButton,
            "Random Seed",
            "Generate system using a random seed",
            SparkleIcon,
          );
          break;
        case "clear":
          this.setButtonTooltip(
            actionButton,
            "Clear System",
            "Clear all objects from the current system",
            DeleteIcon,
          );
          break;
        case "export":
          this.setButtonTooltip(
            actionButton,
            "Export System",
            "Export current system objects and seed to a JSON file",
            SaveIcon,
          );
          break;
        case "import":
          this.setButtonTooltip(
            actionButton,
            "Import System",
            "Import system from a JSON file",
            FolderOpenIcon,
          );
          break;
        case "create-blank":
          this.setButtonTooltip(
            actionButton,
            "New Blank",
            "Create a new blank system with just a star",
            DocumentAddIcon,
          );
          break;
        case "copy-seed":
          this.setButtonTooltip(
            actionButton,
            "Copy Seed",
            "Copy the current system seed to the clipboard",
            CopyIcon,
          );
          break;
        // Add cases for other buttons if they exist
      }
    });
  }

  /**
   * Helper to set tooltip attributes on a button.
   * @param button The button element.
   * @param title Tooltip title.
   * @param text Tooltip descriptive text.
   * @param iconSvg SVG string for the tooltip icon.
   * @private
   */
  private setButtonTooltip(
    button: TeskooanoButton | null,
    title: string | null,
    text: string | null,
    iconSvg: string | null,
  ): void {
    if (!button) return;
    // Set attributes - the button component handles native title suppression
    if (title) button.setAttribute("tooltip-title", title);
    else button.removeAttribute("tooltip-title");

    if (text) button.setAttribute("tooltip-text", text);
    else button.removeAttribute("tooltip-text");

    if (iconSvg) button.setAttribute("tooltip-icon-svg", iconSvg);
    else button.removeAttribute("tooltip-icon-svg");
  }
}

// Export for potential external usage or typing
export { SystemControls };
