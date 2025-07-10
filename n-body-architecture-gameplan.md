# N-Body Simulation Architecture Game Plan

## Overview

This document outlines the modular architecture for the Teskooano N-body simulation system supporting two distinct modes with pluggable algorithms and integrators.

## Two-Mode System Architecture

### Mode 1: Ideal Orrery Mode

- **Purpose**: Stable, predictable orbital mechanics for educational/demonstration purposes
- **Characteristics**: Mathematically perfect orbits, no gravitational interactions between bodies
- **Use Cases**: Solar system tours, educational content, stable reference simulations

### Mode 2: N-Body Physics Mode

- **Purpose**: Realistic gravitational physics with full N-body interactions
- **Characteristics**: Dynamic gravitational forces, collision detection, emergent behaviors
- **Use Cases**: Galaxy formation, asteroid dynamics, realistic multi-body systems

## Core Modular Components

### 1. Simulation Mode Interface

```typescript
// packages/core/physics/src/modes/SimulationMode.ts
export interface SimulationMode {
  readonly name: string;
  readonly description: string;

  updateBodies(
    bodies: PhysicsStateReal[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult;

  validateConfiguration(params: SimulationParameters): ValidationResult;
  getRequiredParameters(): string[];
}

export type SimulationModeType = "ideal" | "n-body";
```

### 2. Algorithm Strategy Interface

```typescript
// packages/core/physics/src/algorithms/AlgorithmStrategy.ts
export interface AlgorithmStrategy {
  readonly name: string;
  readonly complexity: string; // "O(N)", "O(N log N)", "O(N²)", etc.
  readonly description: string;

  calculateForces(
    bodies: PhysicsStateReal[],
    params: AlgorithmParameters,
  ): Map<string, OSVector3>;

  getRecommendedParticleRange(): { min: number; max: number };
  getMemoryRequirement(particleCount: number): number;
}

export type AlgorithmType =
  | "barnes-hut"
  | "fast-multipole"
  | "particle-mesh"
  | "p3m"
  | "direct";
```

### 3. Integration Strategy Interface

```typescript
// packages/core/physics/src/integrators/IntegrationStrategy.ts
export interface IntegrationStrategy {
  readonly name: string;
  readonly order: number; // Numerical order of accuracy
  readonly stability: "explicit" | "implicit" | "symplectic";

  integrate(
    body: PhysicsStateReal,
    acceleration: OSVector3,
    calculateNewAcceleration: (state: PhysicsStateReal) => OSVector3,
    dt: number,
    params?: IntegrationParameters,
  ): PhysicsStateReal;

  getRecommendedTimeStep(body: PhysicsStateReal, force: OSVector3): number;
}

export type IntegrationType =
  | "euler"
  | "symplectic-euler"
  | "verlet"
  | "runge-kutta-4"
  | "adaptive-verlet";
```

## Detailed Component Architecture

### 1. Ideal Orrery Mode Implementation

```typescript
// packages/core/physics/src/modes/IdealOrreryMode.ts
export class IdealOrreryMode implements SimulationMode {
  readonly name = "ideal-orrery";
  readonly description = "Mathematically perfect orbital mechanics";

  updateBodies(
    bodies: PhysicsStateReal[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult {
    if (
      !params.orbitalParameters ||
      !params.parentIds ||
      params.currentTime_s === undefined
    ) {
      throw new Error(
        "Ideal mode requires orbital parameters, parent IDs, and current time",
      );
    }

    const bodyMap = new Map(bodies.map((b) => [b.id, b]));
    const sortedBodies = this.sortBodiesByHierarchy(bodies, params.parentIds);
    const updatedStates: Record<string, PhysicsStateReal> = {};

    for (const body of sortedBodies) {
      const orbitalParams = params.orbitalParameters.get(body.id);
      const parentId = params.parentIds.get(body.id);

      if (!parentId || !orbitalParams) {
        updatedStates[body.id] = body;
        continue;
      }

      const parentState = updatedStates[parentId] || bodyMap.get(parentId);
      if (!parentState) {
        console.warn(`Parent ${parentId} not found for body ${body.id}`);
        updatedStates[body.id] = body;
        continue;
      }

      updatedStates[body.id] = this.calculateIdealOrbit(
        body,
        parentState,
        orbitalParams,
        params.currentTime_s,
      );
    }

    return {
      states: Object.values(updatedStates),
      accelerations: new Map(),
      destroyedIds: new Set(),
      destructionEvents: [],
    };
  }

  private calculateIdealOrbit(
    body: PhysicsStateReal,
    parent: PhysicsStateReal,
    orbitalParams: OrbitalParameters,
    currentTime: number,
  ): PhysicsStateReal {
    // Implementation of ideal Keplerian orbit calculations
    // This bypasses all gravitational interactions for stable, predictable orbits
  }
}
```

