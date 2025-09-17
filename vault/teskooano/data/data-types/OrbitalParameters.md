---
aliases: [OrbitalParameters]
tags: [data, types, orbital, mechanics]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/orbit.type.ts"
status: active
---

# OrbitalParameters

Defines the orbital elements and rotational properties required to describe the path and orientation of a celestial body around its parent.

## Overview

The `OrbitalParameters` interface provides a complete set of Keplerian orbital elements and additional properties needed to describe the orbital motion and rotational characteristics of celestial objects. All distance and time values use real-world SI units (meters and seconds).

## Interface Definition

```typescript
export interface OrbitalParameters {
  realSemiMajorAxis_m: number;
  eccentricity: number;
  inclination: number;
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  meanAnomaly: number;
  period_s: number;
  siderealRotationPeriod_s?: number;
  axialTilt?: OSVector3;
  lagrangePointType?: LagrangePointType;
  realAphelion_m: number;
  realPerihelion_m: number;
  averageOrbitalSpeed_mps: number;
  epoch?: string;
  timeOfPerihelion?: string;
}
```

## Keplerian Orbital Elements

### realSemiMajorAxis_m

```typescript
realSemiMajorAxis_m: number;
```

The average distance from the parent body (REAL METERS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Meters
- **Usage**: Defines the size of the orbit
- **Example**: Earth's semi-major axis is ~1.496×10¹¹ m (1 AU)

### eccentricity

```typescript
eccentricity: number;
```

The shape of the orbit.

- **Type**: `number`
- **Required**: Yes
- **Range**:
  - 0 = perfectly circular
  - 0 < e < 1 = elliptical
  - e = 1 = parabolic
  - e > 1 = hyperbolic
- **Usage**: Determines orbital shape
- **Example**: Earth's eccentricity is ~0.0167

### inclination

```typescript
inclination: number;
```

The tilt of the orbital plane relative to a reference plane (RADIANS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Radians
- **Range**: 0 to π radians (0° to 180°)
- **Usage**: Defines orbital plane orientation
- **Example**: Earth's inclination is ~0.00005 radians (~0.003°)

### longitudeOfAscendingNode

```typescript
longitudeOfAscendingNode: number;
```

The angle where the orbit crosses the reference plane heading north (RADIANS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Radians
- **Range**: 0 to 2π radians (0° to 360°)
- **Usage**: Defines the orientation of the ascending node
- **Symbol**: Ω (Omega)

### argumentOfPeriapsis

```typescript
argumentOfPeriapsis: number;
```

The angle from the ascending node to the point of closest approach (periapsis) (RADIANS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Radians
- **Range**: 0 to 2π radians (0° to 360°)
- **Usage**: Defines the orientation of the ellipse in its plane
- **Symbol**: ω (omega)

### meanAnomaly

```typescript
meanAnomaly: number;
```

The position in the orbit at a specific epoch (time) (RADIANS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Radians
- **Range**: 0 to 2π radians (0° to 360°)
- **Usage**: Defines the object's position along its orbit at the epoch
- **Symbol**: M

## Temporal Properties

### period_s

```typescript
period_s: number;
```

The time taken to complete one orbit (REAL SECONDS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Seconds
- **Usage**: Orbital period calculation
- **Example**: Earth's period is ~31,557,600 seconds (1 year)

### siderealRotationPeriod_s

```typescript
siderealRotationPeriod_s?: number
```

Optional: The time it takes for the object to rotate 360 degrees around its own axis (in SECONDS).

- **Type**: `number`
- **Required**: No
- **Units**: Seconds
- **Usage**: Rotational animation and day/night cycles
- **Example**: Earth's rotation period is ~86,400 seconds (24 hours)

### epoch

```typescript
epoch?: string
```

The epoch for these orbital elements.

- **Type**: `string`
- **Required**: No
- **Format**: Standard epoch designation (e.g., "J2000", "J2023.5")
- **Usage**: Reference time for orbital element validity

### timeOfPerihelion

```typescript
timeOfPerihelion?: string
```

Optional: The time of perihelion passage as an ISO date string.

- **Type**: `string`
- **Required**: No
- **Format**: ISO 8601 date string
- **Usage**: Precise timing of closest approach

## Rotational Properties

### axialTilt

```typescript
axialTilt?: OSVector3
```

Optional: The tilt of the object's rotational axis relative to its orbital plane.

- **Type**: `OSVector3`
- **Required**: No
- **Usage**: Seasonal effects and rotational orientation
- **Example**: Earth's axial tilt is ~23.44° from orbital normal

## Special Orbital Configurations

### lagrangePointType

```typescript
lagrangePointType?: LagrangePointType
```

Optional: If the object is to be placed at a Lagrangian point (L1-L5).

- **Type**: `LagrangePointType`
- **Required**: No
- **Values**: `L1`, `L2`, `L3`, `L4`, `L5`
- **Usage**: Special orbital configurations in two-body systems

## Derived Orbital Properties

### realAphelion_m

```typescript
realAphelion_m: number;
```

The farthest distance from the parent body (REAL METERS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Meters
- **Calculation**: `realSemiMajorAxis_m * (1 + eccentricity)`
- **Usage**: Maximum orbital distance

### realPerihelion_m

```typescript
realPerihelion_m: number;
```

The closest distance from the parent body (REAL METERS).

- **Type**: `number`
- **Required**: Yes
- **Units**: Meters
- **Calculation**: `realSemiMajorAxis_m * (1 - eccentricity)`
- **Usage**: Minimum orbital distance

### averageOrbitalSpeed_mps

```typescript
averageOrbitalSpeed_mps: number;
```

The average orbital speed (METERS PER SECOND).

- **Type**: `number`
- **Required**: Yes
- **Units**: Meters per second
- **Calculation**: `2π * realSemiMajorAxis_m / period_s`
- **Usage**: Velocity calculations and display

## Usage Examples

### Earth's Orbital Parameters

```typescript
const earthOrbit: OrbitalParameters = {
  realSemiMajorAxis_m: 1.496e11, // 1 AU
  eccentricity: 0.0167, // Slightly elliptical
  inclination: 0.00005, // ~0.003° to ecliptic
  longitudeOfAscendingNode: 0, // Reference
  argumentOfPeriapsis: 1.796, // ~103°
  meanAnomaly: 6.24, // ~357° at J2000
  period_s: 31557600, // 1 year
  siderealRotationPeriod_s: 86164, // 23h 56m 4s
  axialTilt: new OSVector3(0, 0, 0.4091), // 23.44°
  realAphelion_m: 1.521e11, // Farthest from Sun
  realPerihelion_m: 1.471e11, // Closest to Sun
  averageOrbitalSpeed_mps: 29780, // ~29.78 km/s
  epoch: "J2000.0",
  timeOfPerihelion: "2023-01-04T16:17:00Z",
};
```

### Moon's Orbital Parameters

```typescript
const lunaOrbit: OrbitalParameters = {
  realSemiMajorAxis_m: 384400000, // ~384,400 km
  eccentricity: 0.0549, // Moderately elliptical
  inclination: 0.08979, // ~5.14° to ecliptic
  longitudeOfAscendingNode: 2.18, // ~125°
  argumentOfPeriapsis: 5.55, // ~318°
  meanAnomaly: 2.36, // ~135°
  period_s: 2360584, // 27.32 days
  siderealRotationPeriod_s: 2360584, // Tidally locked
  realAphelion_m: 405696000, // Apogee
  realPerihelion_m: 362600000, // Perigee
  averageOrbitalSpeed_mps: 1022, // ~1.022 km/s
  epoch: "J2000.0",
};
```

### Comet's Orbital Parameters

```typescript
const halleyOrbit: OrbitalParameters = {
  realSemiMajorAxis_m: 2.668e12, // ~17.8 AU
  eccentricity: 0.967, // Highly elliptical
  inclination: 2.83, // ~162° (retrograde)
  longitudeOfAscendingNode: 1.02, // ~58°
  argumentOfPeriapsis: 1.95, // ~112°
  meanAnomaly: 0.67, // ~38°
  period_s: 2750000000, // ~87 years
  siderealRotationPeriod_s: 458640, // ~15.3 hours
  realAphelion_m: 5.245e12, // ~35 AU
  realPerihelion_m: 8.766e10, // ~0.59 AU
  averageOrbitalSpeed_mps: 54500, // Varies greatly
  epoch: "J2000.0",
  timeOfPerihelion: "1986-02-09T19:00:00Z",
};
```

### Asteroid at Lagrange Point

```typescript
const trojanAsteroidOrbit: OrbitalParameters = {
  realSemiMajorAxis_m: 7.785e11, // Jupiter's orbit
  eccentricity: 0.07, // Low eccentricity
  inclination: 0.26, // ~15°
  longitudeOfAscendingNode: 1.75, // ~100°
  argumentOfPeriapsis: 0.52, // ~30°
  meanAnomaly: 1.05, // ~60° ahead of Jupiter
  period_s: 374335776, // Same as Jupiter
  lagrangePointType: LagrangePointType.L4, // Leading Trojan
  realAphelion_m: 8.33e11,
  realPerihelion_m: 7.24e11,
  averageOrbitalSpeed_mps: 13070,
  epoch: "J2000.0",
};
```

### Binary Star Barycentric Orbit

```typescript
const binaryStarOrbit: OrbitalParameters = {
  realSemiMajorAxis_m: 2.0e10, // 20 million km separation
  eccentricity: 0.02, // Nearly circular
  inclination: 0.17, // ~10°
  longitudeOfAscendingNode: 0,
  argumentOfPeriapsis: 0,
  meanAnomaly: 0,
  period_s: 864000, // 10 days
  realAphelion_m: 2.04e10,
  realPerihelion_m: 1.96e10,
  averageOrbitalSpeed_mps: 145000, // Very fast
  epoch: "J2023.5",
};
```

## Orbital Mechanics Calculations

### Position Calculation

```typescript
function calculateOrbitalPosition(
  orbit: OrbitalParameters,
  time: number,
): OSVector3 {
  // Mean motion
  const n = (2 * Math.PI) / orbit.period_s;

  // Mean anomaly at time t
  const M = orbit.meanAnomaly + n * time;

  // Solve Kepler's equation for eccentric anomaly
  let E = M;
  for (let i = 0; i < 10; i++) {
    E = M + orbit.eccentricity * Math.sin(E);
  }

  // True anomaly
  const nu =
    2 *
    Math.atan2(
      Math.sqrt(1 + orbit.eccentricity) * Math.sin(E / 2),
      Math.sqrt(1 - orbit.eccentricity) * Math.cos(E / 2),
    );

  // Distance from focus
  const r = orbit.realSemiMajorAxis_m * (1 - orbit.eccentricity * Math.cos(E));

  // Position in orbital plane
  const x = r * Math.cos(nu);
  const y = r * Math.sin(nu);

  // Rotate to 3D space using orbital elements
  // ... rotation matrix calculations ...

  return new OSVector3(x, y, 0); // Simplified
}
```

### Velocity Calculation

```typescript
function calculateOrbitalVelocity(
  orbit: OrbitalParameters,
  position: OSVector3,
  parentMass: number,
): OSVector3 {
  const mu = G * parentMass; // Standard gravitational parameter
  const r = position.magnitude();
  const a = orbit.realSemiMajorAxis_m;

  // Vis-viva equation
  const v = Math.sqrt(mu * (2 / r - 1 / a));

  // Direction perpendicular to position vector
  // ... velocity direction calculation ...

  return new OSVector3(0, v, 0); // Simplified
}
```

## Integration

### Physics System

- Orbital elements are used for position and velocity calculations
- Period determines update frequency for orbital motion
- Eccentricity affects gravitational dynamics

### Rendering System

- Position is calculated from orbital elements
- Rotational period drives rotational animation
- Axial tilt affects lighting and seasonal effects

### Time System

- Epoch provides reference time for calculations
- Period enables time scaling and fast-forward
- Perihelion timing affects seasonal accuracy

## Validation

### Required Properties

All core orbital elements must be provided:

- Semi-major axis, eccentricity, inclination
- Longitude of ascending node, argument of periapsis
- Mean anomaly, period
- Derived properties (aphelion, perihelion, speed)

### Physical Constraints

- Eccentricity must be ≥ 0
- Inclination must be 0 ≤ i ≤ π
- Angular elements must be 0 ≤ angle < 2π
- Period must be > 0
- Semi-major axis must be > 0

### Consistency Checks

- Aphelion = a(1 + e)
- Perihelion = a(1 - e)
- Average speed = 2πa/T

## 🔗 Related

- [[CelestialObject]] - Uses orbital parameters for position
- [[PhysicsStateReal]] - Physics state derived from orbital elements
- [[LagrangePointType]] - Special orbital configurations
- [[@teskooano/core-physics]] - Physics calculations using orbital data
- [[@teskooano/core-math]] - OSVector3 for axial tilt representation
