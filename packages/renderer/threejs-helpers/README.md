# @teskooano/renderer-threejs-helpers

This package provides a collection of reusable utility classes and functions specifically designed to assist with Three.js-related operations within the Teskooano engine. These helpers aim to improve performance, memory management, and code organization.

## 📚 Documentation

**📖 [Full Documentation](./docs/README.md)** - Complete documentation with examples, API reference, and performance guides.

### Quick Links

- [Getting Started](./docs/getting-started.md) - Installation and basic setup
- [Geometry Utilities](./docs/geometry/README.md) - GeometryHelper and shape creation
- [Memory Management](./docs/memory/README.md) - BufferPool and CircularBuffer
- [Rendering Utilities](./docs/rendering/README.md) - LineBuilder and rendering optimization
- [API Reference](./docs/api-reference.md) - Complete TypeScript definitions
- [Performance Guide](./docs/performance-guide.md) - Optimization strategies
- [Examples](./docs/examples/README.md) - Real-world usage examples

## Organization

The package is organized into logical subdirectories:

- **`geometry/`** - Geometry creation utilities
- **`memory/`** - Memory management and optimization utilities
- **`rendering/`** - Rendering-specific utilities

## Quick Start

```typescript
import {
  GeometryHelper,
  SceneHelper,
  BufferPool,
  CircularBuffer,
  LineHelper,
} from "@teskooano/renderer-threejs-helpers";

// Create a scene with basic setup
const { scene, camera, renderer } = SceneHelper.createScene();

// Add some geometries
const cube = GeometryHelper.createBox(0, 0, 0, 1, 0xff0000);
const sphere = GeometryHelper.createSphere(5, 0, 0, 2, 0x00ff00);
scene.add(cube, sphere);

// Set up memory management
const bufferPool = new BufferPool(10000, 3);
const positionHistory = new CircularBuffer<THREE.Vector3>(100);

// Create efficient lines
const lineHelper = new LineHelper();
const line = lineHelper.createLine(
  1000,
  new THREE.LineBasicMaterial({ color: 0xffffff }),
);
```

## Utilities Overview

### Geometry Utilities

#### GeometryHelper

A comprehensive utility class with static methods for creating common Three.js geometries:

```typescript
// Create basic shapes
const box = GeometryHelper.createBox(0, 0, 0, 1, 0xff0000);
const sphere = GeometryHelper.createSphere(10, 0, 0, 2, 0x00ff00);
const torus = GeometryHelper.createTorus(0, 10, 0, 1, 0x0000ff, true);

// Create star field
const stars = GeometryHelper.createStars(1000, 0xffffff, 2, 2000);

// Create complete scene setup
const { scene, camera, renderer } = GeometryHelper.createScene();
```

**Available Methods:**

- `createBox()` - Box geometry
- `createSphere()` - Sphere geometry
- `createTetrahedron()` - Triangle-based pyramid
- `createTorus()` - Donut shape
- `createPlane()` - Plane geometry
- `createCylinder()` - Cylinder geometry
- `createCone()` - Cone geometry
- `createCircle()` - Circle geometry
- `createStars()` - Star field using points
- `createScene()` - Complete scene setup

### Memory Management Utilities

#### BufferPool

A memory-efficient pool for managing `THREE.BufferAttribute` instances. Reduces garbage collection by reusing buffers instead of creating new ones.

**Features:**

- Multiple buffers per size with configurable limits
- Performance statistics and monitoring
- Automatic garbage collection
- Memory usage reporting

#### CircularBuffer

A fixed-size circular buffer implementation for managing position histories and other time-series data without expensive array reallocations.

**Features:**

- O(1) push and pop operations
- Iterator support for easy iteration
- Batch operations for better performance
- Statistics tracking and monitoring

### Rendering Utilities

#### SceneHelper

A comprehensive utility for creating and managing Three.js scenes with consistent configuration and optimized settings.

**Features:**

- Multiple scene presets (basic, space, debug)
- Automatic lighting setup
- Resize handling and animation loops
- Extensive configuration options
- Performance optimization

#### LineHelper

A comprehensive utility for creating and managing `THREE.Line` objects, curves, and complex line patterns with efficient buffer management and memory optimization.

**Features:**

- Automatic buffer pooling integration
- Efficient line updates
- Memory optimization
- Performance monitoring
- Curve creation utilities (Bezier, spiral, custom curves)
- Animation helpers for curve-based animations
- Points and line group management

## Performance Features

- **Memory Pooling**: Reduces garbage collection through buffer reuse
- **Circular Buffers**: Efficient time-series data management
- **Batch Operations**: Optimized bulk operations for better performance
- **Statistics Tracking**: Built-in monitoring for performance analysis
- **Automatic Cleanup**: Intelligent resource management

## Development

This package is built with TypeScript and follows strict typing conventions. All utilities are designed to be:

- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Performant**: Optimized for high-frequency operations
- **Memory-efficient**: Minimizes allocations and garbage collection
- **Well-documented**: Comprehensive JSDoc comments and examples
- **Testable**: Designed for easy unit testing and integration

## Related Packages

- `@teskooano/renderer-threejs-core` - Core Three.js rendering system
- `@teskooano/renderer-threejs-celestial` - Celestial object rendering
- `@teskooano/renderer-threejs-orbits` - Orbital visualization utilities
