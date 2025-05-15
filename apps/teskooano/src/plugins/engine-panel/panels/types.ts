import type { Vector3 } from "three";
import type { DockviewController } from "../../../core/controllers/dockview";

/**
 * The parameters for the CompositeEnginePanel
 */
export interface CompositePanelParams {
  /**
   * The title of the panel
   */
  title?: string;
  /**
   * The controller for the panel
   */
  dockviewController?: DockviewController;
}

/**
 * Represents the internal view state of an engine panel, including camera,
 * focus, and display options.
 */
export interface CompositeEngineState {
  /**
   * The position of the camera
   */
  cameraPosition: Vector3;
  /**
   * The target of the camera
   */
  cameraTarget: Vector3;
  /**
   * The focused object ID
   */
  focusedObjectId: string | null;
  /**
   * Whether to show the 5AU grid
   */
  showGrid?: boolean;
  /**
   * Whether to show the labels for celestial bodies
   */
  showCelestialLabels?: boolean;
  /**
   * Whether to show the AU markers (distance markers) at 1-100AU
   */
  showAuMarkers?: boolean;
  /**
   * Whether to show the debris effects
   * NOTE: currently this is buggy and kill performance, which is why it's behind a feature flag
   */
  showDebrisEffects?: boolean;
  /**
   * Whether to show orbit lines for celestial bodies.
   * Defaults to true.
   */
  showOrbitLines?: boolean;
  /**
   * Whether to show the debug mode
   * NOTE: This is still a work in progress and the camera controls are not yet fully integrated
   */
  isDebugMode?: boolean;
  /**
   * The Field of View (FOV)
   */
  fov?: number;
}
