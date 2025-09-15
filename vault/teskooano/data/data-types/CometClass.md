---
aliases: [CometClass]
tags: [data, types, celestial, comets, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# CometClass

Classification system for comets based on their orbital characteristics and origin.

## Overview

The `CometClass` enum provides a scientific classification system for comets based on their orbital periods and origins. This classification helps determine comet behavior, composition, and visual characteristics in the simulation.

## Enum Definition

```typescript
export enum CometClass {
  INTERSTELLAR = "INTERSTELLAR",
  LONG_PERIOD = "LONG_PERIOD",
  SHORT_PERIOD = "SHORT_PERIOD",
}
```

## Comet Classes

### INTERSTELLAR

```typescript
INTERSTELLAR = "INTERSTELLAR";
```

Interstellar comets that originate from outside the solar system.

**Characteristics:**

- **Origin**: Outside the solar system
- **Orbital Period**: Hyperbolic trajectory (no return)
- **Eccentricity**: > 1.0 (hyperbolic)
- **Velocity**: Excess hyperbolic velocity
- **Composition**: Exotic ices and materials from other star systems

**Examples:**

- 2I/Borisov (first confirmed interstellar comet)
- 1I/'Oumuamua (interstellar asteroid/comet)

**Properties:**

- Unique chemical signatures
- Different ice compositions
- High approach velocities
- Brief observation windows

### LONG_PERIOD

```typescript
LONG_PERIOD = "LONG_PERIOD";
```

Long-period comets with highly elliptical orbits and periods > 200 years.

**Characteristics:**

- **Origin**: Oort Cloud
- **Orbital Period**: > 200 years (often thousands of years)
- **Eccentricity**: 0.9-0.999 (highly elliptical)
- **Aphelion**: 20,000-100,000 AU
- **Composition**: Pristine ices from solar system formation

**Examples:**

- Hale-Bopp (2,533-year period)
- Hyakutake (70,000-year period)
- West (558,000-year period)

**Properties:**

- Very long orbital periods
- Highly eccentric orbits
- Random orbital inclinations
- Pristine composition

### SHORT_PERIOD

```typescript
SHORT_PERIOD = "SHORT_PERIOD";
```

Short-period comets with moderate eccentricity and periods < 200 years.

**Characteristics:**

- **Origin**: Kuiper Belt or captured long-period comets
- **Orbital Period**: < 200 years (typically 3-20 years)
- **Eccentricity**: 0.2-0.8 (moderately elliptical)
- **Aphelion**: 5-30 AU
- **Composition**: Evolved ices, may be partially depleted

**Examples:**

- Halley's Comet (76-year period)
- Encke (3.3-year period)
- Tempel 1 (5.5-year period)

**Properties:**

- Predictable return periods
- Lower orbital inclinations
- May show orbital evolution
- Can become extinct over time

## Usage Examples

### Orbital Classification

```typescript
function classifyComet(
  period_years: number,
  eccentricity: number,
  isInterstellar: boolean = false,
): CometClass {
  if (isInterstellar || eccentricity > 1.0) {
    return CometClass.INTERSTELLAR;
  } else if (period_years > 200) {
    return CometClass.LONG_PERIOD;
  } else {
    return CometClass.SHORT_PERIOD;
  }
}
```

### Activity Modeling

```typescript
function getCometActivityProfile(cometClass: CometClass): {
  maxActivity: number;
  activityDistance_AU: number;
  compositionFactor: number;
} {
  switch (cometClass) {
    case CometClass.INTERSTELLAR:
      return {
        maxActivity: 0.5, // Unknown composition may be less active
        activityDistance_AU: 3.0,
        compositionFactor: 0.8,
      };

    case CometClass.LONG_PERIOD:
      return {
        maxActivity: 1.0, // Pristine ices, very active
        activityDistance_AU: 5.0,
        compositionFactor: 1.2,
      };

    case CometClass.SHORT_PERIOD:
      return {
        maxActivity: 0.7, // Partially depleted
        activityDistance_AU: 2.5,
        compositionFactor: 0.9,
      };
  }
}
```

### Composition Profiles

```typescript
function getTypicalComposition(cometClass: CometClass): string[] {
  switch (cometClass) {
    case CometClass.INTERSTELLAR:
      return [
        "exotic ices",
        "organic compounds",
        "silicates",
        "unknown materials",
      ];

    case CometClass.LONG_PERIOD:
      return ["water ice", "CO2", "CO", "ammonia", "methane", "dust"];

    case CometClass.SHORT_PERIOD:
      return [
        "water ice",
        "CO2",
        "dust",
        "depleted volatiles",
        "refractory materials",
      ];
  }
}
```

### Visual Characteristics

```typescript
function getCometVisualDefaults(
  cometClass: CometClass,
): Partial<CometProperties> {
  switch (cometClass) {
    case CometClass.INTERSTELLAR:
      return {
        colors: ["#2F4F4F", "#556B2F", "#8B7D6B", "#BC8F8F"],
        heights: [0.0, 0.4, 0.7, 1.0],
        activity: 0.3,
        visualComaColor: "#708090",
        visualTailColor: "#C0C0C0",
      };

    case CometClass.LONG_PERIOD:
      return {
        colors: ["#696969", "#808080", "#A9A9A9", "#D3D3D3"],
        heights: [0.0, 0.25, 0.5, 1.0],
        activity: 0.9,
        visualComaColor: "#B0C4DE",
        visualTailColor: "#E6E6FA",
      };

    case CometClass.SHORT_PERIOD:
      return {
        colors: ["#8B4513", "#A0522D", "#D2691E", "#CD853F"],
        heights: [0.0, 0.3, 0.6, 1.0],
        activity: 0.8,
        visualComaColor: "#87CEEB",
        visualTailColor: "#FFFFFF",
      };
  }
}
```

## Integration

### Orbital Mechanics

- Determines orbital period ranges
- Affects eccentricity and inclination distributions
- Influences orbital evolution modeling

### Activity Modeling

- Different classes have different activity profiles
- Affects outgassing rates and visual effects
- Determines coma and tail development

### Procedural Generation

- Guides composition generation
- Affects visual appearance defaults
- Influences discovery date ranges

## 🔗 Related

- [[CometProperties]] - Comet properties that use this enumeration
- [[CelestialObject]] - Base celestial object interface
- [[@teskooano/celestials-comet]] - Comet rendering system
