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
