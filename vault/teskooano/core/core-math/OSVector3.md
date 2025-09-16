---
aliases: [OSVector3]
tags: [core, math, vector]
type: Class
package: "@teskooano/core-math"
name: OSVector3
dependencies: ["three"]
methods:
  [
    "constructor",
    "clone",
    "set",
    "copy",
    "add",
    "sub",
    "multiplyScalar",
    "divideScalar",
    "lengthSq",
    "length",
    "normalize",
    "dot",
    "cross",
    "distanceToSquared",
    "distanceTo",
    "equals",
    "lerp",
    "angleTo",
    "projectOnVector",
    "reflect",
    "toString",
    "toThreeJS",
    "applyQuaternion",
    "addScaledVector",
    "subScaledVector",
    "negate",
    "setFromArray",
    "toArray",
    "isFinite",
    "setZero",
  ]
status: active
---

# OSVector3

3D vector class implementing the Open Space engine's Y-up coordinate system with comprehensive vector operations, geometric calculations, and Three.js interoperability.

## Overview

The `OSVector3` class represents a 3-dimensional vector in the Open Space engine's coordinate system. It provides a complete set of vector operations optimized for performance while maintaining compatibility with Three.js through conversion methods. The class is designed to be the primary vector type for all physics calculations, geometric operations, and coordinate transformations throughout the engine.

## Coordinate System

### Y-Up Right-Handed System

- **X-axis**: Right direction (positive X points right)
- **Y-axis**: Up direction (positive Y points up)
- **Z-axis**: Forward direction (positive Z points forward)

### Cross Product Rules

The class implements right-handed cross product rules:

- X × Y = Z
- Y × Z = X
- Z × X = Y

## API Reference

### Constructor

#### `constructor(x?: number, y?: number, z?: number): OSVector3`

Creates a new OSVector3 instance.

**Parameters:**

- `x`: X component (default: 0)
- `y`: Y component (default: 0)
- `z`: Z component (default: 0)

**Returns:** New OSVector3 instance

**Usage:**

```typescript
const v1 = new OSVector3(); // (0, 0, 0)
const v2 = new OSVector3(1, 2, 3); // (1, 2, 3)
const v3 = new OSVector3(1, 0, 0); // X-axis unit vector
```

### Basic Operations

#### `clone(): OSVector3`

Creates a copy of this vector.

**Returns:** New OSVector3 instance with same components

**Usage:**

```typescript
const original = new OSVector3(1, 2, 3);
const copy = original.clone(); // (1, 2, 3)
```

#### `set(x: number, y: number, z: number): OSVector3`

Sets the components of this vector.

**Parameters:**

- `x`: New X component
- `y`: New Y component
- `z`: New Z component

**Returns:** This vector for chaining

**Usage:**

```typescript
const v = new OSVector3();
v.set(1, 2, 3); // v = (1, 2, 3)
```

#### `copy(v: OSVector3): OSVector3`

Copies the components from another vector.

**Parameters:**

- `v`: Vector to copy from

**Returns:** This vector for chaining

**Usage:**

```typescript
const v1 = new OSVector3(1, 2, 3);
const v2 = new OSVector3();
v2.copy(v1); // v2 = (1, 2, 3)
```

### Arithmetic Operations

#### `add(v: OSVector3): OSVector3`

Adds another vector to this vector.

**Parameters:**

- `v`: Vector to add

**Returns:** This vector for chaining

**Usage:**

```typescript
const v1 = new OSVector3(1, 2, 3);
const v2 = new OSVector3(4, 5, 6);
v1.add(v2); // v1 = (5, 7, 9)
```

#### `sub(v: OSVector3): OSVector3`

Subtracts another vector from this vector.

**Parameters:**

- `v`: Vector to subtract

**Returns:** This vector for chaining

**Usage:**

```typescript
const v1 = new OSVector3(5, 7, 9);
const v2 = new OSVector3(4, 5, 6);
v1.sub(v2); // v1 = (1, 2, 3)
```

#### `multiplyScalar(scalar: number): OSVector3`

Multiplies this vector by a scalar value.

**Parameters:**

- `scalar`: Scalar value to multiply by

**Returns:** This vector for chaining

**Usage:**

```typescript
const v = new OSVector3(1, 2, 3);
v.multiplyScalar(2); // v = (2, 4, 6)
```

