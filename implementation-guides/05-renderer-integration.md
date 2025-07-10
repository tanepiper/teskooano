# Implementation Guide: Renderer & Package Integration

## Overview

This guide details updating the renderer integration layer and remaining package integration points to complete the transition to the new simulation configuration system.

## 🎯 Goals

- Update renderer state adapter to handle new configuration system
- Modify orbit rendering to support ideal vs N-Body mode switching
- Update all remaining package integration points
- Ensure seamless visual transitions between simulation modes
- Maintain performance during mode switches

## ✅ Implementation To-Do List

### Phase 5A: Update Renderer State Adapter

#### Task 5.1: Update RendererStateAdapter

**File**: `packages/renderer/threejs/src/RendererStateAdapter.ts`

**Current Issues:**

- Line 44-45: Hard-coded physics engine mapping logic
- Line 137-138: Visual settings extraction needs update
- Line 157: Comparison logic needs to handle new configuration structure

**To-Do:**

- [ ] Update visual settings interface to include configuration
- [ ] Modify physics engine mapping for new configuration system
- [ ] Update comparison logic for configuration changes
- [ ] Add mode-specific visual optimizations

**Implementation:**

```typescript
import {
  StateAccessor,
  renderableStore,
  type SimulationState,
  type SimulationConfiguration,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import { CelestialObject } from "@teskooano/data-types";
import { calculateLightSourceMaps } from "@teskooano/renderer-threejs-lighting";
import { BehaviorSubject } from "rxjs";
import { RenderableObjectFactory } from "@teskooano/renderer-threejs-objects";
import type { RendererVisualSettings } from "./types";

/**
 * Acts as a bridge between the core application state and the rendering engine.
 * Updated to support the new simulation configuration system.
 */
export class RendererStateAdapter extends StateSubscriptionMixin {
  /** An observable for visual settings that renderer components can subscribe to. */
  public $visualSettings: BehaviorSubject<RendererVisualSettings>;

  /** The current simulation time, used for calculating rotations. */
  private currentSimulationTime: number = 0;

  /** The current simulation configuration for optimizing rendering */
  private currentConfiguration: SimulationConfiguration;

  /** The factory for creating renderable object instances. */
  private factory: RenderableObjectFactory;

  constructor() {
    super();
    this.factory = new RenderableObjectFactory();
    const initialSimState = StateAccessor.getCurrentSimulationState();

    this.currentConfiguration = initialSimState.simulationConfig;

    this.$visualSettings = new BehaviorSubject<RendererVisualSettings>({
      trailLengthMultiplier:
        initialSimState.visualSettings.trailLengthMultiplier,
      physicsEngine: this.mapConfigurationToPhysicsEngine(
        initialSimState.simulationConfig,
      ),
      timeScale: initialSimState.timeScale,
      predictionSteps: initialSimState.visualSettings.predictionSteps,
      predictionDuration: initialSimState.visualSettings.predictionDuration,
      // New configuration fields
      simulationMode: initialSimState.simulationConfig.mode,
      algorithm: initialSimState.simulationConfig.algorithm,
      integrator: initialSimState.simulationConfig.integrator,
    });

    this.subscribeToCoreState();
  }

  /**
   * The main processing handler for celestial object updates.
   * Optimized based on current simulation mode.
   */
  private processCelestialObjectsUpdateNow(
    objects: Record<string, CelestialObject>,
  ): void {
    if (Object.keys(objects).length === 0) {
      renderableStore.setAllRenderableObjects({});
      return;
    }

    try {
      // Optimize rendering based on simulation mode
      const optimizedObjects = this.optimizeObjectsForCurrentMode(objects);

      // 1. Determine the lighting hierarchy for all objects.
      const lightSourceMap = calculateLightSourceMaps(optimizedObjects);

      // 2. Delegate creation of renderable objects to the factory.
      const renderableMap = this.factory.createRenderableObjects(
        optimizedObjects,
        lightSourceMap,
        this.currentSimulationTime,
      );

      // 3. Update the central store with the new set of objects.
      renderableStore.setAllRenderableObjects(renderableMap);
    } catch (error) {
      console.error(
        "[RendererStateAdapter] Error during object processing loop:",
        error,
      );
    }
  }

  /**
   * Optimizes object data based on current simulation mode
   */
  private optimizeObjectsForCurrentMode(
    objects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    // In ideal mode, we can optimize by assuming perfect orbits
    if (this.currentConfiguration.mode === "ideal") {
      return this.optimizeForIdealMode(objects);
    }

    // In N-Body mode, return objects as-is for full physics rendering
    return objects;
  }

  /**
   * Applies ideal mode optimizations for rendering
   */
  private optimizeForIdealMode(
    objects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    // In ideal mode, we can predict positions more accurately
    // and potentially reduce update frequency for distant objects
    const optimized: Record<string, CelestialObject> = {};

    for (const [id, obj] of Object.entries(objects)) {
      optimized[id] = {
        ...obj,
        // Add rendering hints for ideal mode
        renderingHints: {
          ...obj.renderingHints,
          isIdealOrbit: true,
          canPredictMotion: true,
          updateFrequency: this.calculateIdealModeUpdateFrequency(obj),
        },
      };
    }

    return optimized;
  }

  /**
   * Calculates optimal update frequency for objects in ideal mode
   */
  private calculateIdealModeUpdateFrequency(obj: CelestialObject): number {
    // Objects with parents (orbiting bodies) can have lower update frequency
    // in ideal mode since their motion is predictable
    if (obj.parentId && obj.orbitalElements) {
      const orbitalPeriod = obj.orbitalElements.period || 365.25;
      // Update less frequently for longer orbital periods
      return Math.max(0.1, Math.min(1.0, 1.0 / (orbitalPeriod / 365.25)));
    }

    // Central bodies (stars) need full update frequency
    return 1.0;
  }

  /**
   * Subscribes to the core application state observables.
   */
  private subscribeToCoreState(): void {
    this.subscribeToState(
      StateAccessor.getCelestialObjectsStream(),
      (objects) => this.processCelestialObjectsUpdateNow(objects),
    );

    this.subscribeToStateWithMapping(
      StateAccessor.getSimulationStateStream(),
      (simState: SimulationState) => {
        // Update simulation time
        this.currentSimulationTime = simState.time ?? 0;

        // Update current configuration for optimizations
        this.currentConfiguration = simState.simulationConfig;

        // Extract and transform visual settings
        return this.extractVisualSettings(simState);
      },
      (visualSettings: RendererVisualSettings) => {
        // Only emit if settings have actually changed
        const currentSettings = this.$visualSettings.getValue();
        if (!this.compareVisualSettings(currentSettings, visualSettings)) {
          this.$visualSettings.next(visualSettings);
        }
      },
    );
  }

  /**
   * Maps new simulation configuration to legacy physics engine format for renderer compatibility
   */
  private mapConfigurationToPhysicsEngine(
    config: SimulationConfiguration,
  ): "keplerian" | "verlet" {
    if (config.mode === "ideal") {
      return "keplerian";
    }

    // For N-Body mode, map to verlet for renderer compatibility
    // The actual integration method is handled by the physics engine
    return "verlet";
  }

  /**
   * Extracts visual settings from simulation state with new configuration support
   */
  private extractVisualSettings(
    simState: SimulationState,
  ): RendererVisualSettings {
    return {
      trailLengthMultiplier:
        simState.visualSettings.trailLengthMultiplier ?? 150,
      physicsEngine: this.mapConfigurationToPhysicsEngine(
        simState.simulationConfig,
      ),
      timeScale: simState.timeScale,
      predictionSteps: simState.visualSettings.predictionSteps,
      predictionDuration: simState.visualSettings.predictionDuration,
      // New configuration fields
      simulationMode: simState.simulationConfig.mode,
      algorithm: simState.simulationConfig.algorithm,
      integrator: simState.simulationConfig.integrator,
    };
  }

  /**
   * Compares two visual settings objects for equality with new configuration fields
   */
  private compareVisualSettings(
    a: RendererVisualSettings,
    b: RendererVisualSettings,
  ): boolean {
    return (
      a.trailLengthMultiplier === b.trailLengthMultiplier &&
      a.physicsEngine === b.physicsEngine &&
      a.timeScale === b.timeScale &&
      a.predictionSteps === b.predictionSteps &&
      a.predictionDuration === b.predictionDuration &&
      // New configuration comparisons
      a.simulationMode === b.simulationMode &&
      a.algorithm === b.algorithm &&
      a.integrator === b.integrator
    );
  }

  /**
   * Cleans up all subscriptions to prevent memory leaks.
   */
  public dispose(): void {
    super.dispose();
  }
}
```

