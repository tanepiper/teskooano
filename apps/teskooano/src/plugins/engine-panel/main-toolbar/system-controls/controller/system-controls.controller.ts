import { currentSeed$ } from "@teskooano/core-state";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import { BehaviorSubject, merge, Observable, Subscription } from "rxjs";
import { tap } from "rxjs/operators";
import type { SystemControls } from "../view/system-controls.component";
import {
  SystemControlsEffects,
  type Seed as EffectSeed,
  type SystemActionEffectResult,
} from "./system-controls.effects";
import {
  createButtonClickStream$,
  createRandomSeedStream$,
  createSeedSubmitStream$,
} from "./system-controls.streams";

/**
 * The controller for the SystemControls component.
 *
 * This class embodies the "Controller" in an MVC-like pattern for the
 * `<teskooano-system-controls>` custom element. It is responsible for all
 * business logic, including:
 * - Setting up event streams from the view's user interactions.
 * - Managing the RxJS-based effect pipelines that call plugin functions.
 * - Handling the component's internal state (e.g., loading indicators).
 * - Tearing down all subscriptions when the component is destroyed.
 */
export class SystemControlsController {
  private view: SystemControls;
  private subscriptions = new Subscription();
  public isGenerating$$ = new BehaviorSubject<boolean>(false);
  private effects: SystemControlsEffects | undefined;
  private context: PluginExecutionContext;

  /**
   * Constructs the controller.
   * @param {SystemControls} view - The view instance this controller will manage.
   * @param {PluginExecutionContext} context - The application context for plugin interaction.
   */
  constructor(view: SystemControls, context: PluginExecutionContext) {
    this.view = view;
    this.context = context;
  }

  /**
   * Initializes the controller. This method sets up all the necessary
   * event streams and effect pipelines. It should be called once the
   * view has been connected to the DOM.
   */
  public init(): void {
    const { shadowRoot, seedForm, seedInput } = this.view;

    if (!shadowRoot || !seedForm || !seedInput) {
      console.error(
        "[SystemControlsController] View is not ready, required elements are missing.",
      );
      return;
    }

    this.effects = new SystemControlsEffects(
      this.isGenerating$$,
      seedInput,
      this.context,
    );

    const generateSubmitButton = seedForm.querySelector<HTMLElement>(
      'teskooano-button[type="submit"]',
    );
    const randomButton = shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="random"]',
    );
    const clearButton = shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="clear"]',
    );
    const exportButton = shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="export"]',
    );
    const importButton = shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="import"]',
    );
    const copySeedButton = shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="copy-seed"]',
    );
    const createBlankButton = shadowRoot.querySelector<HTMLElement>(
      'teskooano-button[data-action="create-blank"]',
    );

    if (
      !generateSubmitButton ||
      !randomButton ||
      !clearButton ||
      !exportButton ||
      !importButton ||
      !copySeedButton ||
      !createBlankButton ||
      !this.effects
    ) {
      console.error(
        "[SystemControlsController] One or more required action buttons not found.",
      );
      return;
    }

    const seedSubmitTr$ = createSeedSubmitStream$(
      generateSubmitButton,
      seedInput,
    );
    const randomSubmitTr$ = createRandomSeedStream$(randomButton);
    const clearClick$ = createButtonClickStream$(clearButton);
    const exportClick$ = createButtonClickStream$(exportButton);
    const importClick$ = createButtonClickStream$(importButton);
    const copySeedClick$ = createButtonClickStream$(copySeedButton);
    const createBlankClick$ = createButtonClickStream$(createBlankButton);

    const generateSystemTrigger$: Observable<{
      seed: string;
      element: HTMLElement;
    }> = merge(seedSubmitTr$, randomSubmitTr$);

    const handleEffectResult = (
      effect$: Observable<SystemActionEffectResult>,
    ) => {
      return effect$.pipe(
        tap((result) => {
          this.view.showFeedback(
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

    const typedCurrentSeed$ = currentSeed$ as Observable<EffectSeed>;

    const generateSystem$ = handleEffectResult(
      this.effects.generateSystemEffect$(generateSystemTrigger$),
    );
    const clearSystem$ = handleEffectResult(
      this.effects.clearSystemEffect$(clearClick$),
    );
    const exportSystem$ = handleEffectResult(
      this.effects.exportSystemEffect$(exportClick$),
    );
    const importSystem$ = handleEffectResult(
      this.effects.importSystemEffect$(importClick$),
    );
    const copySeed$ = handleEffectResult(
      this.effects.copySeedEffect$(copySeedClick$, typedCurrentSeed$),
    );
    const createBlankSystem$ = handleEffectResult(
      this.effects.createBlankSystemEffect$(createBlankClick$),
    );

    this.subscriptions.add(generateSystem$.subscribe());
    this.subscriptions.add(clearSystem$.subscribe());
    this.subscriptions.add(exportSystem$.subscribe());
    this.subscriptions.add(importSystem$.subscribe());
    this.subscriptions.add(copySeed$.subscribe());
    this.subscriptions.add(createBlankSystem$.subscribe());
  }

  /**
   * Disposes of the controller, unsubscribing from all active RxJS streams
   * to prevent memory leaks. This should be called when the associated
   * view is disconnected from the DOM.
   */
  public dispose(): void {
    this.subscriptions.unsubscribe();
  }
}
