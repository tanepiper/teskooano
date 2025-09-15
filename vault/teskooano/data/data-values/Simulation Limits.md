---
aliases: [Simulation Limits]
tags: [data, values, limits, simulation]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/simulation.ts"
status: active
---

# Simulation Limits

Numerical limits and constraints used to maintain simulation stability and prevent numerical overflow or instability issues.

## Overview

The simulation limits module provides numerical limits and constraints used throughout the Teskooano simulation to maintain stability, prevent numerical overflow, and ensure reasonable performance. These limits act as safety bounds for physics calculations, object counts, and system resources.

## Physics Limits

### MAX_FORCE

```typescript
export const MAX_FORCE = 1e25;
```

Maximum force magnitude to prevent numerical instability in Newtons.

**Description:**
Upper limit on gravitational and other forces to prevent numerical overflow and maintain simulation stability. Forces exceeding this limit are clamped to prevent unrealistic accelerations.

**Value:** 1×10²⁵ N

**Usage Examples:**

```typescript
// Clamp gravitational force to maximum
const clampedForce = Math.min(calculatedForce, MAX_FORCE);

// Check if force is approaching limit
const isNearLimit = calculatedForce > MAX_FORCE * 0.9;

// Apply force with safety check
const safeForce = Math.min(force, MAX_FORCE);
body.applyForce(safeForce);
```

### MAX_VELOCITY

```typescript
export const MAX_VELOCITY = 1e7;
```

Maximum velocity magnitude to prevent numerical instability in m/s.

**Description:**
Upper limit on object velocities to prevent unrealistic speeds and maintain numerical stability. Velocities exceeding this limit are clamped to prevent objects from moving faster than physically reasonable.

**Value:** 1×10⁷ m/s (10,000 km/s)

**Usage Examples:**

```typescript
// Clamp velocity to maximum
const clampedVelocity = Math.min(velocity.magnitude(), MAX_VELOCITY);
velocity.normalize().multiplyScalar(clampedVelocity);

// Check for relativistic speeds
const isRelativistic = velocity.magnitude() > 0.1 * SPEED_OF_LIGHT;

// Apply velocity limit
if (velocity.magnitude() > MAX_VELOCITY) {
  velocity.normalize().multiplyScalar(MAX_VELOCITY);
}
```

### MIN_MASS

```typescript
export const MIN_MASS = 1e10;
```

Minimum mass for stable physics calculations in kilograms.

**Description:**
Lower limit on object masses to prevent numerical instability from extremely small masses that could cause division by zero or floating-point precision issues.

**Value:** 1×10¹⁰ kg

**Usage Examples:**

```typescript
// Ensure minimum mass
const safeMass = Math.max(mass, MIN_MASS);

// Validate mass input
const isValidMass = mass >= MIN_MASS && mass <= MAX_MASS;

// Clamp mass to valid range
const clampedMass = Math.max(MIN_MASS, Math.min(mass, MAX_MASS));
```

### MAX_MASS

```typescript
export const MAX_MASS = 1e35;
```

Maximum mass for stable physics calculations in kilograms.

**Description:**
Upper limit on object masses to prevent numerical overflow and maintain simulation stability. Masses exceeding this limit could cause gravitational forces to become infinite or cause other numerical issues.

**Value:** 1×10³⁵ kg

**Usage Examples:**

```typescript
// Clamp mass to maximum
const safeMass = Math.min(mass, MAX_MASS);

// Check if mass is approaching limit
const isNearLimit = mass > MAX_MASS * 0.9;

// Validate stellar mass
const isValidStellarMass = mass >= MIN_MASS && mass <= MAX_MASS;
```

## Distance Limits

### MIN_COLLISION_DISTANCE

```typescript
export const MIN_COLLISION_DISTANCE = 1e3;
```

Minimum distance for collision detection in meters.

**Description:**
Minimum distance threshold for collision detection to prevent objects from overlapping unrealistically and to maintain numerical stability in collision calculations.

**Value:** 1,000 m

**Usage Examples:**

```typescript
// Check collision distance
const collisionDistance = Math.max(distance, MIN_COLLISION_DISTANCE);

// Validate collision detection
const isCollision = distance < MIN_COLLISION_DISTANCE;

// Apply minimum distance for stability
const safeDistance = Math.max(calculatedDistance, MIN_COLLISION_DISTANCE);
```

### MAX_PHYSICS_DISTANCE

```typescript
export const MAX_PHYSICS_DISTANCE = 1e20;
```

Maximum distance for physics calculations in meters.

