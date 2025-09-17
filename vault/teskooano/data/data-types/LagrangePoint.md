---
aliases: [LagrangePoint]
tags: [data, types, physics, orbital]
type: Interface
package: "@teskooano/data-types"
file: "src/physics.ts"
status: active
---

# LagrangePoint

Represents a Lagrange point in a two-body system with position, stability, and gravitational potential information.

## Overview

The `LagrangePoint` interface defines the properties of Lagrange points (L1-L5) in two-body gravitational systems. These are points where the gravitational forces of two large bodies and the centrifugal force balance, allowing smaller objects to maintain stable positions relative to the two bodies.

## Interface Definition

```typescript
export interface LagrangePoint {
  id: "L1" | "L2" | "L3" | "L4" | "L5";
  position_m: OSVector3;
  velocity_mps?: OSVector3;
  distanceFromSecondary_m: number;
  distanceFromPrimary_m: number;
  stability: "stable" | "unstable" | "marginally_stable";
  effectivePotential_Jkg: number;
  hillSphereRadius_m: number;
}
```

## Properties

### Identification

#### id

```typescript
id: "L1" | "L2" | "L3" | "L4" | "L5";
```

Lagrange point identifier.

- **Type**: String literal union
- **Required**: Yes
- **Values**: `"L1"`, `"L2"`, `"L3"`, `"L4"`, `"L5"`
- **Usage**: Identifies which Lagrange point this represents

### Spatial Properties

#### position_m

```typescript
position_m: OSVector3;
```

Position of the Lagrange point in 3D space (meters).

- **Type**: `OSVector3`
- **Required**: Yes
- **Units**: Meters
- **Coordinate System**: Typically barycentric coordinates
- **Usage**: Positioning objects at Lagrange points

#### velocity_mps

```typescript
velocity_mps?: OSVector3
```

Velocity of the Lagrange point in the rotating frame (m/s).

- **Type**: `OSVector3`
- **Required**: No
- **Units**: Meters per second
- **Usage**: Velocity for objects following the Lagrange point

### Distance Properties

#### distanceFromSecondary_m

```typescript
distanceFromSecondary_m: number;
```

Distance from the smaller body (M2) in meters.

- **Type**: `number`
- **Required**: Yes
- **Units**: Meters
- **Usage**: Spatial relationship to secondary body

#### distanceFromPrimary_m

```typescript
distanceFromPrimary_m: number;
```

Distance from the larger body (M1) in meters.

- **Type**: `number`
- **Required**: Yes
- **Units**: Meters
- **Usage**: Spatial relationship to primary body

### Stability Properties

#### stability

```typescript
stability: "stable" | "unstable" | "marginally_stable";
```

Stability classification of the Lagrange point.

- **Type**: String literal union
- **Required**: Yes
- **Values**:
  - `"stable"` - L4 and L5 points (stable equilibrium)
  - `"unstable"` - L1, L2, and L3 points (unstable equilibrium)
  - `"marginally_stable"` - Edge cases or perturbed systems
- **Usage**: Determines orbital stability for objects placed there

### Gravitational Properties

#### effectivePotential_Jkg

```typescript
effectivePotential_Jkg: number;
```

Effective potential at this point (J/kg).

- **Type**: `number`
- **Required**: Yes
- **Units**: Joules per kilogram
- **Usage**: Gravitational potential energy calculations

#### hillSphereRadius_m

```typescript
hillSphereRadius_m: number;
```

Hill sphere radius for reference (meters).

- **Type**: `number`
- **Required**: Yes
- **Units**: Meters
- **Usage**: Sphere of gravitational influence around the point

## Lagrange Point Types

### L1 - Inner Lagrange Point

**Location**: Between the two bodies
**Stability**: Unstable
**Uses**: Solar observatories, space telescopes
**Example**: James Webb Space Telescope at Sun-Earth L2

### L2 - Outer Lagrange Point

**Location**: Beyond the smaller body, opposite the larger body
**Stability**: Unstable
**Uses**: Deep space observatories
**Example**: Planck, Herschel missions

### L3 - Opposite Point

**Location**: Opposite the smaller body, beyond the larger body
**Stability**: Unstable
**Uses**: Theoretical staging areas
**Example**: Rarely used in practice

### L4 - Leading Trojan Point

**Location**: 60° ahead of the smaller body in its orbit
**Stability**: Stable (for mass ratios > 24.96)
**Uses**: Asteroid accumulation, space habitats
**Example**: Jupiter Trojan asteroids

### L5 - Trailing Trojan Point

**Location**: 60° behind the smaller body in its orbit  
**Stability**: Stable (for mass ratios > 24.96)
**Uses**: Asteroid accumulation, space habitats
**Example**: Jupiter Trojan asteroids

## Usage Examples

### Earth-Moon L1 Point

```typescript
const earthMoonL1: LagrangePoint = {
  id: "L1",
  position_m: new OSVector3(326400000, 0, 0), // ~326,400 km from Earth
  velocity_mps: new OSVector3(0, 0, 1022), // Following Moon's orbital velocity
  distanceFromPrimary_m: 326400000, // Distance from Earth
  distanceFromSecondary_m: 58000000, // Distance from Moon
  stability: "unstable",
  effectivePotential_Jkg: -1.2e6, // Effective potential
  hillSphereRadius_m: 66100000, // ~66,100 km Hill sphere
};
```

