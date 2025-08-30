# Phase 2: Create BaseCelestialRenderer OrbitManager

## 🎯 Goal

Create a combined OrbitManager class within BaseCelestialRenderer that manages both calculated orbital properties and position history, subscribes to physics data providers, and coordinates with the global OrbitsOrchestrator.

## 📋 Steps

### Step 2.1: Create Combined OrbitManager Class

**File**: `packages/renderer/threejs-celestial/src/base/managers/OrbitManager.ts`

**Purpose**: Create a combined manager that handles both calculated orbital properties and position history for individual celestial objects

```typescript
import { OSVector3 } from "@teskooano/core-math";
import {
  OrbitalProvider,
  KeplerianOrbitManager,
  NBodyTrailManager,
  PredictionManager,
  SimulationMode,
} from "@teskooano/core-physics";
import {
  RenderableCelestialObject,
  OrbitalParameters,
} from "@teskooano/data-types";

export interface OrbitRenderData {
  keplerianPoints?: THREE.Vector3[];
  trailPoints?: THREE.Vector3[];
  predictionPoints?: THREE.Vector3[];
  predictionTimestamps?: number[];
}

export interface OrbitVisibility {
  orbitLines: boolean;
  trailLines: boolean;
  predictionLines: boolean;
}

export interface OrbitConfig {
  maxHistoryPoints: number;
  minDistanceThreshold: number;
  showOrbitLines: boolean;
  showPredictionLines: boolean;
  orbitLineLODDistance: number;
  trailLODDistance: number;
  predictionLODDistance: number;
}

/**
 * Combined manager for orbit data and position history
 * Manages both calculated orbital properties and position history for a single celestial object
 */
export class OrbitManager {
  private objectId: string;
  private config: OrbitConfig;
  private simulationMode: SimulationMode = SimulationMode.IDEAL;
  private orchestrator?: OrbitsOrchestrator;

  // Two main properties as requested:
  // 1. Calculated orbital properties (Keplerian orbit points, predictions)
  private calculatedProperties: {
    keplerianPoints?: OSVector3[];
    predictionPoints?: OSVector3[];
    predictionTimestamps?: number[];
  } = {};

  // 2. Position history (for N-body trails)
  private positionHistory: OSVector3[] = [];

  // Current render data (converted to THREE.Vector3 for rendering)
  private currentRenderData: OrbitRenderData = {};
  private currentVisibility: OrbitVisibility = {
    orbitLines: true,
    trailLines: true,
    predictionLines: true,
  };

  constructor(
    objectId: string,
    config: OrbitConfig,
    private onDataUpdate: (data: OrbitRenderData) => void,
    private onVisibilityUpdate: (visibility: OrbitVisibility) => void,
  ) {
    this.objectId = objectId;
    this.config = config;
  }

  /**
   * Set the orchestrator reference
   */
  setOrchestrator(orchestrator: OrbitsOrchestrator): void {
    this.orchestrator = orchestrator;
  }

  /**
   * Update the simulation mode and setup appropriate data management
   */
  updateSimulationMode(mode: SimulationMode): void {
    if (this.simulationMode === mode) return;

    this.simulationMode = mode;
    this.updateCalculatedProperties();
  }

  /**
   * Update with current object data
   */
  update(object: RenderableCelestialObject, currentTime: number): void {
    // Always update calculated properties (Keplerian orbit points)
    this.updateCalculatedProperties(object);

    // Update position history in N-body mode
    if (this.simulationMode === SimulationMode.N_BODY) {
      this.updatePositionHistory(object);
    }

    // Update predictions if enabled
    if (this.config.showPredictionLines) {
      this.updatePredictionProperties(object, currentTime);
    }

    // Convert to render data and notify
    this.updateRenderData();
  }

  /**
   * Update calculated orbital properties (Keplerian orbit points)
   * These are calculated once per simulation and cached
   */
  private updateCalculatedProperties(object?: RenderableCelestialObject): void {
    if (!object?.orbit) {
      this.calculatedProperties.keplerianPoints = undefined;
      return;
    }

    // Get Keplerian orbit points (calculated once, cached)
    this.calculatedProperties.keplerianPoints =
      OrbitalProvider.getKeplerianOrbitPoints(
        this.objectId,
        object.orbit,
        this.config.maxHistoryPoints,
      );
  }

  /**
   * Update position history (for N-body trails)
   * Only used in N-body simulation mode
   */
  private updatePositionHistory(object: RenderableCelestialObject): void {
    // Add current position to history
    const currentPosition = new OSVector3(
      object.position.x,
      object.position.y,
      object.position.z,
    );

    // Add to N-body trail manager
    OrbitalProvider.addNBodyPosition(this.objectId, currentPosition);

    // Get updated trail points
    this.positionHistory = OrbitalProvider.getNBodyTrailPoints(
      this.objectId,
      this.config.maxHistoryPoints,
    );
  }

  /**
   * Update prediction properties
   * Optional feature available in both modes
   */
  private updatePredictionProperties(
    object: RenderableCelestialObject,
    currentTime: number,
  ): void {
    if (!object.orbit) {
      this.calculatedProperties.predictionPoints = undefined;
      this.calculatedProperties.predictionTimestamps = undefined;
      return;
    }

    const prediction = OrbitalProvider.getPredictionPoints(
      this.objectId,
      object.orbit,
      currentTime,
    );

    this.calculatedProperties.predictionPoints = prediction.points;
    this.calculatedProperties.predictionTimestamps = prediction.timestamps;
  }

  /**
   * Convert internal data to render data and notify
   */
  private updateRenderData(): void {
    // Convert calculated properties to render data
    this.currentRenderData = {
      keplerianPoints: this.calculatedProperties.keplerianPoints?.map((p) =>
        p.toThreeJS(),
      ),
      trailPoints:
        this.simulationMode === SimulationMode.N_BODY
          ? this.positionHistory.map((p) => p.toThreeJS())
          : undefined,
      predictionPoints: this.calculatedProperties.predictionPoints?.map((p) =>
        p.toThreeJS(),
      ),
      predictionTimestamps: this.calculatedProperties.predictionTimestamps,
    };

    // Notify of data update
    this.onDataUpdate(this.currentRenderData);

    // Also send to orchestrator if available
    if (this.orchestrator) {
      this.orchestrator.updateObjectData(this.objectId, this.currentRenderData);
    }
  }

  /**
   * Set visibility for this object's orbits
   */
  setVisibility(visibility: OrbitVisibility): void {
    this.currentVisibility = { ...visibility };
    this.onVisibilityUpdate(this.currentVisibility);

    // Also send to orchestrator if available
    if (this.orchestrator) {
      this.orchestrator.setObjectVisibility(
        this.objectId,
        this.currentVisibility,
      );
    }
  }

  /**
   * LOD visibility checks
   */
  shouldShowOrbitLines(cameraDistance: number): boolean {
    if (!this.config.showOrbitLines) return false;
    return cameraDistance <= this.config.orbitLineLODDistance;
  }

  shouldShowTrailLines(cameraDistance: number): boolean {
    if (this.simulationMode !== SimulationMode.N_BODY) return false;
    return cameraDistance <= this.config.trailLODDistance;
  }

  shouldShowPredictionLines(cameraDistance: number): boolean {
    if (!this.config.showPredictionLines) return false;
    return cameraDistance <= this.config.predictionLODDistance;
  }

  /**
   * Get current orbit data
   */
  getCurrentData(): OrbitRenderData {
    return this.currentRenderData;
  }

  /**
   * Get current visibility settings
   */
  getVisibility(): OrbitVisibility {
    return this.currentVisibility;
  }

  /**
   * Get calculated properties (for debugging/testing)
   */
  getCalculatedProperties() {
    return this.calculatedProperties;
  }

  /**
   * Get position history (for debugging/testing)
   */
  getPositionHistory(): OSVector3[] {
    return this.positionHistory;
  }

  /**
   * Get current simulation mode
   */
  getSimulationMode(): SimulationMode {
    return this.simulationMode;
  }

  /**
   * Clear position history (useful when switching modes)
   */
  clearPositionHistory(): void {
    this.positionHistory = [];
    NBodyTrailManager.clearTrail(this.objectId);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Clear position history
    this.clearPositionHistory();

    // Clear calculated properties
    this.calculatedProperties = {};

    // Clear render data
    this.currentRenderData = {};
  }
}
```

