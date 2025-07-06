# @teskooano/renderer-threejs-celestial

Core celestial rendering infrastructure for the Teskooano project, providing base classes, interfaces, and utilities for rendering celestial objects in Three.js.

## Overview

This package contains the foundational components that all celestial renderers build upon:

- **Base Renderer Classes**: Abstract base classes that provide common functionality
- **Interfaces & Types**: Common interfaces and type definitions for celestial rendering
- **Billboard Management**: Utilities for managing billboard sprites at long distances
- **Utility Functions**: Helper functions for LOD calculations, material management, and more

## Key Components

### Base Renderer Infrastructure

- `CelestialRenderer` - Core interface all renderers must implement
- `BaseCelestialRenderer` - Abstract base class with common functionality
- `LightArrayUtils` - Utilities for managing light sources in shaders

### Billboard System

- `BillboardManager` - Manages sprite-based LOD representations
- `BillboardLODConfig` - Configuration for billboard appearance and behavior
- Billboard utility functions for sprite creation and management

### Types and Options

- `CelestialMeshOptions` - Configuration options for mesh creation
- `BaseCelestialRendererOptions` - Base renderer configuration
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
  getLODLevels(object: RenderableCelestialObject): LODLevel[] {
    // Implementation specific to your celestial type
  }
}
```

## Architecture

This package follows the established patterns for celestial rendering:

1. **Inheritance-based Structure**: Renderers extend `BaseCelestialRenderer`
2. **Resource Management**: Automatic tracking and disposal of materials and textures
3. **LOD Support**: Built-in Level of Detail management
4. **Billboard Integration**: Seamless integration of sprite-based distant representations

## Dependencies

- `@teskooano/data-types` - Core data structures
- `@teskooano/renderer-threejs-lighting` - Lighting system integration
- `@teskooano/renderer-threejs-lod` - Level of Detail utilities
- `three` - Three.js core library

## Future Development

This package is designed to support the migration toward the compositional rendering architecture described in `TARGET_ARCHITECTURE.md`. The current inheritance-based system will gradually evolve to support more flexible, layer-based rendering approaches.
