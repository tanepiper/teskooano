---
aliases: [Scaling Constants]
tags: [data, values, scaling, rendering]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/scaling.ts"
status: active
---

# Scaling Constants

Constants used for converting between physics units and rendering units, and for managing the visual scaling of celestial objects.

## Overview

The scaling constants module provides the essential scaling factors and conversion constants needed to bridge the gap between real-world physics units (meters, kilograms, seconds) and the scaled units used in the Three.js rendering system. These constants ensure consistent scaling across the entire simulation.

## Core Scaling Object

### SCALE

```typescript
export const SCALE = {
  DISTANCE: 1.0,
  SIZE: 1.0,
  TIME: 1.0,
  MASS: 1.0e-20,
  RENDER_SCALE_AU: 1000,
  GAS_GIANT_SIZE: 1.0,
  STAR_SIZE: 1.0,
  MOON_DISTANCE: 50.0,
} as const;
```

Comprehensive scaling factors for the simulation.

#### DISTANCE

```typescript
DISTANCE: 1.0;
```

Factor for scaling distances between objects (orbital radii).

**Usage:**

- Orbital distance scaling
- Inter-object spacing
- System-wide distance adjustments

#### SIZE

```typescript
SIZE: 1.0;
```

Factor for scaling physical size of objects (radii).

**Usage:**

- Object radius scaling
- Visual size adjustments
- Collision detection scaling

#### TIME

```typescript
TIME: 1.0;
```

Factor for time adjustments if needed.

**Usage:**

- Time scaling for animations
- Physics timestep adjustments
- Temporal effect scaling

#### MASS

```typescript
MASS: 1.0e-20;
```

Factor for adjusting mass values to prevent numerical precision issues.

**Usage:**

- Mass scaling for numerical stability
- Physics calculation optimization
- Prevents floating-point overflow

#### RENDER_SCALE_AU

```typescript
RENDER_SCALE_AU: 1000;
```

Units in the Three.js scene per Astronomical Unit (AU).

**Usage:**

- Primary scaling factor for the rendering system
- Converts AU distances to scene units
- Determines overall scene scale

#### GAS_GIANT_SIZE

```typescript
GAS_GIANT_SIZE: 1.0;
```

Size multiplier for gas giants.

**Usage:**

- Gas giant visual scaling
- Atmospheric effect scaling
- Ring system scaling

#### STAR_SIZE

```typescript
STAR_SIZE: 1.0;
```

Size multiplier for stars.

**Usage:**

- Stellar visual scaling
- Corona effect scaling
- Light source sizing

#### MOON_DISTANCE

```typescript
MOON_DISTANCE: 50.0;
```

Distance multiplier for moons.

**Usage:**

- Moon orbital distance enhancement
- Visual separation of moons from planets
- Improved moon visibility

## Derived Constants

### METERS_TO_SCENE_UNITS

```typescript
export const METERS_TO_SCENE_UNITS = SCALE.RENDER_SCALE_AU / AU_METERS;
```

Conversion factor from meters to scene units.

**Description:**
Converts real-world distances in meters to the scaled units used in the Three.js rendering scene.

**Value:** ~6.684×10⁻⁹ (scene units per meter)
**Usage:** Direct conversion between physics and rendering coordinates

**Usage Examples:**

```typescript
// Convert real distance to scene units
const sceneDistance = realDistance * METERS_TO_SCENE_UNITS;

// Convert scene distance back to meters
const realDistance = sceneDistance / METERS_TO_SCENE_UNITS;

// Scale object position from physics
const renderPosition = physicsPosition.multiplyScalar(METERS_TO_SCENE_UNITS);
```

## Render Scale Constants

### DEFAULT_RENDER_SCALE_AU

```typescript
export const DEFAULT_RENDER_SCALE_AU = 1000;
```

The default number of scene units that represent one astronomical unit.

**Description:**
Provides a good balance between visual detail and performance for most viewing scenarios.

**Usage Examples:**

```typescript
// Set render scale for camera
camera.far = DEFAULT_RENDER_SCALE_AU * 10;

// Calculate scene bounds
const sceneBounds = DEFAULT_RENDER_SCALE_AU * 100;

// Initialize renderer with default scale
const renderer = new SpaceRenderer({ renderScale: DEFAULT_RENDER_SCALE_AU });
```

### MIN_RENDER_SCALE_AU

```typescript
export const MIN_RENDER_SCALE_AU = 100;
```

The minimum scale that still provides meaningful visual detail.

**Description:**
Used for performance optimization in distant views where fine detail is not necessary.

**Usage Examples:**

```typescript
// Apply minimum scale for distant objects
const adaptiveScale = Math.max(scale, MIN_RENDER_SCALE_AU);

// Performance optimization for distant viewing
if (cameraDistance > 1000) {
  renderScale = MIN_RENDER_SCALE_AU;
}
```

### MAX_RENDER_SCALE_AU

```typescript
export const MAX_RENDER_SCALE_AU = 10000;
```

The maximum scale that maintains reasonable performance.

**Description:**
Used for close-up views of celestial objects where maximum detail is desired.

**Usage Examples:**

```typescript
// Apply maximum scale for close objects
const adaptiveScale = Math.min(scale, MAX_RENDER_SCALE_AU);

// High-detail viewing mode
if (focusMode === "detailed") {
  renderScale = MAX_RENDER_SCALE_AU;
}
```

## Usage Examples

### Object Scaling

