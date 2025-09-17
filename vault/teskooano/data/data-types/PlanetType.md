---
aliases: [PlanetType]
tags: [data, types, celestial, planets, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# PlanetType

Classification of planets based on composition and surface characteristics.

## Overview

The `PlanetType` enum defines the primary type of a planet based on its composition and surface characteristics. It provides a comprehensive classification system covering all major planetary types from barren worlds to ocean planets.

## Enum Definition

```typescript
export enum PlanetType {
  BARREN = "BARREN",
  ROCKY = "ROCKY",
  TERRESTRIAL = "TERRESTRIAL",
  DESERT = "DESERT",
  ICE = "ICE",
  LAVA = "LAVA",
  OCEAN = "OCEAN",
}
```

## Planet Types

### BARREN

```typescript
BARREN = "BARREN";
```

A very barren planet with lots of craters.

**Characteristics:**

- Heavily cratered surface
- No atmosphere or very thin atmosphere
- No geological activity
- Ancient surface features preserved

**Examples:**

- Mercury, Luna (Earth's Moon)
- Callisto, heavily cratered asteroids

**Surface Features:**

- Impact craters of various sizes
- Ray systems from recent impacts
- Regolith (loose surface material)
- No erosional features

### ROCKY

```typescript
ROCKY = "ROCKY";
```

Primarily composed of rock and metal, often cratered.

**Characteristics:**

- Silicate and metal composition
- Solid surface
- May have thin atmosphere
- Geological activity possible

**Examples:**

- Mars, Venus (beneath clouds)
- Many exoplanets

**Surface Features:**

- Rocky terrain
- Impact craters
- Possible volcanic features
- Tectonic activity

### TERRESTRIAL

```typescript
TERRESTRIAL = "TERRESTRIAL";
```

Earth-like planet with potential for liquid water and complex atmospheres.

**Characteristics:**

- Moderate temperature
- Substantial atmosphere
- Liquid water possible
- Active geology

**Examples:**

- Earth, potentially habitable exoplanets

**Surface Features:**

- Varied terrain (land, water, ice)
- Active weather systems
- Erosional features
- Biological activity possible

### DESERT

```typescript
DESERT = "DESERT";
```

Dry, arid surface, possibly with dunes.

**Characteristics:**

- Very dry conditions
- Sand and dust
- Extreme temperatures
- Wind erosion

**Examples:**

- Mars (partially), desert exoplanets

**Surface Features:**

- Sand dunes
- Wind-carved rocks
- Dust storms
- Minimal water

### ICE

```typescript
ICE = "ICE";
```

Surface predominantly covered by ice.

**Characteristics:**

- Frozen surface
- Water ice or exotic ices
- Cold temperatures
- Possible subsurface oceans

**Examples:**

- Europa, Enceladus, Pluto

**Surface Features:**

- Ice sheets
- Cryovolcanic features
- Fracture patterns
- Smooth or ridged terrain

### LAVA

```typescript
LAVA = "LAVA";
```

Surface dominated by molten lava flows.

**Characteristics:**

- Active volcanism
- High surface temperatures
- Molten rock flows
- Sulfurous atmosphere possible

**Examples:**

- Io, volcanic exoplanets

**Surface Features:**

- Lava flows
- Volcanic calderas
- Sulfur deposits
- Active eruptions

### OCEAN

```typescript
OCEAN = "OCEAN";
```

Surface predominantly covered by liquid oceans.

**Characteristics:**

- Global ocean coverage
- Liquid water or other fluids
- Possible subsurface continents
- Active hydrological cycle

**Examples:**

- Hypothetical ocean worlds
- Some exoplanets

**Surface Features:**

- Deep oceans
- Possible islands
- Ice caps at poles
- Storm systems

## Usage Examples

### Planet Type Selection

```typescript
import { PlanetType, PlanetProperties } from "@teskooano/data-types";

function createPlanetByType(type: PlanetType): Partial<PlanetProperties> {
  switch (type) {
    case PlanetType.TERRESTRIAL:
      return {
        classType: type,
        composition: ["silicates", "iron", "water"],
        atmosphere: {
          glowColor: "#87CEEB",
          intensity: 0.3,
          power: 2.0,
          thickness: 0.1,
        },
        clouds: {
          color: "#FFFFFF",
          opacity: 0.6,
          coverage: 0.5,
          speed: 0.1,
        },
      };

    case PlanetType.DESERT:
      return {
        classType: type,
        composition: ["silicates", "iron oxide", "dust"],
        atmosphere: {
          glowColor: "#CD853F",
          intensity: 0.1,
          power: 1.5,
          thickness: 0.05,
        },
      };

    case PlanetType.ICE:
      return {
        classType: type,
        composition: ["water ice", "ammonia ice", "rock"],
        atmosphere: {
          glowColor: "#E0FFFF",
          intensity: 0.05,
          power: 1.0,
          thickness: 0.02,
        },
      };

    case PlanetType.LAVA:
      return {
        classType: type,
        composition: ["basalt", "sulfur", "metals"],
        atmosphere: {
          glowColor: "#FF4500",
          intensity: 0.5,
          power: 3.0,
          thickness: 0.15,
        },
      };

    case PlanetType.OCEAN:
      return {
        classType: type,
        composition: ["water", "salts", "organics"],
        atmosphere: {
          glowColor: "#4169E1",
          intensity: 0.4,
          power: 2.5,
          thickness: 0.12,
        },
        clouds: {
          color: "#F0F8FF",
          opacity: 0.8,
          coverage: 0.7,
          speed: 0.15,
        },
      };

    case PlanetType.ROCKY:
      return {
        classType: type,
        composition: ["silicates", "metals", "minerals"],
        atmosphere: {
          glowColor: "#A0522D",
          intensity: 0.05,
          power: 1.2,
          thickness: 0.03,
        },
      };

    case PlanetType.BARREN:
    default:
      return {
        classType: type,
        composition: ["rock", "regolith", "metals"],
        // No atmosphere for barren worlds
      };
  }
}
```

### Habitability Assessment

```typescript
function assessHabitability(
  planetType: PlanetType,
  temperature: number,
): {
  score: number;
  factors: string[];
} {
  const factors: string[] = [];
  let score = 0;

  switch (planetType) {
    case PlanetType.TERRESTRIAL:
      score += 8;
      factors.push("Earth-like conditions");
      if (temperature >= 273 && temperature <= 373) {
        score += 2;
        factors.push("Liquid water temperature range");
      }
      break;

    case PlanetType.OCEAN:
      score += 7;
      factors.push("Global ocean coverage");
      if (temperature >= 273) {
        score += 1;
        factors.push("Liquid water present");
      }
      break;

    case PlanetType.ICE:
      score += 3;
      factors.push("Potential subsurface ocean");
      if (temperature >= 200) {
        score += 2;
        factors.push("Possible liquid layer");
      }
      break;

    case PlanetType.DESERT:
      score += 2;
      factors.push("Dry but stable surface");
      break;

    case PlanetType.ROCKY:
      score += 1;
      factors.push("Solid surface");
      break;

    case PlanetType.LAVA:
      score += 0;
      factors.push("Too hot for life");
      break;

    case PlanetType.BARREN:
      score += 0;
      factors.push("No atmosphere or protection");
      break;
  }

  return { score: Math.min(10, score), factors };
}
```

### Surface Color Palettes

```typescript
function getDefaultColorPalette(planetType: PlanetType): string[] {
  switch (planetType) {
    case PlanetType.TERRESTRIAL:
      return ["#4682B4", "#8B4513", "#228B22", "#DEB887", "#FFFFFF"]; // Ocean to snow

    case PlanetType.DESERT:
      return ["#8B4513", "#CD853F", "#D2691E", "#F4A460", "#FFF8DC"]; // Brown to tan

    case PlanetType.ICE:
      return ["#E0FFFF", "#B0E0E6", "#87CEEB", "#4682B4", "#FFFFFF"]; // Ice blues

    case PlanetType.LAVA:
      return ["#8B0000", "#DC143C", "#FF4500", "#FF6347", "#FFFF00"]; // Lava colors

    case PlanetType.OCEAN:
      return ["#000080", "#0000CD", "#4169E1", "#87CEEB", "#F0F8FF"]; // Ocean blues

    case PlanetType.ROCKY:
      return ["#696969", "#808080", "#A9A9A9", "#C0C0C0", "#D3D3D3"]; // Rock grays

    case PlanetType.BARREN:
      return ["#2F2F2F", "#404040", "#696969", "#808080", "#A9A9A9"]; // Barren grays

    default:
      return ["#808080", "#A0A0A0", "#C0C0C0", "#D0D0D0", "#E0E0E0"]; // Default grays
  }
}
```

## Integration

### Rendering System

- Determines surface shader selection
- Affects procedural generation parameters
- Controls atmospheric rendering
- Influences color palette selection

### Physics System

- Affects atmospheric modeling
- Influences thermal calculations
- Determines surface interaction properties

### Procedural Generation

- Guides surface feature generation
- Affects composition determination
- Influences atmospheric properties

## 🔗 Related

- [[PlanetProperties]] - Planet properties that use this enumeration
- [[CelestialObject]] - Base celestial object interface
- [[ProceduralSurfaceProperties]] - Surface generation parameters
- [[AtmosphereType]] - Atmospheric classification
- [[@teskooano/celestials-terrestrial]] - Planet rendering system
