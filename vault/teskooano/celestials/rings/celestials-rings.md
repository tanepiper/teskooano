---
aliases: [celestials-rings]
tags: [renderer, threejs, rings]
type: index
package: "@teskooano/celestials-rings"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/core-debug",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-celestial",
    "three",
  ]
classes: ["RingSystemRenderer", "RingMaterial", "AccretionDiskMaterial"]
status: active
---

# Celestials: Rings

A comprehensive ring system renderer for planetary rings and accretion disks, featuring enhanced axial inclination controls, LOD optimization, and physics-based accretion disk rendering.

## Features

### Visual Components

- **Enhanced Axial Inclination Control**: Individual rings can have their own tilt and axial inclination
- **Parent Tilt Inheritance**: Rings can inherit the axial tilt of their parent body
- **Precession Support**: Ring systems can precess over time
- **Accretion Disk Support**: Specialized rendering for accretion disks around compact objects
- **LOD System**: 3-tier LOD system with high detail, medium detail, and low detail levels
- **Dynamic Lighting**: Real-time lighting and shadow casting from multiple sources
- **Ring Segmentation**: Configurable ring segmentation and density variations

### Rendering Architecture

- **Unified Ring Configuration**: Supports both new `ringSystem` config and legacy `rings` property
- **Material System**: Custom shader materials with dynamic light/shadow support
- **Shadow Casting**: Rings cast shadows on their parent body and receive shadows from moons
- **Performance Optimization**: LOD switching and efficient shader management
- **Physics Integration**: Realistic accretion disk physics with temperature-based emission

## Package Structure

```
src/
├── renderer.ts                    # RingSystemRenderer main class
├── material.ts                    # RingMaterial and AccretionDiskMaterial
├── utils.ts                       # Physics utilities and calculations
├── shaders/                       # GLSL shader files
│   ├── ring.vertex.glsl          # Ring vertex shader with axial controls
│   ├── ring.fragment.glsl        # Ring fragment shader with segmentation
│   └── accretion-disk.fragment.glsl # Accretion disk fragment shader
└── index.ts                       # Package exports
```

## Usage

```typescript
import { RingSystemRenderer } from "@teskooano/celestials-rings";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create ring system renderer
const ringRenderer = new RingSystemRenderer(celestialObject, parentRenderer);

// Initialize with LOD levels
ringRenderer.initialize(celestialObject, {
  segments: 64,
  detailLevel: "high",
});

// Get LOD levels for integration
const lodLevels = ringRenderer.getLODLevels(celestialObject);

// Update with dynamic lighting
ringRenderer.update(
  celestialObject,
  time,
  timeScale,
  lightSources,
  camera,
  allObjects,
);
```

## Technical Details

### Ring System Configuration

The system supports both new unified configuration and legacy properties:

#### New Ring System Configuration

```typescript
interface RingSystemConfiguration {
  rings: RingProperties[];
  systemAxialInclination?: number; // Overall system tilt (radians)
  inheritParentTilt?: boolean; // System-wide parent tilt inheritance
  precessionRate?: number; // Precession rate (radians/second)
  unifiedRendering?: boolean; // Render as unified system
}
```

#### Ring Properties

```typescript
interface RingProperties {
  innerRadius: number;
  outerRadius: number;
  density: number;
  opacity: number;
  color: string;
  rotationRate: number;
  texture: string;
  composition: string[];
  type: RockyType;

  // Enhanced Axial Inclination Control
  axialInclination?: number; // Ring system axial inclination (radians)
  ringTilt?: number; // Individual ring tilt (radians)
  inheritParentTilt?: boolean; // Whether to inherit parent's axial tilt

  // Accretion Disk Properties
  isAccretionDisk?: boolean;
  temperature?: number;
  accretionRate?: number;
  emissionType?: "thermal" | "synchrotron" | "mixed";
  isRelativistic?: boolean;
  innerEdgeRadius?: number;
}
```

### LOD System

The renderer uses a 3-tier LOD system for optimal performance:

