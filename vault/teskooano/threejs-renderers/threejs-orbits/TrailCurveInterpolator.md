---
name: "TrailCurveInterpolator"
description: "Advanced curve interpolation for realistic orbital visualization"
package: "@teskooano/renderer-threejs-orbits"
dependencies: ["three"]
classes:
  [
    "THREE.Vector3",
    "THREE.CatmullRomCurve3",
    "THREE.CubicBezierCurve3",
    "THREE.QuadraticBezierCurve3",
    "THREE.SplineCurve3",
  ]
functions:
  [
    "interpolate",
    "interpolateLinear",
    "interpolateSmooth",
    "interpolateOrbital",
    "interpolateAdaptive",
    "simplifyTrail",
    "calculateTension",
    "calculateSegments",
    "calculateSmoothing",
  ]
constants:
  [
    "TRAIL_QUALITY_HIGH",
    "TRAIL_QUALITY_MEDIUM",
    "TRAIL_QUALITY_LOW",
    "CURVE_TENSION_DEFAULT",
    "CURVE_SEGMENTS_DEFAULT",
    "CURVE_SMOOTHING_DEFAULT",
  ]
types:
  [
    "TrailCurveType",
    "TrailCurveConfig",
    "TrailQuality",
    "InterpolationConfig",
    "SmoothingConfig",
    "AdaptiveConfig",
    "TensionConfig",
    "SegmentsConfig",
  ]
---

# TrailCurveInterpolator

Advanced curve interpolation utility for creating smooth, realistic orbital trails and predictions using various interpolation algorithms.

## 🎯 Purpose

`TrailCurveInterpolator` provides sophisticated curve interpolation for orbital visualization, supporting multiple interpolation types including linear, smooth (Catmull-Rom), orbital-aware, and adaptive algorithms.

## 🚀 Core Features

### Interpolation Types

```typescript
enum TrailCurveType {
  Linear = "linear", // Simple linear interpolation
  Smooth = "smooth", // Catmull-Rom spline smoothing
  Orbital = "orbital", // Orbital-aware curve fitting
  Adaptive = "adaptive", // Automatically choose based on object type
}
```

### Configuration Options

- **Tension**: Controls curve tightness (0-1)
- **Segments**: Number of curve segments per point pair
- **Smoothing**: Smoothing factor for curve interpolation
- **Adaptive Threshold**: Minimum points for adaptive smoothing

## 🔧 Key Methods

### Main Interpolation

```typescript
interpolate(positions: THREE.Vector3[], config: TrailCurveConfig): THREE.Vector3[]
```

### Specialized Interpolators

- `interpolateLinear()`: Simple linear interpolation
- `interpolateSmooth()`: Catmull-Rom spline smoothing
- `interpolateOrbital()`: Orbital-aware curve fitting
- `interpolateAdaptive()`: Automatic type selection

## 🎨 Usage Examples

```typescript
const interpolator = new TrailCurveInterpolator();

// Smooth interpolation
const smoothTrail = interpolator.interpolate(positions, {
  type: TrailCurveType.Smooth,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
});

// Orbital-aware interpolation
const orbitalTrail = interpolator.interpolate(positions, {
  type: TrailCurveType.Orbital,
  tension: 0.3,
  segments: 4,
  smoothing: 0.2,
});
```

## 📊 Performance Features

- **Efficient Algorithms**: Optimized interpolation algorithms
- **Memory Management**: Reuses buffer objects
- **Quality Control**: Configurable quality levels
- **Adaptive Processing**: Automatic quality adjustment
