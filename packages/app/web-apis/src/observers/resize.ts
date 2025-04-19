import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';

/**
 * Simplified ResizeObserver callback type.
 */
export type SimpleResizeObserverCallback = (entry: ResizeObserverEntry) => void;

/**
 * Creates and manages a ResizeObserver for a given element.
 * Automatically observes the element upon creation and disconnects the observer
 * when the cleanup function is called.
 *
 * @param element The element to observe.
 * @param callback The function to call when the element is resized.
 * @param options Optional ResizeObserver options.
 * @returns A cleanup function to disconnect the observer.
 */
export function observeResize(
  element: Element,
  callback: SimpleResizeObserverCallback,
  options?: ResizeObserverOptions
): () => void {
  if (typeof ResizeObserver === 'undefined') {
    console.warn('ResizeObserver is not supported in this environment.');
    return () => {}; // Return no-op cleanup
  }

  const observer = new ResizeObserver((entries) => {
    // We are only observing one element
    if (entries[0]) {
      callback(entries[0]);
    }
  });

  observer.observe(element, options);

  return () => observer.disconnect();
}

/**
 * Creates an RxJS Observable that emits ResizeObserverEntry arrays
 * for a given element when it is resized.
 *
 * @param element The element to observe.
 * @param options Optional ResizeObserver options.
 * @returns An Observable emitting ResizeObserverEntry arrays.
 */
export function observeResize$(
  element: Element,
  options?: ResizeObserverOptions
): Observable<ResizeObserverEntry[]> {
  return new Observable<ResizeObserverEntry[]>((subscriber) => {
    if (typeof ResizeObserver === 'undefined') {
      console.warn('ResizeObserver is not supported, observable will not emit.');
      subscriber.complete();
      return;
    }

    const observer = new ResizeObserver((entries) => {
      subscriber.next(entries);
    });

    observer.observe(element, options);

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }).pipe(share()); // Share the underlying observer
} 