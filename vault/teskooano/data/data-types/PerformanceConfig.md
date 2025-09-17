---
aliases: [PerformanceConfig]
tags: [data, types, performance]
type: Interface
package: "@teskooano/data-types"
file: "src/performance.ts"
status: active
---

# PerformanceConfig

Configuration for performance-based geometry optimization and adaptive quality management.

## Overview

The `PerformanceConfig` interface defines configuration options for performance-based optimization throughout the Teskooano engine. It enables adaptive quality management, FPS monitoring, and device-specific optimizations to maintain smooth performance across different hardware capabilities.

## Interface Definition

```typescript
export interface PerformanceConfig {
  targetFPS?: number;
  currentFPS?: number;
  enablePerformanceOptimization?: boolean;
  performanceReductionMultiplier?: number;
  minimumSegments?: number;
  deviceTier?: DeviceTier;
  enableAdaptiveScaling?: boolean;
  distanceReductionFactor?: number;
}
```

## Properties

### FPS Management

#### targetFPS

```typescript
targetFPS?: number
```

Target FPS for performance calculations.

- **Type**: `number`
- **Required**: No
- **Default**: 60
- **Range**: 30-120
- **Usage**: Performance optimization target

#### currentFPS

```typescript
currentFPS?: number
```

Current FPS (will be updated dynamically).

- **Type**: `number`
- **Required**: No
- **Usage**: Real-time performance monitoring

### Optimization Control

#### enablePerformanceOptimization

```typescript
enablePerformanceOptimization?: boolean
```

Whether to enable performance-based segment reduction.

- **Type**: `boolean`
- **Required**: No
- **Default**: `true`
- **Usage**: Global performance optimization toggle

#### performanceReductionMultiplier

```typescript
performanceReductionMultiplier?: number
```

Multiplier for segment reduction when performance is poor.

- **Type**: `number`
- **Required**: No
- **Default**: 0.5
- **Range**: 0.1 to 1.0
- **Usage**: Quality reduction factor (0.5 = 50% reduction)

#### minimumSegments

```typescript
minimumSegments?: number
```

Minimum segments to maintain even under poor performance.

- **Type**: `number`
- **Required**: No
- **Default**: 8
- **Usage**: Quality floor to maintain visual integrity

### Device Classification

#### deviceTier

```typescript
deviceTier?: DeviceTier
```

Device performance tier.

- **Type**: `DeviceTier`
- **Required**: No
- **Values**: `"low"`, `"medium"`, `"high"`, `"cosmic"`
- **Usage**: Hardware-based optimization presets

### Adaptive Features

#### enableAdaptiveScaling

```typescript
enableAdaptiveScaling?: boolean
```

Whether to enable adaptive segment scaling based on object size.

- **Type**: `boolean`
- **Required**: No
- **Default**: `true`
- **Usage**: Size-based quality adjustment

#### distanceReductionFactor

```typescript
distanceReductionFactor?: number
```

Distance-based segment reduction factor.

- **Type**: `number`
- **Required**: No
- **Default**: 0.8
- **Range**: 0.1 to 1.0
- **Usage**: LOD quality reduction with distance

## Usage Examples

### High-End Desktop Configuration

```typescript
const highEndConfig: PerformanceConfig = {
  targetFPS: 60,
  enablePerformanceOptimization: true,
  performanceReductionMultiplier: 0.8, // Minimal reduction
  minimumSegments: 16,
  deviceTier: "cosmic",
  enableAdaptiveScaling: true,
  distanceReductionFactor: 0.9,
};
```

### Medium-End Configuration

```typescript
const mediumConfig: PerformanceConfig = {
  targetFPS: 45,
  enablePerformanceOptimization: true,
  performanceReductionMultiplier: 0.6,
  minimumSegments: 12,
  deviceTier: "medium",
  enableAdaptiveScaling: true,
  distanceReductionFactor: 0.7,
};
```

### Low-End/Mobile Configuration

```typescript
const lowEndConfig: PerformanceConfig = {
  targetFPS: 30,
  enablePerformanceOptimization: true,
  performanceReductionMultiplier: 0.3, // Aggressive reduction
  minimumSegments: 6,
  deviceTier: "low",
  enableAdaptiveScaling: true,
  distanceReductionFactor: 0.5,
};
```

### Performance Monitoring Configuration

```typescript
const monitoringConfig: PerformanceConfig = {
  targetFPS: 60,
  currentFPS: 0, // Will be updated dynamically
  enablePerformanceOptimization: true,
  performanceReductionMultiplier: 0.5,
  minimumSegments: 8,
  deviceTier: "medium",
  enableAdaptiveScaling: true,
  distanceReductionFactor: 0.8,
};

// Update current FPS dynamically
function updatePerformanceMetrics(
  config: PerformanceConfig,
  deltaTime: number,
): void {
  config.currentFPS = 1000 / deltaTime;

  // Adjust optimization based on performance
  if (config.currentFPS < config.targetFPS! * 0.8) {
    // Performance is poor, increase optimization
    config.performanceReductionMultiplier = Math.max(
      0.2,
      config.performanceReductionMultiplier! - 0.1,
    );
  } else if (config.currentFPS > config.targetFPS! * 1.1) {
    // Performance is good, reduce optimization
    config.performanceReductionMultiplier = Math.min(
      1.0,
      config.performanceReductionMultiplier! + 0.05,
    );
  }
}
```

