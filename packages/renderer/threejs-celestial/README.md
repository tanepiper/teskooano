# @teskooano/renderer-threejs-celestial

Core celestial rendering infrastructure for the Teskooano project, providing base classes, interfaces, and utilities for rendering celestial objects in Three.js.

## Overview

This package contains the foundational components that all celestial renderers build upon:

- **Base Renderer Classes**: Abstract base classes that provide common functionality
- **Interfaces & Types**: Common interfaces and type definitions for celestial rendering
- **Orbital Data Management**: Centralized orbit data, position history, and LOD-based rendering control
- **Billboard Management**: Utilities for managing billboard sprites at long distances
- **Utility Functions**: Helper functions for LOD calculations, material management, and more

## Key Components

### Base Renderer Infrastructure

- `CelestialRenderer` - Core interface all renderers must implement
- `BaseCelestialRenderer` - Abstract base class with common functionality
- `LightArrayUtils` - Utilities for managing light sources in shaders

### Orbital Data Management

- `OrbitalManager` - Centralized orbit data management for each celestial object
- `OrbitalConfig` - Configuration for orbital data and LOD-based rendering control
- `PositionSample` - Position history with timestamps and velocity data
- Efficient circular buffers for position history with automatic memory management

### Billboard System

- `BillboardManager` - Manages sprite-based LOD representations
- `BillboardLODConfig` - Configuration for billboard appearance and behavior
- Billboard utility functions for sprite creation and management

### Types and Options

- `CelestialMeshOptions` - Configuration options for mesh creation
- `BaseCelestialRendererOptions` - Base renderer configuration including orbital settings
- `LightSourceData` & `LightSourcesMap` - Light source management types

## Usage

```typescript
import {
  BaseCelestialRenderer,
  CelestialRenderer,
  BillboardManager,
} from "@teskooano/renderer-threejs-celestial";

// Extend the base renderer for your celestial type
class MyCustomRenderer extends BaseCelestialRenderer {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, {
      ...options,
      orbitalConfig: {
        maxHistoryPoints: 2000,
        minDistanceThreshold: 1e-5,
        showOrbitLines: true,
        showPredictionLines: false,
        orbitLineLODDistance: 1500,
        trailLODDistance: 800,
      },
    });
  }

  getLODLevels(object: RenderableCelestialObject): LODLevel[] {
    // Implementation specific to your celestial type
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
  ): void {
    // Call parent update to handle orbital data
    super.update(object, time, timeScale, lightSources, camera);

    // Access orbital data for rendering
    const positionHistory = this.getPositionHistory(500);
    const cameraDistance = camera.position.distanceTo(object.position);

    // Check LOD-based visibility
    if (
      this.shouldShowTrailLines(cameraDistance, object.type) &&
      positionHistory.length > 1
    ) {
      this.renderTrail(positionHistory);
    }

    if (this.shouldShowOrbitLines(cameraDistance, object.type)) {
      this.renderOrbitLines();
    }
  }
}
```

## Orbital Data Management

The `BaseCelestialRenderer` now includes integrated orbital data management through the `OrbitalManager`:

### Key Features

- **Position History**: Efficient circular buffers store recent position data with timestamps
- **LOD-Based Rendering**: Automatic visibility control for orbit lines and trails based on camera distance
- **Memory Efficient**: Pre-allocated buffers and intelligent sampling to minimize memory usage
- **Performance Optimized**: Throttled updates and distance-based sampling to prevent excessive processing

### Configuration

```typescript
interface OrbitalConfig {
  maxHistoryPoints: number; // Maximum position history points
  minDistanceThreshold: number; // Minimum movement before sampling
  showOrbitLines: boolean; // Whether to show orbit lines
  showPredictionLines: boolean; // Whether to show prediction lines
  orbitLineLODDistance: number; // LOD distance for orbit lines
  trailLODDistance: number; // LOD distance for trails
}
```

### Available Methods

- `getCurrentPosition()` - Get current position as OSVector3
- `getPositionHistory(maxPoints)` - Get position history for trail rendering
- `shouldShowOrbitLines(cameraDistance, objectType)` - LOD-based orbit line visibility
- `shouldShowTrailLines(cameraDistance, objectType)` - LOD-based trail visibility
- `setHighlighted(highlighted)` - Control highlighting state
- `getOrbitalMemoryStats()` - Memory usage statistics

## Architecture

This package follows the established patterns for celestial rendering:

1. **Inheritance-based Structure**: Renderers extend `BaseCelestialRenderer`
2. **Resource Management**: Automatic tracking and disposal of materials and textures
3. **LOD Support**: Built-in Level of Detail management
4. **Orbital Integration**: Centralized orbit data management with LOD-based rendering control
5. **Billboard Integration**: Seamless integration of sprite-based distant representations

## Dependencies

- `@teskooano/data-types` - Core data structures
- `@teskooano/core-math` - Vector mathematics (OSVector3)
- `@teskooano/renderer-threejs-lighting` - Lighting system integration
- `@teskooano/renderer-threejs-lod` - Level of Detail utilities
- `three` - Three.js core library

## Future Development

This package is designed to support the migration toward the compositional rendering architecture described in `TARGET_ARCHITECTURE.md`. The current inheritance-based system will gradually evolve to support more flexible, layer-based rendering approaches while maintaining the benefits of centralized orbital data management.