| LOD Level         | Distance    | Segments | Use Case         |
| ----------------- | ----------- | -------- | ---------------- |
| **High Detail**   | 0           | 64       | Close inspection |
| **Medium Detail** | 10 × radius | 32       | Normal viewing   |
| **Low Detail**    | 30 × radius | 16       | Far away         |

### Performance Considerations

- **Dynamic Light Arrays**: Efficiently handles variable numbers of light sources
- **Shadow Casting**: Real-time shadow calculations with penumbra effects
- **Material Caching**: Reuses materials across LOD levels
- **LOD Optimization**: Automatic detail reduction at distance
- **Memory Management**: Proper cleanup of materials and geometries

### Physics Integration

- **Keplerian Rotation**: Rings rotate according to Kepler's laws
- **Accretion Disk Physics**: Temperature-based emission and relativistic effects
- **Shadow Casting**: Rings cast shadows on parent body and receive shadows from moons
- **Dynamic Lighting**: Real-time lighting calculations with multiple sources

## Classes

### Core Classes

- [[celestials/rings/RingSystemRenderer|Ring System Renderer]] - Main renderer class for ring systems
- [[celestials/rings/RingMaterials|Ring Materials]] - Shader material for standard planetary rings
- [[celestials/rings/RingMaterials|Accretion Disk Material]] - Specialized material for accretion disks

## Shaders

### Ring Shaders

- [[celestials/rings/ring.vertex.glsl|Ring Vertex Shader]] - Vertex shader with enhanced axial inclination controls
- [[celestials/rings/ring.fragment.glsl|Ring Fragment Shader]] - Fragment shader with ring segmentation and density variations

### Accretion Disk Shaders

- [[celestials/rings/accretion-disk.fragment.glsl|Accretion Disk Fragment Shader]] - Fragment shader for physics-based accretion disk rendering

## Utilities

- [[celestials/rings/utils.ts|Ring Utilities]] - Physics utilities including Keplerian calculations and accretion disk properties

## Usage Examples

### Basic Ring System

```typescript
const ringSystem: RingSystemConfiguration = {
  rings: [
    {
      innerRadius: 1.2,
      outerRadius: 1.8,
      density: 0.8,
      opacity: 0.7,
      color: "#eeddaa",
      rotationRate: 0.01,
      texture: "ring_texture",
      composition: ["ice", "rock"],
      type: RockyType.ICE,
      axialInclination: 0.1, // 5.7 degrees
      ringTilt: 0.02, // 1.1 degrees
      inheritParentTilt: true,
    },
  ],
  systemAxialInclination: 0.05, // 2.9 degrees
  inheritParentTilt: true,
  precessionRate: 0.0001, // Slow precession
};
```

### Saturn-like Ring System

```typescript
const saturnRings: RingSystemConfiguration = {
  rings: [
    // D Ring (innermost)
    {
      innerRadius: 1.11,
      outerRadius: 1.235,
      density: 0.3,
      opacity: 0.4,
      color: "#d4af37",
      rotationRate: 0.015,
      texture: "saturn_d_ring",
      composition: ["ice", "dust"],
      type: RockyType.ICE,
      inheritParentTilt: true,
    },
    // C Ring (Crepe Ring)
    {
      innerRadius: 1.235,
      outerRadius: 1.525,
      density: 0.6,
      opacity: 0.5,
      color: "#b8860b",
      rotationRate: 0.012,
      texture: "saturn_c_ring",
      composition: ["ice", "rock"],
      type: RockyType.ICE,
      inheritParentTilt: true,
    },
    // B Ring (brightest)
    {
      innerRadius: 1.525,
      outerRadius: 1.95,
      density: 0.9,
      opacity: 0.8,
      color: "#ffd700",
      rotationRate: 0.01,
      texture: "saturn_b_ring",
      composition: ["ice", "water"],
      type: RockyType.ICE,
      inheritParentTilt: true,
    },
    // A Ring (outermost)
    {
      innerRadius: 2.025,
      outerRadius: 2.27,
      density: 0.7,
      opacity: 0.6,
      color: "#f0e68c",
      rotationRate: 0.008,
      texture: "saturn_a_ring",
      composition: ["ice", "rock"],
      type: RockyType.ICE,
      inheritParentTilt: true,
    },
  ],
  systemAxialInclination: 0.466, // 26.7 degrees (Saturn's actual tilt)
  inheritParentTilt: true,
  precessionRate: 0.00005, // Very slow precession
};
```

