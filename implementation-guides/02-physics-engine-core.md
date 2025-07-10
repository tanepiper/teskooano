# Implementation Guide: Physics Engine Core

## Overview

This guide details the complete refactoring of the physics engine to support the two-mode N-body simulation with pluggable algorithms and integrators using the Strategy Pattern.

## 🎯 Goals

- Implement mode dispatcher for Ideal vs N-Body simulations
- Extract existing algorithms into strategy pattern
- Add new algorithms (FMM, P3M, Direct)
- Create modular integrator system
- Maintain backwards compatibility with existing simulation behavior

## ✅ Implementation To-Do List

### Phase 2A: Create Strategy Pattern Interfaces

#### Task 2.1: Define Strategy Interfaces

**File**: `packages/core/physics/src/interfaces/simulation-strategy.ts` (new)

**To-Do:**

- [ ] Create base simulation strategy interface
- [ ] Define algorithm strategy interface
- [ ] Define integrator strategy interface
- [ ] Add performance tracking capabilities

**Implementation:**

```typescript
import type { CelestialObject, OSVector3 } from "@teskooano/data-types";
import type { SimulationConfiguration } from "@teskooano/core-state";

/**
 * Result of a simulation step containing updated bodies and metadata
 */
export interface SimulationStepResult {
  bodies: Record<string, CelestialObject>;
  metadata: {
    stepTime: number;
    algorithmUsed: string;
    integratorUsed: string;
    forceCalculationTime?: number;
    integrationTime?: number;
    collisionDetectionTime?: number;
    totalBodies: number;
  };
}

/**
 * Parameters passed to simulation strategies
 */
export interface SimulationParameters {
  bodies: Record<string, CelestialObject>;
  deltaTime: number;
  configuration: SimulationConfiguration;
  octreeSize?: number;
  theta?: number; // Barnes-Hut approximation parameter
}

/**
 * Base interface for all simulation strategies
 */
export interface ISimulationStrategy {
  readonly name: string;
  readonly description: string;
  readonly complexity: string; // O(N), O(N log N), O(N²)

  /**
   * Performs one simulation step
   */
  simulate(params: SimulationParameters): SimulationStepResult;

  /**
   * Validates if this strategy can handle the given configuration
   */
  canHandle(config: SimulationConfiguration): boolean;

  /**
   * Gets recommended parameters for this strategy
   */
  getRecommendedParameters(): Partial<SimulationParameters>;
}

/**
 * Interface for N-Body force calculation algorithms
 */
export interface IAlgorithmStrategy {
  readonly name: string;
  readonly complexity: string;
  readonly recommendedMinBodies: number;
  readonly recommendedMaxBodies: number;

  /**
   * Calculates forces for all bodies
   */
  calculateForces(
    bodies: Record<string, CelestialObject>,
    params: SimulationParameters,
  ): Record<string, OSVector3>;

  /**
   * Returns true if this algorithm is optimal for the given body count
   */
  isOptimalFor(bodyCount: number): boolean;
}

/**
 * Interface for numerical integration methods
 */
export interface IIntegratorStrategy {
  readonly name: string;
  readonly order: number; // Integration order (1st, 2nd, 4th, etc.)
  readonly isAdaptive: boolean;
  readonly isSymplectic: boolean; // Energy preserving

  /**
   * Integrates position and velocity for one time step
   */
  integrate(
    body: CelestialObject,
    force: OSVector3,
    deltaTime: number,
  ): CelestialObject;

  /**
   * Returns recommended time step for stability
   */
  getRecommendedTimeStep(
    bodies: Record<string, CelestialObject>,
    maxTimeStep: number,
  ): number;
}
```

#### Task 2.2: Create Algorithm Strategy Interface

**File**: `packages/core/physics/src/interfaces/algorithm-strategy.ts` (new)

**Implementation:**

