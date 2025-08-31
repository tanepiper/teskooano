---
aliases:
  [
    PhysicsSystemAdapter,
    physics-adapter,
    simulation-bridge,
    physics-integration,
  ]
tags: [core, state, adapter, singleton, physics, simulation, bridge]
type: Class
package: "@teskooano/core-state"
name: PhysicsSystemAdapter
dependencies:
  ["@teskooano/data-types", "@teskooano/core-physics", "@teskooano/core-math"]
classes: ["PhysicsStateProvider", "SimulationStepResult"]
functions: []
constants: []
types:
  [
    "CelestialObject",
    "PhysicsStateReal",
    "SimulationStepResult",
    "OrbitalParameters",
    "CelestialStatus",
    "CelestialType",
  ]
status: active
---

# PhysicsSystemAdapter

Singleton adapter bridging between core state management and the physics engine, handling data preparation and result processing.

**Location**: `src/adapters/PhysicsSystemAdapter.ts`

## 🎯 Purpose

The `PhysicsSystemAdapter` serves as a crucial bridge between the application's core state and the physics engine:

- **Data Preparation**: Converts celestial objects to physics bodies for simulation
- **Result Processing**: Updates state from physics engine simulation results
- **Destruction Handling**: Processes object destruction events and status updates
- **State Synchronization**: Maintains consistency between physics and game state
- **Performance Optimization**: Efficient batch processing and state updates

## 🏗️ Architecture

### Singleton Pattern

Uses singleton pattern to ensure single adapter instance across the application:

```typescript
export class PhysicsSystemAdapter {
  private static instance: PhysicsSystemAdapter;

  public static getInstance(): PhysicsSystemAdapter {
    if (!PhysicsSystemAdapter.instance) {
      PhysicsSystemAdapter.instance = new PhysicsSystemAdapter();
    }
    return PhysicsSystemAdapter.instance;
  }
}
```

### Bridge Pattern

Acts as a bridge between two different interfaces:

- **Core State**: `CelestialObject` data structures
- **Physics Engine**: `PhysicsStateReal` data structures

## 🔧 Core Methods

### Physics Data Preparation

```typescript
// Get physics bodies for simulation
getPhysicsBodies(): PhysicsStateReal[];

// Get snapshot of celestial objects
getCelestialObjectsSnapshot(): Record<string, CelestialObject>;

// Get snapshot of orbital parameters
getOrbitalParametersSnapshot(): Map<string, OrbitalParameters>;
```

### Simulation Result Processing

```typescript
// Update state from simulation results
updateStateFromResult(result: SimulationStepResult): void;
```

## 📊 Data Flow

### Physics Data Preparation Flow

```mermaid
graph TD
    A[CelestialStore] --> B[PhysicsSystemAdapter]
    B --> C[Filter Active Objects]
    C --> D[PhysicsStateProvider]
    D --> E[PhysicsStateReal Array]
    E --> F[Physics Engine]
```

### Result Processing Flow

```mermaid
graph TD
    A[Physics Engine] --> B[SimulationStepResult]
    B --> C[PhysicsSystemAdapter]
    C --> D[Update Physics States]
    D --> E[Process Destruction Events]
    E --> F[Update CelestialStore]
    F --> G[Update PhysicsStore]
```

## 🔄 Processing Algorithms

### Physics Bodies Preparation

```typescript
public getPhysicsBodies(): PhysicsStateReal[] {
  const bodies: PhysicsStateReal[] = [];
  const allObjects = celestialStore.getObjects();

  Object.values(allObjects)
    .filter((obj: CelestialObject) =>
      obj.status !== CelestialStatus.DESTROYED &&
      obj.status !== CelestialStatus.ANNIHILATED &&
      !obj.ignorePhysics
    )
    .forEach((obj: CelestialObject) => {
      const physicsState = PhysicsStateProvider.getPhysicsState(obj);
      if (physicsState) {
        bodies.push(physicsState);
      } else {
        console.warn(
          `[PhysicsSystemAdapter] Object ${obj.id} is active for physics but could not calculate physics state, skipping in simulation.`
        );
      }
    });

  return bodies;
}
```

### State Update from Results

```typescript
public updateStateFromResult(result: SimulationStepResult): void {
  const currentCelestialObjects = celestialStore.getObjects();
  const newCelestialObjectsMap: Record<string, CelestialObject> = {
    ...currentCelestialObjects,
  };

  this.updatePhysicsStates(result, newCelestialObjectsMap);
  this.processDestructionEvents(result, newCelestialObjectsMap);

  celestialStore.setAllObjects(newCelestialObjectsMap);
  physicsStore.updateAccelerationVectors(result.accelerations);
}
```

### Physics State Updates