#### `divideScalar(scalar: number): OSVector3`

Divides this vector by a scalar value.

**Parameters:**

- `scalar`: Scalar value to divide by

**Returns:** This vector for chaining

**Usage:**

```typescript
const v = new OSVector3(2, 4, 6);
v.divideScalar(2); // v = (1, 2, 3)
```

### Geometric Operations

#### `lengthSq(): number`

Calculates the squared length (magnitude squared) of this vector.

**Returns:** Squared length (avoids square root calculation)

**Usage:**

```typescript
const v = new OSVector3(3, 4, 0);
const lengthSq = v.lengthSq(); // 25
```

#### `length(): number`

Calculates the length (magnitude) of this vector.

**Returns:** Vector length

**Usage:**

```typescript
const v = new OSVector3(3, 4, 0);
const length = v.length(); // 5
```

#### `normalize(): OSVector3`

Normalizes this vector to have a length of 1.

**Returns:** This vector for chaining

**Usage:**

```typescript
const v = new OSVector3(3, 4, 0);
v.normalize(); // v = (0.6, 0.8, 0)
```

#### `dot(v: OSVector3): number`

Calculates the dot product of this vector and another vector.

**Parameters:**

- `v`: Other vector

**Returns:** Dot product value

**Usage:**

```typescript
const v1 = new OSVector3(1, 2, 3);
const v2 = new OSVector3(4, 5, 6);
const dot = v1.dot(v2); // 32
```

#### `cross(v: OSVector3): OSVector3`

Calculates the cross product of this vector and another vector.

**Parameters:**

- `v`: Other vector

**Returns:** This vector for chaining (set to cross product result)

**Usage:**

```typescript
const v1 = new OSVector3(1, 0, 0); // X-axis
const v2 = new OSVector3(0, 1, 0); // Y-axis
v1.cross(v2); // v1 = (0, 0, 1) - Z-axis
```

### Distance Operations

#### `distanceToSquared(v: OSVector3): number`

Calculates the squared distance between this vector and another vector.

**Parameters:**

- `v`: Other vector

**Returns:** Squared distance

**Usage:**

```typescript
const v1 = new OSVector3(0, 0, 0);
const v2 = new OSVector3(3, 4, 0);
const distSq = v1.distanceToSquared(v2); // 25
```

#### `distanceTo(v: OSVector3): number`

Calculates the distance between this vector and another vector.

**Parameters:**

- `v`: Other vector

**Returns:** Distance

**Usage:**

```typescript
const v1 = new OSVector3(0, 0, 0);
const v2 = new OSVector3(3, 4, 0);
const distance = v1.distanceTo(v2); // 5
```

### Advanced Operations

#### `equals(v: OSVector3, tolerance?: number): boolean`

Checks if this vector is equal to another vector within a tolerance.

**Parameters:**

- `v`: Other vector
- `tolerance`: Tolerance for comparison (default: EPSILON)

**Returns:** True if vectors are equal within tolerance

**Usage:**

```typescript
const v1 = new OSVector3(1, 2, 3);
const v2 = new OSVector3(1.000001, 2.000001, 3.000001);
const isEqual = v1.equals(v2); // true (within EPSILON)
```

#### `lerp(v: OSVector3, alpha: number): OSVector3`

Linearly interpolates between this vector and another vector.

**Parameters:**

- `v`: Target vector
- `alpha`: Interpolation factor (0.0 to 1.0)

**Returns:** This vector for chaining

**Usage:**

```typescript
const v1 = new OSVector3(0, 0, 0);
const v2 = new OSVector3(10, 20, 30);
v1.lerp(v2, 0.5); // v1 = (5, 10, 15)
```

#### `angleTo(v: OSVector3): number`

Calculates the angle between this vector and another vector in radians.

**Parameters:**

- `v`: Other vector

**Returns:** Angle in radians

**Usage:**

```typescript
const v1 = new OSVector3(1, 0, 0);
const v2 = new OSVector3(0, 1, 0);
const angle = v1.angleTo(v2); // π/2 (90 degrees)
```

#### `projectOnVector(v: OSVector3): OSVector3`

Projects this vector onto another vector.

**Parameters:**

- `v`: Vector to project onto

**Returns:** This vector for chaining (set to projection result)

**Usage:**