```typescript
import type { CelestialObject, OSVector3 } from "@teskooano/data-types";
import type {
  IAlgorithmStrategy,
  SimulationParameters,
} from "./simulation-strategy";

/**
 * Abstract base class for force calculation algorithms
 */
export abstract class AlgorithmStrategy implements IAlgorithmStrategy {
  abstract readonly name: string;
  abstract readonly complexity: string;
  abstract readonly recommendedMinBodies: number;
  abstract readonly recommendedMaxBodies: number;

  abstract calculateForces(
    bodies: Record<string, CelestialObject>,
    params: SimulationParameters,
  ): Record<string, OSVector3>;

  /**
   * Default implementation of optimization check
   */
  isOptimalFor(bodyCount: number): boolean {
    return (
      bodyCount >= this.recommendedMinBodies &&
      bodyCount <= this.recommendedMaxBodies
    );
  }

  /**
   * Helper method to calculate gravitational force between two bodies
   */
  protected calculateGravitationalForce(
    body1: CelestialObject,
    body2: CelestialObject,
    G: number = 6.6743e-11,
  ): OSVector3 {
    const dx = body2.position.x - body1.position.x;
    const dy = body2.position.y - body1.position.y;
    const dz = body2.position.z - body1.position.z;

    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const distance = Math.sqrt(distanceSquared);

    if (distance === 0) return new OSVector3(0, 0, 0);

    const forceMagnitude = (G * body1.mass * body2.mass) / distanceSquared;
    const forceDirection = {
      x: dx / distance,
      y: dy / distance,
      z: dz / distance,
    };

    return new OSVector3(
      forceMagnitude * forceDirection.x,
      forceMagnitude * forceDirection.y,
      forceMagnitude * forceDirection.z,
    );
  }
}
```

### Phase 2B: Implement Simulation Modes

#### Task 2.3: Create Ideal Orrery Mode

**File**: `packages/core/physics/src/modes/ideal/ideal-orrery.ts` (new)

**To-Do:**

- [ ] Implement Keplerian orbit calculations
- [ ] Handle multi-body hierarchical systems
- [ ] Support elliptical, parabolic, and hyperbolic orbits
- [ ] Add orbit prediction capabilities

**Implementation:**

