# Phase 5: Cleanup and Optimization

## 🎯 Goal

Remove deprecated code, optimize performance, and ensure the new orbit architecture is clean, efficient, and maintainable.

## 📋 Steps

### Step 5.1: Remove Deprecated OrbitsManager

**File**: `packages/renderer/threejs-orbits/src/core/OrbitsManager.ts`

**Purpose**: Remove the old OrbitsManager class and its dependencies

```typescript
// DEPRECATED - This file should be deleted
// The OrbitsManager has been replaced by OrbitsOrchestrator
// All functionality has been migrated to the new architecture

// This file is kept for reference during migration but should be removed
// after Phase 4 is complete and tested.

// TODO: Delete this file after migration is complete
```

**Action**: Delete the file and update any remaining imports

### Step 5.2: Remove Deprecated Strategy Classes

**Files to Remove**:

- `packages/renderer/threejs-orbits/src/core/strategies/KeplerianStrategy.ts`
- `packages/renderer/threejs-orbits/src/core/strategies/NBodyStrategy.ts`
- `packages/renderer/threejs-orbits/src/core/strategies/IOrbitVisualizationStrategy.ts`

**Purpose**: Remove the old strategy pattern classes that are no longer needed

```typescript
// DEPRECATED - These strategy classes have been replaced by:
// - KeplerianRenderer (simple rendering only)
// - TrailRenderer (simple rendering only)
// - PredictionRenderer (simple rendering only)
// - Physics package calculations (moved to @teskooano/core-physics)

// TODO: Delete these files after migration is complete
```

### Step 5.3: Remove Deprecated Calculator Classes

**Files to Remove**:

- `packages/renderer/threejs-orbits/src/core/calculators/OrbitCalculator.ts`
- `packages/renderer/threejs-orbits/src/core/calculators/PredictionCalculator.ts`

**Purpose**: Remove calculation classes that have been moved to the physics package

```typescript
// DEPRECATED - These calculator classes have been moved to:
// - @teskooano/core-physics/src/orbital/calculations.ts
// - @teskooano/core-physics/src/orbital/predictions.ts

// TODO: Delete these files after migration is complete
```

### Step 5.4: Remove Deprecated Manager Classes

**Files to Remove**:

- `packages/renderer/threejs-orbits/src/core/managers/PredictionManager.ts`
- `packages/renderer/threejs-orbits/src/core/managers/TrailManager.ts`
- `packages/renderer/threejs-orbits/src/core/managers/KeplerianManager.ts`

**Purpose**: Remove old manager classes that have been replaced by the new architecture

```typescript
// DEPRECATED - These manager classes have been replaced by:
// - OrbitsOrchestrator (central coordination)
// - OrbitManager (individual object management)
// - Simplified renderers (KeplerianRenderer, TrailRenderer, PredictionRenderer)

// TODO: Delete these files after migration is complete
```

### Step 5.5: Update Package Exports

**File**: `packages/renderer/threejs-orbits/src/index.ts`

**Purpose**: Update the package exports to reflect the new architecture

```typescript
// Main exports
export { OrbitsOrchestrator } from "./OrbitsOrchestrator";

// Renderer exports
export { KeplerianRenderer } from "./renderers/KeplerianRenderer";
export { TrailRenderer } from "./renderers/TrailRenderer";
export { PredictionRenderer } from "./renderers/PredictionRenderer";

// Shared utilities
export { SharedMaterials } from "./SharedMaterials";

// Migration utilities (temporary)
export { OrbitsMigration } from "./migration/OrbitsMigration";

// Types (if any are specific to this package)
export type {
  OrbitRenderData,
  OrbitVisibility,
} from "@teskooano/renderer-threejs-celestial";

// Remove deprecated exports:
// - OrbitsManager
// - IOrbitVisualizationStrategy
// - KeplerianStrategy
// - NBodyStrategy
// - OrbitCalculator
// - PredictionCalculator
// - PredictionManager
// - TrailManager
// - KeplerianManager
```

### Step 5.6: Optimize SharedMaterials

**File**: `packages/renderer/threejs-orbits/src/SharedMaterials.ts`

**Purpose**: Optimize the shared materials for better performance

