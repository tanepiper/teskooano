---
aliases: [PhysicsStateReal]
tags: [data, types, physics]
type: Interface
package: "@teskooano/data-types"
file: "src/physics.ts"
status: active
---

# PhysicsStateReal

Represents the physics state of a celestial body in real-world SI units for accurate physics simulation.

## Overview

The `PhysicsStateReal` interface defines the essential physics state data for celestial objects using real-world SI units (meters, kilograms, seconds). This interface serves as the bridge between the physics simulation engine and the rendering system, ensuring accurate gravitational calculations and orbital mechanics.

## Interface Definition

```typescript
export interface PhysicsStateReal {
  id: string;
  mass_kg: number;
  position_m: OSVector3;
  velocity_mps: OSVector3;
  ticksSinceLastPhysicsUpdate?: number;
}
```

## Properties

### Identification

#### id

```typescript
id: string;
```

Unique identifier matching the CelestialObject id.

- **Type**: `string`
- **Required**: Yes
- **Usage**: Links physics state to celestial object
- **Example**: `"earth-001"`, `"sun-001"`

### Physical Properties

#### mass_kg

```typescript
mass_kg: number;
```

Mass in kilograms (kg).

- **Type**: `number`
- **Required**: Yes
- **Units**: Kilograms (kg)
- **Usage**: Gravitational force calculations
- **Example**: Earth's mass is ~5.972×10²⁴ kg

#### position_m

```typescript
position_m: OSVector3;
```

Position vector in meters (m).

- **Type**: `OSVector3`
- **Required**: Yes
- **Units**: Meters (m)
- **Coordinate System**: Typically heliocentric or barycentric
- **Usage**: Object positioning and gravitational calculations

#### velocity_mps

```typescript
velocity_mps: OSVector3;
```

Velocity vector in meters per second (m/s).

- **Type**: `OSVector3`
- **Required**: Yes
- **Units**: Meters per second (m/s)
- **Usage**: Motion calculations and orbital dynamics

### Performance Tracking

#### ticksSinceLastPhysicsUpdate

```typescript
ticksSinceLastPhysicsUpdate?: number
```

Optional: Tracks ticks since last update for throttling.

- **Type**: `number`
- **Required**: No
- **Usage**: Performance optimization and update scheduling
- **Default**: 0

## Usage Examples

### Earth's Physics State

```typescript
import { PhysicsStateReal } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

const earthPhysics: PhysicsStateReal = {
  id: "earth-001",
  mass_kg: 5.972e24, // Earth's mass in kg
  position_m: new OSVector3(
    1.496e11, // 1 AU from Sun (x-axis)
    0, // y-axis
    0, // z-axis
  ),
  velocity_mps: new OSVector3(
    0, // x-component
    0, // y-component
    29780, // z-component (orbital velocity)
  ),
  ticksSinceLastPhysicsUpdate: 0,
};
```

### Moon's Physics State

```typescript
const lunaPhysics: PhysicsStateReal = {
  id: "luna-001",
  mass_kg: 7.342e22, // Moon's mass in kg
  position_m: new OSVector3(
    1.496e11 + 384400000, // Earth's position + Moon's distance
    0,
    0,
  ),
  velocity_mps: new OSVector3(
    0,
    0,
    29780 + 1022, // Earth's velocity + Moon's orbital velocity
  ),
};
```

### Sun's Physics State

```typescript
const sunPhysics: PhysicsStateReal = {
  id: "sun-001",
  mass_kg: 1.989e30, // Solar mass in kg
  position_m: new OSVector3(0, 0, 0), // At system barycenter
  velocity_mps: new OSVector3(0, 0, 0), // Stationary reference
  ticksSinceLastPhysicsUpdate: 0,
};
```

### Asteroid Physics State

```typescript
const asteroidPhysics: PhysicsStateReal = {
  id: "asteroid-001",
  mass_kg: 1.0e15, // Small asteroid mass
  position_m: new OSVector3(
    4.0e11, // 2.67 AU (asteroid belt)
    1.0e11, // Some y-offset
    0,
  ),
  velocity_mps: new OSVector3(
    -5000, // Orbital motion
    15000, // Complex trajectory
    0,
  ),
};
```

