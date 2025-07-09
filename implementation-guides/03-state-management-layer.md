# Implementation Guide: State Management Layer

## Overview
This guide details updating the state management layer to use the new `SimulationConfiguration` system while maintaining backwards compatibility and providing smooth migration paths.

## 🎯 Goals
- Replace `physicsEngine` with `simulationConfig` in state
- Update state service methods to handle new configuration
- Provide backwards compatibility during transition
- Add configuration validation and error handling
- Maintain reactive state updates across the application

## ✅ Implementation To-Do List

### Phase 3A: Update State Service

#### Task 3.1: Update SimulationStateService
**File**: `packages/core/state/src/game/simulation.ts`

**Current Issues (Lines to Address):**
- Line 29: `physicsEngine: "verlet"` in initial state
- Line 185-189: `setPhysicsEngine()` method
- Need to add migration logic and validation

**To-Do:**
- [ ] Update initial state to use `SimulationConfiguration`
- [ ] Replace `setPhysicsEngine()` with `setSimulationConfiguration()`
- [ ] Add backwards compatibility methods
- [ ] Add configuration validation
- [ ] Update state interface

**Implementation:**
```typescript
import { OSVector3 } from "@teskooano/core-math";
import { BehaviorSubject, Observable } from "rxjs";
import type {
  PerformanceProfileType,
  SimulationConfiguration,
  LegacyPhysicsEngineType,
  SimulationState,
} from "./types";
import { 
  getDefaultConfiguration, 
  migrateFromLegacyEngine, 
  isValidConfiguration 
} from "./types";

/**
 * @class SimulationStateService
 * @description Manages the simulation's control state including time, pause status,
 * selected objects, camera, simulation configuration, and visual settings.
 * It follows a singleton pattern to ensure a single source of truth for the simulation state.
 */
export class SimulationStateService {
  private static instance: SimulationStateService;

  /** The initial, default state for the simulation. */
  private readonly _initialState: SimulationState = {
    time: 0,
    timeScale: 1,
    paused: false,
    selectedObject: null,
    focusedObjectId: null,
    camera: {
      position: new OSVector3(0, 100, 100),
      target: new OSVector3(0, 0, 0),
      fov: 75,
    },
    // New configuration system
    simulationConfig: getDefaultConfiguration(),
    
    // Keep deprecated field for backwards compatibility (temporary)
    physicsEngine: undefined, // Will be removed in next major version
    
    visualSettings: {
      trailLengthMultiplier: 2,
      showAllOrbits: true,
      showAllLabels: false,
      showAuMarkers: true,
      predictionSteps: 500,
      predictionDuration: 2,
    },
    performanceProfile: "medium",
  };

  /** The RxJS BehaviorSubject holding the current simulation state. */
  private readonly _simulationState: BehaviorSubject<SimulationState>;
  /** An observable that emits the current simulation state whenever it changes. */
  public readonly simulationState$: Observable<SimulationState>;

  /**
   * Private constructor to enforce the singleton pattern.
   * Initializes the state with default values.
   */
  private constructor() {
    this._simulationState = new BehaviorSubject<SimulationState>(
      this._initialState,
    );
    this.simulationState$ = this._simulationState.asObservable();
  }

  /**
   * Provides access to the singleton instance of the SimulationStateService.
   * Creates the instance if it doesn't exist.
   * @returns The singleton instance.
   */
  public static getInstance(): SimulationStateService {
    if (!SimulationStateService.instance) {
      SimulationStateService.instance = new SimulationStateService();
    }
    return SimulationStateService.instance;
  }

  /**
   * Gets the current, instantaneous snapshot of the entire simulation state.
   * @returns The current simulation state object.
   */
  public getSimulationState(): SimulationState {
    return this._simulationState.getValue();
  }

  /**
   * Overwrites the entire simulation state with a new state object.
   * This is a powerful method and should be used with caution. For most updates,
   * prefer using the more specific setter methods like `setTimeScale` or `selectObject`.
   * @param newState The complete new simulation state.
   */
  public setSimulationState(newState: SimulationState): void {
    // Validate configuration before setting
    if (!isValidConfiguration(newState.simulationConfig)) {
      console.warn('[SimulationStateService] Invalid simulation configuration, using default');
      newState = {
        ...newState,
        simulationConfig: getDefaultConfiguration()
      };
    }
    
    this._simulationState.next(newState);
  }

  /**
   * Sets the simulation configuration (mode, algorithm, integrator).
   * Validates the configuration before applying.
   * @param config The new simulation configuration.
   */
  public setSimulationConfiguration(config: SimulationConfiguration): void {
    if (!isValidConfiguration(config)) {
      console.error('[SimulationStateService] Invalid configuration:', config);
      throw new Error(`Invalid simulation configuration: ${JSON.stringify(config)}`);
    }

    this.setSimulationState({
      ...this.getSimulationState(),
      simulationConfig: config,
      // Clear deprecated field when using new API
      physicsEngine: undefined
    });
  }

  /**
   * Sets the simulation mode (ideal or nbody).
   * Automatically selects appropriate defaults for algorithm/integrator if switching to nbody mode.
   * @param mode The simulation mode to set.
   */
  public setSimulationMode(mode: "ideal" | "nbody"): void {
    const currentState = this.getSimulationState();
    
    let newConfig: SimulationConfiguration;
    
    if (mode === "ideal") {
      newConfig = { mode: "ideal" };
    } else {
      // N-Body mode - preserve existing algorithm/integrator or use defaults
      const currentConfig = currentState.simulationConfig;
      newConfig = {
        mode: "nbody",
        algorithm: currentConfig.algorithm || "barnes-hut",
        integrator: currentConfig.integrator || "verlet"
      };
    }
    
    this.setSimulationConfiguration(newConfig);
  }

  /**
   * Sets the algorithm for N-Body simulations.
   * Only valid when in N-Body mode.
   * @param algorithm The force calculation algorithm to use.
   */
  public setNBodyAlgorithm(algorithm: "direct" | "barnes-hut" | "fmm" | "p3m"): void {
    const currentState = this.getSimulationState();
    
    if (currentState.simulationConfig.mode !== "nbody") {
      console.warn('[SimulationStateService] Cannot set algorithm when not in N-Body mode');
      return;
    }
    
    this.setSimulationConfiguration({
      mode: "nbody",
      algorithm,
      integrator: currentState.simulationConfig.integrator || "verlet"
    });
  }

  /**
   * Sets the integrator for N-Body simulations.
   * Only valid when in N-Body mode.
   * @param integrator The numerical integrator to use.
   */
  public setNBodyIntegrator(integrator: "euler" | "symplectic" | "verlet" | "rk4" | "adaptive"): void {
    const currentState = this.getSimulationState();
    
    if (currentState.simulationConfig.mode !== "nbody") {
      console.warn('[SimulationStateService] Cannot set integrator when not in N-Body mode');
      return;
    }
    
    this.setSimulationConfiguration({
      mode: "nbody",
      algorithm: currentState.simulationConfig.algorithm || "barnes-hut",
      integrator
    });
  }

  /**
   * @deprecated Use setSimulationConfiguration instead
   * Sets the physics integration engine to be used for orbital calculations.
   * This method is kept for backwards compatibility and will be removed in a future version.
   * @param engine The name of the physics engine to use.
   */
  public setPhysicsEngine(engine: LegacyPhysicsEngineType): void {
    console.warn(
      '[SimulationStateService] setPhysicsEngine is deprecated. Use setSimulationConfiguration instead.'
    );
    
    // Migrate legacy engine to new configuration
    const migratedConfig = migrateFromLegacyEngine(engine);
    this.setSimulationConfiguration(migratedConfig);
    
    // Update deprecated field for backwards compatibility
    const currentState = this.getSimulationState();
    this._simulationState.next({
      ...currentState,
      physicsEngine: engine
    });
  }

  /**
   * Gets the current simulation configuration.
   * @returns The current simulation configuration.
   */
  public getSimulationConfiguration(): SimulationConfiguration {
    return this.getSimulationState().simulationConfig;
  }

  /**
   * @deprecated Use getSimulationConfiguration instead
   * Gets the current physics engine (legacy API).
   * @returns The legacy physics engine type.
   */
  public getPhysicsEngine(): LegacyPhysicsEngineType {
    console.warn(
      '[SimulationStateService] getPhysicsEngine is deprecated. Use getSimulationConfiguration instead.'
    );
    
    const config = this.getSimulationConfiguration();
    
    // Convert new configuration back to legacy format
    if (config.mode === "ideal") {
      return "ideal";
    } else if (config.integrator) {
      return config.integrator as LegacyPhysicsEngineType;
    }
    
    return "verlet"; // Default fallback
  }

  // ... rest of existing methods remain unchanged ...
  
  /**
   * Sets the speed at which simulation time progresses relative to real time.
   * @param scale - The new time scale factor. `1` is real-time, `>1` is faster, `<1` is slower.
   */
  public setTimeScale(scale: number): void {
    this.setSimulationState({
      ...this.getSimulationState(),
      timeScale: scale,
    });
  }

  /**
   * Toggles the simulation's paused state.
   */
  public togglePause(): void {
    const currentState = this.getSimulationState();
    this.setSimulationState({
      ...currentState,
      paused: !currentState.paused,
    });
  }

  // ... rest of existing methods unchanged ...
}

/** Singleton instance of the SimulationStateService. */
export const simulationStateService = SimulationStateService.getInstance();
```

