---
aliases: [TrailQuality]
tags: [data, types, rendering, trails]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/rendering.types.ts"
status: active
---

# TrailQuality

Defines the quality levels for trail rendering in the trajectory visualization system.

## Overview

The `TrailQuality` enum provides standardized quality levels for rendering celestial object trails and trajectory history. It enables performance optimization by adjusting the detail level of trail rendering based on system capabilities and user preferences.

## Enum Definition

```typescript
export enum TrailQuality {
  Low = "low",
  Medium = "medium",
  High = "high",
}
```

## Quality Levels

### Low

```typescript
Low = "low";
```

Basic trail rendering with minimal detail.

**Characteristics:**

- **Point Count**: 50-100 points
- **Update Frequency**: Every 10 frames
- **Smoothing**: Basic linear interpolation
- **Memory Usage**: Minimal
- **Performance**: Best performance

**Usage:**

- Low-end devices
- Many simultaneous trails
- Performance-critical scenarios

### Medium

```typescript
Medium = "medium";
```

Balanced trail rendering with moderate detail.

**Characteristics:**

- **Point Count**: 200-500 points
- **Update Frequency**: Every 5 frames
- **Smoothing**: Catmull-Rom spline interpolation
- **Memory Usage**: Moderate
- **Performance**: Good balance

**Usage:**

- Standard desktop systems
- Normal viewing scenarios
- Default quality setting

### High

```typescript
High = "high";
```

High-detail trail rendering with maximum quality.

**Characteristics:**

- **Point Count**: 1000+ points
- **Update Frequency**: Every frame
- **Smoothing**: Advanced spline interpolation with adaptive detail
- **Memory Usage**: High
- **Performance**: Requires good hardware

**Usage:**

- High-end systems
- Scientific visualization
- Close-up detailed viewing

## Usage Examples

### Quality-Based Configuration

```typescript
import { TrailQuality } from "@teskooano/data-types";

function getTrailConfig(quality: TrailQuality): {
  maxPoints: number;
  updateInterval: number;
  smoothing: string;
  lineWidth: number;
} {
  switch (quality) {
    case TrailQuality.Low:
      return {
        maxPoints: 100,
        updateInterval: 10,
        smoothing: "linear",
        lineWidth: 1.0,
      };

    case TrailQuality.Medium:
      return {
        maxPoints: 300,
        updateInterval: 5,
        smoothing: "catmull-rom",
        lineWidth: 1.5,
      };

    case TrailQuality.High:
      return {
        maxPoints: 1000,
        updateInterval: 1,
        smoothing: "adaptive-spline",
        lineWidth: 2.0,
      };
  }
}
```

### Performance-Based Selection

```typescript
function selectTrailQuality(fps: number, objectCount: number): TrailQuality {
  if (fps < 30 || objectCount > 50) {
    return TrailQuality.Low;
  } else if (fps < 45 || objectCount > 20) {
    return TrailQuality.Medium;
  } else {
    return TrailQuality.High;
  }
}
```

### Device-Based Selection

```typescript
function getTrailQualityForDevice(deviceTier: DeviceTier): TrailQuality {
  switch (deviceTier) {
    case "low":
      return TrailQuality.Low;
    case "medium":
      return TrailQuality.Medium;
    case "high":
    case "cosmic":
      return TrailQuality.High;
  }
}
```

### Dynamic Quality Adjustment

```typescript
class TrailQualityManager {
  private currentQuality: TrailQuality = TrailQuality.Medium;
  private frameCount = 0;
  private totalFrameTime = 0;

  updateQuality(deltaTime: number, objectCount: number): TrailQuality {
    this.frameCount++;
    this.totalFrameTime += deltaTime;

    // Calculate average FPS every 60 frames
    if (this.frameCount >= 60) {
      const avgFPS = 60000 / this.totalFrameTime;
      this.currentQuality = selectTrailQuality(avgFPS, objectCount);

      this.frameCount = 0;
      this.totalFrameTime = 0;
    }

    return this.currentQuality;
  }
}
```

## Integration

### Trail Rendering System

- Controls trail detail level
- Affects memory usage and performance
- Enables adaptive quality management

### Performance System

- Used by performance optimization algorithms
- Enables automatic quality adjustment
- Supports device-specific presets

### User Preferences

- Allows user control over visual quality
- Enables performance vs. quality trade-offs
- Supports accessibility requirements

## Performance Impact

### Memory Usage by Quality

```typescript
function estimateTrailMemoryUsage(
  quality: TrailQuality,
  objectCount: number,
): number {
  const config = getTrailConfig(quality);
  const bytesPerPoint = 12; // 3 floats (x, y, z)

  return objectCount * config.maxPoints * bytesPerPoint;
}
```

### Performance Scaling

```typescript
function getPerformanceMultiplier(quality: TrailQuality): number {
  switch (quality) {
    case TrailQuality.Low:
      return 1.0; // Baseline performance
    case TrailQuality.Medium:
      return 0.7; // 30% performance cost
    case TrailQuality.High:
      return 0.4; // 60% performance cost
  }
}
```

## 🔗 Related

- [[RenderableCelestialObject]] - Objects that can have trails
- [[PerformanceConfig]] - Performance configuration that affects trail quality
- [[DeviceTier]] - Device performance tiers for quality selection
- [[@teskooano/renderer-threejs-orbits]] - Trail rendering system
