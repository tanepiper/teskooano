---
aliases: [core-math]
tags: [core, math]
type: index
package: "@teskooano/core-math"
version: "0.4.0-dev.0"
dependencies: ["three"]
devDependencies: ["typescript", "@types/node", "@types/three", "vitest"]
classes: ["OSVector3", "OSMatrix3", "OSMatrix4", "OSQuaternion"]
modules: ["constants", "utils", "epoch", "random"]
status: active
---

# Core Math (`@teskooano/core-math`)

Renderer-agnostic mathematical primitives and utilities providing the foundational math layer for the Open Space engine, used by physics calculations, state management, and rendering systems.

## Overview

The `@teskooano/core-math` package provides essential mathematical building blocks for the Open Space engine, designed to be independent of any specific rendering framework while maintaining compatibility with Three.js. This package serves as the mathematical foundation for all physics calculations, coordinate transformations, and geometric operations throughout the engine.

## Key Features

### Mathematical Primitives

- **[[core/core-math/OSVector3|OSVector3]]**: 3D vector class with comprehensive operations and Y-up coordinate system
- **[[core/core-math/OSQuaternion|OSQuaternion]]**: Quaternion class for 3D rotations with spherical interpolation
- **[[core/core-math/OSMatrix3|OSMatrix3]]**: 3×3 matrix class for 2D transformations and linear algebra
- **[[core/core-math/OSMatrix4|OSMatrix4]]**: 4×4 matrix class for 3D transformations and projections

### Utility Modules

- **[[core/core-math/Constants|Constants]]**: Mathematical constants including PI, EPSILON, and conversion factors
- **[[core/core-math/Utils|Utils]]**: Mathematical utilities including interpolation, clamping, and power-of-two functions
- **[[core/core-math/Epoch|Epoch]]**: Astronomical epoch utilities for time calculations and validation
- **[[core/core-math/Random|Random]]**: Seeded random number generators for deterministic simulations

### Design Principles

- **Renderer Agnostic**: Core math operations independent of Three.js
- **Performance Optimized**: Efficient implementations with minimal allocations
- **Type Safe**: Full TypeScript support with comprehensive type definitions
- **Three.js Compatible**: Seamless conversion to/from Three.js types when needed

## Architecture

### Core Classes

#### [[core/core-math/OSVector3|OSVector3]]

3D vector class implementing the engine's Y-up coordinate system with comprehensive vector operations.

**Key Features:**

- Basic operations: add, subtract, multiply, divide
- Geometric operations: dot product, cross product, normalization
- Advanced operations: linear interpolation, angle calculation, projection, reflection
- Utility methods: distance calculations, equality checking, array conversion
- Three.js interoperability: `toThreeJS()` and `fromThreeJS()` methods

#### [[core/core-math/OSQuaternion|OSQuaternion]]

Quaternion class for 3D rotations with support for axis-angle, Euler angles, and spherical interpolation.

**Key Features:**

- Rotation representations: axis-angle, Euler angles (XYZ order)
- Quaternion operations: multiplication, inversion, normalization
- Interpolation: spherical linear interpolation (slerp)
- Three.js compatibility: seamless conversion to/from Three.Quaternion

#### [[core/core-math/OSMatrix3|OSMatrix3]]

3×3 matrix class for 2D transformations and linear algebra operations.

**Key Features:**

- Matrix operations: multiplication, inversion, transposition, determinant
- Element access: column-major storage format
- Three.js integration: conversion to/from Three.Matrix3
- Performance optimized: allocation-free operations where possible

#### [[core/core-math/OSMatrix4|OSMatrix4]]

4×4 matrix class for 3D transformations, projections, and complex geometric operations.

**Key Features:**

- 3D transformations: rotation from quaternions, look-at matrices
- Projection matrices: perspective and orthographic projections
- Matrix operations: multiplication, inversion, transposition, determinant
- Three.js compatibility: full interoperability with Three.Matrix4

### Utility Modules

#### [[core/core-math/Constants|Constants]]

Mathematical constants used throughout the engine.

**Key Constants:**

