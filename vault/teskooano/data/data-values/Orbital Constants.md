---
aliases: [Orbital Constants]
tags: [data, values, orbital, mechanics]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/orbital.ts"
status: active
---

# Orbital Constants

Constants used for orbital mechanics calculations, Kepler equation solving, and orbital parameter validation.

## Overview

The orbital constants module provides numerical parameters and tolerances used in orbital mechanics calculations throughout the Teskooano simulation. These constants ensure numerical stability and accuracy in Kepler equation solving, orbital parameter validation, and collision physics calculations.

## Kepler Equation Solver Constants

### BASE_KEPLER_TOLERANCE

```typescript
export const BASE_KEPLER_TOLERANCE = 1e-4;
```

Base tolerance for Kepler equation solver.

**Description:**
The base tolerance value used in iterative solutions of Kepler's equation. This provides a good balance between accuracy and performance for most orbital calculations.

**Value:** 0.0001

**Usage Examples:**

```typescript
// Use base tolerance for elliptical orbits
const tolerance = BASE_KEPLER_TOLERANCE;
const eccentricAnomaly = solveKeplerEquation(
  meanAnomaly,
  eccentricity,
  tolerance,
);

// Calculate orbital position with base tolerance
const position = calculateOrbitalPosition(
  orbitalElements,
  time,
  BASE_KEPLER_TOLERANCE,
);
```

### KEPLER_TOLERANCE_SCALING

```typescript
export const KEPLER_TOLERANCE_SCALING = 1e-3;
```

Scaling factor for distance-based Kepler tolerance.

**Description:**
Multiplier for adjusting tolerance based on orbital distance. Larger distances require looser tolerances for numerical stability while maintaining reasonable accuracy.

**Value:** 0.001

**Usage Examples:**

```typescript
// Calculate adaptive tolerance based on distance
const adaptiveTolerance =
  BASE_KEPLER_TOLERANCE + distanceAU * KEPLER_TOLERANCE_SCALING;

// Apply distance-based tolerance scaling
const scaledTolerance = Math.max(
  BASE_KEPLER_TOLERANCE,
  distance * KEPLER_TOLERANCE_SCALING,
);
```

### MAX_KEPLER_TOLERANCE

```typescript
export const MAX_KEPLER_TOLERANCE = 1e-2;
```

Maximum tolerance for Kepler equation solver.

**Description:**
Upper limit for tolerance values to prevent excessive computational overhead and maintain reasonable accuracy standards.

**Value:** 0.01

**Usage Examples:**

```typescript
// Clamp tolerance to maximum value
const clampedTolerance = Math.min(calculatedTolerance, MAX_KEPLER_TOLERANCE);

// Ensure tolerance doesn't exceed maximum
const safeTolerance = Math.min(adaptiveTolerance, MAX_KEPLER_TOLERANCE);
```

### MIN_KEPLER_TOLERANCE

```typescript
export const MIN_KEPLER_TOLERANCE = 1e-5;
```

Minimum tolerance for Kepler equation solver.

**Description:**
Lower limit for tolerance values to ensure sufficient accuracy for precise orbital calculations.

**Value:** 0.00001

**Usage Examples:**

```typescript
// Ensure minimum accuracy
const safeTolerance = Math.max(calculatedTolerance, MIN_KEPLER_TOLERANCE);

// Apply minimum tolerance floor
const effectiveTolerance = Math.max(MIN_KEPLER_TOLERANCE, adaptiveTolerance);
```

### DEFAULT_KEPLER_TOLERANCE

```typescript
export const DEFAULT_KEPLER_TOLERANCE = 1e-8;
```

Default tolerance for Kepler equation solver.

**Description:**
Standard tolerance value used when no specific tolerance is provided. Provides high accuracy for most orbital calculations.

**Value:** 0.00000001

**Usage Examples:**

```typescript
// Use default tolerance for most calculations
const eccentricAnomaly = solveKeplerEquation(
  meanAnomaly,
  eccentricity,
  DEFAULT_KEPLER_TOLERANCE,
);

// Initialize orbital calculator with default tolerance
const calculator = new OrbitalCalculator(DEFAULT_KEPLER_TOLERANCE);
```

### MAX_KEPLER_ITERATIONS

```typescript
export const MAX_KEPLER_ITERATIONS = 100;
```

Maximum iterations for Kepler equation solver.

**Description:**
Upper limit on iteration count to prevent infinite loops and ensure computational efficiency in iterative orbital calculations.

**Value:** 100 iterations

**Usage Examples:**

```typescript
// Limit iterations for numerical stability
for (let i = 0; i < MAX_KEPLER_ITERATIONS; i++) {
  const newEccentricAnomaly = calculateNextIteration(currentEccentricAnomaly);
  if (Math.abs(newEccentricAnomaly - currentEccentricAnomaly) < tolerance) {
    break; // Converged
  }
  currentEccentricAnomaly = newEccentricAnomaly;
}

// Check for convergence failure
if (iterations >= MAX_KEPLER_ITERATIONS) {
  console.warn("Kepler equation did not converge within maximum iterations");
}
```

## Collision Physics Constants

### COLLISION_RESTITUTION

```typescript
export const COLLISION_RESTITUTION = 1.0;
```

Restitution coefficient for collision physics.

