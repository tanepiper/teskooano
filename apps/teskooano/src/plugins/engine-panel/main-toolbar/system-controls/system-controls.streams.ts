import { fromEvent, Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Creates an observable stream from a button click event.
 * Emits the clicked HTMLElement.
 */
export function createButtonClickStream$(
  buttonElement: HTMLElement,
): Observable<HTMLElement> {
  return fromEvent(buttonElement, "click").pipe(map(() => buttonElement));
}

/**
 * Creates an observable stream for seed submission from a specific button click.
 * Emits an object containing the seed value and the button element.
 */
export function createSeedSubmitStream$(
  buttonElement: HTMLElement,
  seedInputElement: HTMLInputElement,
): Observable<{ seed: string; element: HTMLElement }> {
  return fromEvent(buttonElement, "click").pipe(
    map(() => ({
      seed: seedInputElement.value || "",
      element: buttonElement,
    })),
  );
}

/**
 * Creates an observable stream for random seed generation from a button click.
 * Emits an object containing a randomly generated seed and the button element.
 */
export function createRandomSeedStream$(
  buttonElement: HTMLElement,
): Observable<{ seed: string; element: HTMLElement }> {
  return fromEvent(buttonElement, "click").pipe(
    map(() => ({
      seed: Math.random().toString(36).substring(2, 10),
      element: buttonElement,
    })),
  );
}