## Device Tier Configurations

### Automatic Device Detection

```typescript
function detectDeviceTier(): DeviceTier {
  // Check for performance.memory (Chrome-specific)
  if ("memory" in performance) {
    const memory = (performance as any).memory;
    const heapSize = memory.usedJSHeapSize / (1024 * 1024); // MB

    if (heapSize > 1000) return "cosmic";
    if (heapSize > 500) return "high";
    if (heapSize > 200) return "medium";
    return "low";
  }

  // Fallback to hardware concurrency
  const cores = navigator.hardwareConcurrency || 4;
  if (cores >= 8) return "high";
  if (cores >= 4) return "medium";
  return "low";
}
```

### Tier-Based Configuration

```typescript
function getConfigForTier(tier: DeviceTier): PerformanceConfig {
  switch (tier) {
    case "cosmic":
      return {
        targetFPS: 120,
        performanceReductionMultiplier: 0.9,
        minimumSegments: 32,
        deviceTier: tier,
        enableAdaptiveScaling: true,
        distanceReductionFactor: 0.95,
      };

    case "high":
      return {
        targetFPS: 60,
        performanceReductionMultiplier: 0.8,
        minimumSegments: 16,
        deviceTier: tier,
        enableAdaptiveScaling: true,
        distanceReductionFactor: 0.85,
      };

    case "medium":
      return {
        targetFPS: 45,
        performanceReductionMultiplier: 0.6,
        minimumSegments: 12,
        deviceTier: tier,
        enableAdaptiveScaling: true,
        distanceReductionFactor: 0.7,
      };

    case "low":
      return {
        targetFPS: 30,
        performanceReductionMultiplier: 0.3,
        minimumSegments: 6,
        deviceTier: tier,
        enableAdaptiveScaling: true,
        distanceReductionFactor: 0.5,
      };
  }
}
```

## Performance Optimization

### Segment Calculation

```typescript
function calculateOptimizedSegments(
  baseSegments: number,
  config: PerformanceConfig,
  distance?: number,
  objectSize?: number,
): number {
  if (!config.enablePerformanceOptimization) {
    return baseSegments;
  }

  let segments = baseSegments;

  // Apply performance reduction
  if (config.currentFPS && config.targetFPS) {
    const performanceRatio = config.currentFPS / config.targetFPS;
    if (performanceRatio < 0.8) {
      segments *= config.performanceReductionMultiplier || 0.5;
    }
  }

  // Apply distance reduction
  if (distance && config.distanceReductionFactor) {
    const distanceFactor = Math.max(0.1, Math.min(1.0, 100 / distance));
    segments *= distanceFactor * config.distanceReductionFactor;
  }

  // Apply adaptive scaling
  if (objectSize && config.enableAdaptiveScaling) {
    const sizeFactor = Math.max(0.5, Math.min(2.0, objectSize / 10));
    segments *= sizeFactor;
  }

  // Ensure minimum segments
  return Math.max(config.minimumSegments || 8, Math.round(segments));
}
```

### Quality Adjustment

```typescript
function adjustQualityForPerformance(
  config: PerformanceConfig,
  currentFPS: number,
): Partial<PerformanceConfig> {
  const targetFPS = config.targetFPS || 60;
  const performanceRatio = currentFPS / targetFPS;

  if (performanceRatio < 0.7) {
    // Poor performance - reduce quality
    return {
      performanceReductionMultiplier: Math.max(
        0.2,
        (config.performanceReductionMultiplier || 0.5) * 0.8,
      ),
      distanceReductionFactor: Math.max(
        0.3,
        (config.distanceReductionFactor || 0.8) * 0.9,
      ),
    };
  } else if (performanceRatio > 1.2) {
    // Good performance - increase quality
    return {
      performanceReductionMultiplier: Math.min(
        1.0,
        (config.performanceReductionMultiplier || 0.5) * 1.1,
      ),
      distanceReductionFactor: Math.min(
        1.0,
        (config.distanceReductionFactor || 0.8) * 1.05,
      ),
    };
  }

  return {}; // No changes needed
}
```

## Integration

### Rendering System

- Segment calculations for geometry optimization
- LOD distance calculations
- Quality level determination

### Physics System

- Update frequency adjustment
- Simulation complexity scaling
- Collision detection optimization

### UI System

- Component rendering optimization
- Animation quality adjustment
- Update frequency control

## Performance Monitoring

### FPS Tracking

```typescript
class PerformanceMonitor {
  private config: PerformanceConfig;
  private frameCount = 0;
  private lastTime = 0;

  constructor(config: PerformanceConfig) {
    this.config = config;
  }

  update(currentTime: number): void {
    this.frameCount++;

    if (currentTime - this.lastTime >= 1000) {
      this.config.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;

      // Adjust configuration based on performance
      const adjustments = adjustQualityForPerformance(
        this.config,
        this.config.currentFPS,
      );
      Object.assign(this.config, adjustments);
    }
  }
}
```

## 🔗 Related

- [[DeviceTier]] - Device performance tier enumeration
- [[PerformanceOptimization]] - Rendering performance settings
- [[SceneManagerOptions]] - Scene manager configuration
- [[@teskooano/renderer-threejs]] - 3D rendering system
