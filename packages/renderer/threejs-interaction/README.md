# `@teskooano/renderer-threejs-interaction`

This package provides managers for handling user interaction within the Teskooano Three.js scene. It encapsulates camera controls and the rendering of HTML-based UI elements that are positioned in 3D space.

## Features

- **`ControlsManager`**: Manages all camera controls.
  - Integrates `THREE.OrbitControls` for standard user navigation (zoom, pan, rotate).
  - Uses GSAP for smooth, animated camera transitions when programmatically changing views.
  - Supports following a moving `THREE.Object3D`.
  - Dispatches events on user interaction and transition completion.
- **`CSS2DManager`**: Manages HTML elements overlaid on the 3D scene.
  - Uses `THREE.CSS2DRenderer` to position HTML elements (like object labels or markers) relative to 3D objects.
  - Organizes elements into logical, toggleable layers (e.g., `CELESTIAL_LABELS`, `AU_MARKERS`).
  - Ensures HTML overlays do not capture mouse events, allowing seamless interaction with the underlying WebGL canvas.

## Architecture

This package provides two distinct, low-level manager classes that are instantiated and controlled by the main `@teskooano/renderer-threejs` package. For a detailed explanation of the design, see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.

## Usage

The `ControlsManager` and `CSS2DManager` are typically instantiated and managed by a higher-level renderer class.

```typescript
import * as THREE from "three";
import {
  ControlsManager,
  CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";

// --- Initialization ---
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const rendererElement = document.getElementById("renderer-container"); // Your renderer's container

const controlsManager = new ControlsManager(camera, rendererElement);
const css2dManager = new CSS2DManager(rendererElement);

// --- In the Render Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Must be called every frame
  controlsManager.update();

  // Main WebGL render call would happen here...
  // renderer.render(scene, camera);

  // CSS2D render must happen *after* the main render
  css2dManager.render(camera);
}

// --- Interacting with the Managers ---

// Programmatically move the camera
controlsManager.transitionTo(
  new THREE.Vector3(100, 50, 100),
  new THREE.Vector3(0, 0, 0),
);

// Create an HTML label for a 3D object
const my3dObject = new THREE.Mesh();
css2dManager.createCelestialLabel(my3dObject, { name: "My Object" });

// Toggle visibility of all celestial labels
css2dManager.toggleLayerVisibility("CELESTIAL_LABELS");

// --- Cleanup ---
controlsManager.dispose();
css2dManager.dispose();
```

## Core Components

- **`ControlsManager`:** The main class responsible for managing `OrbitControls`, handling transitions, following logic, and state updates.
- **`CSS2DManager`:** Manages the `CSS2DRenderer`, creates and positions HTML elements (like labels and markers) in layers, and handles visibility.

## Dependencies

- `three`
- `
