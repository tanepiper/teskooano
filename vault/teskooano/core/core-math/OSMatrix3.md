---
aliases: [OSMatrix3]
tags: [core, math, matrix, linear-algebra]
type: Class
package: "@teskooano/core-math"
name: OSMatrix3
dependencies: ["three"]
methods:
  [
    "constructor",
    "set",
    "identity",
    "clone",
    "copy",
    "multiplyScalar",
    "determinant",
    "invert",
    "transpose",
    "toThreeJS",
  ]
status: active
---

# OSMatrix3

3×3 matrix class for 2D transformations, linear algebra operations, and Three.js compatibility with column-major storage format.

## Overview

The `OSMatrix3` class represents a 3×3 matrix used for 2D transformations, linear algebra operations, and coordinate system transformations in the Open Space engine. The matrix uses column-major storage format for compatibility with OpenGL and Three.js, making it suitable for graphics programming and mathematical computations.

## Matrix Representation

### Storage Format

The matrix is stored in column-major order as a flat array:

```
[m11, m21, m31]
[m12, m22, m32]
[m13, m23, m33]
```

Stored as: `[m11, m21, m31, m12, m22, m32, m13, m23, m33]`

### Identity Matrix

The identity matrix (no transformation) is:

```
[1, 0, 0]
[0, 1, 0]
[0, 0, 1]
```

## API Reference

### Constructor

#### `constructor(): OSMatrix3`

Creates a new OSMatrix3 instance initialized to the identity matrix.

**Returns:** New OSMatrix3 instance (identity matrix)

**Usage:**

```typescript
const m = new OSMatrix3();
// m.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1]
```

### Basic Operations

#### `set(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number): OSMatrix3`

Sets the elements of this matrix.

**Parameters:**

- `n11`: Element in row 1, column 1
- `n12`: Element in row 1, column 2
- `n13`: Element in row 1, column 3
- `n21`: Element in row 2, column 1
- `n22`: Element in row 2, column 2
- `n23`: Element in row 2, column 3
- `n31`: Element in row 3, column 1
- `n32`: Element in row 3, column 2
- `n33`: Element in row 3, column 3

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix3();
m.set(1, 2, 3, 4, 5, 6, 7, 8, 9);
// Creates matrix:
// [1, 2, 3]
// [4, 5, 6]
// [7, 8, 9]
```

#### `identity(): OSMatrix3`

Resets this matrix to the identity matrix.

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
m.identity(); // m = identity matrix
```

#### `clone(): OSMatrix3`

Creates a clone of this matrix.

**Returns:** New OSMatrix3 instance with same elements

**Usage:**

```typescript
const m1 = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
const m2 = m1.clone();
```

#### `copy(m: OSMatrix3): OSMatrix3`

Copies the elements from another OSMatrix3.

**Parameters:**

- `m`: Matrix to copy from

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m1 = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
const m2 = new OSMatrix3();
m2.copy(m1);
```

### Mathematical Operations

#### `multiplyScalar(s: number): OSMatrix3`

Multiplies this matrix by a scalar.

**Parameters:**

- `s`: Scalar value

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
m.multiplyScalar(2);
// Result:
// [2, 4, 6]
// [8, 10, 12]
// [14, 16, 18]
```

#### `determinant(): number`

Calculates the determinant of this matrix.

**Returns:** Determinant value

**Usage:**

```typescript
const m = new OSMatrix3().set(2, 3, 1, 0, 1, 2, 0, 2, 1);
const det = m.determinant(); // -6
```

#### `invert(): OSMatrix3`

Inverts this matrix.

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix3().set(2, 0, 0, 0, 4, 0, 0, 0, 5);
m.invert();
// Result (diagonal matrix inverse):
// [0.5, 0, 0]
// [0, 0.25, 0]
// [0, 0, 0.2]
```

#### `transpose(): OSMatrix3`

Transposes this matrix.

**Returns:** This matrix for chaining

**Usage:**

```typescript
const m = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
m.transpose();
// Original:    Transposed:
// [1, 2, 3]    [1, 4, 7]
// [4, 5, 6] -> [2, 5, 8]
// [7, 8, 9]    [3, 6, 9]
```

### Three.js Integration

#### `toThreeJS(): Matrix3`

Converts this OSMatrix3 to a Three.js Matrix3.

**Returns:** Three.js Matrix3 instance

**Usage:**

```typescript
const osMatrix = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
const threeMatrix = osMatrix.toThreeJS();

