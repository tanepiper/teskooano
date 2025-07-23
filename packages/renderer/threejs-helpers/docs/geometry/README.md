# Geometry Utilities

The geometry utilities provide a comprehensive set of static methods for creating common Three.js geometries with consistent APIs and optimized performance.

## GeometryHelper

The `GeometryHelper` class provides static methods for creating various Three.js geometries with sensible defaults and consistent parameter ordering.

### Overview

```typescript
import { GeometryHelper } from "@teskooano/renderer-threejs-helpers";

// All methods follow the same parameter pattern:
// (x, y, z, size, color, wireframe, ...geometryParams)
```

### Basic Shapes

#### createBox()

Creates a box geometry with specified parameters.

```typescript
static createBox(
  x: number,           // X position
  y: number,           // Y position
  z: number,           // Z position
  size: number = 1,    // Scale factor
  color: number = 0xffffff,  // Hex color value
  wireframe: boolean = false, // Whether to render as wireframe
  width: number = 10,  // Box width
  height: number = 10, // Box height
  depth: number = 10   // Box depth
): THREE.Mesh
```

**Examples:**

```typescript
// Basic red cube
const cube = GeometryHelper.createBox(0, 0, 0, 1, 0xff0000);

// Large wireframe box
const wireframeBox = GeometryHelper.createBox(
  10,
  0,
  0, // position
  2, // scale
  0x00ff00, // green
  true, // wireframe
  20,
  10,
  15, // custom dimensions
);
```

#### createSphere()

Creates a sphere geometry with specified parameters.

```typescript
static createSphere(
  x: number,           // X position
  y: number,           // Y position
  z: number,           // Z position
  size: number = 1,    // Scale factor
  color: number = 0xffffff,  // Hex color value
  wireframe: boolean = false, // Whether to render as wireframe
  radius: number = 1,  // Sphere radius
  segments: number = 64 // Number of segments
): THREE.Mesh
```

**Examples:**

```typescript
// Basic sphere
const sphere = GeometryHelper.createSphere(0, 0, 0, 1, 0x0000ff);

// High-detail wireframe sphere
const detailedSphere = GeometryHelper.createSphere(
  0,
  10,
  0, // position
  3, // scale
  0xffff00, // yellow
  true, // wireframe
  5, // radius
  128, // high detail
);
```

#### createTetrahedron()

Creates a tetrahedron geometry (triangle-based pyramid).

```typescript
static createTetrahedron(
  x: number,           // X position
  y: number,           // Y position
  z: number,           // Z position
  size: number = 1,    // Scale factor
  color: number = 0xffffff,  // Hex color value
  wireframe: boolean = false, // Whether to render as wireframe
  radius: number = 10, // Radius of the tetrahedron
  detail: number = 0   // Level of detail
): THREE.Mesh
```

**Examples:**

```typescript
// Basic tetrahedron
const tetra = GeometryHelper.createTetrahedron(0, 0, 0, 1, 0xff00ff);

// Detailed tetrahedron
const detailedTetra = GeometryHelper.createTetrahedron(
  0,
  0,
  0, // position
  2, // scale
  0xff00ff, // magenta
  false, // solid
  15, // radius
  2, // high detail
);
```

#### createTorus()

Creates a torus geometry (donut shape).

```typescript
static createTorus(
  x: number,           // X position
  y: number,           // Y position
  z: number,           // Z position
  size: number = 1,    // Scale factor
  color: number = 0xffffff,  // Hex color value
  wireframe: boolean = false, // Whether to render as wireframe
  radius: number = 10, // Major radius
  tubeRadius: number = 5, // Minor radius
  segments: number = 16, // Number of segments
  tubeSegments: number = 32 // Number of tube segments
): THREE.Mesh
```

**Examples:**

```typescript
// Basic torus
const torus = GeometryHelper.createTorus(0, 0, 0, 1, 0x00ffff);

// Thin wireframe torus
const thinTorus = GeometryHelper.createTorus(
  0,
  0,
  0, // position
  1, // scale
  0x00ffff, // cyan
  true, // wireframe
  20, // major radius
  2, // thin tube
  32, // segments
  16, // tube segments
);
```

### Planar Geometries

#### createPlane()

Creates a plane geometry.

```typescript
static createPlane(
  x: number,           // X position
  y: number,           // Y position
  z: number,           // Z position
  size: number = 1,    // Scale factor
  color: number = 0xffffff,  // Hex color value
  wireframe: boolean = false, // Whether to render as wireframe
  width: number = 10,  // Plane width
  height: number = 10  // Plane height
): THREE.Mesh
```

