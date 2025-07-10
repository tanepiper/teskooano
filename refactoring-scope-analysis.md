# N-Body Refactoring Scope Analysis

## Overview

This document maps all code locations that need modification for implementing the two-mode N-body simulation system (Ideal Orrery + N-Body Physics) with pluggable algorithms and integrators.

## 🎯 Core Type System Changes

### Primary Type Definitions

**Current locations require expansion:**

1. **`packages/core/state/src/game/types.ts`** (Lines 23)
   - Current: `PhysicsEngineType = "euler" | "symplectic" | "verlet" | "ideal"`
   - **Needs**: Expand to include simulation modes and algorithm types

2. **`packages/data/types/src/main.ts`** (Lines 41)
   - Mirror the type changes from core/state

### New Types Required:

```typescript
// New types to add:
export type SimulationMode = "ideal" | "nbody";
export type IntegratorType =
  | "euler"
  | "symplectic"
  | "verlet"
  | "rk4"
  | "adaptive";
export type AlgorithmType = "direct" | "barnes-hut" | "fmm" | "p3m";

export interface SimulationConfiguration {
  mode: SimulationMode;
  integrator?: IntegratorType; // Only for N-Body mode
  algorithm?: AlgorithmType; // Only for N-Body mode
}
```

## 🏗️ State Management Layer

### State Service Modifications

3. **`packages/core/state/src/game/simulation.ts`**
   - **Line 29**: Update `_initialState.physicsEngine` to use new configuration system
   - **Line 185-189**: Replace `setPhysicsEngine()` with `setSimulationConfiguration()`
   - Add validation logic for mode/algorithm combinations

4. **`packages/core/state/src/game/index.ts`**
   - **Line 72**: Update exported method name and signature
   - **Line 104**: Update PhysicsEngineType export to new types

### State Tests

5. **`packages/core/state/src/game/game.spec.ts`**
   - **Lines 117, 180**: Update test configurations to use new types

## 🔧 Physics Engine Core

### Main Simulation Logic

6. **`packages/core/physics/src/simulation/simulation.ts`**
   - **Line 18**: Import new types
   - **Line 88**: Update function signature and documentation
   - **Line 103**: Replace `physicsEngine` parameter with `SimulationConfiguration`
   - **Line 108-279**: Replace physics engine switch with mode dispatcher
   - **Needs**: Factory pattern implementation for algorithm selection

7. **`packages/core/physics/src/simulation/types.ts`**
   - **Line 32**: Update interface to use new configuration type

### New Files Needed in Physics Package:

```
packages/core/physics/src/
├── modes/
│   ├── ideal/
│   │   ├── ideal-orrery.ts           # Keplerian orbit calculator
│   │   └── ideal-orrery.spec.ts
│   └── nbody/
│       ├── nbody-dispatcher.ts       # Algorithm factory
│       ├── algorithms/
│       │   ├── direct.ts            # O(N²) direct calculation
│       │   ├── barnes-hut.ts        # Current octree implementation
│       │   ├── fmm.ts               # Fast Multipole Method
│       │   └── p3m.ts               # Particle-Mesh
│       └── integrators/
│           ├── euler.ts
│           ├── verlet.ts
│           ├── symplectic.ts
│           ├── rk4.ts
│           └── adaptive.ts
└── interfaces/
    ├── simulation-strategy.ts        # Strategy pattern interfaces
    ├── integrator-strategy.ts
    └── algorithm-strategy.ts
```

## 🖥️ Application & UI Layer

### Settings Panel

8. **`apps/teskooano/src/plugins/settings/controller/SettingsController.ts`**
   - **Line 12**: Replace `ENGINE_OPTIONS` with mode/algorithm selection
   - **Line 87**: Update initialization logic
   - **Line 172-174**: Replace `handleEngineChange` with mode/configuration handlers
   - **Line 207**: Update state reading logic

### Settings View