### Sun-Earth L2 Point

```typescript
const sunEarthL2: LagrangePoint = {
  id: "L2",
  position_m: new OSVector3(1.51e11, 0, 0), // ~1.51 million km from Earth
  velocity_mps: new OSVector3(0, 0, 29780), // Following Earth's orbital velocity
  distanceFromPrimary_m: 1.51e11, // Distance from Sun
  distanceFromSecondary_m: 1.5e9, // Distance from Earth (~1.5 million km)
  stability: "unstable",
  effectivePotential_Jkg: -8.9e8, // Deep potential well
  hillSphereRadius_m: 1.5e9, // ~1.5 million km Hill sphere
};
```

### Jupiter L4 Trojan Point

```typescript
const jupiterL4: LagrangePoint = {
  id: "L4",
  position_m: new OSVector3(
    7.785e11 * Math.cos(Math.PI / 3), // 60° ahead of Jupiter
    7.785e11 * Math.sin(Math.PI / 3),
    0,
  ),
  velocity_mps: new OSVector3(
    -13070 * Math.sin(Math.PI / 3),
    13070 * Math.cos(Math.PI / 3),
    0,
  ),
  distanceFromPrimary_m: 7.785e11, // Distance from Sun (Jupiter's orbit)
  distanceFromSecondary_m: 7.785e11, // Distance from Jupiter (equilateral triangle)
  stability: "stable", // Stable for Jupiter-Sun system
  effectivePotential_Jkg: -1.1e9, // Stable potential well
  hillSphereRadius_m: 4.8e10, // ~48 million km Hill sphere
};
```

## Calculation Functions

### Position Calculation

```typescript
function calculateLagrangePosition(
  primary: PhysicsStateReal,
  secondary: PhysicsStateReal,
  lagrangeId: "L1" | "L2" | "L3" | "L4" | "L5",
): OSVector3 {
  const separation = secondary.position_m.subtract(primary.position_m);
  const distance = separation.magnitude();
  const direction = separation.normalize();

  const mu = secondary.mass_kg / (primary.mass_kg + secondary.mass_kg);

  switch (lagrangeId) {
    case "L1":
      // Solve quintic equation for L1 position
      const r1 = solveLagrangeL1Distance(mu, distance);
      return primary.position_m.add(direction.multiplyScalar(r1));

    case "L2":
      // Solve quintic equation for L2 position
      const r2 = solveLagrangeL2Distance(mu, distance);
      return secondary.position_m.add(direction.multiplyScalar(r2));

    case "L3":
      // L3 is opposite the secondary body
      const r3 = distance * (1 - mu);
      return primary.position_m.subtract(direction.multiplyScalar(r3));

    case "L4":
      // 60° ahead of secondary in its orbit
      const perpendicular = new OSVector3(-direction.z, 0, direction.x);
      const l4_center = primary.position_m
        .add(secondary.position_m)
        .multiplyScalar(0.5);
      const l4_offset = perpendicular.multiplyScalar(
        (distance * Math.sqrt(3)) / 2,
      );
      return l4_center.add(l4_offset);

    case "L5":
      // 60° behind secondary in its orbit
      const perpendicular5 = new OSVector3(direction.z, 0, -direction.x);
      const l5_center = primary.position_m
        .add(secondary.position_m)
        .multiplyScalar(0.5);
      const l5_offset = perpendicular5.multiplyScalar(
        (distance * Math.sqrt(3)) / 2,
      );
      return l5_center.add(l5_offset);
  }
}
```

### Stability Analysis

```typescript
function analyzeLagrangeStability(
  lagrangePoint: LagrangePoint,
  massRatio: number,
): "stable" | "unstable" | "marginally_stable" {
  switch (lagrangePoint.id) {
    case "L1":
    case "L2":
    case "L3":
      return "unstable"; // Always unstable

    case "L4":
    case "L5":
      // Stable if mass ratio is sufficiently large
      if (massRatio > 24.96) {
        return "stable";
      } else if (massRatio > 20.0) {
        return "marginally_stable";
      } else {
        return "unstable";
      }
  }
}
```

## Integration

### Orbital Mechanics

- Objects can be placed at Lagrange points
- Provides stable or semi-stable orbital positions
- Enables complex multi-body dynamics

### Mission Planning

- L1/L2 points useful for space missions
- L4/L5 points for asteroid populations
- Strategic positioning for spacecraft

### Physics System

- Lagrange points affect gravitational calculations
- Stability determines long-term orbital evolution
- Hill sphere defines sphere of influence

## 🔗 Related

- [[TwoBodySystem]] - Two-body system for Lagrange point calculations
- [[LagrangeCalculationOptions]] - Calculation configuration options
- [[LagrangePointType]] - Lagrange point type enumeration
- [[PhysicsStateReal]] - Physics state for primary and secondary bodies
- [[OrbitalParameters]] - Orbital parameters with Lagrange point support
- [[@teskooano/core-physics]] - Physics calculations for Lagrange points