### 2. N-Body Physics Mode Implementation

```typescript
// packages/core/physics/src/modes/NBodyPhysicsMode.ts
export class NBodyPhysicsMode implements SimulationMode {
  readonly name = "n-body-physics";
  readonly description = "Full gravitational N-body physics simulation";

  constructor(
    private algorithmStrategy: AlgorithmStrategy,
    private integrationStrategy: IntegrationStrategy,
    private collisionHandler: CollisionHandler,
  ) {}

  updateBodies(
    bodies: PhysicsStateReal[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult {
    // 1. Calculate forces using selected algorithm strategy
    const forces = this.algorithmStrategy.calculateForces(bodies, params);

    // 2. Convert forces to accelerations
    const accelerations = this.calculateAccelerations(bodies, forces);

    // 3. Integrate using selected integration strategy
    const integratedStates = bodies.map((body) => {
      const acceleration = accelerations.get(body.id) || new OSVector3(0, 0, 0);

      const calculateNewAcceleration = (
        newState: PhysicsStateReal,
      ): OSVector3 => {
        // Recalculate forces for the predicted state (needed for higher-order integrators)
        const tempForces = this.algorithmStrategy.calculateForces(
          [newState, ...bodies.filter((b) => b.id !== newState.id)],
          params,
        );
        const tempForce = tempForces.get(newState.id) || new OSVector3(0, 0, 0);
        return newState.mass_kg > 0
          ? tempForce.clone().multiplyScalar(1 / newState.mass_kg)
          : new OSVector3(0, 0, 0);
      };

      return this.integrationStrategy.integrate(
        body,
        acceleration,
        calculateNewAcceleration,
        dt,
      );
    });

    // 4. Handle collisions
    const [finalStates, destroyedIds, destructionEvents] =
      this.collisionHandler.handleCollisions(
        integratedStates,
        params.radii,
        params.isStar,
        params.bodyTypes,
      );

    return {
      states: finalStates,
      accelerations,
      destroyedIds,
      destructionEvents,
    };
  }

  private calculateAccelerations(
    bodies: PhysicsStateReal[],
    forces: Map<string, OSVector3>,
  ): Map<string, OSVector3> {
    const accelerations = new Map<string, OSVector3>();

    bodies.forEach((body) => {
      const force = forces.get(body.id) || new OSVector3(0, 0, 0);
      const acceleration =
        body.mass_kg > 0
          ? force.clone().multiplyScalar(1 / body.mass_kg)
          : new OSVector3(0, 0, 0);
      accelerations.set(body.id, acceleration);
    });

    return accelerations;
  }
}
```

### 3. Algorithm Strategy Implementations

