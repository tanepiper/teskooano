---
aliases: [SimulationState]
tags: [data, types, simulation]
type: Interface
package: "@teskooano/data-types"
file: "src/main.ts"
status: active
---

# SimulationState

State interface for the simulation containing time, camera, and object selection information.

## Overview

The `SimulationState` interface defines the top-level state structure for the Teskooano simulation. It contains all the essential state information including time management, camera positioning, and object selection that needs to be tracked and synchronized across the entire application.

## Interface Definition

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
}
```

## Properties

### Time Management

#### time

```typescript
time: number;
```

Current simulation time.

- **Type**: `number`
- **Required**: Yes
- **Units**: Milliseconds since simulation start
- **Usage**: Physics calculations and animation timing

#### timeScale

```typescript
timeScale: number;
```

Time scale multiplier for simulation speed.

- **Type**: `number`
- **Required**: Yes
- **Range**: 0.0+ (0 = paused, 1 = real-time, >1 = accelerated)
- **Usage**: Controls simulation speed and time dilation

#### paused

```typescript
paused: boolean;
```

Whether the simulation is currently paused.

- **Type**: `boolean`
- **Required**: Yes
- **Usage**: Simulation control and UI state

### Object Selection

#### selectedObject

```typescript
selectedObject: string | null;
```

The unique ID of the currently selected object, or null if no object is selected.

- **Type**: `string | null`
- **Required**: Yes
- **Usage**: UI highlighting and information display

#### focusedObjectId

```typescript
focusedObjectId: string | null;
```

The unique ID of the object currently being focused on, or null if no object is focused.

- **Type**: `string | null`
- **Required**: Yes
- **Usage**: Camera control and tracking

### Camera State

#### camera

```typescript
camera: {
  position: OSVector3;
  target: OSVector3;
  fov: number;
}
```

Camera state information.

**Properties:**

- **position**: Camera position in world coordinates
- **target**: Camera target point in world coordinates
- **fov**: Camera field of view in degrees

## Usage Examples

### Initial Simulation State

```typescript
import { SimulationState } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

const initialState: SimulationState = {
  time: 0,
  timeScale: 1.0,
  paused: false,
  selectedObject: null,
  focusedObjectId: "sun-001", // Focus on main star initially
  camera: {
    position: new OSVector3(0, 20, 50), // Above and behind origin
    target: new OSVector3(0, 0, 0), // Looking at origin
    fov: 75, // 75-degree field of view
  },
};
```

### Paused State

```typescript
const pausedState: SimulationState = {
  time: 86400000, // 1 day elapsed
  timeScale: 0, // Paused
  paused: true,
  selectedObject: "earth-001",
  focusedObjectId: "earth-001",
  camera: {
    position: new OSVector3(15, 5, 15), // Close to Earth
    target: new OSVector3(10, 0, 0), // Looking at Earth
    fov: 60,
  },
};
```

### Fast-Forward State

```typescript
const fastForwardState: SimulationState = {
  time: 31557600000, // 1 year elapsed
  timeScale: 86400, // 1 day per second
  paused: false,
  selectedObject: "jupiter-001",
  focusedObjectId: "jupiter-001",
  camera: {
    position: new OSVector3(60, 20, 60), // Distant view of Jupiter
    target: new OSVector3(52, 0, 0), // Looking at Jupiter
    fov: 45, // Narrower field of view
  },
};
```

### System Overview State

```typescript
const overviewState: SimulationState = {
  time: 15778800000, // 6 months elapsed
  timeScale: 3600, // 1 hour per second
  paused: false,
  selectedObject: null, // No specific selection
  focusedObjectId: null, // System-wide view
  camera: {
    position: new OSVector3(0, 100, 200), // High above system
    target: new OSVector3(0, 0, 0), // Looking at system center
    fov: 90, // Wide field of view
  },
};
```

## State Management

### Time Updates

```typescript
function updateSimulationTime(
  state: SimulationState,
  deltaTime: number,
): SimulationState {
  if (state.paused) {
    return state; // No time update when paused
  }

  return {
    ...state,
    time: state.time + deltaTime * state.timeScale,
  };
}
```

### Object Selection

```typescript
function selectObject(
  state: SimulationState,
  objectId: string | null,
): SimulationState {
  return {
    ...state,
    selectedObject: objectId,
  };
}

function focusObject(
  state: SimulationState,
  objectId: string | null,
  cameraPosition?: OSVector3,
  cameraTarget?: OSVector3,
): SimulationState {
  const newState = {
    ...state,
    focusedObjectId: objectId,
  };

  if (cameraPosition && cameraTarget) {
    newState.camera = {
      ...state.camera,
      position: cameraPosition,
      target: cameraTarget,
    };
  }

  return newState;
}
```

### Camera Updates

```typescript
function updateCameraState(
  state: SimulationState,
  position: OSVector3,
  target: OSVector3,
  fov?: number,
): SimulationState {
  return {
    ...state,
    camera: {
      position,
      target,
      fov: fov ?? state.camera.fov,
    },
  };
}
```

### Simulation Control

```typescript
function pauseSimulation(state: SimulationState): SimulationState {
  return {
    ...state,
    paused: true,
    timeScale: 0,
  };
}

function resumeSimulation(
  state: SimulationState,
  timeScale: number = 1.0,
): SimulationState {
  return {
    ...state,
    paused: false,
    timeScale,
  };
}

function setTimeScale(
  state: SimulationState,
  timeScale: number,
): SimulationState {
  return {
    ...state,
    timeScale,
    paused: timeScale === 0,
  };
}
```

## Integration

### Physics System

- `time` drives physics calculations
- `timeScale` controls simulation speed
- `paused` state halts physics updates

### Rendering System

- `camera` state controls 3D view
- `focusedObjectId` drives camera following
- `selectedObject` enables highlighting

### UI System

- Selection state drives information panels
- Time controls reflect state values
- Camera controls update camera state

### State Management

- Central state atom for the entire simulation
- Reactive updates propagate to all systems
- Immutable state updates for predictability

## Validation

### State Validation

```typescript
function validateSimulationState(state: SimulationState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Time validation
  if (typeof state.time !== "number" || state.time < 0) {
    errors.push("Time must be a non-negative number");
  }

  if (typeof state.timeScale !== "number" || state.timeScale < 0) {
    errors.push("Time scale must be a non-negative number");
  }

  // Camera validation
  if (!state.camera.position || !state.camera.target) {
    errors.push("Camera position and target are required");
  }

  if (
    typeof state.camera.fov !== "number" ||
    state.camera.fov <= 0 ||
    state.camera.fov >= 180
  ) {
    errors.push("Camera FOV must be between 0 and 180 degrees");
  }

  // Consistency checks
  if (state.paused && state.timeScale !== 0) {
    errors.push("Paused state should have timeScale of 0");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Performance Considerations

### Update Frequency

- State updates should be batched for efficiency
- Camera updates can be throttled for performance
- Time updates drive the main simulation loop

### Memory Usage

- State should be kept minimal for efficient serialization
- Camera vectors should use object pooling if updated frequently
- Selection IDs are lightweight string references

## 🔗 Related

- [[CameraManagerState]] - Camera-specific state interface
- [[PhysicsStateReal]] - Physics state for celestial objects
- [[CustomEvents]] - Event system for state changes
- [[@teskooano/core-state]] - State management system
- [[@teskooano/app-simulation]] - Simulation management