**Dependencies**: Physics package providers (OrbitalProvider, KeplerianOrbitManager, NBodyTrailManager, PredictionManager)

### Step 2.2: Integrate OrbitManager into BaseCelestialRenderer

**File**: `packages/renderer/threejs-celestial/src/base/BaseCelestialRenderer.ts`

**Purpose**: Integrate the combined OrbitManager into BaseCelestialRenderer

```typescript
import {
  OrbitManager,
  OrbitRenderData,
  OrbitVisibility,
  OrbitConfig,
} from "./managers/OrbitManager";
import { SimulationMode } from "@teskooano/core-physics";

export abstract class BaseCelestialRenderer {
  // ... existing properties ...

  // Combined orbit manager (replaces separate position history manager)
  public orbitManager!: OrbitManager;

  // Remove static orchestrator reference - will be passed through constructor or setter

  constructor(
    objectOrOptions: RenderableCelestialObject | BaseCelestialRendererOptions,
    options: BaseCelestialRendererOptions = {},
  ) {
    // ... existing constructor logic ...

    // Initialize combined orbit manager
    const orbitConfig: OrbitConfig = {
      maxHistoryPoints: options.maxHistoryPoints || 1000,
      minDistanceThreshold: options.minDistanceThreshold || 1e-6,
      showOrbitLines: options.showOrbitLines !== false,
      showPredictionLines: options.showPredictionLines || false,
      orbitLineLODDistance: options.orbitLineLODDistance || 1000,
      trailLODDistance: options.trailLODDistance || 500,
      predictionLODDistance: options.predictionLODDistance || 800,
    };

    this.orbitManager = new OrbitManager(
      this.object.id,
      orbitConfig,
      this.handleOrbitDataUpdate.bind(this),
      this.handleOrbitVisibilityUpdate.bind(this),
    );
  }

  /**
   * Set the orchestrator reference (called by parent renderer)
   */
  setOrchestrator(orchestrator: OrbitsOrchestrator): void {
    // Store orchestrator reference for orbit manager to use
    this.orbitManager.setOrchestrator(orchestrator);
  }

  /**
   * Handle orbit data updates from OrbitManager
   */
  private handleOrbitDataUpdate(data: OrbitRenderData): void {
    // OrbitManager will handle sending data to orchestrator
    // No need to store orchestrator reference here
  }

  /**
   * Handle orbit visibility updates from OrbitManager
   */
  private handleOrbitVisibilityUpdate(visibility: OrbitVisibility): void {
    // OrbitManager will handle sending visibility to orchestrator
    // No need to store orchestrator reference here
  }

  /**
   * Enhanced update method
   */
  update(
    object: RenderableCelestialObject,
    camera: THREE.Camera,
    allObjects: RenderableCelestialObject[],
    currentTime: number,
  ): void {
    // ... existing update logic ...

    // Update orbit manager
    const simulationMode = this.getSimulationMode();
    this.orbitManager.updateSimulationMode(simulationMode);
    this.orbitManager.update(object, currentTime);

    // Check LOD visibility and update
    const cameraDistance = camera.position.distanceTo(object.position);
    const shouldShowOrbitLines =
      this.orbitManager.shouldShowOrbitLines(cameraDistance);
    const shouldShowTrailLines =
      this.orbitManager.shouldShowTrailLines(cameraDistance);
    const shouldShowPredictionLines =
      this.orbitManager.shouldShowPredictionLines(cameraDistance);

    // Update visibility in orbit manager
    const visibility: OrbitVisibility = {
      orbitLines: shouldShowOrbitLines,
      trailLines: shouldShowTrailLines,
      predictionLines: shouldShowPredictionLines,
    };

    this.orbitManager.setVisibility(visibility);
  }

  /**
   * Get current simulation mode
   */
  private getSimulationMode(): SimulationMode {
    // This should be determined from the global state
    // For now, return a default
    return SimulationMode.IDEAL;
  }

  /**
   * Enhanced dispose method
   */
  dispose(): void {
    // ... existing dispose logic ...
    this.orbitManager.dispose();
  }
}
```

