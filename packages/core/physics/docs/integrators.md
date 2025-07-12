# Numerical Integration Methods

The physics package provides multiple numerical integration methods for updating object positions and velocities over time. Each integrator has different accuracy, stability, and performance characteristics suitable for different simulation requirements.

## Integrator Overview

| Integrator       | Order | Symplectic | Energy Conservation | Performance | Best For                  |
| ---------------- | ----- | ---------- | ------------------- | ----------- | ------------------------- |
| Euler            | 1st   | No         | Poor                | Fastest     | Debugging only            |
| Symplectic Euler | 1st   | Yes        | Good                | Fast        | Simple simulations        |
| Verlet           | 2nd   | Yes        | Excellent           | Fast        | General orbital mechanics |
| RK4              | 4th   | No         | Good                | Medium      | High accuracy needs       |
| Adaptive RK      | 4-5th | No         | Good                | Variable    | Complex systems           |
| Yoshida4         | 4th   | Yes        | Excellent           | Medium      | Long-term stability       |
| Forest-Ruth      | 4th   | Yes        | Excellent           | Medium      | Alternative to Yoshida    |
| PEFRL            | 4th   | Yes        | Excellent           | Medium      | Optimized symplectic      |
| Leapfrog         | 2nd   | Yes        | Good                | Fast        | Simple N-body             |

## Basic Integrators

### Standard Euler

**File:** `integrators/euler.ts`
**Order:** 1st
**Symplectic:** No

The simplest integration method, updating velocity first, then position:

```typescript
v_new = v_old + a * dt;
p_new = p_old + v_old * dt;
```

```typescript
const newState = standardEuler(currentState, acceleration, dt);
```

**Advantages:**

- Simplest implementation
- Fastest execution
- Good for debugging

**Disadvantages:**

- Poor energy conservation
- Accumulates error quickly
- Not suitable for orbital mechanics

### Symplectic Euler

**File:** `integrators/symplecticEuler.ts`
**Order:** 1st
**Symplectic:** Yes

An improved version of Euler that preserves the symplectic structure:

```typescript
v_new = v_old + a * dt;
p_new = p_old + v_new * dt; // Uses updated velocity
```

```typescript
const newState = symplecticEuler(currentState, acceleration, dt);
```

**Advantages:**

- Better energy conservation than standard Euler
- Still simple and fast
- Symplectic (preserves phase space structure)

**Disadvantages:**

- Still only 1st order accuracy
- Can drift over long periods

## Velocity Verlet

**File:** `integrators/verlet.ts`
**Order:** 2nd
**Symplectic:** Yes

The most commonly used integrator for orbital mechanics, providing excellent stability:

```typescript
p_new = p + v*dt + 0.5*a*dt²
v_new = v + 0.5*(a + a_new)*dt
```

```typescript
const newState = velocityVerletIntegrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);
```

**Key Features:**

- **Two-stage process**: Updates position first, then velocity
- **Force recalculation**: Requires acceleration at new position
- **Energy conservation**: Excellent for conservative systems
- **Time-reversible**: Running backwards gives exact original state

**Advantages:**

- Excellent energy conservation
- Time-reversible and symplectic
- Standard choice for gravitational systems
- Good balance of speed and accuracy

**Disadvantages:**

- Requires force recalculation (more expensive)
- Can be unstable with very large time steps

## Runge-Kutta Methods

### RK4 (Fourth-Order Runge-Kutta)

**File:** `integrators/rk4.ts`
**Order:** 4th
**Symplectic:** No

Classic high-accuracy integrator using four derivative evaluations:

```typescript
k1 = f(t, y);
k2 = f(t + dt / 2, y + (k1 * dt) / 2);
k3 = f(t + dt / 2, y + (k2 * dt) / 2);
k4 = f(t + dt, y + k3 * dt);
y_new = y + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
```

```typescript
const newState = rk4Integrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);
```

**Advantages:**

- High 4th-order accuracy
- Smooth error characteristics
- Good for non-conservative forces

**Disadvantages:**

- Not symplectic (energy drift in conservative systems)
- Four force evaluations per step
- More complex implementation

### Adaptive Runge-Kutta (Dormand-Prince)

**File:** `integrators/adaptive.ts`
**Order:** 4th-5th (embedded)
**Symplectic:** No

An advanced integrator that automatically adjusts the time step for optimal accuracy:

```typescript
const config: AdaptiveConfig = {
  tolerance: 1e-6, // Target error tolerance
  minDt: 1e-12, // Minimum time step
  maxDt: 1e5, // Maximum time step
  safetyFactor: 0.9, // Step size safety factor
  maxGrowth: 2.0, // Maximum step growth
  maxShrink: 0.1, // Maximum step shrink
};

const result = adaptiveRKIntegrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
  config,
);
```

**Key Features:**

- **Error estimation**: Uses 4th and 5th order methods to estimate error
- **Adaptive stepping**: Automatically adjusts time step to maintain accuracy
- **Error control**: Rejects steps that exceed tolerance
- **Efficiency**: Uses larger steps when possible, smaller when needed

**Advantages:**

- Automatic error control
- Optimal time step selection
- Good for complex, multi-scale systems
- Handles varying dynamics well

**Disadvantages:**

- Variable time step complexity
- Not symplectic
- Overhead for simple systems

