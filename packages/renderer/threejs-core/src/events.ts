import { Subject } from "rxjs";
import type { RendererStats } from "./AnimationLoop";
import type { PerformanceOptimization } from "@teskooano/data-types";

/**
 * A centralized, type-safe event bus for core renderer events, powered by RxJS.
 *
 * This provides a consistent, observable-based mechanism for internal communication
 * between the various renderer sub-modules.
 */
export const rendererEvents = {
  /**
   * Fires when the performance statistics are updated.
   * @event
   */
  statsUpdated$: new Subject<RendererStats>(),
  /**
   * Fires when performance optimization settings change.
   * @event
   */
  performanceOptimizationChanged$: new Subject<PerformanceOptimization>(),
};
