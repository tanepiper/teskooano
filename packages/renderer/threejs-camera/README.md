# `@teskooano/renderer-threejs-camera`

This package provides high-level camera management functionality for the Teskooano Three.js scene, with integrated state management through `@teskooano/core-state`.

## Features

- **`CameraManager`**: High-level camera management class that provides:
  - Object focusing with smooth transitions
  - Camera positioning and targeting
  - Field of View (FOV) management
  - Observable camera state via core-state integration
  - Per-panel camera instance support
  - Integration with the simulation system

## Architecture

This package provides high-level camera management that works with:

- Low-level controls from `@teskooano/renderer-threejs-controls`
- State management from `@teskooano/core-state` for per-panel camera instances
- Direct integration with `ModularSpaceRenderer` from `@teskooano/renderer-threejs`

### Key Improvements

- **No Circular Dependencies**: Uses `ModularSpaceRenderer` directly without interface abstraction
- **Centralized State**: Delegates state management to `@teskooano/core-state` `CameraStore`
- **Per-Panel Support**: Each engine panel can have its own camera state instance
- **Type Safety**: Consistent `CameraState` interface across all packages

## Usage

The `CameraManager` is typically instantiated and managed by higher-level application components.

```typescript
import { CameraManager } from "@teskooano/renderer-threejs-camera";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";

// Create a camera manager
const cameraManager = new CameraManager({
  renderer: rendererInstance, // ModularSpaceRenderer instance
  panelId: "panel-123", // Required for per-panel state management
  initialFov: 75,
  onFocusChangeCallback: (objectId) => {
    console.log(`Focused on object: ${objectId}`);
  },
});

// Focus on a celestial object
cameraManager.followObject("earth");

// Get camera state updates (now managed by core-state)
const cameraState$ = cameraManager.getCameraState$();
cameraState$.subscribe((state) => {
  console.log(`Camera position: ${state.position}`);
  console.log(`Camera target: ${state.target}`);
  console.log(`Focused object: ${state.focusedObjectId}`);
  console.log(`Selected object: ${state.selectedObject}`);
  console.log(`FOV: ${state.fov}`);
});
```

## Core Components

- **`CameraManager`**: The main class responsible for high-level camera operations and state management.

## Dependencies

- `@teskooano/core-state` - Provides `CameraStore` for state management
- `@teskooano/core-math` - Vector math operations with `OSVector3`
- `@teskooano/data-types` - Interface definitions (`ICameraRenderer`, `CameraManagerOptions`)
- `@teskooano/renderer-threejs-helpers` - Camera utility functions
- `@teskooano/notifications` - Transition progress notifications
- `three` - Three.js types
- `rxjs` - Reactive programming with `Observable`