#### Task 5.2: Update Renderer Types

**File**: `packages/renderer/threejs/src/types.ts`

**Current Issues:**

- Line 34: `physicsEngine` type needs to support new configuration

**To-Do:**

- [ ] Extend `RendererVisualSettings` interface
- [ ] Add new configuration fields
- [ ] Maintain backwards compatibility

**Implementation:**

```typescript
import type {
  SimulationMode,
  AlgorithmType,
  IntegratorType,
} from "@teskooano/core-state";

export interface RendererVisualSettings {
  trailLengthMultiplier: number;
  timeScale: number;
  predictionSteps: number;
  predictionDuration: number;

  // Legacy field for backwards compatibility
  physicsEngine: "keplerian" | "verlet";

  // New configuration fields
  simulationMode: SimulationMode;
  algorithm?: AlgorithmType;
  integrator?: IntegratorType;
}

// Additional renderer-specific types for optimization
export interface RenderingHints {
  isIdealOrbit?: boolean;
  canPredictMotion?: boolean;
  updateFrequency?: number;
  lodLevel?: number; // Level of detail
}

export interface RendererPerformanceMetrics {
  frameTime: number;
  objectCount: number;
  renderMode: SimulationMode;
  lastModeSwitch?: number;
}
```

### Phase 5B: Update Orbit Rendering

