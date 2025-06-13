# @teskooano/renderer-threejs

This package is the **integrator** for the modular Three.js rendering system used in the Teskooano engine. It brings together components from various sub-packages to provide a complete rendering solution.

## Architecture

This package's main role is orchestration. It assembles various manager components into a cohesive whole. The `ModularSpaceRenderer` class acts as the primary public facade, while the `RenderPipeline` handles the per-frame update sequence.

See `ARCHITECTURE.md` for a detailed diagram and explanation.

- **`ModularSpaceRenderer`**: The main entry point. It initializes all the necessary manager classes and provides a high-level API for controlling the renderer.
- **`RenderPipeline`**: Orchestrates the update calls for all managers in the correct order on each frame.
- **`RendererStateAdapter`**: A crucial bridge that subscribes to the application's core state and transforms it into a data format that the rendering components can consume.

## Usage

### Initialization

```typescript
import {
  ModularSpaceRenderer,
  type ModularSpaceRendererOptions,
} from "@teskooano/renderer-threejs";

// Get the container element
const container = document.getElementById("renderer-container");
if (!container) throw new Error("Renderer container not found");

// Define options for the renderer and its sub-modules
const rendererOptions: ModularSpaceRendererOptions = {
  antialias: true,
  shadows: false,
  hdr: false,
  background: "black",
  showGrid: true,
  showCelestialLabels: true,
};

// Initialize the main renderer facade
// This will internally instantiate and wire up all the necessary managers
const spaceRenderer = new ModularSpaceRenderer(container, rendererOptions);

// Start the render loop
spaceRenderer.startRenderLoop();

// Ensure disposal on cleanup
window.addEventListener("beforeunload", () => {
  spaceRenderer.dispose();
});
```

### Interacting with the Renderer

Interactions are generally done through methods on the `ModularSpaceRenderer` facade, which delegate to the appropriate underlying manager.

```typescript
// Toggle the grid helper (delegates to SceneManager)
spaceRenderer.toggleGrid();

// Toggle orbit visibility (delegates to OrbitsManager)
spaceRenderer.toggleOrbits();

// Set camera follow target (a high-level action that uses CameraManager and ControlsManager)
const objectIdToFollow = "earth"; // Example ID
// NOTE: The setFollowTarget method is deprecated and removed.
// The correct way to do this is via a higher-level CameraManager,
// which is outside the scope of this package.

// Stop following
// spaceRenderer.setFollowTarget(null);

// Access underlying managers/objects (use with caution)
const scene = spaceRenderer.scene;
const camera = spaceRenderer.camera;
const controls = spaceRenderer.controls;
```

## API Reference

### `ModularSpaceRenderer`

Acts as the main facade and integrator.

#### Constructor

```typescript
import type { ModularSpaceRendererOptions } from "@teskooano/renderer-threejs";

constructor(container: HTMLElement, options?: ModularSpaceRendererOptions)
```

#### Key Methods

- `startRenderLoop()`: Starts the animation loop.
- `stopRenderLoop()`: Stops the animation loop.
- `dispose()`: Disposes all managed components from sub-modules.
- `setGridVisible(visible: boolean)` / `toggleGrid()`: Controls grid visibility.
- `setOrbitsVisible(visible: boolean)` / `toggleOrbits()`: Controls orbit visibility.
- `setCelestialLabelsVisible(visible: boolean)`: Controls label visibility.
- `setFollowTargetObject(object: THREE.Object3D | null, offset?: THREE.Vector3)`: Low-level method to follow a 3D object.

#### Key Properties (Accessing Sub-Managers)

- `sceneManager: SceneManager`
- `animationLoop: AnimationLoop`
- `objectManager: ObjectManager`
- `orbitManager: OrbitsManager`
- `backgroundManager: BackgroundManager`
- `controlsManager: ControlsManager`
- `lightManager: LightManager`
- `lodManager: LODManager`
- `renderPipeline: RenderPipeline`
- `css2DManager?: CSS2DManager`

(Direct access to sub-managers allows calling their specific methods if needed, but prefer using facade methods on `ModularSpaceRenderer` when available).

## Development

- **Build**: `npm run build` (or as defined in `moon.yml`)
- **Test**: `npm run test` or `npm run test:browser`

Remember to install dependencies: `npm install` (likely managed by the monorepo root)
