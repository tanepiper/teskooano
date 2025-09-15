---
aliases: [DeviceTier]
tags: [data, types, performance, device]
type: Type
package: "@teskooano/data-types"
file: "src/performance.ts"
status: active
---

# DeviceTier

Represents the performance tier of a device based on hardware capabilities for automatic performance optimization.

## Overview

The `DeviceTier` type provides a classification system for device performance capabilities. It enables automatic performance optimization and user-configurable quality settings based on hardware characteristics.

## Type Definition

```typescript
export type DeviceTier = "low" | "medium" | "high" | "cosmic";
```

## Device Tiers

### low

```typescript
"low";
```

Basic hardware capabilities.

**Characteristics:**

- **CPU**: 2-4 cores, lower clock speeds
- **Memory**: 4-8 GB RAM
- **GPU**: Integrated graphics or entry-level discrete
- **Target FPS**: 30 FPS
- **Quality**: Reduced visual effects

**Optimizations:**

- Minimal particle counts
- Reduced geometry detail
- Simplified shaders
- Lower resolution textures
- Disabled advanced effects

### medium

```typescript
"medium";
```

Moderate hardware capabilities.

**Characteristics:**

- **CPU**: 4-8 cores, moderate clock speeds
- **Memory**: 8-16 GB RAM
- **GPU**: Mid-range discrete graphics
- **Target FPS**: 45 FPS
- **Quality**: Balanced visual effects

**Optimizations:**

- Moderate particle counts
- Standard geometry detail
- Standard shaders
- Medium resolution textures
- Selective advanced effects

### high

```typescript
"high";
```

High-end hardware capabilities.

**Characteristics:**

- **CPU**: 6-12+ cores, high clock speeds
- **Memory**: 16-32 GB RAM
- **GPU**: High-end discrete graphics
- **Target FPS**: 60 FPS
- **Quality**: Full visual effects

**Optimizations:**

- High particle counts
- Detailed geometry
- Advanced shaders
- High resolution textures
- Most advanced effects enabled

### cosmic

```typescript
"cosmic";
```

Maximum hardware capabilities.

**Characteristics:**

- **CPU**: 8-16+ cores, maximum clock speeds
- **Memory**: 32+ GB RAM
- **GPU**: Enthusiast/professional graphics
- **Target FPS**: 120+ FPS
- **Quality**: Maximum visual effects

**Optimizations:**

- Maximum particle counts
- Highest geometry detail
- Most advanced shaders
- Highest resolution textures
- All advanced effects enabled

## Usage Examples

### Automatic Detection

```typescript
import { DeviceTier } from "@teskooano/data-types";

function detectDeviceTier(): DeviceTier {
  // Check for Chrome's performance.memory API
  if ("memory" in performance) {
    const memory = (performance as any).memory;
    const heapSizeMB = memory.usedJSHeapSize / (1024 * 1024);

    if (heapSizeMB > 1000) return "cosmic";
    if (heapSizeMB > 500) return "high";
    if (heapSizeMB > 200) return "medium";
    return "low";
  }

  // Fallback to hardware concurrency
  const cores = navigator.hardwareConcurrency || 4;
  if (cores >= 12) return "cosmic";
  if (cores >= 8) return "high";
  if (cores >= 4) return "medium";
  return "low";
}
```

### GPU Detection

```typescript
function detectGPUTier(): DeviceTier {
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (!gl) return "low";

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (!debugInfo) return "medium";

  const renderer = gl
    .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    .toLowerCase();

  // High-end GPUs
  if (
    renderer.includes("rtx") ||
    renderer.includes("rx 6") ||
    renderer.includes("rx 7")
  ) {
    return "cosmic";
  }

  // Mid-high GPUs
  if (
    renderer.includes("gtx 16") ||
    renderer.includes("gtx 20") ||
    renderer.includes("rx 5")
  ) {
    return "high";
  }

  // Mid-range GPUs
  if (
    renderer.includes("gtx") ||
    renderer.includes("rx") ||
    renderer.includes("radeon")
  ) {
    return "medium";
  }

  // Integrated or unknown
  return "low";
}
```

### Combined Detection

```typescript
function detectOverallDeviceTier(): DeviceTier {
  const cpuTier = detectDeviceTier();
  const gpuTier = detectGPUTier();

  // Take the lower of the two tiers
  const tiers: DeviceTier[] = ["low", "medium", "high", "cosmic"];
  const cpuIndex = tiers.indexOf(cpuTier);
  const gpuIndex = tiers.indexOf(gpuTier);

  return tiers[Math.min(cpuIndex, gpuIndex)];
}
```

### Quality Presets