```typescript
import type { CelestialObject, OSVector3 } from "@teskooano/data-types";
import type {
  ISimulationStrategy,
  SimulationParameters,
  SimulationStepResult,
} from "../../interfaces/simulation-strategy";
import { OSVector3 as Vector3 } from "@teskooano/core-math";

/**
 * Ideal Orrery simulation using perfect Keplerian orbits
 * Provides stable, predictable orbital mechanics without N-body interactions
 */
export class IdealOrreryStrategy implements ISimulationStrategy {
  readonly name = "ideal-orrery";
  readonly description =
    "Perfect Keplerian orbits with no gravitational interactions";
  readonly complexity = "O(N)";

  simulate(params: SimulationParameters): SimulationStepResult {
    const startTime = performance.now();
    const updatedBodies: Record<string, CelestialObject> = {};

    // Process each body independently using Keplerian mechanics
    for (const [id, body] of Object.entries(params.bodies)) {
      updatedBodies[id] = this.updateKeplerianOrbit(body, params.deltaTime);
    }

    const endTime = performance.now();

    return {
      bodies: updatedBodies,
      metadata: {
        stepTime: endTime - startTime,
        algorithmUsed: "keplerian",
        integratorUsed: "analytical",
        totalBodies: Object.keys(params.bodies).length,
      },
    };
  }

  canHandle(config: SimulationConfiguration): boolean {
    return config.mode === "ideal";
  }

  getRecommendedParameters(): Partial<SimulationParameters> {
    return {
      // No special parameters needed for ideal mode
    };
  }

  /**
   * Updates a body's position using Keplerian orbital mechanics
   */
  private updateKeplerianOrbit(
    body: CelestialObject,
    deltaTime: number,
  ): CelestialObject {
    // If no parent, body is stationary (central star)
    if (!body.parentId || !body.orbitalElements) {
      return body;
    }

    const elements = body.orbitalElements;
    const currentTime = body.time || 0;
    const newTime = currentTime + deltaTime;

    // Calculate mean motion (n)
    const mu = elements.centralBodyMass * 6.6743e-11; // GM
    const meanMotion = Math.sqrt(mu / Math.pow(elements.semiMajorAxis, 3));

    // Calculate mean anomaly (M)
    const meanAnomalyAtEpoch = elements.meanAnomalyAtEpoch || 0;
    const meanAnomaly = meanAnomalyAtEpoch + meanMotion * newTime;

    // Solve Kepler's equation for eccentric anomaly (E)
    const eccentricAnomaly = this.solveKeplersEquation(
      meanAnomaly,
      elements.eccentricity,
    );

    // Calculate true anomaly (ν)
    const trueAnomaly = this.calculateTrueAnomaly(
      eccentricAnomaly,
      elements.eccentricity,
    );

    // Calculate distance from central body
    const distance =
      elements.semiMajorAxis *
      (1 - elements.eccentricity * Math.cos(eccentricAnomaly));

    // Calculate position in orbital plane
    const positionInPlane = {
      x: distance * Math.cos(trueAnomaly),
      y: distance * Math.sin(trueAnomaly),
      z: 0,
    };

    // Rotate to 3D space using orbital elements
    const position3D = this.rotateToSpace(positionInPlane, elements);

    // Calculate velocity
    const velocity3D = this.calculateVelocity(
      elements,
      eccentricAnomaly,
      trueAnomaly,
      mu,
    );

    return {
      ...body,
      position: new Vector3(position3D.x, position3D.y, position3D.z),
      velocity: new Vector3(velocity3D.x, velocity3D.y, velocity3D.z),
      time: newTime,
    };
  }

  /**
   * Solves Kepler's equation using Newton-Raphson method
   */
  private solveKeplersEquation(
    meanAnomaly: number,
    eccentricity: number,
  ): number {
    let E = meanAnomaly; // Initial guess
    const tolerance = 1e-10;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      const f = E - eccentricity * Math.sin(E) - meanAnomaly;
      const df = 1 - eccentricity * Math.cos(E);
      const deltaE = f / df;

      E -= deltaE;

      if (Math.abs(deltaE) < tolerance) break;
    }

    return E;
  }

  /**
   * Calculates true anomaly from eccentric anomaly
   */
  private calculateTrueAnomaly(
    eccentricAnomaly: number,
    eccentricity: number,
  ): number {
    const sqrtTerm = Math.sqrt((1 + eccentricity) / (1 - eccentricity));
    return 2 * Math.atan(sqrtTerm * Math.tan(eccentricAnomaly / 2));
  }

  /**
   * Rotates position from orbital plane to 3D space
   */
  private rotateToSpace(
    positionInPlane: { x: number; y: number; z: number },
    elements: any,
  ): { x: number; y: number; z: number } {
    const {
      inclination = 0,
      longitudeOfAscendingNode = 0,
      argumentOfPeriapsis = 0,
    } = elements;

    // Apply rotation matrices for orbital elements
    // This is a simplified version - full implementation would use proper matrix math
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);
    const cosOmega = Math.cos(longitudeOfAscendingNode);
    const sinOmega = Math.sin(longitudeOfAscendingNode);
    const cosW = Math.cos(argumentOfPeriapsis);
    const sinW = Math.sin(argumentOfPeriapsis);

    // Simplified rotation (would need full matrix implementation)
    return {
      x: positionInPlane.x * cosOmega - positionInPlane.y * sinOmega * cosI,
      y: positionInPlane.x * sinOmega + positionInPlane.y * cosOmega * cosI,
      z: positionInPlane.y * sinI,
    };
  }

  /**
   * Calculates velocity vector in 3D space
   */
  private calculateVelocity(
    elements: any,
    eccentricAnomaly: number,
    trueAnomaly: number,
    mu: number,
  ): { x: number; y: number; z: number } {
    // Simplified velocity calculation
    const n = Math.sqrt(mu / Math.pow(elements.semiMajorAxis, 3));
    const radius =
      elements.semiMajorAxis *
      (1 - elements.eccentricity * Math.cos(eccentricAnomaly));

    const velocityMagnitude =
      (n * elements.semiMajorAxis) /
      Math.sqrt(1 - elements.eccentricity * elements.eccentricity);

    // This is simplified - full implementation would calculate proper velocity vector
    return {
      x: -velocityMagnitude * Math.sin(trueAnomaly),
      y: velocityMagnitude * Math.cos(trueAnomaly),
      z: 0,
    };
  }
}
```

#### Task 2.4: Create N-Body Mode Dispatcher

**File**: `packages/core/physics/src/modes/nbody/nbody-dispatcher.ts` (new)

**To-Do:**

- [ ] Implement algorithm factory pattern
- [ ] Add algorithm auto-selection based on body count
- [ ] Handle integrator selection
- [ ] Add performance monitoring

**Implementation:**

