/**
 * Interface for the object returned by `createWorker`.
 */
export interface WorkerControls {
  /** The underlying Worker instance. */
  worker: Worker;
  /** Terminates the worker. */
  terminate: () => void;
}

/**
 * Creates a new Web Worker.
 * Provides basic error handling and a termination function.
 *
 * Note: This is a basic helper. For more complex worker interactions
 * (e.g., Promise-based messaging, shared workers), consider more
 * specialized libraries or custom implementations.
 *
 * @param scriptURL The path to the worker script.
 * @param options Optional Worker options.
 * @returns An object containing the worker instance and a terminate function, or null if Workers are not supported.
 */
export function createWorker(
  scriptURL: string | URL,
  options?: WorkerOptions,
): WorkerControls | null {
  if (typeof Worker === "undefined") {
    console.warn("Web Workers are not supported in this environment.");
    return null;
  }

  try {
    const worker = new Worker(scriptURL, options);

    worker.onerror = (event) => {
      console.error("Error in Web Worker:", event.message, event);
      // Optionally, terminate the worker on error or implement retry logic
      // worker.terminate();
    };

    // Basic message logging (can be removed or customized)
    worker.onmessage = (event) => {
      console.log("Message received from worker:", event.data);
    };

    const terminate = () => {
      worker.terminate();
    };

    return { worker, terminate };
  } catch (error) {
    console.error("Failed to create Web Worker:", error);
    return null;
  }
}
