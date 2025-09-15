---
aliases: [IntegratorType]
tags: [data, types, physics, integration]
type: Enum
package: "@teskooano/data-types"
file: "src/main.ts"
status: active
---

# IntegratorType

The numerical integration method used for N-Body physics simulations.

## Overview

The `IntegratorType` enum defines the available numerical integration methods for solving the N-body gravitational problem. Different integrators offer trade-offs between accuracy, stability, and computational performance.

## Enum Definition

```typescript
export enum IntegratorType {
  EULER = "euler",
  SYMPLECTIC = "symplectic",
  VERLET = "verlet",
  RK4 = "rk4",
  ADAPTIVE = "adaptive",
  YOSHIDA4 = "yoshida4",
  FOREST_RUTH = "forest-ruth",
  PEFRL = "pefrl",
  LEAPFROG = "leapfrog",
}
```

## Integration Methods

### EULER

```typescript
EULER = "euler";
```

Simple Euler integration.

**Characteristics:**

- **Order**: 1st order
- **Stability**: Poor for oscillatory systems
- **Performance**: Fastest
- **Energy Conservation**: Poor
- **Accuracy**: Low

**Use Cases:**

- Quick prototyping
- Non-critical simulations
- Educational purposes

**Advantages:**

- Very simple implementation
- Minimal computational cost
- Easy to understand

**Disadvantages:**

- Numerical instability
- Energy drift
- Poor long-term accuracy

### SYMPLECTIC

```typescript
SYMPLECTIC = "symplectic";
```

Symplectic Euler (energy preserving).

**Characteristics:**

- **Order**: 1st order
- **Stability**: Good for Hamiltonian systems
- **Performance**: Fast
- **Energy Conservation**: Excellent
- **Accuracy**: Moderate

**Use Cases:**

- Long-term orbital simulations
- Energy-critical systems
- Stable planetary systems

**Advantages:**

- Preserves energy
- Stable for long simulations
- Fast computation

**Disadvantages:**

- Lower accuracy than higher-order methods
- Position-velocity coupling

### VERLET

```typescript
VERLET = "verlet";
```

Velocity Verlet (stable, reversible).

**Characteristics:**

- **Order**: 2nd order
- **Stability**: Very good
- **Performance**: Good
- **Energy Conservation**: Good
- **Accuracy**: High

**Use Cases:**

- General-purpose simulations
- Stable planetary systems
- Default choice for most scenarios

**Advantages:**

- Time-reversible
- Good stability
- Widely tested
- Good accuracy

**Disadvantages:**

- Moderate computational cost
- Not symplectic

### RK4

```typescript
RK4 = "rk4";
```

Runge-Kutta 4th order (high accuracy).

**Characteristics:**

- **Order**: 4th order
- **Stability**: Good
- **Performance**: Moderate
- **Energy Conservation**: Moderate
- **Accuracy**: Very high

**Use Cases:**

- High-precision requirements
- Scientific accuracy
- Short-term detailed simulations

**Advantages:**

- Very high accuracy
- Well-established method
- Good for smooth functions

**Disadvantages:**

- Higher computational cost
- Not energy conserving
- Can accumulate errors over time

### ADAPTIVE

```typescript
ADAPTIVE = "adaptive";
```

Adaptive step size (auto-optimizing).

**Characteristics:**

- **Order**: Variable
- **Stability**: Excellent
- **Performance**: Variable
- **Energy Conservation**: Good
- **Accuracy**: Very high

**Use Cases:**

- Variable dynamics
- Close encounters
- High-precision requirements

**Advantages:**

- Automatic step size control
- High accuracy when needed
- Efficient for variable dynamics

**Disadvantages:**

- Complex implementation
- Variable performance
- Harder to predict execution time

### YOSHIDA4

```typescript
YOSHIDA4 = "yoshida4";
```

4th-order symplectic (Yoshida method).

**Characteristics:**

- **Order**: 4th order
- **Stability**: Excellent
- **Performance**: Moderate
- **Energy Conservation**: Excellent
- **Accuracy**: Very high