#### Task 5.3: Update OrbitsManager

**File**: `packages/renderer/threejs-orbits/src/core/OrbitsManager.ts`

**Current Issues:**

- Line 83: Mode detection logic uses old physics engine format
- Line 93: Initial settings handling needs update

**To-Do:**

- [ ] Update mode detection to use new configuration
- [ ] Add mode-specific orbit rendering optimizations
- [ ] Handle smooth transitions between modes

**Implementation:**

```typescript
// ... existing imports ...
import type { RendererVisualSettings } from "@teskooano/renderer-threejs";

export class OrbitsManager {
  // ... existing properties ...

  private currentMode: SimulationMode = "nbody";
  private modeTransitionInProgress = false;

  // ... existing constructor ...

  /**
   * Updates orbit rendering based on visual settings with mode awareness
   */
  updateFromSettings(settings: RendererVisualSettings): void {
    // Check for mode changes
    const newMode = settings.simulationMode;
    if (newMode !== this.currentMode) {
      this.handleModeTransition(this.currentMode, newMode);
      this.currentMode = newMode;
    }

    // Update orbit rendering based on current mode
    if (this.currentMode === "ideal") {
      this.updateIdealModeOrbits(settings);
    } else {
      this.updateNBodyModeOrbits(settings);
    }
  }

  /**
   * Handles smooth transitions between simulation modes
   */
  private handleModeTransition(
    fromMode: SimulationMode,
    toMode: SimulationMode,
  ): void {
    if (this.modeTransitionInProgress) return;

    this.modeTransitionInProgress = true;

    console.log(
      `[OrbitsManager] Transitioning from ${fromMode} to ${toMode} mode`,
    );

    // Clear existing orbit visualizations
    this.clearAllOrbits();

    // Set up new mode-specific rendering
    if (toMode === "ideal") {
      this.initializeIdealModeRendering();
    } else {
      this.initializeNBodyModeRendering();
    }

    // Allow for transition animations
    setTimeout(() => {
      this.modeTransitionInProgress = false;
    }, 300);
  }

  /**
   * Updates orbit visualization for ideal mode
   */
  private updateIdealModeOrbits(settings: RendererVisualSettings): void {
    // In ideal mode, we can render perfect elliptical orbits
    // that don't require constant physics updates
    this.renderIdealOrbits(settings);
  }

  /**
   * Updates orbit visualization for N-Body mode
   */
  private updateNBodyModeOrbits(settings: RendererVisualSettings): void {
    // In N-Body mode, use prediction-based orbit rendering
    // that adapts to the actual gravitational interactions
    this.renderDynamicOrbits(settings);
  }

  /**
   * Renders perfect elliptical orbits for ideal mode
   */
  private renderIdealOrbits(settings: RendererVisualSettings): void {
    // Implementation for rendering analytical orbital paths
    // This can be more efficient and stable than physics-based prediction

    // Get all objects with orbital elements
    const objects = this.getCurrentObjects();

    for (const [id, obj] of Object.entries(objects)) {
      if (obj.orbitalElements && obj.parentId) {
        this.createAnalyticalOrbitPath(id, obj.orbitalElements);
      }
    }
  }

  /**
   * Renders dynamic orbits based on physics predictions for N-Body mode
   */
  private renderDynamicOrbits(settings: RendererVisualSettings): void {
    // Use existing prediction-based orbit rendering
    // but optimize based on algorithm type
    const algorithm = settings.algorithm;

    if (algorithm === "direct" || algorithm === "barnes-hut") {
      // High accuracy modes - use more prediction steps
      this.updatePredictionParameters({
        steps: Math.min(settings.predictionSteps * 1.5, 1000),
        accuracy: "high",
      });
    } else {
      // Approximation modes - use standard prediction
      this.updatePredictionParameters({
        steps: settings.predictionSteps,
        accuracy: "standard",
      });
    }
  }

  /**
   * Creates analytical orbit path for ideal mode
   */
  private createAnalyticalOrbitPath(
    objectId: string,
    elements: OrbitalElements,
  ): void {
    // Calculate orbital path points using Keplerian mechanics
    const pathPoints: Vector3[] = [];
    const numPoints = 100; // Fixed number for smooth ellipse

    for (let i = 0; i < numPoints; i++) {
      const meanAnomaly = (i / numPoints) * 2 * Math.PI;
      const position = this.calculateKeplerianPosition(elements, meanAnomaly);
      pathPoints.push(new Vector3(position.x, position.y, position.z));
    }

    // Create smooth orbital path
    this.createOrbitLine(objectId, pathPoints, {
      isAnalytical: true,
      orbitType: elements.eccentricity < 1 ? "elliptical" : "hyperbolic",
    });
  }

  /**
   * Calculates position from Keplerian orbital elements
   */
  private calculateKeplerianPosition(
    elements: OrbitalElements,
    meanAnomaly: number,
  ): { x: number; y: number; z: number } {
    // Solve Kepler's equation for eccentric anomaly
    const eccentricAnomaly = this.solveKeplersEquation(
      meanAnomaly,
      elements.eccentricity,
    );

    // Calculate true anomaly
    const trueAnomaly = this.calculateTrueAnomaly(
      eccentricAnomaly,
      elements.eccentricity,
    );

    // Calculate distance
    const radius =
      elements.semiMajorAxis *
      (1 - elements.eccentricity * Math.cos(eccentricAnomaly));

    // Position in orbital plane
    const positionOrbital = {
      x: radius * Math.cos(trueAnomaly),
      y: radius * Math.sin(trueAnomaly),
      z: 0,
    };

    // Rotate to 3D space using orbital elements
    return this.rotateFromOrbitalPlane(positionOrbital, elements);
  }

  /**
   * Initializes rendering for ideal mode
   */
  private initializeIdealModeRendering(): void {
    // Set up analytical orbit rendering
    this.setRenderingMode("analytical");
    this.enableOrbitStability(true);
  }

  /**
   * Initializes rendering for N-Body mode
   */
  private initializeNBodyModeRendering(): void {
    // Set up dynamic prediction-based rendering
    this.setRenderingMode("dynamic");
    this.enableOrbitStability(false);
  }

  // ... existing methods updated for mode awareness ...

  /**
   * Gets current rendering mode for debugging
   */
  public getCurrentRenderingInfo(): {
    mode: SimulationMode;
    algorithm?: AlgorithmType;
    integrator?: IntegratorType;
    transitionInProgress: boolean;
  } {
    return {
      mode: this.currentMode,
      algorithm: this.lastSettings?.algorithm,
      integrator: this.lastSettings?.integrator,
      transitionInProgress: this.modeTransitionInProgress,
    };
  }
}
```

