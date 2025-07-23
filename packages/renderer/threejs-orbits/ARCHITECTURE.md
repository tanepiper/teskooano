# Architecture: `@teskooano/renderer-threejs-orbits`

This document provides a detailed overview of the architecture for the `@teskooano/renderer-threejs-orbits` package.

## Overview

This package is responsible for visualizing the orbital paths of celestial objects. It is designed to support two distinct modes of visualization that correspond to the underlying physics engines used in the simulation:

1.  **Ideal Mode**: Visualizes the perfect, analytical ellipses described by Kepler's laws. This is used when the simulation is running in `ideal` mode.
2.  **N-Body Mode**: Visualizes the paths of objects calculated by N-body physics simulation. This consists of two parts:
    - A historical "trail" showing where the object has been.
    - A "prediction" line showing the calculated future trajectory.

The architecture is built around the **Strategy Pattern**. A central `OrbitsManager` acts as the context, orchestrating a suite of sub-managers (the strategies) and switching between them based on the application's current state.

## Core Components

### 1. `OrbitsManager` (The Context)

The `OrbitsManager` is the public-facing facade of the package. It is instantiated by the main `ModularSpaceRenderer`.

**Key Responsibilities:**

- **Mode Switching**: Subscribes to the `RendererStateAdapter`'s `$visualSettings` observable to detect changes in the active `physicsEngine`. When the engine changes, it seamlessly transitions between the Ideal and N-Body visualization strategies.
- **Orchestration**: It holds instances of all sub-managers and delegates the update calls to the currently active strategy.
- **Lifecycle Management**: It listens to the `renderableObjects$` stream to add and remove visualizations as objects appear and disappear from the simulation.
- **API Facade**: Provides a clean public API for controlling the visualizations (e.g., `setVisibility`, `highlightVisualization`, `setPredictionDuration`).

### 2. `IdealStrategy` (Strategy 1)

- **Responsibility**: Renders the full elliptical orbits for objects that have `OrbitalParameters`.
- **Workflow**: When active, it uses an `OrbitCalculator` utility to generate the vertices for an object's orbital ellipse based on its parameters. It then uses a `LineBuilder` to create or update the corresponding `THREE.Line` object in the scene.
- **Performance**: Static calculations with minimal computational overhead.

### 3. `NBodyStrategy` (Strategy 2)

This strategy handles visualization for all N-Body physics modes, regardless of the specific algorithm or integrator being used.

- **`TrailManager`**:
  - **Responsibility**: Shows the recent historical path of an object.
  - **Workflow**: For each object, it maintains a `CircularBuffer` of recent positions. On each update, it adds the object's current position to the buffer and uses the `LineBuilder` to draw a line connecting the points in the buffer.
  - **Performance**: Uses Web Workers for trail processing with optional simplification and smoothing.

- **`PredictionManager`**:
  - **Responsibility**: Shows the predicted future path of an object.
  - **Workflow**: It can be triggered to run a "prediction simulation" using a `predictTrajectory` function from `@teskooano/core-physics`. This function calculates an array of future positions. The `PredictionManager` then caches these points and draws them as a line.
  - **Performance**: Computationally expensive operation offloaded to Web Workers, only run periodically or on demand.

## Performance Architecture

### Web Worker Offloading

Both `TrailManager` and `PredictionManager` use Web Workers to keep the main render thread responsive:

- **Data Serialization**: Physics data is serialized into `Float32Array` buffers for zero-copy transfer
- **Worker Processing**: Heavy calculations (trail simplification, trajectory prediction) run in background workers
- **Result Deserialization**: Processed results are converted back to `THREE.Vector3[]` arrays for rendering

### Memory Management

- **Buffer Pooling**: `BufferPool` class reuses `THREE.BufferAttribute` objects to minimize allocations
- **Object Pooling**: `TrailDataPool` and `PredictionDataPool` manage pre-allocated data structures
- **Circular Buffers**: Efficient fixed-size buffers that overwrite oldest data when full

### Update Throttling