```typescript
import { SCALE, METERS_TO_SCENE_UNITS } from "@teskooano/data-values";

// Scale a planet for rendering
function scalePlanet(planet: CelestialObject): number {
  const baseRadius = planet.realRadius_m * METERS_TO_SCENE_UNITS;
  return baseRadius * SCALE.SIZE;
}

// Scale a gas giant with special multiplier
function scaleGasGiant(gasGiant: CelestialObject): number {
  const baseRadius = gasGiant.realRadius_m * METERS_TO_SCENE_UNITS;
  return baseRadius * SCALE.SIZE * SCALE.GAS_GIANT_SIZE;
}

// Scale a star with special multiplier
function scaleStar(star: CelestialObject): number {
  const baseRadius = star.realRadius_m * METERS_TO_SCENE_UNITS;
  return baseRadius * SCALE.SIZE * SCALE.STAR_SIZE;
}
```

### Distance Scaling

```typescript
// Scale orbital distance
function scaleOrbitDistance(
  distance_m: number,
  isMoon: boolean = false,
): number {
  const baseDistance = distance_m * METERS_TO_SCENE_UNITS;
  const moonMultiplier = isMoon ? SCALE.MOON_DISTANCE : 1.0;
  return baseDistance * SCALE.DISTANCE * moonMultiplier;
}

// Scale moon distance for better visibility
function scaleMoonDistance(moonDistance_m: number): number {
  return moonDistance_m * METERS_TO_SCENE_UNITS * SCALE.MOON_DISTANCE;
}
```

### Mass Scaling

```typescript
// Scale mass for numerical stability
function scaleMass(mass_kg: number): number {
  return mass_kg * SCALE.MASS;
}

// Calculate scaled gravitational parameter
function calculateScaledGravitationalParameter(mass_kg: number): number {
  const scaledMass = mass_kg * SCALE.MASS;
  const scaledG = GRAVITATIONAL_CONSTANT; // Adjust if needed
  return scaledG * scaledMass;
}
```

### Adaptive Scaling

```typescript
class AdaptiveScaler {
  private currentScale: number = DEFAULT_RENDER_SCALE_AU;

  updateScale(cameraDistance: number, targetDetail: number): number {
    // Calculate optimal scale based on camera distance
    const distanceScale = Math.sqrt(cameraDistance / 1000);
    const targetScale = DEFAULT_RENDER_SCALE_AU * distanceScale * targetDetail;

    // Clamp to valid range
    this.currentScale = Math.max(
      MIN_RENDER_SCALE_AU,
      Math.min(targetScale, MAX_RENDER_SCALE_AU),
    );

    return this.currentScale;
  }

  getObjectScale(objectType: CelestialType): number {
    let typeMultiplier = 1.0;

    switch (objectType) {
      case CelestialType.GAS_GIANT:
        typeMultiplier = SCALE.GAS_GIANT_SIZE;
        break;
      case CelestialType.STAR:
        typeMultiplier = SCALE.STAR_SIZE;
        break;
      default:
        typeMultiplier = 1.0;
    }

    return this.currentScale * SCALE.SIZE * typeMultiplier;
  }

  getDistanceScale(isMoon: boolean = false): number {
    const moonMultiplier = isMoon ? SCALE.MOON_DISTANCE : 1.0;
    return this.currentScale * SCALE.DISTANCE * moonMultiplier;
  }
}
```

### Scene Management

```typescript
class SceneScaleManager {
  private renderScale: number = DEFAULT_RENDER_SCALE_AU;

  setRenderScale(scale: number): void {
    this.renderScale = Math.max(
      MIN_RENDER_SCALE_AU,
      Math.min(scale, MAX_RENDER_SCALE_AU),
    );
  }

  convertPhysicsToScene(distance_m: number): number {
    return (
      (distance_m * METERS_TO_SCENE_UNITS * this.renderScale) /
      DEFAULT_RENDER_SCALE_AU
    );
  }

  convertSceneToPhysics(sceneDistance: number): number {
    return (
      sceneDistance /
      METERS_TO_SCENE_UNITS /
      (this.renderScale / DEFAULT_RENDER_SCALE_AU)
    );
  }

  getEffectiveScale(): number {
    return this.renderScale;
  }
}
```

## Integration

### Physics-Rendering Bridge

- Converts physics coordinates to rendering coordinates
- Maintains scale consistency across systems
- Enables adaptive scaling based on viewing distance

### Performance Optimization

- Moon distance multiplier improves visibility
- Adaptive scaling maintains performance
- Type-specific multipliers optimize different object types

### Visual Enhancement

- Size multipliers enhance important objects
- Distance scaling improves spatial relationships
- Render scale provides overall scene control

## Performance Considerations

### Numerical Stability

- Mass scaling prevents floating-point overflow
- Distance scaling maintains precision
- Time scaling enables stable integration

### Visual Quality

- Render scale balances detail and performance
- Type multipliers enhance key objects
- Adaptive scaling maintains quality at all distances

### Memory Usage

- Constant object is frozen for efficiency
- No runtime modifications
- Compile-time optimization possible

## 🔗 Related

- [[Astronomical Constants]] - Base values used in scaling calculations
- [[Physical Constants]] - Physics constants used with scaling
- [[Rendering Constants]] - Rendering-specific constants
- [[Unit Conversions]] - Conversion functions using these scales
- [[@teskooano/renderer-threejs]] - Rendering system using these scales