#### Task 3.2: Update State Index Exports
**File**: `packages/core/state/src/game/index.ts`

**Current Issues:**
- Line 72: Export old `setPhysicsEngine` method
- Line 104: Export old `PhysicsEngineType`

**To-Do:**
- [ ] Add new configuration methods to exports
- [ ] Keep old exports for backwards compatibility
- [ ] Add deprecation warnings

**Implementation:**
```typescript
// ... existing imports ...
import type {
  SimulationConfiguration,
  SimulationMode,
  IntegratorType,
  AlgorithmType,
  LegacyPhysicsEngineType,
  PhysicsEngineType, // Deprecated alias
} from "./types";

// ... existing StateAccessor class ...

// Updated exports object
export const actions = {
  // ... existing actions ...
  
  // New configuration methods
  setSimulationConfiguration: simulationStateService.setSimulationConfiguration.bind(simulationStateService),
  setSimulationMode: simulationStateService.setSimulationMode.bind(simulationStateService),
  setNBodyAlgorithm: simulationStateService.setNBodyAlgorithm.bind(simulationStateService),
  setNBodyIntegrator: simulationStateService.setNBodyIntegrator.bind(simulationStateService),
  
  // Deprecated methods (kept for backwards compatibility)
  /** @deprecated Use setSimulationConfiguration instead */
  setPhysicsEngine: simulationStateService.setPhysicsEngine.bind(simulationStateService),
};

// Updated type exports
export type {
  // New types
  SimulationConfiguration,
  SimulationMode,
  IntegratorType,
  AlgorithmType,
  
  // Backwards compatibility
  LegacyPhysicsEngineType,
  
  // Deprecated (aliased for compatibility)
  /** @deprecated Use SimulationConfiguration instead */
  LegacyPhysicsEngineType as PhysicsEngineType,
  
  // ... existing exports ...
};
```

