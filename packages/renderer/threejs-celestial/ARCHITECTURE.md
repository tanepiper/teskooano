# Architecture: @teskooano/renderer-threejs-celestial

This package provides the foundational infrastructure for celestial object rendering in the Teskooano project. It contains the base classes, interfaces, and utilities that all celestial renderers build upon, including centralized orbital data management.

## Package Structure

```
src/
├── base/
│   ├── CelestialRenderer.ts      # Core interface and light management utilities
│   ├── BaseCelestialRenderer.ts  # Abstract base class with common functionality
│   ├── types.ts                  # Type definitions and configuration interfaces
│   ├── managers/
│   │   ├── MaterialManager.ts    # Material lifecycle management
│   │   ├── LODManager.ts         # Level of Detail management
│   │   ├── CelestialLightingManager.ts # Lighting calculations
│   │   ├── TimeManager.ts        # Time tracking and calculations
│   │   ├── OrbitalManager.ts     # Orbital data and position history
│   │   ├── CircularBuffer.ts     # Memory-efficient circular buffer
│   │   └── index.ts              # Manager exports
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
- **Orbital Data Management**: Centralized position history and LOD-based rendering control
- **Billboard Integration**: Integrated billboard management for distant representations
- **Light Source Handling**: Utilities for finding and managing primary light sources
- **Resource Cleanup**: Comprehensive disposal methods to prevent memory leaks

**Core Methods:**

- `abstract getLODLevels()` - Must be implemented by subclasses
- `update()` - Updates orbital data, LOD, and billboard visibility (can be extended)
- `dispose()` - Cleans up all managed resources
- `registerMaterial()` - Tracks materials for automatic disposal
- `findPrimaryLightSource()` - Finds the most influential light for an object

### 3. Orbital Data Management System

The `OrbitalManager` provides centralized orbital data management for each celestial object:

**Key Features:**

- **Position History**: Efficient circular buffers store recent position data with timestamps
- **LOD-Based Rendering**: Automatic visibility control for orbit lines and trails based on camera distance
- **Memory Efficiency**: Pre-allocated buffers and intelligent sampling to minimize memory usage
- **Performance Optimization**: Throttled updates and distance-based sampling

**OrbitalManager Class:**

```typescript
class OrbitalManager {
  // Position history management
  getCurrentPosition(): OSVector3;
  getPositionHistory(maxPoints?: number): OSVector3[];
  getPositionHistoryWithTimestamps(maxPoints?: number): PositionSample[];

  // LOD-based visibility control
  shouldShowOrbitLines(
    cameraDistance: number,
    objectType: CelestialType,
  ): boolean;
  shouldShowTrailLines(
    cameraDistance: number,
    objectType: CelestialType,
  ): boolean;
  shouldShowPredictionLines(): boolean;

  // State management
  setHighlighted(highlighted: boolean): void;
  setShowPredictionLines(show: boolean): void;

  // Configuration and monitoring
  updateConfig(newConfig: Partial<OrbitalConfig>): void;
  getOrbitalMemoryStats(): MemoryStats;
}
```

**Integration with Renderers:**

The `BaseCelestialRenderer` provides delegation methods for subclasses to access orbital data:

```typescript
// Protected methods available to subclasses
protected getCurrentPosition(): OSVector3;
protected getPositionHistory(maxPoints?: number): OSVector3[];
protected shouldShowOrbitLines(cameraDistance: number, objectType: CelestialType): boolean;
protected shouldShowTrailLines(cameraDistance: number, objectType: CelestialType): boolean;
protected setHighlighted(highlighted: boolean): void;
```

### 4. Light Management System

The package includes utilities for managing light sources in shaders:

**LightArrayUtils Class:**

- `createLightSourceArray()` - Creates initial light source arrays
- `createShadowCasterArray()` - Creates shadow caster arrays
- `resizeLightArray()` - Dynamically resizes light arrays while preserving data
- `resizeShadowCasterArray()` - Dynamically resizes shadow caster arrays

**Light Source Types:**

- `LightSourceData` - Individual light source information
- `LightSourcesMap` - Map of light sources by ID

### 5. Billboard Management System

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

### 2. Manager Pattern

The package uses specialized manager classes for different concerns:

- **MaterialManager**: Handles material lifecycle and disposal
- **LODManager**: Manages Level of Detail objects and transitions
- **OrbitalManager**: Manages orbital data and position history
- **TimeManager**: Handles time tracking and calculations
- **CelestialLightingManager**: Manages lighting calculations and shadow casters

### 3. Resource Management Pattern

All renderers follow a consistent resource management pattern:

- Materials and textures are registered for tracking
- Resources are automatically disposed when no longer needed
- Memory leaks are prevented through comprehensive cleanup

### 4. Strategy Pattern (Billboard System)

The billboard system uses configurable strategies for:

- Visibility distance calculations
- Fading behavior
- Light intensity calculations

## Integration Points

### With Core Systems

- **@teskooano/data-types**: Provides `RenderableCelestialObject` and related types
- **@teskooano/core-math**: Provides `OSVector3` for efficient vector operations
- **@teskooano/renderer-threejs-lighting**: Integrates with lighting management
- **@teskooano/renderer-threejs-lod**: Uses LOD utilities and types

### With Celestial Systems

- **@teskooano/systems-celestial**: Uses these base classes for specific renderers
- **Renderer Factories**: Factory functions use these interfaces and base classes

### With Physics Engine

- **@teskooano/core-physics**: The OrbitalManager reads position and velocity data from `RenderableCelestialObject`
- **Data Flow**: Physics engine updates object positions → OrbitalManager stores data → Rendering systems read data for visualization

## Performance Considerations

### 1. Memory Management

- Automatic material and texture disposal
- Shared billboard texture caching
- Reusable Vector3 instances to reduce allocations
- Circular buffers for position history to prevent memory leaks

### 2. Update Efficiency

- LOD updates only when necessary
- Billboard visibility calculations optimized for large numbers of objects
- Smooth interpolation to avoid jarring transitions
- Throttled orbital updates to prevent excessive processing

### 3. Resource Sharing

- Static billboard texture shared across all instances
- Light array utilities designed for efficient resizing
- Circular buffer implementation for efficient position history management

### 4. Orbital Data Optimization

- Distance-based sampling to avoid redundant position data
- Configurable history sizes to balance memory usage and detail
- LOD-based visibility to reduce rendering overhead
- Pre-allocated buffers to minimize garbage collection

## Future Architecture Evolution

This package is designed to support the migration toward a compositional rendering architecture:

1. **Current State**: Inheritance-based system with `BaseCelestialRenderer` and integrated `OrbitalManager`
2. **Future State**: Layer-based composition system (see `TARGET_ARCHITECTURE.md`)
3. **Migration Path**: Base classes will evolve to support both patterns during transition

The package structure allows for gradual introduction of new patterns while maintaining backward compatibility with existing renderers and preserving the benefits of centralized orbital data management.

## Benefits of Orbital Integration

The integration of orbital data management into the base renderer provides several key benefits:

1. **Centralized Data Management**: Each celestial object owns its orbital data, making it available to both physics and rendering systems
2. **LOD Integration**: Automatic visibility control based on camera distance and object type
3. **Performance Optimization**: Efficient memory management and throttled updates
4. **Clean API**: Simple delegation methods for renderers to access orbital data
5. **Future-Proof**: Designed to work with both current inheritance-based and future compositional architectures
