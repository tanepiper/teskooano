# Getting Started

This guide will help you get up and running with the `@teskooano/renderer-threejs-helpers` package.

## Installation

The package is part of the Teskooano monorepo and is automatically available to other packages within the workspace.

### For Internal Development

```bash
# The package is already available in the monorepo
# No additional installation needed
```

### For External Projects

```bash
npm install @teskooano/renderer-threejs-helpers
```

## Basic Setup

### Import the Utilities

````typescript
import {
  GeometryHelper,
  SceneHelper,
  BufferPool,
  CircularBuffer,
  LineHelper
} from "@teskooano/renderer-threejs-helpers";

### Create a Basic Scene

```typescript
// Create a complete Three.js scene setup
const { scene, camera, renderer } = SceneHelper.createScene();

// Add some basic geometries
const cube = GeometryHelper.createBox(0, 0, 0, 1, 0xff0000);
const sphere = GeometryHelper.createSphere(5, 0, 0, 2, 0x00ff00);

scene.add(cube, sphere);

// Set up a simple animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
````

## Package Organization

The package is organized into three main categories:

```
@teskooano/renderer-threejs-helpers/
├── geometry/           # Geometry creation utilities
│   └── GeometryHelper  # Static methods for common shapes
├── memory/            # Memory management utilities
│   ├── BufferPool     # Buffer attribute pooling
│   └── CircularBuffer # Fixed-size circular buffers
└── rendering/         # Rendering utilities
    └── LineBuilder    # Efficient line creation
```

## Quick Examples

### Creating Geometries

```typescript
// Basic shapes with default parameters
const box = GeometryHelper.createBox(0, 0, 0, 1, 0xff0000);
const sphere = GeometryHelper.createSphere(5, 0, 0, 2, 0x00ff00);
const torus = GeometryHelper.createTorus(0, 10, 0, 1, 0x0000ff, true);

// Custom parameters
const customBox = GeometryHelper.createBox(
  0,
  0,
  0, // position
  2, // scale
  0xff0000, // color
  false, // wireframe
  20,
  10,
  15, // width, height, depth
);

// Star field
const stars = GeometryHelper.createStars(1000, 0xffffff, 2, 2000);
```

### Memory Management

```typescript
// Create a buffer pool for efficient memory management
const bufferPool = new BufferPool(10000, 3);

// Get a buffer for use
const buffer = bufferPool.getBuffer(1000);

// Use the buffer...
// ...

// Return it to the pool when done
bufferPool.releaseBuffer(buffer, 1000);

// Monitor performance
const stats = bufferPool.getStatistics();
console.log(
  `Reused ${stats.totalReused} buffers out of ${stats.totalAllocated}`,
);
```

### Circular Buffers

```typescript
// Create a circular buffer for position history
const positionHistory = new CircularBuffer<THREE.Vector3>(100);

// Add positions
positionHistory.push(new THREE.Vector3(1, 2, 3));
positionHistory.push(new THREE.Vector3(4, 5, 6));

// Check if buffer is full
if (positionHistory.isFull) {
  console.log("Buffer is full, oldest items will be overwritten");
}

// Get recent items
const recentPositions = positionHistory.getLast(10);

// Iterate through all items
for (const position of positionHistory) {
  console.log(position);
}
```

### Line Building

```typescript
// Create a line helper
const lineHelper = new LineHelper();

// Create a line with 1000 points
const material = new THREE.LineBasicMaterial({ color: 0xffffff });
const line = lineHelper.createLine(1000, material, "my-line");

// Update the line with new points
const points = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(1, 1, 1),
  new THREE.Vector3(2, 0, 2),
  // ... more points
];

lineHelper.updateLine(line, points, points.length);

// Add to scene
scene.add(line);
```

## Performance Considerations

### Buffer Pooling

- **Size Limits**: Set appropriate `maxCachedBufferSize` to prevent memory bloat
- **Cache Limits**: Use `maxBuffersPerSize` to limit cached buffers per size
- **Regular Cleanup**: Call `garbageCollect()` periodically to remove excess buffers

```typescript
const bufferPool = new BufferPool(10000, 3); // 10k max size, 3 buffers per size

// Periodically clean up
setInterval(() => {
  bufferPool.garbageCollect();
}, 60000); // Every minute
```

### Circular Buffers

- **Capacity Planning**: Choose appropriate capacity based on your use case
- **Batch Operations**: Use `pushMany()` for better performance when adding multiple items
- **Memory Monitoring**: Track statistics to optimize buffer usage

```typescript
const buffer = new CircularBuffer<THREE.Vector3>(1000);

// Monitor performance
const stats = buffer.getStatistics();
console.log(`Fill percentage: ${buffer.fillPercentage * 100}%`);
```

### Line Building

- **Buffer Reuse**: LineHelper automatically uses BufferPool for efficient memory management
- **Update Frequency**: Only update lines when necessary to avoid unnecessary work
- **Material Sharing**: Reuse materials when possible to reduce draw calls

## Next Steps

- Read the [Geometry Utilities](./geometry/README.md) documentation for detailed geometry creation
- Explore [Memory Management](./memory/README.md) for advanced memory optimization
- Check out [Rendering Utilities](./rendering/README.md) for line rendering techniques
- Review [Examples](./examples/README.md) for real-world usage patterns
- Consult the [API Reference](./api-reference.md) for complete method documentation

## Troubleshooting

### Common Issues

1. **Memory Leaks**: Ensure you're calling `releaseBuffer()` when done with buffers
2. **Performance Issues**: Monitor statistics and adjust cache sizes accordingly
3. **Type Errors**: Make sure you're using the correct TypeScript types

### Getting Help

- Check the [API Reference](./api-reference.md) for method signatures
- Review [Examples](./examples/README.md) for usage patterns
- Monitor performance with built-in statistics methods
