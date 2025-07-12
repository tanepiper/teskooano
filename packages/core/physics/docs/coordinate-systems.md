# Coordinate Systems and Orbital Mechanics

The physics package uses specific coordinate system conventions that are crucial for understanding orbital calculations and ensuring consistency across all components.

## Primary Coordinate System

**System Type:** Y-up Right-handed Coordinate System

### Axis Definitions

- **Y-axis:** Points "up" (positive Y is the reference up direction)
- **X-axis:** Points "right" when viewed from positive Y
- **Z-axis:** Points "forward" (completing right-handed system)
- **XZ-plane:** Contains orbital motion (orbits occur in the XZ plane)

### Orbital Motion Convention

- **Orbital Direction:** Counter-clockwise when viewed from positive Y axis
- **Standard Motion:** Prograde (normal orbital direction)
- **Viewing Perspective:** Looking down from +Y axis, orbits appear counter-clockwise

```
     +Y (up)
      |
      |
      |
+Z ---|--- -Z
     /|
    / |
   /  |
+X    -X

Orbital motion in XZ plane: Counter-clockwise from +Y view
```

## Orbital Coordinate Mapping

### 2D to 3D Conversion

For orbital calculations, 2D orbital coordinates are mapped to 3D space:

```typescript
// 2D orbital calculation (in orbital plane)
const x_orbital = a * (Math.cos(E) - e);
const y_orbital = a * Math.sqrt(1 - e * e) * Math.sin(E);

// 3D mapping to Y-up coordinate system
const position_3d = new OSVector3(x_orbital, 0, -y_orbital);
//                                    ^     ^     ^
//                                    |     |     |
//                               X-axis  Y=0  Negated for correct direction
```

**Key Point:** The Y component in the 2D orbital calculation is negated when mapped to the Z component in 3D space. This ensures counter-clockwise motion when viewed from the positive Y axis.

### Why Negate Z?

Without negation (`OSVector3(x, 0, y)`), orbits would appear clockwise from +Y view, which is retrograde motion. By using (`OSVector3(x, 0, -y)`), we ensure:

1. **Prograde Motion:** Objects orbit counter-clockwise (normal direction)
2. **Physical Accuracy:** Matches real-world orbital mechanics
3. **Consistency:** Same behavior across all orbital calculations

## Time Evolution

### Correct Time Evolution Formula

Both `kepler.ts` and `orbital.ts` use the proper time evolution:

```typescript
// CORRECT: Addition for prograde motion
const currentMeanAnomaly = meanAnomaly + meanMotion * time;

// INCORRECT: Subtraction causes retrograde motion
// const currentMeanAnomaly = meanAnomaly - meanMotion * time;
```

**Mean Motion Direction:**

- **Positive meanMotion:** Prograde (counter-clockwise) orbit
- **Negative meanMotion:** Retrograde (clockwise) orbit - rare in solar system

### Orbital Elements and Rotations

The physics package applies orbital rotations in a specific order to ensure consistency:

```typescript
// Rotation order: Argument of Periapsis → Inclination → Longitude of Ascending Node
const q_argP = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  argumentOfPeriapsis,
);
const q_incl = new OSQuaternion().setFromAxisAngle(
  new OSVector3(1, 0, 0),
  inclination,
);
const q_longAscNode = new OSQuaternion().setFromAxisAngle(
  new OSVector3(0, 1, 0),
  longitudeOfAscendingNode,
);

const finalRotation = new OSQuaternion()
  .multiply(q_longAscNode)
  .multiply(q_incl)
  .multiply(q_argP);
```

**Rotation Axes:**

- **Argument of Periapsis:** Y-axis (within orbital plane)
- **Inclination:** X-axis (tilts orbital plane)
- **Longitude of Ascending Node:** Y-axis (rotates orbital plane)

## Coordinate System Synchronization

### Kepler.ts and Orbital.ts Consistency

Both orbital calculation systems use identical coordinate mappings:

**File: `orbital/kepler.ts`**

```typescript
// Position in orbital plane
const x = a * (Math.cos(E) - e);
const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
const position = new OSVector3(x, 0, -y); // Note: -y for Z

// Velocity in orbital plane
const vx = term * -Math.sin(E);
const vy = term * Math.sqrt(1 - e * e) * Math.cos(E);
const velocity = new OSVector3(vx, 0, -vy); // Note: -vy for Z
```

**File: `orbital/orbital.ts`**

