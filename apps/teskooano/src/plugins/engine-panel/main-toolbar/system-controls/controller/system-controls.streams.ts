import { fromEvent, Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Creates an observable stream from a button's click event.
 *
 * @param {HTMLElement} buttonElement - The HTML element of the button to observe.
 * @returns {Observable<HTMLElement>} An observable that emits the button element itself on every click.
 */
export function createButtonClickStream$(
  buttonElement: HTMLElement,
): Observable<HTMLElement> {
  return fromEvent(buttonElement, "click").pipe(map(() => buttonElement));
}

/**
 * Creates an observable stream for a form-like submission triggered by a button click.
 * It captures the value from an associated input field at the time of the click.
 *
 * @param {HTMLElement} buttonElement - The button that triggers the submission.
 * @param {HTMLInputElement} seedInputElement - The input element to get the value from.
 * @returns {Observable<{ seed: string; element: HTMLElement }>} An observable that emits an object
 * containing the input value (as `seed`) and the triggering button element.
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
 * Creates an observable stream for generating a random seed, triggered by a button click.
 *
 * @param {HTMLElement} buttonElement - The button that triggers the random generation.
 * @returns {Observable<{ seed: string; element: HTMLElement }>} An observable that emits an object
 * containing a newly generated random seed string and the triggering button element.
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
