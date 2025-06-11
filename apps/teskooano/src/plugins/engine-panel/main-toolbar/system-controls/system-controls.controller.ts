import { currentSeed$, celestialObjects$ } from "@teskooano/core-state";
import { BehaviorSubject, merge, Observable, Subscription } from "rxjs";
import { tap } from "rxjs/operators";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import {
  SystemControlsEffects,
  type CelestialObjectMap as EffectCelestialObjectMap,
  type Seed as EffectSeed,
  type SystemActionEffectResult,
} from "./system-controls.effects";
import {
  createButtonClickStream$,
  createRandomSeedStream$,
  createSeedSubmitStream$,
} from "./system-controls.streams";
import type { SystemControls } from "./SystemControls";

export class SystemControlsController {
  private view: SystemControls;
  private subscriptions = new Subscription();
  public isGenerating$$ = new BehaviorSubject<boolean>(false);
  private effects: SystemControlsEffects | undefined;
  private context: PluginExecutionContext;

  constructor(view: SystemControls, context: PluginExecutionContext) {
    this.view = view;
    this.context = context;
  }

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

  public dispose(): void {
    this.subscriptions.unsubscribe();
  }
}