```typescript
function getQualityPreset(tier: DeviceTier): {
  particleCount: number;
  geometryDetail: number;
  shaderComplexity: number;
  textureResolution: number;
  advancedEffects: boolean;
} {
  switch (tier) {
    case "low":
      return {
        particleCount: 1000,
        geometryDetail: 0.3,
        shaderComplexity: 0.2,
        textureResolution: 512,
        advancedEffects: false,
      };

    case "medium":
      return {
        particleCount: 5000,
        geometryDetail: 0.6,
        shaderComplexity: 0.5,
        textureResolution: 1024,
        advancedEffects: true,
      };

    case "high":
      return {
        particleCount: 20000,
        geometryDetail: 0.8,
        shaderComplexity: 0.8,
        textureResolution: 2048,
        advancedEffects: true,
      };

    case "cosmic":
      return {
        particleCount: 100000,
        geometryDetail: 1.0,
        shaderComplexity: 1.0,
        textureResolution: 4096,
        advancedEffects: true,
      };
  }
}
```

### Performance Configuration

```typescript
function createPerformanceConfig(tier: DeviceTier): PerformanceConfig {
  const preset = getQualityPreset(tier);

  switch (tier) {
    case "low":
      return {
        targetFPS: 30,
        enablePerformanceOptimization: true,
        performanceReductionMultiplier: 0.3,
        minimumSegments: 6,
        deviceTier: tier,
        enableAdaptiveScaling: true,
        distanceReductionFactor: 0.5,
      };

    case "medium":
      return {
        targetFPS: 45,
        enablePerformanceOptimization: true,
        performanceReductionMultiplier: 0.6,
        minimumSegments: 12,
        deviceTier: tier,
        enableAdaptiveScaling: true,
        distanceReductionFactor: 0.7,
      };

    case "high":
      return {
        targetFPS: 60,
        enablePerformanceOptimization: true,
        performanceReductionMultiplier: 0.8,
        minimumSegments: 16,
        deviceTier: tier,
        enableAdaptiveScaling: true,
        distanceReductionFactor: 0.85,
      };

    case "cosmic":
      return {
        targetFPS: 120,
        enablePerformanceOptimization: false, // No optimization needed
        performanceReductionMultiplier: 1.0,
        minimumSegments: 32,
        deviceTier: tier,
        enableAdaptiveScaling: false,
        distanceReductionFactor: 1.0,
      };
  }
}
```

### Dynamic Tier Adjustment

```typescript
class DeviceTierManager {
  private currentTier: DeviceTier;
  private performanceHistory: number[] = [];

  constructor() {
    this.currentTier = detectOverallDeviceTier();
  }

  updateTier(currentFPS: number, targetFPS: number): DeviceTier {
    this.performanceHistory.push(currentFPS);

    // Keep last 120 frames (2 seconds at 60 FPS)
    if (this.performanceHistory.length > 120) {
      this.performanceHistory.shift();
    }

    const avgFPS =
      this.performanceHistory.reduce((a, b) => a + b, 0) /
      this.performanceHistory.length;
    const performanceRatio = avgFPS / targetFPS;

    if (performanceRatio < 0.7) {
      // Downgrade tier
      this.currentTier = this.downgradeTier(this.currentTier);
    } else if (performanceRatio > 1.3) {
      // Upgrade tier
      this.currentTier = this.upgradeTier(this.currentTier);
    }

    return this.currentTier;
  }

  private downgradeTier(tier: DeviceTier): DeviceTier {
    switch (tier) {
      case "cosmic":
        return "high";
      case "high":
        return "medium";
      case "medium":
        return "low";
      case "low":
        return "low";
    }
  }

  private upgradeTier(tier: DeviceTier): DeviceTier {
    switch (tier) {
      case "low":
        return "medium";
      case "medium":
        return "high";
      case "high":
        return "cosmic";
      case "cosmic":
        return "cosmic";
    }
  }
}
```

## Integration

### Performance System

- Determines automatic optimization levels
- Enables adaptive quality management
- Supports device-specific presets

### Rendering System

- Controls geometry detail levels
- Affects particle system complexity
- Determines shader complexity
- Influences texture resolution

### User Interface

- Provides quality preset options
- Enables manual tier override
- Shows current tier status

## Hardware Detection

### Memory-Based Detection

```typescript
function getMemoryTier(): DeviceTier {
  if ("memory" in performance) {
    const memory = (performance as any).memory;
    const totalHeap = memory.jsHeapSizeLimit / (1024 * 1024 * 1024); // GB

    if (totalHeap > 8) return "cosmic";
    if (totalHeap > 4) return "high";
    if (totalHeap > 2) return "medium";
    return "low";
  }

  return "medium"; // Default fallback
}
```

### CPU-Based Detection

```typescript
function getCPUTier(): DeviceTier {
  const cores = navigator.hardwareConcurrency || 4;

  if (cores >= 16) return "cosmic";
  if (cores >= 8) return "high";
  if (cores >= 4) return "medium";
  return "low";
}
```

## 🔗 Related

- [[PerformanceConfig]] - Performance configuration that uses device tiers
- [[PerformanceOptimization]] - Rendering optimization settings
- [[SceneManagerOptions]] - Scene manager configuration
- [[@teskooano/renderer-threejs]] - Rendering system that uses device tiers
