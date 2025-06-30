import type { AuMarkerManager } from "../managers/AuMarkerManager";
import type { Layer2DManager } from "../Layer2DManager";
import type { LabelVisibilityConfig } from "../layers";

/**
 * Configuration options for the entire label system at initialization.
 */
export interface LabelSystemOptions {
  /**
   * Initial visibility of the AU distance markers.
   * @default true
   */
  showAuMarkers?: boolean;

  /**
   * Configuration for celestial body labels.
   */
  labelConfig?: LabelVisibilityConfig;
}

/**
 * The main object returned by the label system initializer.
 * It contains managers for different label types.
 */
export interface LabelSystem {
  /**
   * Manages all 2D layers that are rendered using the CSS2DRenderer.
   */
  css2DManager: Layer2DManager;
  /**
   * Manages the visibility and state of AU distance markers.
   */
  auMarkerManager: AuMarkerManager;
}