```typescript
import type { CelestialObject } from "@teskooano/data-types";
import type {
  ISimulationStrategy,
  IAlgorithmStrategy,
  IIntegratorStrategy,
  SimulationParameters,
  SimulationStepResult,
} from "../../interfaces/simulation-strategy";

// Import algorithm implementations
import { DirectAlgorithm } from "./algorithms/direct";
import { BarnesHutAlgorithm } from "./algorithms/barnes-hut";
import { FastMultipoleAlgorithm } from "./algorithms/fmm";
import { ParticleMeshAlgorithm } from "./algorithms/p3m";

// Import integrator implementations
import { EulerIntegrator } from "./integrators/euler";
import { VerletIntegrator } from "./integrators/verlet";
import { SymplecticIntegrator } from "./integrators/symplectic";
import { RungeKutta4Integrator } from "./integrators/rk4";
import { AdaptiveIntegrator } from "./integrators/adaptive";

/**
 * N-Body simulation strategy that dispatches to appropriate algorithms and integrators
 */
export class NBodyDispatcher implements ISimulationStrategy {
  readonly name = "nbody-dispatcher";
  readonly description =
    "N-Body simulation with pluggable algorithms and integrators";
  readonly complexity = "Variable (O(N) to O(N²))";

  private algorithms: Map<string, IAlgorithmStrategy>;
  private integrators: Map<string, IIntegratorStrategy>;

  constructor() {
    this.initializeStrategies();
  }

  simulate(params: SimulationParameters): SimulationStepResult {
    const startTime = performance.now();

    // Auto-select algorithm if not specified
    const algorithm = this.selectAlgorithm(params);
    const integrator = this.selectIntegrator(params);

    // Calculate forces using selected algorithm
    const forceStartTime = performance.now();
    const forces = algorithm.calculateForces(params.bodies, params);
    const forceEndTime = performance.now();

    // Integrate using selected integrator
    const integrationStartTime = performance.now();
    const updatedBodies = this.integrateAllBodies(
      params.bodies,
      forces,
      integrator,
      params.deltaTime,
    );
    const integrationEndTime = performance.now();

    const endTime = performance.now();

    return {
      bodies: updatedBodies,
      metadata: {
        stepTime: endTime - startTime,
        algorithmUsed: algorithm.name,
        integratorUsed: integrator.name,
        forceCalculationTime: forceEndTime - forceStartTime,
        integrationTime: integrationEndTime - integrationStartTime,
        totalBodies: Object.keys(params.bodies).length,
      },
    };
  }

  canHandle(config: SimulationConfiguration): boolean {
    return (
      config.mode === "nbody" &&
      config.algorithm !== undefined &&
      config.integrator !== undefined
    );
  }

  getRecommendedParameters(): Partial<SimulationParameters> {
    return {
      octreeSize: 1000000, // Default octree size
      theta: 0.5, // Barnes-Hut approximation parameter
    };
  }

  /**
   * Selects the appropriate algorithm based on configuration or auto-selection
   */
  private selectAlgorithm(params: SimulationParameters): IAlgorithmStrategy {
    const config = params.configuration;
    const bodyCount = Object.keys(params.bodies).length;

    // Use specified algorithm if provided
    if (config.algorithm && this.algorithms.has(config.algorithm)) {
      return this.algorithms.get(config.algorithm)!;
    }

    // Auto-select based on body count
    if (bodyCount <= 10) {
      return this.algorithms.get("direct")!;
    } else if (bodyCount <= 1000) {
      return this.algorithms.get("barnes-hut")!;
    } else if (bodyCount <= 10000) {
      return this.algorithms.get("fmm")!;
    } else {
      return this.algorithms.get("p3m")!;
    }
  }

  /**
   * Selects the appropriate integrator based on configuration
   */
  private selectIntegrator(params: SimulationParameters): IIntegratorStrategy {
    const config = params.configuration;

    if (config.integrator && this.integrators.has(config.integrator)) {
      return this.integrators.get(config.integrator)!;
    }

    // Default to Verlet for stability
    return this.integrators.get("verlet")!;
  }

  /**
   * Integrates all bodies using the selected integrator
   */
  private integrateAllBodies(
    bodies: Record<string, CelestialObject>,
    forces: Record<string, OSVector3>,
    integrator: IIntegratorStrategy,
    deltaTime: number,
  ): Record<string, CelestialObject> {
    const updatedBodies: Record<string, CelestialObject> = {};

    for (const [id, body] of Object.entries(bodies)) {
      const force = forces[id] || new OSVector3(0, 0, 0);
      updatedBodies[id] = integrator.integrate(body, force, deltaTime);
    }

    return updatedBodies;
  }

  /**
   * Initializes all available algorithms and integrators
   */
  private initializeStrategies(): void {
    // Initialize algorithms
    this.algorithms = new Map([
      ["direct", new DirectAlgorithm()],
      ["barnes-hut", new BarnesHutAlgorithm()],
      ["fmm", new FastMultipoleAlgorithm()],
      ["p3m", new ParticleMeshAlgorithm()],
    ]);

    // Initialize integrators
    this.integrators = new Map([
      ["euler", new EulerIntegrator()],
      ["verlet", new VerletIntegrator()],
      ["symplectic", new SymplecticIntegrator()],
      ["rk4", new RungeKutta4Integrator()],
      ["adaptive", new AdaptiveIntegrator()],
    ]);
  }
}
```

