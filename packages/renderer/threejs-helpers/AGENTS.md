# AGENTS.md

A guide for AI coding agents working on the ThreeJS Helpers package for Teskooano.

## Package Overview

The **ThreeJS Helpers package** (`@teskooano/renderer-threejs-helpers`) is a comprehensive collection of utility classes and functions specifically designed to assist with Three.js-related operations within the Teskooano engine. These helpers aim to improve performance, memory management, and code organization while providing consistent APIs for common Three.js operations.

## Key Features

- **Geometry Utilities**: Static methods for creating common Three.js geometries with consistent APIs
- **Memory Management**: Advanced buffer pooling and circular buffer implementations for efficient memory usage
- **Rendering Utilities**: Scene creation, camera management, lighting setup, and line rendering
- **Animation System**: GSAP-based animation helpers for smooth object and camera animations
- **Performance Optimization**: Built-in memory pooling, statistics tracking, and resource management
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Modular Architecture**: Organized into logical subdirectories for easy navigation

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js 0.180.0
- GSAP 3.13.0

### Development Commands

```bash
# Run tests
moon run threejs-helpers:test

# Run browser tests
moon run threejs-helpers:test:browser

# Run tests in watch mode
moon run threejs-helpers:test:watch

# Run tests with UI
moon run threejs-helpers:test:ui

# Build package
moon run threejs-helpers:build

# Lint code
moon run threejs-helpers:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                           # Main entry point
├── geometry/                          # Geometry creation utilities
│   ├── GeometryHelper.ts             # Static methods for common shapes
│   └── index.ts
├── memory/                           # Memory management utilities
│   ├── BufferPool.ts                 # Buffer attribute pooling
│   ├── CircularBuffer.ts             # Fixed-size circular buffers
│   └── index.ts
└── rendering/                        # Rendering utilities
    ├── AnimationHelper.ts            # GSAP-based animations
    ├── CameraHelper.ts               # Camera creation and management
    ├── CelestialAnimationHelper.ts   # Specialized celestial animations
    ├── LightingHelper.ts             # Lighting setup utilities
    ├── LineHelper.ts                 # Line creation and management
    ├── SceneHelper.ts                # Scene creation and management
    ├── ShadowHelper.ts               # Shadow configuration utilities
    └── index.ts
```

### Data Flow

1. **Geometry Creation**: Static methods create configured Three.js meshes
2. **Memory Management**: Buffer pooling reduces garbage collection
3. **Scene Setup**: Comprehensive scene creation with lighting and cameras
4. **Animation System**: GSAP-based animations for objects and cameras
5. **Resource Management**: Automatic cleanup and disposal

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and parameters
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use PascalCase for class files (e.g., `GeometryHelper.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use THREE.Vector3 for all position calculations
- **Performance**: Minimize object creation, use efficient algorithms
- **Memory Management**: Proper disposal of Three.js resources
- **Configuration**: Use options objects for complex parameters

## Key Components

### Geometry Helper

```typescript
export class GeometryHelper {
  // Static methods for creating common Three.js geometries
  static createBox(options: BoxOptions): THREE.Mesh;
  static createSphere(options: SphereOptions): THREE.Mesh;
  static createTorus(options: TorusOptions): THREE.Mesh;
  static createStars(
    amount: number,
    color: number,
    size: number,
    spread: number,
  ): THREE.Points;
}
```

### Memory Management

```typescript
// Buffer Pool for efficient memory management
export class BufferPool {
  constructor(maxCachedBufferSize: number, maxBuffersPerSize: number);
  getBuffer(size: number): THREE.BufferAttribute;
  releaseBuffer(buffer: THREE.BufferAttribute, size: number): void;
  getStatistics(): BufferPoolStats;
}

// Circular Buffer for time-series data
export class CircularBuffer<T> {
  constructor(capacity: number);
  push(item: T): boolean;
  getOrderedItems(): T[];
  getLast(count: number): T[];
}
```

### Animation System

```typescript
// Core animation helper with GSAP integration
export class AnimationHelper {
  static animatePosition(
    object: THREE.Object3D,
    targetPosition: THREE.Vector3,
    config: AnimationConfig,
  ): gsap.core.Tween;
  static animateRotation(
    object: THREE.Object3D,
    targetRotation: THREE.Euler,
    config: AnimationConfig,
  ): gsap.core.Tween;
  static animateCamera(
    camera: THREE.PerspectiveCamera,
    targetPosition: THREE.Vector3,
    config: CameraAnimationConfig,
  ): gsap.core.Timeline;
  static createTimeline(config: AnimationConfig): gsap.core.Timeline;
}

// Specialized celestial animations
export class CelestialAnimationHelper {
  static createPlanetRotation(
    object: THREE.Object3D,
    rotationPeriod: number,
    config: CelestialAnimationConfig,
  );
  static createStarPulse(
    object: THREE.Object3D,
    pulseIntensity: number,
    pulsePeriod: number,
    config: CelestialAnimationConfig,
  );
  static createFocusAnimation(
    camera: THREE.PerspectiveCamera,
    targetObject: THREE.Object3D,
    distance: number,
    config: CelestialAnimationConfig,
  );
}
```

### Camera Management

```typescript
export class CameraHelper {
  static createCamera(
    preset: CameraPreset,
    config: CameraConfig,
  ): THREE.PerspectiveCamera | THREE.OrthographicCamera;
  static transitionTo(
    camera: THREE.PerspectiveCamera,
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    config: CameraTransitionConfig,
  ): void;
  static createFollowCamera(
    target: THREE.Object3D,
    offset: THREE.Vector3,
    config: CameraConfig,
  ): THREE.PerspectiveCamera;
  static createOrbitCamera(
    target: THREE.Vector3,
    radius: number,
    height: number,
    config: CameraConfig,
  ): THREE.PerspectiveCamera;
}
```

### Scene Management

```typescript
export class SceneHelper {
  static createScene(options: SceneOptions): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    three: typeof THREE;
  };
  static createSpaceScene(): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    three: typeof THREE;
  };
  static createDebugScene(): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    three: typeof THREE;
  };
  static setupResizeHandler(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    container: HTMLElement,
  ): () => void;
}
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for utilities, integration tests for complex workflows
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs-helpers:test

