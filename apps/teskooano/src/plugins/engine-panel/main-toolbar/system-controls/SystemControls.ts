import {
  celestialObjects$,
  currentSeed$,
  getCelestialObjects,
  getCurrentSeed,
  updateSeed,
} from "@teskooano/core-state";
import type { CelestialObject } from "@teskooano/data-types";
import { BehaviorSubject, combineLatest, fromEvent, Subscription } from "rxjs";
import { debounceTime, map, startWith, tap } from "rxjs/operators";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import { SystemControlsTemplate } from "./SystemControls.template.js";
import { SystemControlsController } from "./system-controls.controller.js";

// Define core types based on usage
type CoreCelestialObjectMap = Record<string, CelestialObject>;

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
class SystemControls extends HTMLElement {
  /** @internal The main container element for the controls. */
  private container: HTMLElement | null = null;
  /** @internal The element shown when no system is loaded. */
  private emptyState: HTMLElement | null = null;
  /** @internal The element shown when a system is loaded. */
  private loadedState: HTMLElement | null = null;
  /** @internal The input field for the system seed. */
  public seedInput: HTMLInputElement | null = null;
  /** @internal The form containing the seed input and submit button. */
  public seedForm: HTMLFormElement | null = null;
  /** @internal The element displaying the current system seed. */
  private systemSeedEl: HTMLElement | null = null;
  /** @internal The element displaying the number of celestial objects. */
  private celestialCountEl: HTMLElement | null = null;
  /** @internal A collection of all action buttons within the component. */
  private buttons: NodeListOf<HTMLElement> | null = null;
  /** @internal The overlay shown during loading/generation states. */
  private loadingOverlay: HTMLElement | null = null;

  public isGenerating$$ = new BehaviorSubject<boolean>(false);
  private mobile$$ = new BehaviorSubject<boolean>(false);
  private subscriptions = new Subscription();
  private controller: SystemControlsController | undefined;

  public isMobile(): boolean {
    return this.mobile$$.value;
  }
  public isGenerating(): boolean {
    return this.controller?.isGenerating$$.value ?? false;
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
  }

  /**
   * Sets the plugin execution context and initializes the controller.
   * This method should be called by the code that creates this element.
   * @param {PluginExecutionContext} context - The plugin execution context.
   */
  public setContext(context: PluginExecutionContext) {
    if (this.controller) {
      console.warn(
        "[SystemControls] Context already set. Re-initialization is not supported.",
      );
      return;
    }
    this.controller = new SystemControlsController(this, context);
    this.controller.init();
    this.setupUIStreams();
  }

  /**
   * Lifecycle callback executed when the element is disconnected from the DOM.
   * @internal
   */
  disconnectedCallback() {
    this.subscriptions.unsubscribe();
    this.controller?.dispose();
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
    _: string | null,
    newValue: string | null,
  ) {
    if (name === "mobile") {
      this.mobile$$.next(newValue !== null);
    }
  }

  /**
   * Shows temporary feedback (symbol) on a button.
   * @param element The button element to show feedback on.
   * @param symbol The symbol (emoji/char) to display.
   * @param isError If true, adds an error class.
   * @param duration Duration in ms to show the feedback.
   */
  public showFeedback(
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

  /**
   * Sets up the RxJS streams for updating the UI display and handling direct
   * UI-to-state interactions like the seed input.
   * @private
   */
  private setupUIStreams(): void {
    if (
      !this.shadowRoot ||
      !this.seedForm ||
      !this.seedInput ||
      !this.controller
    ) {
      return;
    }

    const displayState$ = combineLatest([
      celestialObjects$.pipe(
        startWith(getCelestialObjects() as CoreCelestialObjectMap),
      ),
      currentSeed$.pipe(startWith(getCurrentSeed())),
      this.controller.isGenerating$$,
      this.mobile$$,
    ]).pipe(debounceTime(0));

    this.subscriptions.add(
      displayState$.subscribe(([objects, seed, isGenerating, _]) => {
        this._updateDisplay(
          objects as CoreCelestialObjectMap,
          seed,
          isGenerating,
        );

        if (this.seedInput && !this.seedInput.matches(":focus")) {
          this.seedInput.value = seed === null ? "" : seed;
        }
      }),
    );

    const seedInputEvent$ = fromEvent(this.seedInput, "input").pipe(
      debounceTime(300),
      map((event) => {
        const target = event.target as HTMLElement;
        // Attempt to get value from shadow DOM input, otherwise from target itself
        const shadowInput =
          target.shadowRoot?.querySelector<HTMLInputElement>("input#seed");
        if (shadowInput) {
          return shadowInput.value;
        }
        if (target instanceof HTMLInputElement) {
          return target.value;
        }
        return ""; // Fallback if not an input element somehow
      }),
      tap((seed) => updateSeed(seed)),
    );
    this.subscriptions.add(seedInputEvent$.subscribe());

    this.subscriptions.add(
      this.mobile$$.subscribe((isMobile) => {
        this._updateButtonStylesForMobileState(isMobile);
      }),
    );
  }

  /**
   * Updates the component's display based on the current system state.
   * Toggles between empty and loaded states, and updates displayed info.
   * @param objects The current map of celestial objects.
   * @param seed The current system seed.
   * @param isGenerating Whether a system is currently being generated.
   * @private
   */
  private _updateDisplay(
    objects: Record<string, CelestialObject>,
    seed: string,
    isGenerating: boolean,
  ): void {
    const objectCount = Object.keys(objects).length;
    const systemLoaded = objectCount > 0;

    if (this.emptyState && this.loadedState) {
      this.emptyState.style.display = systemLoaded ? "none" : "";
      this.loadedState.style.display = systemLoaded ? "" : "none";
    }

    if (systemLoaded) {
      const count = objectCount;
      const currentSystemSeed = seed || "---------";
      if (this.systemSeedEl) {
        this.systemSeedEl.textContent = currentSystemSeed;
        this.systemSeedEl.title = `Seed: ${currentSystemSeed}`;
      }
      if (this.celestialCountEl) {
        this.celestialCountEl.textContent = `${count} Celestial${
          count !== 1 ? "s" : ""
        }`;
      }
    }

    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = isGenerating ? "flex" : "none";
    }

    this.buttons?.forEach((button) => {
      (button as HTMLButtonElement).disabled = isGenerating;
    });
  }

  /**
   * Updates button sizes and styles based on the mobile state.
   * @param isMobile - True if the component is in mobile mode.
   * @private
   */
  private _updateButtonStylesForMobileState(isMobile: boolean): void {
    if (!this.buttons || !this.seedForm) return;

    this.buttons.forEach((button) => {
      if (isMobile) {
        button.setAttribute("size", "sm");
      } else {
        if (button.getAttribute("size") === "sm") {
          button.removeAttribute("size");
        }
      }
    });

    // Special handling for the submit button text
    const submitButton = this.seedForm.querySelector<HTMLElement>(
      'teskooano-button[type="submit"]',
    );
    if (!submitButton) return;

    const submitText = submitButton.querySelector('span:not([slot="icon"])');
    if (submitText) {
      (submitText as HTMLElement).style.display = isMobile ? "none" : "";
    }
    const submitIcon = submitButton.querySelector('span[slot="icon"]');
    if (submitIcon) {
      (submitIcon as HTMLElement).style.marginRight = isMobile ? "0" : "";
    }
  }
}

export { SystemControls };
