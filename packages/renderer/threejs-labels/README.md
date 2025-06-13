# `@teskooano/renderer-threejs-labels`

This package provides a manager for rendering HTML-based UI elements (labels, markers) that are positioned in 3D space within the Teskooano Three.js scene.

## Features

- **`CSS2DManager`**: Manages HTML elements overlaid on the 3D scene.
  - Uses `THREE.CSS2DRenderer` to position HTML elements relative to 3D objects.
  - Organizes elements into logical, toggleable layers (e.g., `CELESTIAL_LABELS`, `AU_MARKERS`).
  - Ensures HTML overlays do not capture mouse events, allowing seamless interaction with the underlying WebGL canvas.

## Architecture

This package provides a distinct, low-level manager class that is instantiated and controlled by a higher-level renderer. It is responsible for all `CSS2DRenderer` logic.

## Usage

The `CSS2DManager` is typically instantiated and managed by a higher-level renderer class.

```typescript
import * as THREE from "three";
import {
  CSS2DManager,
  CSS2DLayerType,
} from "@teskooano/renderer-threejs-labels";

// --- Initialization ---
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const scene = new THREE.Scene();
const rendererElement = document.getElementById("renderer-container");

const css2dManager = new CSS2DManager(scene, rendererElement);

// --- In the Render Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Main WebGL render call would happen here...
  // renderer.render(scene, camera);

  // CSS2D render must happen *after* the main render
  css2dManager.render(camera);
}

// --- Interacting with the Manager ---

// Create an HTML label for a 3D object
const my3dObject = new THREE.Mesh();
scene.add(my3dObject);
css2dManager.createCelestialLabel(
  { id: "my-object", name: "My Object" },
  my3dObject,
);

// Toggle visibility of all celestial labels
css2dManager.toggleLayerVisibility(CSS2DLayerType.CELESTIAL_LABELS);

// --- Cleanup ---
css2dManager.dispose();
```

## Core Components

- **`CSS2DManager`:** Manages the `CSS2DRenderer`, creates and positions HTML elements (like labels and markers) in layers, and handles visibility.

## Dependencies

- `three`
