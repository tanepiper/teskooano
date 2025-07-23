# Curved Trails System

The Teskooano curved trails system provides advanced trail interpolation for creating more realistic and visually appealing orbital paths. Instead of simple linear interpolation between sampled points, the system now supports various curve types optimized for different celestial objects and motion patterns.

## Overview

The curved trails system consists of several key components:

- **TrailManager**: Enhanced with curve configuration support
- **TrailCurveInterpolator**: Utility class for curve interpolation algorithms
- **TrailCurveType**: Enum defining different curve interpolation types
- **TrailCurveConfig**: Interface for configuring curve parameters

## Curve Types

### 1. Linear Trails (`TrailCurveType.Linear`)

Simple linear interpolation between points. No curve smoothing applied.

```typescript
const config: TrailCurveConfig = {
  type: TrailCurveType.Linear,
};
```

**Best for:**

- Fast-moving objects where smooth curves aren't needed
- Performance-critical scenarios
- Debug visualization

### 2. Smooth Trails (`TrailCurveType.Smooth`)

Uses Catmull-Rom spline interpolation for smooth curves between points.

```typescript
const config: TrailCurveConfig = {
  type: TrailCurveType.Smooth,
  tension: 0.5, // Catmull-Rom tension (0-1)
  segments: 12, // Curve segments per point pair
};
```

**Best for:**

- General-purpose smooth trails
- Objects with moderate velocity changes
- Visual appeal without orbital-specific optimization

### 3. Orbital Trails (`TrailCurveType.Orbital`)

Orbital-aware curve interpolation that accounts for gravitational motion patterns.

```typescript
const config: TrailCurveConfig = {
  type: TrailCurveType.Orbital,
  tension: 0.4,
  segments: 16,
  smoothing: 0.4, // Additional orbital smoothing
};
```

**Best for:**

- Planets and moons in orbital motion
- Objects following gravitational trajectories
- Realistic orbital visualization

### 4. Adaptive Trails (`TrailCurveType.Adaptive`)

Automatically chooses the best curve type based on object properties and trail characteristics.

```typescript
const config: TrailCurveConfig = {
  type: TrailCurveType.Adaptive,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
  adaptiveThreshold: 8, // Minimum points for curve interpolation
};
```

**Best for:**

- Mixed object types in the same system
- Automatic optimization based on context
- Recommended default configuration

## Configuration Parameters

### TrailCurveConfig Interface

```typescript
interface TrailCurveConfig {
  type: TrailCurveType;
  tension?: number; // Catmull-Rom tension (0-1, default: 0.5)
  segments?: number; // Curve segments per point pair (default: 8)
  smoothing?: number; // Smoothing factor (0-1, default: 0.3)
  adaptiveThreshold?: number; // Minimum points for adaptive smoothing (default: 10)
}
```

### Parameter Guidelines

| Parameter           | Range     | Default | Description                                                  |
| ------------------- | --------- | ------- | ------------------------------------------------------------ |
| `tension`           | 0.0 - 1.0 | 0.5     | Controls curve tightness. Lower = smoother, Higher = tighter |
| `segments`          | 4 - 50    | 8       | Number of interpolated points between each original point    |
| `smoothing`         | 0.0 - 1.0 | 0.3     | Additional smoothing for orbital motion                      |
| `adaptiveThreshold` | 5 - 20    | 10      | Minimum points before applying curve interpolation           |

## Usage Examples

### Basic Setup

```typescript
import {
  TrailManager,
  TrailCurveType,
  TrailCurveConfig,
} from "@teskooano/renderer-threejs-orbits";

// Create trail manager with curved trails
const trailManager = new TrailManager(objectManager, {
  type: TrailCurveType.Adaptive,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
});
```

### Dynamic Configuration Changes

```typescript
// Switch to orbital trails for planets
trailManager.setCurveConfig({
  type: TrailCurveType.Orbital,
  tension: 0.4,
  segments: 16,
  smoothing: 0.4,
});

// Switch to smooth trails for stars
trailManager.setCurveConfig({
  type: TrailCurveType.Smooth,
  tension: 0.7,
  segments: 12,
});
```

### Object-Specific Optimization

```typescript
import { TrailCurveInterpolator } from "@teskooano/renderer-threejs-orbits";

// Create type-optimized curves for different objects
const planetPoints = TrailCurveInterpolator.createTypeOptimizedCurve(
  rawPoints,
  "PLANET",
  config,
);

const starPoints = TrailCurveInterpolator.createTypeOptimizedCurve(
  rawPoints,
  "STAR",
  config,
);

const asteroidPoints = TrailCurveInterpolator.createTypeOptimizedCurve(
  rawPoints,
  "ASTEROID",
  config,
);
```