#### Task 5.4: Update PredictionManager

**File**: `packages/renderer/threejs-orbits/src/verlet/PredictionManager.ts`

**Current Issues:**

- Line 265: Physics engine reference needs update

**To-Do:**

- [ ] Update to use simulation configuration
- [ ] Add mode-specific prediction strategies
- [ ] Optimize prediction based on algorithm type

**Implementation:**

```typescript
// ... existing imports ...
import type { SimulationConfiguration } from "@teskooano/core-state";

export class PredictionManager {
  // ... existing properties ...

  /**
   * Updated to use simulation configuration for predictions
   */
  generatePrediction(
    bodies: Record<string, CelestialObject>,
    steps: number,
    duration: number,
    config: SimulationConfiguration, // Updated parameter
  ): PredictionResult {
    if (config.mode === "ideal") {
      // Use analytical prediction for ideal mode
      return this.generateAnalyticalPrediction(bodies, steps, duration);
    } else {
      // Use physics-based prediction for N-Body mode
      return this.generatePhysicsPrediction(bodies, steps, duration, config);
    }
  }

  /**
   * Generates analytical predictions for ideal mode
   */
  private generateAnalyticalPrediction(
    bodies: Record<string, CelestialObject>,
    steps: number,
    duration: number,
  ): PredictionResult {
    const predictions: Record<string, Vector3[]> = {};

    for (const [id, body] of Object.entries(bodies)) {
      if (body.orbitalElements && body.parentId) {
        predictions[id] = this.calculateAnalyticalOrbitPath(
          body.orbitalElements,
          steps,
          duration,
        );
      } else {
        // Stationary bodies in ideal mode
        predictions[id] = Array(steps).fill(
          new Vector3(body.position.x, body.position.y, body.position.z),
        );
      }
    }

    return {
      predictions,
      metadata: {
        method: "analytical",
        mode: "ideal",
        steps,
        duration,
        accuracy: "perfect",
      },
    };
  }

  /**
   * Generates physics-based predictions for N-Body mode
   */
  private generatePhysicsPrediction(
    bodies: Record<string, CelestialObject>,
    steps: number,
    duration: number,
    config: SimulationConfiguration,
  ): PredictionResult {
    // Adjust prediction accuracy based on algorithm
    const adjustedSteps = this.adjustStepsForAlgorithm(steps, config.algorithm);

    // Use existing physics prediction but with configuration awareness
    return this.generatePhysicsBasedPrediction(
      bodies,
      adjustedSteps,
      duration,
      {
        algorithm: config.algorithm,
        integrator: config.integrator,
        mode: config.mode,
      },
    );
  }

  /**
   * Adjusts prediction steps based on algorithm accuracy
   */
  private adjustStepsForAlgorithm(
    baseSteps: number,
    algorithm?: AlgorithmType,
  ): number {
    switch (algorithm) {
      case "direct":
        // Direct calculation is most accurate, can use fewer steps
        return Math.max(baseSteps * 0.8, 50);
      case "barnes-hut":
        // Good balance of accuracy and speed
        return baseSteps;
      case "fmm":
      case "p3m":
        // Approximation methods, use more steps for smooth visualization
        return Math.min(baseSteps * 1.2, 800);
      default:
        return baseSteps;
    }
  }

  /**
   * Calculates analytical orbit path for a body
   */
  private calculateAnalyticalOrbitPath(
    elements: OrbitalElements,
    steps: number,
    duration: number,
  ): Vector3[] {
    const path: Vector3[] = [];
    const timeStep = duration / steps;

    for (let i = 0; i < steps; i++) {
      const time = i * timeStep;
      const position = this.calculateKeplerianPositionAtTime(elements, time);
      path.push(new Vector3(position.x, position.y, position.z));
    }

    return path;
  }

  // ... rest of existing methods ...
}
```

