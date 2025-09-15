---
aliases: [Constants]
tags: [core, math, constants]
type: Module
package: "@teskooano/core-math"
name: constants
exports: ["EPSILON", "PI", "TWO_PI", "HALF_PI", "DEG_TO_RAD"]
status: active
---

# Constants

Mathematical constants used throughout the Open Space engine for precision handling, angle conversions, and mathematical calculations.

## Overview

The `constants` module provides essential mathematical constants that are used consistently across the Open Space engine. These constants ensure precision handling, provide conversion factors, and maintain mathematical accuracy throughout the codebase.

## Exported Constants

### `EPSILON`

**Type:** `number`  
**Value:** `0.000001`

The smallest positive number used for floating-point precision comparisons throughout the engine.

**Usage:**

```typescript
import { EPSILON } from "@teskooano/core-math";

// Floating-point equality comparison
function isEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON;
}

// Vector equality checking
const v1 = new OSVector3(1.0000001, 2.0000001, 3.0000001);
const v2 = new OSVector3(1, 2, 3);
const areEqual = v1.equals(v2); // Uses EPSILON internally
```

**Applications:**

- Floating-point equality comparisons
- Vector and matrix equality checking
- Numerical stability in algorithms
- Tolerance-based geometric operations

### `PI`

**Type:** `number`  
**Value:** `Math.PI` (≈ 3.141592653589793)

The mathematical constant π (pi) for circular calculations and trigonometric functions.

**Usage:**

```typescript
import { PI } from "@teskooano/core-math";

// Calculate circle circumference
const radius = 5;
const circumference = 2 * PI * radius;

// Calculate area of circle
const area = PI * radius * radius;

// Trigonometric calculations
const angle = PI / 4; // 45 degrees in radians
const sine = Math.sin(angle);
const cosine = Math.cos(angle);
```

**Applications:**

- Circular geometry calculations
- Trigonometric functions
- Angular measurements
- Mathematical formulas involving π

### `TWO_PI`

**Type:** `number`  
**Value:** `PI * 2` (≈ 6.283185307179586)

Two times π, commonly used in circular calculations and full rotations.

**Usage:**

```typescript
import { TWO_PI } from "@teskooano/core-math";

// Full rotation in radians
const fullRotation = TWO_PI; // 360 degrees

// Normalize angle to [0, 2π) range
function normalizeAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

// Calculate angular velocity
const revolutionsPerSecond = 2;
const angularVelocity = revolutionsPerSecond * TWO_PI;
```

**Applications:**

- Full rotation calculations
- Angle normalization
- Angular velocity conversions
- Periodic function calculations

### `HALF_PI`

**Type:** `number`  
**Value:** `PI / 2` (≈ 1.5707963267948966)

Half of π, commonly used in right-angle calculations and 90-degree rotations.

**Usage:**

```typescript
import { HALF_PI } from "@teskooano/core-math";

// 90-degree rotation
const rightAngle = HALF_PI;

// Create rotation quaternion for 90° around Y-axis
const quat = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  HALF_PI,
);

// Calculate perpendicular vector
const v1 = new OSVector3(1, 0, 0);
const v2 = new OSVector3(0, 1, 0);
const angle = v1.angleTo(v2); // Should equal HALF_PI
```

**Applications:**

- Right-angle calculations
- 90-degree rotations
- Perpendicular vector operations
- Orthogonal transformations

### `DEG_TO_RAD`

**Type:** `number`  
**Value:** `PI / 180` (≈ 0.017453292519943295)

Conversion factor from degrees to radians.

**Usage:**

```typescript
import { DEG_TO_RAD } from "@teskooano/core-math";

// Convert degrees to radians
const degrees = 45;
const radians = degrees * DEG_TO_RAD;

// Convert multiple angles
const anglesInDegrees = [0, 30, 45, 60, 90, 180, 270, 360];
const anglesInRadians = anglesInDegrees.map((deg) => deg * DEG_TO_RAD);

// Create rotation from degree input
function createRotationFromDegrees(
  axis: OSVector3,
  degrees: number,
): OSQuaternion {
  return new OSQuaternion().setFromAxisAngle(axis, degrees * DEG_TO_RAD);
}
```

**Applications:**

- Degree to radian conversions
- User input processing (degrees) to internal calculations (radians)
- API interfaces that accept degrees
- Mathematical function inputs

## Usage Examples

### Precision Handling

```typescript
import { EPSILON } from "@teskooano/core-math";

// Safe floating-point comparison
function isApproximatelyEqual(
  a: number,
  b: number,
  tolerance: number = EPSILON,
): boolean {
  return Math.abs(a - b) <= tolerance;
}

// Check if vector is normalized
function isNormalized(vector: OSVector3): boolean {
  const length = vector.length();
  return Math.abs(length - 1) <= EPSILON;
}

// Check if matrix is orthogonal
function isOrthogonal(matrix: OSMatrix3): boolean {
  const det = matrix.determinant();
  return Math.abs(Math.abs(det) - 1) <= EPSILON;
}
```

### Angle Calculations

```typescript
import { PI, TWO_PI, HALF_PI, DEG_TO_RAD } from "@teskooano/core-math";

// Convert between angle units
function degreesToRadians(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

function radiansToDegrees(radians: number): number {
  return radians / DEG_TO_RAD;
}

// Normalize angle to [0, 2π) range
function normalizeAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

// Calculate angle between vectors
function angleBetweenVectors(v1: OSVector3, v2: OSVector3): number {
  const dot = v1.dot(v2);
  const lengths = v1.length() * v2.length();

  if (lengths === 0) return 0;

  const cosAngle = dot / lengths;
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}
```

