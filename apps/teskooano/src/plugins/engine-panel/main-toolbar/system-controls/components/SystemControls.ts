import {
  celestialObjects$,
  currentSeed$,
  getCelestialObjects,
  getCurrentSeed,
  updateSeed,
} from "@teskooano/core-state";
import type { CelestialObject } from "@teskooano/data-types";
import {
  BehaviorSubject,
  Subscription,
  combineLatest,
  fromEvent,
  merge,
  Observable,
} from "rxjs";
import { debounceTime, map, startWith, tap } from "rxjs/operators";
import { SystemControlsTemplate } from "./SystemControls.template.js";
import * as SystemControlsUI from "./system-controls.ui.js";
import {
  createButtonClickStream$,
  createRandomSeedStream$,
  createSeedSubmitStream$,
} from "../streams/system-controls.streams.js";
import {
  generateSystemEffect$,
  clearSystemEffect$,
  exportSystemEffect$,
  importSystemEffect$,
  copySeedEffect$,
  createBlankSystemEffect$,
  loadHomeSystemEffect$,
  SystemActionEffectResult,
  CelestialObjectMap as EffectCelestialObjectMap,
  Seed as EffectSeed,
} from "../effects/system-controls.effects.js";

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
    _: string | null,
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
    if (!this.shadowRoot || !this.seedForm || !this.seedInput) return;

    const generateSubmitButton = this.seedForm.querySelector<HTMLElement>(
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
    const homeButton = this.shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="home"]',
    );

    if (
      !generateSubmitButton ||
      !randomButton ||
      !clearButton ||
      !exportButton ||
      !importButton ||
      !copySeedButton ||
      !createBlankButton ||
      !homeButton
    ) {
      console.error(
        "[SystemControls] One or more required action buttons not found.",
      );
      return;
    }

    const seedSubmitTr$ = createSeedSubmitStream$(
      generateSubmitButton,
      this.seedInput,
    );
    const randomSubmitTr$ = createRandomSeedStream$(randomButton);
    const clearClick$ = createButtonClickStream$(clearButton);
    const exportClick$ = createButtonClickStream$(exportButton);
    const importClick$ = createButtonClickStream$(importButton);
    const copySeedClick$ = createButtonClickStream$(copySeedButton);
    const createBlankClick$ = createButtonClickStream$(createBlankButton);
    const homeClick$ = createButtonClickStream$(homeButton);

    const generateSystemTrigger$: Observable<{
      seed: string;
      element: HTMLElement;
    }> = merge(seedSubmitTr$, randomSubmitTr$);

    const handleEffectResult = (
      effect$: Observable<SystemActionEffectResult>,
    ) => {
      return effect$.pipe(
        tap((result) => {
          this.showFeedback(
            result.triggerElement,
            result.symbol,
            result.status === "error",
            result.message === "File selection cancelled." ? 1000 : 1500,
          );
          if (result.triggerElement !== copySeedButton) {
            this.isGenerating$$.next(false);
          }
        }),
      );
    };

    const typedCelestialObjects$ =
      celestialObjects$ as Observable<EffectCelestialObjectMap>;
    const typedCurrentSeed$ = currentSeed$ as Observable<EffectSeed>;

    const generateSystem$ = handleEffectResult(
      generateSystemEffect$(
        generateSystemTrigger$,
        this.isGenerating$$,
        this.seedInput,
      ),
    );
    const clearSystem$ = handleEffectResult(
      clearSystemEffect$(clearClick$, this.isGenerating$$),
    );
    const exportSystem$ = handleEffectResult(
      exportSystemEffect$(exportClick$, this.isGenerating$$),
    );
    const importSystem$ = handleEffectResult(
      importSystemEffect$(importClick$, this.isGenerating$$),
    );
    const copySeed$ = handleEffectResult(
      copySeedEffect$(copySeedClick$, typedCurrentSeed$),
    );
    const createBlankSystem$ = handleEffectResult(
      createBlankSystemEffect$(createBlankClick$, this.isGenerating$$),
    );
    const loadHomeSystem$ = handleEffectResult(
      loadHomeSystemEffect$(homeClick$, this.isGenerating$$),
    );

    this.subscriptions.add(generateSystem$.subscribe());
    this.subscriptions.add(clearSystem$.subscribe());
    this.subscriptions.add(exportSystem$.subscribe());
    this.subscriptions.add(importSystem$.subscribe());
    this.subscriptions.add(copySeed$.subscribe());
    this.subscriptions.add(createBlankSystem$.subscribe());
    this.subscriptions.add(loadHomeSystem$.subscribe());

    const displayState$ = combineLatest([
      celestialObjects$.pipe(
        startWith(getCelestialObjects() as CoreCelestialObjectMap),
      ),
      currentSeed$.pipe(startWith(getCurrentSeed())),
      this.isGenerating$$,
      this.mobile$$,
    ]).pipe(debounceTime(0));

    this.subscriptions.add(
      displayState$.subscribe(([objects, seed, isGenerating, _]) => {
        if (this.loadingOverlay) {
          this.loadingOverlay.style.display = isGenerating ? "flex" : "none";
        }
        SystemControlsUI.updateDisplayUI(
          this,
          objects as CoreCelestialObjectMap,
          seed,
        );
        SystemControlsUI.updateButtonSizesUI(this);

        if (this.seedInput && !this.seedInput.matches(":focus")) {
          this.seedInput.value = seed === null ? "" : seed;
        }
      }),
    );

    const seedInputEvent$ = fromEvent(this.seedInput, "input").pipe(
      debounceTime(300),
      map(() => this.seedInput!.value),
      tap((seed) => updateSeed(seed)),
    );
    this.subscriptions.add(seedInputEvent$.subscribe());
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
