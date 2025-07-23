# Rendering Utilities

The rendering utilities provide specialized tools for Three.js rendering operations, scene management, and line creation with optimized performance.

## SceneHelper

The `SceneHelper` class provides comprehensive methods for creating and managing Three.js scenes with consistent configuration and optimized settings.

### Overview

```typescript
import { SceneHelper } from "@teskooano/renderer-threejs-helpers";

// All methods provide consistent scene setup with sensible defaults
// and extensive customization options
```

### Scene Creation

#### createScene()

Creates a complete Three.js scene setup with extensive configuration options.

```typescript
static createScene(options: {
  backgroundColor?: number;
  fov?: number;
  near?: number;
  far?: number;
  cameraPosition?: [number, number, number];
  aspectRatio?: number;
  enableShadows?: boolean;
  shadowMapSize?: number;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
} = {}): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  three: typeof THREE;
}
```

**Examples:**

```typescript
// Basic scene with defaults
const { scene, camera, renderer } = SceneHelper.createScene();

// Custom scene with specific configuration
const { scene, camera, renderer } = SceneHelper.createScene({
  backgroundColor: 0x000011, // Dark blue space background
  fov: 75, // Wider field of view
  near: 0.1, // Closer near plane
  far: 100000, // Much farther far plane
  cameraPosition: [0, 0, 50], // Camera position
  enableShadows: true, // Enable shadow mapping
  shadowMapSize: 4096, // High resolution shadows
  antialias: true, // Enable antialiasing
  powerPreference: "high-performance", // Optimize for performance
});
```

#### createBasicScene()

Creates a minimal scene setup for quick prototyping.

```typescript
static createBasicScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  three: typeof THREE;
}
```

**Example:**

```typescript
// Quick setup for prototyping
const { scene, camera, renderer } = SceneHelper.createBasicScene();
```

#### createSpaceScene()

Creates a scene optimized for space/astronomical visualization.

```typescript
static createSpaceScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  three: typeof THREE;
}
```

**Features:**

- Dark blue space background (0x000011)
- Wide field of view (75°)
- Close near plane (0.1) for detailed close-ups
- Far far plane (100,000) for astronomical distances
- High-resolution shadow mapping (4096)
- Performance-optimized settings

**Example:**

```typescript
// Perfect for space simulations
const { scene, camera, renderer } = SceneHelper.createSpaceScene();
```

#### createDebugScene()

Creates a scene optimized for debugging and development.

```typescript
static createDebugScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  three: typeof THREE;
}
```

**Features:**

- Dark gray background for better contrast
- Angled camera position for better debugging view
- Disabled shadows and antialiasing for faster rendering
- Default power preference for debugging

**Example:**

```typescript
// Optimized for development and debugging
const { scene, camera, renderer } = SceneHelper.createDebugScene();
```

### Lighting

#### addBasicLighting()

Adds basic lighting to a scene for immediate visibility.

```typescript
static addBasicLighting(scene: THREE.Scene, options: {
  ambientIntensity?: number;
  directionalIntensity?: number;
  directionalPosition?: [number, number, number];
  enableShadows?: boolean;
} = {}): {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight;
}
```

**Examples:**

```typescript
// Add basic lighting to a scene
const { scene, camera, renderer } = SceneHelper.createScene();
const { ambient, directional } = SceneHelper.addBasicLighting(scene);

// Custom lighting configuration
const { ambient, directional } = SceneHelper.addBasicLighting(scene, {
  ambientIntensity: 0.4, // Brighter ambient light
  directionalIntensity: 0.8, // Stronger directional light
  directionalPosition: [20, 20, 10], // Different light position
  enableShadows: true, // Enable shadows
});
```

### Scene Management

#### setupResizeHandler()

Sets up automatic window resize handling for the renderer and camera.

```typescript
static setupResizeHandler(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  container: HTMLElement = document.body
): () => void
```

**Example:**

```typescript
const { scene, camera, renderer } = SceneHelper.createScene();

// Set up automatic resize handling
const cleanupResize = SceneHelper.setupResizeHandler(renderer, camera);

// Later, when cleaning up
cleanupResize(); // Remove the resize listener
```

#### createAnimationLoop()

Creates a simple animation loop for the scene.

```typescript
static createAnimationLoop(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  onUpdate?: (deltaTime: number) => void
): () => void
```

**Example:**

```typescript
const { scene, camera, renderer } = SceneHelper.createScene();

// Create animation loop with update callback
const stopAnimation = SceneHelper.createAnimationLoop(
  scene,
  camera,
  renderer,
  (deltaTime) => {
    // Update scene objects here
    console.log(`Frame time: ${deltaTime}s`);
  },
);

// Later, to stop the animation
stopAnimation();
```

## LineHelper

The `LineHelper` class provides comprehensive creation and management of `THREE.Line` objects, curves, and complex line patterns with automatic buffer pooling and memory optimization.

### Overview

```typescript
import { LineHelper } from "@teskooano/renderer-threejs-helpers";

// Comprehensive line and curve creation with automatic memory management
```

### Basic Usage

#### createLine()

Creates a new line with specified capacity and material.

```typescript
createLine(
  capacity: number,
  material: THREE.LineBasicMaterial | THREE.LineDashedMaterial,
  name?: string
): THREE.Line
```