```typescript
const v1 = new OSVector3(2, 3, 0);
const v2 = new OSVector3(1, 0, 0); // X-axis
v1.projectOnVector(v2); // v1 = (2, 0, 0)
```

#### `reflect(normal: OSVector3): OSVector3`

Reflects this vector off a plane specified by its normal vector.

**Parameters:**

- `normal`: Normal vector of the plane (must be unit vector)

**Returns:** This vector for chaining (set to reflection result)

**Usage:**

```typescript
const v = new OSVector3(1, -1, 0); // Incident vector
const normal = new OSVector3(0, 1, 0); // Floor normal
v.reflect(normal); // v = (1, 1, 0) - reflected vector
```

### Utility Methods

#### `toString(): string`

Converts this vector to a string representation.

**Returns:** String in format "(x, y, z)"

**Usage:**

```typescript
const v = new OSVector3(1.5, 2.7, -3.2);
const str = v.toString(); // "(1.500e+0, 2.700e+0, -3.200e+0)"
```

#### `toThreeJS(target?: Vector3): Vector3`

Converts this OSVector3 to a Three.js Vector3.

**Parameters:**

- `target`: Optional existing Vector3 to update

**Returns:** Three.js Vector3 instance

**Usage:**

```typescript
const osVector = new OSVector3(1, 2, 3);
const threeVector = osVector.toThreeJS();

// Or update existing Three.js vector
const existingVector = new THREE.Vector3();
osVector.toThreeJS(existingVector);
```

#### `applyQuaternion(q: OSQuaternion): OSVector3`

Applies a quaternion rotation to this vector.

**Parameters:**

- `q`: Quaternion to apply

**Returns:** This vector for chaining

**Usage:**

```typescript
const v = new OSVector3(1, 0, 0);
const q = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0), // Y-axis
  Math.PI / 2, // 90 degrees
);
v.applyQuaternion(q); // v = (0, 0, -1)
```

### Advanced Utility Methods

#### `addScaledVector(v: OSVector3, scalar: number): OSVector3`

Adds a scaled vector to this vector.

**Parameters:**

- `v`: Vector to scale and add
- `scalar`: Scalar to multiply the vector by

**Returns:** This vector for chaining

**Usage:**

```typescript
const v1 = new OSVector3(1, 2, 3);
const v2 = new OSVector3(4, 5, 6);
v1.addScaledVector(v2, 2); // v1 = (9, 12, 15)
```

#### `subScaledVector(v: OSVector3, scalar: number): OSVector3`

Subtracts a scaled vector from this vector.

**Parameters:**

- `v`: Vector to scale and subtract
- `scalar`: Scalar to multiply the vector by

**Returns:** This vector for chaining

**Usage:**

```typescript
const v1 = new OSVector3(10, 12, 15);
const v2 = new OSVector3(4, 5, 6);
v1.subScaledVector(v2, 2); // v1 = (2, 2, 3)
```

#### `negate(): OSVector3`

Negates this vector (multiplies by -1).

**Returns:** This vector for chaining

**Usage:**

```typescript
const v = new OSVector3(1, -2, 3);
v.negate(); // v = (-1, 2, -3)
```

#### `setFromArray(array: number[], offset?: number): OSVector3`

Sets this vector's components from an array.

**Parameters:**

- `array`: Array to read from
- `offset`: Offset into the array (default: 0)

**Returns:** This vector for chaining

**Usage:**

```typescript
const v = new OSVector3();
const array = [1, 2, 3, 4, 5, 6];
v.setFromArray(array, 1); // v = (2, 3, 4)
```

#### `toArray(): [number, number, number]`

Converts this vector to an array.

**Returns:** Array with [x, y, z] components

**Usage:**

```typescript
const v = new OSVector3(1, 2, 3);
const array = v.toArray(); // [1, 2, 3]
```

#### `isFinite(): boolean`

Checks if this vector has any non-finite components (NaN or Infinity).

**Returns:** True if all components are finite

**Usage:**

```typescript
const v1 = new OSVector3(1, 2, 3);
const v2 = new OSVector3(1, NaN, 3);
const v3 = new OSVector3(1, 2, Infinity);

console.log(v1.isFinite()); // true
console.log(v2.isFinite()); // false
console.log(v3.isFinite()); // false
```

#### `setZero(): OSVector3`

Sets this vector to zero.

**Returns:** This vector for chaining

