# Implementation Guide: Core Type System Changes

## Overview

This guide details the foundational type system changes needed to support the two-mode N-body simulation architecture. These changes form the foundation for all other components.

## 🎯 Goals

- Replace single `PhysicsEngineType` with modular configuration system
- Support Ideal Orrery and N-Body simulation modes
- Enable pluggable algorithms and integrators
- Maintain backwards compatibility during migration

## ✅ Implementation To-Do List

### Phase 1A: Define New Core Types

#### Task 1.1: Update Core State Types

**File**: `packages/core/state/src/game/types.ts`

**Current State (Line 23):**

```typescript
export type PhysicsEngineType = "euler" | "symplectic" | "verlet" | "ideal";
```

**To-Do:**

- [ ] Replace `PhysicsEngineType` with new modular types
- [ ] Add validation logic for configuration combinations
- [ ] Add migration utilities for backwards compatibility

**New Implementation:**

```typescript
// Remove old type and replace with:
export type SimulationMode = "ideal" | "nbody";

export type IntegratorType =
  | "euler" // Simple Euler integration
  | "symplectic" // Symplectic Euler (energy preserving)
  | "verlet" // Velocity Verlet (stable, reversible)
  | "rk4" // Runge-Kutta 4th order (high accuracy)
  | "adaptive"; // Adaptive step size (auto-optimizing)

export type AlgorithmType =
  | "direct" // O(N²) - exact but slow
  | "barnes-hut" // O(N log N) - current implementation
  | "fmm" // O(N) - Fast Multipole Method
  | "p3m"; // O(N log N) - Particle-Mesh hybrid

export interface SimulationConfiguration {
  mode: SimulationMode;
  integrator?: IntegratorType; // Only required for N-Body mode
  algorithm?: AlgorithmType; // Only required for N-Body mode
}

// Backwards compatibility type (temporary)
export type LegacyPhysicsEngineType =
  | "euler"
  | "symplectic"
  | "verlet"
  | "ideal";

// Validation functions
export function isValidConfiguration(config: SimulationConfiguration): boolean {
  if (config.mode === "ideal") {
    // Ideal mode doesn't need integrator or algorithm
    return config.integrator === undefined && config.algorithm === undefined;
  }

  if (config.mode === "nbody") {
    // N-Body mode requires both integrator and algorithm
    return config.integrator !== undefined && config.algorithm !== undefined;
  }

  return false;
}

export function getDefaultConfiguration(): SimulationConfiguration {
  return {
    mode: "nbody",
    integrator: "verlet",
    algorithm: "barnes-hut",
  };
}

// Migration utility for backwards compatibility
export function migrateFromLegacyEngine(
  legacy: LegacyPhysicsEngineType,
): SimulationConfiguration {
  switch (legacy) {
    case "ideal":
      return { mode: "ideal" };
    case "euler":
      return { mode: "nbody", integrator: "euler", algorithm: "barnes-hut" };
    case "symplectic":
      return {
        mode: "nbody",
        integrator: "symplectic",
        algorithm: "barnes-hut",
      };
    case "verlet":
      return { mode: "nbody", integrator: "verlet", algorithm: "barnes-hut" };
    default:
      return getDefaultConfiguration();
  }
}

// Helper functions for UI display
export function getConfigurationDisplayName(
  config: SimulationConfiguration,
): string {
  if (config.mode === "ideal") {
    return "Ideal Orrery";
  }

  const integrator =
    config.integrator?.charAt(0).toUpperCase() + config.integrator?.slice(1);
  const algorithm = config.algorithm
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");

  return `N-Body (${algorithm} + ${integrator})`;
}

export function getConfigurationShortName(
  config: SimulationConfiguration,
): string {
  if (config.mode === "ideal") {
    return "Ideal";
  }

  const algorithmShort =
    config.algorithm === "barnes-hut"
      ? "BH"
      : config.algorithm === "fmm"
        ? "FMM"
        : config.algorithm === "p3m"
          ? "P3M"
          : "Dir";

  const integratorShort =
    config.integrator?.charAt(0).toUpperCase() + config.integrator?.slice(1, 3);

  return `${algorithmShort}-${integratorShort}`;
}
```

#### Task 1.2: Update Data Types Package

**File**: `packages/data/types/src/main.ts`

**To-Do:**

- [ ] Mirror all new types from core/state
- [ ] Export validation functions
- [ ] Ensure type consistency across packages

**Implementation:**

```typescript
// Line 41 - Replace old type and add new ones:
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
  integrator?: IntegratorType;
  algorithm?: AlgorithmType;
}

// Re-export validation utilities
export {
  isValidConfiguration,
  getDefaultConfiguration,
  migrateFromLegacyEngine,
  getConfigurationDisplayName,
  getConfigurationShortName,
} from "@teskooano/core-state";
```

### Phase 1B: Update State Interface

#### Task 1.3: Update SimulationState Interface

**File**: `packages/core/state/src/game/types.ts` (Line 71)

**Current:**

```typescript
physicsEngine: PhysicsEngineType;
```

**To-Do:**

- [ ] Replace `physicsEngine` with `simulationConfig`
- [ ] Add temporary compatibility field
- [ ] Update interface documentation