### Binary Star System

```typescript
const primaryStarPhysics: PhysicsStateReal = {
  id: "binary-primary-001",
  mass_kg: 2.0e30, // 1 solar mass
  position_m: new OSVector3(
    -1.0e10, // Offset from barycenter
    0,
    0,
  ),
  velocity_mps: new OSVector3(
    0,
    50000, // Orbital velocity around barycenter
    0,
  ),
};

const secondaryStarPhysics: PhysicsStateReal = {
  id: "binary-secondary-001",
  mass_kg: 1.5e30, // 0.75 solar masses
  position_m: new OSVector3(
    1.33e10, // Opposite side of barycenter
    0,
    0,
  ),
  velocity_mps: new OSVector3(
    0,
    -66667, // Counter-orbital velocity
    0,
  ),
};
```

## Physics Calculations

### Gravitational Force

```typescript
function calculateGravitationalForce(
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  G: number = 6.6743e-11, // Gravitational constant
): OSVector3 {
  // Vector from body1 to body2
  const r = body2.position_m.subtract(body1.position_m);
  const distance = r.magnitude();

  // Avoid division by zero
  if (distance < 1e-10) {
    return new OSVector3(0, 0, 0);
  }

  // Gravitational force magnitude
  const forceMagnitude =
    (G * body1.mass_kg * body2.mass_kg) / (distance * distance);

  // Force direction (unit vector)
  const forceDirection = r.normalize();

  // Force vector
  return forceDirection.multiplyScalar(forceMagnitude);
}
```

### N-Body Force Calculation

```typescript
function calculateTotalForce(
  targetBody: PhysicsStateReal,
  allBodies: PhysicsStateReal[],
  G: number = 6.6743e-11,
): OSVector3 {
  let totalForce = new OSVector3(0, 0, 0);

  for (const otherBody of allBodies) {
    if (otherBody.id !== targetBody.id) {
      const force = calculateGravitationalForce(targetBody, otherBody, G);
      totalForce = totalForce.add(force);
    }
  }

  return totalForce;
}
```

### State Integration (Verlet)

```typescript
function integrateVerlet(
  currentState: PhysicsStateReal,
  acceleration: OSVector3,
  dt: number,
): PhysicsStateReal {
  // Verlet integration for position
  const newPosition = currentState.position_m
    .add(currentState.velocity_mps.multiplyScalar(dt))
    .add(acceleration.multiplyScalar(0.5 * dt * dt));

  // Velocity update (assuming constant acceleration)
  const newVelocity = currentState.velocity_mps.add(
    acceleration.multiplyScalar(dt),
  );

  return {
    ...currentState,
    position_m: newPosition,
    velocity_mps: newVelocity,
    ticksSinceLastPhysicsUpdate: 0,
  };
}
```

### Orbital Elements Conversion

```typescript
function physicsStateToOrbitalElements(
  body: PhysicsStateReal,
  centralMass: number,
  G: number = 6.6743e-11,
): Partial<OrbitalParameters> {
  const mu = G * centralMass;
  const r = body.position_m;
  const v = body.velocity_mps;
  const rMag = r.magnitude();
  const vMag = v.magnitude();

  // Specific orbital energy
  const energy = 0.5 * vMag * vMag - mu / rMag;

  // Semi-major axis
  const semiMajorAxis = -mu / (2 * energy);

  // Angular momentum vector
  const h = r.cross(v);
  const hMag = h.magnitude();

  // Eccentricity
  const eccentricity = Math.sqrt(1 + (2 * energy * hMag * hMag) / (mu * mu));

  // Orbital period
  const period =
    2 *
    Math.PI *
    Math.sqrt((semiMajorAxis * semiMajorAxis * semiMajorAxis) / mu);

  return {
    realSemiMajorAxis_m: semiMajorAxis,
    eccentricity: eccentricity,
    period_s: period,
    realAphelion_m: semiMajorAxis * (1 + eccentricity),
    realPerihelion_m: semiMajorAxis * (1 - eccentricity),
    averageOrbitalSpeed_mps: (2 * Math.PI * semiMajorAxis) / period,
  };
}
```

## State Management

### State Updates