```typescript
// packages/core/physics/src/algorithms/BarnesHutStrategy.ts
export class BarnesHutStrategy implements AlgorithmStrategy {
  readonly name = "barnes-hut";
  readonly complexity = "O(N log N)";
  readonly description = "Barnes-Hut octree approximation algorithm";

  constructor(private config: BarnesHutConfig = {}) {}

  calculateForces(
    bodies: PhysicsStateReal[],
    params: AlgorithmParameters,
  ): Map<string, OSVector3> {
    const octree = new Octree(params.octreeSize || 5e13, params.maxDepth || 8);

    bodies.forEach((body) => octree.insert(body));

    const forces = new Map<string, OSVector3>();
    bodies.forEach((body) => {
      const force = octree.calculateForceOn(body, params.theta || 0.7);
      forces.set(body.id, force);
    });

    return forces;
  }

  getRecommendedParticleRange() {
    return { min: 100, max: 100000 };
  }

  getMemoryRequirement(particleCount: number): number {
    return particleCount * 8 * 32; // Approximate bytes for octree nodes
  }
}

// packages/core/physics/src/algorithms/FastMultipoleStrategy.ts
export class FastMultipoleStrategy implements AlgorithmStrategy {
  readonly name = "fast-multipole";
  readonly complexity = "O(N)";
  readonly description = "Fast Multipole Method for linear scaling";

  calculateForces(
    bodies: PhysicsStateReal[],
    params: AlgorithmParameters,
  ): Map<string, OSVector3> {
    // Implementation of FMM algorithm
    const fmmTree = new FastMultipoleTree(params.multipoleOrder || 6);

    // Build tree and compute multipole expansions
    fmmTree.buildTree(bodies);
    fmmTree.computeMultipoleExpansions();
    fmmTree.translateAndConvert();

    // Calculate forces
    const forces = new Map<string, OSVector3>();
    bodies.forEach((body) => {
      const force = fmmTree.calculateForceOn(body);
      forces.set(body.id, force);
    });

    return forces;
  }

  getRecommendedParticleRange() {
    return { min: 1000, max: 1000000 };
  }

  getMemoryRequirement(particleCount: number): number {
    return particleCount * 12 * 64; // Higher memory for multipole coefficients
  }
}

// packages/core/physics/src/algorithms/DirectStrategy.ts
export class DirectStrategy implements AlgorithmStrategy {
  readonly name = "direct";
  readonly complexity = "O(N²)";
  readonly description = "Direct particle-particle force calculation";

  calculateForces(
    bodies: PhysicsStateReal[],
    params: AlgorithmParameters,
  ): Map<string, OSVector3> {
    const forces = new Map<string, OSVector3>();

    bodies.forEach((body) => {
      const totalForce = new OSVector3(0, 0, 0);

      bodies.forEach((otherBody) => {
        if (body.id !== otherBody.id) {
          const force = calculateNewtonianGravitationalForce(otherBody, body);
          totalForce.add(force);
        }
      });

      forces.set(body.id, totalForce);
    });

    return forces;
  }

  getRecommendedParticleRange() {
    return { min: 1, max: 1000 };
  }

  getMemoryRequirement(particleCount: number): number {
    return particleCount * 4 * 32; // Minimal memory overhead
  }
}
```

### 4. Integration Strategy Implementations

```typescript
// packages/core/physics/src/integrators/VerletStrategy.ts
export class VerletStrategy implements IntegrationStrategy {
  readonly name = "velocity-verlet";
  readonly order = 2;
  readonly stability = "symplectic";

  integrate(
    body: PhysicsStateReal,
    acceleration: OSVector3,
    calculateNewAcceleration: (state: PhysicsStateReal) => OSVector3,
    dt: number,
  ): PhysicsStateReal {
    return velocityVerletIntegrate(
      body,
      acceleration,
      calculateNewAcceleration,
      dt,
    );
  }

  getRecommendedTimeStep(body: PhysicsStateReal, force: OSVector3): number {
    const acceleration = force.length() / body.mass_kg;
    const velocity = body.velocity_mps.length();

    // Adaptive time step based on acceleration and velocity
    if (acceleration > 0) {
      return Math.min((0.1 * velocity) / acceleration, 86400); // Max 1 day
    }
    return 86400; // Default to 1 day
  }
}

// packages/core/physics/src/integrators/AdaptiveVerletStrategy.ts
export class AdaptiveVerletStrategy implements IntegrationStrategy {
  readonly name = "adaptive-verlet";
  readonly order = 2;
  readonly stability = "symplectic";

  constructor(private config: AdaptiveConfig = {}) {}

  integrate(
    body: PhysicsStateReal,
    acceleration: OSVector3,
    calculateNewAcceleration: (state: PhysicsStateReal) => OSVector3,
    dt: number,
    params?: IntegrationParameters,
  ): PhysicsStateReal {
    const errorTolerance =
      params?.errorTolerance || this.config.errorTolerance || 1e-6;
    const minDt = params?.minTimeStep || this.config.minTimeStep || 1;
    const maxDt = params?.maxTimeStep || this.config.maxTimeStep || 86400;

    // Adaptive time stepping with error control
    let currentDt = dt;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const result1 = velocityVerletIntegrate(
        body,
        acceleration,
        calculateNewAcceleration,
        currentDt,
      );
      const result2 = this.integrateWithHalfSteps(
        body,
        acceleration,
        calculateNewAcceleration,
        currentDt,
      );

      const error = this.estimateError(result1, result2);

      if (error < errorTolerance || currentDt <= minDt) {
        return result1;
      }

      // Reduce time step and try again
      currentDt = Math.max(currentDt * 0.5, minDt);
      attempts++;
    }

    // Fallback to minimum time step
    return velocityVerletIntegrate(
      body,
      acceleration,
      calculateNewAcceleration,
      minDt,
    );
  }

  private integrateWithHalfSteps(
    body: PhysicsStateReal,
    acceleration: OSVector3,
    calculateNewAcceleration: (state: PhysicsStateReal) => OSVector3,
    dt: number,
  ): PhysicsStateReal {
    // Integrate with two half-steps for error estimation
    const halfStep1 = velocityVerletIntegrate(
      body,
      acceleration,
      calculateNewAcceleration,
      dt / 2,
    );
    const halfStep1Acc = calculateNewAcceleration(halfStep1);
    return velocityVerletIntegrate(
      halfStep1,
      halfStep1Acc,
      calculateNewAcceleration,
      dt / 2,
    );
  }

  private estimateError(
    result1: PhysicsStateReal,
    result2: PhysicsStateReal,
  ): number {
    const posError = result1.position_m.distanceTo(result2.position_m);
    const velError = result1.velocity_mps.distanceTo(result2.velocity_mps);
    return Math.max(posError, velError);
  }
}
```

