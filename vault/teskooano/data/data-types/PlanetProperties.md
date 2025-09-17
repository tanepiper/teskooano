---
aliases: [PlanetProperties]
tags: [data, types, celestial, planets]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/properties.types.ts"
status: active
---

# PlanetProperties

Properties specific to planets and moons with surface, atmospheric, and ring system configuration.

## Overview

The `PlanetProperties` interface defines properties for planets, moons, and dwarf planets. It includes surface characteristics, atmospheric properties, cloud systems, ring configurations, and procedural surface generation parameters. The interface uses a generic type parameter for surface properties to support different planet types.

## Interface Definition

```typescript
export interface PlanetProperties<T = ProceduralSurfaceProperties>
  extends SpecificPropertiesBase {
  type: CelestialType.PLANET | CelestialType.MOON | CelestialType.DWARF_PLANET;
  classType?: PlanetType;
  isMoon: boolean;
  shapeModel?: "sphere" | "asteroid" | string;
  composition: string[];
  atmosphere?: PlanetAtmosphereProperties;
  clouds?: CloudProperties;
  surface?: T;
  ringSystem?: RingSystemConfiguration;
  rings?: RingProperties[];
}
```

## Core Properties

### Classification

#### type

```typescript
type: CelestialType.PLANET | CelestialType.MOON | CelestialType.DWARF_PLANET;
```

The fundamental type classification.

- **Values**: `PLANET`, `MOON`, `DWARF_PLANET`
- **Usage**: Determines rendering and physics behavior

#### classType

```typescript
classType?: PlanetType
```

The specific type classification of the planet.

- **Type**: `PlanetType`
- **Required**: No
- **Values**: `ROCKY`, `TERRESTRIAL`, `DESERT`, `ICE`, `LAVA`, `OCEAN`, `BARREN`
- **Usage**: Surface type determination and procedural generation

#### isMoon

```typescript
isMoon: boolean;
```

Indicates if this object orbits a planet rather than a star.

- **Type**: `boolean`
- **Required**: Yes
- **Usage**: Orbital mechanics and hierarchical organization

### Physical Properties

#### shapeModel

```typescript
shapeModel?: "sphere" | "asteroid" | string
```

Optional indicator for the desired 3D shape.

- **Type**: `string`
- **Required**: No
- **Default**: `"sphere"`
- **Values**: `"sphere"`, `"asteroid"`, custom model paths
- **Usage**: 3D model selection for rendering

#### composition

```typescript
composition: string[]
```

Array listing the primary chemical or geological composition.

- **Type**: `string[]`
- **Required**: Yes
- **Examples**: `["silicates", "iron"]`, `["water ice", "rock"]`
- **Usage**: Material properties and color determination

### Atmospheric Properties

#### atmosphere

```typescript
atmosphere?: PlanetAtmosphereProperties
```

Optional atmospheric properties.

```typescript
export interface PlanetAtmosphereProperties {
  glowColor: string;
  intensity: number;
  power: number;
  thickness: number;
  opacity?: number;
}
```

**Properties:**

- **glowColor**: The color of the atmospheric glow (hex string)
- **intensity**: The intensity of the glow (0.0 to 1.0)
- **power**: The power of the glow effect (0.0 to 1.0)
- **thickness**: The thickness of the atmosphere (0.0 to 1.0)
- **opacity**: The opacity of the atmosphere (0.0 to 1.0)

#### clouds

```typescript
clouds?: CloudProperties
```

Optional cloud layer properties.

```typescript
interface CloudProperties {
  color?: string;
  opacity?: number;
  coverage?: number;
  speed?: number;
}
```

**Properties:**

- **color**: The visual color of the clouds (hex string)
- **opacity**: Overall opacity of the cloud layer (0.0 to 1.0)
- **coverage**: Cloud coverage factor (0.0 = no clouds, 1.0 = full coverage)
- **speed**: Speed of cloud movement/animation

### Surface Properties

#### surface

```typescript
surface?: T
```

Optional surface characteristics, structure depends on the generic type parameter.

- **Type**: Generic `T` (defaults to `ProceduralSurfaceProperties`)
- **Required**: No
- **Usage**: Procedural surface generation and material properties

### Ring Systems

#### ringSystem

```typescript
ringSystem?: RingSystemConfiguration
```

Enhanced ring system configuration.

- **Type**: `RingSystemConfiguration`
- **Required**: No
- **Usage**: Modern ring system definition with advanced features

#### rings

```typescript
rings?: RingProperties[]
```

Legacy rings property for backward compatibility.

- **Type**: `RingProperties[]`
- **Required**: No
- **Usage**: Backward compatibility with older ring definitions

## Usage Examples

### Earth-like Terrestrial Planet

