# Planetary Ring Orientation Mechanics

This document describes the implementation of astronomically accurate ring orientation for any planet with rings and axial tilt, based on orbital mechanics and viewing geometry.

## Overview

A planet's ring orientation changes over its orbital period due to its axial tilt. For planets with significant axial tilt, rings will appear edge-on twice per orbital period at the equinoxes, when the planet's rotational axis is perpendicular to the star-planet line. The system works for any planet with rings and axial tilt, including Saturn, Uranus, Jupiter, and Neptune.

## Key Astronomical Facts Implemented

### Orbital Period and Equinoxes
- **Saturn's orbital period**: 29.4571 Julian years (where 1 Julian year = 365.25 days)
- **Ring edge-on viewing**: Occurs twice per Saturnian year at equinoxes
- **Unequal periods**: Due to orbital eccentricity (0.0565), the periods between equinoxes are:
  - **First period**: 13.7 years
  - **Second period**: 15.7 years
  - **Total**: 29.4 years (13.7 + 15.7)

### Viewing Perspective
- Earth's perspective approximates the Solar System barycenter view
- Saturn's mean orbital radius: 9.5826 AU
- Earth's distance from barycenter: ~1 AU
- Therefore, Earth sees similar ring orientations as would be seen from the barycenter

## Implementation Details

### Core Functions

#### `calculatePlanetRingOrientation()`
Calculates any planet's ring orientation quaternion based on:
- Planet's current orbital position
- Simulation time
- Star's position
- Planet's axial tilt and orbital parameters

**Algorithm:**
1. Calculate planet-to-star direction vector
2. Determine current position in orbital cycle
3. Account for orbital eccentricity (for unequal equinox periods)
4. Calculate apparent axial tilt angle using sinusoidal variation
5. Construct ring orientation quaternion

#### `shouldUseDynamicRingOrientation()`
Determines if a planet should use dynamic ring orientation:
- Checks for presence of ring system
- Verifies significant axial tilt (> ~3 degrees)
- Returns true only for planets that would benefit from dynamic orientation

#### `getPlanetRingViewingInfo()`
Provides detailed viewing information for any planet:
- Whether rings are currently near edge-on (within 5°)
- Current viewing angle in degrees
- Planet's axial tilt
- Orbital phase information

#### `getPlanetRingPhaseDescription()`
Returns human-readable descriptions of current ring viewing phase for any planet.

### Mathematical Approach

The ring orientation varies sinusoidally over Saturn's orbital period:

```
apparentAxialTilt = sin(equinoxPhase) × 26.73° × (π/180)
```

Where `equinoxPhase` accounts for the unequal period distribution:
- If time < 13.7 years: phase = time / 13.7 years
- If time >= 13.7 years: phase = (time - 13.7) / 15.7 years

### Integration with Ring Renderer

The implementation is integrated into the `RingSystemRenderer` class:

1. **Automatic Detection**: `shouldUseDynamicRingOrientation()` automatically detects planets that need dynamic orientation
2. **Initial Creation**: Ring meshes are created with appropriate orientation based on current orbital position
3. **Runtime Updates**: In the `update()` method, all qualifying planets have their rings dynamically reoriented:
   ```typescript
   if (shouldUseDynamicRingOrientation(object) && allObjects) {
     const starObject = allObjects["sol"] || allObjects["sun"];
     const orbitalPeriod = getOrbitalPeriod(object);
     const planetOrientation = calculatePlanetRingOrientation(
       object, time, starObject.position, orbitalPeriod
     );
     // Apply orientation to all ring meshes
     ringMeshes.forEach(mesh => mesh.quaternion.copy(orientation));
   }
   ```

## Astronomical Accuracy

### Edge-on Viewing Periods
The implementation correctly simulates the edge-on viewing periods where:
- Rings appear as thin lines (viewing angle < 5°)
- Occurs twice per 29.4571-year cycle
- Periods are unequally spaced due to orbital eccentricity

### Maximum Tilt
The maximum viewing angle matches Saturn's actual axial tilt of 26.73°, occurring at the orbital solstices.

### Real-world Correspondence
Recent edge-on viewing periods observed from Earth:
- 2009: Rings appeared edge-on
- Expected next: ~2025 (approximately 15.7 years later)
- Following: ~2039 (approximately 13.7 years after 2025)

## Usage Examples

### For Any Planet with Rings

```typescript
import { 
  calculatePlanetRingOrientation, 
  getPlanetRingViewingInfo,
  shouldUseDynamicRingOrientation
} from "@teskooano/celestials-rings";

// Check if planet should use dynamic ring orientation
if (shouldUseDynamicRingOrientation(planetObject)) {
  // Get current ring orientation
  const orientation = calculatePlanetRingOrientation(
    planetObject, 
    simulationTime, 
    starPosition
  );

  // Check viewing information
  const viewingInfo = getPlanetRingViewingInfo(planetObject, simulationTime);
  console.log(`${planetObject.name} rings:`);
  console.log(`Viewing angle: ${viewingInfo.viewingAngle.toFixed(1)}°`);
  console.log(`Edge-on viewing: ${viewingInfo.isNearEdgeOn ? 'Yes' : 'No'}`);
  console.log(`Axial tilt: ${viewingInfo.axialTiltDeg.toFixed(1)}°`);
}
```

### Planet-Specific Examples

```typescript
// Saturn (29.5 year orbit, 26.73° tilt)
const saturnInfo = getPlanetRingViewingInfo(saturn, simulationTime);

// Uranus (84 year orbit, 97.77° extreme tilt)
const uranusInfo = getPlanetRingViewingInfo(uranus, simulationTime);

// Jupiter (12 year orbit, 3.13° small tilt)
const jupiterInfo = getPlanetRingViewingInfo(jupiter, simulationTime);

// Neptune (165 year orbit, 28.32° tilt)
const neptuneInfo = getPlanetRingViewingInfo(neptune, simulationTime);
```

## Testing

The implementation includes comprehensive tests verifying:
- Quaternion validity and normalization
- Different orientations at different orbital positions
- Correct edge-on viewing period identification
- Proper handling of unequal equinox periods
- Astronomical accuracy (29.4571-year period, 26.73° max tilt)

## Technical Notes

### Coordinate System
- Default ring orientation: XY plane (Z-axis normal)
- Ring orientation quaternion transforms from default to actual orientation
- Uses OSQuaternion for renderer-agnostic calculations

### Performance Considerations
- Calculations are performed once per frame during updates
- Trigonometric calculations are minimized
- Quaternion operations use optimized OSQuaternion class

### Future Enhancements
- Account for Saturn's orbital inclination relative to ecliptic
- Include precession effects for very long simulations
- Add visualization indicators for edge-on periods

## References

- Wikipedia: "Rings of Saturn: Saturn's axial inclination"
- NASA JPL Saturn fact sheet
- Astronomical Almanac orbital elements
- Curtis, H.D. "Orbital Mechanics for Engineering Students"