---
aliases: [StateAccessor, state-accessor, unified-access, reactive-access]
tags: [core, state, utility, accessor, reactive, imperative]
type: Class
package: "@teskooano/core-state"
name: StateAccessor
dependencies: ["@teskooano/data-types", "@teskooano/core-math", "rxjs"]
classes: ["Observable"]
functions: []
constants: []
types:
  [
    "CelestialObject",
    "RenderableCelestialObject",
    "SimulationState",
    "OSVector3",
  ]
status: active
---

# StateAccessor

Standardized accessor for all state in the Teskooano application, providing consistent patterns for both reactive and imperative state access.

**Location**: `src/StateAccessor.ts`

## 🎯 Purpose

The `StateAccessor` provides unified access to all application state:

- **Unified API**: Single point of access for all state across the application
- **Reactive Patterns**: Observable streams with initial values for immediate access
- **Imperative Access**: Direct getter methods for immediate state retrieval
- **Convenience Methods**: Common patterns like getting objects by IDs
- **Consistent Interface**: Eliminates inconsistency between direct imports and accessor methods
- **Performance Optimization**: Efficient access patterns with minimal overhead and optimized observables

## 🏗️ Architecture

### Static Class Pattern

Uses static methods for utility-style access without instantiation:

```typescript
export class StateAccessor {
  // Static methods only - no instantiation required
  static getCelestialObjects(): Record<string, CelestialObject> { ... }
  static celestialObjects$(): Observable<Record<string, CelestialObject>> { ... }
}
```

### Dual Access Patterns

Provides both reactive and imperative access patterns:

```typescript
// Reactive access
StateAccessor.celestialObjects$().subscribe((objects) => {
  // Handle objects update
});

// Imperative access
const currentObjects = StateAccessor.getCelestialObjects();
```

### Observable Optimization

Optimized observables for better performance:

```typescript
static celestialObjects$(): Observable<Record<string, CelestialObject>> {
  return celestialObjects$; // Direct observable access for better performance
}
```

## 🔧 Core Methods

### Celestial Objects Access

```typescript
// Reactive access
static celestialObjects$(): Observable<Record<string, CelestialObject>>;

// Imperative access
static getCelestialObjects(): Record<string, CelestialObject>;

// Convenience methods
static getCelestialObject(objectId: string): CelestialObject | undefined;
static getCelestialObjectsByIds(objectIds: string[]): CelestialObject[];
static getCelestialObjectsMapByIds(objectIds: string[]): Record<string, CelestialObject>;
static hasCelestialObject(objectId: string): boolean;
static getCelestialObjectIds(): string[];
static getCelestialObjectCount(): number;
static hasAnyCelestialObjects(): boolean;
```

### Simulation State Access

```typescript
// Reactive access
static simulation$(): Observable<SimulationState>;

// Imperative access
static getSimulationState(): SimulationState;
```

### Celestial Hierarchy Access

```typescript
// Reactive access
static celestialHierarchy$(): Observable<Record<string, string[]>>;

// Imperative access
static getCelestialHierarchy(): Record<string, string[]>;
```

### Acceleration Vectors Access

```typescript
// Reactive access
static accelerationVectors$(): Observable<Record<string, OSVector3>>;

// Imperative access
static getAccelerationVectors(): Record<string, OSVector3>;
```

### Current Seed Access

```typescript
// Reactive access
static getCurrentSeedStream(): Observable<string>;

// Imperative access
static getCurrentSeed(): string;
```

### Renderable Objects Access

```typescript
// Reactive access
static renderableObjects$(): Observable<Record<string, RenderableCelestialObject>>;

// Imperative access
static getRenderableObjects(): Record<string, RenderableCelestialObject>;

// Convenience methods
static getRenderableObject(objectId: string): RenderableCelestialObject | undefined;
static getRenderableObjectsByIds(objectIds: string[]): RenderableCelestialObject[];
static getRenderableObjectsMapByIds(objectIds: string[]): Record<string, RenderableCelestialObject>;
static hasRenderableObject(objectId: string): boolean;
static getRenderableObjectIds(): string[];
static getRenderableObjectCount(): number;
```

## 🚀 Usage Examples

### Basic State Access

```typescript
import { StateAccessor } from "@teskooano/core-state";

// Imperative access
const objects = StateAccessor.getCelestialObjects();
const simulationState = StateAccessor.getSimulationState();
const currentSeed = StateAccessor.getCurrentSeed();

// Reactive access
StateAccessor.celestialObjects$().subscribe((objects) => {
  console.log("Objects updated:", Object.keys(objects).length);
});

StateAccessor.simulation$().subscribe((state) => {
  console.log("Simulation state:", state.time, state.paused);
});
```

