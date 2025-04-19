import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';

/**
 * Simplified IntersectionObserver callback type.
 */
export type SimpleIntersectionObserverCallback = (
  entry: IntersectionObserverEntry
) => void;

/**
 * Creates and manages an IntersectionObserver for a given element.
 * Automatically observes the element upon creation and disconnects the observer
 * when the cleanup function is called.
 *
 * @param element The element to observe.
 * @param callback The function to call when the intersection state changes.
 * @param options Optional IntersectionObserver options.
 * @returns A cleanup function to disconnect the observer.
 */
export function observeIntersection(
  element: Element,
  callback: SimpleIntersectionObserverCallback,
  options?: IntersectionObserverInit
): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    console.warn('IntersectionObserver is not supported in this environment.');
    return () => {}; // Return no-op cleanup
  }

  const observer = new IntersectionObserver((entries) => {
    // We should only have one entry as we observe one element
    if (entries[0]) {
      callback(entries[0]);
    }
  }, options);

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Creates an RxJS Observable that emits IntersectionObserverEntry arrays
 * for a given element when its intersection state changes.
 *
 * @param element The element to observe.
 * @param options Optional IntersectionObserver options.
 * @returns An Observable emitting IntersectionObserverEntry arrays.
 */
export function observeIntersection$(
  element: Element,
  options?: IntersectionObserverInit
): Observable<IntersectionObserverEntry[]> {
  return new Observable<IntersectionObserverEntry[]>((subscriber) => {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn(
        'IntersectionObserver is not supported, observable will not emit.'
      );
      subscriber.complete();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      subscriber.next(entries);
    }, options);

    observer.observe(element);

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }).pipe(share()); // Share the underlying observer
} 