### Phase 2C: Refactor Main Simulation Function

#### Task 2.5: Update Main Simulation Entry Point

**File**: `packages/core/physics/src/simulation/simulation.ts`

**To-Do:**

- [ ] Replace physics engine switch with mode dispatcher
- [ ] Update function signature to use SimulationConfiguration
- [ ] Add strategy pattern implementation
- [ ] Maintain backwards compatibility

**Key Changes:**

```typescript
// Line 18 - Update imports
import type { SimulationConfiguration } from "@teskooano/core-state";
import { IdealOrreryStrategy } from "../modes/ideal/ideal-orrery";
import { NBodyDispatcher } from "../modes/nbody/nbody-dispatcher";

// Line 88-103 - Update function signature
export const updateSimulation = (
  bodies: Record<string, CelestialObject>,
  deltaTime: number,
  config: SimulationConfiguration, // Changed from physicsEngine parameter
  radii?: { min: number; max: number },
  octreeSize?: number,
  theta?: number,
): SimulationStepResult => {
  // Line 108-279 - Replace switch statement with strategy dispatch
  const params: SimulationParameters = {
    bodies,
    deltaTime,
    configuration: config,
    octreeSize,
    theta,
  };

  // Select appropriate strategy based on mode
  const strategy =
    config.mode === "ideal" ? new IdealOrreryStrategy() : new NBodyDispatcher();

  // Validate strategy can handle the configuration
  if (!strategy.canHandle(config)) {
    throw new Error(
      `Invalid configuration for ${config.mode} mode: ${JSON.stringify(config)}`,
    );
  }

  // Execute simulation step
  return strategy.simulate(params);
};
```

## 🧪 Testing Strategy

### Task 2.6: Create Strategy Tests

**File**: `packages/core/physics/src/modes/ideal/ideal-orrery.spec.ts` (new)

**To-Do:**

- [ ] Test Keplerian orbit calculations
- [ ] Verify energy conservation in ideal mode
- [ ] Test multi-body hierarchical systems
- [ ] Validate orbit prediction accuracy

### Task 2.7: Create Integration Tests

**File**: `packages/core/physics/src/simulation/simulation.spec.ts` (update existing)

**To-Do:**

- [ ] Test mode switching
- [ ] Validate algorithm auto-selection
- [ ] Test backwards compatibility
- [ ] Performance benchmarking

## 📋 Implementation Checklist

### Pre-Implementation

- [ ] Complete type system changes (Guide 01)
- [ ] Review existing physics code structure
- [ ] Plan algorithm extraction strategy

### Implementation Order

1. [ ] Create strategy interfaces
2. [ ] Implement Ideal Orrery mode
3. [ ] Extract existing Barnes-Hut to strategy pattern
4. [ ] Create N-Body dispatcher
5. [ ] Update main simulation function
6. [ ] Implement new algorithms (FMM, P3M, Direct)
7. [ ] Add comprehensive test suite

### Post-Implementation

- [ ] Performance benchmarking
- [ ] Memory usage validation
- [ ] Integration testing with state system
- [ ] Documentation updates

## 🎯 Success Criteria

- [ ] Both simulation modes work correctly
- [ ] Algorithm auto-selection optimizes performance
- [ ] Backwards compatibility maintained
- [ ] Test coverage > 90%
- [ ] Performance regression < 5%

## 📋 Dependencies

**Requires**: Type system changes (Guide 01)
**Blocks**: State management, UI updates

**Estimated Time**: 1-2 weeks
**Risk Level**: High (core functionality)
**Impact Level**: High (affects all simulations)
