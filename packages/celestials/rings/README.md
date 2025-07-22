# Ring System Package

This package provides a comprehensive ring system implementation for celestial objects with enhanced axial inclination controls.

## Features

- **Enhanced Axial Inclination Control**: Individual rings can have their own tilt and axial inclination
- **Parent Tilt Inheritance**: Rings can inherit the axial tilt of their parent body
- **Precession Support**: Ring systems can precess over time
- **Accretion Disk Support**: Specialized rendering for accretion disks around compact objects
- **LOD System**: Level-of-detail rendering for performance optimization
- **Dynamic Lighting**: Real-time lighting and shadow casting

## Architecture

### Core Components

1. **RingSystemRenderer**: Main renderer class that handles ring system visualization
2. **RingMaterial**: Shader material for standard planetary rings
3. **AccretionDiskMaterial**: Specialized material for accretion disks
4. **RingSystemConfiguration**: Enhanced configuration interface

### Data Structures

#### RingProperties

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

#### RingSystemConfiguration

```typescript
interface RingSystemConfiguration {
  rings: RingProperties[];
  systemAxialInclination?: number; // Overall system tilt (radians)
  inheritParentTilt?: boolean; // System-wide parent tilt inheritance
  precessionRate?: number; // Precession rate (radians/second)
  unifiedRendering?: boolean; // Render as unified system
}
```

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

## Performance Considerations

- **LOD System**: Rings switch to lower detail levels at distance
- **Material Caching**: Ring materials are cached and reused
- **Shadow Casting**: Rings cast shadows on their parent body
- **Dynamic Lighting**: Real-time calculation of lighting from multiple sources

## Future Enhancements

- **Ring Particle Systems**: Individual particle rendering for high detail
- **Ring Dynamics**: Physical simulation of ring particle interactions
- **Ring Formation**: Procedural generation of ring systems
- **Ring Evolution**: Time-based changes in ring structure and composition
