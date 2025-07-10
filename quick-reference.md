# Quick Reference: New N-Body Algorithms & Integrators

## 🔀 New Integrators

### RK4 (4th Order Runge-Kutta)

```typescript
import { rk4Integrate, rk4IntegrateSimple } from "./integrators/rk4";

// Full RK4 with force recalculation
const newState = rk4Integrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);

// Simplified RK4 for constant acceleration
const newState = rk4IntegrateSimple(currentState, acceleration, dt);
```

### Adaptive RK (Dormand-Prince with Error Control)

```typescript
import { adaptiveRKIntegrate, AdaptiveConfig } from "./integrators/adaptive";

const config: AdaptiveConfig = {
  tolerance: 1e-8,
  minDt: 1e-12,
  maxDt: 1e-2,
  safetyFactor: 0.9,
};

const result = adaptiveRKIntegrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
  config,
);
// result contains: newState, actualDt, nextDt, error, stepsTaken
```

### Symplectic Integrators (Yoshida, Forest-Ruth, PEFRL)

```typescript
import {
  yoshida4Integrate,
  forestRuthIntegrate,
  pefrlIntegrate,
  symplecticIntegrate,
  SymplecticConfig,
} from "./integrators/yoshida";

// Direct usage
const newState = yoshida4Integrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);
const newState = pefrlIntegrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);

// Generic with configuration
const config: SymplecticConfig = { method: "pefrl", order: 4 };
const newState = symplecticIntegrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
  config,
);
```

## 🏗️ New Algorithms

### Tree-PM Hybrid Algorithm

```typescript
import { TreePMStrategy, TreePMConfig } from "./algorithms/tree-pm";

const config: TreePMConfig = {
  treeThreshold: 5.0, // Particles per cell for tree method
  pmGridSize: 64, // 64³ PM grid
  smoothingLength: 1.0, // Force smoothing
  treeOpeningAngle: 0.5, // Barnes-Hut theta
  maxTreeDepth: 20, // Tree recursion limit
  directCutoff: 2.5, // Direct sum threshold
};

const treePM = new TreePMStrategy(config);
const forces = treePM.calculateForces(bodies, params);
```

## ⚙️ Configuration Matrix

### When to Use Each Method

| Scenario                | Algorithm    | Integrator | Reason                             |
| ----------------------- | ------------ | ---------- | ---------------------------------- |
| **Planetary System**    | `direct`     | `pefrl`    | High accuracy, energy conservation |
| **Star Cluster**        | `barnes-hut` | `yoshida4` | Good performance, symplectic       |
| **Galaxy Collision**    | `tree-pm`    | `yoshida4` | Multi-scale, long-term stability   |
| **Close Encounters**    | `direct`     | `adaptive` | Accuracy with variable timesteps   |
| **Large Smooth System** | `fmm`        | `rk4`      | Linear scaling, high accuracy      |

### Performance Characteristics

```typescript
// Complexity reference
const COMPLEXITY_GUIDE = {
  direct: "O(N²)", // 1-1000 particles
  "barnes-hut": "O(N log N)", // 100-100k particles
  fmm: "O(N)", // 1000-1M particles
  p3m: "O(N log N)", // 500-100k particles
  "tree-pm": "O(N log N)", // 1000-1M particles (NEW)
};

const INTEGRATOR_ORDER = {
  euler: 1, // First order
  verlet: 2, // Second order
  symplectic: 2, // Second order, symplectic
  rk4: 4, // Fourth order (NEW)
  adaptive: 5, // Fifth order with error control (NEW)
  yoshida4: 4, // Fourth order symplectic (NEW)
  pefrl: 4, // Optimized 4th order symplectic (NEW)
};
```

## 🎯 Usage Examples

### Basic Configuration

```typescript
const config: SimulationConfiguration = {
  mode: "nbody",
  algorithm: "tree-pm",
  integrator: "yoshida4",
};
```

### Advanced Configuration with Algorithm Factory

```typescript
import { AlgorithmFactory } from "./algorithms/algorithm-factory";

// Automatic selection
const optimal = AlgorithmFactory.selectOptimalAlgorithm(10000, {
  prioritizeAccuracy: true,
  maxMemoryUsage: "medium",
});

// Validation
const validation = AlgorithmFactory.validateAlgorithmChoice("tree-pm", 10000);
if (!validation.isValid) {
  console.warn("Warnings:", validation.warnings);
  console.log("Recommendations:", validation.recommendations);
}

// Performance estimation
const perf = AlgorithmFactory.getPerformanceEstimate("tree-pm", 10000);
console.log(
  `Relative speed: ${perf.relativeSpeed}x, Memory: ${perf.memoryUsage}`,
);
```

### Integration with Simulation Wrapper

```typescript
// Your existing simulation wrapper will automatically use new methods
const wrapper = new EnhancedSimulationWrapper(bodies, config);
const result = wrapper.step(deltaTime);

// The wrapper internally uses:
// - AlgorithmFactory for optimal algorithm selection
// - New integrators when specified in config
// - Performance monitoring and recommendations
```

## 🧪 Testing & Validation

### Energy Conservation Test

```typescript
// Test symplectic integrators for energy conservation
const initialEnergy = calculateTotalEnergy(bodies);
// ... run simulation for many steps
const finalEnergy = calculateTotalEnergy(bodiesAfterSimulation);
const energyDrift = Math.abs(finalEnergy - initialEnergy) / initialEnergy;

// Expected results:
// Standard integrators: energyDrift > 1e-3 after 1000 steps
// Symplectic integrators: energyDrift < 1e-8 after 1000 steps
```

### Adaptive Timestep Test

```typescript
// Test adaptive integrator error control
const adaptiveResult = adaptiveRKIntegrate(state, acc, calcAcc, dt, {
  tolerance: 1e-10, // Very strict tolerance
});

console.log(`Steps taken: ${adaptiveResult.stepsTaken}`);
console.log(`Error estimate: ${adaptiveResult.error}`);
console.log(`Next suggested dt: ${adaptiveResult.nextDt}`);
```

### Tree-PM Performance Test

```typescript
// Compare Tree-PM vs Barnes-Hut for multi-scale system
const bodies = generateMultiScaleBodies(10000); // Galaxy + dense cluster

const barnesHutTime = measureTime(() =>
  barnesHutStrategy.calculateForces(bodies, params),
);

const treePMTime = measureTime(() =>
  treePMStrategy.calculateForces(bodies, params),
);

console.log(`Speedup: ${barnesHutTime / treePMTime}x`);
```

## 📋 Migration Checklist

- [ ] Update type definitions to include new integrator types
- [ ] Add Tree-PM to algorithm factory specifications
- [ ] Test new integrators with existing simulation wrapper
- [ ] Benchmark performance against current methods
- [ ] Update UI to expose new algorithm options
- [ ] Create unit tests for new implementations
- [ ] Update documentation with usage examples

## 🚨 Important Notes

1. **Import Paths**: All new integrators are exported from `./integrators/index.ts`
2. **Configuration**: Tree-PM requires tuning for optimal performance
3. **Compatibility**: All new methods are compatible with existing simulation wrapper
4. **Performance**: Symplectic integrators may be slower but provide much better energy conservation
5. **Adaptive RK**: Returns detailed step information for debugging and optimization

Your N-body simulation system now has research-grade capabilities! 🎉
