# `@teskooano/renderer-threejs-controls`

This package provides managers for handling user interaction and camera control within the Teskooano Three.js scene.

## Features

- **`ControlsManager`**: Manages all camera controls.
  - Integrates `THREE.OrbitControls` for standard user navigation (zoom, pan, rotate).
  - Uses GSAP for smooth, animated camera transitions when programmatically changing views.
  - Supports following a moving `THREE.Object3D`.
  - Dispatches events on user interaction and transition completion.

## Architecture

This package provides a distinct, low-level manager class that is instantiated and controlled by the main `@teskooano/renderer-threejs` package. For a detailed explanation of the design, see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.

## Usage

The `ControlsManager` is typically instantiated and managed by a higher-level renderer class.

```typescript
import * as THREE from "three";
import { ControlsManager } from "@teskooano/renderer-threejs-controls";

// --- Initialization ---
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const rendererElement = document.getElementById("renderer-container"); // Your renderer's container

const controlsManager = new ControlsManager(camera, rendererElement);

// --- In the Render Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Must be called every frame
  controlsManager.update();

  // Main WebGL render call would happen here...
  // renderer.render(scene, camera);
}

// --- Interacting with the Manager ---

// Programmatically move the camera
controlsManager.transitionTo(
  new THREE.Vector3(100, 50, 100),
  new THREE.Vector3(0, 0, 0),
);

// --- Cleanup ---
controlsManager.dispose();
```

## Core Components

- **`ControlsManager`:** The main class responsible for managing `OrbitControls`, handling transitions, following logic, and state updates.

## Dependencies

- `three`
- `gsap`