### Geometric Calculations

```typescript
import { PI, TWO_PI } from "@teskooano/core-math";

// Calculate circle properties
class Circle {
  constructor(public radius: number) {}

  getCircumference(): number {
    return TWO_PI * this.radius;
  }

  getArea(): number {
    return PI * this.radius * this.radius;
  }

  getArcLength(angleInRadians: number): number {
    return this.radius * angleInRadians;
  }

  getSectorArea(angleInRadians: number): number {
    return 0.5 * this.radius * this.radius * angleInRadians;
  }
}

// Calculate sphere properties
class Sphere {
  constructor(public radius: number) {}

  getSurfaceArea(): number {
    return 4 * PI * this.radius * this.radius;
  }

  getVolume(): number {
    return (4 / 3) * PI * this.radius * this.radius * this.radius;
  }
}
```

### Rotation Utilities

```typescript
import { HALF_PI, DEG_TO_RAD } from "@teskooano/core-math";

// Common rotation angles
const ROTATION_ANGLES = {
  ZERO: 0,
  QUARTER: HALF_PI / 2, // 45°
  HALF: HALF_PI, // 90°
  THREE_QUARTER: (3 * HALF_PI) / 2, // 135°
  FULL: 2 * HALF_PI, // 180°
} as const;

// Create common rotations
function createCommonRotations(): Record<string, OSQuaternion> {
  return {
    identity: new OSQuaternion(),
    quarterY: new OSQuaternion().setFromAxisAngle(
      new OSVector3(0, 1, 0),
      ROTATION_ANGLES.QUARTER,
    ),
    halfY: new OSQuaternion().setFromAxisAngle(
      new OSVector3(0, 1, 0),
      ROTATION_ANGLES.HALF,
    ),
    fullY: new OSQuaternion().setFromAxisAngle(
      new OSVector3(0, 1, 0),
      ROTATION_ANGLES.FULL,
    ),
  };
}

// Convert user input to rotation
function createRotationFromUserInput(
  axis: "x" | "y" | "z",
  degrees: number,
): OSQuaternion {
  const axisVector = new OSVector3(
    axis === "x" ? 1 : 0,
    axis === "y" ? 1 : 0,
    axis === "z" ? 1 : 0,
  );

  return new OSQuaternion().setFromAxisAngle(axisVector, degrees * DEG_TO_RAD);
}
```

### Mathematical Functions

```typescript
import { EPSILON, PI, TWO_PI } from "@teskooano/core-math";

// Safe division with epsilon check
function safeDivide(numerator: number, denominator: number): number {
  if (Math.abs(denominator) < EPSILON) {
    throw new Error("Division by zero or near-zero value");
  }
  return numerator / denominator;
}

// Clamp angle to [0, 2π) range
function clampAngle(angle: number): number {
  while (angle < 0) angle += TWO_PI;
  while (angle >= TWO_PI) angle -= TWO_PI;
  return angle;
}

// Linear interpolation with angle wrapping
function lerpAngle(a: number, b: number, t: number): number {
  const diff = b - a;
  const wrappedDiff = ((diff + PI) % TWO_PI) - PI;
  return a + wrappedDiff * t;
}

// Check if two angles are approximately equal
function anglesEqual(
  a: number,
  b: number,
  tolerance: number = EPSILON,
): boolean {
  const diff = Math.abs(clampAngle(a - b));
  return diff <= tolerance || diff >= TWO_PI - tolerance;
}
```

### Performance Optimization

```typescript
import { EPSILON, DEG_TO_RAD } from "@teskooano/core-math";

// Pre-computed common values for performance
const COMMON_ANGLES = {
  DEG_0: 0,
  DEG_30: 30 * DEG_TO_RAD,
  DEG_45: 45 * DEG_TO_RAD,
  DEG_60: 60 * DEG_TO_RAD,
  DEG_90: 90 * DEG_TO_RAD,
  DEG_180: 180 * DEG_TO_RAD,
  DEG_270: 270 * DEG_TO_RAD,
  DEG_360: 360 * DEG_TO_RAD,
} as const;

// Fast angle comparison using pre-computed values
function isRightAngle(angle: number): boolean {
  return Math.abs(angle - COMMON_ANGLES.DEG_90) <= EPSILON;
}

// Fast normalization check
function isNormalizedFast(value: number): boolean {
  return Math.abs(value - 1) <= EPSILON;
}
```

## Best Practices

### Precision Handling

- Always use `EPSILON` for floating-point comparisons
- Use relative tolerance for large numbers
- Consider the magnitude of values when setting tolerance

### Angle Conversions

- Use `DEG_TO_RAD` for consistent degree-to-radian conversions
- Prefer radians for internal calculations
- Convert to degrees only for user interfaces

### Mathematical Constants

- Use named constants instead of magic numbers
- Import specific constants to avoid namespace pollution
- Consider performance implications of constant usage

### Error Handling

- Use `EPSILON` for safe division checks
- Validate inputs against mathematical constraints
- Provide meaningful error messages with context

## 🔗 Related

- [[OSVector3]] - Uses EPSILON for equality comparisons
- [[OSQuaternion]] - Uses EPSILON for normalization checks
- [[OSMatrix3]] - Uses EPSILON for determinant calculations
- [[OSMatrix4]] - Uses EPSILON for matrix operations
- [[Utils]] - Mathematical utilities using these constants
- [[@teskooano/core-physics]] - Physics calculations with precision handling