# Run browser tests
moon run threejs-helpers:test:browser

# Run specific test file
moon run threejs-helpers:test -- GeometryHelper.spec.ts

# Run tests with UI
moon run threejs-helpers:test:ui
```

### Test Patterns

- **Utility Testing**: Test static methods with various parameter combinations
- **Memory Testing**: Test buffer pooling and circular buffer operations
- **Animation Testing**: Test GSAP integration and animation lifecycle
- **Integration Testing**: Test complete scene setup and rendering workflows

## Data Sources & Validation

### Primary Sources

- **Three.js Documentation**: Official Three.js API reference
- **GSAP Documentation**: GreenSock Animation Platform documentation
- **Performance Metrics**: Built-in statistics and monitoring
- **Memory Usage**: Buffer pool and circular buffer statistics

### Data Quality Standards

| Property              | Accuracy       | Source                    |
| --------------------- | -------------- | ------------------------- |
| Geometry Creation     | High precision | Three.js geometry APIs    |
| Memory Management     | Efficient      | Buffer pooling algorithms |
| Animation Performance | 60 FPS target  | GSAP optimization         |
| Resource Management   | Automatic      | Built-in disposal methods |

### Validation Process

1. **Utility Validation**: Ensure proper Three.js object creation
2. **Memory Validation**: Verify buffer pooling and circular buffer operations
3. **Animation Validation**: Test GSAP integration and animation lifecycle
4. **Performance Validation**: Monitor memory usage and animation performance

## Development Guidelines

### Adding New Utilities

1. **Follow Patterns**: Use established utility patterns and naming conventions
2. **Add Documentation**: Include comprehensive JSDoc comments
3. **Include Tests**: Add unit tests for new functionality
4. **Update Exports**: Add new utilities to appropriate index files
5. **Performance Consider**: Optimize for high-frequency operations

### Memory Management

- **Buffer Pooling**: Use BufferPool for efficient memory management
- **Circular Buffers**: Use CircularBuffer for time-series data
- **Resource Disposal**: Always dispose of Three.js resources when done
- **Statistics Monitoring**: Use built-in statistics for performance analysis

### Animation Best Practices

- **GSAP Integration**: Use GSAP for smooth, performant animations
- **Animation Lifecycle**: Properly start, pause, and stop animations
- **Memory Cleanup**: Stop animations when objects are disposed
- **Performance Monitoring**: Monitor active animation counts

## Common Patterns

### Geometry Creation Pattern

```typescript
export class GeometryHelper {
  static createBox(options: BoxOptions = {}): THREE.Mesh {
    const {
      x = 0,
      y = 0,
      z = 0,
      size = 1,
      color = 0xffffff,
      wireframe = false,
      width = 10,
      height = 10,
      depth = 10,
      name,
    } = options;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    mesh.scale.set(size, size, size);
    if (name) mesh.name = name;

    return mesh;
  }
}
```

### Memory Management Pattern

```typescript
export class BufferPool {
  getBuffer(size: number): THREE.BufferAttribute {
    const cachedBuffers = this.bufferCache.get(size);

    if (cachedBuffers && cachedBuffers.length > 0) {
      const buffer = cachedBuffers.pop()!;
      const positions = buffer.array as Float32Array;
      positions.fill(0); // Reset buffer data

      this.stats.totalReused++;
      this.stats.currentCached--;
      return buffer;
    }

    // Create new buffer when none cached
    const positions = new Float32Array(size * 3);
    const buffer = new THREE.BufferAttribute(positions, 3);
    this.stats.totalAllocated++;
    return buffer;
  }
}
```

### Animation Pattern

```typescript
export class AnimationHelper {
  static animatePosition(
    object: THREE.Object3D,
    targetPosition: THREE.Vector3,
    config: AnimationConfig = {},
  ): gsap.core.Tween {
    const animationId = `position_${object.uuid}`;

    const tween = gsap.to(object.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: config.duration || 1,
      ease: config.ease || "power2.out",
      onComplete: () => {
        this.activeAnimations.delete(animationId);
        config.onComplete?.();
      },
    });

