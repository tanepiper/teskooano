# Architecture: `@teskooano/renderer-threejs-orbits`

This document provides a detailed overview of the architecture for the `@teskooano/renderer-threejs-orbits` package.

## Overview

This package is responsible for visualizing the orbital paths of celestial objects. It is designed to support two distinct modes of visualization that correspond to the underlying physics engines used in the simulation:

1.  **Keplerian Mode**: Visualizes the perfect, analytical ellipses described by Kepler's laws. This is used when the simulation is running in `keplerian` mode.
2.  **Verlet Mode**: Visualizes the paths of objects calculated by the Verlet numerical integrator. This consists of two parts:
    - A historical "trail" showing where the object has been.
    - A "prediction" line showing the calculated future trajectory.

The architecture is built around the **Strategy Pattern**. A central `OrbitsManager` acts as the context, orchestrating a suite of sub-managers (the strategies) and switching between them based on the application's current state.

## Core Components

### 1. `OrbitsManager` (The Context)

The `OrbitsManager` is the public-facing facade of the package. It is instantiated by the main `ModularSpaceRenderer`.

**Key Responsibilities:**

- **Mode Switching**: Subscribes to the `RendererStateAdapter`'s `$visualSettings` observable to detect changes in the active `physicsEngine`. When the engine changes, it seamlessly transitions between the Keplerian and Verlet visualization strategies.
- **Orchestration**: It holds instances of all three sub-managers (`KeplerianManager`, `TrailManager`, `PredictionManager`). In its `updateAllVisualizations()` method (called every frame), it delegates the update calls to the currently active manager(s).
- **Lifecycle Management**: It listens to the `renderableObjects$` stream to add and remove visualizations as objects appear and disappear from the simulation.
- **API Facade**: Provides a clean public API for controlling the visualizations (e.g., `setVisibility`, `highlightVisualization`, `setPredictionDuration`).

### 2. `KeplerianManager` (Strategy 1)

- **Responsibility**: Renders the full elliptical orbits for objects that have `OrbitalParameters`.
- **Workflow**: When active, it uses an `OrbitCalculator` utility to generate the vertices for an object's orbital ellipse based on its parameters. It then uses a `LineBuilder` to create or update the corresponding `THREE.Line` object in the scene.

### 3. `TrailManager` & `PredictionManager` (Strategy 2)

These two managers work together to visualize orbits under the Verlet integration engine.

- **`TrailManager`**:

  - **Responsibility**: Shows the recent historical path of an object.
  - **Workflow**: For each object, it maintains a `CircularBuffer` of recent positions. On each update, it adds the object's current position to the buffer and uses the `LineBuilder` to draw a line connecting the points in the buffer. The length of the trail is determined by the buffer's capacity.

- **`PredictionManager`**:
  - **Responsibility**: Shows the predicted future path of an object.
  - **Workflow**: It can be triggered to run a "prediction simulation" using a `predictTrajectory` function from `@teskooano/core-physics`. This function calculates an array of future positions. The `PredictionManager` then caches these points and draws them as a line. This is a computationally expensive operation, so it is only run periodically or on demand, not every frame.

### 4. Utility Classes

- **`LineBuilder`**: A utility for efficiently creating and updating `THREE.Line` objects. It uses a `BufferPool` to reuse `BufferAttribute`s, minimizing memory allocations and garbage collection.
- **`SharedMaterials`**: A singleton that provides cached, reusable `LineBasicMaterial` instances for all orbit lines, reducing the number of materials in the scene.

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
        KM(KeplerianManager)
        TM(TrailManager)
        PM(PredictionManager)
    end

    MSR -- Instantiates --> OM;
    RP -- Calls update() --> OM;
    OM -- Subscribes to --> RSA;

    OM -- Delegates to --> KM;
    OM -- Delegates to --> TM;
    OM -- Delegates to --> PM;

    classDef manager fill:#d5e8d4,stroke:#82b366;
    class OM, KM, TM, PM manager;
```

## Known Limitations and Potential Improvements

1.  **Hard-coded Parameters**: Many parameters (like prediction duration, update frequencies) are hard-coded and could be made configurable through a settings object.
2.  **Performance**: While optimized, rendering thousands of long trails in Verlet mode can still be performance-intensive. Further optimizations could explore line imposters or GPU-based particle trails.