### Step 2.3: Update Type Definitions

**File**: `packages/renderer/threejs-celestial/src/base/types.ts`

**Purpose**: Add orbit-related types and update existing interfaces

```typescript
// Add to existing types file

export interface OrbitRenderData {
  keplerianPoints?: THREE.Vector3[];
  trailPoints?: THREE.Vector3[];
  predictionPoints?: THREE.Vector3[];
  predictionTimestamps?: number[];
}

export interface OrbitVisibility {
  orbitLines: boolean;
  trailLines: boolean;
  predictionLines: boolean;
}

export interface OrbitConfig {
  maxHistoryPoints: number;
  minDistanceThreshold: number;
  showOrbitLines: boolean;
  showPredictionLines: boolean;
  orbitLineLODDistance: number;
  trailLODDistance: number;
  predictionLODDistance: number;
}

// Update existing BaseCelestialRendererOptions interface
export interface BaseCelestialRendererOptions {
  // ... existing options ...

  // Orbit-related options
  maxHistoryPoints?: number;
  minDistanceThreshold?: number;
  showOrbitLines?: boolean;
  showPredictionLines?: boolean;
  orbitLineLODDistance?: number;
  trailLODDistance?: number;
  predictionLODDistance?: number;
}
```

## 🧪 Testing

### Unit Tests

