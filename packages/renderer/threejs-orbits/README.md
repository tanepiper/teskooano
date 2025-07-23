# `@teskooano/renderer-threejs-orbits`

A comprehensive orbit visualization system for the Teskooano space simulation, supporting both ideal (Keplerian) and N-body physics modes with high-performance rendering and real-time trajectory prediction.

## Overview

This package provides sophisticated visualization of orbital paths and trajectories in 3D space. It supports two distinct visualization modes that correspond to the underlying physics engines:

- **Ideal Mode**: Renders perfect elliptical orbits based on analytical Keplerian orbital parameters
- **N-Body Mode**: Renders dynamic trails and predictions based on real-time N-body physics simulation

## Key Features

- **Dual Visualization Modes**: Seamless switching between ideal and N-body orbit visualization
- **Real-time Trajectory Prediction**: Advanced physics-based prediction of future object paths
- **Historical Trail Visualization**: Dynamic trails showing recent object movement
- **Performance Optimized**: Web Worker offloading for heavy calculations
- **Memory Efficient**: Object pooling and buffer reuse to minimize garbage collection
- **Quality Control**: Configurable trail quality and prediction accuracy settings

## Architecture

The package follows a **Strategy Pattern** architecture with clear separation of concerns:

### Core Components

- **`OrbitsManager`**: Main facade and coordinator that switches between visualization strategies
- **`IdealStrategy`**: Renders perfect Keplerian orbits using analytical calculations
- **`NBodyStrategy`**: Renders dynamic trails and predictions using N-body physics
- **`KeplerianManager`**: Manages static elliptical orbit lines
- **`TrailManager`**: Manages historical trajectory trails with optional simplification
- **`PredictionManager`**: Manages future trajectory predictions with physics simulation

### Performance Features

- **Web Worker Offloading**: Heavy calculations (trail processing, trajectory prediction) run in background workers
- **Memory Pooling**: Efficient buffer and object reuse to minimize allocations
- **Throttled Updates**: Configurable update frequencies to balance performance and accuracy
- **LOD Support**: Quality settings that adapt to system performance

## Usage

```typescript
import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";

// Create the orbits manager
const orbitsManager = new OrbitsManager(
  objectManager,
  stateAdapter,
  renderableObjects$,
  layer2DManager,
);

// Update visualizations each frame
orbitsManager.updateAllVisualizations(deltaTime);

// Control visibility
orbitsManager.setOrbitTrailsVisibility(true);
orbitsManager.setPredictionVisibility(true);

// Highlight specific objects
orbitsManager.highlightVisualization(objectId);

// Clean up resources
orbitsManager.dispose();
```

## Visualization Modes

### Ideal Mode (Keplerian)

- Perfect elliptical orbits based on orbital parameters
- Static, mathematically precise paths
- Efficient rendering with minimal computation
- Suitable for stable, well-defined orbital systems

### N-Body Mode

- Dynamic trails showing actual object movement
- Real-time trajectory predictions using physics simulation
- Handles complex gravitational interactions
- Supports multiple algorithms (direct, Barnes-Hut, FMM, etc.)

## Performance Considerations

- **Trail Updates**: Throttled to every 10 frames by default
- **Prediction Updates**: Throttled to every 90 frames by default
- **Memory Management**: Automatic cleanup of unused trails and predictions
- **Worker Communication**: Efficient data serialization for minimal transfer overhead

## Dependencies

- `@teskooano/core-physics`: For trajectory prediction calculations
- `@teskooano/core-math`: For vector mathematics (OSVector3)
- `@teskooano/data-types`: For celestial object definitions
- `@teskooano/core-state`: For simulation state access
- `@teskooano/renderer-threejs-objects`: For scene object management
- `@teskooano/renderer-threejs-labels`: For 2D label management

## Development

The package is organized into logical modules:

- `/core`: Main manager and strategy interfaces
- `/keplerian`: Ideal orbit visualization
- `/renderers`: Trail and prediction managers
- `/utils`: Performance utilities and data structures

Each module includes comprehensive documentation and follows established architectural patterns for maintainability and performance.