**Use Cases:**

- Long-term stable simulations
- Energy-critical systems
- High-accuracy requirements

**Advantages:**

- Symplectic (energy conserving)
- High accuracy
- Long-term stability

**Disadvantages:**

- Higher computational cost
- Complex implementation

### FOREST_RUTH

```typescript
FOREST_RUTH = "forest-ruth";
```

4th-order symplectic (Forest-Ruth method).

**Characteristics:**

- **Order**: 4th order
- **Stability**: Excellent
- **Performance**: Moderate
- **Energy Conservation**: Excellent
- **Accuracy**: Very high

**Use Cases:**

- Alternative to Yoshida4
- Long-term simulations
- Energy conservation critical

**Advantages:**

- Symplectic
- High accuracy
- Different numerical characteristics than Yoshida4

**Disadvantages:**

- Higher computational cost
- Complex implementation

### PEFRL

```typescript
PEFRL = "pefrl";
```

Optimized 4th-order symplectic (PEFRL).

**Characteristics:**

- **Order**: 4th order
- **Stability**: Excellent
- **Performance**: Good
- **Energy Conservation**: Excellent
- **Accuracy**: Very high

**Use Cases:**

- Best balance of accuracy and performance
- Long-term simulations
- Professional applications

**Advantages:**

- Optimized coefficients
- Excellent stability
- Good performance for accuracy level

**Disadvantages:**

- Complex implementation
- Higher memory usage

### LEAPFROG

```typescript
LEAPFROG = "leapfrog";
```

Classic 2nd-order symplectic.

**Characteristics:**

- **Order**: 2nd order
- **Stability**: Good
- **Performance**: Good
- **Energy Conservation**: Excellent
- **Accuracy**: Moderate

**Use Cases:**

- Classic N-body simulations
- Educational purposes
- Stable long-term evolution

**Advantages:**

- Simple symplectic method
- Energy conserving
- Well-understood

**Disadvantages:**

- Lower accuracy than 4th-order methods
- Velocity-position offset

## Usage Examples

### Integrator Selection

```typescript
import { IntegratorType, SimulationConfiguration } from "@teskooano/data-types";

function selectIntegrator(
  objectCount: number,
  simulationDuration: number,
  accuracyRequirement: "low" | "medium" | "high",
  performanceTarget: "fast" | "balanced" | "accurate",
): IntegratorType {
  // For very long simulations, prefer symplectic methods
  if (simulationDuration > 1000000) {
    // > ~11 days
    if (accuracyRequirement === "high") {
      return IntegratorType.PEFRL;
    } else {
      return IntegratorType.SYMPLECTIC;
    }
  }

  // For high accuracy requirements
  if (accuracyRequirement === "high") {
    if (performanceTarget === "accurate") {
      return IntegratorType.PEFRL;
    } else {
      return IntegratorType.RK4;
    }
  }

  // For performance-critical scenarios
  if (performanceTarget === "fast" || objectCount > 50) {
    return IntegratorType.EULER;
  }

  // Default balanced choice
  return IntegratorType.VERLET;
}
```

### Performance Characteristics