- **Trail Updates**: Throttled to every 10 frames by default
- **Prediction Updates**: Throttled to every 90 frames by default
- **Geometry Updates**: Separated from position updates to reduce GPU overhead

## Data Flow

### Ideal Mode Data Flow

```mermaid
graph TD
    A[OrbitalParameters] --> B[OrbitCalculator]
    B --> C[OSVector3[]]
    C --> D[updateThreeVector3Array]
    D --> E[THREE.Vector3[]]
    E --> F[LineBuilder]
    F --> G[THREE.Line]
```

### N-Body Mode Data Flow

```mermaid
graph TD
    subgraph "Main Thread"
        A[RenderableObjects] --> B[TrailManager/PredictionManager]
        B --> C[Serialize to Float32Array]
    end

    subgraph "Web Worker"
        C --> D[Deserialize to OSVector3]
        D --> E[Process Data]
        E --> F[Serialize Results]
    end

    subgraph "Main Thread"
        F --> G[Deserialize to THREE.Vector3[]]
        G --> H[LineBuilder]
        H --> I[THREE.Line]
    end
```

## Utility Classes

### Core Utilities

- **`LineBuilder`**: A utility for efficiently creating and updating `THREE.Line` objects. It uses a `BufferPool` to reuse `BufferAttribute`s, minimizing memory allocations and garbage collection.
- **`SharedMaterials`**: A singleton that provides cached, reusable `LineBasicMaterial` instances for all orbit lines, reducing the number of materials in the scene.

### Worker Utilities

- **`CircularBuffer`**: Memory-efficient, fixed-size buffer that overwrites oldest elements when full
- **`simplify`**: Implements Ramer-Douglas-Peucker algorithm for trail simplification
- **`TrailDataPool`**: Pre-allocated buffer management for trail data
- **`PredictionDataPool`**: Pre-allocated buffer management for prediction data

## Interaction Diagram

```mermaid
graph TD
    subgraph ModularSpaceRenderer
        MSR
    end

    subgraph RenderPipeline
        RP
    end

    subgraph RendererStateAdapter
        RSA["$visualSettings"]
    end

    subgraph "This Package"
        OM(OrbitsManager)
        IS(IdealStrategy)
        NS(NBodyStrategy)
        KM(KeplerianManager)
        TM(TrailManager)
        PM(PredictionManager)
    end

    subgraph "Web Workers"
        TW(trail.worker)
        PW(prediction.worker)
    end

    MSR -- Instantiates --> OM;
    RP -- Calls update() --> OM;
    OM -- Subscribes to --> RSA;

    OM -- Delegates to --> IS;
    OM -- Delegates to --> NS;

    IS -- Uses --> KM;
    NS -- Uses --> TM;
    NS -- Uses --> PM;

    TM -- Offloads to --> TW;
    PM -- Offloads to --> PW;

    classDef manager fill:#d5e8d4,stroke:#82b366;
    classDef strategy fill:#fff2cc,stroke:#d6b656;
    classDef worker fill:#e1d5e7,stroke:#9673a6;

    class OM, KM, TM, PM manager;
    class IS, NS strategy;
    class TW, PW worker;
```

## Configuration and Settings

### Trail Quality Settings

- **Low**: Minimal trail points for maximum performance
- **Medium**: Balanced quality and performance
- **High**: High-quality trails with smoothing
- **Cosmic**: Maximum quality with full smoothing pipeline

### Prediction Settings

- **Duration**: How far into the future to predict (configurable)
- **Steps**: Number of simulation steps for prediction accuracy
- **Update Frequency**: How often to recalculate predictions

## Known Limitations and Potential Improvements

1.  **Hard-coded Parameters**: Many parameters (like prediction duration, update frequencies) are hard-coded and could be made configurable through a settings object.
2.  **Performance**: While optimized, rendering thousands of long trails in N-Body mode can still be performance-intensive. Further optimizations could explore line imposters or GPU-based particle trails.
3.  **Memory Usage**: Long trails can consume significant memory. Future versions could implement automatic trail length adjustment based on system performance.
