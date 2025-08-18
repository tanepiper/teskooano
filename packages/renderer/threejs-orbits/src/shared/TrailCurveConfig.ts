/**
 * Trail curve interpolation types for different visual styles
 */
export enum TrailCurveType {
  Linear = "linear", // Simple linear interpolation
  Smooth = "smooth", // Catmull-Rom spline smoothing
  Orbital = "orbital", // Orbital-aware curve fitting
  Adaptive = "adaptive", // Automatically choose based on object type
}

/**
 * Configuration for trail curve interpolation
 */
export interface TrailCurveConfig {
  type: TrailCurveType;
  tension?: number; // Catmull-Rom tension (0-1, default: 0.5)
  segments?: number; // Number of curve segments per point pair
  smoothing?: number; // Smoothing factor (0-1, default: 0.3)
  adaptiveThreshold?: number; // Minimum points for adaptive smoothing
}