```typescript
// Identical mapping ensures consistency
const x = a * (Math.cos(E) - e);
const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
const position = new OSVector3(x, 0, -y); // Same mapping

// Velocity calculation also uses same pattern
const velocity = new OSVector3(vx, 0, -vy);
```

## Practical Examples

### Earth's Orbit

For Earth orbiting the Sun with standard parameters:

```typescript
// At t=0 (periapsis)
const position_t0 = new OSVector3(
  1.471e11, // X: Close to Sun (periapsis distance)
  0, // Y: In orbital plane
  0, // Z: Starting position
);

// At t=T/4 (quarter orbit)
const position_t_quarter = new OSVector3(
  0, // X: Crossing through center
  0, // Y: Still in orbital plane
  1.496e11, // Z: Positive Z (90° counter-clockwise from +Y view)
);
```

### Verification of Correct Motion

To verify counter-clockwise motion:

1. **Start Position:** (periapsis distance, 0, 0)
2. **Quarter Orbit:** (0, 0, positive distance)
3. **Half Orbit:** (negative distance, 0, 0) - apoapsis
4. **Three Quarters:** (0, 0, negative distance)
5. **Full Orbit:** Back to start

This sequence represents counter-clockwise motion when viewed from +Y.

## Common Pitfalls

### Wrong Time Evolution

```typescript
// WRONG: Creates retrograde motion
const meanAnomaly = initialMeanAnomaly - meanMotion * time;

// CORRECT: Creates prograde motion
const meanAnomaly = initialMeanAnomaly + meanMotion * time;
```

### Wrong Coordinate Mapping

```typescript
// WRONG: Creates clockwise motion from +Y view
const position = new OSVector3(x, 0, y);

// CORRECT: Creates counter-clockwise motion from +Y view
const position = new OSVector3(x, 0, -y);
```

### Inconsistent Rotation Order

```typescript
// WRONG: Different rotation order
const rotation = q_incl.multiply(q_longAscNode).multiply(q_argP);

// CORRECT: Standard order
const rotation = q_longAscNode.multiply(q_incl).multiply(q_argP);
```

## Integration with Other Systems

### Renderer Compatibility

The coordinate system is designed to work with THREE.js:

```typescript
// OSVector3 → THREE.Vector3 conversion
const threeVector = new THREE.Vector3(osVector.x, osVector.y, osVector.z);

// Coordinate system matches THREE.js Y-up convention
camera.position.set(0, 1000, 0); // Looking down at XZ orbital plane
```

### Camera System

For orbital viewing:

```typescript
// Standard orbital view (looking down from above)
camera.position.set(0, distance, 0);
camera.lookAt(0, 0, 0);

// Orbits appear counter-clockwise in this view
// Matches real astronomical conventions
```

### Physics State Consistency

All `PhysicsStateReal` objects use the same coordinate system:

```typescript
interface PhysicsStateReal {
  position_m: OSVector3; // Position in Y-up coordinates
  velocity_mps: OSVector3; // Velocity in Y-up coordinates
  // ... other properties
}
```

## Validation and Testing

### Coordinate System Tests

The test suites verify correct coordinate behavior:

```typescript
// Test counter-clockwise motion
it("should orbit counter-clockwise when viewed from +Y", () => {
  const initialPos = calculatePosition(0); // (r, 0, 0)
  const quarterPos = calculatePosition(period / 4); // (0, 0, r)
  const halfPos = calculatePosition(period / 2); // (-r, 0, 0)

  // Verify counter-clockwise progression
  expect(quarterPos.z).toBeGreaterThan(0);
  expect(halfPos.x).toBeLessThan(0);
});
```

### Energy Conservation Tests

Symplectic integrators should conserve energy in the coordinate system:

```typescript
it("should conserve energy over full orbit", () => {
  const initialEnergy = calculateEnergy(initialState);
  // ... run full orbit simulation
  const finalEnergy = calculateEnergy(finalState);

  expect(finalEnergy).toBeCloseTo(initialEnergy, 6);
});
```

## Summary

The Y-up coordinate system with XZ orbital planes provides:

1. **Consistency:** All calculations use the same conventions
2. **Physical Accuracy:** Counter-clockwise motion matches reality
3. **Integration:** Works seamlessly with THREE.js and camera systems
4. **Predictability:** Clear, documented behavior for all orbital mechanics

**Critical Rules:**

- Always use `OSVector3(x, 0, -y)` for orbital → 3D mapping
- Always use `meanAnomaly + meanMotion * time` for time evolution
- Always apply rotations in order: argP → inclination → longAscNode
- Test orbital direction to ensure counter-clockwise motion from +Y view
