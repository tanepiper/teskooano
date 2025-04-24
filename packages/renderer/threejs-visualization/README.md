# `@teskooano/renderer-threejs-visualization`

This package orchestrates the visualization of the Teskooano simulation within a Three.js scene. It provides managers for rendering celestial objects, their orbital paths, and the background environment based on data from the core state management.

## Purpose

- **Object Rendering:** The `ObjectManager` manages `THREE.Object3D` instances for celestial bodies, utilizing specialized renderers (from `@teskooano/systems-celestial`), LOD management (from `@teskooano/renderer-threejs-effects`), and label integration (via `@teskooano/renderer-threejs-interaction`).
- **Orbit Visualization:** The `OrbitManager` renders orbital paths, dynamically switching between static Keplerian ellipses and dynamic Verlet trails/predictions based on the active physics engine.
- **Background Rendering:** The `BackgroundManager` creates and animates a multi-layered starfield background with parallax effects.
- **State Synchronization:** These managers listen to state changes in `@teskooano/core-state` (e.g., `renderableObjectsStore`, `simulationState`) to drive visual updates.

## Core Components

- **`ObjectManager` (`ObjectManager.ts`):** Handles the lifecycle (add, update, remove) of celestial object meshes, integrating LOD, specialized rendering logic, labels, and lighting.
- **`OrbitManager` (`OrbitManager.ts`):** Manages the display of orbital lines, switching between Keplerian and Verlet modes.
- **`BackgroundManager` (`BackgroundManager.ts`):** Responsible for rendering and animating the starfield background.
- **`index.ts`:** Exports the core manager classes and related types/enums.

## Usage

Typically, instances of `ObjectManager`, `OrbitManager`, and `BackgroundManager` are created by the main application or a higher-level renderer. Their respective `update()` methods must be called within the main animation loop.

```typescript
import * as THREE from "three";
import {
  ObjectManager,
  OrbitManager,
  BackgroundManager,
} from "@teskooano/renderer-threejs-visualization";
import { simulationState, renderableObjectsStore } from "@teskooano/core-state"; // Example state imports
import { RendererStateAdapter } from "@teskooano/renderer-threejs"; // Example adapter
import { LightManager } from "@teskooano/renderer-threejs-effects";
import { CSS2DManager } from "@teskooano/renderer-threejs-interaction";

// Assuming scene, camera, renderer, container, stateAdapter, lightManager, css2dManager exist
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(/*...*/);
const renderer = new THREE.WebGLRenderer(/*...*/);
const container = document.getElementById("renderer-container");
const stateAdapter = new RendererStateAdapter(simulationState); // Example instantiation
const lightManager = new LightManager(scene);
const css2dManager = new CSS2DManager(scene, container); // Assuming container exists

// Instantiate the managers
const objectManager = new ObjectManager(
  scene,
  camera,
  lightManager,
  stateAdapter,
  renderableObjectsStore,
  css2dManager,
);
const orbitManager = new OrbitManager(
  scene,
  camera, // Often needed for LOD or culling orbits
  stateAdapter,
  renderableObjectsStore,
);
const backgroundManager = new BackgroundManager(scene, camera); // Might need camera for parallax

// In your animation loop:
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // Assuming a THREE.Clock instance

  // Update managers
  objectManager.update(delta);
  orbitManager.update(delta);
  backgroundManager.update(delta);

  // ... other logic ...

  // Main render pass (handled elsewhere)
  // renderer.render(scene, camera);
}

animate();

// Example: Toggling orbit visibility via OrbitManager
// orbitManager.toggleOrbitVisibility();

// Example: Highlighting an object's orbit via OrbitManager
// orbitManager.highlightOrbit('Sol'); // Highlight Sun's orbit/trail
// orbitManager.highlightOrbit(null); // Clear highlight

// Example: Setting debug mode on ObjectManager
// objectManager.setDebugMode(true);
```

### Key Manager Methods (Examples):

**`ObjectManager`:**

- `update(delta)`: Updates object meshes, LOD, labels.
- `setDebugMode(enabled)`: Enables fallback sphere rendering.
- `dispose()`: Cleans up object resources.

**`OrbitManager`:**

- `update(delta)`: Updates orbit lines based on state and physics mode.
- `highlightOrbit(objectId | null)`: Highlights a specific orbit/trail.
- `toggleOrbitVisibility()`: Toggles visibility of all orbits.
- `setOrbitVisibility(visible)`: Sets visibility of all orbits.
- `setVisualizationMode(mode)`: Switches between Keplerian/Verlet.
- `dispose()`: Cleans up orbit resources.

**`BackgroundManager`:**

- `update(delta)`: Animates the starfield.
- `dispose()`: Cleans up background resources.

## Dependencies

- `three`
- `@teskooano/core-state`
- `@teskooano/data-types`
- `@teskooano/renderer-threejs`
- `@teskooano/renderer-threejs-core`
- `@teskooano/renderer-threejs-effects`
- `@teskooano/renderer-threejs-interaction`
- `@teskooano/systems-celestial`

## Setup

Ensure the necessary dependencies are installed.

```bash
# From the monorepo root
npm install
```
