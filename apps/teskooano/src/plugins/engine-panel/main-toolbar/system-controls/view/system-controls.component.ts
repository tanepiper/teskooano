import {
  celestialObjects$,
  currentSeed$,
  getCelestialObjects,
  getCurrentSeed,
  updateSeed,
} from "@teskooano/core-state";
import type { CelestialObject } from "@teskooano/data-types";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import { BehaviorSubject, combineLatest, fromEvent, Subscription } from "rxjs";
import { debounceTime, map, startWith, tap } from "rxjs/operators";
import { SystemControlsTemplate } from "./system-controls.template.js";
import { SystemControlsController } from "../controller/system-controls.controller.js";

// Define core types based on usage
type CoreCelestialObjectMap = Record<string, CelestialObject>;

/**
 * @element teskooano-system-controls
 * @description
 * A custom element that provides UI controls for managing the star system,
 * including generation, loading, saving, and clearing. It serves as the View
 * in an MVC-like pattern, delegating all logic to its corresponding Controller.
 * It renders different states based on whether a system is loaded and
 * provides visual feedback for ongoing operations.
 *
 * @attr {boolean} mobile - When present, indicates that the component should
 * render in a mobile-friendly layout with more compact controls.
 *
 * @fires system-action - Dispatched when a system-level action (like clear) occurs.
 *                        (Note: This is currently handled internally via `actions.clearState`).
 * @fires resetSimulationTime - Dispatched after importing a system to reset the simulation loop timer.
 */
export class SystemControls extends HTMLElement {
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

  /** @internal A subject that emits true when a system is being generated. */
  public isGenerating$$ = new BehaviorSubject<boolean>(false);
  /** @internal A subject that emits true when the mobile attribute is present. */
  private mobile$$ = new BehaviorSubject<boolean>(false);
  /** @internal A collection of all RxJS subscriptions to be torn down on disconnect. */
  private subscriptions = new Subscription();
  /** @internal The controller instance that manages all component logic. */
  private controller: SystemControlsController | undefined;

  /**
   * Checks if the component is currently in mobile layout mode.
   * @returns {boolean} True if the component has the 'mobile' attribute.
   */
  public isMobile(): boolean {
    return this.mobile$$.value;
  }

  /**
   * Checks if the component is in a "generating" state.
   * @returns {boolean} True if the system generation is in progress.
   */
  public isGenerating(): boolean {
    return this.controller?.isGenerating$$.value ?? false;
  }

  // A series of getters to provide controlled access to the component's internal elements.
  // This is primarily for the controller to be able to access them without them being public.
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
   * @returns An array of attribute names to observe for changes.
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
   * Standard custom element lifecycle callback.
   * Fired when the element is connected to the DOM.
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
   * Initializes the component by connecting it to its controller.
   * This method MUST be called by the element's creator, passing the necessary
   * execution context, which allows the component and its controller to
   * interact with the wider application plugin system.
   *
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
   * Standard custom element lifecycle callback.
   * Fired when the element is disconnected from the DOM.
   * @internal
   */
  disconnectedCallback() {
    this.subscriptions.unsubscribe();
    this.controller?.dispose();
  }

  /**
   * Standard custom element lifecycle callback.
   * Fired when an observed attribute changes.
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
   * Shows temporary feedback on a button after an action, such as a success
   * or error symbol. This is controlled by the component's controller.
   *
   * @param {HTMLElement | null} element - The button element to display feedback on.
   * @param {string} symbol - The symbol (e.g., an emoji) to display.
   * @param {boolean} [isError=false] - If true, styles the feedback as an error.
   * @param {number} [duration=1500] - The duration in milliseconds to show the feedback.
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
   * Sets up RxJS streams for reactive UI updates. This method subscribes to
   * global state stores and the component's internal state subjects to
   * automatically update the DOM when data changes.
   *
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
      celestialObjects$.pipe(startWith(getCelestialObjects())),
      currentSeed$.pipe(startWith(getCurrentSeed())),
      this.controller.isGenerating$$,
      this.mobile$$,
    ]).pipe(debounceTime(0));

    this.subscriptions.add(
      displayState$.subscribe(([objects, seed, isGenerating, _isMobile]) => {
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
        const shadowInput =
          target.shadowRoot?.querySelector<HTMLInputElement>("input#seed");
        if (shadowInput) {
          return shadowInput.value;
        }
        if (target instanceof HTMLInputElement) {
          return target.value;
        }
        return "";
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
   * It toggles between the "empty" and "loaded" views and updates text
   * content like the seed and celestial object count.
   *
   * @param {Record<string, CelestialObject>} objects - The current map of celestial objects.
   * @param {string} seed - The current system seed.
   * @param {boolean} isGenerating - Whether a system is currently being generated.
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
   * Adjusts button styles based on the mobile state. For example, it may
   * hide text labels on buttons to save space, showing only icons.
   *
   * @param {boolean} isMobile - True if the component is in mobile mode.
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

// Define the custom element now that the class is defined.