**Usage:**

```typescript
const v = new OSVector3(1, 2, 3);
v.setZero(); // v = (0, 0, 0)
```

### Static Methods

#### `fromThreeJS(v: Vector3): OSVector3`

Creates an OSVector3 from a Three.js Vector3.

**Parameters:**

- `v`: Three.js Vector3 to convert from

**Returns:** New OSVector3 instance

**Usage:**

```typescript
const threeVector = new THREE.Vector3(1, 2, 3);
const osVector = OSVector3.fromThreeJS(threeVector);
```

## Performance Characteristics

### Memory Management

- **Method Chaining**: All mutating methods return `this` for efficient chaining
- **Minimal Allocations**: Clone operations only when explicitly requested
- **Efficient Operations**: Optimized algorithms for common vector operations

### Precision Handling

- **Epsilon Tolerance**: Uses consistent EPSILON constant for floating-point comparisons
- **Relative Tolerance**: THREE.js-compatible equality checking for large and small numbers
- **Numerical Stability**: Robust handling of edge cases (zero vectors, degenerate cases)

### Three.js Integration

- **Lazy Conversion**: Three.js objects created only when needed
- **Bidirectional**: Seamless conversion in both directions
- **Performance**: Conversion methods optimized for minimal overhead

## Usage Examples

### Basic Vector Operations

```typescript
import { OSVector3 } from "@teskooano/core-math";

// Create vectors
const v1 = new OSVector3(1, 2, 3);
const v2 = new OSVector3(4, 5, 6);

// Basic arithmetic
v1.add(v2); // v1 = (5, 7, 9)
v1.multiplyScalar(2); // v1 = (10, 14, 18)
v1.normalize(); // v1 = unit vector

// Geometric operations
const dot = v1.dot(v2); // Dot product
const cross = v1.clone().cross(v2); // Cross product
const distance = v1.distanceTo(v2); // Distance between vectors
```

### Coordinate System Validation

```typescript
// Verify right-handed coordinate system
const x = new OSVector3(1, 0, 0);
const y = new OSVector3(0, 1, 0);
const z = new OSVector3(0, 0, 1);

// Right-handed cross products
const xy = x.clone().cross(y); // Should equal z
const yz = y.clone().cross(z); // Should equal x
const zx = z.clone().cross(x); // Should equal y

console.log(xy.equals(z)); // true
console.log(yz.equals(x)); // true
console.log(zx.equals(y)); // true
```

### Three.js Integration

```typescript
import { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";

// Convert to Three.js
const osVector = new OSVector3(1, 2, 3);
const threeVector = osVector.toThreeJS();

// Use in Three.js scene
const mesh = new THREE.Mesh();
mesh.position.copy(osVector.toThreeJS());

// Convert from Three.js
const threeVector2 = new THREE.Vector3(4, 5, 6);
const osVector2 = OSVector3.fromThreeJS(threeVector2);
```

### Physics Calculations

```typescript
// Calculate gravitational force
const position1 = new OSVector3(0, 0, 0);
const position2 = new OSVector3(1000, 0, 0);
const direction = position2.clone().sub(position1);
const distance = direction.length();
direction.normalize();

// Force magnitude (simplified)
const forceMagnitude = (G * mass1 * mass2) / (distance * distance);
const force = direction.multiplyScalar(forceMagnitude);
```

### Geometric Transformations

```typescript
// Project point onto plane
const point = new OSVector3(1, 2, 3);
const planeNormal = new OSVector3(0, 1, 0).normalize();
const planePoint = new OSVector3(0, 0, 0);

const toPoint = point.clone().sub(planePoint);
const projection = toPoint.clone().projectOnVector(planeNormal);
const projectedPoint = planePoint.clone().add(projection);
```

## 🔗 Related

- [[core/core-math/OSQuaternion|OSQuaternion]] - Quaternion rotations applied to vectors
- [[core/core-math/OSMatrix3|OSMatrix3]] - 2D transformations using vectors
- [[core/core-math/OSMatrix4|OSMatrix4]] - 3D transformations using vectors
- [[core/core-math/Constants|Constants]] - EPSILON constant for precision
- [[core/core-physics/core-physics|@teskooano/core-physics]] - Physics calculations using vectors
- [[core/core-state/core-state|@teskooano/core-state]] - State management with vector operations
