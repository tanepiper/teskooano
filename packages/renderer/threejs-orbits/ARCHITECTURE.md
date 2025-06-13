# @teskooano/renderer-threejs-orbits Architecture

## Overview

The `@teskooano/renderer-threejs-orbits` package is responsible for visualizing orbital paths in the Teskooano engine. It provides two distinct visualization modes, managed by a central `OrbitsManager`:

1.  **Keplerian Mode**: Draws static, idealized elliptical orbit lines calculated from orbital parameters. This is managed by the `KeplerianManager`.
2.  **Verlet Mode**: Draws dynamic trails and trajectory predictions based on real-time physics simulation. This is split between the `TrailManager` and `PredictionManager`.

This architectural design allows the system to efficiently toggle between idealized orbital paths and physically simulated paths.

## Core Components

### `OrbitsManager` (`core/OrbitsManager.ts`)

This is the central controller class that orchestrates all orbit visualization.

- **Responsibilities**:
  - Instantiates and manages the sub-managers (`KeplerianManager`, `TrailManager`, `PredictionManager`).
  - Handles switching between `Keplerian` and `Verlet` visualization modes.
  - Delegates all visualization tasks (creation, updates, visibility, highlighting) to the appropriate sub-manager.
  - Subscribes to the `renderableStore` to react to object changes.

### Sub-Managers

1.  **`KeplerianManager`** (`keplerian/KeplerianManager.ts`)

    - **Purpose**: Manages static, elliptical Keplerian orbit lines.
    - **Functionality**: Creates and updates orbit lines based on `OrbitalParameters`. Uses `OrbitCalculator` for the underlying math. Handles highlighting and visibility for all Keplerian paths.

2.  **`TrailManager`** (`verlet/TrailManager.ts`)

    - **Purpose**: Manages historical path trails for objects in Verlet mode.
    - **Functionality**: Captures recent object positions into a moving buffer. Uses `LineBuilder` to efficiently create and update the trail geometry. Trail length is configurable.

3.  **`PredictionManager`** (`verlet/PredictionManager.ts`)
    - **Purpose**: Manages future trajectory prediction lines for a selected object in Verlet mode.
    - **Functionality**: Uses the `predictTrajectory` function from `@teskooano/core-physics` to get future points. It does **not** perform its own physics calculations. It visualizes the predicted path using `LineBuilder`.

### Utility Modules

- **`OrbitCalculator.ts`**: Implements the mathematics for calculating Keplerian orbit points from orbital parameters.
- **`LineBuilder.ts`**: Provides utilities for creating and updating `THREE.Line` geometries efficiently.
- **`BufferPool.ts`**: A memory optimization utility for recycling `Float32Array` buffers to reduce garbage collection.
- **`SharedMaterials.ts`**: Defines shared `THREE.LineBasicMaterial` instances to reduce resource consumption.

## Data Flow and Update Cycle

1.  The `OrbitsManager` subscribes to the `renderableStore.renderableObjects$` observable.
2.  On each frame, the main renderer calls `orbitsManager.update()`.
3.  The `OrbitsManager` then calls the `update()` method of the currently active sub-manager(s) (`KeplerianManager` or both `TrailManager` and `PredictionManager`).
4.  The sub-managers handle the details of creating, updating, or removing their respective line geometries from the scene.
5.  When an object is highlighted via `orbitsManager.highlight()`, the call is delegated to the active managers to apply a highlight material to the correct line.

## Code Organization

The package is organized by feature, with distinct directories for the core orchestrator, each visualization mode, and shared utilities.

```
packages/renderer/threejs-orbits/
├── src/
│   ├── core/
│   │   ├── OrbitsManager.ts        # Main controller
│   │   └── SharedMaterials.ts      # Shared materials
│   ├── keplerian/
│   │   ├── KeplerianManager.ts     # Manages static ellipses
│   │   └── OrbitCalculator.ts      # Math for ellipses
│   ├── verlet/
│   │   ├── TrailManager.ts         # Manages historical trails
│   │   └── PredictionManager.ts    # Manages future predictions
│   └── utils/
│       ├── LineBuilder.ts          # THREE.js line creation helpers
│       └── BufferPool.ts           # Buffer management utilities
```

## Known Limitations and Potential Improvements

1.  **Hard-coded Parameters**: Many parameters (like prediction duration, update frequencies) are hard-coded and could be made configurable through a settings object.
2.  **Performance**: While optimized, rendering thousands of long trails in Verlet mode can still be performance-intensive. Further optimizations could explore line imposters or GPU-based particle trails.