```typescript
import * as THREE from "three";

/**
 * Optimized shared materials for orbit rendering
 * Uses material pooling and efficient cloning
 */
export class SharedMaterials {
  private static materialCache = new Map<string, THREE.Material>();
  private static materialConfigs = {
    KEPLERIAN: {
      type: "LineBasicMaterial",
      properties: {
        color: 0xffffff,
        opacity: 0.8,
        transparent: true,
        depthWrite: false,
        depthTest: true,
      },
    },
    TRAIL: {
      type: "LineBasicMaterial",
      properties: {
        color: 0xffffff,
        opacity: 0.8,
        transparent: true,
        depthWrite: false,
        depthTest: true,
      },
    },
    PREDICTION: {
      type: "LineDashedMaterial",
      properties: {
        color: 0xffff00,
        opacity: 0.7,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        dashSize: 3,
        gapSize: 1,
      },
    },
  };

  /**
   * Get a material instance, creating it if needed
   */
  static get(
    materialType: keyof typeof SharedMaterials.materialConfigs,
  ): THREE.Material {
    if (!this.materialCache.has(materialType)) {
      const config = this.materialConfigs[materialType];
      const material = this.createMaterial(config);
      this.materialCache.set(materialType, material);
    }

    return this.materialCache.get(materialType)!;
  }

  /**
   * Clone a material for individual use
   */
  static clone(
    materialType: keyof typeof SharedMaterials.materialConfigs,
  ): THREE.Material {
    const baseMaterial = this.get(materialType);
    return baseMaterial.clone();
  }

  /**
   * Create a material from configuration
   */
  private static createMaterial(config: {
    type: string;
    properties: Record<string, any>;
  }): THREE.Material {
    switch (config.type) {
      case "LineBasicMaterial":
        return new THREE.LineBasicMaterial(config.properties);
      case "LineDashedMaterial":
        return new THREE.LineDashedMaterial(config.properties);
      default:
        throw new Error(`Unknown material type: ${config.type}`);
    }
  }

  /**
   * Clear the material cache
   */
  static clearCache(): void {
    this.materialCache.forEach((material) => {
      material.dispose();
    });
    this.materialCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; types: string[] } {
    return {
      size: this.materialCache.size,
      types: Array.from(this.materialCache.keys()),
    };
  }
}
```

### Step 5.7: Add Performance Monitoring

**File**: `packages/renderer/threejs-orbits/src/performance/OrbitPerformanceMonitor.ts`

**Purpose**: Add performance monitoring for the orbit rendering system

```typescript
import { OrbitsOrchestrator } from "../OrbitsOrchestrator";

/**
 * Performance monitor for orbit rendering
 */
export class OrbitPerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private frameTimes: number[] = [];
  private maxFrameTimeHistory = 60; // Keep last 60 frames

  /**
   * Update performance metrics
   */
  update(orchestrator: OrbitsOrchestrator): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    this.frameCount++;
    this.frameTimes.push(frameTime);

    // Keep only recent frame times
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }

    this.lastFrameTime = currentTime;
  }

  /**
   * Get current performance statistics
   */
  getStats(): {
    fps: number;
    averageFrameTime: number;
    minFrameTime: number;
    maxFrameTime: number;
    orbitStats: {
      orbitLinesCount: number;
      trailLinesCount: number;
      predictionLinesCount: number;
    };
  } {
    const averageFrameTime =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1000 / averageFrameTime;

    return {
      fps: Math.round(fps * 100) / 100,
      averageFrameTime: Math.round(averageFrameTime * 100) / 100,
      minFrameTime: Math.min(...this.frameTimes),
      maxFrameTime: Math.max(...this.frameTimes),
      orbitStats: {
        orbitLinesCount: 0, // Will be filled by orchestrator
        trailLinesCount: 0,
        predictionLinesCount: 0,
      },
    };
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(): boolean {
    const stats = this.getStats();
    return stats.fps >= 30 && stats.averageFrameTime <= 33; // 30 FPS minimum
  }

  /**
   * Get performance warnings
   */
  getWarnings(): string[] {
    const warnings: string[] = [];
    const stats = this.getStats();

    if (stats.fps < 30) {
      warnings.push(`Low FPS: ${stats.fps} (target: 30+)`);
    }

    if (stats.averageFrameTime > 33) {
      warnings.push(
        `High frame time: ${stats.averageFrameTime}ms (target: <33ms)`,
      );
    }

    return warnings;
  }
}
```

