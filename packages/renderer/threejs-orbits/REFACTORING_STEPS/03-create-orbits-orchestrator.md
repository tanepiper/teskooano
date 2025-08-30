# Phase 3: Create OrbitsOrchestrator (Replaces OrbitsManager)

## 🎯 Goal

Create the OrbitsOrchestrator class that replaces the complex OrbitsManager, providing centralized rendering coordination with simplified, focused renderers for Keplerian orbits, trails, and predictions.

## 📋 Steps

### Step 3.1: Create OrbitsOrchestrator

**File**: `packages/renderer/threejs-orbits/src/OrbitsOrchestrator.ts`

**Purpose**: Create the main orchestrator that coordinates all orbit rendering and manages orbit managers for celestials

```typescript
import * as THREE from "three";
import { KeplerianRenderer } from "./renderers/KeplerianRenderer";
import { TrailRenderer } from "./renderers/TrailRenderer";
import { PredictionRenderer } from "./renderers/PredictionRenderer";
import { OrbitManager } from "./managers/OrbitManager";
import {
  OrbitRenderData,
  OrbitVisibility,
} from "@teskooano/renderer-threejs-celestial";
import {
  RenderableCelestialObject,
  SimulationMode,
} from "@teskooano/data-types";

/**
 * Centralized orchestrator for all orbit rendering
 * Replaces the complex OrbitsManager with a simple, focused approach
 * Coordinates rendering through specialized renderers
 */
export class OrbitsOrchestrator {
  private keplerianRenderer: KeplerianRenderer;
  private trailRenderer: TrailRenderer;
  private predictionRenderer: PredictionRenderer;

  // Remove orbitManagers map - celestials manage their own OrbitManagers

  // Global visibility states
  private orbitLinesVisible: boolean = true;
  private trailLinesVisible: boolean = true;
  private predictionLinesVisible: boolean = true;

  constructor(
    private scene: THREE.Scene,
    private labelContainer: HTMLElement,
  ) {
    // Create renderer instances
    this.keplerianRenderer = new KeplerianRenderer(scene);
    this.trailRenderer = new TrailRenderer(scene);
    this.predictionRenderer = new PredictionRenderer(scene, labelContainer);
  }

  /**
   * Register a celestial object with the orchestrator
   * Note: OrbitManager is created by the celestial itself
   */
  registerCelestial(
    object: RenderableCelestialObject,
    simulationMode: SimulationMode,
  ): void {
    const objectId = object.id;

    // Note: OrbitManager is now created by the celestial itself
    // This method is kept for compatibility but doesn't create managers
    // The celestial will call updateObjectData when it has data
  }

  /**
   * Unregister a celestial object
   * Removes its orbit manager and cleans up rendering
   */
  unregisterCelestial(objectId: string): void {
    // Remove from all renderers
    this.keplerianRenderer.removeOrbit(objectId);
    this.trailRenderer.removeTrail(objectId);
    this.predictionRenderer.removePrediction(objectId);
  }

  /**
   * Update all celestials and their orbit rendering
   * Called by the main renderer each frame
   */
  update(context: RenderingContext): void {
    // Note: Individual celestials update their own orbit managers
    // This method is kept for compatibility but doesn't update managers directly
  }

  /**
   * Update orbit data for a specific object
   * Called by orbit managers when they have new data
   */
  updateObjectData(objectId: string, data: OrbitRenderData): void {
    this.updateObjectRendering(objectId, data);
  }

  /**
   * Set visibility for a specific object
   * Called by orbit managers when visibility changes
   */
  setObjectVisibility(objectId: string, visibility: OrbitVisibility): void {
    this.updateObjectRendering(objectId, undefined, visibility);
  }

  /**
   * Update rendering for a specific object
   */
  private updateObjectRendering(
    objectId: string,
    data?: OrbitRenderData,
    visibility?: OrbitVisibility,
  ): void {
    // Use provided data and visibility directly
    const currentData = data;
    const currentVisibility = visibility;

    if (!currentData || !currentVisibility) return;

    // Update Keplerian orbits
    if (
      currentVisibility.orbitLines &&
      currentData.keplerianPoints &&
      this.orbitLinesVisible
    ) {
      this.keplerianRenderer.updateOrbit(objectId, currentData.keplerianPoints);
    } else {
      this.keplerianRenderer.removeOrbit(objectId);
    }

    // Update trails
    if (
      currentVisibility.trailLines &&
      currentData.trailPoints &&
      this.trailLinesVisible
    ) {
      this.trailRenderer.updateTrail(objectId, currentData.trailPoints);
    } else {
      this.trailRenderer.removeTrail(objectId);
    }

    // Update predictions
    if (
      currentVisibility.predictionLines &&
      currentData.predictionPoints &&
      this.predictionLinesVisible
    ) {
      this.predictionRenderer.updatePrediction(
        objectId,
        currentData.predictionPoints,
        currentData.predictionTimestamps,
      );
    } else {
      this.predictionRenderer.removePrediction(objectId);
    }
  }

  /**
   * Global visibility controls
   */
  setOrbitLinesVisible(visible: boolean): void {
    this.orbitLinesVisible = visible;
    this.keplerianRenderer.setVisibility(visible);
  }

  setTrailLinesVisible(visible: boolean): void {
    this.trailLinesVisible = visible;
    this.trailRenderer.setVisibility(visible);
  }

  setPredictionLinesVisible(visible: boolean): void {
    this.predictionLinesVisible = visible;
    this.predictionRenderer.setVisibility(visible);
  }

  /**
   * Object highlighting
   */
  setObjectHighlighted(objectId: string, highlighted: boolean): void {
    this.keplerianRenderer.setHighlighted(objectId, highlighted);
    this.trailRenderer.setHighlighted(objectId, highlighted);
    this.predictionRenderer.setHighlighted(objectId, highlighted);
  }

  /**
   * Get all registered object IDs
   * Note: This is now tracked by the renderers themselves
   */
  getRegisteredObjectIds(): string[] {
    // Return IDs from all renderers
    const keplerianIds = Array.from(this.keplerianRenderer.getOrbitIds());
    const trailIds = Array.from(this.trailRenderer.getTrailIds());
    const predictionIds = Array.from(
      this.predictionRenderer.getPredictionIds(),
    );

    // Combine and deduplicate
    return [...new Set([...keplerianIds, ...trailIds, ...predictionIds])];
  }

  /**
   * Clear all orbit data
   */
  clearAllOrbits(): void {
    // Clear all renderers
    this.keplerianRenderer.clearAll();
    this.trailRenderer.clearAll();
    this.predictionRenderer.clearAll();
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    orbitLinesCount: number;
    trailLinesCount: number;
    predictionLinesCount: number;
    registeredObjectsCount: number;
  } {
    return {
      orbitLinesCount: this.keplerianRenderer.getLineCount(),
      trailLinesCount: this.trailRenderer.getLineCount(),
      predictionLinesCount: this.predictionRenderer.getLineCount(),
      registeredObjectsCount: this.getRegisteredObjectIds().length,
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Dispose renderers
    this.keplerianRenderer.dispose();
    this.trailRenderer.dispose();
    this.predictionRenderer.dispose();
  }
}
```

