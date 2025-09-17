---
aliases: [OSMatrix4]
tags: [core, math, matrix, 3d-transformations]
type: Class
package: "@teskooano/core-math"
name: OSMatrix4
dependencies: ["three"]
methods:
  [
    "constructor",
    "set",
    "identity",
    "clone",
    "copy",
    "makeRotationFromQuaternion",
    "lookAt",
    "multiply",
    "transpose",
    "determinant",
    "invert",
    "makePerspective",
    "makeOrthographic",
    "toThreeJS",
  ]
status: active
---

# OSMatrix4

4×4 matrix class for 3D transformations, projections, and complex geometric operations with column-major storage format and Three.js compatibility.

## Overview

The `OSMatrix4` class represents a 4×4 matrix used for 3D transformations, perspective and orthographic projections, and complex geometric operations in the Open Space engine. The matrix uses column-major storage format for compatibility with OpenGL and Three.js, making it the primary transformation matrix for 3D graphics and physics calculations.

## Matrix Representation

### Storage Format

The matrix is stored in column-major order as a flat array:

```
[m11, m21, m31, m41]
[m12, m22, m32, m42]
[m13, m23, m33, m43]
[m14, m24, m34, m44]
```

Stored as: `[m11, m21, m31, m41, m12, m22, m32, m42, m13, m23, m33, m43, m14, m24, m34, m44]`

### Identity Matrix

The identity matrix (no transformation) is:

```
[1, 0, 0, 0]
[0, 1, 0, 0]
[0, 0, 1, 0]
[0, 0, 0, 1]
```

## API Reference

### Constructor

#### `constructor(): OSMatrix4`

Creates a new OSMatrix4 instance initialized to the identity matrix.

**Returns:** New OSMatrix4 instance (identity matrix)

**Usage:**

```typescript
const m = new OSMatrix4();
// m.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
```

### Basic Operations

#### `set(n11: number, n12: number, n13: number, n14: number, n21: number, n22: number, n23: number, n24: number, n31: number, n32: number, n33: number, n34: number, n41: number, n42: number, n43: number, n44: number): OSMatrix4`

Sets the elements of this matrix.

**Parameters:**

- `n11` through `n44`: Matrix elements in row-major order

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix4();
m.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
```

#### `identity(): OSMatrix4`

Resets this matrix to the identity matrix.

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix4().set(/* custom values */);
m.identity(); // m = identity matrix
```

#### `clone(): OSMatrix4`

Creates a clone of this matrix.

**Returns:** New OSMatrix4 instance with same elements

**Usage:**

```typescript
const m1 = new OSMatrix4().set(/* values */);
const m2 = m1.clone();
```

#### `copy(m: OSMatrix4): OSMatrix4`

Copies the elements from another OSMatrix4.

**Parameters:**

- `m`: Matrix to copy from

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m1 = new OSMatrix4().set(/* values */);
const m2 = new OSMatrix4();
m2.copy(m1);
```

### Transformation Operations

#### `makeRotationFromQuaternion(q: OSQuaternion): OSMatrix4`

Sets the rotation component of this matrix from a quaternion.

**Parameters:**

- `q`: Quaternion representing the rotation

**Returns:** This matrix for chaining

**Usage:**

```typescript
const q = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0), // Y-axis
  Math.PI / 2, // 90 degrees
);
const m = new OSMatrix4().makeRotationFromQuaternion(q);
```

#### `lookAt(eye: OSVector3, target: OSVector3, up: OSVector3): OSMatrix4`

Constructs a rotation matrix looking from `eye` to `target` with configured `up` direction.

**Parameters:**

- `eye`: Position of the camera/observer
- `target`: Point to look at
- `up`: Up direction vector

**Returns:** This matrix for chaining

**Usage:**

```typescript
const eye = new OSVector3(10, 10, 10);
const target = new OSVector3(0, 0, 0);
const up = new OSVector3(0, 1, 0);
const m = new OSMatrix4().lookAt(eye, target, up);
```

### Mathematical Operations

#### `multiply(m: OSMatrix4): OSMatrix4`

Multiplies this matrix by another matrix.

**Parameters:**

- `m`: Matrix to multiply by

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m1 = new OSMatrix4().set(/* values */);
const m2 = new OSMatrix4().set(/* values */);
m1.multiply(m2); // m1 = m1 * m2
```

