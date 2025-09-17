---
aliases: [GasGiantClass]
tags: [data, types, celestial, gas-giants, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# GasGiantClass

Classification system for gas giants based on atmospheric properties using the Sudarsky classification scheme.

## Overview

The `GasGiantClass` enum provides a scientific classification system for gas giant planets based on their atmospheric composition and temperature. This classification follows the Sudarsky scheme which categorizes gas giants into five classes based on their atmospheric properties and thermal characteristics.

## Enum Definition

```typescript
export enum GasGiantClass {
  CLASS_I = "CLASS_I",
  CLASS_II = "CLASS_II",
  CLASS_III = "CLASS_III",
  CLASS_IV = "CLASS_IV",
  CLASS_V = "CLASS_V",
}
```

## Gas Giant Classes

### CLASS_I

```typescript
CLASS_I = "CLASS_I";
```

Ammonia clouds, typical of Jupiter.

**Characteristics:**

- **Temperature Range**: 150-250K
- **Atmospheric Features**: Ammonia clouds in upper atmosphere
- **Appearance**: Tan/brown coloration with banded structure
- **Examples**: Jupiter, cold gas giants

**Atmospheric Composition:**

- Hydrogen and helium dominant
- Ammonia clouds at visible levels
- Water clouds at deeper levels
- Methane in trace amounts

### CLASS_II

```typescript
CLASS_II = "CLASS_II";
```

Water clouds, typical of Saturn.

**Characteristics:**

- **Temperature Range**: 250-350K
- **Atmospheric Features**: Water clouds dominate visible atmosphere
- **Appearance**: White/cream coloration
- **Examples**: Saturn, warm gas giants

**Atmospheric Composition:**

- Hydrogen and helium dominant
- Water clouds at visible levels
- Ammonia clouds at higher altitudes
- More uniform appearance than Class I

### CLASS_III

```typescript
CLASS_III = "CLASS_III";
```

Ice Giant - Cloudless, clear hydrogen atmosphere, typical of Uranus and Neptune.

**Characteristics:**

- **Temperature Range**: 350-800K
- **Atmospheric Features**: Clear atmosphere, no significant cloud layers
- **Appearance**: Blue coloration from methane absorption
- **Examples**: Uranus, Neptune, hot Neptunes

**Atmospheric Composition:**

- Hydrogen, helium, water, methane, ammonia
- Methane provides blue coloration
- Water and ammonia ices in interior
- Clear stratosphere

### CLASS_IV

```typescript
CLASS_IV = "CLASS_IV";
```

Alkali metal clouds, very hot.

**Characteristics:**

- **Temperature Range**: 800-1400K
- **Atmospheric Features**: Alkali metal clouds (sodium, potassium)
- **Appearance**: Orange/red coloration
- **Examples**: Hot Jupiters close to their stars

**Atmospheric Composition:**

- Hydrogen and helium
- Sodium and potassium clouds
- Silicate clouds at deeper levels
- Strong thermal emission

### CLASS_V

```typescript
CLASS_V = "CLASS_V";
```

Silicate clouds, even hotter.

**Characteristics:**

- **Temperature Range**: 1400K+
- **Atmospheric Features**: Silicate vapor clouds
- **Appearance**: Bright emission, yellow/white hot
- **Examples**: Ultra-hot Jupiters, very close-in planets

**Atmospheric Composition:**

- Hydrogen and helium
- Silicate vapor (rock vapor)
- Iron vapor possible
- Extreme thermal emission

## Usage Examples

### Jupiter-like Planet (Class I)

```typescript
const jupiterClass: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_I,
  atmosphereColor: "#D8CA9D", // Tan/brown
  cloudColor: "#FAD5A5", // Light tan
  cloudSpeed: 0.5,
  atmosphere: {
    composition: ["hydrogen", "helium", "ammonia", "methane"],
    pressure: 1000.0,
    type: AtmosphereType.VERY_DENSE,
  },
  stormColor: "#8B4513", // Saddle brown for storms
  stormSpeed: 0.8,
  emissiveIntensity: 0.1, // Moderate internal heat
};
```

### Saturn-like Planet (Class II)

```typescript
const saturnClass: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_II,
  atmosphereColor: "#FAD5A5", // Cream/white
  cloudColor: "#F5DEB3", // Wheat
  cloudSpeed: 0.7,
  atmosphere: {
    composition: ["hydrogen", "helium", "water vapor", "ammonia"],
    pressure: 950.0,
    type: AtmosphereType.VERY_DENSE,
  },
  stormColor: "#DEB887", // Burlywood for storms
  stormSpeed: 1.2,
  emissiveIntensity: 0.05, // Lower internal heat
};
```

### Ice Giant (Class III)

```typescript
const neptuneClass: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_III,
  atmosphereColor: "#4169E1", // Royal blue
  cloudColor: "#87CEEB", // Sky blue
  cloudSpeed: 2.0, // Very fast winds
  atmosphere: {
    composition: ["hydrogen", "helium", "water", "methane", "ammonia"],
    pressure: 1200.0,
    type: AtmosphereType.VERY_DENSE,
  },
  stormColor: "#191970", // Midnight blue
  stormSpeed: 3.0, // Extreme winds
  emissiveIntensity: 0.02, // Minimal internal heat
};
```

### Hot Jupiter (Class IV)

```typescript
const hotJupiterClass: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_IV,
  atmosphereColor: "#FF6347", // Tomato red
  cloudColor: "#FF4500", // Orange red
  cloudSpeed: 1.5,
  atmosphere: {
    composition: ["hydrogen", "helium", "sodium", "potassium"],
    pressure: 800.0,
    type: AtmosphereType.DENSE,
  },
  stormColor: "#DC143C", // Crimson
  stormSpeed: 2.5,
  emissiveIntensity: 0.3, // High internal heat from tidal heating
};
```

### Ultra-Hot Jupiter (Class V)

```typescript
const ultraHotJupiterClass: GasGiantProperties = {
  type: CelestialType.GAS_GIANT,
  classType: GasGiantClass.CLASS_V,
  atmosphereColor: "#FF0000", // Bright red
  cloudColor: "#FF6600", // Orange
  cloudSpeed: 3.0,
  atmosphere: {
    composition: ["hydrogen", "helium", "silicate vapor", "iron vapor"],
    pressure: 500.0,
    type: AtmosphereType.DENSE,
  },
  stormColor: "#8B0000", // Dark red
  stormSpeed: 4.0,
  emissiveIntensity: 0.8, // Very high thermal emission
};
```

## Integration

### Rendering System

- Determines atmospheric shader selection
- Controls cloud layer rendering
- Affects emission and thermal properties
- Influences storm system visualization

### Atmospheric Modeling

- Guides atmospheric composition
- Determines pressure and density profiles
- Affects thermal structure
- Controls cloud formation altitude

### Physics System

- Influences atmospheric escape rates
- Affects tidal heating calculations
- Determines atmospheric scale height

## Temperature-Based Classification

### Automatic Classification

```typescript
function classifyGasGiant(temperature: number): GasGiantClass {
  if (temperature < 250) {
    return GasGiantClass.CLASS_I; // Ammonia clouds
  } else if (temperature < 350) {
    return GasGiantClass.CLASS_II; // Water clouds
  } else if (temperature < 800) {
    return GasGiantClass.CLASS_III; // Clear atmosphere
  } else if (temperature < 1400) {
    return GasGiantClass.CLASS_IV; // Alkali clouds
  } else {
    return GasGiantClass.CLASS_V; // Silicate clouds
  }
}
```

### Class Properties

```typescript
function getClassProperties(gasGiantClass: GasGiantClass): {
  temperatureRange: [number, number];
  dominantClouds: string[];
  typicalColor: string;
  emissiveLevel: number;
} {
  switch (gasGiantClass) {
    case GasGiantClass.CLASS_I:
      return {
        temperatureRange: [150, 250],
        dominantClouds: ["ammonia", "water"],
        typicalColor: "#D8CA9D",
        emissiveLevel: 0.1,
      };

    case GasGiantClass.CLASS_II:
      return {
        temperatureRange: [250, 350],
        dominantClouds: ["water", "ammonia"],
        typicalColor: "#FAD5A5",
        emissiveLevel: 0.05,
      };

    case GasGiantClass.CLASS_III:
      return {
        temperatureRange: [350, 800],
        dominantClouds: ["methane"],
        typicalColor: "#4169E1",
        emissiveLevel: 0.02,
      };

    case GasGiantClass.CLASS_IV:
      return {
        temperatureRange: [800, 1400],
        dominantClouds: ["sodium", "potassium"],
        typicalColor: "#FF6347",
        emissiveLevel: 0.3,
      };

    case GasGiantClass.CLASS_V:
      return {
        temperatureRange: [1400, 3000],
        dominantClouds: ["silicate vapor", "iron vapor"],
        typicalColor: "#FF0000",
        emissiveLevel: 0.8,
      };
  }
}
```

## 🔗 Related

- [[GasGiantProperties]] - Gas giant properties that use this enumeration
- [[CelestialObject]] - Base celestial object interface
- [[AtmosphereType]] - Atmospheric density classification
- [[@teskooano/celestials-gas-giants]] - Gas giant rendering system
