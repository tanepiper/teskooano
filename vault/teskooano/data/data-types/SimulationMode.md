---
aliases: [SimulationMode]
tags: [data, types, simulation, physics]
type: Enum
package: "@teskooano/data-types"
file: "src/main.ts"
status: active
---

# SimulationMode

The simulation mode determines the type of physics calculation used in the simulation.

## Overview

The `SimulationMode` enum defines the fundamental physics calculation approach used by the Teskooano engine. It allows switching between simplified Keplerian orbital mechanics and full N-body physics simulation based on accuracy requirements and performance constraints.

## Enum Definition

```typescript
export enum SimulationMode {
  IDEAL = "ideal",
  NBODY = "nbody",
}
```

## Simulation Modes

### IDEAL

```typescript
IDEAL = "ideal";
```

Keplerian/ideal orbital mechanics.

**Characteristics:**

- **Physics**: Simplified two-body problem
- **Accuracy**: High for isolated systems
- **Performance**: Excellent (O(N) complexity)
- **Stability**: Very stable, no numerical drift
- **Limitations**: No gravitational interactions between bodies

**Use Cases:**

- Educational demonstrations
- Performance-critical scenarios
- Systems with one dominant central body
- Stable, predictable orbits

**Advantages:**

- Fast computation
- Numerically stable
- Predictable results
- No accumulation errors

**Disadvantages:**

- No multi-body interactions
- No gravitational perturbations
- No orbital evolution
- Unrealistic for complex systems

### NBODY

```typescript
NBODY = "nbody";
```

Full N-body physics simulation.

**Characteristics:**

- **Physics**: Complete gravitational N-body problem
- **Accuracy**: Very high for all scenarios
- **Performance**: More expensive (O(N²) or O(N log N) with optimization)
- **Stability**: Requires careful numerical integration
- **Features**: Full gravitational interactions

**Use Cases:**

- Scientific accuracy
- Multi-body systems
- Binary/multiple star systems
- Gravitational perturbations

**Advantages:**

- Physically accurate
- Supports complex dynamics
- Gravitational interactions
- Orbital evolution

**Disadvantages:**

- Higher computational cost
- Numerical stability challenges
- Potential for chaos
- Requires careful timestep management

## Usage Examples

### Mode Selection

```typescript
import { SimulationMode, SimulationConfiguration } from "@teskooano/data-types";

function selectSimulationMode(
  objectCount: number,
  systemComplexity: "simple" | "complex",
  performanceTarget: "fast" | "accurate",
): SimulationMode {
  if (performanceTarget === "fast" || objectCount > 100) {
    return SimulationMode.IDEAL;
  }

  if (systemComplexity === "complex" || objectCount > 10) {
    return SimulationMode.NBODY;
  }

  return SimulationMode.IDEAL;
}
```

### Configuration Creation

```typescript
function createSimulationConfig(mode: SimulationMode): SimulationConfiguration {
  switch (mode) {
    case SimulationMode.IDEAL:
      return {
        mode: SimulationMode.IDEAL,
        // No integrator or algorithm needed for ideal mode
      };

    case SimulationMode.NBODY:
      return {
        mode: SimulationMode.NBODY,
        integrator: IntegratorType.VERLET,
        algorithm: AlgorithmType.DIRECT,
      };
  }
}
```

### Performance Estimation

```typescript
function estimatePerformance(
  mode: SimulationMode,
  objectCount: number,
): {
  complexity: string;
  relativeSpeed: number;
  memoryUsage: string;
} {
  switch (mode) {
    case SimulationMode.IDEAL:
      return {
        complexity: "O(N)",
        relativeSpeed: 1.0,
        memoryUsage: "Low",
      };

    case SimulationMode.NBODY:
      return {
        complexity: "O(N²)",
        relativeSpeed: 1.0 / (objectCount * objectCount),
        memoryUsage: "High",
      };
  }
}
```

### Dynamic Mode Switching

```typescript
class AdaptiveSimulationManager {
  private currentMode: SimulationMode = SimulationMode.IDEAL;
  private performanceHistory: number[] = [];

  updateMode(
    currentFPS: number,
    targetFPS: number,
    objectCount: number,
  ): SimulationMode {
    this.performanceHistory.push(currentFPS);

    // Keep only last 60 frames
    if (this.performanceHistory.length > 60) {
      this.performanceHistory.shift();
    }

    const avgFPS =
      this.performanceHistory.reduce((a, b) => a + b, 0) /
      this.performanceHistory.length;

    if (avgFPS < targetFPS * 0.7 && this.currentMode === SimulationMode.NBODY) {
      // Switch to ideal mode for better performance
      this.currentMode = SimulationMode.IDEAL;
      console.log("Switching to IDEAL mode for performance");
    } else if (
      avgFPS > targetFPS * 1.2 &&
      this.currentMode === SimulationMode.IDEAL &&
      objectCount <= 20
    ) {
      // Switch to N-body mode for better accuracy
      this.currentMode = SimulationMode.NBODY;
      console.log("Switching to NBODY mode for accuracy");
    }

    return this.currentMode;
  }
}
```

### System Complexity Assessment

```typescript
function assessSystemComplexity(
  objects: CelestialObject[],
): "simple" | "complex" {
  const stars = objects.filter((obj) => obj.type === CelestialType.STAR);
  const majorBodies = objects.filter(
    (obj) =>
      obj.type === CelestialType.STAR ||
      obj.type === CelestialType.PLANET ||
      obj.type === CelestialType.GAS_GIANT,
  );

  // Complex if multiple stars or many major bodies
  if (stars.length > 1 || majorBodies.length > 8) {
    return "complex";
  }

  return "simple";
}
```

## Integration

### Physics Engine

- Determines which physics calculations to use
- Affects integrator and algorithm selection
- Controls computational complexity

### Performance Management

- Enables adaptive quality management
- Supports dynamic mode switching
- Balances accuracy vs. performance

### User Interface

- Provides user control over simulation accuracy
- Enables performance optimization
- Shows current mode status

## Performance Comparison

### Computational Complexity

| Mode  | Time Complexity | Space Complexity | Accuracy        | Stability                    |
| ----- | --------------- | ---------------- | --------------- | ---------------------------- |
| IDEAL | O(N)            | O(N)             | High for 2-body | Perfect                      |
| NBODY | O(N²)           | O(N)             | Very High       | Good with proper integration |

### Recommended Usage

| Scenario      | Object Count | Recommended Mode | Reason                 |
| ------------- | ------------ | ---------------- | ---------------------- |
| Educational   | 1-10         | IDEAL            | Predictable, stable    |
| Solar System  | 8-20         | NBODY            | Realistic interactions |
| Binary System | 2-15         | NBODY            | Required for accuracy  |
| Large System  | 50+          | IDEAL            | Performance critical   |
| Real-time     | Any          | IDEAL            | Guaranteed performance |

## 🔗 Related

- [[SimulationConfiguration]] - Complete simulation configuration
- [[IntegratorType]] - Numerical integration methods for N-body mode
- [[AlgorithmType]] - Force calculation algorithms for N-body mode
- [[SimulationState]] - Top-level simulation state
- [[@teskooano/core-physics]] - Physics simulation engine
