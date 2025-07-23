# Architecture: N-Body Trajectory Visualization (`/renderers`)

This directory contains managers responsible for visualizing object trajectories based on N-body physics simulation. This includes predicting future paths and displaying recent historical trails.

A key architectural principle here is offloading expensive calculations to Web Workers to keep the main render thread responsive. Both managers in this module follow this pattern.

## `PredictionManager.ts`

**Purpose**: Renders an object's future path based on a full n-body physics simulation.

### Core Design

1.  **State-Driven Configuration**: The `PredictionManager` is a consumer of the global simulation state from `@teskooano/core-state`. It subscribes to `simulationStateService.simulationState$` and automatically updates its prediction duration when the user changes the setting in the UI. This ensures a single source of truth for configuration and removes redundant state from the manager.
2.  **Web Worker Offloading**: The manager does not perform physics calculations itself. It offloads the expensive n-body simulation to `prediction.worker.ts`. The main `PredictionManager` class acts as a coordinator, sending the current physics state of all objects and the current prediction duration to the worker, then receiving back a calculated trajectory. This is a critical pattern to keep the main render thread from blocking.
3.  **Data Flow**: The data flow is designed to keep the core physics engine decoupled from the renderer.
    - The main thread gathers `CelestialObject` instances, which contain `PhysicsStateReal` objects (using `OSVector3`).
    - The raw physics data is serialized into a `Float32Array` and sent to the worker via `postMessage` for zero-copy transfer.
    - The worker "re-hydrates" the buffer back into physics state objects with `OSVector3` methods using `PredictionDataPool`.
    - It calls the `predictTrajectory` function from `@teskooano/core-physics`.
    - The resulting `OSVector3[]` array is serialized to a `[number, number, number][]` array and sent back to the main thread.
    - Finally, the `PredictionManager` converts this data into a `THREE.Vector3[]` array suitable for rendering with the `LineBuilder` utility.
4.  **Memory Management**: Uses `PredictionDataPool` to pre-allocate physics state objects and avoid continuous memory allocation/de-allocation in the worker.

This pattern enforces a strict one-way data flow and isolates the renderer-agnostic physics logic in the worker.

## `TrailManager.ts`

**Purpose**: Renders an object's recent historical path with optional simplification and smoothing.

### Core Design & Performance

1.  **Web Worker Offloading**: Like the `PredictionManager`, this manager offloads all heavy lifting to `trail.worker.ts`. The main-thread class is a lightweight coordinator that sends position updates to the worker and receives back a final array of points to render. This ensures that managing and processing long trail histories does not impact frame rate.
2.  **Data Flow**: The `TrailManager` now adheres to the same robust data flow pattern as the `PredictionManager`, eliminating a previous architectural exception.
    - The main thread sends new positions to the worker as simple `[number, number, number]` arrays.
    - The worker re-hydrates these into `OSVector3` objects and stores them in a `CircularBuffer` using `TrailDataPool`.
    - When an update is posted back, the worker prepares a renderable array of points, which the main thread consumes as `THREE.Vector3[]`.
3.  **Optional Simplification & Smoothing Pipeline**: The worker can apply a two-stage process to the historical data, controlled by the `TrailManager`:
    - **Simplification**: If enabled, uses the Ramer-Douglas-Peucker (RDP) algorithm to reduce the number of points in the trail while preserving its essential shape. This is ideal for reducing the data sent to the GPU.
    - **Smoothing**: The simplified (or raw) path is then passed through a Catmull-Rom spline function. This generates a smooth, visually appealing curve from the points, eliminating sharp angles.
4.  **Quality Control**: The spline generation is governed by a `TrailQuality` setting (`Low` to `Cosmic`). This maps to a total point budget for the entire smoothed curve, ensuring that the number of vertices does not grow uncontrollably, which prevents performance issues and crashes.
5.  **Memory Management**: Uses `TrailDataPool` to manage pre-allocated buffers for trail data, avoiding dynamic memory allocation in the worker.

## `TrailDataPool.ts`

**Purpose**: Manages a pre-allocated ArrayBuffer to store trail data for multiple objects efficiently.

### Core Design

- **Fixed-Size Allocation**: Provides fixed-size "slots" from a large, single buffer to avoid dynamic memory allocation
- **Circular Buffer**: Each slot implements a circular buffer approach that overwrites oldest data when full
- **Efficient Access**: Uses `Float32Array` views for fast float access and minimal memory overhead
- **Slot Management**: Tracks free slots and provides efficient allocation/deallocation

## `PredictionDataPool.worker.ts`

**Purpose**: Manages a pre-allocated pool of PhysicsStateReal objects to avoid continuous memory allocation and de-allocation within the prediction worker.

### Core Design

- **Pre-allocated Objects**: Creates all physics state objects upfront with their vectors
- **Index Mapping**: Maintains efficient mapping between object IDs and pool indices
- **Buffer Updates**: Efficiently updates the entire pool from serialized data
- **Memory Reuse**: Avoids garbage collection pressure in the worker thread

## Performance Optimizations

### Update Throttling

- **Trail Updates**: Throttled to every 10 frames by default
- **Prediction Updates**: Throttled to every 90 frames by default
- **Batch Processing**: Trail updates are batched to reduce worker communication overhead

### Memory Efficiency

- **Zero-Copy Transfers**: Uses `Float32Array` for efficient data transfer between main thread and workers
- **Object Pooling**: Pre-allocated data structures eliminate runtime allocations
- **Buffer Reuse**: Shared buffer pools reduce memory fragmentation

### Quality Settings

- **Trail Quality**: Configurable from Low to Cosmic with automatic point budget management
- **Prediction Accuracy**: Adjustable step count and duration for performance vs. accuracy trade-offs
- **Update Frequency**: Configurable throttling to balance responsiveness and performance