**Dependencies**: Individual renderers, OrbitManager, scene management

### Step 3.2: Create Simplified KeplerianRenderer

**File**: `packages/renderer/threejs-orbits/src/renderers/KeplerianRenderer.ts`

**Purpose**: Create a simple, focused renderer for Keplerian orbit lines

```typescript
import * as THREE from "three";
import { SharedMaterials } from "../SharedMaterials";

/**
 * Simple renderer for Keplerian orbit lines
 * Focused only on rendering, no calculations
 */
export class KeplerianRenderer {
  private orbits: Map<string, THREE.Line> = new Map();
  private scene: THREE.Scene;
  private visible: boolean = true;
  private highlightedObjectId: string | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Create or update an orbit line
   */
  updateOrbit(objectId: string, points: THREE.Vector3[]): void {
    if (points.length < 2) {
      this.removeOrbit(objectId);
      return;
    }

    let orbit = this.orbits.get(objectId);
    if (!orbit) {
      orbit = this.createOrbitLine(points);
      this.orbits.set(objectId, orbit);
      this.scene.add(orbit);
    } else {
      this.updateOrbitGeometry(orbit, points);
    }

    // Apply highlighting if needed
    this.applyHighlighting(orbit, objectId);
  }

  /**
   * Remove an orbit line
   */
  removeOrbit(objectId: string): void {
    const orbit = this.orbits.get(objectId);
    if (orbit) {
      this.scene.remove(orbit);
      this.orbits.delete(objectId);
    }
  }

  /**
   * Set global visibility
   */
  setVisibility(visible: boolean): void {
    this.visible = visible;
    this.orbits.forEach((orbit) => {
      orbit.visible = visible;
    });
  }

  /**
   * Set object highlighting
   */
  setHighlighted(objectId: string, highlighted: boolean): void {
    if (highlighted) {
      this.highlightedObjectId = objectId;
    } else if (this.highlightedObjectId === objectId) {
      this.highlightedObjectId = null;
    }

    // Update highlighting for all orbits
    this.orbits.forEach((orbit, id) => {
      this.applyHighlighting(orbit, id);
    });
  }

  /**
   * Clear all orbits
   */
  clearAll(): void {
    this.orbits.forEach((orbit) => {
      this.scene.remove(orbit);
    });
    this.orbits.clear();
  }

  /**
   * Get number of orbit lines
   */
  getLineCount(): number {
    return this.orbits.size;
  }

  /**
   * Get all orbit IDs
   */
  getOrbitIds(): Set<string> {
    return new Set(this.orbits.keys());
  }

  /**
   * Create a new orbit line
   */
  private createOrbitLine(points: THREE.Vector3[]): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = SharedMaterials.clone("KEPLERIAN");

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false; // Orbits should always be visible
    line.renderOrder = 1000; // Render behind objects

    return line;
  }

  /**
   * Update orbit line geometry
   */
  private updateOrbitGeometry(line: THREE.Line, points: THREE.Vector3[]): void {
    const geometry = line.geometry as THREE.BufferGeometry;
    geometry.setFromPoints(points);
    geometry.computeBoundingSphere();
  }

  /**
   * Apply highlighting to an orbit line
   */
  private applyHighlighting(line: THREE.Line, objectId: string): void {
    const isHighlighted = objectId === this.highlightedObjectId;

    if (line.material instanceof THREE.LineBasicMaterial) {
      if (isHighlighted) {
        line.material.color.setHex(0x00ff00); // Green for highlighted
        line.material.opacity = 1.0;
      } else {
        line.material.color.setHex(0xffffff); // White for normal
        line.material.opacity = 0.8;
      }
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.orbits.forEach((orbit) => {
      this.scene.remove(orbit);
      orbit.geometry.dispose();
      if (orbit.material instanceof THREE.Material) {
        orbit.material.dispose();
      }
    });
    this.orbits.clear();
  }
}
```