### Phase 3B: Update State Tests

#### Task 3.3: Update State Service Tests
**File**: `packages/core/state/src/game/game.spec.ts`

**Current Issues:**
- Lines 117, 180: Tests using old `physicsEngine` property

**To-Do:**
- [ ] Update existing tests to use new configuration
- [ ] Add tests for new configuration methods
- [ ] Test backwards compatibility
- [ ] Test validation and error handling

**Implementation:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { simulationStateService } from './simulation';
import type { SimulationConfiguration } from './types';

describe('SimulationStateService', () => {
  beforeEach(() => {
    // Reset service state before each test
    const service = simulationStateService as any;
    service._simulationState.next(service._initialState);
  });

  describe('Simulation Configuration', () => {
    it('should initialize with default N-Body configuration', () => {
      const state = simulationStateService.getSimulationState();
      expect(state.simulationConfig).toEqual({
        mode: "nbody",
        integrator: "verlet",
        algorithm: "barnes-hut"
      });
    });

    it('should set valid ideal configuration', () => {
      const config: SimulationConfiguration = { mode: "ideal" };
      
      simulationStateService.setSimulationConfiguration(config);
      
      const state = simulationStateService.getSimulationState();
      expect(state.simulationConfig).toEqual(config);
    });

    it('should set valid N-Body configuration', () => {
      const config: SimulationConfiguration = {
        mode: "nbody",
        integrator: "rk4",
        algorithm: "fmm"
      };
      
      simulationStateService.setSimulationConfiguration(config);
      
      const state = simulationStateService.getSimulationState();
      expect(state.simulationConfig).toEqual(config);
    });

    it('should reject invalid configurations', () => {
      const invalidConfig = {
        mode: "nbody"
        // Missing required integrator and algorithm
      } as SimulationConfiguration;
      
      expect(() => {
        simulationStateService.setSimulationConfiguration(invalidConfig);
      }).toThrow('Invalid simulation configuration');
    });

    it('should switch simulation modes correctly', () => {
      // Start with N-Body
      simulationStateService.setSimulationMode("nbody");
      let state = simulationStateService.getSimulationState();
      expect(state.simulationConfig.mode).toBe("nbody");
      expect(state.simulationConfig.algorithm).toBe("barnes-hut");
      expect(state.simulationConfig.integrator).toBe("verlet");

      // Switch to Ideal
      simulationStateService.setSimulationMode("ideal");
      state = simulationStateService.getSimulationState();
      expect(state.simulationConfig).toEqual({ mode: "ideal" });
    });

    it('should update N-Body algorithm', () => {
      simulationStateService.setSimulationMode("nbody");
      simulationStateService.setNBodyAlgorithm("fmm");
      
      const state = simulationStateService.getSimulationState();
      expect(state.simulationConfig.algorithm).toBe("fmm");
      expect(state.simulationConfig.integrator).toBe("verlet"); // Should preserve
    });

    it('should update N-Body integrator', () => {
      simulationStateService.setSimulationMode("nbody");
      simulationStateService.setNBodyIntegrator("rk4");
      
      const state = simulationStateService.getSimulationState();
      expect(state.simulationConfig.integrator).toBe("rk4");
      expect(state.simulationConfig.algorithm).toBe("barnes-hut"); // Should preserve
    });

    it('should warn when setting algorithm in ideal mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      simulationStateService.setSimulationMode("ideal");
      simulationStateService.setNBodyAlgorithm("fmm");
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot set algorithm when not in N-Body mode')
      );
    });
  });

  describe('Backwards Compatibility', () => {
    it('should handle legacy setPhysicsEngine calls', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      simulationStateService.setPhysicsEngine("ideal");
      
      const state = simulationStateService.getSimulationState();
      expect(state.simulationConfig.mode).toBe("ideal");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('setPhysicsEngine is deprecated')
      );
    });

    it('should migrate legacy physics engines correctly', () => {
      simulationStateService.setPhysicsEngine("verlet");
      
      const state = simulationStateService.getSimulationState();
      expect(state.simulationConfig).toEqual({
        mode: "nbody",
        integrator: "verlet",
        algorithm: "barnes-hut"
      });
    });

    it('should handle getPhysicsEngine deprecation', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      simulationStateService.setSimulationConfiguration({
        mode: "nbody",
        integrator: "rk4",
        algorithm: "fmm"
      });
      
      const engine = simulationStateService.getPhysicsEngine();
      
      expect(engine).toBe("rk4");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('getPhysicsEngine is deprecated')
      );
    });
  });

  describe('State Reactivity', () => {
    it('should emit state changes on configuration updates', (done) => {
      const config: SimulationConfiguration = {
        mode: "nbody",
        integrator: "rk4",
        algorithm: "fmm"
      };

      simulationStateService.simulationState$.subscribe(state => {
        if (state.simulationConfig.integrator === "rk4") {
          expect(state.simulationConfig).toEqual(config);
          done();
        }
      });

      simulationStateService.setSimulationConfiguration(config);
    });
  });
});
```

### Phase 3C: Update Physics Integration Points

#### Task 3.4: Update SimulationManager Integration
**File**: `packages/app/simulation/src/SimulationManager.ts`

**Current Issues:**
- Line 198: Passing old `physicsEngine` parameter
- Line 204: `updateSimulation` call needs new signature

**To-Do:**
- [ ] Update parameter passing to use new configuration
- [ ] Handle configuration extraction from state
- [ ] Update error handling

**Implementation:**
```typescript
// ... existing imports ...
import type { SimulationConfiguration } from "@teskooano/core-state";

