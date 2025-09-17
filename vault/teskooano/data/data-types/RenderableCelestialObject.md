---
aliases: [RenderableCelestialObject]
tags: [data, types, celestial, rendering]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/rendering.types.ts"
status: active
---

# RenderableCelestialObject

Renderer-ready celestial object that extends the core `CelestialObject` with renderer-specific properties and transformations.

## Overview

The `RenderableCelestialObject` interface defines the structure of a celestial object once it has been processed and is ready for use by the rendering engine. It extends the core `CelestialObject` with scaled properties, rendering state, and shader integration data.

## Interface Definition

```typescript
export interface RenderableCelestialObject<T = CelestialSpecificPropertiesUnion>
  extends CelestialObject<T> {
  radius: number;
  mass: number;
  position: THREE.Vector3;
  velocity?: THREE.Vector3;
  velocityMagnitude_mps?: number;
  rotation: THREE.Quaternion;
  physicsStateReal: PhysicsStateReal;
  primaryLightSourceId?: string;
  isVisible?: boolean;
  isTargetable?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;
  uniforms: { [key: string]: any };
  axialTilt?: OSVector3 | number;
}
```

## Inherited Properties

The interface inherits all properties from `CelestialObject`:

- **Core Properties**: `id`, `type`, `name`, `status`
- **Physical Properties**: `realRadius_m`, `realMass_kg`, `temperature`, `albedo`
- **Orbital Data**: `orbit`, `parentId`, `lagrangePointTargetId`
- **Configuration**: `properties`, `atmosphere`, `seed`
- **Simulation Control**: `ignorePhysics`, `ignoreCollisions`

## Renderer-Specific Properties

### Scaled Properties

#### radius

```typescript
radius: number;
```

The scaled radius of the object in renderer units.

- **Type**: `number`
- **Required**: Yes
- **Units**: Renderer units (computed from `realRadius_m`)
- **Usage**: 3D geometry creation and LOD calculations

#### mass

```typescript
mass: number;
```

The mass of the object in kilograms (alias for `realMass_kg`).

- **Type**: `number`
- **Required**: Yes
- **Units**: Kilograms
- **Usage**: Convenience alias for physics calculations

### Spatial Properties

#### position

```typescript
position: THREE.Vector3;
```

The 3D position of the object in the renderer's coordinate system.

- **Type**: `THREE.Vector3`
- **Required**: Yes
- **Units**: Renderer units
- **Usage**: Object positioning in 3D scene

#### velocity

```typescript
velocity?: THREE.Vector3
```

The 3D velocity of the object in the renderer's coordinate system.

- **Type**: `THREE.Vector3`
- **Required**: No
- **Units**: Scaled units per second
- **Usage**: Animation and trajectory visualization

#### velocityMagnitude_mps

```typescript
velocityMagnitude_mps?: number
```

The magnitude of the object's velocity in real units for display purposes.

- **Type**: `number`
- **Required**: No
- **Units**: Meters per second
- **Usage**: UI display and information panels

#### rotation

```typescript
rotation: THREE.Quaternion;
```

The rotational orientation of the object.

- **Type**: `THREE.Quaternion`
- **Required**: Yes
- **Usage**: Object orientation and axial rotation

### Physics Integration

#### physicsStateReal

```typescript
physicsStateReal: PhysicsStateReal;
```

Contains the object's state used by the physics engine in real units.

- **Type**: `PhysicsStateReal`
- **Required**: Yes
- **Usage**: Bridge between physics and rendering systems

### Lighting

#### primaryLightSourceId

```typescript
primaryLightSourceId?: string
```

The ID of the primary light source illuminating this object.

- **Type**: `string`
- **Required**: No
- **Usage**: Lighting calculations and shadow casting

### Interaction State

#### isVisible

```typescript
isVisible?: boolean
```

Whether the object should be rendered.

- **Type**: `boolean`
- **Required**: No
- **Default**: `true`
- **Usage**: Visibility control in rendering pipeline

#### isTargetable

```typescript
isTargetable?: boolean
```

Whether the user can select or interact with this object.

- **Type**: `boolean`
- **Required**: No
- **Default**: `true`
- **Usage**: User interaction and selection system

#### isSelected

```typescript
isSelected?: boolean
```

Whether the object is currently selected by the user.

- **Type**: `boolean`
- **Required**: No
- **Default**: `false`
- **Usage**: UI state and visual highlighting

#### isFocused

```typescript
isFocused?: boolean
```

Whether the camera is currently focused on this object.

- **Type**: `boolean`
- **Required**: No
- **Default**: `false`
- **Usage**: Camera control and UI state