**Dependencies**: Three.js, SharedMaterials

### Step 3.3: Create Simplified TrailRenderer

**File**: `packages/renderer/threejs-orbits/src/renderers/TrailRenderer.ts`

**Purpose**: Create a simple, focused renderer for trail lines

```typescript
import * as THREE from "three";
import { SharedMaterials } from "../SharedMaterials";

/**
 * Simple renderer for trail lines
 * Focused only on rendering, no calculations
 */
export class TrailRenderer {
  private trails: Map<string, THREE.Line> = new Map();
  private scene: THREE.Scene;
  private visible: boolean = true;
  private highlightedObjectId: string | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Create or update a trail line
   */
  updateTrail(objectId: string, points: THREE.Vector3[]): void {
    if (points.length < 2) {
      this.removeTrail(objectId);
      return;
    }

    let trail = this.trails.get(objectId);
    if (!trail) {
      trail = this.createTrailLine(points);
      this.trails.set(objectId, trail);
      this.scene.add(trail);
    } else {
      this.updateTrailGeometry(trail, points);
    }

    // Apply highlighting if needed
    this.applyHighlighting(trail, objectId);
  }

  /**
   * Remove a trail line
   */
  removeTrail(objectId: string): void {
    const trail = this.trails.get(objectId);
    if (trail) {
      this.scene.remove(trail);
      this.trails.delete(objectId);
    }
  }

  /**
   * Set global visibility
   */
  setVisibility(visible: boolean): void {
    this.visible = visible;
    this.trails.forEach((trail) => {
      trail.visible = visible;
    });
  }

  /**
   * Set object highlighting
   */
  setHighlighted(objectId: string, highlighted: boolean): void {
    if (highlighted) {
      this.highlightedObjectId = objectId;
    } else if (this.highlightedObjectId === objectId) {
      this.highlightedObjectId = null;
    }

    // Update highlighting for all trails
    this.trails.forEach((trail, id) => {
      this.applyHighlighting(trail, id);
    });
  }

  /**
   * Clear all trails
   */
  clearAll(): void {
    this.trails.forEach((trail) => {
      this.scene.remove(trail);
    });
    this.trails.clear();
  }

  /**
   * Get number of trail lines
   */
  getLineCount(): number {
    return this.trails.size;
  }

  /**
   * Get all trail IDs
   */
  getTrailIds(): Set<string> {
    return new Set(this.trails.keys());
  }

  /**
   * Create a new trail line
   */
  private createTrailLine(points: THREE.Vector3[]): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = SharedMaterials.clone("TRAIL");

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false; // Trails should always be visible
    line.renderOrder = 1001; // Render behind objects but in front of orbits

    return line;
  }

  /**
   * Update trail line geometry
   */
  private updateTrailGeometry(line: THREE.Line, points: THREE.Vector3[]): void {
    const geometry = line.geometry as THREE.BufferGeometry;
    geometry.setFromPoints(points);
    geometry.computeBoundingSphere();
  }

  /**
   * Apply highlighting to a trail line
   */
  private applyHighlighting(line: THREE.Line, objectId: string): void {
    const isHighlighted = objectId === this.highlightedObjectId;

    if (line.material instanceof THREE.LineBasicMaterial) {
      if (isHighlighted) {
        line.material.color.setHex(0x00ff00); // Green for highlighted
        line.material.opacity = 1.0;
      } else {
        line.material.color.setHex(0xffffff); // White for normal
        line.material.opacity = 0.8;
      }
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.trails.forEach((trail) => {
      this.scene.remove(trail);
      trail.geometry.dispose();
      if (trail.material instanceof THREE.Material) {
        trail.material.dispose();
      }
    });
    this.trails.clear();
  }
}
```

