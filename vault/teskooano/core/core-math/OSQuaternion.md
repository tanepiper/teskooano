---
aliases: [OSQuaternion]
tags: [core, math, quaternion, rotation]
type: Class
package: "@teskooano/core-math"
name: OSQuaternion
dependencies: ["three"]
methods:
  [
    "constructor",
    "clone",
    "set",
    "copy",
    "dot",
    "lengthSq",
    "length",
    "normalize",
    "conjugate",
    "invert",
    "multiply",
    "slerp",
    "setFromAxisAngle",
    "setFromEuler",
    "toThreeJS",
  ]
status: active
---

# OSQuaternion

Quaternion class for 3D rotations with support for axis-angle representations, Euler angles, spherical interpolation, and Three.js compatibility.

## Overview

The `OSQuaternion` class represents a 3D rotation using quaternions, providing a robust and efficient way to handle 3D rotations in the Open Space engine. Quaternions avoid gimbal lock issues and provide smooth interpolation between rotations, making them ideal for 3D graphics and physics simulations.

## Quaternion Mathematics

### Quaternion Components

A quaternion is represented as q = (x, y, z, w) where:

- **x, y, z**: Vector components (imaginary part)
- **w**: Scalar component (real part)

### Rotation Representation

For a rotation by angle θ around axis (ax, ay, az):

- **x = ax × sin(θ/2)**
- **y = ay × sin(θ/2)**
- **z = az × sin(θ/2)**
- **w = cos(θ/2)**

### Identity Quaternion

The identity quaternion (no rotation) is (0, 0, 0, 1).

## API Reference

### Constructor

#### `constructor(x?: number, y?: number, z?: number, w?: number): OSQuaternion`

Creates a new OSQuaternion instance.

**Parameters:**

- `x`: X component (default: 0)
- `y`: Y component (default: 0)
- `z`: Z component (default: 0)
- `w`: W component (default: 1)

**Returns:** New OSQuaternion instance (identity quaternion by default)

**Usage:**

```typescript
const q1 = new OSQuaternion(); // Identity quaternion (0, 0, 0, 1)
const q2 = new OSQuaternion(0, 0, 0, 1); // Identity quaternion
const q3 = new OSQuaternion(0, 0.707, 0, 0.707); // 90° rotation around Y-axis
```

### Basic Operations

#### `clone(): OSQuaternion`

Creates a copy of this quaternion.

**Returns:** New OSQuaternion instance with same components

**Usage:**

```typescript
const original = new OSQuaternion(0, 0.707, 0, 0.707);
const copy = original.clone();
```

#### `set(x: number, y: number, z: number, w: number): OSQuaternion`

Sets the components of this quaternion.

**Parameters:**

- `x`: New X component
- `y`: New Y component
- `z`: New Z component
- `w`: New W component

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q = new OSQuaternion();
q.set(0, 0.707, 0, 0.707); // 90° rotation around Y-axis
```

#### `copy(q: OSQuaternion): OSQuaternion`

Copies the components from another quaternion.

**Parameters:**

- `q`: Quaternion to copy from

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q1 = new OSQuaternion(0, 0.707, 0, 0.707);
const q2 = new OSQuaternion();
q2.copy(q1);
```

### Mathematical Operations

#### `dot(q: OSQuaternion): number`

Calculates the dot product of this quaternion with another quaternion.

**Parameters:**

- `q`: Other quaternion

**Returns:** Dot product value

**Usage:**

```typescript
const q1 = new OSQuaternion(1, 2, 3, 4);
const q2 = new OSQuaternion(5, 6, 7, 8);
const dot = q1.dot(q2); // 1*5 + 2*6 + 3*7 + 4*8 = 70
```

#### `lengthSq(): number`

Calculates the squared length of this quaternion.

**Returns:** Squared length

**Usage:**

```typescript
const q = new OSQuaternion(1, 2, 3, 4);
const lengthSq = q.lengthSq(); // 1² + 2² + 3² + 4² = 30
```

#### `length(): number`

Calculates the length of this quaternion.

**Returns:** Length

**Usage:**

```typescript
const q = new OSQuaternion(1, 2, 3, 4);
const length = q.length(); // √30 ≈ 5.477
```

#### `normalize(): OSQuaternion`

Normalizes this quaternion to have a length of 1.

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q = new OSQuaternion(3, 4, 0, 0);
q.normalize(); // q = (0.6, 0.8, 0, 0)
```

#### `conjugate(): OSQuaternion`

Computes the conjugate of this quaternion.

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q = new OSQuaternion(1, 2, 3, 4);
q.conjugate(); // q = (-1, -2, -3, 4)
```

#### `invert(): OSQuaternion`