```typescript
const earthProperties: PlanetProperties = {
  type: CelestialType.PLANET,
  classType: PlanetType.TERRESTRIAL,
  isMoon: false,
  shapeModel: "sphere",
  composition: ["silicates", "iron", "water"],

  atmosphere: {
    glowColor: "#87CEEB",
    intensity: 0.3,
    power: 2.0,
    thickness: 0.1,
    opacity: 0.8,
  },

  clouds: {
    color: "#FFFFFF",
    opacity: 0.6,
    coverage: 0.5,
    speed: 0.1,
  },

  surface: {
    persistence: 0.5,
    lacunarity: 2.0,
    simplePeriod: 4.0,
    octaves: 6,
    bumpScale: 0.1,
    color1: "#4682B4", // Ocean blue
    color2: "#8B4513", // Saddle brown
    color3: "#228B22", // Forest green
    color4: "#DEB887", // Burlywood
    color5: "#FFFFFF", // Snow white
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 1.0,
    shininess: 0.1,
    specularStrength: 0.2,
    roughness: 0.8,
    ambientLightIntensity: 0.3,
    undulation: 0.1,
    terrainType: 1,
    terrainAmplitude: 0.2,
    terrainSharpness: 0.5,
    terrainOffset: 0.0,
  },
};
```

### Mars-like Desert Planet

```typescript
const marsProperties: PlanetProperties = {
  type: CelestialType.PLANET,
  classType: PlanetType.DESERT,
  isMoon: false,
  composition: ["iron oxide", "silicates", "basalt"],

  atmosphere: {
    glowColor: "#CD853F",
    intensity: 0.1,
    power: 1.5,
    thickness: 0.05,
    opacity: 0.3,
  },

  surface: {
    persistence: 0.6,
    lacunarity: 2.2,
    simplePeriod: 3.0,
    octaves: 5,
    bumpScale: 0.15,
    color1: "#8B4513", // Dark brown
    color2: "#CD853F", // Peru
    color3: "#D2691E", // Chocolate
    color4: "#F4A460", // Sandy brown
    color5: "#FFF8DC", // Cornsilk
    height1: 0.0,
    height2: 0.2,
    height3: 0.4,
    height4: 0.7,
    height5: 1.0,
    shininess: 0.05,
    specularStrength: 0.1,
    roughness: 0.9,
    ambientLightIntensity: 0.4,
    undulation: 0.2,
    terrainType: 2, // Sharp peaks
    terrainAmplitude: 0.3,
    terrainSharpness: 0.8,
    terrainOffset: 0.1,
  },
};
```

### Ice Moon (Europa-like)

```typescript
const iceMoonProperties: PlanetProperties = {
  type: CelestialType.MOON,
  classType: PlanetType.ICE,
  isMoon: true,
  composition: ["water ice", "silicates"],

  surface: {
    persistence: 0.4,
    lacunarity: 2.5,
    simplePeriod: 6.0,
    octaves: 4,
    bumpScale: 0.05,
    color1: "#E0FFFF", // Light cyan
    color2: "#B0E0E6", // Powder blue
    color3: "#87CEEB", // Sky blue
    color4: "#4682B4", // Steel blue
    color5: "#FFFFFF", // White
    height1: 0.0,
    height2: 0.3,
    height3: 0.6,
    height4: 0.8,
    height5: 1.0,
    shininess: 0.8,
    specularStrength: 0.9,
    roughness: 0.1,
    ambientLightIntensity: 0.2,
    undulation: 0.05,
    terrainType: 1, // Simple terrain
    terrainAmplitude: 0.1,
    terrainSharpness: 0.3,
    terrainOffset: 0.0,
  },
};
```

### Volcanic Planet

```typescript
const volcanoProperties: PlanetProperties = {
  type: CelestialType.PLANET,
  classType: PlanetType.LAVA,
  isMoon: false,
  composition: ["basalt", "sulfur", "silicates"],

  atmosphere: {
    glowColor: "#FF4500",
    intensity: 0.5,
    power: 3.0,
    thickness: 0.15,
    opacity: 0.7,
  },

  surface: {
    persistence: 0.7,
    lacunarity: 2.8,
    simplePeriod: 2.0,
    octaves: 7,
    bumpScale: 0.3,
    color1: "#8B0000", // Dark red
    color2: "#DC143C", // Crimson
    color3: "#FF4500", // Orange red
    color4: "#FF6347", // Tomato
    color5: "#FFFF00", // Yellow (hot lava)
    height1: 0.0,
    height2: 0.2,
    height3: 0.4,
    height4: 0.7,
    height5: 1.0,
    shininess: 0.3,
    specularStrength: 0.4,
    roughness: 0.7,
    ambientLightIntensity: 0.6,
    undulation: 0.3,
    terrainType: 3, // Sharp valleys
    terrainAmplitude: 0.4,
    terrainSharpness: 1.0,
    terrainOffset: 0.2,
  },
};
```

### Ocean World