### 5. Configuration and Factory System

```typescript
// packages/core/physics/src/config/SimulationConfig.ts
export interface SimulationConfig {
  mode: SimulationModeType;
  algorithm?: AlgorithmType;
  integration?: IntegrationType;
  algorithmParams?: AlgorithmParameters;
  integrationParams?: IntegrationParameters;
}

export interface AlgorithmParameters {
  theta?: number; // Barnes-Hut approximation parameter
  octreeSize?: number; // Octree boundary size
  maxDepth?: number; // Maximum tree depth
  multipoleOrder?: number; // FMM multipole expansion order
  meshResolution?: number; // P3M mesh resolution
  cutoffRadius?: number; // P3M cutoff radius
}

export interface IntegrationParameters {
  errorTolerance?: number; // Adaptive integration error tolerance
  minTimeStep?: number; // Minimum time step (seconds)
  maxTimeStep?: number; // Maximum time step (seconds)
  orderOfAccuracy?: number; // Desired order of accuracy
}

// packages/core/physics/src/factory/SimulationFactory.ts
export class SimulationFactory {
  static createSimulationMode(config: SimulationConfig): SimulationMode {
    switch (config.mode) {
      case "ideal":
        return new IdealOrreryMode();

      case "n-body":
        const algorithm = this.createAlgorithmStrategy(
          config.algorithm || "barnes-hut",
          config.algorithmParams,
        );
        const integration = this.createIntegrationStrategy(
          config.integration || "verlet",
          config.integrationParams,
        );
        const collisionHandler = new CollisionHandler();

        return new NBodyPhysicsMode(algorithm, integration, collisionHandler);

      default:
        throw new Error(`Unknown simulation mode: ${config.mode}`);
    }
  }

  static createAlgorithmStrategy(
    type: AlgorithmType,
    params?: AlgorithmParameters,
  ): AlgorithmStrategy {
    switch (type) {
      case "barnes-hut":
        return new BarnesHutStrategy(params);
      case "fast-multipole":
        return new FastMultipoleStrategy(params);
      case "direct":
        return new DirectStrategy();
      case "particle-mesh":
        return new ParticleMeshStrategy(params);
      case "p3m":
        return new P3MStrategy(params);
      default:
        throw new Error(`Unknown algorithm type: ${type}`);
    }
  }

  static createIntegrationStrategy(
    type: IntegrationType,
    params?: IntegrationParameters,
  ): IntegrationStrategy {
    switch (type) {
      case "euler":
        return new EulerStrategy();
      case "symplectic-euler":
        return new SymplecticEulerStrategy();
      case "verlet":
        return new VerletStrategy();
      case "runge-kutta-4":
        return new RungeKutta4Strategy();
      case "adaptive-verlet":
        return new AdaptiveVerletStrategy(params);
      default:
        throw new Error(`Unknown integration type: ${type}`);
    }
  }

  static getRecommendedConfig(
    particleCount: number,
    accuracy: "low" | "medium" | "high",
  ): SimulationConfig {
    if (particleCount < 100) {
      return {
        mode: "n-body",
        algorithm: "direct",
        integration: "verlet",
      };
    } else if (particleCount < 10000) {
      return {
        mode: "n-body",
        algorithm: "barnes-hut",
        integration: accuracy === "high" ? "adaptive-verlet" : "verlet",
        algorithmParams: { theta: accuracy === "high" ? 0.3 : 0.7 },
      };
    } else {
      return {
        mode: "n-body",
        algorithm: "fast-multipole",
        integration: accuracy === "high" ? "adaptive-verlet" : "verlet",
        algorithmParams: { multipoleOrder: accuracy === "high" ? 8 : 6 },
      };
    }
  }
}
```