**Description:**
Upper limit on distances for physics calculations to prevent numerical overflow and maintain performance. Objects beyond this distance are excluded from physics calculations.

**Value:** 1×10²⁰ m

**Usage Examples:**

```typescript
// Limit physics calculation distance
const physicsDistance = Math.min(distance, MAX_PHYSICS_DISTANCE);

// Check if object is within physics range
const isInPhysicsRange = distance <= MAX_PHYSICS_DISTANCE;

// Cull distant objects from physics
if (distance > MAX_PHYSICS_DISTANCE) {
  object.excludeFromPhysics();
}
```

## Object Count Limits

### MAX_CELESTIAL_OBJECTS

```typescript
export const MAX_CELESTIAL_OBJECTS = 80;
```

Maximum number of celestial objects for stable performance.

**Description:**
Upper limit on the number of celestial objects in the simulation to maintain reasonable performance and prevent memory issues. This limit ensures the simulation remains responsive.

**Value:** 80 objects

**Usage Examples:**

```typescript
// Check object count limit
if (objectCount > MAX_CELESTIAL_OBJECTS) {
  console.warn("Too many objects for optimal performance");
}

// Validate object creation
const canAddObject = objectCount < MAX_CELESTIAL_OBJECTS;

// Limit object count
const limitedObjects = objects.slice(0, MAX_CELESTIAL_OBJECTS);
```

### MAX_PARTICLES

```typescript
export const MAX_PARTICLES = 10000;
```

Maximum number of particles for asteroid fields.

**Description:**
Upper limit on the number of particles in particle systems (like asteroid fields) to maintain rendering performance while providing sufficient visual detail.

**Value:** 10,000 particles

**Usage Examples:**

```typescript
// Limit particle count
const limitedParticles = particles.slice(0, MAX_PARTICLES);

// Check particle system capacity
const canAddParticles = particleCount < MAX_PARTICLES;

// Optimize particle system
if (particleCount > MAX_PARTICLES) {
  reduceParticleDensity();
}
```

### MAX_TRAIL_POINTS

```typescript
export const MAX_TRAIL_POINTS = 1000;
```

Maximum number of trail points per object.

**Description:**
Upper limit on the number of trail points per celestial object to maintain rendering performance while providing sufficient trail detail for orbital visualization.

**Value:** 1,000 points

**Usage Examples:**

```typescript
// Limit trail points
const limitedTrail = trailPoints.slice(-MAX_TRAIL_POINTS);

// Check trail capacity
const canAddTrailPoint = trailPoints.length < MAX_TRAIL_POINTS;

// Manage trail memory
if (trailPoints.length > MAX_TRAIL_POINTS) {
  trailPoints.shift(); // Remove oldest point
}
```

## Numerical Stability Parameters

### GRAVITATIONAL_SOFTENING_SQUARED

```typescript
export const GRAVITATIONAL_SOFTENING_SQUARED = 1e6;
```

Gravitational softening parameter in m².

**Description:**
Prevents gravitational force from becoming infinite at very small distances. A value around (parentRadius + moonRadius)² or similar can be physical. Used for numerical stability in N-body simulations.

**Value:** 1×10⁶ m²

**Usage Examples:**

```typescript
// Apply gravitational softening
const effectiveDistSq = distSq + GRAVITATIONAL_SOFTENING_SQUARED;
const forceMagnitude = (G * mass1 * mass2) / effectiveDistSq;

// Adjust softening based on simulation scale
const adaptiveSoftening = Math.max(
  GRAVITATIONAL_SOFTENING_SQUARED,
  scale * 1e6,
);

// Calculate softened gravitational force
const softenedForce = calculateGravitationalForce(
  mass1,
  mass2,
  effectiveDistSq,
);
```

### MASS_DIFF_THRESHOLD

```typescript
export const MASS_DIFF_THRESHOLD = 0.1;
```

Mass difference threshold for collision physics.

**Description:**
Threshold for mass difference to trigger inelastic collision. When one object is less than 10% the mass of another, it gets absorbed. Used for collision resolution and destruction events.

**Value:** 0.1 (10%)

**Usage Examples:**

```typescript
// Check if collision should result in absorption
const massRatio = smallerMass / largerMass;
const shouldAbsorb = massRatio < MASS_DIFF_THRESHOLD;

// Determine collision outcome
const collisionType =
  massRatio < MASS_DIFF_THRESHOLD ? "absorption" : "elastic";

// Calculate collision result
if (massRatio < MASS_DIFF_THRESHOLD) {
  absorbSmallerObject(smallerObject, largerObject);
} else {
  performElasticCollision(object1, object2);
}
```

## System Limits