**Dependencies**: Three.js, SharedMaterials

### Step 3.4: Create Simplified PredictionRenderer

**File**: `packages/renderer/threejs-orbits/src/renderers/PredictionRenderer.ts`

**Purpose**: Create a simple, focused renderer for prediction lines

```typescript
import * as THREE from "three";
import { SharedMaterials } from "../SharedMaterials";

/**
 * Simple renderer for prediction lines
 * Focused only on rendering, no calculations
 */
export class PredictionRenderer {
  private predictions: Map<string, THREE.Line> = new Map();
  private scene: THREE.Scene;
  private labelContainer: HTMLElement;
  private visible: boolean = true;
  private highlightedObjectId: string | null = null;

  constructor(scene: THREE.Scene, labelContainer: HTMLElement) {
    this.scene = scene;
    this.labelContainer = labelContainer;
  }

  /**
   * Create or update a prediction line
   */
  updatePrediction(
    objectId: string,
    points: THREE.Vector3[],
    timestamps?: number[],
  ): void {
    if (points.length < 2) {
      this.removePrediction(objectId);
      return;
    }

    let prediction = this.predictions.get(objectId);
    if (!prediction) {
      prediction = this.createPredictionLine(points);
      this.predictions.set(objectId, prediction);
      this.scene.add(prediction);
    } else {
      this.updatePredictionGeometry(prediction, points);
    }

    // Apply highlighting if needed
    this.applyHighlighting(prediction, objectId);

    // Update labels if timestamps provided
    if (timestamps) {
      this.updatePredictionLabels(objectId, points, timestamps);
    }
  }

  /**
   * Remove a prediction line
   */
  removePrediction(objectId: string): void {
    const prediction = this.predictions.get(objectId);
    if (prediction) {
      this.scene.remove(prediction);
      this.predictions.delete(objectId);
    }

    // Remove labels
    this.removePredictionLabels(objectId);
  }

  /**
   * Set global visibility
   */
  setVisibility(visible: boolean): void {
    this.visible = visible;
    this.predictions.forEach((prediction) => {
      prediction.visible = visible;
    });
  }

  /**
   * Set object highlighting
   */
  setHighlighted(objectId: string, highlighted: boolean): void {
    if (highlighted) {
      this.highlightedObjectId = objectId;
    } else if (this.highlightedObjectId === objectId) {
      this.highlightedObjectId = null;
    }

    // Update highlighting for all predictions
    this.predictions.forEach((prediction, id) => {
      this.applyHighlighting(prediction, id);
    });
  }

  /**
   * Clear all predictions
   */
  clearAll(): void {
    this.predictions.forEach((prediction) => {
      this.scene.remove(prediction);
    });
    this.predictions.clear();
  }

  /**
   * Get number of prediction lines
   */
  getLineCount(): number {
    return this.predictions.size;
  }

  /**
   * Get all prediction IDs
   */
  getPredictionIds(): Set<string> {
    return new Set(this.predictions.keys());
  }

  /**
   * Create a new prediction line
   */
  private createPredictionLine(points: THREE.Vector3[]): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = SharedMaterials.clone("PREDICTION");

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false; // Predictions should always be visible
    line.renderOrder = 1002; // Render behind objects but in front of trails

    return line;
  }

  /**
   * Update prediction line geometry
   */
  private updatePredictionGeometry(
    line: THREE.Line,
    points: THREE.Vector3[],
  ): void {
    const geometry = line.geometry as THREE.BufferGeometry;
    geometry.setFromPoints(points);
    geometry.computeBoundingSphere();
  }

  /**
   * Apply highlighting to a prediction line
   */
  private applyHighlighting(line: THREE.Line, objectId: string): void {
    const isHighlighted = objectId === this.highlightedObjectId;

    if (line.material instanceof THREE.LineDashedMaterial) {
      if (isHighlighted) {
        line.material.color.setHex(0x00ff00); // Green for highlighted
        line.material.opacity = 1.0;
      } else {
        line.material.color.setHex(0xffff00); // Yellow for normal
        line.material.opacity = 0.7;
      }
    }
  }

  /**
   * Update prediction labels
   */
  private updatePredictionLabels(
    objectId: string,
    points: THREE.Vector3[],
    timestamps: number[],
  ): void {
    // TODO: Implement label creation/update
    // This would create 2D labels at prediction points with timestamps
  }

  /**
   * Remove prediction labels
   */
  private removePredictionLabels(objectId: string): void {
    // TODO: Implement label removal
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.predictions.forEach((prediction) => {
      this.scene.remove(prediction);
      prediction.geometry.dispose();
      if (prediction.material instanceof THREE.Material) {
        prediction.material.dispose();
      }
    });
    this.predictions.clear();
  }
}
```