9. **`apps/teskooano/src/plugins/settings/view/` (HTML templates)**
   - Replace single engine dropdown with:
     - Mode selector (Ideal vs N-Body)
     - Algorithm selector (conditional visibility)
     - Integrator selector (conditional visibility)

### Engine Panel Display

10. **`apps/teskooano/src/plugins/engine-panel/main-toolbar/simulation-controls/controller/simulation-controls.controller.ts`**
    - **Line 93**: Update `_updateEngineDisplay()` to show mode + algorithm
    - **New logic**: Format display like "N-Body (Barnes-Hut + Verlet)"

11. **`apps/teskooano/src/plugins/engine-panel/main-toolbar/simulation-controls/controller/simulation-controls.utils.ts`**
    - **Line 60**: Replace `getEngineShortName()` with new formatting function
    - **New function**: Format complex configuration into compact display

## 🎨 Renderer Integration

### Renderer State Adapter

12. **`packages/renderer/threejs/src/RendererStateAdapter.ts`**
    - **Line 44-45**: Update physics engine mapping logic
    - **Line 137-138**: Update visual settings extraction
    - **Line 157**: Update comparison logic for new configuration structure

13. **`packages/renderer/threejs/src/types.ts`**
    - **Line 34**: Update `physicsEngine` type to handle new configuration

### Orbit Renderer

14. **`packages/renderer/threejs-orbits/src/core/OrbitsManager.ts`**
    - **Line 83**: Update mode detection logic
    - **Line 93**: Update initial settings handling

15. **`packages/renderer/threejs-orbits/src/verlet/PredictionManager.ts`**
    - **Line 265**: Update physics engine reference

## 📦 Package Integration

### Simulation Manager

16. **`packages/app/simulation/src/SimulationManager.ts`**
    - **Line 198**: Update physics engine parameter passing
    - **Line 204**: Update `updateSimulation` call with new configuration

### App Tests

17. **`packages/app/simulation/src/index.spec.ts`**
    - **Line 63**: Update test configuration

## 📚 Documentation Updates

### Architecture Documentation

18. **ARCHITECTURE.md**
    - **Lines 266, 271, 296, 343**: Update physics engine references
    - Add new section on simulation modes and strategy patterns

19. **Multiple Package READMEs**:
    - `packages/core/physics/README.md` (Line 118, 134)
    - `packages/core/physics/ARCHITECTURE.md` (Line 16, 23)
    - `packages/core/state/ARCHITECTURE.md` (Line 14, 16, 22)
    - `packages/renderer/threejs-orbits/ARCHITECTURE.md` (Line 23)

### Changelog Updates

20. **CHANGELOG.md** and related files
    - Document breaking changes in physics engine interface
    - Update multiple package changelogs

## 🔄 Migration Strategy

### Phase 1: Core Types & Interfaces

- Update type definitions
- Create strategy interfaces
- Add configuration validation

### Phase 2: Physics Engine Refactoring

- Implement mode dispatcher
- Extract current algorithms into strategy pattern
- Add new algorithm implementations

### Phase 3: UI & State Integration

- Update settings controllers and views
- Modify state management layer
- Update renderer integration

### Phase 4: Testing & Documentation

- Update all test suites
- Refresh documentation
- Performance validation

## 📊 Impact Assessment

**Files to Modify**: ~20 files
**New Files to Create**: ~15 files  
**Packages Affected**: 7 packages
**Breaking Changes**: Yes (physics engine interface)
**Migration Required**: Configuration format change

## 🚨 Risk Mitigation

1. **Backwards Compatibility**: Provide automatic migration from old `physicsEngine` strings
2. **Fallback Logic**: Default to safe configurations if invalid combinations detected
3. **Gradual Rollout**: Feature flags for new modes during development
4. **Performance Monitoring**: Benchmark before/after algorithm changes

This comprehensive scope ensures we capture all integration points and maintain system consistency throughout the refactoring process.