**Description:**
Coefficient of restitution for elastic collisions between celestial bodies. A value of 1.0 represents perfectly elastic collisions with no energy loss.

**Value:** 1.0 (perfectly elastic)

**Usage Examples:**

```typescript
// Apply restitution to collision response
const finalVelocity = relativeVelocity * COLLISION_RESTITUTION;

// Calculate collision energy loss
const energyLoss = 1 - COLLISION_RESTITUTION;

// Determine collision type
const isElastic = COLLISION_RESTITUTION === 1.0;
const isInelastic = COLLISION_RESTITUTION < 1.0;
```

## Usage Patterns

### Adaptive Tolerance Calculation

```typescript
function calculateAdaptiveTolerance(
  distanceAU: number,
  eccentricity: number,
): number {
  // Base tolerance
  let tolerance = BASE_KEPLER_TOLERANCE;

  // Scale by distance
  tolerance += distanceAU * KEPLER_TOLERANCE_SCALING;

  // Adjust for eccentricity (higher eccentricity needs tighter tolerance)
  if (eccentricity > 0.8) {
    tolerance *= 0.1; // Tighter tolerance for highly eccentric orbits
  }

  // Clamp to valid range
  return Math.max(
    MIN_KEPLER_TOLERANCE,
    Math.min(tolerance, MAX_KEPLER_TOLERANCE),
  );
}
```

### Kepler Equation Solver

```typescript
function solveKeplerEquation(
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = DEFAULT_KEPLER_TOLERANCE,
): number {
  let eccentricAnomaly = meanAnomaly; // Initial guess

  for (let i = 0; i < MAX_KEPLER_ITERATIONS; i++) {
    const deltaE =
      (meanAnomaly -
        (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly))) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));

    eccentricAnomaly += deltaE;

    if (Math.abs(deltaE) < tolerance) {
      return eccentricAnomaly; // Converged
    }
  }

  throw new Error(
    `Kepler equation did not converge after ${MAX_KEPLER_ITERATIONS} iterations`,
  );
}
```

### Collision Response

```typescript
function calculateCollisionResponse(
  body1: CelestialObject,
  body2: CelestialObject,
  impactVelocity: number,
): CollisionResult {
  const relativeVelocity = impactVelocity;
  const restitution = COLLISION_RESTITUTION;

  // Calculate final velocities
  const finalVelocity1 =
    relativeVelocity * restitution * (body2.mass / (body1.mass + body2.mass));
  const finalVelocity2 =
    -relativeVelocity * restitution * (body1.mass / (body1.mass + body2.mass));

  return {
    velocity1: finalVelocity1,
    velocity2: finalVelocity2,
    energyLoss: 1 - restitution,
    isElastic: restitution === 1.0,
  };
}
```

### Orbital Parameter Validation

```typescript
function validateOrbitalParameters(elements: OrbitalElements): boolean {
  // Check eccentricity bounds
  if (elements.eccentricity < 0 || elements.eccentricity > 2.0) {
    return false;
  }

  // Check semi-major axis
  if (elements.semiMajorAxis <= 0) {
    return false;
  }

  // Check inclination
  if (elements.inclination < 0 || elements.inclination > Math.PI) {
    return false;
  }

  return true;
}
```

## Performance Considerations

### Tolerance Selection

- **High Accuracy**: Use `DEFAULT_KEPLER_TOLERANCE` for precise calculations
- **Balanced**: Use `BASE_KEPLER_TOLERANCE` for general calculations
- **Performance**: Use `MAX_KEPLER_TOLERANCE` for real-time applications

### Iteration Limits

- Prevents infinite loops in pathological cases
- Ensures predictable performance characteristics
- Provides fallback behavior for non-convergent cases

### Numerical Stability

- Adaptive tolerance prevents numerical overflow
- Distance-based scaling maintains accuracy at all scales
- Minimum tolerance ensures sufficient precision

## Integration

### Physics System

- Kepler equation solving for orbital mechanics
- Collision detection and response
- Orbital parameter validation

### Rendering System

- Orbital path calculation
- Position prediction for visualization
- Trail and prediction line generation

### Simulation System

- Time step integration
- Orbital evolution tracking
- Collision event handling

## Error Handling

### Convergence Failure

```typescript
function safeKeplerSolver(meanAnomaly: number, eccentricity: number): number {
  try {
    return solveKeplerEquation(
      meanAnomaly,
      eccentricity,
      DEFAULT_KEPLER_TOLERANCE,
    );
  } catch (error) {
    // Fallback to less accurate but more stable method
    console.warn("Kepler solver failed, using approximation");
    return meanAnomaly; // Simple approximation
  }
}
```

### Tolerance Validation

```typescript
function validateTolerance(tolerance: number): number {
  return Math.max(
    MIN_KEPLER_TOLERANCE,
    Math.min(tolerance, MAX_KEPLER_TOLERANCE),
  );
}
```

## 🔗 Related

- [[Physical Constants]] - Fundamental physics constants used in orbital calculations
- [[Astronomical Constants]] - Astronomical units for orbital distances
- [[Simulation Limits]] - Numerical limits for orbital stability
- [[@teskooano/core-physics]] - Physics engine using orbital constants
- [[@teskooano/renderer-threejs-orbits]] - Orbital visualization using these constants