```typescript
const oceanProperties: PlanetProperties = {
  type: CelestialType.PLANET,
  classType: PlanetType.OCEAN,
  isMoon: false,
  composition: ["water", "silicates", "organic compounds"],

  atmosphere: {
    glowColor: "#87CEEB",
    intensity: 0.4,
    power: 2.5,
    thickness: 0.12,
    opacity: 0.9,
  },

  clouds: {
    color: "#F0F8FF",
    opacity: 0.8,
    coverage: 0.7,
    speed: 0.15,
  },

  surface: {
    persistence: 0.3,
    lacunarity: 1.8,
    simplePeriod: 8.0,
    octaves: 3,
    bumpScale: 0.02,
    color1: "#000080", // Navy (deep ocean)
    color2: "#0000CD", // Medium blue
    color3: "#4169E1", // Royal blue
    color4: "#87CEEB", // Sky blue
    color5: "#F0F8FF", // Alice blue (shallow)
    height1: 0.0,
    height2: 0.4,
    height3: 0.6,
    height4: 0.8,
    height5: 1.0,
    shininess: 0.9,
    specularStrength: 1.0,
    roughness: 0.05,
    ambientLightIntensity: 0.25,
    undulation: 0.02,
    terrainType: 1,
    terrainAmplitude: 0.05,
    terrainSharpness: 0.2,
    terrainOffset: 0.0,
  },
};
```

### Planet with Ring System

```typescript
const ringedPlanetProperties: PlanetProperties = {
  type: CelestialType.PLANET,
  classType: PlanetType.TERRESTRIAL,
  isMoon: false,
  composition: ["silicates", "iron"],

  atmosphere: {
    glowColor: "#DDA0DD",
    intensity: 0.2,
    power: 1.8,
    thickness: 0.08,
    opacity: 0.5,
  },

  ringSystem: {
    systemAxialInclination: 0.4, // 23 degrees
    inheritParentTilt: true,
    precessionRate: 0.0001,
    unifiedRendering: true,
    rings: [
      {
        innerRadius: 1.2,
        outerRadius: 1.8,
        density: 0.7,
        opacity: 0.8,
        color: "#F5DEB3",
        rotationRate: 0.1,
        texture: "ring_ice_particles",
        composition: ["water ice", "rock fragments"],
        type: RockyType.ICE,
        segmentDensity: 60.0,
        segmentWidth: 0.9,
        particleDetail: 0.4,
        densityVariation: 0.3,
      },
      {
        innerRadius: 2.0,
        outerRadius: 2.5,
        density: 0.4,
        opacity: 0.5,
        color: "#D2B48C",
        rotationRate: 0.08,
        texture: "ring_dust_particles",
        composition: ["dust", "ice"],
        type: RockyType.ICE_DUST,
        segmentDensity: 40.0,
        segmentWidth: 0.7,
        particleDetail: 0.2,
        densityVariation: 0.5,
      },
    ],
  },
};
```

## Procedural Surface Properties

The `ProceduralSurfaceProperties` interface defines parameters for procedural surface generation:

```typescript
export interface ProceduralSurfaceProperties {
  persistence: number; // Noise amplitude decrease (0-1)
  lacunarity: number; // Frequency increase (typically > 1)
  simplePeriod: number; // Base frequency
  octaves: number; // Number of noise layers
  bumpScale: number; // Normal map intensity
  color1: string; // Lowest elevation color
  color2: string; // Second color gradient
  color3: string; // Third color gradient
  color4: string; // Fourth color gradient
  color5: string; // Highest elevation color
  height1: number; // First height threshold
  height2: number; // Second height threshold
  height3: number; // Third height threshold
  height4: number; // Fourth height threshold
  height5: number; // Fifth height threshold
  shininess: number; // Surface shininess (0-1)
  specularStrength: number; // Specular highlight intensity
  roughness: number; // Surface roughness (0-1)
  ambientLightIntensity: number; // Ambient lighting
  undulation: number; // Surface waviness
  terrainType: number; // Terrain algorithm (1-3)
  terrainAmplitude: number; // Height scale
  terrainSharpness: number; // Feature sharpness
  terrainOffset: number; // Base height offset
}
```

## Integration

### Rendering System

- `classType` determines surface shader selection
- `surface` properties configure procedural generation
- `atmosphere` and `clouds` enable atmospheric effects
- `ringSystem` configures ring rendering

### Physics System

- `composition` affects density calculations
- `isMoon` determines orbital mechanics
- Ring systems affect gravitational dynamics

### Procedural Generation

- Surface properties drive terrain generation
- Color gradients create realistic surface variation
- Noise parameters control detail levels

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[PlanetType]] - Planet classification enumeration
- [[RingSystemConfiguration]] - Ring system configuration
- [[RingProperties]] - Individual ring properties
- [[ProceduralSurfaceProperties]] - Surface generation parameters
- [[PlanetAtmosphereProperties]] - Atmospheric properties
- [[@teskooano/celestials-terrestrial]] - Planet rendering system
