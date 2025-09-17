---
aliases: [RockyType]
tags: [data, types, celestial, composition, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# RockyType

Describes the primary composition type of rocky bodies like asteroids or ring particles.

## Overview

The `RockyType` enum provides a classification system for the composition of rocky and icy bodies including asteroids, ring particles, and small celestial objects. It determines material properties, visual appearance, and physical behavior.

## Enum Definition

```typescript
export enum RockyType {
  ICE = "ICE",
  METALLIC = "METALLIC",
  LIGHT_ROCK = "LIGHT_ROCK",
  DARK_ROCK = "DARK_ROCK",
  ICE_DUST = "ICE_DUST",
  DUST = "DUST",
}
```

## Rocky Types

### ICE

```typescript
ICE = "ICE";
```

Composed primarily of ice (water, methane, ammonia).

**Characteristics:**

- **Composition**: Water ice, methane ice, ammonia ice
- **Appearance**: White to light blue
- **Density**: 0.9-1.0 g/cm³
- **Reflectivity**: High albedo (0.6-0.9)
- **Temperature**: Cold, sublimation at low temperatures

**Examples:**

- Outer solar system objects
- Saturn's rings
- Kuiper Belt objects
- Cometary nuclei

**Visual Properties:**

- Bright, reflective surfaces
- Blue-white coloration
- High specular reflection
- Smooth or crystalline textures

### METALLIC

```typescript
METALLIC = "METALLIC";
```

Rich in metallic elements.

**Characteristics:**

- **Composition**: Iron, nickel, platinum group metals
- **Appearance**: Dark gray to silver
- **Density**: 7.0-8.0 g/cm³
- **Reflectivity**: Moderate to high (0.1-0.3)
- **Magnetic**: Often magnetic due to iron content

**Examples:**

- M-type asteroids
- Core fragments from differentiated bodies
- Metallic meteorites

**Visual Properties:**

- Metallic luster
- Gray to silver coloration
- High specular reflection
- Smooth, polished appearance

### LIGHT_ROCK

```typescript
LIGHT_ROCK = "LIGHT_ROCK";
```

Composed of lighter silicate rocks.

**Characteristics:**

- **Composition**: Silicate minerals, feldspars, pyroxenes
- **Appearance**: Gray to tan
- **Density**: 2.5-3.5 g/cm³
- **Reflectivity**: Moderate albedo (0.1-0.2)
- **Weathering**: Space weathering darkens surface

**Examples:**

- S-type asteroids
- Ordinary chondrites
- Differentiated crust material

**Visual Properties:**

- Medium gray coloration
- Moderate reflectivity
- Rocky texture
- Weathered appearance

### DARK_ROCK

```typescript
DARK_ROCK = "DARK_ROCK";
```

Composed of darker silicate rocks, possibly carbonaceous.

**Characteristics:**

- **Composition**: Carbon-rich silicates, organics, hydrated minerals
- **Appearance**: Very dark gray to black
- **Density**: 1.5-2.5 g/cm³
- **Reflectivity**: Very low albedo (0.03-0.08)
- **Organics**: May contain organic compounds

**Examples:**

- C-type asteroids
- Carbonaceous chondrites
- Primitive solar system material
- Outer asteroid belt objects

**Visual Properties:**

- Very dark coloration
- Low reflectivity
- Rough, porous texture
- Organic-rich appearance

### ICE_DUST

```typescript
ICE_DUST = "ICE_DUST";
```

Mixture of fine ice particles and dust.

**Characteristics:**

- **Composition**: Ice particles mixed with silicate dust
- **Appearance**: Light gray to white
- **Density**: 0.5-1.5 g/cm³
- **Reflectivity**: Moderate albedo (0.2-0.4)
- **Texture**: Fine-grained, dusty

**Examples:**

- Outer ring systems
- Cometary debris
- Kuiper Belt dust
- Scattered disk objects

**Visual Properties:**

- Dusty white to gray
- Moderate reflectivity
- Fine particle texture
- Slightly sparkly appearance

### DUST

```typescript
DUST = "DUST";
```

Composed primarily of fine dust particles.

**Characteristics:**

- **Composition**: Fine silicate and organic dust
- **Appearance**: Brown to gray
- **Density**: 1.0-2.0 g/cm³
- **Reflectivity**: Low to moderate albedo (0.05-0.15)
- **Size**: Microscopic to millimeter particles

**Examples:**

- Zodiacal dust
- Ring system dust
- Interplanetary dust
- Debris from impacts

**Visual Properties:**

- Brown to gray coloration
- Diffuse appearance
- Low reflectivity
- Hazy, particle-like texture

## Usage Examples

### Ring System Composition

```typescript
function createRingByComposition(
  rockyType: RockyType,
): Partial<RingProperties> {
  switch (rockyType) {
    case RockyType.ICE:
      return {
        color: "#F5F5DC",
        opacity: 0.8,
        density: 0.9,
        composition: ["water ice", "ammonia ice"],
        texture: "ice_particles",
      };

    case RockyType.METALLIC:
      return {
        color: "#C0C0C0",
        opacity: 0.6,
        density: 0.7,
        composition: ["iron", "nickel"],
        texture: "metallic_particles",
      };

    case RockyType.LIGHT_ROCK:
      return {
        color: "#D2B48C",
        opacity: 0.7,
        density: 0.8,
        composition: ["silicates", "olivine"],
        texture: "light_rock_particles",
      };

    case RockyType.DARK_ROCK:
      return {
        color: "#2F4F4F",
        opacity: 0.5,
        density: 0.6,
        composition: ["carbonaceous material", "organics"],
        texture: "dark_rock_particles",
      };

    case RockyType.ICE_DUST:
      return {
        color: "#E6E6FA",
        opacity: 0.4,
        density: 0.4,
        composition: ["ice particles", "dust"],
        texture: "ice_dust_particles",
      };

    case RockyType.DUST:
      return {
        color: "#CD853F",
        opacity: 0.3,
        density: 0.2,
        composition: ["silicate dust", "organic dust"],
        texture: "dust_particles",
      };
  }
}
```

### Asteroid Classification

```typescript
function createAsteroidByType(
  rockyType: RockyType,
): Partial<AsteroidProperties> {
  switch (rockyType) {
    case RockyType.ICE:
      return {
        colors: ["#E0FFFF", "#B0E0E6", "#87CEEB", "#FFFFFF"],
        heights: [0.0, 0.3, 0.6, 1.0],
        composition: "water ice",
        density: 0.9,
        temperature: 0.1,
      };

    case RockyType.METALLIC:
      return {
        colors: ["#696969", "#808080", "#A9A9A9", "#C0C0C0"],
        heights: [0.0, 0.3, 0.6, 1.0],
        composition: "iron-nickel",
        density: 1.0,
        temperature: 0.3,
      };

    case RockyType.LIGHT_ROCK:
      return {
        colors: ["#8B7355", "#A0522D", "#D2B48C", "#F5DEB3"],
        heights: [0.0, 0.3, 0.6, 1.0],
        composition: "silicate",
        density: 0.7,
        temperature: 0.5,
      };

    case RockyType.DARK_ROCK:
      return {
        colors: ["#2F2F2F", "#404040", "#555555", "#696969"],
        heights: [0.0, 0.3, 0.6, 1.0],
        composition: "carbonaceous",
        density: 0.5,
        temperature: 0.2,
      };
  }
}
```

### Material Properties

```typescript
function getRockyMaterialProperties(rockyType: RockyType): {
  metalness: number;
  roughness: number;
  specularColor: string;
  emissive: boolean;
} {
  switch (rockyType) {
    case RockyType.ICE:
      return {
        metalness: 0.0,
        roughness: 0.1,
        specularColor: "#FFFFFF",
        emissive: false,
      };

    case RockyType.METALLIC:
      return {
        metalness: 0.9,
        roughness: 0.2,
        specularColor: "#C0C0C0",
        emissive: false,
      };

    case RockyType.LIGHT_ROCK:
      return {
        metalness: 0.1,
        roughness: 0.8,
        specularColor: "#D2B48C",
        emissive: false,
      };

    case RockyType.DARK_ROCK:
      return {
        metalness: 0.0,
        roughness: 0.9,
        specularColor: "#404040",
        emissive: false,
      };

    case RockyType.ICE_DUST:
      return {
        metalness: 0.0,
        roughness: 0.6,
        specularColor: "#E6E6FA",
        emissive: false,
      };

    case RockyType.DUST:
      return {
        metalness: 0.0,
        roughness: 1.0,
        specularColor: "#8B7355",
        emissive: false,
      };
  }
}
```

### Density and Physics

```typescript
function getPhysicalProperties(rockyType: RockyType): {
  density_gcm3: number;
  albedo: number;
  thermalInertia: number;
} {
  switch (rockyType) {
    case RockyType.ICE:
      return {
        density_gcm3: 0.9,
        albedo: 0.7,
        thermalInertia: 50,
      };

    case RockyType.METALLIC:
      return {
        density_gcm3: 7.5,
        albedo: 0.2,
        thermalInertia: 2000,
      };

    case RockyType.LIGHT_ROCK:
      return {
        density_gcm3: 3.0,
        albedo: 0.15,
        thermalInertia: 300,
      };

    case RockyType.DARK_ROCK:
      return {
        density_gcm3: 2.0,
        albedo: 0.05,
        thermalInertia: 100,
      };

    case RockyType.ICE_DUST:
      return {
        density_gcm3: 1.2,
        albedo: 0.3,
        thermalInertia: 75,
      };

    case RockyType.DUST:
      return {
        density_gcm3: 1.5,
        albedo: 0.1,
        thermalInertia: 25,
      };
  }
}
```

## Integration

### Ring Systems

- Determines ring particle appearance
- Affects ring dynamics and behavior
- Controls material properties
- Influences optical properties

### Asteroid Systems

- Determines asteroid classification
- Affects procedural generation
- Controls visual appearance
- Influences physical properties

### Material System

- Maps to PBR material properties
- Determines shader parameters
- Controls reflection and scattering
- Affects thermal properties

## 🔗 Related

- [[RingProperties]] - Ring properties that use this enumeration
- [[AsteroidProperties]] - Asteroid properties that use this enumeration
- [[@teskooano/celestials-rings]] - Ring rendering system
- [[@teskooano/celestials-asteroid]] - Asteroid rendering system