### Shader Integration

#### uniforms

```typescript
uniforms: { [key: string]: any }
```

A collection of values intended to be passed as uniforms to shaders.

- **Type**: Record of key-value pairs
- **Required**: Yes
- **Usage**: Dynamic shader parameter control

### Orientation

#### axialTilt

```typescript
axialTilt?: OSVector3 | number
```

The axial tilt of the object (copied from `orbit.axialTilt` for convenience).

- **Type**: `OSVector3` or `number`
- **Required**: No
- **Usage**: Rotational axis calculations and visual effects

## Usage Examples

### Converting CelestialObject to RenderableCelestialObject

```typescript
import {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import * as THREE from "three";

function createRenderableObject(
  celestialObject: CelestialObject,
  renderScale: number,
): RenderableCelestialObject {
  return {
    ...celestialObject, // Inherit all base properties

    // Scaled properties
    radius: celestialObject.realRadius_m * renderScale,
    mass: celestialObject.realMass_kg,

    // Spatial properties
    position: new THREE.Vector3(0, 0, 0), // Will be updated from physics
    velocity: new THREE.Vector3(0, 0, 0),
    velocityMagnitude_mps: 0,
    rotation: new THREE.Quaternion(),

    // Physics integration
    physicsStateReal: {
      id: celestialObject.id,
      mass_kg: celestialObject.realMass_kg,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },

    // Interaction state
    isVisible: celestialObject.isVisible ?? true,
    isTargetable: true,
    isSelected: false,
    isFocused: false,

    // Shader uniforms
    uniforms: {
      time: 0,
      lightIntensity: 1.0,
      // Type-specific uniforms based on celestial type
    },

    // Orientation
    axialTilt: celestialObject.orbit.axialTilt,
  };
}
```

### Star with Shader Uniforms

```typescript
const renderableSun: RenderableCelestialObject<StarProperties> = {
  id: "sun-001",
  type: CelestialType.STAR,
  name: "Sun",
  status: CelestialStatus.ACTIVE,

  // Real properties
  realRadius_m: 696340000,
  realMass_kg: 1.989e30,
  temperature: 5778,

  // Scaled properties
  radius: 1.0, // Scaled to renderer units
  mass: 1.989e30,

  // Spatial properties
  position: new THREE.Vector3(0, 0, 0),
  rotation: new THREE.Quaternion(),

  // Physics state
  physicsStateReal: {
    id: "sun-001",
    mass_kg: 1.989e30,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  },

  // Orbital parameters
  orbit: {
    realSemiMajorAxis_m: 0,
    eccentricity: 0,
    // ... other orbital parameters
  },

  // Star-specific properties
  properties: {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: "G2V",
    luminosity: 1.0,
    color: "#FFD700",
    stellarType: StellarType.MAIN_SEQUENCE,
  },

  // Interaction state
  isVisible: true,
  isTargetable: true,
  isSelected: false,
  isFocused: true,

  // Shader uniforms for star rendering
  uniforms: {
    uTime: 0.0,
    uStarColor: new THREE.Color("#FFD700"),
    uHotColor: new THREE.Color("#FFA500"),
    uSurfaceColor: new THREE.Color("#FFD700"),
    uCoolColor: new THREE.Color("#FF8C00"),
    uNoiseScale: 1.0,
    uNoiseIntensity: 0.2,
    uPlasmaTurbulence: 0.1,
    uLightingIntensity: 1.0,
  },
};
```

### Planet with Atmospheric Effects

