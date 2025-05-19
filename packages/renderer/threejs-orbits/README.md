# @teskooano/renderer-threejs-orbits

Visualization of orbital paths using Three.js for the Teskooano space simulation engine.

## Features

- Keplerian orbit visualization (static elliptical paths)
- Verlet-based trajectory visualization (dynamic trails and predictions)
- Memory-efficient buffer management
- Togglable visualization modes

## Architecture

This package is currently undergoing a refactoring process to improve its architecture and organization. See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview of the current and future structure.

## Current Refactoring Status

The refactoring is now complete while maintaining backward compatibility:

- [x] Memory management improvements
- [x] Physics calculation redundancy removed
- [x] New directory structure created
- [x] Utility classes extracted
- [x] Keplerian orbit visualization refactored
- [x] Verlet visualization refactored
- [x] Main OrbitManager refactored to OrbitsManager

## Usage

### Legacy API (backward compatible)

```typescript
// Create an OrbitManager instance
const orbitManager = new OrbitManager(
  objectManager,
  stateAdapter,
  renderableStore.renderableObjects$,
);

// Toggle between Keplerian and Verlet modes
orbitManager.setVisualizationMode(LegacyVisualizationMode.Keplerian);
orbitManager.setVisualizationMode(LegacyVisualizationMode.Verlet);

// Toggle orbit visualization
orbitManager.toggleVisualization();

// Highlight an object's orbit
orbitManager.highlightVisualization("celestialObjectId");

// Update visualizations (call per frame)
orbitManager.updateAllVisualizations();

// Clean up resources
orbitManager.dispose();
```

### New API (preferred for new code)

```typescript
// Create an OrbitsManager instance
const orbitsManager = new OrbitsManager(
  objectManager,
  stateAdapter,
  renderableStore.renderableObjects$,
);

// Toggle between Keplerian and Verlet modes
orbitsManager.setVisualizationMode(VisualizationMode.Keplerian);
orbitsManager.setVisualizationMode(VisualizationMode.Verlet);

// Toggle orbit visualization
orbitsManager.toggleVisualization();

// Highlight an object's orbit
orbitsManager.highlightVisualization("celestialObjectId");

// Update visualizations (call per frame)
orbitsManager.updateAllVisualizations();

// Clean up resources
orbitsManager.dispose();
```

# Trail Smoothing

The package now includes a trail smoothing feature that uses Catmull-Rom spline interpolation to create visually appealing, smooth trails instead of jagged lines. This creates more aesthetically pleasing visualizations while still maintaining the fundamental accuracy of the simulation.

## Usage Example

```typescript
// Get the OrbitsManager instance (typically from your renderer)
const orbitsManager = renderer.getOrbitsManager();

// Enable smoothing with default settings (enabled with 6 subdivisions)
orbitsManager.setTrailOptions({
  smoothLines: true,
  smoothingSubdivisions: 6,
});

// Disable smoothing if you prefer exact paths
orbitsManager.setTrailOptions({ smoothLines: false });

// Increase subdivisions for smoother curves (higher performance cost)
orbitsManager.setTrailOptions({ smoothingSubdivisions: 12 });

// Decrease subdivisions for better performance
orbitsManager.setTrailOptions({ smoothingSubdivisions: 3 });
```

The `smoothingSubdivisions` parameter controls how many interpolated points are generated between each original position point. Higher values create smoother curves but require more memory and processing.