### Step 5.8: Add Memory Management

**File**: `packages/renderer/threejs-orbits/src/memory/OrbitMemoryManager.ts`

**Purpose**: Add memory management for orbit rendering resources

```typescript
import * as THREE from "three";

/**
 * Memory manager for orbit rendering resources
 */
export class OrbitMemoryManager {
  private geometryPool: Map<string, THREE.BufferGeometry> = new Map();
  private materialPool: Map<string, THREE.Material> = new Map();
  private maxPoolSize = 100; // Maximum number of pooled resources

  /**
   * Get a geometry from the pool or create a new one
   */
  getGeometry(key: string): THREE.BufferGeometry {
    if (this.geometryPool.has(key)) {
      return this.geometryPool.get(key)!;
    }

    const geometry = new THREE.BufferGeometry();
    this.geometryPool.set(key, geometry);

    // Cleanup if pool is too large
    this.cleanupGeometryPool();

    return geometry;
  }

  /**
   * Return a geometry to the pool
   */
  returnGeometry(key: string, geometry: THREE.BufferGeometry): void {
    if (this.geometryPool.size < this.maxPoolSize) {
      this.geometryPool.set(key, geometry);
    } else {
      geometry.dispose();
    }
  }

  /**
   * Get a material from the pool or create a new one
   */
  getMaterial(key: string, createFn: () => THREE.Material): THREE.Material {
    if (this.materialPool.has(key)) {
      return this.materialPool.get(key)!;
    }

    const material = createFn();
    this.materialPool.set(key, material);

    // Cleanup if pool is too large
    this.cleanupMaterialPool();

    return material;
  }

  /**
   * Return a material to the pool
   */
  returnMaterial(key: string, material: THREE.Material): void {
    if (this.materialPool.size < this.maxPoolSize) {
      this.materialPool.set(key, material);
    } else {
      material.dispose();
    }
  }

  /**
   * Cleanup geometry pool if too large
   */
  private cleanupGeometryPool(): void {
    if (this.geometryPool.size > this.maxPoolSize) {
      const keys = Array.from(this.geometryPool.keys());
      const keysToRemove = keys.slice(
        0,
        this.geometryPool.size - this.maxPoolSize,
      );

      keysToRemove.forEach((key) => {
        const geometry = this.geometryPool.get(key)!;
        geometry.dispose();
        this.geometryPool.delete(key);
      });
    }
  }

  /**
   * Cleanup material pool if too large
   */
  private cleanupMaterialPool(): void {
    if (this.materialPool.size > this.maxPoolSize) {
      const keys = Array.from(this.materialPool.keys());
      const keysToRemove = keys.slice(
        0,
        this.materialPool.size - this.maxPoolSize,
      );

      keysToRemove.forEach((key) => {
        const material = this.materialPool.get(key)!;
        material.dispose();
        this.materialPool.delete(key);
      });
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    geometryPoolSize: number;
    materialPoolSize: number;
    totalPoolSize: number;
  } {
    return {
      geometryPoolSize: this.geometryPool.size,
      materialPoolSize: this.materialPool.size,
      totalPoolSize: this.geometryPool.size + this.materialPool.size,
    };
  }

  /**
   * Clear all pooled resources
   */
  clearAll(): void {
    this.geometryPool.forEach((geometry) => {
      geometry.dispose();
    });
    this.geometryPool.clear();

    this.materialPool.forEach((material) => {
      material.dispose();
    });
    this.materialPool.clear();
  }
}
```

### Step 5.9: Update Documentation

**File**: `packages/renderer/threejs-orbits/README.md`

**Purpose**: Update documentation to reflect the new architecture

````markdown
# ThreeJS Orbits Package

A clean, focused rendering package for orbital visualization in the Teskooano space simulation.

## Architecture

This package provides a simple, efficient rendering layer for orbital visualization:

- **OrbitsOrchestrator**: Central coordination for all orbit rendering
- **KeplerianRenderer**: Simple renderer for Keplerian orbit lines
- **TrailRenderer**: Simple renderer for trail lines
- **PredictionRenderer**: Simple renderer for prediction lines
- **OrbitManager**: Individual object orbit management (in BaseCelestialRenderer)

## Key Features

- **Separation of Concerns**: Calculations are handled by the physics package, rendering is handled here
- **Performance Optimized**: Efficient material pooling and geometry management
- **Modular Design**: Each renderer is focused on a single responsibility
- **State Integration**: Seamless integration with the global state management system

## Usage

```typescript
import { OrbitsOrchestrator } from "@teskooano/renderer-threejs-orbits";

// Create orchestrator
const orchestrator = new OrbitsOrchestrator(scene, labelContainer);

// Update orbit data
orchestrator.updateObjectData(objectId, orbitData);

// Set visibility
orchestrator.setObjectVisibility(objectId, visibility);

// Global controls
orchestrator.setOrbitLinesVisible(true);
orchestrator.setTrailLinesVisible(true);
orchestrator.setPredictionLinesVisible(true);
```
````

## Performance

The package includes built-in performance monitoring and memory management:

- **Performance Monitor**: Tracks FPS and frame times
- **Memory Manager**: Efficient resource pooling
- **Material Optimization**: Shared materials with cloning

## Migration

For migrating from the old OrbitsManager, see the migration utilities in the `migration/` directory.

## API Reference

### OrbitsOrchestrator

The main orchestrator class that coordinates all orbit rendering.

#### Methods

- `updateObjectData(objectId: string, data: OrbitRenderData): void`
- `setObjectVisibility(objectId: string, visibility: OrbitVisibility): void`
- `removeObject(objectId: string): void`
- `setOrbitLinesVisible(visible: boolean): void`
- `setTrailLinesVisible(visible: boolean): void`
- `setPredictionLinesVisible(visible: boolean): void`
- `setObjectHighlighted(objectId: string, highlighted: boolean): void`
- `getPerformanceStats(): PerformanceStats`
- `clearAllOrbits(): void`
- `dispose(): void`

### Renderers

Each renderer is focused on a single type of orbital visualization:

- **KeplerianRenderer**: Static orbit lines
- **TrailRenderer**: Dynamic trail lines
- **PredictionRenderer**: Prediction lines with labels

## Dependencies

- `@teskooano/core-physics`: For orbital calculations
- `@teskooano/renderer-threejs-celestial`: For data types and integration
- `three`: For 3D rendering

````

### Step 5.10: Add Final Tests

**File**: `packages/renderer/threejs-orbits/src/__tests__/cleanup.test.ts`

**Purpose**: Add tests to ensure cleanup is working correctly

