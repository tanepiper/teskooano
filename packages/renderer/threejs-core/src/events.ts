import { Subject } from "rxjs";
import type { RendererStats } from "./AnimationLoop";

/** Payload for the `beforeRender` and `afterRender` events. */
export interface RenderLoopPayload {
  /** Time elapsed since the last frame, in seconds. */
  deltaTime: number;
  /** Total time elapsed since the loop started, in seconds. */
  elapsedTime: number;
}

/** Payload for the `resize` event. */
export interface ResizePayload {
  /** The new width of the render viewport. */
  width: number;
  /** The new height of the render viewport. */
  height: number;
}

/**
 * A centralized, type-safe event bus for core renderer events, powered by RxJS.
 *
 * This provides a consistent, observable-based mechanism for internal communication
 * between the various renderer sub-modules.
 */
export const rendererEvents = {
  /**
   * Fires at the beginning of each animation frame, before any updates.
   * @event
   */
  beforeRender$: new Subject<RenderLoopPayload>(),
  /**
   * Fires at the end of each animation frame, after the scene has been rendered.
   * @event
   */
  afterRender$: new Subject<RenderLoopPayload>(),
  /**
   * Fires when the renderer viewport is resized.
   * @event
   */
  resize$: new Subject<ResizePayload>(),
  /**
   * Fires when the renderer's main `dispose` method is called.
   * Provides a global signal for all modules to clean up resources.
   * @event
   */
  dispose$: new Subject<void>(),
  /**
   * Fires when the performance statistics are updated.
   * @event
   */
  statsUpdated$: new Subject<RendererStats>(),
};