### Velocity-Aware Curves

```typescript
// Create curves that adapt to velocity changes
const velocityAwarePoints = TrailCurveInterpolator.createVelocityAwareCurve(
  points,
  config,
  velocities,
);
```

## Performance Considerations

### Curve Quality vs Performance

| Curve Type | Performance Impact | Visual Quality | Recommended Use                |
| ---------- | ------------------ | -------------- | ------------------------------ |
| Linear     | Lowest             | Basic          | Performance-critical scenarios |
| Smooth     | Low                | Good           | General use                    |
| Orbital    | Medium             | Excellent      | Orbital visualization          |
| Adaptive   | Low-Medium         | Excellent      | Mixed object types             |

### Optimization Tips

1. **Use appropriate segment counts**: More segments = smoother curves but higher performance cost
2. **Adjust tension based on motion**: Lower tension for smooth motion, higher for erratic motion
3. **Consider object type**: Use orbital curves for planets, smooth for stars, linear for fast objects
4. **Monitor performance**: Use `getPerformanceStats()` to track trail system performance

## Advanced Features

### Elliptical Curve Fitting

For objects following elliptical orbits, the system can apply elliptical correction:

```typescript
const ellipticalPoints = TrailCurveInterpolator.createEllipticalCurve(
  points,
  config,
);
```

### Custom Curve Functions

Create custom curve interpolation using the `TrailCurveInterpolator` directly:

```typescript
// Custom curve function
const customCurve = (t: number) => {
  return new THREE.Vector3(
    Math.cos(t * Math.PI * 2) * 10,
    Math.sin(t * Math.PI * 2) * 10,
    0,
  );
};

const customPoints = TrailCurveInterpolator.createCustomCurve(customCurve, 50);
```

## Integration with Existing Systems

The curved trails system is designed to be a drop-in replacement for the existing trail system. Existing code will continue to work with linear trails by default, and you can gradually enable curved trails by updating the configuration.

### Migration Guide

1. **Update TrailManager instantiation**:

   ```typescript
   // Before
   const trailManager = new TrailManager(objectManager);

   // After
   const trailManager = new TrailManager(objectManager, {
     type: TrailCurveType.Adaptive,
   });
   ```

2. **Add curve configuration methods**:

   ```typescript
   // Set curve configuration
   trailManager.setCurveConfig(config);

   // Get current configuration
   const currentConfig = trailManager.getCurveConfig();
   ```

3. **Monitor performance**:
   ```typescript
   const stats = trailManager.getPerformanceStats();
   console.log("Trail performance:", stats);
   ```

## Troubleshooting

### Common Issues

1. **Trails appear jagged**: Increase `segments` parameter
2. **Trails too smooth**: Increase `tension` parameter
3. **Performance issues**: Reduce `segments` or use `TrailCurveType.Linear`
4. **Memory usage high**: Reduce trail history length or use adaptive threshold

### Debug Configuration

```typescript
// Debug configuration for development
const debugConfig: TrailCurveConfig = {
  type: TrailCurveType.Linear, // Start with linear for debugging
  adaptiveThreshold: 5, // Lower threshold for testing
};
```

## API Reference

### TrailManager Methods

- `setCurveConfig(config: TrailCurveConfig): void`
- `getCurveConfig(): TrailCurveConfig`
- `updateTrail(objectId: string, object: RenderableCelestialObject, maxHistoryLength: number, updateGeometry: boolean): void`

### TrailCurveInterpolator Static Methods

- `interpolate(points: THREE.Vector3[], config: TrailCurveConfig): THREE.Vector3[]`
- `createSmoothCurve(points: THREE.Vector3[], config: TrailCurveConfig): THREE.Vector3[]`
- `createOrbitalCurve(points: THREE.Vector3[], config: TrailCurveConfig): THREE.Vector3[]`
- `createAdaptiveCurve(points: THREE.Vector3[], config: TrailCurveConfig): THREE.Vector3[]`
- `createTypeOptimizedCurve(points: THREE.Vector3[], objectType: string, config: TrailCurveConfig): THREE.Vector3[]`
- `createVelocityAwareCurve(points: THREE.Vector3[], config: TrailCurveConfig, velocities?: THREE.Vector3[]): THREE.Vector3[]`
- `createEllipticalCurve(points: THREE.Vector3[], config: TrailCurveConfig): THREE.Vector3[]`

For more detailed examples and advanced usage patterns, see the `CurvedTrailsDemo` class in the examples directory.