```typescript
import { OrbitsOrchestrator } from "../OrbitsOrchestrator";
import { OrbitPerformanceMonitor } from "../performance/OrbitPerformanceMonitor";
import { OrbitMemoryManager } from "../memory/OrbitMemoryManager";
import { SharedMaterials } from "../SharedMaterials";
import * as THREE from "three";

describe("Cleanup and Optimization", () => {
  let orchestrator: OrbitsOrchestrator;
  let performanceMonitor: OrbitPerformanceMonitor;
  let memoryManager: OrbitMemoryManager;
  let mockScene: THREE.Scene;
  let mockLabelContainer: HTMLElement;

  beforeEach(() => {
    mockScene = new THREE.Scene();
    mockLabelContainer = document.createElement("div");

    orchestrator = new OrbitsOrchestrator(mockScene, mockLabelContainer);
    performanceMonitor = new OrbitPerformanceMonitor();
    memoryManager = new OrbitMemoryManager();
  });

  it("should dispose resources correctly", () => {
    // Add some orbit data
    const objectId = "test-object";
    const data = {
      keplerianPoints: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)],
    };

    orchestrator.updateObjectData(objectId, data);

    // Verify orbit was created
    const stats = orchestrator.getPerformanceStats();
    expect(stats.orbitLinesCount).toBe(1);

    // Dispose
    orchestrator.dispose();

    // Verify cleanup
    const statsAfter = orchestrator.getPerformanceStats();
    expect(statsAfter.orbitLinesCount).toBe(0);
  });

  it("should manage memory efficiently", () => {
    const memoryStats = memoryManager.getMemoryStats();
    expect(memoryStats.totalPoolSize).toBe(0);

    // Use some resources
    const geometry = memoryManager.getGeometry("test");
    const material = memoryManager.getMaterial("test", () => new THREE.LineBasicMaterial());

    // Return resources
    memoryManager.returnGeometry("test", geometry);
    memoryManager.returnMaterial("test", material);

    const statsAfter = memoryManager.getMemoryStats();
    expect(statsAfter.totalPoolSize).toBe(2);
  });

  it("should monitor performance correctly", () => {
    performanceMonitor.update(orchestrator);

    const stats = performanceMonitor.getStats();
    expect(stats.fps).toBeGreaterThan(0);
    expect(stats.averageFrameTime).toBeGreaterThan(0);

    // Performance should be acceptable in test environment
    expect(performanceMonitor.isPerformanceAcceptable()).toBe(true);
  });

  it("should clear shared materials cache", () => {
    // Use some materials
    const material1 = SharedMaterials.get("KEPLERIAN");
    const material2 = SharedMaterials.get("TRAIL");

    const cacheStats = SharedMaterials.getCacheStats();
    expect(cacheStats.size).toBe(2);

    // Clear cache
    SharedMaterials.clearCache();

    const cacheStatsAfter = SharedMaterials.getCacheStats();
    expect(cacheStatsAfter.size).toBe(0);
  });
});
````

## 🧪 Testing

### Performance Tests

**File**: `packages/renderer/threejs-orbits/src/__tests__/performance.test.ts`

```typescript
import { OrbitsOrchestrator } from "../OrbitsOrchestrator";
import { OrbitPerformanceMonitor } from "../performance/OrbitPerformanceMonitor";
import * as THREE from "three";

describe("Performance Tests", () => {
  let orchestrator: OrbitsOrchestrator;
  let performanceMonitor: OrbitPerformanceMonitor;
  let mockScene: THREE.Scene;
  let mockLabelContainer: HTMLElement;

  beforeEach(() => {
    mockScene = new THREE.Scene();
    mockLabelContainer = document.createElement("div");

    orchestrator = new OrbitsOrchestrator(mockScene, mockLabelContainer);
    performanceMonitor = new OrbitPerformanceMonitor();
  });

  it("should handle many objects efficiently", () => {
    const numObjects = 100;

    // Create many objects
    for (let i = 0; i < numObjects; i++) {
      const objectId = `object-${i}`;
      const data = {
        keplerianPoints: [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 1, 0),
        ],
      };

      orchestrator.updateObjectData(objectId, data);
    }

    const stats = orchestrator.getPerformanceStats();
    expect(stats.orbitLinesCount).toBe(numObjects);

    // Performance should still be acceptable
    performanceMonitor.update(orchestrator);
    expect(performanceMonitor.isPerformanceAcceptable()).toBe(true);
  });

  it("should handle frequent updates efficiently", () => {
    const objectId = "test-object";
    const data = {
      keplerianPoints: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)],
    };

    // Update many times
    for (let i = 0; i < 1000; i++) {
      orchestrator.updateObjectData(objectId, data);
      performanceMonitor.update(orchestrator);
    }

    const stats = performanceMonitor.getStats();
    expect(stats.fps).toBeGreaterThan(30); // Should maintain good performance
  });
});
```

## ✅ Success Criteria

- [ ] All deprecated files removed
- [ ] Package exports updated correctly
- [ ] Performance monitoring implemented
- [ ] Memory management implemented
- [ ] Documentation updated
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Memory usage optimized
- [ ] No memory leaks detected
- [ ] Code coverage maintained

## 🔄 Final Steps

After completing Phase 5:

1. Run full test suite
2. Perform performance benchmarks
3. Check for memory leaks
4. Update any remaining documentation
5. Create final release notes

## 📊 Performance Targets

- **FPS**: Minimum 30 FPS with 100 orbit lines
- **Memory**: Less than 50MB for 1000 orbit lines
- **Update Time**: Less than 1ms per frame for orbit updates
- **Startup Time**: Less than 100ms for initial setup
