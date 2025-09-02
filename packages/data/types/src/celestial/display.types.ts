export interface CelestialDisplayOptions {
  /**
   * If the celestial object should have a label displayed.
   */
  showLabels?: boolean;

  /**
   * If the celestial object should have a trail displayed.
   */
  showTrail?: boolean;

  /**
   * If the celestial object should have an orbit displayed.
   */
  showOrbit?: boolean;

  /**
   * If the celestial object should have a prediction displayed.
   */
  showPrediction?: boolean;

  /**
   * If the celestial object should be in debug mode.
   */
  showDebug?: boolean;
}

/**
 * Default display options for celestial objects.
 * These values are used when no specific options are provided.
 */
export const DEFAULT_CELESTIAL_DISPLAY_OPTIONS: Required<CelestialDisplayOptions> =
  {
    showLabels: true,
    showTrail: false,
    showOrbit: false,
    showPrediction: false,
    showDebug: false,
  };