// Use in Three.js
const material = new THREE.ShaderMaterial();
material.uniforms.normalMatrix.value = osMatrix.toThreeJS();
```

#### `fromThreeJS(m: Matrix3): OSMatrix3`

Creates an OSMatrix3 from a Three.js Matrix3.

**Parameters:**

- `m`: Three.js Matrix3 to convert from

**Returns:** New OSMatrix3 instance

**Usage:**

```typescript
const threeMatrix = new THREE.Matrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
const osMatrix = OSMatrix3.fromThreeJS(threeMatrix);
```

## Performance Characteristics

### Memory Management

- **Method Chaining**: All mutating methods return `this` for efficient chaining
- **Minimal Allocations**: Clone operations only when explicitly requested
- **Efficient Operations**: Optimized matrix mathematics

### Numerical Stability

- **Determinant Calculation**: Robust algorithm for edge cases
- **Matrix Inversion**: Handles singular matrices gracefully
- **Precision**: Uses consistent floating-point operations

### Three.js Integration

- **Lazy Conversion**: Three.js objects created only when needed
- **Bidirectional**: Seamless conversion in both directions
- **Performance**: Conversion methods optimized for minimal overhead

## Usage Examples

### Basic Matrix Operations

```typescript
import { OSMatrix3 } from "@teskooano/core-math";

// Create identity matrix
const identity = new OSMatrix3();

// Create custom matrix
const m = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);

// Matrix operations
const scaled = m.clone().multiplyScalar(2);
const transposed = m.clone().transpose();
const determinant = m.determinant();
```

### 2D Transformations

```typescript
// Create 2D rotation matrix (around Z-axis)
function createRotationMatrix(angle: number): OSMatrix3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return new OSMatrix3().set(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
}

// Create 2D scaling matrix
function createScalingMatrix(sx: number, sy: number): OSMatrix3 {
  return new OSMatrix3().set(sx, 0, 0, 0, sy, 0, 0, 0, 1);
}

// Create 2D translation matrix
function createTranslationMatrix(tx: number, ty: number): OSMatrix3 {
  return new OSMatrix3().set(1, 0, tx, 0, 1, ty, 0, 0, 1);
}

// Compose transformations
const rotation = createRotationMatrix(Math.PI / 4); // 45°
const scaling = createScalingMatrix(2, 2);
const translation = createTranslationMatrix(10, 20);

// Apply transformations in order: translate -> scale -> rotate
const transform = rotation.clone().multiply(scaling).multiply(translation);
```

### Linear Algebra Operations

```typescript
// Solve linear system Ax = b using matrix inversion
function solveLinearSystem(A: OSMatrix3, b: number[]): number[] {
  const det = A.determinant();
  if (Math.abs(det) < 1e-10) {
    throw new Error("Matrix is singular, cannot solve system");
  }

  const AInv = A.clone().invert();
  const x = [
    AInv.elements[0] * b[0] + AInv.elements[3] * b[1] + AInv.elements[6] * b[2],
    AInv.elements[1] * b[0] + AInv.elements[4] * b[1] + AInv.elements[7] * b[2],
    AInv.elements[2] * b[0] + AInv.elements[5] * b[1] + AInv.elements[8] * b[2],
  ];

  return x;
}

// Example: Solve 2x + 3y = 7, 4x + 5y = 11
const A = new OSMatrix3().set(2, 3, 0, 4, 5, 0, 0, 0, 1);
const b = [7, 11, 0];
const solution = solveLinearSystem(A, b);
console.log(`x = ${solution[0]}, y = ${solution[1]}`);
```

### Three.js Integration

```typescript
import { OSMatrix3 } from "@teskooano/core-math";
import * as THREE from "three";

// Create OSMatrix3
const osMatrix = new OSMatrix3().set(1, 0, 0, 0, 1, 0, 0, 0, 1);

// Convert to Three.js
const threeMatrix = osMatrix.toThreeJS();

// Use in Three.js shader
const material = new THREE.ShaderMaterial({
  uniforms: {
    normalMatrix: { value: osMatrix.toThreeJS() },
  },
});