export class SimulationManager extends StateSubscriptionMixin {
  // ... existing code ...

  /**
   * Performs one simulation step and updates the application state.
   */
  private performSimulationStep(): void {
    try {
      const currentState = getSimulationState();
      
      // Extract simulation configuration
      const config: SimulationConfiguration = currentState.simulationConfig;
      
      // Get current celestial objects
      const currentBodies = getCelestialObjects();
      
      if (Object.keys(currentBodies).length === 0) {
        return; // No bodies to simulate
      }

      // Calculate delta time
      const deltaTime = this.calculateDeltaTime(currentState);
      
      if (deltaTime <= 0) {
        return; // Paused or invalid time step
      }

      // Perform physics simulation with new configuration API
      const result: SimulationStepResult = updateSimulation(
        currentBodies,
        deltaTime,
        config, // Use configuration instead of physicsEngine string
        { min: 1000, max: 10000000 }, // radii
        1000000, // octreeSize  
        0.5 // theta
      );

      // Update state with simulation results
      gameStateService.setBulkCelestialObjects(result.bodies);
      
      // Update simulation time
      const newTime = currentState.time + deltaTime;
      simulationStateService.setSimulationState({
        ...currentState,
        time: newTime
      });

      // Log performance metrics if available
      if (result.metadata) {
        this.logPerformanceMetrics(result.metadata, config);
      }

    } catch (error) {
      console.error('[SimulationManager] Error during simulation step:', error);
      // Optionally pause simulation on error
      simulationStateService.togglePause();
    }
  }