**Dependencies**: Three.js, SharedMaterials

## 🧪 Testing

### Unit Tests

**File**: `packages/renderer/threejs-orbits/src/OrbitsOrchestrator.spec.ts`

```typescript
import { OrbitsOrchestrator } from "../OrbitsOrchestrator";
import {
  OrbitRenderData,
  OrbitVisibility,
} from "@teskooano/renderer-threejs-celestial";
import * as THREE from "three";

describe("OrbitsOrchestrator", () => {
  let orchestrator: OrbitsOrchestrator;
  let mockScene: THREE.Scene;
  let mockLabelContainer: HTMLElement;

  beforeEach(() => {
    mockScene = new THREE.Scene();
    mockLabelContainer = document.createElement("div");

    orchestrator = new OrbitsOrchestrator(mockScene, mockLabelContainer);
  });

  it("should update object data correctly", () => {
    const objectId = "test-object";
    const data: OrbitRenderData = {
      keplerianPoints: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)],
    };

    orchestrator.updateObjectData(objectId, data);

    const stats = orchestrator.getPerformanceStats();
    expect(stats.orbitLinesCount).toBe(1);
  });

  it("should handle visibility changes", () => {
    const objectId = "test-object";
    const data: OrbitRenderData = {
      keplerianPoints: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)],
    };
    const visibility: OrbitVisibility = {
      orbitLines: true,
      trailLines: false,
      predictionLines: false,
    };

    orchestrator.updateObjectData(objectId, data);
    orchestrator.setObjectVisibility(objectId, visibility);

    const stats = orchestrator.getPerformanceStats();
    expect(stats.orbitLinesCount).toBe(1);
    expect(stats.trailLinesCount).toBe(0);
  });

  it("should handle global visibility changes", () => {
    orchestrator.setOrbitLinesVisible(false);
    orchestrator.setTrailLinesVisible(false);
    orchestrator.setPredictionLinesVisible(false);

    const stats = orchestrator.getPerformanceStats();
    expect(stats.orbitLinesCount).toBe(0);
    expect(stats.trailLinesCount).toBe(0);
    expect(stats.predictionLinesCount).toBe(0);
  });
});
```

## ✅ Success Criteria

- [ ] OrbitsOrchestrator created and functional
- [ ] Simplified renderers created (KeplerianRenderer, TrailRenderer, PredictionRenderer)
- [ ] Proper data flow from BaseCelestialRenderer to orchestrator
- [ ] Global visibility controls working
- [ ] Object highlighting working
- [ ] Performance statistics available
- [ ] Unit tests passing
- [ ] No breaking changes to existing API

## 🔄 Next Steps

After completing Phase 3:

1. Test integration with ModularSpaceRenderer
2. Verify rendering performance
3. Proceed to Phase 4: Integration and Migration