### Convenience Methods

```typescript
// Get specific object
const earth = StateAccessor.getCelestialObject("earth");

// Get multiple objects by IDs
const planets = StateAccessor.getCelestialObjectsByIds([
  "earth",
  "mars",
  "jupiter",
]);

// Get objects as map
const planetMap = StateAccessor.getCelestialObjectsMapByIds(["earth", "mars"]);

// Check existence
const hasEarth = StateAccessor.hasCelestialObject("earth");

// Get all IDs
const allIds = StateAccessor.getCelestialObjectIds();

// Get count
const objectCount = StateAccessor.getCelestialObjectCount();

// Check if any objects exist
const hasObjects = StateAccessor.hasAnyCelestialObjects();
```

### Reactive Patterns

```typescript
// Subscribe to specific object changes
import { map, filter, distinctUntilChanged } from "rxjs/operators";

StateAccessor.celestialObjects$()
  .pipe(
    map((objects) => objects["earth"]),
    filter((earth) => earth !== undefined),
    distinctUntilChanged((prev, curr) => prev.name === curr.name),
  )
  .subscribe((earth) => {
    console.log("Earth name changed:", earth.name);
  });

// Subscribe to simulation time changes
StateAccessor.simulation$()
  .pipe(
    map((state) => state.time),
    distinctUntilChanged(),
  )
  .subscribe((time) => {
    console.log("Time updated:", time);
  });

// Subscribe to object count changes
StateAccessor.celestialObjects$()
  .pipe(
    map((objects) => Object.keys(objects).length),
    distinctUntilChanged(),
  )
  .subscribe((count) => {
    console.log("Object count changed:", count);
  });
```

### Renderable Objects Access

```typescript
// Get renderable objects
const renderableObjects = StateAccessor.getRenderableObjects();

// Get specific renderable object
const renderableEarth = StateAccessor.getRenderableObject("earth");

// Get multiple renderable objects
const renderablePlanets = StateAccessor.getRenderableObjectsByIds([
  "earth",
  "mars",
]);

// Subscribe to renderable object changes
StateAccessor.renderableObjects$().subscribe((renderableObjects) => {
  console.log(
    "Renderable objects updated:",
    Object.keys(renderableObjects).length,
  );
});
```

### Combined Access Patterns

```typescript
// Combine multiple state sources
import { combineLatest } from "rxjs";

combineLatest([
  StateAccessor.celestialObjects$(),
  StateAccessor.simulation$(),
]).subscribe(([objects, simulation]) => {
  console.log(
    `Simulation at ${simulation.time}s with ${Object.keys(objects).length} objects`,
  );
});

// Conditional access based on state
StateAccessor.simulation$()
  .pipe(
    map((state) => state.selectedObject),
    filter((selectedId) => selectedId !== null),
  )
  .subscribe((selectedId) => {
    const selectedObject = StateAccessor.getCelestialObject(selectedId);
    console.log("Selected object:", selectedObject?.name);
  });
```

## 🎯 Performance Considerations

### Reactive Efficiency

- **Initial Values**: `startWith` provides immediate access without waiting
- **Distinct Until Changed**: Use `distinctUntilChanged()` to avoid unnecessary updates
- **Selective Mapping**: Map to specific properties to reduce object creation

### Imperative Efficiency

- **Direct Access**: O(1) lookup for object access
- **Cached Results**: Results are cached at the store level
- **Minimal Overhead**: Static methods have minimal performance impact

### Memory Management

- **No Subscription Leaks**: Proper subscription management required
- **Efficient Filtering**: Uses native JavaScript methods
- **Object Reuse**: Reuses objects when possible

## 🔗 Integration Points

### With Stores

- Provides unified access to all stores
- Enhances observables with initial values
- Maintains consistency across access patterns

### With Components

- Provides consistent API for all components
- Supports both reactive and imperative patterns
- Enables efficient state access

### With Utilities

- Works with RxJS operators for advanced patterns
- Supports composition with other utilities
- Enables complex state queries

## 🔗 Related Components

- [[CelestialStore]] - Source of celestial object data
- [[SimulationStateService]] - Source of simulation state
- [[StateSubscriptionMixin]] - Manages subscriptions to state
- [[PhysicsStore]] - Source of physics data

## 📚 Architecture Patterns

- **Static Utility Pattern**: No instantiation required
- **Facade Pattern**: Simplifies complex state access
- **Reactive Pattern**: RxJS observables with enhancements
- **Imperative Pattern**: Direct getter methods

---

_The StateAccessor provides unified, efficient access to all application state with consistent patterns for both reactive and imperative access._
