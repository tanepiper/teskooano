# @teskooano/renderer-threejs-core

This package provides the foundational components for the Teskooano engine's Three.js rendering pipeline. It manages the core scene setup and animation loop, serving as a base for other renderer modules.

## Architecture

See `ARCHITECTURE.md` for a detailed breakdown.

The main components are:

- **`SceneManager`**: Manages the `THREE.Scene`, `THREE.PerspectiveCamera`, and `THREE.WebGLRenderer`. Handles setup, resizing, background, and basic debug helpers.
- **`AnimationLoop`**: Manages the `requestAnimationFrame` loop using `THREE.Clock`. Executes registered animation and render callbacks each frame.
- **`events.ts`**: Exports `rendererEvents`, a centralized, type-safe event bus powered by RxJS for internal communication.

## Usage

This package is designed to be used as a dependency by higher-level renderer integration packages (like `@teskooano/renderer-threejs`). It provides the building blocks but is not typically instantiated directly by the end application.

A conceptual example of how `@teskooano/renderer-threejs` uses this package:

```typescript
import { SceneManager, AnimationLoop } from "@teskooano/renderer-threejs-core";

const container = document.getElementById("render-container");
if (!container) throw new Error("Container not found");

// 1. Initialize Scene Manager
const sceneManager = new SceneManager(container, {
  antialias: true,
  background: "black",
  showGrid: true,
});

// 2. Initialize Animation Loop
const animationLoop = new AnimationLoop();
animationLoop.setRenderer(sceneManager.renderer);
animationLoop.setCamera(sceneManager.camera);

// 3. The integrator package then registers its own update logic
//    (e.g., via a RenderPipeline) with the animation loop.
animationLoop.onAnimate((deltaTime, elapsedTime) => {
  // This is where the RenderPipeline's update method would be called.
});

// 4. Start the loop
animationLoop.start();

// 5. Handle cleanup
window.addEventListener("beforeunload", () => {
  animationLoop.stop();
  sceneManager.dispose();
});
```

## API Reference (Key Classes)

### `SceneManager`

- `constructor(container, options)`
- `onResize(width, height)`
- `render()`
- `toggleGrid()`, `setDebugMode(enabled)`
- `dispose()`
- Properties: `scene`, `camera`, `renderer`

### `AnimationLoop`

- `constructor()`
- `setRenderer(renderer)`
- `setCamera(camera)`
- `start()`, `stop()`
- `onAnimate(callback)`, `removeAnimateCallback(callback)`
- `onRender(callback)`, `removeRenderCallback(callback)`
- `dispose()`

## Development

- **Build**: `npm run build`
- **Test**: `npm run test`

Install dependencies: `npm install`
