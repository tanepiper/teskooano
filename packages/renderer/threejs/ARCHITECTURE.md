## Three.js Main Renderer Package Analysis (`threejs`)

This package appears to be the main integration point and facade for the entire Three.js rendering pipeline, bringing together the components from `threejs-core`, `threejs-visualization`, `threejs-interaction`, and `threejs-effects`.

**Core Components:**

1.  **`ModularSpaceRenderer` (`index.ts`)**: The primary class exported by this package, acting as the main interface for controlling the renderer.
    *   **Aggregation**: Instantiates and holds references to managers from all the underlying renderer packages:
        *   Core: `SceneManager`, `AnimationLoop`, `StateManager`.
        *   Visualization: `ObjectManager`, `OrbitManager`, `BackgroundManager`.
        *   Interaction: `ControlsManager`, `CSS2DManager` (or a `NullCSS2DManager` if UI is disabled).
        *   Effects: `LightManager`, `LODManager`.
    *   **Initialization (`constructor`)**: Performs comprehensive setup:
        *   Initializes all manager instances, passing necessary dependencies (container element, scene, camera).
        *   Connects `AnimationLoop` to the `WebGLRenderer` instance from `SceneManager`.
        *   Sets up event listeners (e.g., for toggling grid, background debug).
        *   Sets up state subscriptions (`setupStateSubscriptions`) via `StateManager` to react to `celestialObjectsStore` changes (add/update/remove objects) and potentially `simulationState` changes.
        *   Populates the initial scene based on current state (`populateFromState`).
        *   Sets up the main animation callbacks (`setupAnimationCallbacks`) that orchestrate the `update` calls for various managers within the `AnimationLoop`'s `tick`.
        *   Adds a window resize handler.
    *   **Update Logic (`setupAnimationCallbacks`)**: Registers a primary callback with `AnimationLoop` that executes per frame:
        *   Updates `ControlsManager`.
        *   Updates `OrbitManager` visualizations.
        *   Updates `CSS2DManager` (if enabled).
        *   Updates `LODManager`.
        *   Updates `LightManager` (though its update method seems simple/non-existent in the current code).
        *   Updates `ObjectManager` renderers (passing time, light data, etc.).
        *   Updates `BackgroundManager`.
        *   Handles camera following logic (`_followTargetId`).
        *   Renders the main scene (`sceneManager.render()`).
        *   Renders the CSS2D overlay (`css2DManager.render()`).
        *   Renders optional canvas UI (`canvasUIManager.render()`).
    *   **Public Interface**: Provides methods to control the renderer:
        *   `startRenderLoop()`, `stopRenderLoop()`.
        *   `addObject()`, `removeObject()`, `updateObject()` (delegating primarily to `ObjectManager`).
        *   `toggleLabels()`, `toggleGrid()`, `toggleOrbits()`, `toggleDebugSphere()`.
        *   `setFollowTarget()`, `updateCamera()`.
        *   Accessors for `scene`, `camera`, `renderer`, `controls`.
    *   **Disposal (`dispose`)**: Calls `dispose` on all managed components and unsubscribes from state.

2.  **Null Implementations (`NullUIManager`, `NullCSS2DManager`)**: Placeholder classes used when UI features are disabled via constructor options, preventing errors if methods are called.

3.  **Re-Exports**: Exports key classes and types from the underlying `threejs-*` packages for convenience.

4.  **Utilities (`utils/coordinateUtils.ts`)**: Contains helper functions like `physicsToThreeJSPosition` for converting between coordinate systems (likely physics engine units to Three.js scene units).

5.  **Events (`events.ts`)**: Re-exports the `rendererEvents` emitter from `@teskooano/renderer-threejs-core`.

**Key Characteristics & Design:**

*   **Facade Pattern**: `ModularSpaceRenderer` provides a simplified high-level API, hiding the complexity of coordinating multiple underlying managers.
*   **Integration Hub**: Acts as the central point where core setup, visualization, interaction, and effects are brought together and managed.
*   **Configuration**: Renderer features (UI, labels, debug helpers) can be enabled/disabled via constructor options.
*   **State-Driven**: Uses `StateManager` to react to changes in `core-state` and automatically add/update/remove objects in the visualization.
*   **Lifecycle Management**: Manages the start, stop, update, and disposal of the entire rendering pipeline.
*   **Clear Orchestration**: The `setupAnimationCallbacks` method clearly defines the order of operations within each frame update.
*   **Dependency Injection (Implicit)**: The constructor wires together the necessary dependencies between the different managers (e.g., passing scene/camera to managers that need them). 