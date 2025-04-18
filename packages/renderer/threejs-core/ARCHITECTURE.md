## Three.js Core Renderer Analysis (`threejs-core`)

This package provides foundational components for the Three.js rendering pipeline within the Open Space engine.

**Core Components:**

1.  **`CoreRenderer` (`index.ts`)**: A facade class that aggregates core rendering components.

    - Instantiates `SceneManager`, `AnimationLoop`, and `StateManager`.
    - Provides convenient accessors (`scene`, `camera`, `renderer`).
    - Exposes `start()` and `stop()` methods to control the `AnimationLoop`.
    - Provides a `render()` method (delegating to `SceneManager`).
    - Handles disposal of its managed components.

2.  **`SceneManager.ts` (`SceneManager`)**: Manages the fundamental Three.js scene setup.

    - Creates and holds `THREE.Scene`, `THREE.PerspectiveCamera`, and `THREE.WebGLRenderer` instances.
    - Configures renderer settings (size, pixel ratio, shadows, HDR/tone mapping) based on options.
    - Handles scene background (color or texture).
    - Sets up initial camera position/target based on `simulationState` from `@teskooano/core-state`.
    - Provides methods for resizing (`onResize`), updating the camera (`updateCamera`), and rendering the scene (`render`).
    - Includes optional debug helpers (grid, origin sphere) with toggles (`toggleGrid`, `toggleDebugSphere`, `setGridVisible`).
    - `dispose()`: Cleans up the renderer and removes scene children.

3.  **`AnimationLoop.ts` (`AnimationLoop`)**: Manages the main `requestAnimationFrame` loop.

    - Uses `THREE.Clock` to track time and delta.
    - Provides `start()` and `stop()` methods.
    - Manages arrays of callbacks for animation (`onAnimateCallbacks`) and rendering (`onRenderCallbacks`).
    - `tick()`: The core loop function called by `requestAnimationFrame`.
      - Calculates delta time.
      - Retrieves light source positions (currently hardcoded to look for `CelestialType.STAR` objects in `celestialObjectsStore` and use their `physicsStateReal.position_m` via `physicsToThreeJSPosition` utility).
      - Executes all registered `onAnimate` callbacks.
      - Executes all registered `onRender` callbacks.
      - Periodically calculates and updates renderer stats (FPS, draw calls, triangles, memory) in the `simulationState`.
    - Requires the `THREE.WebGLRenderer` instance to be set via `setRenderer()` (typically called by `CoreRenderer`).

4.  **`StateManager.ts` (`StateManager`)**: Acts as a bridge between the core state management (`@teskooano/core-state`) and the renderer.

    - Subscribes to `simulationState` (for camera changes) and `celestialObjectsStore` (for object add/update/remove).
    - Uses `Set`s to manage subscribers for object state changes (`objectSubscribers`) and camera state changes (`cameraSubscribers`).
    - Provides `onObjectsChange` and `onCameraChange` methods for other parts of the renderer (like `ObjectManager` in `threejs-visualization`) to register callbacks.
    - The celestial object subscription detects changes by comparing previous/new object states, specifically looking at `physicsStateReal` for position/velocity updates.
    - Notifies registered callbacks when relevant state changes occur.
    - `dispose()`: Unsubscribes from stores and clears subscriber sets.

5.  **`events.ts` (`rendererEvents`)**: Implements a simple `EventEmitter` class.
    - Exports a singleton instance `rendererEvents`.
    - Provides basic `on(event, callback)` and `emit(event, ...args)` methods for internal event communication within the renderer system.

**Key Characteristics & Design:**

- **Core Abstraction**: Provides fundamental classes (`SceneManager`, `AnimationLoop`, `StateManager`) for managing a Three.js scene, distinct from the specific logic of rendering individual celestial objects.
- **Facade Pattern**: `CoreRenderer` acts as a simplified entry point to the core components.
- **Callback-Based Loop**: `AnimationLoop` uses callbacks (`onAnimate`, `onRender`) for extensibility, allowing other systems to hook into the update cycle.
- **State Bridging**: `StateManager` decouples the rendering system from direct state store manipulation by providing specific subscription mechanisms for relevant state changes (camera, objects).
- **Dependency on Core State**: Explicitly depends on `@teskooano/core-state` for camera position and object data/updates.
- **Basic Stats**: `AnimationLoop` includes logic for calculating and updating basic rendering performance statistics in the global state.
- **Debug Helpers**: `SceneManager` includes optional grid and sphere helpers.
- **Internal Events**: Provides a simple `EventEmitter` for potential internal communication.
