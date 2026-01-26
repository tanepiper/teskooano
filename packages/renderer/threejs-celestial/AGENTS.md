# AGENTS.md

A guide for AI coding agents working on the ThreeJS Celestial package for Teskooano.

## Package Overview

The **ThreeJS Celestial package** (`@teskooano/renderer-threejs-celestial`) provides the foundational infrastructure for celestial object rendering in the Teskooano project. It contains base classes, interfaces, and utilities that all celestial renderers build upon, including centralized orbital data management and billboard systems.

## Key Features

- **Base Renderer Infrastructure**: Abstract base classes and interfaces for all celestial renderers
- **Orbital Data Management**: Centralized orbit data, position history, and LOD-based rendering control
- **Billboard Management**: Utilities for managing billboard sprites at long distances
- **Lighting System**: Comprehensive lighting calculations, shadow casting, and light source management
- **Performance Optimization**: Advanced geometry utilities with performance-based segment calculations
- **Resource Management**: Automatic material and texture tracking with comprehensive cleanup
- **Manager Architecture**: Specialized manager classes for different rendering concerns

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js 0.180.0

### Development Commands

```bash
# Run tests
moon run threejs-celestial:test

# Run browser tests
moon run threejs-celestial:test:browser

# Run tests in watch mode
moon run threejs-celestial:test:watch

# Run tests with UI
moon run threejs-celestial:test:ui

# Build package
moon run threejs-celestial:build

# Lint code
moon run threejs-celestial:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                           # Main entry point
├── base/                              # Core base classes and interfaces
│   ├── CelestialRenderer.ts           # Core interface for all renderers
│   ├── BaseCelestialRenderer.ts       # Abstract base class with common functionality
│   ├── types.ts                       # Type definitions and configuration interfaces
│   ├── lighting/                      # Lighting system components
│   │   ├── LightingCalculator.ts      # Instance-based lighting calculations
│   │   ├── ShadowCasterUtils.ts       # Shadow caster detection and management
│   │   └── LightArrayUtils.ts         # Light array management for shaders
│   ├── managers/                      # Specialized manager classes
│   │   ├── MaterialManager.ts         # Material lifecycle management
│   │   ├── LODManager.ts              # Level of Detail management
│   │   ├── CelestialLightingManager.ts # Lighting calculations and management
│   │   ├── TimeManager.ts             # Time tracking and calculations
│   │   ├── PositionHistoryManager.ts  # Orbital data and position history
│   │   ├── GeometryUtilities.ts       # Performance-optimized geometry utilities
│   │   └── PerformanceMonitor.ts      # Performance monitoring and optimization
│   └── index.ts                       # Barrel exports
├── billboards/                        # Billboard management system
│   ├── manager.ts                     # BillboardManager class
│   ├── billboard-utils.ts             # Utility functions for billboard creation
│   ├── types.ts                       # Billboard-specific type definitions
│   └── index.ts                       # Barrel exports
├── debug/                             # Debug utilities
│   ├── CelestialRendererDebugHelper.ts # Debug visualization and data collection
│   └── createFallbackSphere.ts        # Fallback sphere creation
└── __tests__/                         # Test files
    ├── base/
    │   ├── CelestialRenderer.spec.ts
    │   ├── BaseCelestialRenderer.spec.ts
    │   └── managers/
    │       ├── LODManager.spec.ts
    │       ├── MaterialManager.spec.ts
    │       └── TimeManager.spec.ts
    └── billboards/
        ├── manager.spec.ts
        └── billboard-utils.spec.ts
```

### Data Flow

