# Architecture: Core Orbit Visualization (`/core`)

This directory contains the central components that orchestrate the entire orbit visualization system.

## `OrbitsManager.ts`

**Purpose**: The primary entry point and central coordinator for all orbit visualization.

### Core Design

1.  **High-Level Abstraction**: This manager acts as a facade, hiding the complexity of the underlying visualization systems (`IdealStrategy`, `NBodyStrategy`). UI components and other parts of the application should interact with `OrbitsManager`, not the specific sub-managers.
2.  **Mode Switching**: A key responsibility is managing the `OrbitDisplayMode` (`Ideal` vs. `NBody`). It listens to changes from the `RendererStateAdapter` (driven by the physics engine setting) and seamlessly switches between the two visualization types, ensuring that only one is active and visible at a time.
3.  **Strategy Pattern**: Uses the Strategy pattern to delegate visualization implementation to specialized classes:
    - `IdealStrategy`: Renders perfect elliptical orbits using Keplerian parameters
    - `NBodyStrategy`: Renders dynamic trails and predictions based on N-body physics
4.  **Event Throttling**: To maintain performance, the manager throttles updates to the more expensive visualization types. Trail geometry is updated less frequently than object positions, and trajectory predictions (the most expensive operation) are updated even less often. This prevents performance bottlenecks in the render loop.
5.  **Delegation**: It delegates all specific rendering tasks to the appropriate strategy. For example, when in `Ideal` mode, it calls `idealStrategy.update()`; when in `NBody` mode, it calls `nBodyStrategy.update()`.
6.  **State Management**: It manages shared visualization state, such as visibility and highlighting, and propagates these state changes to the active strategy.

## `SharedMaterials.ts`

**Purpose**: A simple, static utility class that provides shared `three.js` materials for all orbit lines.

### Core Design & Rationale

1.  **Performance**: The primary goal is to improve performance and reduce memory usage by preventing the creation of duplicate materials. Creating new materials in `three.js` can be expensive, and this utility ensures that only a few instances are created and reused throughout the application.
2.  **Centralized Styling**: It provides a single, centralized location to define the visual style (color, opacity, line width) for different types of orbit lines (`KEPLERIAN`, `TRAIL`, `PREDICTION`, etc.).
3.  **Cloning**: The `clone()` method allows each line to have its own unique material instance, which is necessary for individual highlighting and color changes, while still starting from a shared base definition.
4.  **Responsive Design**: Automatically adjusts line widths based on screen size (mobile vs desktop) for optimal visibility.

## Strategy Interfaces

### `IOrbitVisualizationStrategy.ts`

**Purpose**: Defines the contract for orbit visualization strategies.

### Core Design

1.  **Strategy Pattern**: Enables the `OrbitsManager` to switch between different visualization approaches without changing its implementation.
2.  **Unified Interface**: Provides a consistent API for all visualization strategies:
    - `update()`: Updates visualizations based on current state
    - `highlight()`: Highlights specific object visualizations
    - `setVisibility()`: Controls visibility of orbit visualizations
    - `setPredictionVisibility()`: Controls visibility of prediction visualizations
    - `dispose()`: Cleans up resources

## Strategy Implementations

### `IdealStrategy.ts`

**Purpose**: Renders perfect elliptical orbits based on analytical Keplerian orbital parameters.

### Core Design

1.  **Static Calculations**: Uses `OrbitCalculator` to generate perfect elliptical paths from orbital parameters
2.  **Efficient Rendering**: Minimal computational overhead with static orbit lines
3.  **Highlighting Support**: Full support for object highlighting and visibility control
4.  **Resource Management**: Proper cleanup of Keplerian orbit lines

### `NBodyStrategy.ts`

**Purpose**: Renders dynamic trails and predictions based on N-body physics simulation.

### Core Design

1.  **Dual Visualization**: Manages both historical trails (`TrailManager`) and future predictions (`PredictionManager`)
2.  **Performance Optimization**: Implements throttled updates for both trails and predictions
3.  **Multi-Star Support**: Handles complex positioning logic for multi-star systems
4.  **Quality Control**: Configurable update frequencies and quality settings
5.  **Resource Management**: Proper cleanup of both trail and prediction managers

## Configuration and Settings

### Update Frequencies

- **Trail Updates**: Every 10 frames by default
- **Prediction Updates**: Every 90 frames by default
- **Memory Management**: Automatic cleanup of unused trails and predictions

### Mode Transitions

- **Smooth Transitions**: 300ms transition duration for mode changes
- **State Preservation**: Maintains visibility and highlighting during transitions
- **Resource Cleanup**: Proper disposal of previous strategy resources