- **EPSILON**: Floating-point precision threshold (0.000001)
- **PI**: Mathematical constant π
- **TWO_PI**: 2π for circular calculations
- **HALF_PI**: π/2 for right-angle calculations
- **DEG_TO_RAD**: Degree to radian conversion factor

#### [[core/core-math/Utils|Utils]]

Mathematical utility functions for common operations.

**Categories:**

- **Interpolation**: Linear interpolation (lerp)
- **Clamping**: Value constraint functions
- **Angles**: Degree/radian conversions
- **Precision**: Equality checking with epsilon tolerance
- **Powers of Two**: Efficient power-of-two calculations
- **UUID Generation**: Version 4 UUID creation
- **Function Modifiers**: Debounce, throttle, memoize

#### [[core/core-math/Epoch|Epoch]]

Astronomical epoch utilities for time calculations and validation.

**Key Features:**

- **Epoch Conversion**: Multiple epoch formats (J2000, Julian Day, ISO dates)
- **Time Calculations**: Julian Day conversions and time differences
- **Validation**: Epoch consistency checking across celestial objects
- **Analysis**: Comprehensive epoch statistics and reporting

#### [[core/core-math/Random|Random]]

Seeded random number generators for deterministic simulations.

**Key Features:**

- **Synchronous Generator**: High-performance seeded PRNG using cyrb128 hash
- **Asynchronous Generator**: Web Crypto API-based seeded PRNG
- **Deterministic**: Same seed always produces identical sequences
- **Performance**: Optimized for simulation and procedural generation

## Coordinate System

### Y-Up Right-Handed System

The engine uses a Y-up, right-handed coordinate system:

- **X-axis**: Right direction (positive X points right)
- **Y-axis**: Up direction (positive Y points up)
- **Z-axis**: Forward direction (positive Z points forward)

### Cross Product Rules

Right-handed cross products follow the standard rules:

- X × Y = Z
- Y × Z = X
- Z × X = Y

### Rotation Conventions

- **Positive rotations**: Counter-clockwise when viewed from the positive axis direction
- **Quaternion rotations**: Follow right-handed rotation rules
- **Euler angles**: XYZ order (pitch, yaw, roll)

## Performance Characteristics

### Memory Management

- **Object Reuse**: Methods return `this` for chaining to minimize allocations
- **Efficient Operations**: Optimized algorithms for common operations
- **Minimal Garbage Collection**: Designed to reduce memory pressure

### Three.js Integration

- **Lazy Conversion**: Three.js objects created only when needed
- **Bidirectional**: Seamless conversion in both directions
- **Performance**: Conversion methods optimized for minimal overhead

### Precision Handling

- **Epsilon Tolerance**: Consistent floating-point comparison across all classes
- **Relative Tolerance**: THREE.js-compatible equality checking
- **Numerical Stability**: Robust algorithms for edge cases

## Usage Examples

### Basic Vector Operations

```typescript
import { OSVector3 } from "@teskooano/core-math";

const v1 = new OSVector3(1, 2, 3);
const v2 = new OSVector3(4, 5, 6);

// Basic operations
v1.add(v2); // v1 = (5, 7, 9)
v1.multiplyScalar(2); // v1 = (10, 14, 18)
v1.normalize(); // v1 = unit vector

// Geometric operations
const dot = v1.dot(v2); // Dot product
const cross = v1.clone().cross(v2); // Cross product
const distance = v1.distanceTo(v2); // Distance between vectors
```

### Quaternion Rotations

```typescript
import { OSQuaternion, OSVector3 } from "@teskooano/core-math";

// Create rotation quaternion
const quat = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0), // Y-axis
  Math.PI / 2, // 90 degrees
);

// Apply rotation to vector
const vector = new OSVector3(1, 0, 0);
vector.applyQuaternion(quat); // Rotates around Y-axis

// Spherical interpolation
const q1 = new OSQuaternion();
const q2 = new OSQuaternion().setFromAxisAngle(new OSVector3(0, 1, 0), Math.PI);
const interpolated = q1.clone().slerp(q2, 0.5); // Halfway rotation
```

### Matrix Transformations

