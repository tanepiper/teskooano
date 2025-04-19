import { Observable } from 'rxjs';
import { share, repeat, map } from 'rxjs/operators';

/**
 * Callback function type for the animation loop.
 * Receives the high-resolution timestamp provided by `requestAnimationFrame`.
 */
export type AnimationLoopCallback = (timestamp: DOMHighResTimeStamp) => void;

/**
 * Interface for the controls returned by `createAnimationLoop`.
 */
export interface AnimationLoopControls {
  /** Starts the animation loop. Does nothing if already running. */
  start: () => void;
  /** Stops the animation loop. Does nothing if already stopped. */
  stop: () => void;
  /** Indicates whether the loop is currently running. */
  isRunning: () => boolean;
}

/**
 * Creates a controllable animation loop using `requestAnimationFrame`.
 *
 * @param callback The function to call on each animation frame.
 * @returns Controls to start, stop, and check the status of the loop.
 */
export function createAnimationLoop(
  callback: AnimationLoopCallback
): AnimationLoopControls {
  let frameId: number | null = null;

  const loop = (timestamp: DOMHighResTimeStamp) => {
    callback(timestamp);
    // Continue the loop only if frameId is still set (i.e., not stopped)
    if (frameId !== null) {
      frameId = requestAnimationFrame(loop);
    }
  };

  /**
   * Starts the animation loop.
   */
  const start = () => {
    if (frameId === null && typeof requestAnimationFrame !== 'undefined') {
      frameId = requestAnimationFrame(loop);
    } else if (typeof requestAnimationFrame === 'undefined') {
      console.warn(
        'requestAnimationFrame is not supported in this environment.'
      );
    }
  };

  /**
   * Stops the animation loop, takes an optional cleanup function to run after stopping.
   */
  const stop = (cleanup?: () => void) => {
    if (frameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(frameId);
      frameId = null;
    } else if (frameId !== null && typeof cancelAnimationFrame === 'undefined') {
      console.warn(
        'cancelAnimationFrame is not supported in this environment.'
      );
      // Attempt to nullify frameId anyway to prevent loop continuation
      frameId = null;
    }
    cleanup?.();
  };

  /**
   * Checks if the animation loop is currently running.
   */
  const isRunning = () => frameId !== null;

  return { start, stop, isRunning };
}

/**
 * An RxJS Observable that emits animation frame timestamps.
 * Uses requestAnimationFrame for scheduling emissions.
 * The observable is shared and replays the last frame timestamp.
 */
export const animationFrames$ = new Observable<DOMHighResTimeStamp>((observer) => {
  let frameId: number | null = null;

  const callback = (timestamp: DOMHighResTimeStamp) => {
    observer.next(timestamp);
    // Schedule next frame only if the observable is still subscribed
    if (!observer.closed) {
      frameId = requestAnimationFrame(callback);
    }
  };

  // Start the loop
  if (typeof requestAnimationFrame !== 'undefined') {
    frameId = requestAnimationFrame(callback);
  } else {
    console.warn(
      'requestAnimationFrame is not supported, animationFrames$ will not emit.'
    );
    observer.complete(); // Complete if rAF not supported
  }

  // Cleanup function to cancel the animation frame on unsubscribe
  return () => {
    if (frameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(frameId);
    }
    frameId = null;
  };
}).pipe(
  share() // Share the underlying rAF loop among subscribers
  // No need for repeat() here, the rAF loop handles continuation
  // No need for shareReplay - typically you want the *current* frame time
); 