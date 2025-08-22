# `@teskooano/renderer-threejs-controls`

This package provides low-level camera controls and interaction management for the Teskooano Three.js scene.

## Features

- **`ControlsManager`**: Low-level camera controls manager that provides:
  - Integration with `THREE.OrbitControls` for standard user navigation (zoom, pan, rotate).
  - GSAP-based animated camera transitions for programmatic view changes.
  - Object following capabilities for tracking moving `THREE.Object3D` instances.
  - Event dispatching for user interaction and transition completion.
  - Composable architecture with specialized handlers for different control aspects.

## Architecture

This package provides low-level camera controls that are used by higher-level camera management systems. It focuses specifically on the mechanics of camera control rather than high-level camera operations. For a detailed explanation of the design, see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.

## Relationship with Camera Management

This package works in conjunction with `@teskooano/renderer-threejs-camera`, which provides high-level camera management functionality. The `ControlsManager` handles the low-level mechanics of camera control, while `CameraManager` orchestrates high-level camera operations and integrates with the simulation system.

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

- **`ControlsManager`:** The main class responsible for orchestrating low-level camera controls.
- **`OrbitControlsHandler`:** Manages the lifecycle and events of `THREE.OrbitControls`.
- **`CameraTransitionManager`:** Handles smooth, animated camera transitions using GSAP.
- **`ObjectFollower`:** Manages camera following logic for tracking moving objects.

## Dependencies

- `three`
- `gsap`