    this.activeAnimations.set(animationId, tween);
    return tween;
  }
}
```

## Performance Considerations

### Memory Optimization

- **Buffer Pooling**: Reduces garbage collection through buffer reuse
- **Circular Buffers**: Efficient time-series data management
- **Resource Disposal**: Proper cleanup of Three.js resources
- **Statistics Tracking**: Monitor memory usage and performance

### Animation Performance

- **GSAP Integration**: Optimized animation engine
- **Animation Lifecycle**: Proper start/stop management
- **Memory Management**: Automatic cleanup of completed animations
- **Performance Monitoring**: Track active animation counts

### Rendering Performance

- **Scene Optimization**: Efficient scene setup and management
- **Camera Management**: Optimized camera creation and transitions
- **Lighting Setup**: Efficient lighting configuration
- **Line Rendering**: Optimized line creation and updates

## Troubleshooting

### Common Issues

- **Memory Leaks**: Ensure proper buffer disposal and animation cleanup
- **Performance Issues**: Monitor buffer pool statistics and animation counts
- **Animation Problems**: Check GSAP integration and animation lifecycle
- **Resource Management**: Verify proper Three.js resource disposal

### Debug Tools

- **Statistics Monitoring**: Use built-in statistics methods
- **Memory Usage**: Monitor buffer pool and circular buffer usage
- **Animation Tracking**: Check active animation counts and IDs
- **Performance Profiling**: Use browser dev tools for performance analysis

## Dependencies

### Core Dependencies

- `three`: 3D rendering library
- `gsap`: Animation platform

### Development Dependencies

- `@types/three`: TypeScript definitions for Three.js
- `vitest`: Testing framework
- `@vitest/browser`: Browser testing support
- `@vitest/ui`: Test UI interface
- `typescript`: Type checking

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established utility patterns and naming conventions
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in utility performance

### Architecture Guidelines

1. **Modular Design**: Keep utilities focused and single-purpose
2. **Performance First**: Optimize for high-frequency operations
3. **Memory Efficiency**: Minimize allocations and garbage collection
4. **Type Safety**: Maintain strict TypeScript typing

### Review Process

1. **Architecture Review**: Check for proper pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with Three.js and GSAP

## Integration Points

### With Other Renderer Packages

- **Core Renderer**: Provides utilities for scene setup and management
- **Celestial Renderer**: Uses geometry and animation utilities
- **Orbit Renderer**: Uses line rendering and animation utilities
- **Lighting Renderer**: Uses lighting and shadow utilities

### With Core Systems

- **State Management**: Integrates with application state for animations
- **Physics System**: Uses utilities for object positioning and animation
- **Event System**: Handles animation lifecycle events
- **Resource Management**: Integrates with engine resource management

## Architecture Documentation

For detailed technical documentation, see:

- [README.md](./README.md) - Package overview and quick start
- [docs/README.md](./docs/README.md) - Complete documentation index
- [docs/getting-started.md](./docs/getting-started.md) - Installation and setup
- [docs/geometry/README.md](./docs/geometry/README.md) - Geometry utilities
- [docs/memory/README.md](./docs/memory/README.md) - Memory management
- [docs/rendering/README.md](./docs/rendering/README.md) - Rendering utilities

## Scientific References

- [Three.js Documentation](https://threejs.org/docs/)
- [GSAP Documentation](https://greensock.com/docs/)
- [WebGL Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Memory Management in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