Inverts this quaternion.

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q = new OSQuaternion(0, 0.707, 0, 0.707); // 90° rotation
const qInv = q.clone().invert(); // -90° rotation (inverse)

// Test: q * qInv should be identity
const result = q.clone().multiply(qInv);
console.log(result.equals(new OSQuaternion())); // true
```

#### `multiply(q: OSQuaternion): OSQuaternion`

Multiplies this quaternion by another quaternion.

**Parameters:**

- `q`: Quaternion to multiply by (on the right)

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q1 = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0), // Y-axis
  Math.PI / 2, // 90°
);
const q2 = new OSQuaternion().setFromAxisAngle(
  new OSVector3(1, 0, 0), // X-axis
  Math.PI / 2, // 90°
);

// Compose rotations: q1 then q2
const combined = q1.clone().multiply(q2);
```

### Interpolation

#### `slerp(qb: OSQuaternion, t: number): OSQuaternion`

Performs spherical linear interpolation between this quaternion and another.

**Parameters:**

- `qb`: Target quaternion
- `t`: Interpolation factor (0.0 to 1.0)

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q1 = new OSQuaternion(); // Identity
const q2 = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0), // Y-axis
  Math.PI / 2, // 90°
);

// Interpolate halfway
const interpolated = q1.clone().slerp(q2, 0.5);
// Result: 45° rotation around Y-axis
```

### Rotation Creation

#### `setFromAxisAngle(axis: OSVector3, angle: number): OSQuaternion`

Sets this quaternion from a rotation specified by an axis and an angle.

**Parameters:**

- `axis`: Axis of rotation (must be normalized)
- `angle`: Angle of rotation in radians

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q = new OSQuaternion();
const axis = new OSVector3(0, 1, 0).normalize(); // Y-axis
const angle = Math.PI / 2; // 90 degrees
q.setFromAxisAngle(axis, angle);

// Apply to vector
const v = new OSVector3(1, 0, 0);
v.applyQuaternion(q); // v = (0, 0, -1)
```

#### `setFromEuler(euler: OSVector3, order: "XYZ"): OSQuaternion`

Sets this quaternion's rotation from a set of Euler angles.

**Parameters:**

- `euler`: OSVector3 representing Euler angles in degrees
- `order`: Order of axis rotations (currently only "XYZ" supported)

**Returns:** This quaternion for chaining

**Usage:**

```typescript
const q = new OSQuaternion();
const euler = new OSVector3(0, 90, 0); // 90° around Y-axis
q.setFromEuler(euler, "XYZ");

// Equivalent to:
// q.setFromAxisAngle(new OSVector3(0, 1, 0), Math.PI / 2);
```

### Three.js Integration

#### `toThreeJS(): Quaternion`

Converts this OSQuaternion to a Three.js Quaternion.

**Returns:** Three.js Quaternion instance

**Usage:**

```typescript
const osQuat = new OSQuaternion(0, 0.707, 0, 0.707);
const threeQuat = osQuat.toThreeJS();

// Use in Three.js
const mesh = new THREE.Mesh();
mesh.quaternion.copy(osQuat.toThreeJS());
```

#### `fromThreeJS(q: Quaternion): OSQuaternion`

Creates an OSQuaternion from a Three.js Quaternion.

**Parameters:**

- `q`: Three.js Quaternion to convert from

**Returns:** New OSQuaternion instance

**Usage:**

```typescript
const threeQuat = new THREE.Quaternion(0, 0.707, 0, 0.707);
const osQuat = OSQuaternion.fromThreeJS(threeQuat);
```

## Performance Characteristics

### Memory Management

- **Method Chaining**: All mutating methods return `this` for efficient chaining
- **Minimal Allocations**: Clone operations only when explicitly requested
- **Efficient Operations**: Optimized quaternion mathematics

### Numerical Stability

- **Slerp Robustness**: Handles edge cases in spherical interpolation
- **Normalization**: Automatic handling of degenerate quaternions
- **Precision**: Uses EPSILON constant for floating-point comparisons

### Three.js Integration

- **Lazy Conversion**: Three.js objects created only when needed
- **Bidirectional**: Seamless conversion in both directions
- **Performance**: Conversion methods optimized for minimal overhead

## Usage Examples

### Basic Rotation Operations

```typescript
import { OSQuaternion, OSVector3 } from "@teskooano/core-math";

// Create rotation quaternion
const q = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0), // Y-axis
  Math.PI / 2, // 90 degrees
);

// Apply rotation to vector
const v = new OSVector3(1, 0, 0);
v.applyQuaternion(q); // v = (0, 0, -1)

// Compose rotations
const q1 = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  Math.PI / 4, // 45° around Y
);
const q2 = new OSQuaternion().setFromAxisAngle(
  new OSVector3(1, 0, 0),
  Math.PI / 4, // 45° around X
);
const combined = q1.clone().multiply(q2);
```

