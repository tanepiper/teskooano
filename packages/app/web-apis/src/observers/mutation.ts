import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';

/**
 * Creates and manages a MutationObserver for a given target node.
 * Automatically observes the target upon creation and disconnects the observer
 * when the cleanup function is called.
 *
 * @param target The node to observe for mutations.
 * @param callback The function to call when mutations are observed.
 * @param options The options describing which mutations to observe.
 * @returns A cleanup function to disconnect the observer.
 */
export function observeMutations(
  target: Node,
  callback: MutationCallback,
  options: MutationObserverInit
): () => void {
  if (typeof MutationObserver === 'undefined') {
    console.warn('MutationObserver is not supported in this environment.');
    return () => {}; // Return no-op cleanup
  }

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(target, options);

  // Return a cleanup function to stop observing
  return () => observer.disconnect();
}

/**
 * Creates an RxJS Observable that emits MutationRecord arrays
 * for a given target node when mutations occur.
 *
 * @param target The node to observe for mutations.
 * @param options The options describing which mutations to observe.
 * @returns An Observable emitting MutationRecord arrays.
 */
export function observeMutations$(
  target: Node,
  options: MutationObserverInit
): Observable<MutationRecord[]> {
  return new Observable<MutationRecord[]>((subscriber) => {
    if (typeof MutationObserver === 'undefined') {
      console.warn('MutationObserver is not supported, observable will not emit.');
      subscriber.complete();
      return;
    }

    const observer = new MutationObserver((mutations) => {
      subscriber.next(mutations);
    });

    observer.observe(target, options);

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }).pipe(share()); // Share the underlying observer
} 