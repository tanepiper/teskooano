## Three.js Visualization Analysis (`threejs-visualization`)

This package is responsible for orchestrating the rendering of the complete scene, managing the lifecycle of celestial object visuals, orbits, and background elements.

**Core Components:**

1.  **`VisualizationRenderer` (`index.ts`)**: A facade class coordinating the different visualization managers.

    - Instantiates `ObjectManager`, `OrbitManager`, and `BackgroundManager`.
    - Provides methods like `renderCelestialObject` and `renderOrbit` which delegate to the appropriate manager (`ObjectManager.addObject`, `OrbitManager.createOrUpdate...`).
    - `update()`: Calls the `update` methods of its managed components (`ObjectManager`, `BackgroundManager`). _Note: OrbitManager update seems to be handled implicitly via state changes or within ObjectManager?_.
    - `dispose()`: Calls dispose on managed components.

2.  **`ObjectManager.ts` (`ObjectManager`)**: Manages the creation, update, and removal of `THREE.Object3D` representations for celestial bodies.

    - Holds references to the main `THREE.Scene` and `THREE.PerspectiveCamera`.
    - Instantiates and uses `LODManager` from `@teskooano/renderer-threejs-effects`.
    - Instantiates and uses `LabelManager` (which is deprecated and wraps `CSS2DManager`).
    - Instantiates helper classes from `object-manager/` subdirectory: `GravitationalLensingHandler`, `MeshFactory`, `RendererUpdater`.
    - `initCelestialRenderers()`: Initializes a map (`celestialRenderers`) holding instances of specific renderers from `@teskooano/systems-celestial` (Gas Giants, Particles). _Note: It does NOT seem to initialize Star or Terrestrial renderers here._.
    - `addObject(object)`: Creates a mesh using `MeshFactory.createObjectMesh`, adds it to the scene and internal map (`objects`). Creates a label via `LabelManager`. Checks if lensing is needed via `lensingHandler`. Sets initial position using `physicsToThreeJSPosition`.
    - `updateObject(object)`: Updates the `position` (using `physicsToThreeJSPosition`) and `quaternion` of an existing mesh. Updates the label position.
    - `removeObject(objectId)`: Removes the label, removes the object from `LODManager`, removes the mesh from the scene, and disposes of geometry/material.
    - `updateRenderers(...)`: Called potentially by the main loop, passes time, light sources, and other context to `RendererUpdater.updateAll`.
    - `update()`: Calls `lodManager.update()`.
    - `dispose()`: Cleans up objects, renderers, label manager, and LOD manager.
    - **Dependencies**: Relies heavily on `@teskooano/systems-celestial` for renderer implementations, `@teskooano/renderer-threejs-effects` for LOD, `@teskooano/renderer-threejs-interaction` (via `LabelManager` wrapping `CSS2DManager`), `@teskooano/core-state` (implicitly via sub-managers), and `@teskooano/renderer-threejs` for `physicsToThreeJSPosition`.

3.  **`OrbitManager.ts` (`OrbitManager`)**: Manages the visualization of orbital paths.

    - Holds a reference to the `ObjectManager` to get parent object positions.
    - Supports two `VisualizationMode`s: `Keplerian` (drawing ellipses) and `Verlet` (drawing trails and predictions based on physics state).
    - Subscribes to `simulationState` to automatically switch `visualizationMode` based on `physicsEngine` changes.
    - Maintains maps of `THREE.Line` objects for Keplerian orbits (`keplerianLines`), Verlet trails (`trailLines`), and Verlet predictions (`predictionLines`).
    - `setVisualizationMode()`: Switches modes, cleans up visualizations from the previous mode, and triggers `updateAllVisualizations`.
    - `updateAllVisualizations()`: The main update logic. Iterates through objects from `celestialObjectsStore`. Depending on the mode, calls either `createOrUpdateKeplerianOrbit` or `createOrUpdateVerletVisualization` & `updatePredictionLine`.
    - `createOrUpdateKeplerianOrbit()`: Calculates orbit points using `calculateOrbitPoints` (from `orbit-manager/`), creates/updates the `THREE.Line` using helpers, positions it relative to the parent object, and adds/updates it in the scene via `ObjectManager`.
    - `createOrUpdateVerletVisualization()`: Reads the current object position, updates a position history (`positionHistory`), and creates/updates a `THREE.Line` (`trailLines`) showing the recent path.
    - `updatePredictionLine()`: Uses `predictVerletTrajectory` (from `orbit-manager/`) based on the object's `physicsStateReal` to get future points and creates/updates a prediction line (`predictionLines`).
    - Includes logic for highlighting (`highlightVisualization`) and toggling visibility.
    - `dispose()`: Removes all lines and unsubscribes from state.

4.  **`BackgroundManager.ts` (`BackgroundManager`)**: Manages the starfield background.

    - Holds a reference to the main `THREE.Scene`.
    - Uses helpers from `background-manager/` (`createStarLayers`, `updateStarColors`, etc.) to create multiple layers of `THREE.Points` representing stars.
    - `update(deltaTime)`: Updates parallax effect based on camera position (`updateParallax`) and applies subtle animation (`animateStarField`).
    - Includes debug mode (`toggleDebug`) to visualize layers.
    - `dispose()`: Removes star layers and cleans up resources.

5.  **`LabelManager.ts` (`LabelManager`)**: **Deprecated**. Acts as a wrapper around `CSS2DManager` from `threejs-interaction`. Should be phased out in favor of direct usage of `CSS2DManager`.

6.  **Subdirectories (`object-manager/`, `orbit-manager/`, `background-manager/`)**: Contain helper functions and potentially specialized classes used by the main managers in this package (e.g., orbit calculation logic, mesh creation logic, background layer creation).

**Key Characteristics & Design:**

- **Orchestration Layer**: Acts as the main coordinator for bringing together different visual elements (objects, orbits, background).
- **Manager Pattern**: Divides responsibilities into distinct managers (`ObjectManager`, `OrbitManager`, `BackgroundManager`).
- **State-Driven Updates**: Relies heavily on data from `@teskooano/core-state` (`celestialObjectsStore`, `simulationState`) to drive updates (object positions, orbit calculations, visualization mode switching).
- **Mode Switching**: `OrbitManager` dynamically switches between Keplerian and Verlet visualization based on the physics engine state.
- **Delegation**: `ObjectManager` delegates actual mesh creation and updates to specific renderers obtained from `@teskooano/systems-celestial` (via its internal `MeshFactory` and `RendererUpdater`).
- **Dependency Chain**: Forms a key part of the rendering pipeline, depending on `core-state`, `systems-celestial`, `threejs-core`, `threejs-effects`, and `threejs-interaction`.
- **Deprecated Components**: Contains a deprecated `LabelManager`.
- **Incomplete Initialization**: `ObjectManager.initCelestialRenderers` doesn't seem to initialize all necessary renderer types (e.g., Stars, Terrestrial), relying on `MeshFactory` to handle them dynamically, which might be less explicit.