  /**
   * Logs performance metrics for monitoring and optimization
   */
  private logPerformanceMetrics(
    metadata: any, 
    config: SimulationConfiguration
  ): void {
    if (this.debugLogging) {
      console.log('[SimulationManager] Step metrics:', {
        mode: config.mode,
        algorithm: config.algorithm || 'N/A',
        integrator: config.integrator || 'N/A',
        stepTime: `${metadata.stepTime.toFixed(2)}ms`,
        totalBodies: metadata.totalBodies,
        forceTime: metadata.forceCalculationTime ? 
          `${metadata.forceCalculationTime.toFixed(2)}ms` : 'N/A',
        integrationTime: metadata.integrationTime ? 
          `${metadata.integrationTime.toFixed(2)}ms` : 'N/A'
      });
    }
  }

  // ... rest of existing methods ...
}
```

## 🧪 Testing Strategy

### Task 3.5: Integration Testing
**File**: `packages/core/state/src/integration.spec.ts` (new)

**To-Do:**
- [ ] Test state service integration with physics engine
- [ ] Test reactive updates across system
- [ ] Test error handling and validation
- [ ] Test performance under various configurations

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Complete type system changes (Guide 01)
- [ ] Review state service dependencies
- [ ] Plan migration strategy for existing state

### Implementation Order
1. [ ] Update `SimulationStateService` with new methods
2. [ ] Update state index exports
3. [ ] Update integration points (SimulationManager)
4. [ ] Update and expand test suite
5. [ ] Test backwards compatibility
6. [ ] Validate reactive state updates

### Post-Implementation
- [ ] Verify all state updates work correctly
- [ ] Test configuration validation
- [ ] Confirm backwards compatibility
- [ ] Performance testing with new state structure

## 🎯 Success Criteria
- [ ] New configuration system fully functional
- [ ] Backwards compatibility maintained
- [ ] All tests pass
- [ ] State updates remain reactive
- [ ] Configuration validation prevents invalid states

## 📋 Dependencies
**Requires**: Type system changes (Guide 01)
**Blocks**: UI layer updates, renderer integration

**Estimated Time**: 3-4 days
**Risk Level**: Medium (breaking state interface)
**Impact Level**: High (affects all state consumers)