```typescript
function getIntegratorPerformance(integrator: IntegratorType): {
  computationalCost: number;
  memoryUsage: number;
  accuracy: number;
  stability: number;
} {
  switch (integrator) {
    case IntegratorType.EULER:
      return {
        computationalCost: 1.0,
        memoryUsage: 1.0,
        accuracy: 2.0,
        stability: 1.0,
      };

    case IntegratorType.SYMPLECTIC:
      return {
        computationalCost: 1.2,
        memoryUsage: 1.0,
        accuracy: 3.0,
        stability: 4.0,
      };

    case IntegratorType.VERLET:
      return {
        computationalCost: 1.5,
        memoryUsage: 1.2,
        accuracy: 4.0,
        stability: 4.0,
      };

    case IntegratorType.RK4:
      return {
        computationalCost: 4.0,
        memoryUsage: 2.0,
        accuracy: 5.0,
        stability: 3.0,
      };

    case IntegratorType.ADAPTIVE:
      return {
        computationalCost: 6.0,
        memoryUsage: 3.0,
        accuracy: 5.0,
        stability: 5.0,
      };

    case IntegratorType.YOSHIDA4:
      return {
        computationalCost: 3.0,
        memoryUsage: 1.5,
        accuracy: 5.0,
        stability: 5.0,
      };

    case IntegratorType.FOREST_RUTH:
      return {
        computationalCost: 3.0,
        memoryUsage: 1.5,
        accuracy: 5.0,
        stability: 5.0,
      };

    case IntegratorType.PEFRL:
      return {
        computationalCost: 2.5,
        memoryUsage: 1.5,
        accuracy: 5.0,
        stability: 5.0,
      };

    case IntegratorType.LEAPFROG:
      return {
        computationalCost: 1.3,
        memoryUsage: 1.1,
        accuracy: 3.5,
        stability: 4.0,
      };
  }
}
```

### Timestep Recommendations

```typescript
function getRecommendedTimestep(
  integrator: IntegratorType,
  systemScale: number,
  accuracyTarget: number,
): number {
  const baseTimestep = systemScale / 1000; // Base on system scale

  switch (integrator) {
    case IntegratorType.EULER:
      return baseTimestep * 0.1; // Very small timestep needed

    case IntegratorType.SYMPLECTIC:
      return baseTimestep * 0.5;

    case IntegratorType.VERLET:
      return baseTimestep * 1.0; // Good default

    case IntegratorType.RK4:
      return baseTimestep * 2.0; // Can use larger timesteps

    case IntegratorType.ADAPTIVE:
      return baseTimestep * 1.0; // Will adapt automatically

    case IntegratorType.YOSHIDA4:
    case IntegratorType.FOREST_RUTH:
    case IntegratorType.PEFRL:
      return baseTimestep * 1.5; // High-order symplectic

    case IntegratorType.LEAPFROG:
      return baseTimestep * 0.8;
  }
}
```

## Integration

### Physics Engine

- Determines numerical integration method
- Affects simulation accuracy and stability
- Controls computational performance

### Configuration System

- Part of simulation configuration
- Enables user control over accuracy vs. performance
- Supports automatic selection based on system characteristics

### Performance Management

- Enables adaptive quality management
- Supports dynamic switching based on performance
- Balances accuracy with frame rate requirements

## Stability Considerations

### Energy Conservation

```typescript
function isEnergyConserving(integrator: IntegratorType): boolean {
  const symplecticMethods = [
    IntegratorType.SYMPLECTIC,
    IntegratorType.YOSHIDA4,
    IntegratorType.FOREST_RUTH,
    IntegratorType.PEFRL,
    IntegratorType.LEAPFROG,
  ];

  return symplecticMethods.includes(integrator);
}
```

### Recommended Combinations

```typescript
function getRecommendedCombination(
  objectCount: number,
  simulationLength: number,
): { integrator: IntegratorType; algorithm: AlgorithmType } {
  if (objectCount <= 10 && simulationLength > 1000000) {
    // Small system, long simulation - use symplectic
    return {
      integrator: IntegratorType.PEFRL,
      algorithm: AlgorithmType.DIRECT,
    };
  } else if (objectCount <= 50) {
    // Medium system - balanced approach
    return {
      integrator: IntegratorType.VERLET,
      algorithm: AlgorithmType.DIRECT,
    };
  } else {
    // Large system - performance critical
    return {
      integrator: IntegratorType.EULER,
      algorithm: AlgorithmType.BARNES_HUT,
    };
  }
}
```

## 🔗 Related

- [[SimulationMode]] - Simulation mode that determines if integrator is used
- [[AlgorithmType]] - Force calculation algorithms used with integrators
- [[SimulationConfiguration]] - Complete simulation configuration
- [[@teskooano/core-physics]] - Physics engine that implements these integrators