1. **Object Creation**: BaseCelestialRenderer initializes with specialized managers
2. **Orbital Management**: PositionHistoryManager tracks position history and LOD-based visibility
3. **Lighting Calculation**: CelestialLightingManager handles light sources and shadow casting
4. **Material Management**: MaterialManager tracks and disposes of materials and textures
5. **LOD Management**: LODManager handles Level of Detail objects and transitions
6. **Billboard Integration**: BillboardManager provides sprite-based distant representations
7. **Performance Optimization**: GeometryUtilities provides performance-based segment calculations

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and parameters
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use PascalCase for class files (e.g., `BaseCelestialRenderer.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use OSVector3 for calculations, convert to THREE.Vector3 for rendering
- **Performance**: Minimize object creation, use efficient algorithms
- **Memory Management**: Proper disposal of Three.js resources
- **Configuration**: Use options objects for complex parameters

## Key Components

### Base Celestial Renderer

```typescript
export abstract class BaseCelestialRenderer<
  TMaterial extends THREE.Material = THREE.Material,
> implements CelestialRenderer {
  constructor(
    objectOrOptions: RenderableCelestialObject | BaseCelestialRendererOptions,
    options?: BaseCelestialRendererOptions,
  );
  abstract getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void;
  dispose(): void;

  // Manager access
  protected materialManager: MaterialManager;
  protected lodManager: LODManager;
  protected lightingManager: CelestialLightingManager;
  protected timeManager: TimeManager;
  protected billboardManager: BillboardManager;
  public positionHistoryManager: PositionHistoryManager;
}
```

### Position History Manager

```typescript
export class PositionHistoryManager {
  constructor(
    objectId: string,
    config: Partial<OrbitalConfig>,
    renderer: BaseCelestialRenderer,
  );
  update(object: RenderableCelestialObject, time: number): void;
  getCurrentPosition(): OSVector3;
  getCurrentVelocity(): OSVector3;
  getPositionHistory(maxPoints?: number): OSVector3[];
  getPositionHistoryWithTimestamps(maxPoints?: number): TimePoint[];
  shouldShowOrbitLines(
    cameraDistance: number,
    objectType: CelestialType,
  ): boolean;
  shouldShowTrailLines(
    cameraDistance: number,
    objectType: CelestialType,
  ): boolean;
  shouldShowPredictionLines(): boolean;
  setHighlighted(highlighted: boolean): void;
  setShowPredictionLines(show: boolean): void;
  getMemoryStats(): MemoryStats;
  dispose(): void;
}
```

### Celestial Lighting Manager

```typescript
export class CelestialLightingManager {
  constructor(renderer?: BaseCelestialRenderer);
  updateLightSources(lightSources: LightSourcesMap): void;
  applyLightAttenuation(
    config?: LightingConfig,
    forceRefresh?: boolean,
  ): LightSourcesMap;
  findShadowCasters(forceRefresh?: boolean): ShadowCasterData[];
  findRingShadowCasters(forceRefresh?: boolean): ShadowCasterData[];
  findClosestLightSource(forceRefresh?: boolean): LightSourceData | null;
  findPrimaryLightSource(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): LightSourceData | null;
  calculateDynamicAmbientLight(forceRefresh?: boolean): number;
  initializeLightingCalculator(object: RenderableCelestialObject): void;
  updateLightingCalculator(
    object: RenderableCelestialObject,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): void;
  dispose(): void;
}
```

### Billboard Manager

```typescript
export class BillboardManager {
  constructor();
  createBillboardLOD(
    object: RenderableCelestialObject,
    config: BillboardLODConfig,
  ): LODLevel;
  update(
    camera: THREE.PerspectiveCamera,
    allObjects: Record<string, RenderableCelestialObject>,
    allMeshes: Record<string, THREE.Object3D>,
  ): void;
  dispose(): void;

  // Static methods
  static getBillboardTexture(): THREE.CanvasTexture;
}
```

### Geometry Utilities

```typescript
export class GeometryUtilities {
  static updatePerformanceConfig(config: Partial<PerformanceConfig>): void;
  static getSegmentsForDetailLevel(
    detailLevel?: DetailLevel | string,
    defaultSegments?: number,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number;
  static getOptimizedHighDetailSegments(
    detailLevel?: DetailLevel | string,
    defaultSegments?: number,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number;
  static getOptimizedRingSegments(
    detailLevel?: DetailLevel | string,
    defaultSegments?: number,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number;
  static getOptimizedStarSegments(
    detailLevel?: DetailLevel | string,
    defaultSegments?: number,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number;
  static getOptimizedAtmosphereSegments(
    detailLevel?: DetailLevel | string,
    defaultSegments?: number,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number;
  static createSphereGeometry(
    radius: number,
    detailLevel?: DetailLevel | string,
  ): THREE.SphereGeometry;
  static createPlaneGeometry(
    width: number,
    height: number,
    detailLevel?: DetailLevel | string,
  ): THREE.PlaneGeometry;
  static createRingGeometry(
    innerRadius: number,
    outerRadius: number,
    detailLevel?: DetailLevel | string,
  ): THREE.RingGeometry;
  static getWorldPosition(object: RenderableCelestialObject): THREE.Vector3;
  static isObjectInViewFrustum(
    object: RenderableCelestialObject,
    camera: THREE.PerspectiveCamera,
    padding?: number,
  ): boolean;
}
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for base classes, integration tests for manager interactions
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs-celestial:test

# Run browser tests
moon run threejs-celestial:test:browser

# Run specific test file
moon run threejs-celestial:test -- BaseCelestialRenderer.spec.ts

# Run tests with UI
moon run threejs-celestial:test:ui
```

### Test Patterns

- **Manager Testing**: Test individual manager classes with mocked dependencies
- **Integration Testing**: Test manager interactions and data flow
- **Performance Testing**: Test geometry utilities and performance optimizations
- **Memory Testing**: Test resource management and disposal

## Data Sources & Validation

### Primary Sources

- **Three.js Documentation**: Official Three.js API reference
- **Performance Metrics**: Built-in performance monitoring and optimization
- **Orbital Data**: Physics engine position and velocity data
- **Lighting Calculations**: Physically-based lighting and shadow casting

### Data Quality Standards

| Property                 | Accuracy         | Source                                  |
| ------------------------ | ---------------- | --------------------------------------- |
| Orbital Data             | High precision   | Physics engine integration              |
| Lighting Calculations    | Physically-based | Distance attenuation and shadow casting |
| Performance Optimization | Dynamic          | Real-time FPS monitoring                |
| Memory Management        | Automatic        | Resource tracking and disposal          |

### Validation Process

1. **Manager Validation**: Ensure proper manager initialization and interaction
2. **Performance Validation**: Test geometry optimization and performance monitoring
3. **Memory Validation**: Test resource management and cleanup
4. **Integration Validation**: Test with Three.js and other renderer packages

## Development Guidelines

### Adding New Components

1. **Follow Patterns**: Use established manager patterns and naming conventions
2. **Add Documentation**: Include comprehensive JSDoc comments
3. **Include Tests**: Add unit tests for new functionality
4. **Update Exports**: Add new components to appropriate index files
5. **Performance Consider**: Optimize for high-frequency operations

### Manager Development

- **Single Responsibility**: Each manager handles one specific concern
- **Resource Management**: Proper cleanup and disposal of resources
- **Performance Optimization**: Use caching and efficient algorithms
- **Integration**: Clean interfaces between managers

### Orbital Data Management

- **Centralized Storage**: Each object owns its orbital data
- **LOD Integration**: Automatic visibility control based on camera distance
- **Memory Efficiency**: Circular buffers and intelligent sampling
- **Performance**: Throttled updates and distance-based sampling

## Common Patterns

### Base Renderer Pattern

```typescript
export abstract class BaseCelestialRenderer<
  TMaterial extends THREE.Material = THREE.Material,
> implements CelestialRenderer {
  constructor(
    objectOrOptions: RenderableCelestialObject | BaseCelestialRendererOptions,
    options: BaseCelestialRendererOptions = {},
  ) {
    // Initialize managers
    this.materialManager = new MaterialManager();
    this.lodManager = new LODManager();
    this.lightingManager = new CelestialLightingManager();
    this.timeManager = new TimeManager();
    this.billboardManager = new BillboardManager();

    // Initialize orbital manager
    const object = objectOrOptions as RenderableCelestialObject;
    this.positionHistoryManager = new PositionHistoryManager(
      object.id,
      options.orbitalConfig,
      this,
    );

    // Set up lighting manager
    this.lightingManager.setRenderer(this);
    this.lightingManager.initializeLightingCalculator(object);
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Update time tracking
    this.timeManager.update(time, timeScale);

    // Update orbital data and position history
    this.positionHistoryManager.update(object, time);

    // Update lighting manager
    this.lightingManager.updateLightingCalculator(object, allObjects);

    // Update LOD position and level
    this.lodManager.updateObjectLOD(object, camera);

    // Update billboards if needed
    if (!this.billboardDisabled && allObjects && allMeshes) {
      this.billboardManager.update(camera, allObjects, allMeshes);
    }
  }
}
```

### Manager Pattern

```typescript
export class CelestialLightingManager {
  private lightingCalculator?: LightingCalculator;
  private shadowCasterUtils?: ShadowCasterUtils;
  private lightSources: LightSourcesMap = new Map();

  public applyLightAttenuation(
    config?: LightingConfig,
    forceRefresh: boolean = false,
  ): LightSourcesMap {
    if (!this.lightingCalculator) {
      return this.lightSources;
    }
    return this.lightingCalculator.applyDistanceAttenuation(
      this.lightSources,
      config,
      forceRefresh,
    );
  }

  public findShadowCasters(forceRefresh: boolean = false): ShadowCasterData[] {
    if (!this.shadowCasterUtils) {
      return [];
    }
    return this.shadowCasterUtils.findShadowCasters(forceRefresh);
  }
}
```

### Performance Optimization Pattern

```typescript
export class GeometryUtilities {
  private static getPerformanceReductionFactor(): number {
    if (!this.performanceConfig.enablePerformanceOptimization) {
      return 1.0;
    }

    const { targetFPS, currentFPS, performanceReductionMultiplier } =
      this.performanceConfig;

    if (!currentFPS || !targetFPS || currentFPS >= targetFPS) {
      return 1.0;
    }

    // Calculate reduction based on FPS drop
    const fpsRatio = currentFPS / targetFPS;
    const reductionFactor =
      1.0 - (1.0 - fpsRatio) * (performanceReductionMultiplier ?? 0.6);

    return Math.max(0.3, reductionFactor);
  }

  public static getSegmentsForDetailLevel(
    detailLevel?: DetailLevel | string,
    defaultSegments: number = 32,
    object?: RenderableCelestialObject,
    camera?: THREE.PerspectiveCamera,
  ): number {
    // Apply all optimization factors
    const performanceFactor = this.getPerformanceReductionFactor();
    const deviceFactor = this.getDeviceSegmentMultiplier();
    const adaptiveFactor = this.getAdaptiveScalingFactor(object, camera);
    const optimizedSegments = Math.floor(
      baseSegments * performanceFactor * deviceFactor * adaptiveFactor,
    );

    return Math.max(
      this.performanceConfig.minimumSegments || 4,
      optimizedSegments,
    );
  }
}
```

## Performance Considerations

### Memory Optimization

- **Circular Buffers**: Efficient position history storage with automatic memory management
- **Resource Tracking**: Automatic material and texture disposal
- **Object Pooling**: Reusable vector instances to minimize allocations
- **Cache Management**: Intelligent caching with invalidation

### Rendering Performance

- **LOD Management**: Automatic Level of Detail based on camera distance
- **Performance Monitoring**: Real-time FPS tracking and optimization
- **Geometry Optimization**: Dynamic segment reduction based on performance
- **Billboard System**: Efficient sprite-based distant representations

### Orbital Data Performance

- **Throttled Updates**: ~60fps update rate to prevent excessive processing
- **Distance-Based Sampling**: Only sample when object moves significantly
- **Memory Efficiency**: Pre-allocated buffers and intelligent sampling
- **LOD-Based Visibility**: Automatic visibility control for orbit lines and trails

## Troubleshooting

### Common Issues

- **Memory Leaks**: Ensure proper disposal of managers and resources
- **Performance Issues**: Monitor FPS and adjust performance configuration
- **Orbital Data Issues**: Check position history configuration and sampling
- **Lighting Issues**: Verify light source configuration and shadow casting

### Debug Tools

- **Performance Monitor**: Built-in FPS tracking and optimization
- **Debug Helper**: Comprehensive debug visualization and data collection
- **Memory Statistics**: Orbital data memory usage monitoring
- **Cache Statistics**: Lighting and shadow caster cache monitoring

## Dependencies

### Core Dependencies

- `three`: 3D rendering library
- `@teskooano/data-types`: Core data structures
- `@teskooano/core-math`: Vector mathematics (OSVector3)
- `@teskooano/core-physics`: Physics engine integration
- `@teskooano/core-state`: State management integration

### Development Dependencies

- `@types/three`: TypeScript definitions for Three.js
- `vitest`: Testing framework
- `@vitest/browser`: Browser testing support
- `@vitest/ui`: Test UI interface
- `typescript`: Type checking

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established manager patterns and naming conventions
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in performance

### Architecture Guidelines

1. **Manager Pattern**: Keep managers focused and single-purpose
2. **Performance First**: Optimize for high-frequency operations
3. **Memory Efficiency**: Minimize allocations and garbage collection
4. **Type Safety**: Maintain strict TypeScript typing

### Review Process

1. **Architecture Review**: Check for proper pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with Three.js and other renderer packages

## Integration Points

### With Other Renderer Packages

- **Core Renderer**: Provides base infrastructure for all celestial renderers
- **Lighting Renderer**: Integrates with lighting management system
- **LOD Renderer**: Uses LOD utilities and types
- **Camera Renderer**: Provides orbital data for camera management

### With Core Systems

- **State Management**: Integrates with application state for performance profiles
- **Physics System**: Reads position and velocity data from physics engine
- **Math System**: Uses OSVector3 for calculations
- **Resource Management**: Integrates with engine resource management

## Architecture Documentation

For detailed technical documentation, see:

- [README.md](./README.md) - Package overview and quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed technical architecture
- [TARGET_ARCHITECTURE.md](./TARGET_ARCHITECTURE.md) - Future compositional rendering plans
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes

## Scientific References

- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Memory Management in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [Performance Optimization Techniques](https://developer.mozilla.org/en-US/docs/Web/Performance)
