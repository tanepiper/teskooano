# Architecture: Verlet Trajectory Visualization (`/verlet`)

This directory contains managers responsible for visualizing object trajectories based on the Verlet integration physics model. This includes predicting future paths and displaying recent historical trails. A key architectural principle here is the separation of concerns between the core physics engine and the rendering layer, though `TrailManager` represents a pragmatic exception to this rule for performance reasons.

## `PredictionManager.ts`

**Purpose**: Renders an object's future path based on a full n-body physics simulation.

### Core Design

1.  **Physics Calculation**: The manager does not perform physics calculations itself. It calls the `predictTrajectory` function from the `@teskooano/core-physics` package.
2.  **Data Flow & Type Conversion**: This is a critical architectural pattern.
    -   `predictTrajectory` returns an array of `OSVector3[]`. This ensures the core physics engine remains completely decoupled from the `three.js` rendering library.
    -   The `PredictionManager` receives this `OSVector3[]` array.
    -   **Only then**, as a final step before rendering, it converts the data into a `THREE.Vector3[]` array suitable for the `LineBuilder` utility.
3.  **Caching**: The manager caches the calculated `OSVector3[]` points to avoid costly recalculations on every frame. A recalculation is only forced when the underlying physics parameters are expected to have changed significantly.

This pattern enforces a strict one-way data flow: `Physics Engine (OSVector3) -> Renderer (THREE.Vector3)`.

## `TrailManager.ts`

**Purpose**: Renders an object's recent historical path, with options for high-quality visual smoothing.

### Core Design & Performance Considerations

1.  **Data Source**: The manager receives `RenderableCelestialObject` data on each frame, which already contains the object's position as a `THREE.Vector3`.
2.  **Internal Data Type**: The `positionHistory` is stored as a `Map<string, THREE.Vector3[]>`.
3.  **Architectural Exception**: Unlike `PredictionManager`, `TrailManager` works **natively with `THREE.Vector3`** for its internal state.
4.  **Rationale**: This is a deliberate performance optimization.
    -   The primary feature of `TrailManager` is its ability to apply high-quality smoothing algorithms, specifically `THREE.CatmullRomCurve3`.
    -   `CatmullRomCurve3` is a `three.js`-native utility that requires `THREE.Vector3[]` as input.
    -   If the `positionHistory` were stored as `OSVector3[]`, every single frame would require converting the entire history to `THREE.Vector3[]` just to pass it to the curve algorithm. This would generate significant garbage and hurt performance, negating the benefits of the reusable array optimizations.
    -   Since the manager's input is already a `THREE.Vector3` and its output target is a `three.js` line object, it is far more efficient to keep the entire internal pipeline in the `three.js` format.

In summary, while the project standard is to keep physics and rendering separate, the `TrailManager` is a case where the tight coupling with a renderer-specific utility (`CatmullRomCurve3`) makes it more practical and performant to handle `three.js` types directly. 