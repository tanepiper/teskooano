# @teskooano/renderer-threejs-orbits Architecture

## Overview

The `@teskooano/renderer-threejs-orbits` package is responsible for visualizing orbital paths in the Teskooano engine. It provides two distinct visualization modes:

1. **Keplerian Mode**: Static elliptical orbit lines calculated from orbital parameters using analytical solutions to Kepler's equations
2. **Verlet Mode**: Dynamic trails and trajectory predictions based on real-time physics simulation using Verlet integration

This architectural design allows the system to efficiently toggle between idealized orbital paths (Keplerian) and physically simulated paths (Verlet) based on the physics engine setting.

## Core Components

### Main Classes

1. **OrbitManager** (`src/OrbitManager.ts`)

   - Central controller class that manages all orbit visualizations
   - Handles switching between visualization modes
   - Contains maps for tracking trail lines and prediction lines
   - Delegates Keplerian orbit management to the KeplerianOrbitManager

2. **KeplerianOrbitManager** (`src/orbit-manager/keplerian-manager.ts`)
   - Specialized manager for static Keplerian orbit lines
   - Creates and updates orbit lines based on orbital parameters
   - Handles highlighting and visibility of all Keplerian orbital paths

### Utility Modules

1. **orbit-calculator.ts**

   - Implements the mathematics for calculating Keplerian orbit points
   - Converts orbital parameters to 3D points using Kepler's equations
   - Handles transformations from orbital plane to 3D space

2. **verlet-predictor.ts**

   - Predicts future trajectories using Verlet integration
   - Uses the Barnes-Hut algorithm via an Octree for efficient N-body gravitational calculations
   - Simulates gravitational interactions between all celestial bodies

3. **orbit-line-builder.ts**
   - Provides utilities for creating and updating THREE.js line geometries
   - Handles geometry creation, updating, and disposal
   - Optimizes memory usage during visualization changes

## Visualization Modes in Detail

### Keplerian Mode

This mode creates idealized elliptical orbit paths based on classical orbital elements:

- Semi-major axis
- Eccentricity
- Inclination
- Argument of periapsis
- Longitude of ascending node
- Mean anomaly

The orbit paths are calculated once and remain static, representing the idealized trajectory an object would follow in a perfect two-body system.

### Verlet Mode

This mode provides two types of visualization:

1. **Trails**: Historical paths showing where an object has been

   - Dynamically updated every frame as objects move
   - Length controlled by the `trailLengthMultiplier` setting
   - Implemented as moving buffer that captures recent positions

2. **Predictions**: Future trajectories showing where an object will go
   - Calculated using Verlet integration with the Barnes-Hut optimization
   - Accounts for gravitational interactions between all bodies
   - Only calculated occasionally (every `predictionUpdateFrequency` frames) for performance
   - Only shown for the currently highlighted celestial object

## Data Flow and Update Cycle

1. The `OrbitManager` receives updates about celestial objects through an Observable
2. Each frame, `updateAllVisualizations()` is called to refresh visualizations:

   - Removes visualizations for deleted celestial objects
   - Updates visualizations based on current object states
   - For Keplerian mode: Updates static orbit lines around parent bodies
   - For Verlet mode: Adds new points to trails and periodically recalculates predictions

3. When an object is highlighted, the visualization is enhanced:
   - Lines are highlighted with a distinctive color
   - In Verlet mode, prediction lines are calculated and displayed

## Performance Optimizations

The package implements several optimizations to maintain performance:

1. **Throttled updates**:

   - Trail geometries are updated every `trailUpdateFrequency` frames
   - Predictions are recalculated every `predictionUpdateFrequency` frames
   - These throttled updates reduce computational load and GPU data transfers

2. **Buffer optimization**:

   - Reuses existing buffer geometries when possible
   - Pre-allocates buffers to reduce memory allocations
   - Only updates the active portion of buffers (using `setDrawRange`)

3. **Barnes-Hut approximation**:

   - Uses an Octree for efficient N-body calculations in Verlet prediction
   - Reduces the computational complexity from O(n²) to O(n log n)

4. **Selective calculations**:
   - Only calculates predictions for the highlighted object
   - Trails have variable length based on the `trailLengthMultiplier` setting

## Integration with Other Packages

The `threejs-orbits` package integrates with several other Teskooano packages:

1. `@teskooano/core-physics`: For physics calculations and integration methods
2. `@teskooano/core-state`: For accessing celestial object data
3. `@teskooano/renderer-threejs-objects`: For adding and removing lines from the scene
4. `@teskooano/data-types`: For common types and scaling constants

It communicates with the main renderer through the `ObjectManager` and `RendererStateAdapter` interfaces.

## Code Organization

### Current Structure

```
packages/renderer/threejs-orbits/
├── src/
│   ├── index.ts                   # Main exports
│   ├── OrbitManager.ts            # Primary controller class
│   └── orbit-manager/             # Specialized components
│       ├── index.ts               # Submodule exports
│       ├── keplerian-manager.ts   # Manages Keplerian orbits
│       ├── orbit-calculator.ts    # Calculates orbit points
│       ├── orbit-line-builder.ts  # Utilities for line creation
│       └── verlet-predictor.ts    # Trajectory prediction (Now removed)
```

### Improved Structure (Proposed)

```
packages/renderer/threejs-orbits/
├── src/
│   ├── index.ts                    # Main exports
│   ├── core/                       # Core visualization components
│   │   ├── index.ts                # Core exports
│   │   ├── OrbitsManager.ts        # Main controller (renamed from OrbitManager.ts)
│   │   └── SharedMaterials.ts      # Shared materials definitions
│   ├── keplerian/                  # Keplerian orbit visualization
│   │   ├── index.ts                # Keplerian exports
│   │   ├── KeplerianManager.ts     # Keplerian orbit manager (renamed)
│   │   └── OrbitCalculator.ts      # Orbit calculations (renamed)
│   ├── verlet/                     # Verlet-based visualizations
│   │   ├── index.ts                # Verlet exports
│   │   ├── TrailManager.ts         # Trail visualization
│   │   └── PredictionManager.ts    # Prediction visualization
│   └── utils/                      # Shared utilities
│       ├── index.ts                # Utils exports
│       ├── LineBuilder.ts          # THREE.js line creation helpers (renamed)
│       └── BufferPool.ts           # Buffer management utilities
```

## Known Limitations and Potential Improvements

1. **File Organization**: The codebase would benefit from better file organization, with more cohesive naming and component placement.

2. **Separation of Concerns**: The `OrbitManager` class handles too many responsibilities. It could be refactored to better separate:

   - Line management (creation, update, disposal)
   - Visualization mode handling
   - Highlighting and visibility
   - Trail and prediction calculations

~~3. **Physics Duplication**: The Verlet prediction logic partially duplicates physics calculations already available in the core-physics package.~~ DONE

4. **Hard-coded Parameters**: Many parameters (like prediction duration, update frequencies) are hard-coded and could be made configurable.

5. **Memory Management**: The package includes several memory optimization techniques:
   - Buffer pooling system that reuses Float32Array buffers instead of creating new ones
   - Shared materials instead of cloning for each line
   - Periodic cleanup of position history data
   - Proper disposal of THREE.js resources (geometries and materials)
   - Limited storage of prediction data only for the highlighted object

## Conclusion

The `threejs-orbits` package provides a flexible system for orbit visualization with two complementary modes. Despite some organizational issues, the code effectively implements the necessary mathematics and optimizations to visualize both idealized Keplerian orbits and physically simulated trajectories in an interactive 3D environment.
