# Parent Reassignment System

## Overview

The parent reassignment system addresses a critical bug in the Teskooano N-Body simulation where planets and other celestial objects would become "orphaned" when their parent star was destroyed, causing them to lose proper gravitational relationships and potentially destabilizing the simulation.

## The Problem

When a star is destroyed in a collision or other event:

1. The star is marked as `DESTROYED` or `ANNIHILATED`
2. Planets orbiting that star retain their `parentId` pointing to the destroyed star
3. These orphaned planets no longer have a proper gravitational parent
4. This can cause simulation instability and unrealistic behavior

## The Solution

The parent reassignment system automatically:

1. **Detects** when stars are destroyed during physics simulation steps
2. **Identifies** all objects that become orphaned (have the destroyed star as their parent)
3. **Finds** the nearest remaining active star for each orphaned object
4. **Reassigns** the `parentId` to maintain proper gravitational relationships

## Implementation

### Core Components

#### `parent-reassignment.ts`

- `calculateDistance()`: Calculates 3D distance between celestial objects
- `findNearestStar()`: Locates the closest active star to an orphaned object
- `reassignOrphanedObjects()`: Main function that handles the reassignment process

#### `PhysicsSystemAdapter.ts`

- `handleParentReassignment()`: Integrates reassignment into the physics update cycle
- Called automatically after destruction events are processed
- Ensures orphaned objects get new parents before the next simulation step

### Process Flow

1. **Physics Simulation Step**: Objects collide, stars may be destroyed
2. **Update Physics States**: Apply new positions, velocities, masses
3. **Handle Destruction Events**: Mark destroyed objects, handle cascading effects
4. **Parent Reassignment**:
   - Identify destroyed stars
   - Find orphaned objects
   - Calculate distances to remaining stars
   - Reassign to nearest star
5. **Apply Final State**: Save updated object map to game state

### Example Scenario

```
Initial State:
- Star A (position: 0, 0, 0)
- Star B (position: 1 AU, 0, 0)
- Planet 1 (parent: Star A, position: 0.5 AU, 0, 0)
- Planet 2 (parent: Star A, position: 1.2 AU, 0, 0)

Star A is destroyed in collision:

After Reassignment:
- Star B (position: 1 AU, 0, 0)
- Planet 1 (parent: Star B, position: 0.5 AU, 0, 0) // Reassigned
- Planet 2 (parent: Star B, position: 1.2 AU, 0, 0) // Reassigned
```

## Benefits

1. **Simulation Stability**: Prevents orphaned objects from causing physics issues
2. **Realistic Behavior**: Objects continue to participate in gravitational interactions
3. **Automatic**: No manual intervention required, happens seamlessly during simulation
4. **Hierarchical**: Child objects (like moons) inherit their parent's new star relationship

## Logging

The system provides detailed console logging:

- When stars are destroyed and reassignment begins
- Distance calculations and nearest star selection
- Successful reassignments with old/new parent information
- Warnings when no suitable stars are available

## Edge Cases Handled

- **No remaining stars**: Objects remain orphaned with warning logged
- **Multiple destroyed stars**: All orphaned objects are processed
- **Already destroyed objects**: Skipped during reassignment
- **Star-to-star relationships**: Binary star systems are not reassigned
- **Cascading effects**: Ring systems and moons follow their parent's reassignment

## Future Enhancements

- **Orbital parameter adjustment**: Recalculate orbits based on new parent star
- **Velocity corrections**: Adjust velocities for new gravitational environment
- **Mass-based selection**: Prefer more massive stars for reassignment
- **Distance thresholds**: Only reassign if within reasonable gravitational influence