#### createCircle()

Creates a circle geometry.

```typescript
static createCircle(
  x: number,           // X position
  y: number,           // Y position
  z: number,           // Z position
  size: number = 1,    // Scale factor
  color: number = 0xffffff,  // Hex color value
  wireframe: boolean = false, // Whether to render as wireframe
  radius: number = 10, // Circle radius
  segments: number = 32 // Number of segments
): THREE.Mesh
```

### 3D Primitives

#### createCylinder()

Creates a cylinder geometry.

```typescript
static createCylinder(
  x: number,           // X position
  y: number,           // Y position
  z: number,           // Z position
  size: number = 1,    // Scale factor
  color: number = 0xffffff,  // Hex color value
  wireframe: boolean = false, // Whether to render as wireframe
  radiusTop: number = 10, // Top radius
  radiusBottom: number = 10, // Bottom radius
  height: number = 20, // Cylinder height
  segments: number = 32 // Number of segments
): THREE.Mesh
```

#### createCone()

Creates a cone geometry.

```typescript
static createCone(
  x: number,           // X position
  y: number,           // Y position
  z: number,           // Z position
  size: number = 1,    // Scale factor
  color: number = 0xffffff,  // Hex color value
  wireframe: boolean = false, // Whether to render as wireframe
  radius: number = 10, // Base radius
  height: number = 20, // Cone height
  segments: number = 32 // Number of segments
): THREE.Mesh
```

### Special Geometries

#### createStars()

Creates a star field using points geometry.

```typescript
static createStars(
  amount: number,       // Number of stars to create
  color: number = 0xffffff,  // Hex color value
  size: number = 1,     // Point size
  spread: number = 2000 // Spread distance for random positioning
): THREE.Points
```

**Examples:**

```typescript
// Basic star field
const stars = GeometryHelper.createStars(1000, 0xffffff, 2, 2000);

// Dense star field with large stars
const denseStars = GeometryHelper.createStars(
  5000, // many stars
  0xffff00, // yellow
  3, // large size
  5000, // wide spread
);
```

## Performance Considerations

### Material Optimization

- **Material Sharing**: Reuse materials when possible to reduce draw calls
- **Wireframe Mode**: Use wireframe for debugging, but prefer solid materials for production
- **Color Management**: Use hex colors for consistency and performance

### Geometry Optimization

- **Detail Levels**: Use appropriate segment counts for your use case
- **Scale Factors**: Apply scale through the helper rather than mesh.scale for better performance
- **Positioning**: Set position through the helper for optimal performance

### Memory Management

- **Disposal**: Remember to dispose of geometries and materials when no longer needed
- **Scene Management**: Remove meshes from scene when not visible to improve performance

## Best Practices

### Consistent Parameter Ordering

All geometry creation methods follow the same parameter pattern:

1. **Position** (x, y, z)
2. **Scale** (size)
3. **Color** (hex value)
4. **Wireframe** (boolean)
5. **Geometry-specific parameters**

### Color Management

```typescript
// Use hex colors for consistency
const red = 0xff0000;
const green = 0x00ff00;
const blue = 0x0000ff;
const white = 0xffffff;
const black = 0x000000;
```

### Scene Organization

```typescript
// Create a scene
const { scene, camera, renderer } = GeometryHelper.createScene();

// Add geometries with consistent styling
const geometries = [
  GeometryHelper.createBox(0, 0, 0, 1, 0xff0000),
  GeometryHelper.createSphere(5, 0, 0, 1, 0x00ff00),
  GeometryHelper.createTorus(0, 5, 0, 1, 0x0000ff),
];

geometries.forEach((geo) => scene.add(geo));
```

## Integration with Teskooano

The `GeometryHelper` is designed to work seamlessly with the Teskooano engine:

- **Scale Compatibility**: All geometries work with the engine's coordinate system
- **Material Consistency**: Materials are compatible with the engine's rendering pipeline
- **Performance Optimization**: Designed for high-frequency updates in space simulations

## Related Documentation

- [Getting Started](../getting-started.md) - Basic setup and usage
- [Memory Management](../memory/README.md) - Buffer pooling and optimization
- [Rendering Utilities](../rendering/README.md) - Line building and rendering
- [API Reference](../api-reference.md) - Complete method documentation
