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