### Spherical Interpolation

```typescript
// Smooth rotation animation
const startRotation = new OSQuaternion();
const endRotation = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  Math.PI, // 180° around Y
);

// Animate from 0% to 100%
for (let t = 0; t <= 1; t += 0.1) {
  const currentRotation = startRotation.clone().slerp(endRotation, t);

  // Apply to object
  const vector = new OSVector3(1, 0, 0);
  vector.applyQuaternion(currentRotation);
  console.log(`t=${t.toFixed(1)}: ${vector.toString()}`);
}
```

### Euler Angle Conversion

```typescript
// Convert Euler angles to quaternion
const euler = new OSVector3(0, 90, 0); // 90° around Y-axis
const q = new OSQuaternion().setFromEuler(euler, "XYZ");

// Verify the rotation
const testVector = new OSVector3(1, 0, 0);
testVector.applyQuaternion(q);
console.log(testVector.toString()); // Should be (0, 0, -1)
```

### Three.js Integration

```typescript
import { OSQuaternion } from "@teskooano/core-math";
import * as THREE from "three";

// Create OSQuaternion
const osQuat = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  Math.PI / 2,
);

// Convert to Three.js
const threeQuat = osQuat.toThreeJS();

// Use in Three.js scene
const mesh = new THREE.Mesh();
mesh.quaternion.copy(threeQuat);

// Convert back from Three.js
const backToOS = OSQuaternion.fromThreeJS(mesh.quaternion);
```

### Physics Integration

```typescript
// Rotate object based on angular velocity
const angularVelocity = new OSVector3(0, 0.1, 0); // rad/s
const deltaTime = 0.016; // 60 FPS

// Create rotation quaternion from angular velocity
const angle = angularVelocity.length() * deltaTime;
const axis = angularVelocity.clone().normalize();
const rotation = new OSQuaternion().setFromAxisAngle(axis, angle);

// Apply to object's orientation
const currentOrientation = new OSQuaternion();
currentOrientation.multiply(rotation);
```

### Camera Control

```typescript
// Smooth camera rotation
class CameraController {
  private currentRotation = new OSQuaternion();
  private targetRotation = new OSQuaternion();

  setTargetRotation(axis: OSVector3, angle: number) {
    this.targetRotation.setFromAxisAngle(axis, angle);
  }

  update(deltaTime: number) {
    const lerpFactor = Math.min(deltaTime * 2, 1); // 2x speed
    this.currentRotation.slerp(this.targetRotation, lerpFactor);

    // Apply to camera
    const cameraDirection = new OSVector3(0, 0, -1);
    cameraDirection.applyQuaternion(this.currentRotation);
  }
}
```

### Quaternion Validation

```typescript
// Validate quaternion properties
function validateQuaternion(q: OSQuaternion): boolean {
  // Check if normalized
  const length = q.length();
  if (Math.abs(length - 1) > 0.001) {
    console.warn("Quaternion not normalized:", length);
    return false;
  }

  // Check for NaN or Infinity
  if (!q.isFinite()) {
    console.warn("Quaternion has non-finite components");
    return false;
  }

  return true;
}

// Usage
const q = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  Math.PI / 2,
);
q.normalize();

if (validateQuaternion(q)) {
  console.log("Valid quaternion");
}
```

## Mathematical Background

### Quaternion Properties

- **Unit Quaternions**: Represent rotations when normalized (length = 1)
- **Conjugate**: Represents inverse rotation
- **Multiplication**: Composes rotations (order matters)
- **Slerp**: Provides smooth interpolation between rotations

### Advantages over Euler Angles

- **No Gimbal Lock**: Avoids singularities in rotation representation
- **Smooth Interpolation**: Natural rotation paths between orientations
- **Efficient Composition**: Fast rotation combination
- **Numerical Stability**: Better precision for repeated operations

### Conversion Formulas

- **Axis-Angle to Quaternion**: q = (ax·sin(θ/2), ay·sin(θ/2), az·sin(θ/2), cos(θ/2))
- **Quaternion to Axis-Angle**: axis = (x, y, z) / sin(θ/2), angle = 2·arccos(w)
- **Euler to Quaternion**: Multiple formulas depending on rotation order

## 🔗 Related

- [[OSVector3]] - Vectors that can be rotated by quaternions
- [[OSMatrix3]] - 2D transformations using quaternions
- [[OSMatrix4]] - 3D transformations using quaternions
- [[Constants]] - EPSILON constant for precision
- [[@teskooano/core-physics]] - Physics rotations using quaternions
- [[@teskooano/core-state]] - State management with quaternion operations
