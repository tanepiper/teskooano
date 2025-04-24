# @teskooano/renderer-threejs

This package is the **integrator** for the modular Three.js rendering system used in the Teskooano engine. It brings together components from the `core`, `visualization`, `interaction`, and `effects` packages to provide a complete rendering solution.

## Architecture

This package's main role is orchestration. See `ARCHITECTURE.md` for a detailed diagram and explanation.

- It uses `@teskooano/renderer-threejs-core` for scene setup, animation loop, and state management connection.
- It uses `@teskooano/renderer-threejs-visualization` for managing the display of objects, orbits, and backgrounds.
- It uses `@teskooano/renderer-threejs-interaction` for user controls and UI elements like labels.
- It uses `@teskooano/renderer-threejs-effects` for lighting and level-of-detail management.

The primary class exported is `ModularSpaceRenderer`, which acts as a facade to initialize and coordinate these underlying modules.

## Usage

### Initialization

```typescript
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";

// Get the container element
const container = document.getElementById("renderer-container");
if (!container) throw new Error("Renderer container not found");

// Define options for the renderer and its sub-modules
const rendererOptions = {
  antialias: true,
  shadows: false, // Example: Shadows might be configured here or in effects
  hdr: false, // Example: HDR might be configured here or in effects
  background: "black", // Handled by core/visualization
  showGrid: true, // Handled by core
  showCelestialLabels: true, // Handled by interaction/visualization
  // Add other options passed to sub-modules as needed
};

// Initialize the main renderer facade
// This will internally instantiate and wire up all the necessary managers
const spaceRenderer = new ModularSpaceRenderer(container, rendererOptions);

// Start the render loop (managed by the core module)
spaceRenderer.startRenderLoop();

// Ensure disposal on cleanup
// window.addEventListener('beforeunload', () => {
//   spaceRenderer.dispose(); // Calls dispose on all managed components
// });
```

### Interacting with the Renderer

Interactions are generally done through methods on the `ModularSpaceRenderer` facade, which delegate to the appropriate underlying manager.

```typescript
// Toggle the grid helper (delegates to SceneManager in core)
spaceRenderer.setGridVisible(!spaceRenderer.sceneManager.isGridVisible());
// Or use a dedicated toggle if available:
// spaceRenderer.toggleGrid(); // Assuming this method exists and calls sceneManager.toggleGrid()

// Toggle orbit visibility (delegates to OrbitManager in visualization)
spaceRenderer.setOrbitsVisible(!spaceRenderer.orbitManager.areOrbitsVisible()); // Example method name
// Or use a dedicated toggle if available:
// spaceRenderer.toggleOrbits();

// Toggle labels (delegates to ObjectManager/CSS2DManager)
spaceRenderer.setCelestialLabelsVisible(
  !spaceRenderer.objectManager.areLabelsVisible(),
); // Example method name
// Or use a dedicated toggle if available:
// spaceRenderer.toggleLabels();

// Set camera follow target (delegates to ControlsManager/ObjectManager)
const objectIdToFollow = "earth"; // Example ID
spaceRenderer.setFollowTarget(objectIdToFollow);

// Stop following
spaceRenderer.setFollowTarget(null);

// Access underlying managers/objects (use with caution)
// const scene = spaceRenderer.sceneManager.scene;
// const camera = spaceRenderer.sceneManager.camera;
// const controls = spaceRenderer.controlsManager.controls;
```

## API Reference

### `ModularSpaceRenderer`

Acts as the main facade and integrator.

#### Constructor

```typescript
constructor(container: HTMLElement, options?: {
  antialias?: boolean;
  shadows?: boolean;
  hdr?: boolean;
  background?: string | THREE.Color | THREE.Texture;
  showGrid?: boolean;
  showCelestialLabels?: boolean;
  // ... other options passed to sub-modules
})
```

#### Key Methods (Examples - check source for specifics)

- `startRenderLoop()`: Starts the animation loop (via `core`).
- `stopRenderLoop()`: Stops the animation loop (via `core`).
- `dispose()`: Disposes all managed components from sub-modules.
- `setGridVisible(visible: boolean)` / `toggleGrid()`: Controls grid visibility (via `core`).
- `setOrbitsVisible(visible: boolean)` / `toggleOrbits()`: Controls orbit visibility (via `visualization`).
- `setCelestialLabelsVisible(visible: boolean)` / `toggleLabels()`: Controls label visibility (via `interaction`/`visualization`).
- `setFollowTarget(id: string | null)`: Sets the camera follow target (via `interaction`/`visualization`).
- `updateCamera(position, target)`: Manually sets camera position/target (via `core`/`interaction`).

#### Key Properties (Accessing Sub-Managers)

- `sceneManager: SceneManager` (from `core`)
- `animationLoop: AnimationLoop` (from `core`)
- `stateManager: StateManager` (from `core`)
- `objectManager: ObjectManager` (from `visualization`)
- `orbitManager: OrbitManager` (from `visualization`)
- `backgroundManager: BackgroundManager` (from `visualization`)
- `controlsManager: ControlsManager` (from `interaction`)
- `css2DManager?: CSS2DManager` (from `interaction`)
- `lightManager: LightManager` (from `effects`)
- `lodManager: LODManager` (from `effects`)

(Direct access to sub-managers allows calling their specific methods if needed, but prefer using facade methods on `ModularSpaceRenderer` when available).

## Development

- **Build**: `npm run build` (or as defined in `moon.yml`)
- **Test**: `npm run test`

Remember to install dependencies: `npm install` (likely managed by the monorepo root)