```typescript
import { OSMatrix4, OSVector3, OSQuaternion } from "@teskooano/core-math";

// Create transformation matrix
const matrix = new OSMatrix4();
const quat = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  Math.PI / 4,
);
matrix.makeRotationFromQuaternion(quat);

// Create look-at matrix
const eye = new OSVector3(10, 10, 10);
const target = new OSVector3(0, 0, 0);
const up = new OSVector3(0, 1, 0);
matrix.lookAt(eye, target, up);

// Create projection matrix
matrix.makePerspective(-1, 1, 1, -1, 1, 100);
```

### Three.js Integration

```typescript
import { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";

// Convert to Three.js
const osVector = new OSVector3(1, 2, 3);
const threeVector = osVector.toThreeJS();

// Convert from Three.js
const threeVector2 = new THREE.Vector3(4, 5, 6);
const osVector2 = OSVector3.fromThreeJS(threeVector2);

// Use in Three.js operations
const mesh = new THREE.Mesh();
mesh.position.copy(osVector.toThreeJS());
```

### Epoch Calculations

```typescript
import {
  getCurrentEpoch,
  getJulianDayForEpoch,
  validateEpochConsistency,
} from "@teskooano/core-math";

// Get current epoch
const currentEpoch = getCurrentEpoch(); // "2025-01-15"

// Convert epoch to Julian Day
const jd = getJulianDayForEpoch("J2000"); // 2451545.0

// Validate epoch consistency
const objects = [
  { name: "Earth", orbit: { epoch: "J2000" } },
  { name: "Mars", orbit: { epoch: "J2000" } },
];
const validation = validateEpochConsistency(objects);
console.log(validation.isConsistent); // true
```

### Seeded Random Generation

```typescript
import { createSeededRandomSync } from "@teskooano/core-math";

// Create deterministic random generator
const random = createSeededRandomSync("my-seed");

// Generate consistent random numbers
const value1 = random(); // Always same for same seed
const value2 = random(); // Always same sequence
```

## Testing

### Comprehensive Test Coverage

- **Unit Tests**: All classes and methods thoroughly tested
- **Coordinate System Tests**: Right-handed system validation
- **Three.js Compatibility**: Conversion accuracy verification
- **Edge Cases**: Zero vectors, degenerate matrices, precision limits
- **Performance Tests**: Memory allocation and execution time validation

### Test Environment

- **Vitest**: Modern testing framework with browser support
- **Playwright**: Headless Chrome for browser environment testing
- **JSDOM**: DOM simulation for unit tests

## Dependencies

### Core Dependencies

- **three**: Three.js for interoperability methods (peer dependency)

### Development Dependencies

- **typescript**: Type safety and modern JavaScript features
- **vitest**: Testing framework with browser support
- **@vitest/browser**: Browser testing capabilities
- **@playwright/test**: End-to-end testing

## 🔗 Related

### Core Classes

- [[core/core-math/OSVector3|OSVector3]] - 3D vector operations and Y-up coordinate system
- [[core/core-math/OSQuaternion|OSQuaternion]] - 3D rotations and spherical interpolation
- [[core/core-math/OSMatrix3|OSMatrix3]] - 3×3 matrix operations and linear algebra
- [[core/core-math/OSMatrix4|OSMatrix4]] - 4×4 matrix transformations and projections

### Utility Modules

- [[core/core-math/Constants|Constants]] - Mathematical constants and conversion factors
- [[core/core-math/Utils|Utils]] - Mathematical utilities and function modifiers
- [[core/core-math/Epoch|Epoch]] - Astronomical epoch calculations and validation
- [[core/core-math/Random|Random]] - Seeded random number generators

### Integration Points

- [[core/core-physics/core-physics|@teskooano/core-physics]] - Physics calculations using math primitives
- [[core/core-state/core-state|@teskooano/core-state]] - State management with mathematical operations
- [[data/data-types/data-types|@teskooano/data-types]] - Type definitions using math primitives
- [[threejs-renderers/threejs/threejs|@teskooano/renderer-threejs]] - Rendering system with Three.js integration
