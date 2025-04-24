# `@teskooano/renderer-threejs-interaction`

This package provides interaction management specifically for the Three.js renderer within the Teskooano simulation environment. It handles user input for camera control, smooth camera transitions, and rendering of HTML-based UI elements within the 3D scene.

## Purpose

- **Camera Control:** Wraps and configures `THREE.OrbitControls` for navigating the 3D space (`ControlsManager`).
- **Smooth Transitions:** Implements smooth camera animations (using GSAP) when focusing on specific objects or changing views (`ControlsManager`).
- **Object Following:** Allows the camera to lock onto and follow moving celestial objects while still permitting user-controlled orbital adjustments (`ControlsManager`).
- **State Synchronization:** Listens to control changes and updates the global `simulationState` (from `@teskooano/core-state`) with the current camera position and target (`ControlsManager`).
- **HTML Overlays:** Manages HTML elements (like labels, markers) positioned relative to 3D objects using `THREE.CSS2DRenderer` (`CSS2DManager`).
- **Layered UI:** Organizes HTML elements into logical layers with visibility controls (`CSS2DManager`).
- **Event Handling:** Listens for external events (like `engine-focus-request`) and dispatches events (like `camera-transition-complete`) (`ControlsManager`).

## Core Components

- **`ControlsManager`:** The main class responsible for managing `OrbitControls`, handling transitions, following logic, and state updates.
- **`CSS2DManager`:** Manages the `CSS2DRenderer`, creates and positions HTML elements (like labels and markers) in layers, and handles visibility.

## Usage

Typically, instances of `ControlsManager` and `CSS2DManager` are created by the main renderer (e.g., `@teskooano/renderer-threejs`). Their `update()` and `render()` methods, respectively, must be called within the renderer's animation loop.

```typescript
import * as THREE from "three";
import {
  ControlsManager,
  CSS2DManager,
  CSS2DLayerType,
} from "@teskooano/renderer-threejs-interaction";
import { simulationState } from "@teskooano/core-state"; // Example state import
import { getCelestialObject } from "./your-scene-logic"; // Example scene logic import

// Assuming you have camera, scene, renderer DOM element, and container
const camera = new THREE.PerspectiveCamera(/*...*/);
const scene = new THREE.Scene();
const rendererElement = document.getElementById("renderer-canvas");
const container = document.getElementById("renderer-container");

if (rendererElement && container) {
  const controlsManager = new ControlsManager(camera, rendererElement);
  const css2dManager = new CSS2DManager(scene, container);

  // Example: Creating a label for a celestial object
  const sunObject = getCelestialObject("Sol"); // Your function to get the object
  if (sunObject && sunObject.mesh) {
    css2dManager.createCelestialLabel(sunObject, sunObject.mesh);
  }

  // In your animation loop:
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Assuming a THREE.Clock instance

    // Update controls every frame
    controlsManager.update(delta);

    // ... other rendering logic (WebGL render) ...

    // Render CSS2D elements AFTER the main render
    css2dManager.render(camera);
  }

  animate();

  // Example: Toggling label visibility
  // css2dManager.setLayerVisibility(CSS2DLayerType.CELESTIAL_LABELS, false);

  // Example: Programmatic camera move
  // const targetPosition = new THREE.Vector3(10, 0, 0);
  // controlsManager.moveToPosition(targetPosition, new THREE.Vector3(0,0,0));
}
```

### Key `ControlsManager` Methods:

- `controlsManager.moveToPosition(position, target, withTransition)`: Move the camera to a specific position and target.
- `controlsManager.pointCameraAtTarget(target, withTransition)`: Change only the camera's look-at target.
- `controlsManager.setFollowTarget(object, offset, keepCurrentDistance)`: Start following a `THREE.Object3D`.
- `controlsManager.cancelTransition()`: Stop any active camera animation.
- `controlsManager.update(delta)`: **Must be called every frame** in the render loop.
- `controlsManager.dispose()`: Clean up resources and event listeners.

### Key `CSS2DManager` Methods:

- `css2dManager.createCelestialLabel(object, parentMesh)`: Create a label for a celestial object.
- `css2dManager.createAuMarkerLabel(id, auValue, position)`: Create a label for an AU distance marker.
- `css2dManager.removeElement(layerType, id)`: Remove a specific label/element.
- `css2dManager.clearLayer(layerType)`: Remove all elements from a specific layer.
- `css2dManager.setLayerVisibility(layerType, visible)`: Show/hide all elements in a layer.
- `css2dManager.toggleLayerVisibility(layerType)`: Toggle visibility of a layer.
- `css2dManager.showLabel(layerType, id)` / `hideLabel(layerType, id)`: Show/hide an individual label.
- `css2dManager.render(camera)`: **Must be called every frame** after the main WebGL render.
- `css2dManager.onResize(width, height)`: Update renderer size on container resize.
- `css2dManager.dispose()`: Clean up resources and remove DOM elements.

## Dependencies

- `three`
- `gsap`
- `@teskooano/core-state`
- `@teskooano/core-math`
- `@teskooano/data-types`
- `@teskooano/renderer-threejs` (for `RenderableCelestialObject` type, implicitly via usage)

## Setup

Ensure the necessary dependencies are installed.

```bash
# From the monorepo root
npm install
```