#### `transpose(): OSMatrix4`

Transposes this matrix.

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix4().set(/* values */);
m.transpose(); // Swaps rows and columns
```

#### `determinant(): number`

Calculates the determinant of this matrix.

**Returns:** Determinant value

**Usage:**

```typescript
const m = new OSMatrix4().set(/* values */);
const det = m.determinant();
```

#### `invert(): OSMatrix4`

Inverts this matrix.

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix4().set(/* values */);
m.invert(); // m = m^(-1)
```

### Projection Operations

#### `makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number): OSMatrix4`

Creates a perspective projection matrix.

**Parameters:**

- `left`: Left clipping plane
- `right`: Right clipping plane
- `top`: Top clipping plane
- `bottom`: Bottom clipping plane
- `near`: Near clipping plane
- `far`: Far clipping plane

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix4().makePerspective(-1, 1, 1, -1, 1, 100);
```

#### `makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number): OSMatrix4`

Creates an orthographic projection matrix.

**Parameters:**

- `left`: Left clipping plane
- `right`: Right clipping plane
- `top`: Top clipping plane
- `bottom`: Bottom clipping plane
- `near`: Near clipping plane
- `far`: Far clipping plane

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix4().makeOrthographic(-1, 1, 1, -1, 1, 100);
```

### Three.js Integration

#### `toThreeJS(): Matrix4`

Converts this OSMatrix4 to a Three.js Matrix4.

**Returns:** Three.js Matrix4 instance

**Usage:**

```typescript
const osMatrix = new OSMatrix4().set(/* values */);
const threeMatrix = osMatrix.toThreeJS();

// Use in Three.js
const mesh = new THREE.Mesh();
mesh.matrix.copy(osMatrix.toThreeJS());
```

#### `fromThreeJS(m: Matrix4): OSMatrix4`

Creates an OSMatrix4 from a Three.js Matrix4.

**Parameters:**

- `m`: Three.js Matrix4 to convert from

**Returns:** New OSMatrix4 instance

**Usage:**

```typescript
const threeMatrix = new THREE.Matrix4().set(/* values */);
const osMatrix = OSMatrix4.fromThreeJS(threeMatrix);
```

## Performance Characteristics

### Memory Management

- **Method Chaining**: All mutating methods return `this` for efficient chaining
- **Minimal Allocations**: Clone operations only when explicitly requested
- **Efficient Operations**: Optimized 4×4 matrix mathematics

### Numerical Stability

- **Determinant Calculation**: Robust algorithm for 4×4 matrices
- **Matrix Inversion**: Handles singular matrices gracefully
- **Precision**: Uses consistent floating-point operations

### Three.js Integration

- **Lazy Conversion**: Three.js objects created only when needed
- **Bidirectional**: Seamless conversion in both directions
- **Performance**: Conversion methods optimized for minimal overhead

## Usage Examples

### Basic Matrix Operations

```typescript
import { OSMatrix4, OSVector3, OSQuaternion } from "@teskooano/core-math";

// Create identity matrix
const identity = new OSMatrix4();

// Create custom matrix
const m = new OSMatrix4().set(
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
);

// Matrix operations
const transposed = m.clone().transpose();
const determinant = m.determinant();
const inverted = m.clone().invert();
```

### 3D Transformations

```typescript
// Create transformation matrix from quaternion
const rotation = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0), // Y-axis
  Math.PI / 4, // 45 degrees
);

const transformMatrix = new OSMatrix4().makeRotationFromQuaternion(rotation);

// Create look-at matrix for camera
const eye = new OSVector3(10, 10, 10);
const target = new OSVector3(0, 0, 0);
const up = new OSVector3(0, 1, 0);
const viewMatrix = new OSMatrix4().lookAt(eye, target, up);

// Compose transformations
const modelViewMatrix = viewMatrix.clone().multiply(transformMatrix);
```

