import { Observable, fromEvent } from 'rxjs';
import { map, startWith, shareReplay } from 'rxjs/operators';

/**
 * Checks if the Fullscreen API is available and enabled in the browser.
 * @returns `true` if the Fullscreen API is supported, `false` otherwise.
 */
export function isFullscreenSupported(): boolean {
  return document.fullscreenEnabled ?? false;
}

/**
 * Checks if an element is currently displayed in fullscreen mode.
 * @returns `true` if an element is in fullscreen, `false` otherwise.
 */
export function isFullscreenActive(): boolean {
  return document.fullscreenElement !== null;
}

/**
 * Requests fullscreen mode for a given element.
 * Note: This must be called in response to a user interaction (e.g., click event).
 *
 * @param element The element to display in fullscreen.
 * @param options Optional FullscreenOptions.
 * @returns A Promise that resolves when fullscreen mode is successfully entered, or rejects if it fails.
 */
export async function requestFullscreen(
  element: Element,
  options?: FullscreenOptions
): Promise<void> {
  if (!isFullscreenSupported()) {
    return Promise.reject(new Error('Fullscreen API is not supported.'));
  }
  if (!element.requestFullscreen) {
    return Promise.reject(
      new Error('Element does not support requestFullscreen method.')
    );
  }
  try {
    await element.requestFullscreen(options);
  } catch (err) {
    console.error('Failed to enter fullscreen mode:', err);
    throw err; // Re-throw the error after logging
  }
}

/**
 * Exits fullscreen mode if currently active.
 * @returns A Promise that resolves when fullscreen mode is successfully exited, or rejects if it fails.
 */
export async function exitFullscreen(): Promise<void> {
  if (!isFullscreenSupported()) {
    return Promise.reject(new Error('Fullscreen API is not supported.'));
  }
  if (!isFullscreenActive()) {
    return Promise.resolve(); // Already not in fullscreen
  }
  try {
    await document.exitFullscreen();
  } catch (err) {
    console.error('Failed to exit fullscreen mode:', err);
    throw err; // Re-throw the error after logging
  }
}

/**
 * Toggles fullscreen mode for a given element.
 * Enters fullscreen if not active, exits if active.
 *
 * @param element The element to toggle fullscreen for.
 * @param options Optional FullscreenOptions (used when entering fullscreen).
 * @returns A Promise that resolves when the state transition is complete, or rejects if it fails.
 */
export async function toggleFullscreen(
  element: Element,
  options?: FullscreenOptions
): Promise<void> {
  if (isFullscreenActive()) {
    return exitFullscreen();
  } else {
    return requestFullscreen(element, options);
  }
}

/**
 * An RxJS Observable that emits the current fullscreen element whenever it changes.
 * Emits `null` when exiting fullscreen.
 * Starts with the current fullscreen element (or null).
 * Replays the last emitted value for new subscribers.
 */
export const fullscreenChange$: Observable<Element | null> = new Observable<
  Element | null
>((subscriber) => {
  // Check for support initially
  if (
    typeof document === 'undefined' ||
    document.fullscreenEnabled === undefined
  ) {
    console.warn('Fullscreen API likely not supported in this environment.');
    subscriber.next(null);
    subscriber.complete();
    return;
  }

  // Handler to emit the current fullscreen element
  const handler = () => {
    subscriber.next(document.fullscreenElement);
  };

  // Attach listener
  document.addEventListener('fullscreenchange', handler);

  // Cleanup function
  return () => {
    document.removeEventListener('fullscreenchange', handler);
  };
}).pipe(
  startWith<Element | null>(
    typeof document !== 'undefined' ? document.fullscreenElement : null
  ),
  shareReplay({ bufferSize: 1, refCount: true })
); 