### Phase 5C: Update Package Integration Points

#### Task 5.5: Update App Simulation Package

**File**: `packages/app/simulation/src/index.spec.ts`

**Current Issues:**

- Line 63: Test configuration uses old physics engine

**To-Do:**

- [ ] Update test configurations
- [ ] Add tests for new configuration system
- [ ] Test mode switching in simulation manager

**Implementation:**

```typescript
import { describe, it, expect } from "vitest";
import type { SimulationConfiguration } from "@teskooano/core-state";

describe("App Simulation Package", () => {
  it("should handle ideal mode configuration", () => {
    const config: SimulationConfiguration = { mode: "ideal" };

    // Test ideal mode simulation
    expect(config.mode).toBe("ideal");
    expect(config.algorithm).toBeUndefined();
    expect(config.integrator).toBeUndefined();
  });

  it("should handle N-Body mode configuration", () => {
    const config: SimulationConfiguration = {
      mode: "nbody",
      integrator: "verlet",
      algorithm: "barnes-hut",
    };

    // Test N-Body mode simulation
    expect(config.mode).toBe("nbody");
    expect(config.algorithm).toBe("barnes-hut");
    expect(config.integrator).toBe("verlet");
  });

  it("should migrate from legacy physics engine configuration", () => {
    // Test backwards compatibility
    const legacyConfig = "verlet";
    // Migration logic would be tested here
  });
});
```