### MIN_ROGUE_DISTANCE_AU

```typescript
export const MIN_ROGUE_DISTANCE_AU = 50;
```

Minimum distance for rogue objects in AU.

**Description:**
The minimum distance from the system center for rogue objects to ensure they don't interfere with the main system. Used for placing rogue planets and interstellar objects.

**Value:** 50 AU

**Usage Examples:**

```typescript
// Place rogue object at safe distance
const safeDistanceAU = Math.max(baseDistance, MIN_ROGUE_DISTANCE_AU);
const position_m = safeDistanceAU * AU_METERS;

// Check if object is far enough to be considered rogue
const isRogue = distanceAU >= MIN_ROGUE_DISTANCE_AU;

// Validate rogue object placement
const isValidRoguePlacement = distanceAU >= MIN_ROGUE_DISTANCE_AU;
```

### MUTUAL_DESTRUCTION_ID

```typescript
export const MUTUAL_DESTRUCTION_ID = "MUTUAL_DESTRUCTION";
```

Special identifier for mutual destruction events.

**Description:**
Used to identify collision events where both objects are destroyed due to similar masses or high impact velocities. Used in collision detection and event handling.

**Value:** "MUTUAL_DESTRUCTION"

**Usage Examples:**

```typescript
// Handle mutual destruction
if (eventId === MUTUAL_DESTRUCTION_ID) {
  destroyBothObjects(body1, body2);
}

// Create mutual destruction event
const event = { type: MUTUAL_DESTRUCTION_ID, bodies: [body1, body2] };

// Check for mutual destruction condition
const isMutualDestruction = mass1 / mass2 > 0.5 && mass2 / mass1 > 0.5;
```

## Usage Patterns

### Physics Validation

```typescript
function validatePhysicsState(state: PhysicsState): boolean {
  // Check force limits
  if (state.force.magnitude() > MAX_FORCE) {
    console.warn("Force exceeds maximum limit");
    return false;
  }

  // Check velocity limits
  if (state.velocity.magnitude() > MAX_VELOCITY) {
    console.warn("Velocity exceeds maximum limit");
    return false;
  }

  // Check mass limits
  if (state.mass < MIN_MASS || state.mass > MAX_MASS) {
    console.warn("Mass outside valid range");
    return false;
  }

  return true;
}
```

### Object Count Management

```typescript
class ObjectManager {
  private objects: CelestialObject[] = [];

  addObject(object: CelestialObject): boolean {
    if (this.objects.length >= MAX_CELESTIAL_OBJECTS) {
      console.warn("Maximum object count reached");
      return false;
    }

    this.objects.push(object);
    return true;
  }

  removeObject(objectId: string): void {
    this.objects = this.objects.filter((obj) => obj.id !== objectId);
  }

  getObjectCount(): number {
    return this.objects.length;
  }
}
```

### Collision Detection

```typescript
function detectCollision(
  obj1: CelestialObject,
  obj2: CelestialObject,
): CollisionResult {
  const distance = obj1.position.distanceTo(obj2.position);
  const minDistance = obj1.radius + obj2.radius + MIN_COLLISION_DISTANCE;

  if (distance < minDistance) {
    const massRatio =
      Math.min(obj1.mass, obj2.mass) / Math.max(obj1.mass, obj2.mass);

    if (massRatio < MASS_DIFF_THRESHOLD) {
      return {
        type: "absorption",
        smaller: obj1.mass < obj2.mass ? obj1 : obj2,
      };
    } else {
      return { type: "elastic", objects: [obj1, obj2] };
    }
  }

  return { type: "none" };
}
```

## Performance Considerations

### Memory Management

- Object count limits prevent memory exhaustion
- Trail point limits manage memory usage
- Particle limits balance visual quality and performance

### Numerical Stability

- Force and velocity limits prevent overflow
- Mass limits prevent division by zero
- Distance limits maintain calculation precision

### Computational Efficiency

- Physics distance limits reduce calculation load
- Object count limits maintain frame rates
- Softening parameters prevent expensive calculations

## Integration

### Physics System

- Force and velocity clamping
- Mass validation
- Distance-based culling

### Rendering System

- Object count management
- Trail point optimization
- Particle system limits

### Simulation System

- Performance monitoring
- Resource management
- Stability validation

## 🔗 Related

- [[Physical Constants]] - Fundamental constants used with these limits
- [[Astronomical Constants]] - Distance and mass references
- [[Time Constants]] - Performance and timing limits
- [[@teskooano/core-physics]] - Physics engine using these limits
- [[@teskooano/core-state]] - State management with object limits
