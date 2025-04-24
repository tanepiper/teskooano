# @teskooano/renderer-threejs-core

This package provides the foundational components for the Teskooano engine's Three.js rendering pipeline. It manages the core scene setup, animation loop, and connection to the application state, serving as a base for other renderer modules.

## Architecture

See `ARCHITECTURE.md` for a detailed breakdown.

The main components are:

- **`SceneManager`**: Manages the `THREE.Scene`, `THREE.PerspectiveCamera`, and `THREE.WebGLRenderer`. Handles setup, resizing, background, camera updates, and basic debug helpers (grid, origin sphere).
- **`AnimationLoop`**: Manages the `requestAnimationFrame` loop using `THREE.Clock`. Executes registered animation and render callbacks each frame and calculates basic performance stats.
- **`StateManager`**: Bridges the renderer with `@teskooano/core-state`. Subscribes to `simulationState` (for camera) and `celestialObjectsStore` (for object changes) and notifies registered subscribers within the rendering system.
- **`events.ts`**: Exports `rendererEvents`, a shared `EventEmitter3` instance for internal communication.
- **`index.ts`**: Exports the main classes and types.

## Usage

This package is typically used as a dependency by higher-level renderer integration packages (like `@teskooano/renderer-threejs`). It provides the building blocks but is not usually instantiated directly by the application.

Example (Conceptual - how it might be used internally by another package):

```typescript
import {
  SceneManager,
  AnimationLoop,
  StateManager,
  rendererEvents,
} from "@teskooano/renderer-threejs-core";
import { simulationState, celestialObjectsStore } from "@teskooano/core-state";

const container = document.getElementById("render-container");
if (!container) throw new Error("Container not found");

// 1. Initialize State Manager
const stateManager = new StateManager(simulationState, celestialObjectsStore);

// 2. Initialize Scene Manager
const sceneManager = new SceneManager(container, stateManager, {
  antialias: true,
  background: "black",
  showGrid: true,
});

// 3. Initialize Animation Loop
const animationLoop = new AnimationLoop(stateManager);
animationLoop.setRenderer(sceneManager.renderer); // Connect renderer

// 4. Register update callbacks (e.g., from visualization/interaction packages)
animationLoop.addAnimateCallback((deltaTime, lights) => {
  // Update object positions, controls, etc.
});
animationLoop.addRenderCallback(() => {
  sceneManager.render(); // Render the main scene
  // Render UI overlays, etc.
});

// 5. Start the loop
animationLoop.start();

// 6. Handle cleanup
// window.addEventListener('beforeunload', () => {
//   animationLoop.stop();
//   sceneManager.dispose();
//   stateManager.dispose();
// });
```

## API Reference (Key Classes)

### `SceneManager`

- `constructor(container, stateManager, options)`
- `onResize()`
- `updateCamera(position, target)`
- `render()`
- `toggleGrid()`, `toggleDebugSphere()`
- `dispose()`
- Properties: `scene`, `camera`, `renderer`

### `AnimationLoop`

- `constructor(stateManager)`
- `setRenderer(renderer)`
- `start()`, `stop()`
- `addAnimateCallback(callback)`, `removeAnimateCallback(callback)`
- `addRenderCallback(callback)`, `removeRenderCallback(callback)`

### `StateManager`

- `constructor(simulationStateAtom, celestialObjectsAtom)`
- `onObjectsChange(callback)`, `offObjectsChange(callback)`
- `onCameraChange(callback)`, `offCameraChange(callback)`
- `dispose()`

## Development

- **Build**: `npm run build`
- **Test**: `npm run test`

Install dependencies: `npm install`
