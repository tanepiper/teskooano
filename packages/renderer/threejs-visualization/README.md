# `@teskooano/renderer-threejs-visualization`

This package orchestrates the visualization of the Teskooano simulation within a Three.js scene. It manages the rendering lifecycle of celestial objects, their orbital paths, and the background environment based on data from the core state management.

## Purpose

- **Scene Orchestration:** Acts as the central hub for creating and updating visual elements in the Three.js scene.
- **Object Rendering:** Manages `THREE.Object3D` instances for celestial bodies, utilizing specialized renderers (from `@teskooano/systems-celestial`), LOD management (from `@teskooano/renderer-threejs-effects`), and label integration (via `@teskooano/renderer-threejs-interaction`).
- **Orbit Visualization:** Renders orbital paths, dynamically switching between static Keplerian ellipses and dynamic Verlet trails/predictions based on the active physics engine.
- **Background Rendering:** Creates and animates a multi-layered starfield background with parallax effects.
- **State Synchronization:** Listens to state changes in `@teskooano/core-state` (e.g., `renderableObjectsStore`, `simulationState`) to drive visual updates.

## Core Components

- **`VisualizationRenderer` (`index.ts`):** The main entry point and facade. It initializes and coordinates the other managers.
- **`ObjectManager`:** Handles the lifecycle (add, update, remove) of celestial object meshes, integrating LOD, specialized rendering logic, labels, and lighting.
- **`OrbitManager`:** Manages the display of orbital lines, switching between Keplerian and Verlet modes.
- **`BackgroundManager`:** Responsible for rendering and animating the starfield background.

## Usage

Typically, an instance of `VisualizationRenderer` is created by the main application or a higher-level renderer. Its `update()` method must be called within the main animation loop.

```typescript
import * as THREE from "three";
import { VisualizationRenderer } from "@teskooano/renderer-threejs-visualization";
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

const visualizationRenderer = new VisualizationRenderer(
  scene,
  camera,
  renderer, // Pass the main renderer
  lightManager,
  stateAdapter,
  renderableObjectsStore,
  css2dManager,
);

// In your animation loop:
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // Assuming a THREE.Clock instance

  // Update visualization (handles objects, orbits, background)
  visualizationRenderer.update(delta);

  // ... other logic ...

  // Main render pass (handled elsewhere, but visualizationRenderer.update needs renderer access)
  // renderer.render(scene, camera);
}

animate();

// Example: Toggling orbit visibility
// visualizationRenderer.toggleOrbitVisibility();

// Example: Highlighting an object's orbit
// visualizationRenderer.highlightOrbit('Sol'); // Highlight Sun's orbit/trail
// visualizationRenderer.highlightOrbit(null); // Clear highlight
```

### Key `VisualizationRenderer` Methods:

- `update(delta)`: **Must be called every frame.** Updates all managed components (objects, orbits, background).
- `highlightOrbit(objectId | null)`: Highlights the orbit/trail of the specified object.
- `toggleOrbitVisibility()`: Toggles the visibility of all orbit lines.
- `setOrbitVisibility(visible)`: Sets the visibility of all orbit lines.
- `setDebugMode(enabled)`: Enables/disables debug rendering modes (e.g., fallback spheres for objects).
- `dispose()`: Cleans up all managed resources.

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
