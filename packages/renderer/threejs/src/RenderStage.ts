/**
 * Standardized render pipeline stages.
 * This enum provides type-safe references to all rendering stages in the pipeline.
 */
export enum RenderStage {
  /** Fires before any updates begin */
  BEFORE_UPDATE = "beforeUpdate",
  /** Fires after controls and camera are updated */
  AFTER_CONTROLS_UPDATE = "afterControlsUpdate",
  /** Fires after orbital paths are updated */
  AFTER_ORBITS_UPDATE = "afterOrbitsUpdate",
  /** Fires after 3D objects are updated */
  AFTER_OBJECTS_UPDATE = "afterObjectsUpdate",
  /** Fires after background is updated */
  AFTER_BACKGROUND_UPDATE = "afterBackgroundUpdate",
  /** Fires after grid is updated */
  AFTER_GRID_UPDATE = "afterGridUpdate",
  /** Fires before the main scene render */
  BEFORE_RENDER = "beforeRender",
  /** Fires after the main scene render */
  AFTER_RENDER = "afterRender",
  /** Fires after 2D overlays are rendered */
  AFTER_OVERLAYS_RENDER = "afterOverlaysRender",
  /** Fires after all updates and rendering are complete */
  AFTER_UPDATE = "afterUpdate",
}

/**
 * Standardized payload for render pipeline stage events.
 * All pipeline events emit this consistent structure.
 */
export interface RenderPipelineStagePayload {
  /** The render stage that triggered this event */
  stage: RenderStage;
  /** Time elapsed since the last frame, in seconds */
  deltaTime: number;
  /** Total time elapsed since the loop started, in seconds */
  elapsedTime: number;
  /** The current frame number */
  frameCount: number;
  /** Optional metadata for stage-specific information */
  metadata?: Record<string, unknown>;
}

/**
 * Type guard to check if a string is a valid RenderStage.
 */
export function isRenderStage(value: string): value is RenderStage {
  return Object.values(RenderStage).includes(value as RenderStage);
}

/**
 * Get all render stages in execution order.
 */
export function getRenderStages(): RenderStage[] {
  return [
    RenderStage.BEFORE_UPDATE,
    RenderStage.AFTER_CONTROLS_UPDATE,
    RenderStage.AFTER_ORBITS_UPDATE,
    RenderStage.AFTER_OBJECTS_UPDATE,
    RenderStage.AFTER_BACKGROUND_UPDATE,
    RenderStage.AFTER_GRID_UPDATE,
    RenderStage.BEFORE_RENDER,
    RenderStage.AFTER_RENDER,
    RenderStage.AFTER_OVERLAYS_RENDER,
    RenderStage.AFTER_UPDATE,
  ];
}