```typescript
function updatePhysicsState(
  bodies: PhysicsStateReal[],
  dt: number,
  G: number = 6.6743e-11,
): PhysicsStateReal[] {
  const updatedBodies: PhysicsStateReal[] = [];

  for (const body of bodies) {
    // Calculate total gravitational force
    const totalForce = calculateTotalForce(body, bodies, G);

    // Calculate acceleration (F = ma)
    const acceleration = totalForce.divideScalar(body.mass_kg);

    // Integrate to get new state
    const newState = integrateVerlet(body, acceleration, dt);

    updatedBodies.push(newState);
  }

  return updatedBodies;
}
```

### Performance Optimization

```typescript
function shouldUpdatePhysics(
  body: PhysicsStateReal,
  updateFrequency: number = 1,
): boolean {
  const ticks = body.ticksSinceLastPhysicsUpdate || 0;
  return ticks >= updateFrequency;
}

function incrementPhysicsTicks(body: PhysicsStateReal): PhysicsStateReal {
  return {
    ...body,
    ticksSinceLastPhysicsUpdate: (body.ticksSinceLastPhysicsUpdate || 0) + 1,
  };
}
```

## Integration with Rendering

### Coordinate System Conversion

```typescript
function convertToRenderingCoordinates(
  physicsState: PhysicsStateReal,
  renderScale: number,
): THREE.Vector3 {
  return new THREE.Vector3(
    physicsState.position_m.x * renderScale,
    physicsState.position_m.y * renderScale,
    physicsState.position_m.z * renderScale,
  );
}
```

### Velocity Magnitude for Display

```typescript
function getDisplayVelocity(physicsState: PhysicsStateReal): {
  magnitude_mps: number;
  magnitude_kms: number;
  magnitude_AU_per_year: number;
} {
  const magnitude_mps = physicsState.velocity_mps.magnitude();
  const magnitude_kms = magnitude_mps / 1000;
  const magnitude_AU_per_year = (magnitude_mps * 31557600) / 1.496e11;

  return {
    magnitude_mps,
    magnitude_kms,
    magnitude_AU_per_year,
  };
}
```

## Validation

### State Validation

```typescript
function validatePhysicsState(state: PhysicsStateReal): boolean {
  // Check required properties
  if (!state.id || typeof state.id !== "string") return false;
  if (typeof state.mass_kg !== "number" || state.mass_kg <= 0) return false;
  if (!state.position_m || !state.velocity_mps) return false;

  // Check for finite values
  if (!isFinite(state.mass_kg)) return false;
  if (!state.position_m.isFinite() || !state.velocity_mps.isFinite())
    return false;

  return true;
}
```

### Physical Constraints

```typescript
function checkPhysicalConstraints(state: PhysicsStateReal): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for extremely high velocities (> 10% speed of light)
  const speedOfLight = 299792458; // m/s
  const velocity = state.velocity_mps.magnitude();
  if (velocity > speedOfLight * 0.1) {
    warnings.push(`Velocity ${velocity} m/s exceeds 10% of light speed`);
  }

  // Check for extremely large masses (> 100 solar masses)
  const solarMass = 1.989e30;
  if (state.mass_kg > solarMass * 100) {
    warnings.push(`Mass ${state.mass_kg} kg exceeds 100 solar masses`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
```

## Performance Considerations

### Memory Usage

- OSVector3 objects have memory overhead
- Large numbers of physics states require efficient storage
- Consider object pooling for frequently updated states

### Update Frequency

- Physics updates are computationally expensive
- Use `ticksSinceLastPhysicsUpdate` for throttling
- Different objects may need different update frequencies

### Numerical Stability

- Large position values can cause precision loss
- Consider using relative coordinates for close objects
- Monitor for NaN or infinite values in calculations

## 🔗 Related

- [[CelestialObject]] - Contains physics state reference
- [[RenderableCelestialObject]] - Uses physics state for rendering
- [[OrbitalParameters]] - Converted from/to physics state
- [[LagrangePoint]] - Special physics configurations
- [[TwoBodySystem]] - Binary system physics
- [[@teskooano/core-physics]] - Physics simulation engine
- [[@teskooano/core-math]] - OSVector3 vector mathematics