### Projection Matrices

```typescript
// Create perspective projection
const aspectRatio = 16 / 9;
const fov = Math.PI / 4; // 45 degrees
const near = 0.1;
const far = 1000;

const left = -near * Math.tan(fov / 2) * aspectRatio;
const right = near * Math.tan(fov / 2) * aspectRatio;
const top = near * Math.tan(fov / 2);
const bottom = -near * Math.tan(fov / 2);

const perspectiveMatrix = new OSMatrix4().makePerspective(
  left,
  right,
  top,
  bottom,
  near,
  far,
);

// Create orthographic projection
const orthoMatrix = new OSMatrix4().makeOrthographic(
  -10,
  10,
  10,
  -10,
  0.1,
  100,
);
```

### Camera System

```typescript
class Camera {
  private viewMatrix = new OSMatrix4();
  private projectionMatrix = new OSMatrix4();
  private viewProjectionMatrix = new OSMatrix4();

  constructor(
    public position: OSVector3,
    public target: OSVector3,
    public up: OSVector3,
    public fov: number,
    public aspectRatio: number,
    public near: number,
    public far: number,
  ) {
    this.updateMatrices();
  }

  updateMatrices(): void {
    // Update view matrix
    this.viewMatrix.lookAt(this.position, this.target, this.up);

    // Update projection matrix
    const left = -this.near * Math.tan(this.fov / 2) * this.aspectRatio;
    const right = this.near * Math.tan(this.fov / 2) * this.aspectRatio;
    const top = this.near * Math.tan(this.fov / 2);
    const bottom = -this.near * Math.tan(this.fov / 2);

    this.projectionMatrix.makePerspective(
      left,
      right,
      top,
      bottom,
      this.near,
      this.far,
    );

    // Update combined matrix
    this.viewProjectionMatrix
      .copy(this.projectionMatrix)
      .multiply(this.viewMatrix);
  }

  getViewMatrix(): OSMatrix4 {
    return this.viewMatrix.clone();
  }

  getProjectionMatrix(): OSMatrix4 {
    return this.projectionMatrix.clone();
  }

  getViewProjectionMatrix(): OSMatrix4 {
    return this.viewProjectionMatrix.clone();
  }
}
```

### Three.js Integration

```typescript
import { OSMatrix4, OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";

// Create OSMatrix4
const osMatrix = new OSMatrix4().makePerspective(-1, 1, 1, -1, 1, 100);

// Convert to Three.js
const threeMatrix = osMatrix.toThreeJS();

// Use in Three.js scene
const camera = new THREE.PerspectiveCamera(75, 1, 1, 100);
camera.matrix.copy(threeMatrix);

// Convert back from Three.js
const backToOS = OSMatrix4.fromThreeJS(camera.matrix);
```

### Model-View-Projection Pipeline

```typescript
class MVPTransform {
  private modelMatrix = new OSMatrix4();
  private viewMatrix = new OSMatrix4();
  private projectionMatrix = new OSMatrix4();
  private mvpMatrix = new OSMatrix4();

  setModelMatrix(matrix: OSMatrix4): void {
    this.modelMatrix.copy(matrix);
    this.updateMVP();
  }

  setViewMatrix(matrix: OSMatrix4): void {
    this.viewMatrix.copy(matrix);
    this.updateMVP();
  }

  setProjectionMatrix(matrix: OSMatrix4): void {
    this.projectionMatrix.copy(matrix);
    this.updateMVP();
  }

  private updateMVP(): void {
    // MVP = P * V * M
    this.mvpMatrix
      .copy(this.projectionMatrix)
      .multiply(this.viewMatrix)
      .multiply(this.modelMatrix);
  }

  getMVPMatrix(): OSMatrix4 {
    return this.mvpMatrix.clone();
  }

  // Transform point through MVP pipeline
  transformPoint(point: OSVector3): OSVector3 {
    // Convert to homogeneous coordinates
    const x = point.x;
    const y = point.y;
    const z = point.z;
    const w = 1;

    // Apply MVP transformation
    const m = this.mvpMatrix.elements;
    const resultX = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    const resultY = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    const resultZ = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    const resultW = m[3] * x + m[7] * y + m[11] * z + m[15] * w;

    // Perspective divide
    if (resultW !== 0) {
      return new OSVector3(
        resultX / resultW,
        resultY / resultW,
        resultZ / resultW,
      );
    }

    return new OSVector3(resultX, resultY, resultZ);
  }
}
```