**File**: `packages/renderer/threejs-celestial/src/base/managers/OrbitManager.spec.ts`

```typescript
import { OrbitManager } from "../OrbitManager";
import { RenderableCelestialObject } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { SimulationMode } from "@teskooano/core-physics";

describe("OrbitManager", () => {
  let orbitManager: OrbitManager;
  let mockOnDataUpdate: jest.Mock;
  let mockOnVisibilityUpdate: jest.Mock;

  beforeEach(() => {
    mockOnDataUpdate = jest.fn();
    mockOnVisibilityUpdate = jest.fn();

    orbitManager = new OrbitManager(
      "test-object",
      {
        maxHistoryPoints: 1000,
        minDistanceThreshold: 1e-6,
        showOrbitLines: true,
        showPredictionLines: false,
        orbitLineLODDistance: 1000,
        trailLODDistance: 500,
        predictionLODDistance: 800,
      },
      mockOnDataUpdate,
      mockOnVisibilityUpdate,
    );
  });

  it("should update simulation mode correctly", () => {
    orbitManager.updateSimulationMode(SimulationMode.N_BODY);
    // Test that mode is updated correctly
  });

  it("should check LOD visibility correctly", () => {
    expect(orbitManager.shouldShowOrbitLines(500)).toBe(true);
    expect(orbitManager.shouldShowOrbitLines(1500)).toBe(false);
  });

  it("should handle data updates", () => {
    const mockObject: RenderableCelestialObject = {
      id: "test-object",
      position: { x: 0, y: 0, z: 0 },
      orbit: {
        // ... mock orbital parameters
      },
    } as any;

    orbitManager.update(mockObject, 0);
    expect(mockOnDataUpdate).toHaveBeenCalled();
  });

  it("should manage calculated properties and position history separately", () => {
    const mockObject: RenderableCelestialObject = {
      id: "test-object",
      position: { x: 0, y: 0, z: 0 },
      orbit: {
        // ... mock orbital parameters
      },
    } as any;

    // Test in ideal mode
    orbitManager.updateSimulationMode(SimulationMode.IDEAL);
    orbitManager.update(mockObject, 0);

    const calculatedProps = orbitManager.getCalculatedProperties();
    const positionHistory = orbitManager.getPositionHistory();

    expect(calculatedProps.keplerianPoints).toBeDefined();
    expect(positionHistory.length).toBe(0); // No position history in ideal mode

    // Test in nbody mode
    orbitManager.updateSimulationMode(SimulationMode.N_BODY);
    orbitManager.update(mockObject, 0);

    const newPositionHistory = orbitManager.getPositionHistory();
    expect(newPositionHistory.length).toBeGreaterThan(0); // Should have position history
  });
});
```

## ✅ Success Criteria

- [ ] Combined OrbitManager class created with two properties (calculated properties and position history)
- [ ] Proper integration with physics package providers (OrbitalProvider, etc.)
- [ ] Correct data flow: Keplerian uses calculated properties, N-body uses position history
- [ ] LOD visibility logic implemented
- [ ] Data flow from physics providers to global orchestrator working
- [ ] Unit tests passing
- [ ] No breaking changes to existing BaseCelestialRenderer API

## 🔄 Next Steps

After completing Phase 2:

1. Test integration with existing celestial renderers
2. Verify data flow from physics providers
3. Proceed to Phase 3: Create OrbitsOrchestrator
