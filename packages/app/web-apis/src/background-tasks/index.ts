type RequestIdleCallbackHandle = number;
type RequestIdleCallbackOptions = {
  timeout: number;
};
type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
};

declare global {
  interface Window {
    requestIdleCallback: (
      callback: IdleRequestCallback,
      opts?: IdleRequestOptions
    ) => number;
    cancelIdleCallback: (handle: number) => void;
  }
}

/**
 * Checks if the Request Idle Callback API is supported by the browser.
 * @returns `true` if `window.requestIdleCallback` exists, `false` otherwise.
 */
export function isRequestIdleCallbackSupported(): boolean {
  return typeof window !== 'undefined' && 'requestIdleCallback' in window;
}

/**
 * A Promise-based wrapper for `requestIdleCallback`.
 * Executes the callback function when the browser is idle, or after the timeout.
 * Resolves with the IdleDeadline object.
 * Rejects if the API is not supported or if cancellation is requested via the signal.
 *
 * @param callback The function to execute during idle time.
 * @param options Optional configuration including timeout and AbortSignal.
 * @param options.timeout Maximum time in milliseconds to wait before executing the callback.
 * @param options.signal An AbortSignal to cancel the scheduled callback.
 * @returns A Promise that resolves with the IdleDeadline or rejects on error/cancellation.
 */
export function requestIdleCallbackPromise(
  callback: (deadline: RequestIdleCallbackDeadline) => void,
  options?: { timeout?: number; signal?: AbortSignal }
): Promise<RequestIdleCallbackDeadline> {
  return new Promise((resolve, reject) => {
    if (!isRequestIdleCallbackSupported()) {
      return reject(new Error('requestIdleCallback is not supported.'));
    }

    const handle = window.requestIdleCallback(
      (deadline) => {
        // Clean up the abort listener once the callback executes
        options?.signal?.removeEventListener('abort', abortListener);
        callback(deadline); // Execute the user's callback first
        resolve(deadline); // Then resolve the promise
      },
      options?.timeout ? { timeout: options.timeout } : undefined
    );

    const abortListener = () => {
      window.cancelIdleCallback(handle);
      reject(new DOMException('Idle callback cancelled', 'AbortError'));
    };

    // If a signal is provided, listen for abort events
    if (options?.signal) {
      if (options.signal.aborted) {
        // If already aborted, reject immediately
        abortListener();
      } else {
        options.signal.addEventListener('abort', abortListener, { once: true });
      }
    }
  });
}

/**
 * Schedules a low-priority function to be run during browser idle periods.
 * Provides a simpler interface than `requestIdleCallbackPromise`.
 * Does not return the deadline object.
 *
 * @param callback The function to execute during idle time.
 * @param options Optional configuration including timeout.
 * @returns A function to cancel the scheduled callback, or null if not supported.
 */
export function scheduleIdleTask(
  callback: () => void,
  options?: { timeout?: number }
): (() => void) | null {
  if (!isRequestIdleCallbackSupported()) {
    console.warn('requestIdleCallback is not supported.');
    return null;
  }

  const handle = window.requestIdleCallback(
    () => {
      callback();
    },
    options?.timeout ? { timeout: options.timeout } : undefined
  );

  return () => window.cancelIdleCallback(handle);
}