### 6. Main Simulation Interface

```typescript
// packages/core/physics/src/simulation/UnifiedSimulation.ts
export class UnifiedSimulation {
  private simulationMode: SimulationMode;
  private config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.simulationMode = SimulationFactory.createSimulationMode(config);
  }

  updateSimulation(
    bodies: PhysicsStateReal[],
    dt: number,
    params: SimulationParameters,
  ): SimulationStepResult {
    return this.simulationMode.updateBodies(bodies, dt, params);
  }

  switchMode(newConfig: SimulationConfig): void {
    this.config = newConfig;
    this.simulationMode = SimulationFactory.createSimulationMode(newConfig);
  }

  getCurrentConfig(): SimulationConfig {
    return { ...this.config };
  }

  validateConfiguration(): ValidationResult {
    return this.simulationMode.validateConfiguration(
      {} as SimulationParameters,
    );
  }

  getPerformanceMetrics(particleCount: number): PerformanceMetrics {
    if (this.config.mode === "ideal") {
      return {
        complexity: "O(N)",
        memoryUsage: particleCount * 8,
        recommendedMaxParticles: 1000000,
      };
    }

    const algorithm = SimulationFactory.createAlgorithmStrategy(
      this.config.algorithm || "barnes-hut",
      this.config.algorithmParams,
    );

    return {
      complexity: algorithm.complexity,
      memoryUsage: algorithm.getMemoryRequirement(particleCount),
      recommendedMaxParticles: algorithm.getRecommendedParticleRange().max,
    };
  }
}
```

## Migration Strategy

### Phase 1: Core Interfaces (Week 1-2)

1. Define all interfaces (`SimulationMode`, `AlgorithmStrategy`, `IntegrationStrategy`)
2. Create factory system for configuration
3. Update existing simulation to use new interface structure

### Phase 2: Mode Implementation (Week 3-4)

1. Implement `IdealOrreryMode` using existing ideal orbit calculations
2. Refactor existing N-body logic into `NBodyPhysicsMode`
3. Wrap existing Barnes-Hut in `BarnesHutStrategy`
4. Wrap existing integrators in strategy classes

### Phase 3: Extended Algorithms (Week 5-8)

1. Implement `FastMultipoleStrategy`
2. Add `ParticleMeshStrategy` and `P3MStrategy`
3. Create `AdaptiveVerletStrategy`
4. Add performance monitoring and auto-selection

### Phase 4: Integration & Testing (Week 9-10)

1. Replace current `updateSimulation` with `UnifiedSimulation`
2. Add comprehensive unit tests for all strategies
3. Performance benchmarking and optimization
4. Documentation and examples

## Benefits of This Architecture

1. **Clean Separation**: Ideal vs N-body modes are completely separate
2. **Pluggable Algorithms**: Easy to add new force calculation methods
3. **Configurable Integration**: Multiple integration strategies available
4. **Performance Optimization**: Automatic algorithm selection based on particle count
5. **Extensibility**: Easy to add new modes, algorithms, or integrators
6. **Testing**: Each component can be tested in isolation
7. **Backwards Compatibility**: Existing API can be maintained during migration

## Usage Examples

```typescript
// Simple configuration
const config: SimulationConfig = {
  mode: "n-body",
  algorithm: "barnes-hut",
  integration: "verlet",
};

const simulation = new UnifiedSimulation(config);

// Auto-recommended configuration
const autoConfig = SimulationFactory.getRecommendedConfig(5000, "high");
const autoSimulation = new UnifiedSimulation(autoConfig);

// Runtime mode switching
simulation.switchMode({
  mode: "ideal", // Switch to stable orrery mode
});

// Performance-aware configuration
const performanceMetrics = simulation.getPerformanceMetrics(10000);
console.log(`Expected complexity: ${performanceMetrics.complexity}`);
```

This architecture provides the foundation for your two-mode system while maintaining flexibility for future algorithm additions and optimizations.