**New Implementation:**

```typescript
export interface SimulationState {
  time: number;
  timeScale: number;
  paused: boolean;
  selectedObject: string | null;
  focusedObjectId: string | null;
  camera: {
    position: OSVector3;
    target: OSVector3;
    fov: number;
  };

  // New configuration system
  simulationConfig: SimulationConfiguration;

  // Deprecated - keep for backwards compatibility (temporary)
  /** @deprecated Use simulationConfig instead */
  physicsEngine?: LegacyPhysicsEngineType;

  visualSettings: {
    trailLengthMultiplier: number;
    showAllOrbits: boolean;
    showAllLabels: boolean;
    showAuMarkers: boolean;
    predictionSteps: number;
    predictionDuration: number;
  };
  performanceProfile: PerformanceProfileType;
}
```

## 🧪 Testing Strategy

### Task 1.4: Create Type Validation Tests

**File**: `packages/core/state/src/game/types.spec.ts` (new file)

**To-Do:**

- [ ] Test configuration validation
- [ ] Test migration from legacy types
- [ ] Test display name generation
- [ ] Test edge cases and invalid configurations

**Test Implementation:**

```typescript
import { describe, it, expect } from "vitest";
import {
  isValidConfiguration,
  getDefaultConfiguration,
  migrateFromLegacyEngine,
  getConfigurationDisplayName,
  getConfigurationShortName,
  type SimulationConfiguration,
} from "./types";

describe("SimulationConfiguration", () => {
  describe("isValidConfiguration", () => {
    it("should validate ideal mode configurations", () => {
      expect(isValidConfiguration({ mode: "ideal" })).toBe(true);
      expect(
        isValidConfiguration({
          mode: "ideal",
          integrator: "verlet",
        }),
      ).toBe(false);
    });

    it("should validate nbody mode configurations", () => {
      expect(
        isValidConfiguration({
          mode: "nbody",
          integrator: "verlet",
          algorithm: "barnes-hut",
        }),
      ).toBe(true);

      expect(
        isValidConfiguration({
          mode: "nbody",
          integrator: "verlet",
          // missing algorithm
        }),
      ).toBe(false);
    });
  });

  describe("migrateFromLegacyEngine", () => {
    it("should migrate legacy physics engine types", () => {
      expect(migrateFromLegacyEngine("ideal")).toEqual({ mode: "ideal" });
      expect(migrateFromLegacyEngine("verlet")).toEqual({
        mode: "nbody",
        integrator: "verlet",
        algorithm: "barnes-hut",
      });
    });
  });

  describe("display names", () => {
    it("should generate correct display names", () => {
      expect(getConfigurationDisplayName({ mode: "ideal" })).toBe(
        "Ideal Orrery",
      );

      expect(
        getConfigurationDisplayName({
          mode: "nbody",
          integrator: "verlet",
          algorithm: "barnes-hut",
        }),
      ).toBe("N-Body (Barnes-Hut + Verlet)");
    });

    it("should generate correct short names", () => {
      expect(getConfigurationShortName({ mode: "ideal" })).toBe("Ideal");

      expect(
        getConfigurationShortName({
          mode: "nbody",
          integrator: "verlet",
          algorithm: "fmm",
        }),
      ).toBe("FMM-Ver");
    });
  });
});
```

## 📚 Documentation Updates

### Task 1.5: Update Type Documentation

**To-Do:**

- [ ] Add JSDoc comments for all new types
- [ ] Document configuration validation rules
- [ ] Add migration guide examples
- [ ] Update package README with breaking changes

## 🔄 Migration Checklist

### Pre-Implementation

- [ ] Review current `PhysicsEngineType` usage across codebase
- [ ] Identify all dependent packages and files
- [ ] Plan backwards compatibility strategy

### Implementation Order

1. [ ] Define new types in `packages/core/state/src/game/types.ts`
2. [ ] Mirror types in `packages/data/types/src/main.ts`
3. [ ] Create validation test suite
4. [ ] Update `SimulationState` interface
5. [ ] Add migration utilities
6. [ ] Test type system in isolation

### Post-Implementation

- [ ] Verify no TypeScript compilation errors
- [ ] Run validation test suite
- [ ] Update dependent packages
- [ ] Document breaking changes

## ⚠️ Breaking Changes & Compatibility

### Breaking Changes

1. `PhysicsEngineType` removed from public API
2. `SimulationState.physicsEngine` replaced with `simulationConfig`
3. Physics engine string values no longer accepted

### Compatibility Strategy

1. Keep deprecated `physicsEngine` field temporarily
2. Provide `migrateFromLegacyEngine` utility
3. Add validation warnings for deprecated usage
4. Plan removal in next major version

## 🎯 Success Criteria

- [ ] All new types compile without errors
- [ ] Validation functions handle all edge cases
- [ ] Migration utilities preserve existing behavior
- [ ] Test coverage > 95% for type system
- [ ] Documentation clearly explains new architecture

## 📋 Dependencies

**Before Starting**: None (foundational change)
**Blocks**: All other implementation phases depend on these types

**Estimated Time**: 2-3 days
**Risk Level**: Low (pure type definitions)
**Impact Level**: High (affects all components)
