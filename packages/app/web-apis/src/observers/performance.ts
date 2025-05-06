import { Observable } from "rxjs";
import { share } from "rxjs/operators";

/**
 * Creates and manages a PerformanceObserver.
 * Automatically starts observing based on the provided entry types
 * and disconnects the observer when the cleanup function is called.
 *
 * @param callback The function to call when performance entries are observed.
 * @param options Options including the entry types to observe.
 * @returns A cleanup function to disconnect the observer, or null if PerformanceObserver is not supported.
 */
export function observePerformance(
  callback: PerformanceObserverCallback,
  options: PerformanceObserverInit,
): (() => void) | null {
  if (typeof PerformanceObserver === "undefined") {
    console.warn("PerformanceObserver is not supported in this environment.");
    return null;
  }

  try {
    const observer = new PerformanceObserver(callback);

    observer.observe(options);

    return () => observer.disconnect();
  } catch (error) {
    console.error("Failed to create or observe PerformanceObserver:", error);

    return null;
  }
}

/**
 * Creates an RxJS Observable that emits PerformanceObserverEntryList objects
 * based on the specified performance entry types.
 *
 * @param options Options including the entry types to observe.
 * @returns An Observable emitting PerformanceObserverEntryList objects, or EMPTY if not supported.
 */
export function observePerformance$(
  options: PerformanceObserverInit,
): Observable<PerformanceObserverEntryList> {
  return new Observable<PerformanceObserverEntryList>((subscriber) => {
    if (typeof PerformanceObserver === "undefined") {
      console.warn(
        "PerformanceObserver is not supported, observable will not emit.",
      );
      subscriber.complete();
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        subscriber.next(list);
      });
      observer.observe(options);

      return () => {
        observer.disconnect();
      };
    } catch (error) {
      console.error(
        "Failed to create or observe PerformanceObserver for observable:",
        error,
      );
      subscriber.error(error);
      return;
    }
  }).pipe(share());
}