## Symplectic Integrators

Symplectic integrators preserve the Hamiltonian structure of the system, making them ideal for long-term orbital simulations.

### Yoshida4

**File:** `integrators/yoshida.ts`
**Order:** 4th
**Symplectic:** Yes

A 4th-order symplectic integrator using composition of lower-order steps:

```typescript
const newState = yoshida4Integrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);
```

**Coefficients:**

```typescript
const w0 = -∛2 / (2 - ∛2);
const w1 = 1 / (2 - ∛2);
// Three substeps with specific coefficients
```

### Forest-Ruth

**File:** `integrators/yoshida.ts`
**Order:** 4th
**Symplectic:** Yes

Alternative 4th-order symplectic method with different coefficients:

```typescript
const newState = forestRuthIntegrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);
```

### PEFRL (Position Extended Forest-Ruth-Like)

**File:** `integrators/yoshida.ts`
**Order:** 4th
**Symplectic:** Yes

Highly optimized 4th-order symplectic integrator that minimizes leading error terms:

```typescript
const newState = pefrlIntegrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);
```

**Advantages:**

- Minimal error terms
- Excellent for very long integrations
- Best symplectic integrator for most applications

### Leapfrog

**File:** `integrators/yoshida.ts`
**Order:** 2nd
**Symplectic:** Yes

Simple and robust 2nd-order symplectic integrator:

```typescript
const newState = leapfrogIntegrate(
  currentState,
  acceleration,
  calculateNewAcceleration,
  dt,
);
```

**Algorithm (Kick-Drift-Kick):**

```typescript
v_half = v + (a * dt) / 2; // Half kick
p_new = p + v_half * dt; // Full drift
a_new = calculateAcceleration(p_new);
v_new = v_half + (a_new * dt) / 2; // Half kick
```

## Special Integrators

### Ideal Orbit

**File:** `integrators/ideal.ts`
**Order:** Analytical
**Symplectic:** N/A

Exact analytical solution for perfect Keplerian orbits:

```typescript
const newState = idealOrbit(body, parent, orbitalParameters, currentTime_s);
```

**Key Features:**

- **Perfect accuracy**: No numerical error
- **Analytical solution**: Uses Kepler's equation
- **Hierarchical**: Processes parent before children
- **On-rails**: Bodies follow exact elliptical paths

**Usage:** Ideal mode simulations for perfect solar system mechanics.

## Integration Strategy Selection

The physics system automatically selects integrators based on simulation mode and configuration:

```typescript
// Configuration example
const config: SimulationConfiguration = {
  mode: "nbody",
  integrator: "verlet", // or "rk4", "adaptive", etc.
  algorithm: "barnes-hut",
};
```

### Selection Guidelines

**For General Use:**

- **Verlet**: Best general-purpose choice for orbital mechanics
- **PEFRL**: Best for long-term stability and energy conservation

**For High Accuracy:**

- **RK4**: When you need 4th-order accuracy
- **Adaptive**: When system has varying time scales

**For Performance:**

- **Symplectic Euler**: Fast but acceptable accuracy
- **Leapfrog**: Simple and reasonably accurate

**For Special Cases:**

- **Ideal**: Perfect accuracy for Keplerian systems
- **Adaptive**: Complex systems with multiple time scales

## Time Step Considerations

### Stability Criteria

Each integrator has different stability requirements:

```typescript
// Conservative time step for orbital period T
const dt_orbital = T / 100;  // 1% of orbital period

// Verlet stability (typical)
const dt_verlet = 0.01 * Math.sqrt(r³ / (GM));

// RK4 can use larger steps
const dt_rk4 = 0.05 * Math.sqrt(r³ / (GM));
```

### Performance vs Accuracy

| Time Step | Accuracy   | Performance | Energy Conservation |
| --------- | ---------- | ----------- | ------------------- |
| T/1000    | Excellent  | Slow        | Excellent           |
| T/100     | Good       | Moderate    | Good                |
| T/50      | Acceptable | Fast        | Acceptable          |
| T/10      | Poor       | Very Fast   | Poor                |

### Adaptive Time Stepping

For adaptive integrators, the algorithm automatically adjusts:

```typescript
const config: AdaptiveConfig = {
  tolerance: 1e-6, // Smaller = more accurate
  maxDt: T / 10, // Don't exceed 10% of orbital period
  minDt: 1e-12, // Minimum physical resolution
};
```

## Implementation Notes

- All integrators operate on `PhysicsStateReal` objects
- Force calculations use `OSVector3` in SI units (Newtons)
- Integrators requiring force recalculation use callback functions
- Symplectic integrators are preferred for conservative systems
- Energy monitoring helps detect integration problems

## Performance Comparison

Based on a 1000-body system over 1000 time steps:

| Integrator       | Relative Speed | Energy Drift | Accuracy  |
| ---------------- | -------------- | ------------ | --------- |
| Euler            | 1.0x           | High         | Poor      |
| Symplectic Euler | 1.1x           | Medium       | Fair      |
| Verlet           | 2.5x           | Very Low     | Good      |
| RK4              | 4.5x           | Low          | Excellent |
| Adaptive RK      | Variable       | Very Low     | Excellent |
| PEFRL            | 4.0x           | Minimal      | Excellent |

_Note: Performance varies significantly based on system characteristics and force calculation method._
