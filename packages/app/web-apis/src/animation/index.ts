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

  const start = () => {
    if (frameId === null && typeof requestAnimationFrame !== 'undefined') {
      frameId = requestAnimationFrame(loop);
    } else if (typeof requestAnimationFrame === 'undefined') {
      console.warn(
        'requestAnimationFrame is not supported in this environment.'
      );
    }
  };

  const stop = () => {
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
  };

  const isRunning = () => frameId !== null;

  return { start, stop, isRunning };
} 