**Example:**

```typescript
const lineHelper = new LineHelper();

// Create a line with 1000 points
const material = new THREE.LineBasicMaterial({ color: 0xffffff });
const line = lineHelper.createLine(1000, material, "trajectory-line");

// Add to scene
scene.add(line);
```

#### updateLine()

Updates a line with new position data.

```typescript
updateLine(
  line: THREE.Line,
  positions: THREE.Vector3[],
  count: number
): void
```

**Example:**

```typescript
// Update line with new positions
const positions = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(1, 1, 1),
  new THREE.Vector3(2, 0, 2),
  // ... more positions
];

lineHelper.updateLine(line, positions, positions.length);
```

### Advanced Features

#### Curve Creation

LineHelper provides comprehensive curve creation utilities:

```typescript
// Create spiral points
const spiralPoints = LineHelper.createSpiralPoints(100, 8, 10, 5);

// Create Bezier curves
const bezierPoints = LineHelper.createQuadraticBezierCurve(
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(5, 5, 0),
  new THREE.Vector3(10, 0, 0),
  50,
);

// Create custom curves
const customPoints = LineHelper.createCustomCurve((t) => {
  return new THREE.Vector3(
    Math.cos(t * Math.PI * 2) * 5,
    Math.sin(t * Math.PI * 4) * 2,
    0,
  );
}, 100);

// Create line groups
const spiralGroup = LineHelper.createSpiralLinesGroup(
  12,
  [0x00ff00, 0xff0000],
  1,
  0.2,
  10,
  4,
);
scene.add(spiralGroup);
```

#### Animation Helpers

```typescript
// Create alpha function from curve
const curve = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(5, 5, 0),
  new THREE.Vector3(10, 0, 0),
);
const getAlpha = LineHelper.createCurveAlphaFunction(curve);

// Use in animation
const alpha = getAlpha(currentFrame, totalFrames);
const animatedPoint = curve.getPoint(alpha);

// Update geometry from curve
LineHelper.updateGeometryFromCurve(curve, geometry, alpha, 0.5);
```

#### Buffer Pooling

LineHelper automatically uses BufferPool for efficient memory management:

```typescript
// LineBuilder internally manages buffer reuse
const line1 = lineBuilder.createLine(1000, material);
const line2 = lineBuilder.createLine(1000, material); // Reuses buffer from line1

// When lines are disposed, buffers return to pool
line1.geometry.dispose();
line2.geometry.dispose();
```

#### Performance Monitoring

```typescript
// Get statistics about buffer usage
const stats = lineHelper.getStatistics();
console.log(`Lines created: ${stats.linesCreated}`);
console.log(`Buffers reused: ${stats.buffersReused}`);
```

## Performance Considerations

### Scene Configuration

- **Shadow Mapping**: Enable only when needed for better performance
- **Antialiasing**: Disable for faster rendering during development
- **Power Preference**: Use 'high-performance' for production, 'default' for debugging
- **Far Plane**: Set appropriate far plane to avoid precision issues

### Lighting Optimization

- **Ambient Light**: Use for overall scene illumination
- **Directional Light**: Use for shadows and directional lighting
- **Shadow Resolution**: Balance quality vs performance with shadowMapSize

### Line Rendering

- **Buffer Reuse**: LineBuilder automatically reuses buffers for better performance
- **Update Frequency**: Only update lines when necessary
- **Material Sharing**: Reuse materials when possible to reduce draw calls

## Best Practices

### Scene Setup

```typescript
// For space simulations
const { scene, camera, renderer } = SceneHelper.createSpaceScene();
SceneHelper.addBasicLighting(scene);

// For debugging
const { scene, camera, renderer } = SceneHelper.createDebugScene();

// Set up resize handling
const cleanupResize = SceneHelper.setupResizeHandler(renderer, camera);

// Create animation loop
const stopAnimation = SceneHelper.createAnimationLoop(scene, camera, renderer);
```

### Line Management

```typescript
const lineHelper = new LineHelper();

// Create lines with appropriate capacity
const trajectoryLine = lineHelper.createLine(1000, trajectoryMaterial);
const orbitLine = lineHelper.createLine(500, orbitMaterial);

// Update efficiently
lineHelper.updateLine(trajectoryLine, newPositions, newPositions.length);

// Monitor performance
const stats = lineHelper.getStatistics();
```

### Memory Management

```typescript
// Clean up when done
const cleanupResize = SceneHelper.setupResizeHandler(renderer, camera);
const stopAnimation = SceneHelper.createAnimationLoop(scene, camera, renderer);

// Later, when cleaning up
cleanupResize();
stopAnimation();
renderer.dispose();
```

## Integration with Teskooano

The rendering utilities are designed to work seamlessly with the Teskooano engine:

- **Space Scene**: Optimized for astronomical visualization
- **Performance**: Designed for high-frequency updates in space simulations
- **Memory Management**: Efficient buffer pooling for trajectory and orbit lines
- **Scalability**: Handles large numbers of objects and lines efficiently

## Related Documentation

- [Getting Started](../getting-started.md) - Basic setup and usage
- [Geometry Utilities](../geometry/README.md) - Geometry creation
- [Memory Management](../memory/README.md) - Buffer pooling and optimization
- [API Reference](../api-reference.md) - Complete method documentation
