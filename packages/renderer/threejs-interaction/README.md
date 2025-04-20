# `@teskooano/renderer-threejs-interaction`

This package provides interaction management specifically for the Three.js renderer within the Teskooano simulation environment. It bridges the gap between user input, camera control, and the simulation state.

## Purpose

- **Camera Control:** Wraps and configures `THREE.OrbitControls` for navigating the 3D space.
- **Smooth Transitions:** Implements smooth camera animations (using GSAP) when focusing on specific objects or changing views.
- **Object Following:** Allows the camera to lock onto and follow moving celestial objects while still permitting user-controlled orbital adjustments (zoom/pan/rotate).
- **State Synchronization:** Listens to control changes and updates the global `simulationState` (from `@teskooano/core-state`) with the current camera position and target.
- **Event Handling:** Listens for external events (like `engine-focus-request`) and dispatches events (like `camera-transition-complete`).

## Core Component

- **`ControlsManager`:** The main class responsible for managing `OrbitControls`, handling transitions, following logic, and state updates.

## Usage

Typically, an instance of `ControlsManager` is created by the main renderer (`ModularSpaceRenderer` in `@teskooano/renderer-threejs`) and its `update()` method is called within the renderer's animation loop.

```typescript
import * as THREE from 'three';
import { ControlsManager } from '@teskooano/renderer-threejs-interaction';

// Assuming you have a camera and renderer DOM element
const camera = new THREE.PerspectiveCamera(...);
const rendererElement = document.getElementById('renderer-canvas');

if (rendererElement) {
  const controlsManager = new ControlsManager(camera, rendererElement);

  // In your animation loop:
  function animate() {
    requestAnimationFrame(animate);

    // Update controls every frame
    controlsManager.update();

    // ... other rendering logic ...
  }

  animate();
}
```

### Key Methods:

- `controlsManager.moveTo(position, target, withTransition)`: Move the camera to a specific position and target.
- `controlsManager.updateTarget(target, withTransition)`: Change only the camera's look-at target.
- `controlsManager.setFollowTarget(object, offset, keepCurrentDistance)`: Start following a `THREE.Object3D`.
- `controlsManager.cancelTransition()`: Stop any active camera animation.
- `controlsManager.update()`: **Must be called every frame** in the render loop.
- `controlsManager.dispose()`: Clean up resources and event listeners.

## Dependencies

- `three`
- `gsap`
- `@teskooano/core-state`
- `@teskooano/core-math`