```typescript
const renderableEarth: RenderableCelestialObject<PlanetProperties> = {
  id: "earth-001",
  type: CelestialType.PLANET,
  name: "Earth",
  status: CelestialStatus.ACTIVE,

  // Real properties
  realRadius_m: 6371000,
  realMass_kg: 5.972e24,
  temperature: 288,
  albedo: 0.306,

  // Scaled properties
  radius: 0.1, // Scaled to renderer units
  mass: 5.972e24,

  // Spatial properties
  position: new THREE.Vector3(10, 0, 0), // 1 AU from sun
  velocity: new THREE.Vector3(0, 0, 2.98e4), // Orbital velocity
  velocityMagnitude_mps: 29780,
  rotation: new THREE.Quaternion(),

  // Physics state
  physicsStateReal: {
    id: "earth-001",
    mass_kg: 5.972e24,
    position_m: new OSVector3(1.496e11, 0, 0),
    velocity_mps: new OSVector3(0, 0, 29780),
  },

  // Orbital parameters
  orbit: {
    realSemiMajorAxis_m: 1.496e11,
    eccentricity: 0.0167,
    period_s: 31557600,
    // ... other orbital parameters
  },

  // Atmospheric properties
  atmosphere: {
    glowColor: "#87CEEB",
    intensity: 0.3,
    power: 2.0,
    thickness: 0.1,
    opacity: 0.8,
  },

  // Planet-specific properties
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.TERRESTRIAL,
    isMoon: false,
    composition: ["silicates", "iron", "water"],
    clouds: {
      color: "#FFFFFF",
      opacity: 0.6,
      coverage: 0.5,
      speed: 0.1,
    },
  },

  // Hierarchy
  parentId: "sun-001",
  primaryLightSourceId: "sun-001",

  // Interaction state
  isVisible: true,
  isTargetable: true,
  isSelected: true,
  isFocused: false,

  // Shader uniforms for planet rendering
  uniforms: {
    uTime: 0.0,
    uPlanetRadius: 6371000,
    uAtmosphereColor: new THREE.Color("#87CEEB"),
    uAtmosphereIntensity: 0.3,
    uCloudOpacity: 0.6,
    uCloudSpeed: 0.1,
    uSurfaceColor1: new THREE.Color("#8B4513"),
    uSurfaceColor2: new THREE.Color("#228B22"),
    uSurfaceColor3: new THREE.Color("#4682B4"),
    uOceanColor: new THREE.Color("#006994"),
  },

  // Axial tilt
  axialTilt: new OSVector3(0, 0, 0.4091), // 23.44 degrees
};
```

## State Management

### Position Updates

```typescript
function updateRenderablePosition(
  renderable: RenderableCelestialObject,
  physicsState: PhysicsStateReal,
  renderScale: number,
): void {
  // Update scaled position from physics state
  renderable.position.set(
    physicsState.position_m.x * renderScale,
    physicsState.position_m.y * renderScale,
    physicsState.position_m.z * renderScale,
  );

  // Update velocity
  if (renderable.velocity) {
    renderable.velocity.set(
      physicsState.velocity_mps.x * renderScale,
      physicsState.velocity_mps.y * renderScale,
      physicsState.velocity_mps.z * renderScale,
    );
  }

  // Update velocity magnitude for display
  renderable.velocityMagnitude_mps = physicsState.velocity_mps.magnitude();

  // Update physics state reference
  renderable.physicsStateReal = physicsState;
}
```

### Uniform Updates

```typescript
function updateShaderUniforms(
  renderable: RenderableCelestialObject,
  time: number,
  deltaTime: number,
): void {
  // Update time-based uniforms
  if (renderable.uniforms.uTime !== undefined) {
    renderable.uniforms.uTime = time;
  }

  // Update position-based uniforms
  if (renderable.uniforms.uPosition !== undefined) {
    renderable.uniforms.uPosition = renderable.position;
  }

  // Update rotation-based uniforms
  if (renderable.uniforms.uRotation !== undefined) {
    renderable.uniforms.uRotation = renderable.rotation;
  }

  // Update type-specific uniforms
  switch (renderable.type) {
    case CelestialType.STAR:
      updateStarUniforms(renderable, time);
      break;
    case CelestialType.PLANET:
      updatePlanetUniforms(renderable, time);
      break;
    // ... other types
  }
}
```

## Performance Considerations

### Memory Usage

- Three.js objects (Vector3, Quaternion) have memory overhead
- Uniform collections can grow large with complex shaders
- Consider object pooling for frequently updated objects

### Update Frequency

- Position updates should match physics simulation frequency
- Uniform updates can be throttled based on visibility
- Interaction state updates are event-driven

### Rendering Pipeline

- Visibility culling uses `isVisible` flag
- Selection highlighting uses `isSelected` and `isFocused` flags
- LOD calculations use `radius` and camera distance

## Integration Points

### Physics System

- `physicsStateReal` provides real-world physics state
- Position and velocity are synchronized from physics
- Mass is used for gravitational calculations

### Rendering System

- Scaled properties are used for 3D geometry
- Uniforms are passed to shader materials
- Interaction flags control rendering behavior

### UI System

- Selection state drives UI updates
- Velocity magnitude is displayed in information panels
- Focus state controls camera behavior

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[PhysicsStateReal]] - Real-world physics state
- [[CelestialType]] - Enumeration of celestial object types
- [[StarProperties]] - Star-specific properties
- [[PlanetProperties]] - Planet-specific properties
- [[TrailQuality]] - Quality levels for trajectory rendering
- [[@teskooano/core-state]] - State management system
- [[@teskooano/core-physics]] - Physics simulation system
- [[@teskooano/renderer-threejs]] - 3D rendering system