// Convert back from Three.js
const backToOS = OSMatrix3.fromThreeJS(threeMatrix);
```

### Coordinate System Transformations

```typescript
// Transform between coordinate systems
class CoordinateTransformer {
  private transformMatrix: OSMatrix3;

  constructor() {
    this.transformMatrix = new OSMatrix3().identity();
  }

  // Set transformation from source to target coordinate system
  setTransformation(
    sourceOrigin: [number, number],
    sourceAxes: [[number, number], [number, number]],
    targetOrigin: [number, number],
    targetAxes: [[number, number], [number, number]],
  ) {
    // Create transformation matrix
    // Implementation depends on specific transformation requirements
    this.transformMatrix.set(
      targetAxes[0][0],
      targetAxes[1][0],
      targetOrigin[0],
      targetAxes[0][1],
      targetAxes[1][1],
      targetOrigin[1],
      0,
      0,
      1,
    );
  }

  // Transform point from source to target coordinate system
  transformPoint(x: number, y: number): [number, number] {
    const resultX =
      this.transformMatrix.elements[0] * x +
      this.transformMatrix.elements[3] * y +
      this.transformMatrix.elements[6];
    const resultY =
      this.transformMatrix.elements[1] * x +
      this.transformMatrix.elements[4] * y +
      this.transformMatrix.elements[7];

    return [resultX, resultY];
  }
}
```

### Matrix Validation

```typescript
// Validate matrix properties
function validateMatrix(m: OSMatrix3): boolean {
  // Check for NaN or Infinity
  for (let i = 0; i < 9; i++) {
    if (!Number.isFinite(m.elements[i])) {
      console.warn("Matrix has non-finite elements");
      return false;
    }
  }

  // Check determinant for invertibility
  const det = m.determinant();
  if (Math.abs(det) < 1e-10) {
    console.warn("Matrix is nearly singular");
    return false;
  }

  return true;
}

// Usage
const m = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
if (validateMatrix(m)) {
  console.log("Valid matrix");
}
```

### Performance Optimization

```typescript
// Reuse matrix instances for better performance
class MatrixPool {
  private pool: OSMatrix3[] = [];

  get(): OSMatrix3 {
    if (this.pool.length > 0) {
      return this.pool.pop()!.identity();
    }
    return new OSMatrix3();
  }

  release(matrix: OSMatrix3): void {
    if (this.pool.length < 10) {
      // Limit pool size
      this.pool.push(matrix);
    }
  }
}

// Usage in performance-critical code
const pool = new MatrixPool();

function performTransformations() {
  const temp = pool.get();

  // Use temp matrix for calculations
  temp.set(1, 2, 3, 4, 5, 6, 7, 8, 9);
  const det = temp.determinant();

  // Return to pool when done
  pool.release(temp);
}
```

## Mathematical Background

### Matrix Properties

- **Square Matrix**: 3×3 matrix for 2D transformations with homogeneous coordinates
- **Column-Major Storage**: Compatible with OpenGL and graphics programming
- **Determinant**: Measures matrix scaling factor and invertibility
- **Transpose**: Swaps rows and columns

### Common Use Cases

- **2D Graphics**: Transformations in 2D space
- **Linear Algebra**: Solving systems of linear equations
- **Coordinate Systems**: Converting between different coordinate frames
- **Normal Matrices**: Transforming normal vectors in 3D graphics

### Performance Considerations

- **Memory Layout**: Column-major format optimized for graphics hardware
- **Cache Efficiency**: Contiguous memory access patterns
- **SIMD Compatibility**: Structure suitable for vectorized operations

## 🔗 Related

- [[core/core-math/OSVector3|OSVector3]] - Vectors transformed by matrices
- [[core/core-math/OSMatrix4|OSMatrix4]] - 4×4 matrices for 3D transformations
- [[core/core-math/OSQuaternion|OSQuaternion]] - Quaternions for 3D rotations
- [[core/core-math/Constants|Constants]] - Mathematical constants
- [[core/core-physics/core-physics|@teskooano/core-physics]] - Physics calculations using matrices
- [[threejs-renderers/threejs/threejs|@teskooano/renderer-threejs]] - Rendering transformations
