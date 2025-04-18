# @teskooano/app-simulation

## Overview

The app-simulation package is the main simulation orchestrator for the Open Space game. It coordinates between the state management, rendering, and game loop systems.

## Features

- Game loop management
- State synchronization
- Event handling (keyboard, window resize)
- Celestial object management
- Time scale control

## API

### Simulation

```typescript
class Simulation {
  constructor(container: HTMLElement);
  addObject(object: CelestialObject): void;
  removeObject(objectId: string): void;
  stop(): void;
}
```

### Event Handling

- Space: Toggle pause
- Plus (+): Increase time scale
- Minus (-): Decrease time scale
- Window resize: Update renderer viewport

## Testing

The package includes comprehensive tests in `index.spec.ts` that verify:

- Simulation initialization
- Object management
- Event handling
- Game loop control
- Error handling

## Usage

```typescript
import { Simulation } from "@teskooano/app-simulation";
import type { CelestialObject } from "@teskooano/data-types";

// Create simulation
const container = document.getElementById("game-container");
const simulation = new Simulation(container);

// Add celestial object
const planet: CelestialObject = {
  id: "earth",
  name: "Earth",
  type: CelestialType.PLANET,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
  mass: 5.972e24,
  radius: 6371,
};
simulation.addObject(planet);

// Stop simulation
simulation.stop();
```
