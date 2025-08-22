# `@teskooano/renderer-threejs-camera`

This package provides high-level camera management functionality for the Teskooano Three.js scene.

## Features

- **`CameraManager`**: High-level camera management class that provides:
  - Object focusing with smooth transitions
  - Camera positioning and targeting
  - Field of View (FOV) management
  - Observable camera state
  - Integration with the simulation system

## Architecture

This package provides high-level camera management that works with the low-level controls provided by `@teskooano/renderer-threejs-controls`. The `CameraManager` class orchestrates camera operations and integrates with the simulation system.

## Usage

The `CameraManager` is typically instantiated and managed by higher-level application components.

```typescript
import { CameraManager } from "@teskooano/renderer-threejs-camera";
import type { ICameraRenderer } from "@teskooano/data-types";

// Create a camera manager
const cameraManager = new CameraManager();

// Set up dependencies with a renderer
cameraManager.setDependencies({
  renderer: rendererInstance, // Must implement ICameraRenderer
  initialFov: 75,
  onFocusChangeCallback: (objectId) => {
    console.log(`Focused on object: ${objectId}`);
  },
});

// Focus on a celestial object
cameraManager.followObject("earth");

// Get camera state updates
const cameraState$ = cameraManager.getCameraState$();
cameraState$.subscribe((state) => {
  console.log(`Camera position: ${state.currentPosition}`);
  console.log(`Focused object: ${state.focusedObjectId}`);
});
```

## Core Components

- **`CameraManager`**: The main class responsible for high-level camera operations and state management.

## Dependencies

- `@teskooano/core-state`
- `@teskooano/core-math`
- `@teskooano/data-types`
- `@teskooano/renderer-threejs`
- `@teskooano/renderer-threejs-helpers`
- `@teskooano/notifications`
- `three`
- `rxjs`
