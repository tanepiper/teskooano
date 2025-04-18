# @teskooano/core-state

## Overview

The core-state package manages the game's state using nanostores. It provides a centralized state management system for handling simulation state, celestial objects, and game actions.

## Features

- Simulation state management (time, timeScale, pause state)
- Celestial object state management
- Action creators for state modifications
- Observable state updates

## API

### State

```typescript
interface SimulationState {
  time: number;
  timeScale: number;
  paused: boolean;
  camera: {
    position: Vector3;
    target: Vector3;
  };
}
```

### Actions

```typescript
const actions = {
  togglePause: () => void;
  setTimeScale: (scale: number) => void;
  addCelestialObject: (object: CelestialObject) => void;
  removeCelestialObject: (id: string) => void;
  updateCamera: (position: Vector3, target: Vector3) => void;
}
```

### Stores

```typescript
const simulationState: Store<SimulationState>;
const celestialObjects: Store<CelestialObject[]>;
```

## Testing

The package includes comprehensive tests in `index.spec.ts` that verify:

- State initialization
- Action creators
- State updates
- Store subscriptions
- Error handling

## Usage

```typescript
import {
  simulationState,
  celestialObjects,
  actions,
} from "@teskooano/core-state";

// Subscribe to state changes
simulationState.subscribe((state) => {
  console.log("Simulation time:", state.time);
});

// Update state
actions.setTimeScale(2.0);
actions.togglePause();

// Add celestial object
actions.addCelestialObject({
  id: "earth",
  name: "Earth",
  type: CelestialType.PLANET,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
  mass: 5.972e24,
  radius: 6371,
});
```
