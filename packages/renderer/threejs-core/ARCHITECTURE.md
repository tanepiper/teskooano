## Three.js Core Renderer Analysis (`threejs-core`)

This package provides foundational components for the Three.js rendering pipeline within the Teskooano engine.

**Core Components:**

1.  **`SceneManager.ts` (`SceneManager`)**: Manages the fundamental Three.js scene setup.

    - Creates and holds `THREE.Scene`, `THREE.PerspectiveCamera`, and `THREE.WebGLRenderer` instances.
    - Configures renderer settings (size, pixel ratio, shadows, HDR/tone mapping) based on options.
    - Handles scene background (color or texture).
    - Sets up initial camera position/target based on `simulationState` from `@teskooano/core-state`.
    - Provides methods for resizing (`onResize`) and rendering the scene (`render`).
    - Includes optional debug helpers (grid, origin sphere) with toggles (`toggleGrid`, `setDebugMode`).
    - `dispose()`: Cleans up the renderer and removes scene children.

2.  **`AnimationLoop.ts` (`AnimationLoop`)**: Manages the main `requestAnimationFrame` loop.

    - Uses `THREE.Clock` to track time and delta.
    - Provides `start()` and `stop()` methods.
    - Manages arrays of callbacks for animation (`onAnimateCallbacks`) and rendering (`onRenderCallbacks`).
    - `tick()`: The core loop function called by `requestAnimationFrame`.
      - Calculates delta time.
      - Executes all registered `onAnimate` and `onRender` callbacks.
      - Periodically calculates and updates renderer stats (FPS, draw calls, triangles, memory) in the `simulationState`.
    - Requires the `THREE.WebGLRenderer` and `THREE.Camera` instances to be set via `setRenderer()` and `setCamera()`.

3.  **`events.ts` (`rendererEvents`)**: Provides a centralized, type-safe event bus.
    - Built with RxJS `Subject`s for robust, observable-based event streams.
    - Ensures consistency with the application's overall state management patterns.

**Key Characteristics & Design:**

- **Core Abstraction**: Provides fundamental classes (`SceneManager`, `AnimationLoop`) for managing a Three.js scene, distinct from the specific logic of rendering individual celestial objects.
- **Callback-Based Loop**: `AnimationLoop` uses callbacks (`onAnimate`, `onRender`) for extensibility, allowing other systems to hook into the update cycle.
- **Dependency on Core State**: Explicitly depends on `@teskooano/core-state` for initial camera position and for reporting performance statistics.
- **Basic Stats**: `AnimationLoop` includes logic for calculating and updating basic rendering performance statistics in the global state.
- **Debug Helpers**: `SceneManager` includes optional grid and sphere helpers.
- **Internal Events**: Provides a type-safe RxJS-based event bus for internal communication.
