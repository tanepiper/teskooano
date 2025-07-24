# @teskooano/renderer-threejs-helpers Documentation

This package provides a comprehensive collection of utility classes and functions designed to enhance Three.js development within the Teskooano engine. These helpers focus on performance optimization, memory management, and code organization.

## 📚 Documentation Index

### [Getting Started](./getting-started.md)

- Installation and basic setup
- Quick start examples
- Package organization overview

### [Geometry Utilities](./geometry/README.md)

- **GeometryHelper** - Static methods for creating common Three.js geometries
- Complete API reference with examples
- Performance considerations

### [Memory Management](./memory/README.md)

- **BufferPool** - Efficient buffer attribute pooling
- **CircularBuffer** - Fixed-size circular buffer implementation
- Memory optimization strategies

### [Rendering Utilities](./rendering/README.md)

- **LineBuilder** - Efficient line creation and management
- **CameraHelper** - Camera creation and animation
- **AnimationHelper** - GSAP-based animations
- **CelestialAnimationHelper** - Specialized celestial object animations
- Buffer optimization techniques
- Performance monitoring

### [API Reference](./api-reference.md)

- Complete TypeScript definitions
- Method signatures and parameters
- Return types and error handling

### [Performance Guide](./performance-guide.md)

- Best practices for optimal performance
- Memory management strategies
- Profiling and monitoring techniques

### [Examples](./examples/README.md)

- Real-world usage examples
- Common patterns and solutions
- Integration with Teskooano engine

## 🚀 Quick Start

```typescript
import {
  GeometryHelper,
  BufferPool,
  CircularBuffer,
  LineBuilder,
  CameraHelper,
  AnimationHelper,
  CelestialAnimationHelper,
} from "@teskooano/renderer-threejs-helpers";

// Create a scene with basic setup
const { scene, camera, renderer } = GeometryHelper.createScene();

// Add some geometries
const cube = GeometryHelper.createBox(0, 0, 0, 1, 0xff0000);
const sphere = GeometryHelper.createSphere(5, 0, 0, 2, 0x00ff00);
scene.add(cube, sphere);

// Set up memory management
const bufferPool = new BufferPool(10000, 3);
const positionHistory = new CircularBuffer<THREE.Vector3>(100);

// Create efficient lines
const lineBuilder = new LineBuilder();
const line = lineBuilder.createLine(
  1000,
  new THREE.LineBasicMaterial({ color: 0xffffff }),
);

// Create cameras with different presets
const spaceCamera = CameraHelper.createCamera(CameraPreset.Space);
const followCamera = CameraHelper.createFollowCamera(targetObject);

// Create smooth animations
AnimationHelper.animatePosition(cube, new THREE.Vector3(10, 5, 0));
AnimationHelper.createRotationAnimation(planet, "y", 20);

// Create celestial animations
CelestialAnimationHelper.createPlanetRotation(earth, 86400);
CelestialAnimationHelper.createStarPulse(sun, 1.05, 2.0);
```

## 🏗️ Architecture

The package is organized into three main categories:

### Geometry (`/geometry`)

Utilities for creating and managing Three.js geometries with consistent APIs and optimized performance.

### Memory (`/memory`)

Advanced memory management utilities that reduce garbage collection and improve performance through intelligent caching and pooling.

### Rendering (`/rendering`)

Specialized utilities for rendering operations, camera control, line rendering, and buffer optimization.

## 📊 Performance Features

- **Memory Pooling**: Reduces garbage collection through buffer reuse
- **Circular Buffers**: Efficient time-series data management
- **Batch Operations**: Optimized bulk operations for better performance
- **Statistics Tracking**: Built-in monitoring for performance analysis
- **Automatic Cleanup**: Intelligent resource management

## 🔧 Development

This package is built with TypeScript and follows strict typing conventions. All utilities are designed to be:

- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Performant**: Optimized for high-frequency operations
- **Memory-efficient**: Minimizes allocations and garbage collection
- **Well-documented**: Comprehensive JSDoc comments and examples
- **Testable**: Designed for easy unit testing and integration

## 📝 Contributing

When adding new utilities to this package:

1. Follow the existing directory structure
2. Include comprehensive JSDoc documentation
3. Add TypeScript type definitions
4. Include performance considerations
5. Update this documentation index
6. Add examples in the `/examples` directory

## 🔗 Related Packages

- `@teskooano/renderer-threejs-core` - Core Three.js rendering system
- `@teskooano/renderer-threejs-celestial` - Celestial object rendering
- `@teskooano/renderer-threejs-orbits` - Orbital visualization utilities
