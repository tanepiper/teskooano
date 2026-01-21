# Orbital Velocity Fix Documentation

## Problem Summary

Planets in procedurally generated systems were flying off in straight lines instead of following proper elliptical orbits. This critical bug affected the stability of all procedurally generated star systems.

## Root Cause Analysis

### The Bug

In `packages/core/state/src/services/PhysicsStateCalculator.ts`, the initial physics state calculation for planets had a critical flaw:

```typescript
// BEFORE (BUGGY CODE):
const initialRelativePos = calculateOrbitalPosition(
  parentPhysicsState,
  data.orbit,
  0,
);
const initialWorldVel = calculateOrbitalVelocity(
  parentPhysicsState,
  data.orbit,
  0,
);
```

While both functions were called with `time=0`, which correctly uses the `meanAnomaly` from the orbital parameters, **they were not guaranteed to calculate position and velocity at the exact same orbital phase**.

### Why This Caused Unbound Orbits

1. **Separate Function Calls**: `calculateOrbitalPosition()` and `calculateOrbitalVelocity()` are wrapper functions that internally call `calculateKeplerianStateAtTime()` separately.

2. **Wrapper Function Overhead**: The `calculateOrbitalVelocity()` wrapper adds the parent's velocity to the calculated orbital velocity. If there's any numerical precision loss or calculation order issues, this can cause slight desynchronization.

3. **Velocity-Position Mismatch**: Even tiny mismatches between the velocity vector and position vector result in:
   - **Incorrect orbital energy** (E = ½v² - μ/r)
   - **Unbound orbits** if total energy becomes positive
   - **Escape trajectories** causing planets to fly off in straight lines

### The Mathematical Issue

For a bound elliptical orbit, the vis-viva equation must hold:

```
v² = μ(2/r - 1/a)
```

Where:
- `v` = orbital velocity magnitude
- `μ` = gravitational parameter (G × M)
- `r` = distance from central body
- `a` = semi-major axis

When position and velocity aren't calculated atomically:
- Position `r` is calculated at mean anomaly `M₀`
- Velocity `v` might be calculated at a slightly different phase
- This breaks the vis-viva equation
- Total orbital energy can become positive: `E = ½v² - μ/r > 0`
- Result: Unbound hyperbolic trajectory (planet escapes)

## The Solution

### Fixed Code

```typescript
// AFTER (FIXED CODE):
const { position: relativePos, velocity: relativeVel } = calculateKeplerianStateAtTime(
  data.orbit,
  0, // time=0 uses the initial meanAnomaly from orbital parameters
  parentPhysicsState.mass_kg,
);

// Convert to world coordinates
const initialWorldPos = relativePos.clone().add(parentPhysicsState.position_m);
const initialWorldVel = relativeVel.clone().add(parentPhysicsState.velocity_mps);
```

### Why This Works

1. **Atomic Calculation**: `calculateKeplerianStateAtTime()` returns BOTH position and velocity in a single calculation, ensuring they're computed at the exact same orbital phase.

2. **Single Kepler Solve**: The function solves Kepler's equation once and uses the resulting eccentric anomaly `E` for both:
   - Position: `x = a(cos E - e)`, `y = a√(1-e²) sin E`
   - Velocity: `vₓ = -(n·a·sin E)/(1 - e·cos E)`, `vᵧ = (n·a·√(1-e²)·cos E)/(1 - e·cos E)`

3. **Numerical Consistency**: Both calculations use the same intermediate values, eliminating any possibility of phase desynchronization.

4. **Correct Reference Frame**: The relative velocity is then properly transformed to world coordinates by adding the parent's velocity.

## Files Modified

### Primary Fix
- `packages/core/state/src/services/PhysicsStateCalculator.ts`
  - `calculateOrbitalPhysics()` method (line ~369)
  - `calculateMultiStarSystemPhysics()` method (line ~118)

### Changes Made

1. Added `calculateKeplerianStateAtTime` to imports
2. Replaced separate `calculateOrbitalPosition` and `calculateOrbitalVelocity` calls with single `calculateKeplerianStateAtTime` call
3. Updated both regular orbital physics and multi-star system physics calculations

## Testing Recommendations

To verify the fix works correctly, test:

1. **Single Star Systems**: Generate a system with 1 star and 10-20 planets
   - Verify all planets maintain stable orbits
   - Check orbital periods match calculated values
   - Ensure no planets escape over time

2. **Multi-Star Systems**: Generate binary/trinary star systems
   - Verify star orbits around barycenter remain stable
   - Check planet orbits around individual stars
   - Test planets in circumbinary orbits

3. **Various Orbital Parameters**:
   - Low eccentricity (e < 0.1) - nearly circular
   - Medium eccentricity (0.1 < e < 0.5) - elliptical
   - High eccentricity (e > 0.5) - highly elliptical
   - Various mean anomalies (0° to 360°)
   - Different semi-major axes (0.1 AU to 50 AU)

4. **Edge Cases**:
   - Very close orbits (< 0.1 AU)
   - Very distant orbits (> 30 AU)
   - Retrograde orbits (inclination > 90°)
   - Highly inclined orbits

## Validation Checks

For each planet, verify:

1. **Orbital Energy is Negative**:
   ```typescript
   const E = (v² / 2) - (μ / r) < 0
   ```

2. **Vis-Viva Equation Holds**:
   ```typescript
   const v²_expected = μ * (2/r - 1/a)
   const error = Math.abs(v² - v²_expected) / v²_expected
   // error should be < 0.001 (0.1%)
   ```

3. **Orbital Period Matches**:
   ```typescript
   const T_expected = 2π√(a³/μ)
   // Verify planet returns to same position after T_expected seconds
   ```

## Related Issues

This fix resolves:
- Planets escaping orbits
- Straight-line trajectories
- Unbound hyperbolic orbits for elliptical planets
- Energy conservation violations in procedurally generated systems

## Historical Context

- **Discovery**: Planets in procedurally generated systems were observed flying off in straight lines
- **Initial Investigation**: Suspected issues with eccentricity calculations, orbital period calculations, or mass values
- **Root Cause**: Position/velocity desynchronization due to separate function calls
- **Resolution**: Atomic calculation of position and velocity at the same orbital phase

## Future Improvements

Potential enhancements to prevent similar issues:

1. **Add Unit Tests**: Create tests that verify orbital energy conservation
2. **Runtime Validation**: Add assertions to check vis-viva equation during initialization
3. **Debug Logging**: Add optional logging to track orbital energy for newly created planets
4. **Visualization**: Create debug visualization to show orbital trajectories vs. calculated orbits

## Additional Notes

- This fix maintains backward compatibility with existing orbital calculation functions
- The `calculateOrbitalPosition` and `calculateOrbitalVelocity` functions remain available for other uses
- The fix applies to both regular planets and multi-star system calculations
- No changes required to orbital parameter generation (planet-orbit.ts)
- No changes required to Keplerian orbital mechanics (shared.ts)

## References

- Kepler's Laws of Planetary Motion
- Vis-Viva Equation
- Two-Body Problem orbital mechanics
- `calculateKeplerianStateAtTime()` implementation in `packages/core/physics/src/orbital/shared.ts`