### Matrix Decomposition

```typescript
// Extract transformation components from matrix
class MatrixDecomposition {
  static decompose(matrix: OSMatrix4): {
    translation: OSVector3;
    rotation: OSQuaternion;
    scale: OSVector3;
  } {
    const m = matrix.elements;

    // Extract translation
    const translation = new OSVector3(m[12], m[13], m[14]);

    // Extract scale (from first three columns)
    const scaleX = new OSVector3(m[0], m[1], m[2]).length();
    const scaleY = new OSVector3(m[4], m[5], m[6]).length();
    const scaleZ = new OSVector3(m[8], m[9], m[10]).length();
    const scale = new OSVector3(scaleX, scaleY, scaleZ);

    // Extract rotation (normalize first three columns)
    const rotationMatrix = new OSMatrix4().set(
      m[0] / scaleX,
      m[4] / scaleY,
      m[8] / scaleZ,
      0,
      m[1] / scaleX,
      m[5] / scaleY,
      m[9] / scaleZ,
      0,
      m[2] / scaleX,
      m[6] / scaleY,
      m[10] / scaleZ,
      0,
      0,
      0,
      0,
      1,
    );

    // Convert rotation matrix to quaternion
    const rotation = new OSQuaternion();
    // Implementation would extract quaternion from rotation matrix

    return { translation, rotation, scale };
  }
}
```

### Performance Optimization

```typescript
// Matrix pool for performance-critical applications
class Matrix4Pool {
  private pool: OSMatrix4[] = [];

  get(): OSMatrix4 {
    if (this.pool.length > 0) {
      return this.pool.pop()!.identity();
    }
    return new OSMatrix4();
  }

  release(matrix: OSMatrix4): void {
    if (this.pool.length < 20) {
      // Limit pool size
      this.pool.push(matrix);
    }
  }
}

// Usage in rendering loop
const pool = new Matrix4Pool();

function renderFrame() {
  const tempMatrix = pool.get();

  // Use temp matrix for calculations
  tempMatrix.makePerspective(-1, 1, 1, -1, 1, 100);

  // Return to pool when done
  pool.release(tempMatrix);
}
```

## Mathematical Background

### Matrix Properties

- **Square Matrix**: 4×4 matrix for 3D transformations with homogeneous coordinates
- **Column-Major Storage**: Compatible with OpenGL and graphics programming
- **Homogeneous Coordinates**: Allows translation, rotation, and scaling in single matrix
- **Determinant**: Measures matrix scaling factor and invertibility

### Common Use Cases

- **3D Graphics**: Model, view, and projection transformations
- **Camera Systems**: View matrix construction and projection
- **Physics**: Coordinate system transformations
- **Animation**: Keyframe interpolation and bone transformations

### Performance Considerations

- **Memory Layout**: Column-major format optimized for graphics hardware
- **Cache Efficiency**: Contiguous memory access patterns
- **SIMD Compatibility**: Structure suitable for vectorized operations
- **GPU Upload**: Format compatible with GPU uniform buffers

## 🔗 Related

- [[core/core-math/OSVector3|OSVector3]] - Vectors transformed by 4×4 matrices
- [[core/core-math/OSMatrix3|OSMatrix3]] - 3×3 matrices for 2D transformations
- [[core/core-math/OSQuaternion|OSQuaternion]] - Quaternions converted to rotation matrices
- [[core/core-math/Constants|Constants]] - Mathematical constants
- [[core/core-physics/core-physics|@teskooano/core-physics]] - Physics transformations using matrices
- [[threejs-renderers/threejs/threejs|@teskooano/renderer-threejs]] - Rendering pipeline with matrices