```typescript
private updatePhysicsStates(
  result: SimulationStepResult,
  newCelestialObjectsMap: Record<string, CelestialObject>
): void {
  result.states.forEach((updatedState) => {
    const id = updatedState.id;
    const existingObject = newCelestialObjectsMap[id];
    if (existingObject) {
      PhysicsStateProvider.updateCacheWithSimulationResult(id, updatedState);
    } else {
      console.warn(
        `[PhysicsSystemAdapter] Received updated state for object ID: ${id}, which was not found in the current celestial objects map.`
      );
    }
  });
}
```

### Destruction Event Processing

```typescript
private processDestructionEvents(
  result: SimulationStepResult,
  newCelestialObjectsMap: Record<string, CelestialObject>
): void {
  // Process direct destruction events first
  result.destroyedIds.forEach((idToDestroy) => {
    const idToDestroyStr = String(idToDestroy);
    const existingObject = newCelestialObjectsMap[idToDestroyStr];
    if (
      existingObject &&
      existingObject.status !== CelestialStatus.DESTROYED &&
      existingObject.status !== CelestialStatus.ANNIHILATED
    ) {
      newCelestialObjectsMap[idToDestroyStr] = {
        ...existingObject,
        status: CelestialStatus.DESTROYED,
      };
    }
  });

  // Handle reactive ring system destruction
  Object.values(newCelestialObjectsMap).forEach((object) => {
    if (
      object.type === CelestialType.RING_SYSTEM &&
      object.parentId &&
      object.status !== CelestialStatus.DESTROYED &&
      object.status !== CelestialStatus.ANNIHILATED
    ) {
      const parent = newCelestialObjectsMap[object.parentId];
      if (
        parent &&
        (parent.status === CelestialStatus.DESTROYED ||
         parent.status === CelestialStatus.ANNIHILATED)
      ) {
        newCelestialObjectsMap[object.id] = {
          ...object,
          status: parent.status,
        };
      }
    }
  });
}
```

## 🚀 Usage Examples

### Basic Physics Integration

```typescript
import { physicsSystemAdapter } from "@teskooano/core-state";

// Get physics bodies for simulation
const physicsBodies = physicsSystemAdapter.getPhysicsBodies();

// Run physics simulation (external)
const simulationResult = await runPhysicsSimulation(physicsBodies);

// Update state with results
physicsSystemAdapter.updateStateFromResult(simulationResult);
```

### Simulation Loop Integration

```typescript
// In simulation loop
function simulationStep() {
  // Get current physics state
  const bodies = physicsSystemAdapter.getPhysicsBodies();

  // Run physics step
  const result = physicsEngine.step(bodies, deltaTime);

  // Update state with results
  physicsSystemAdapter.updateStateFromResult(result);

  // Continue loop
  requestAnimationFrame(simulationStep);
}
```

### State Snapshots

```typescript
// Get current state snapshot
const celestialObjects = physicsSystemAdapter.getCelestialObjectsSnapshot();
const orbitalParams = physicsSystemAdapter.getOrbitalParametersSnapshot();

// Use for analysis or debugging
console.log("Active objects:", Object.keys(celestialObjects).length);
console.log("Objects with orbits:", orbitalParams.size);
```

### Error Handling

```typescript
try {
  const bodies = physicsSystemAdapter.getPhysicsBodies();
  const result = await physicsEngine.simulate(bodies);
  physicsSystemAdapter.updateStateFromResult(result);
} catch (error) {
  console.error("Physics simulation failed:", error);
  // Handle error appropriately
}
```

## 🎯 Performance Optimizations

### Efficient Filtering

- **Status Filtering**: Only processes active objects
- **Physics Filtering**: Skips objects with `ignorePhysics` flag
- **Batch Processing**: Processes all objects in single operation

### State Updates

- **Immutable Updates**: Creates new state objects for updates
- **Bulk Updates**: Updates all objects in single store operation
- **Cache Management**: Updates physics state cache efficiently

### Memory Management

- **Snapshot Creation**: Efficient shallow copies for snapshots
- **Result Processing**: Processes results without unnecessary allocations
- **Error Handling**: Graceful handling of missing objects

## 🔗 Integration Points

### With Physics Engine

- Provides `PhysicsStateReal` array for simulation
- Processes `SimulationStepResult` from engine
- Handles physics-specific data structures

### With Core State

- Reads from `celestialStore` for object data
- Updates `celestialStore` with simulation results
- Updates `physicsStore` with acceleration vectors

### With PhysicsStateProvider

- Uses provider for physics state calculations
- Updates provider cache with simulation results
- Maintains cache consistency

## 🔗 Related Components

- [[CelestialStore]] - Source of celestial object data
- [[PhysicsStore]] - Stores acceleration vectors
- [[PhysicsStateProvider]] - Manages physics state calculations
- [[SimulationStateService]] - Controls simulation configuration

## 📚 Architecture Patterns

- **Singleton Pattern**: Ensures single adapter instance
- **Bridge Pattern**: Connects different data structures
- **Adapter Pattern**: Adapts between interfaces
- **Batch Processing Pattern**: Efficient bulk operations

---

_The PhysicsSystemAdapter provides efficient bridging between core state management and the physics engine with robust error handling and performance optimization._