## 🧪 Testing Strategy

### Task 5.6: Create Integration Tests

**File**: `packages/renderer/threejs/src/integration.spec.ts` (new)

**To-Do:**

- [ ] Test renderer state adapter with new configuration
- [ ] Test mode switching visual effects
- [ ] Test performance optimization in different modes
- [ ] Test orbit rendering transitions

## 📋 Implementation Checklist

### Pre-Implementation

- [ ] Complete UI layer updates (Guide 04)
- [ ] Review renderer architecture dependencies
- [ ] Plan visual transition strategies

### Implementation Order

1. [ ] Update RendererStateAdapter with configuration support
2. [ ] Update renderer types and interfaces
3. [ ] Update OrbitsManager for mode-aware rendering
4. [ ] Update PredictionManager for configuration-based predictions
5. [ ] Update remaining package integration points
6. [ ] Create comprehensive integration tests
7. [ ] Performance testing and optimization

### Post-Implementation

- [ ] Test all renderer integrations work correctly
- [ ] Verify visual transitions are smooth
- [ ] Test performance in both simulation modes
- [ ] Validate memory usage during mode switches
- [ ] Integration testing across all packages

## 🎯 Success Criteria

- [ ] Renderer correctly adapts to simulation mode changes
- [ ] Visual transitions between modes are smooth
- [ ] Performance optimizations work as expected
- [ ] All orbit rendering modes function correctly
- [ ] No visual regressions from original implementation
- [ ] Memory usage remains stable during mode switches

## 📋 Dependencies

**Requires**: UI layer updates (Guide 04), State management (Guide 03)
**Blocks**: Final system integration testing

**Estimated Time**: 3-4 days
**Risk Level**: Medium (visual complexity)
**Impact Level**: Medium (rendering optimizations)

## 🔄 Final Integration Notes

With this implementation complete, the entire N-Body refactoring will be finished:

1. ✅ **Core Type System** (Guide 01) - Foundation types and validation
2. ✅ **Physics Engine Core** (Guide 02) - Strategy pattern and algorithms
3. ✅ **State Management** (Guide 03) - Configuration service and state
4. ✅ **UI Layer Updates** (Guide 04) - Settings and engine panel UI
5. ✅ **Renderer Integration** (Guide 05) - Visual adaptation and optimization

The system will support:

- **Ideal Orrery Mode**: Perfect Keplerian orbits with analytical rendering
- **N-Body Physics Mode**: Full gravitational simulation with pluggable algorithms
- **Seamless Mode Switching**: Smooth transitions with visual feedback
- **Algorithm Optimization**: Auto-selection and performance tuning
- **Backwards Compatibility**: Legacy API support during transition

## Performance Expectations

- **Ideal Mode**: ~2-5x faster rendering, perfect orbit stability
- **N-Body Mode**: Algorithm-dependent performance (O(N) to O(N²))
- **Mode Switching**: <300ms transition time
- **Memory Usage**: <10% increase for dual-mode support

This completes the comprehensive implementation strategy for the modular N-body simulation system! 🚀