### Accretion Disk

```typescript
const accretionDisk: RingSystemConfiguration = {
  rings: [
    {
      innerRadius: 3.0,
      outerRadius: 50.0,
      density: 1.0,
      opacity: 0.9,
      color: "#ffffff",
      rotationRate: 0.02,
      texture: "accretion_disk",
      composition: ["plasma", "gas"],
      type: RockyType.GAS,
      isAccretionDisk: true,
      temperature: 10000, // 10,000 K
      accretionRate: 1e-8, // 10^-8 solar masses/year
      emissionType: "thermal",
      isRelativistic: true,
      innerEdgeRadius: 3.0, // 3 gravitational radii
      inheritParentTilt: false, // Accretion disks have their own orientation
    },
  ],
  systemAxialInclination: 0.3, // 17.2 degrees
  inheritParentTilt: false,
  precessionRate: 0.001, // Faster precession for accretion disks
};
```

## Axial Inclination Physics

### Saturn's Ring System Example

Saturn's rings demonstrate the importance of axial inclination control:

- **Axial Tilt**: 26.7° relative to its orbital plane
- **Ring Plane Crossings**: Earth passes through Saturn's ring plane every 13-15 years
- **Seasonal Changes**: Ring visibility varies dramatically based on Saturn's orbital position
- **Equinox Events**: During equinoxes, rings appear edge-on from Earth's perspective

### Implementation Details

1. **Parent Tilt Inheritance**: Rings inherit the parent body's axial tilt by default
2. **Individual Ring Tilt**: Each ring can have its own tilt relative to the system plane
3. **System Axial Inclination**: Overall tilt of the entire ring system
4. **Precession**: Ring systems can precess over time, changing their orientation

### Shader Implementation

The ring vertex shader applies transformations in this order:

1. Ring rotation (spinning in its own plane)
2. Individual ring tilt
3. Ring system axial inclination
4. Parent axial tilt inheritance
5. Precession effects

## Integration with Celestial Objects

### Planet Properties

```typescript
const planetProperties: PlanetProperties = {
  type: CelestialType.PLANET,
  classType: PlanetType.GAS_GIANT,
  // ... other properties

  // Enhanced ring system configuration
  ringSystem: saturnRings,

  // Legacy rings property (for backward compatibility)
  rings: saturnRings.rings,
};
```

### Gas Giant Properties

```typescript
const gasGiantProperties: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.JOVIAN,
  // ... other properties

  // Enhanced ring system configuration
  ringSystem: saturnRings,

  // Legacy properties (for backward compatibility)
  ringTilt: { x: 0, y: 0.466, z: 0 }, // 26.7 degrees around Y-axis
  axialTiltDeg: 26.7,
};
```

## Dependencies

- `@teskooano/core-debug` - Debug utilities and logging
- `@teskooano/data-types` - Core data structures and ring properties
- `@teskooano/renderer-threejs-celestial` - Base rendering framework
- `three` - Three.js 3D library

## 🔗 Related

- Composes with [[celestials/gas-giants/BaseGasGiantRenderer|Base Gas Giant Renderer]] for gas giant ring systems
- Composes with [[celestials/terrestrial/BaseTerrestrialRenderer|Base Terrestrial Renderer]] for terrestrial ring systems
- Uses [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] for core functionality
- Integrates with [[renderer/threejs-lighting/LightingManager|Lighting Manager]] for dynamic lighting
- Works with [[renderer/threejs-objects/threejs-objects|Three.js Objects]] factory system
