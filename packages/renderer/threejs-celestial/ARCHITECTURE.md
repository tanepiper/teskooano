# Architecture: @teskooano/renderer-threejs-celestial

This package provides the foundational infrastructure for celestial object rendering in the Teskooano project. It contains the base classes, interfaces, and utilities that all celestial renderers build upon.

## Package Structure

```
src/
├── base/
│   ├── CelestialRenderer.ts      # Core interface and light management utilities
│   ├── BaseCelestialRenderer.ts  # Abstract base class with common functionality
│   ├── types.ts                  # Type definitions and configuration interfaces
│   └── index.ts                  # Barrel exports
├── billboards/
│   ├── manager.ts                # BillboardManager class
│   ├── billboard-utils.ts        # Utility functions for billboard creation
│   ├── types.ts                  # Billboard-specific type definitions
│   └── index.ts                  # Barrel exports
└── index.ts                      # Main package exports
```

## Core Components

### 1. CelestialRenderer Interface

The `CelestialRenderer` interface defines the contract that all celestial renderers must implement:

```typescript
interface CelestialRenderer {
  getLODLevels(object: RenderableCelestialObject, options?: CelestialMeshOptions): LODLevel[];
  update(object: RenderableCelestialObject, time: number, timeScale: number,
         lightSources: LightSourcesMap, camera: THREE.Camera, ...): void;
  updateLOD?(objectId: string, camera: THREE.Camera): void;
  dispose(): void;
  materials: Map<string, THREE.Material | THREE.Material[]>;
  initialize(object: RenderableCelestialObject, options?: CelestialMeshOptions): void;
  getLOD(object: RenderableCelestialObject): THREE.LOD | undefined;
}
```

### 2. BaseCelestialRenderer Abstract Class

The `BaseCelestialRenderer` provides common functionality for all renderers:

**Key Features:**

- **Material Management**: Automatic tracking and disposal of materials and textures
- **LOD Management**: Built-in support for Level of Detail objects
- **Billboard Integration**: Integrated billboard management for distant representations
- **Light Source Handling**: Utilities for finding and managing primary light sources
- **Resource Cleanup**: Comprehensive disposal methods to prevent memory leaks

**Core Methods:**

- `abstract getLODLevels()` - Must be implemented by subclasses
- `update()` - Updates LOD and billboard visibility (can be extended)
- `dispose()` - Cleans up all managed resources
- `registerMaterial()` - Tracks materials for automatic disposal
- `findPrimaryLightSource()` - Finds the most influential light for an object

### 3. Light Management System

The package includes utilities for managing light sources in shaders:

**LightArrayUtils Class:**

- `createLightSourceArray()` - Creates initial light source arrays
- `createShadowCasterArray()` - Creates shadow caster arrays
- `resizeLightArray()` - Dynamically resizes light arrays while preserving data
- `resizeShadowCasterArray()` - Dynamically resizes shadow caster arrays

**Light Source Types:**

- `LightSourceData` - Individual light source information
- `LightSourcesMap` - Map of light sources by ID

### 4. Billboard Management System

The billboard system provides sprite-based representations for distant celestial objects:

**BillboardManager Class:**

- Manages lifecycle and visibility of billboard sprites
- Handles opacity and light intensity fading based on camera distance
- Creates standardized billboard LOD levels
- Provides shared texture caching for performance

**Key Features:**

- **Distance-based Visibility**: Billboards activate at configurable distances
- **Smooth Fading**: Gradual opacity and light intensity transitions
- **Resource Sharing**: Static texture caching across all billboards
- **Performance Optimized**: Minimal allocations during updates

## Design Patterns

### 1. Template Method Pattern

`BaseCelestialRenderer` uses the Template Method pattern where:

- The base class defines the algorithm structure (`update`, `dispose`)
- Subclasses implement specific steps (`getLODLevels`)
- Common functionality is provided by the base class

### 2. Resource Management Pattern

All renderers follow a consistent resource management pattern:

- Materials and textures are registered for tracking
- Resources are automatically disposed when no longer needed
- Memory leaks are prevented through comprehensive cleanup

### 3. Strategy Pattern (Billboard System)

The billboard system uses configurable strategies for:

- Visibility distance calculations
- Fading behavior
- Light intensity calculations

## Integration Points

### With Core Systems

- **@teskooano/data-types**: Provides `RenderableCelestialObject` and related types
- **@teskooano/renderer-threejs-lighting**: Integrates with lighting management
- **@teskooano/renderer-threejs-lod**: Uses LOD utilities and types

### With Celestial Systems

- **@teskooano/systems-celestial**: Uses these base classes for specific renderers
- **Renderer Factories**: Factory functions use these interfaces and base classes

## Performance Considerations

### 1. Memory Management

- Automatic material and texture disposal
- Shared billboard texture caching
- Reusable Vector3 instances to reduce allocations

### 2. Update Efficiency

- LOD updates only when necessary
- Billboard visibility calculations optimized for large numbers of objects
- Smooth interpolation to avoid jarring transitions

### 3. Resource Sharing

- Static billboard texture shared across all instances
- Light array utilities designed for efficient resizing

## Future Architecture Evolution

This package is designed to support the migration toward a compositional rendering architecture:

1. **Current State**: Inheritance-based system with `BaseCelestialRenderer`
2. **Future State**: Layer-based composition system (see `TARGET_ARCHITECTURE.md`)
3. **Migration Path**: Base classes will evolve to support both patterns during transition

The package structure allows for gradual introduction of new patterns while maintaining backward compatibility with existing renderers.
