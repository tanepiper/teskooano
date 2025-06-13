# Architecture: Core Orbit Visualization (`/core`)

This directory contains the central components that orchestrate the entire orbit visualization system.

## `OrbitsManager.ts`

**Purpose**: The primary entry point and central coordinator for all orbit visualization.

### Core Design

1.  **High-Level Abstraction**: This manager acts as a facade, hiding the complexity of the underlying visualization systems (`KeplerianManager`, `TrailManager`, `PredictionManager`). UI components and other parts of the application should interact with `OrbitsManager`, not the specific sub-managers.
2.  **Mode Switching**: A key responsibility is managing the `VisualizationMode` (`KEPLERIAN` vs. `VERLET`). It listens to changes from the `RendererStateAdapter` (driven by the physics engine setting) and seamlessly switches between the two visualization types, ensuring that only one is active and visible at a time.
3.  **Event Throttling**: To maintain performance, the manager throttles updates to the more expensive visualization types. Trail geometry is updated less frequently than object positions, and trajectory predictions (the most expensive operation) are updated even less often. This prevents performance bottlenecks in the render loop.
4.  **Delegation**: It delegates all specific rendering tasks to the appropriate sub-manager. For example, when in `KEPLERIAN` mode, it calls `keplerianManager.createOrUpdate()`; when in `VERLET` mode, it calls `trailManager.updateTrail()` and `predictionManager.updatePrediction()`.
5.  **State Management**: It manages shared visualization state, such as visibility and highlighting, and propagates these state changes to the active sub-managers.

## `SharedMaterials.ts`

**Purpose**: A simple, static utility class that provides shared `three.js` materials for all orbit lines.

### Core Design & Rationale

1.  **Performance**: The primary goal is to improve performance and reduce memory usage by preventing the creation of duplicate materials. Creating new materials in `three.js` can be expensive, and this utility ensures that only a few instances are created and reused throughout the application.
2.  **Centralized Styling**: It provides a single, centralized location to define the visual style (color, opacity, line width) for different types of orbit lines (`KEPLERIAN`, `TRAIL`, `PREDICTION`, etc.).
3.  **Cloning**: The `clone()` method allows each line to have its own unique material instance, which is necessary for individual highlighting and color changes, while still starting from a shared base definition. 