---
aliases: [CoreState, core-state, state-management, rxjs-state]
tags: [core, state, rxjs, reactive, singleton, store]
type: Package
package: "@teskooano/core-state"
name: CoreState
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/core-math",
    "@teskooano/core-physics",
    "@teskooano/data-values",
    "rxjs",
    "three",
  ]
classes:
  [
    "SimulationStateService",
    "CelestialManager",
    "PhysicsSystemAdapter",
    "PhysicsStateCalculator",
    "PhysicsStateProvider",
    "CelestialStore",
    "SeedStore",
    "PhysicsStore",
    "RenderableStore",
    "StateAccessor",
    "StateSubscriptionMixin",
  ]
functions:
  [
    "isValidConfiguration",
    "getDefaultConfiguration",
    "getConfigurationDisplayName",
    "getConfigurationShortName",
  ]
constants: ["AU_METERS", "MIN_ROGUE_DISTANCE_AU"]
types:
  [
    "SimulationState",
    "SimulationConfiguration",
    "CameraState",
    "VisualSettingsState",
    "ClearStateOptions",
    "CelestialRegistry",
  ]
status: active
---

# Core State Package

Comprehensive state management system for the Teskooano application using RxJS for reactive state management with modular, single-responsibility architecture.

## 🎯 Purpose

The `@teskooano/core-state` package provides centralized state management:

- **Reactive State Management**: RxJS-based state synchronization across the application
- **Modular Architecture**: Single-responsibility components with clear boundaries
- **Physics Integration**: Bridge between application state and physics engine
- **Object Lifecycle**: Comprehensive celestial object management
- **Performance Optimization**: Efficient caching and state updates
- **Type Safety**: Full TypeScript type safety throughout

## 🏗️ Architecture

### **Logical Directory Structure**

The package follows a logical organization based on component responsibilities:

```
src/
├── services/          # Core business logic services
│   ├── SimulationStateService.ts
│   ├── PhysicsStateCalculator.ts
│   └── PhysicsStateProvider.ts
├── stores/            # Pure data storage with RxJS
│   ├── CelestialStore.ts
│   ├── SeedStore.ts
│   ├── PhysicsStore.ts
│   └── RenderableStore.ts
├── managers/          # Business logic and operations
│   └── CelestialManager.ts
├── adapters/          # Bridge components
│   └── PhysicsSystemAdapter.ts
├── types/             # Type definitions and utilities
│   ├── types.ts
│   └── utils.ts
├── StateAccessor.ts   # Unified state access
├── StateSubscriptionMixin.ts
└── index.ts
```

### **Architecture Principles**

1. **Separation of Concerns**: Each module has one clear purpose
2. **Single Responsibility**: Focused components with clear boundaries
3. **Clean APIs**: Functional APIs grouped by domain
4. **Reactive Patterns**: RxJS observables for state synchronization
5. **Type Safety**: Full TypeScript type safety throughout

## 🔧 Core Components

### **Services** (`services/`)

Core business logic services:

- **[[SimulationStateService]]** - Manages simulation control state
- **[[PhysicsStateCalculator]]** - Calculates physics state from celestial objects
- **[[PhysicsStateProvider]]** - Provides physics state with intelligent caching

### **Stores** (`stores/`)

Pure data storage with RxJS observables:

- **[[CelestialStore]]** - Manages celestial objects and hierarchy
- **[[SeedStore]]** - Manages seed state with localStorage persistence
- **[[PhysicsStore]]** - Manages physics-related state (acceleration vectors)
- **[[RenderableStore]]** - Manages renderable celestial objects

### **Managers** (`managers/`)

Business logic and complex operations:

- **[[CelestialManager]]** - Consolidates celestial object lifecycle operations

### **Adapters** (`adapters/`)

Bridge components between different systems:

- **[[PhysicsSystemAdapter]]** - Bridges core state and physics engine

### **Types** (`types/`)

Type definitions and utilities:

- **[[SimulationTypes]]** - Simulation state type definitions
- **[[SimulationUtils]]** - Configuration validation and utilities

### **Utilities**

- **[[StateAccessor]]** - Unified access to all application state
- **[[StateSubscriptionMixin]]** - Standardized RxJS subscription management

## 📊 Store Architecture

### **Reactive State Management**

All stores use RxJS `BehaviorSubject` for reactive state updates:

```typescript
// Example: CelestialStore
private readonly _objects: BehaviorSubject<Record<string, CelestialObject>>;
public readonly objects$: Observable<Record<string, CelestialObject>>;
```

### **Immutable Updates**

All operations create new state objects to ensure reactive updates:

```typescript
public setObject(id: string, object: CelestialObject): void {
  const current = this._objects.getValue();
  this._objects.next({ ...current, [id]: object });
}
```

### **Store Integration**

Stores work together through the StateAccessor:

```typescript
// Unified access to all stores
const objects = StateAccessor.getCelestialObjects();
const simulationState = StateAccessor.getSimulationState();
```

## 🚀 Usage Examples

### **Basic State Access**

```typescript
import { StateAccessor, celestialManager } from "@teskooano/core-state";

// Imperative access
const objects = StateAccessor.getCelestialObjects();
const simulationState = StateAccessor.getSimulationState();

// Reactive access
StateAccessor.celestialObjects$().subscribe((objects) => {
  console.log("Objects updated:", Object.keys(objects).length);
});
```

### **Object Lifecycle Management**

```typescript
import { celestialManager } from "@teskooano/core-state";

// Create solar system
const starId = celestialManager.createSolarSystem(starData);

// Add objects
celestialManager.addObjects(planetDataArray);

// Update objects
celestialManager.updateObject("earth", { name: "Terra" });

// Remove objects
celestialManager.removeObject("asteroid-001");
```

### **Physics Integration**

```typescript
import { physicsSystemAdapter } from "@teskooano/core-state";

// Get physics bodies for simulation
const bodies = physicsSystemAdapter.getPhysicsBodies();

// Update state with simulation results
physicsSystemAdapter.updateStateFromResult(simulationResult);
```

### **Subscription Management**

```typescript
import { StateSubscriptionMixin } from "@teskooano/core-state";

class MyComponent extends StateSubscriptionMixin {
  public init(): void {
    this.subscribeToState(StateAccessor.celestialObjects$(), (objects) =>
      this.updateDisplay(objects),
    );
  }
}
```

## 🔄 Integration Points

### **With Physics Engine**

- **PhysicsSystemAdapter**: Bridges application state and physics engine
- **PhysicsStateProvider**: Provides physics state with caching
- **PhysicsStateCalculator**: Calculates physics state from celestial objects

### **With Renderer**

- **RenderableStore**: Provides renderable objects for Three.js
- **StateAccessor**: Provides unified access to renderer state
- **SimulationStateService**: Manages camera and visual settings

### **With UI Components**

- **StateSubscriptionMixin**: Manages UI component subscriptions
- **StateAccessor**: Provides reactive state access for UI
- **CelestialManager**: Handles UI-triggered object operations

## 🎯 Key Features

### **Performance Optimization**

- **Intelligent Caching**: Physics state caching for performance
- **Batch Operations**: Efficient bulk updates and operations
- **Memory Management**: Automatic cleanup and optimization
- **Reactive Efficiency**: RxJS optimizations for state updates

### **Type Safety**

- **Full TypeScript**: Complete type safety throughout
- **Interface Validation**: Ensures interface compliance
- **Type Checking**: Compile-time type checking
- **Documentation**: Extensive type documentation

### **Error Handling**

- **Graceful Degradation**: Continues working on errors
- **Error Recovery**: Automatic recovery from failures
- **Debug Support**: Comprehensive error logging
- **State Consistency**: Maintains data integrity

### **Extensibility**

- **Modular Design**: Easy to extend and modify
- **Clean APIs**: Consistent patterns for extension
- **Future-Proof**: Designed for future expansion
- **Backward Compatibility**: Maintains compatibility

## 🔗 Related Components

- [[SimulationStateService]] - Core simulation state management
- [[CelestialManager]] - Celestial object lifecycle management
- [[PhysicsSystemAdapter]] - Physics engine integration
- [[StateAccessor]] - Unified state access
- [[StateSubscriptionMixin]] - Subscription management

## 📚 Architecture Patterns

- **Singleton Pattern**: Ensures single instances across application
- **Reactive Pattern**: RxJS observables for state synchronization
- **Immutable Pattern**: New state objects for all changes
- **Bridge Pattern**: Connects different system interfaces
- **Factory Pattern**: Creates and initializes objects
- **Manager Pattern**: Centralized business logic

---

_The Core State package provides comprehensive, reactive state management with modular architecture and full TypeScript type safety._
