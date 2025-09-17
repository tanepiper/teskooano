---
aliases: [LagrangePointType]
tags: [data, types, orbital, lagrange, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# LagrangePointType

Enumeration of Lagrange point types (L1-L5) for two-body gravitational systems.

## Overview

The `LagrangePointType` enum defines the five Lagrange points in a two-body gravitational system where the gravitational forces of two large bodies and the centrifugal force balance, allowing smaller objects to maintain stable positions.

## Enum Definition

```typescript
export enum LagrangePointType {
  L1 = "L1",
  L2 = "L2",
  L3 = "L3",
  L4 = "L4",
  L5 = "L5",
}
```

## Lagrange Points

### L1

```typescript
L1 = "L1";
```

Inner Lagrange point between the two bodies.

**Characteristics:**

- **Location**: Between primary and secondary bodies
- **Stability**: Unstable (saddle point)
- **Distance**: Closer to the less massive body
- **Uses**: Solar observation missions, space telescopes

**Examples:**

- **Sun-Earth L1**: ~1.5 million km from Earth toward Sun
- **Earth-Moon L1**: ~326,000 km from Earth toward Moon

**Applications:**

- Solar and space weather monitoring
- Continuous observation of primary body
- Staging point for deep space missions

### L2

```typescript
L2 = "L2";
```

Outer Lagrange point beyond the smaller body.

**Characteristics:**

- **Location**: Beyond secondary body, opposite primary
- **Stability**: Unstable (saddle point)
- **Distance**: Further from primary than secondary
- **Uses**: Deep space observation, infrared telescopes

**Examples:**

- **Sun-Earth L2**: ~1.5 million km from Earth away from Sun
- **Earth-Moon L2**: ~448,000 km from Earth away from Moon

**Applications:**

- Deep space telescopes (James Webb, Planck)
- Infrared and microwave astronomy
- Communications relay stations

### L3

```typescript
L3 = "L3";
```

Point opposite the smaller body, beyond the larger body.

**Characteristics:**

- **Location**: Opposite secondary body, beyond primary
- **Stability**: Unstable (saddle point)
- **Distance**: On opposite side of orbit from secondary
- **Uses**: Rarely used in practice

**Examples:**

- **Sun-Earth L3**: Opposite Earth's orbit around Sun
- **Earth-Moon L3**: Opposite Moon's orbit around Earth

**Applications:**

- Theoretical staging areas
- Science fiction scenarios
- Rarely practical due to instability

### L4

```typescript
L4 = "L4";
```

Leading Trojan point, 60° ahead of the smaller body.

**Characteristics:**

- **Location**: 60° ahead of secondary in its orbit
- **Stability**: Stable (for mass ratios > 24.96)
- **Distance**: Forms equilateral triangle with both bodies
- **Uses**: Natural asteroid accumulation, space habitats

**Examples:**

- **Sun-Jupiter L4**: Leading Jupiter Trojans
- **Sun-Earth L4**: Potential asteroid population

**Applications:**

- Natural asteroid populations
- Space habitat locations
- Resource mining stations
- Long-term stable positions

### L5

```typescript
L5 = "L5";
```

Trailing Trojan point, 60° behind the smaller body.

**Characteristics:**

- **Location**: 60° behind secondary in its orbit
- **Stability**: Stable (for mass ratios > 24.96)
- **Distance**: Forms equilateral triangle with both bodies
- **Uses**: Natural asteroid accumulation, space habitats

**Examples:**

- **Sun-Jupiter L5**: Trailing Jupiter Trojans
- **Sun-Earth L5**: Potential asteroid population

**Applications:**

- Natural asteroid populations
- Space habitat locations
- Resource mining stations
- Long-term stable positions

## Usage Examples

### Orbital Placement

```typescript
import { LagrangePointType, OrbitalParameters } from "@teskooano/data-types";

function createLagrangeOrbit(
  lagrangeType: LagrangePointType,
  primaryMass: number,
  secondaryMass: number,
  systemSeparation: number,
): Partial<OrbitalParameters> {
  const totalMass = primaryMass + secondaryMass;
  const mu = secondaryMass / totalMass;

  switch (lagrangeType) {
    case LagrangePointType.L1:
      const r1 = systemSeparation * (1 - Math.cbrt(mu / 3));
      return {
        realSemiMajorAxis_m: r1,
        eccentricity: 0.0,
        lagrangePointType: lagrangeType,
      };

    case LagrangePointType.L2:
      const r2 = systemSeparation * (1 + Math.cbrt(mu / 3));
      return {
        realSemiMajorAxis_m: r2,
        eccentricity: 0.0,
        lagrangePointType: lagrangeType,
      };

    case LagrangePointType.L3:
      const r3 = systemSeparation * (1 - mu);
      return {
        realSemiMajorAxis_m: r3,
        eccentricity: 0.0,
        lagrangePointType: lagrangeType,
      };

    case LagrangePointType.L4:
    case LagrangePointType.L5:
      return {
        realSemiMajorAxis_m: systemSeparation, // Same as secondary
        eccentricity: 0.0,
        lagrangePointType: lagrangeType,
        meanAnomaly:
          lagrangeType === LagrangePointType.L4 ? Math.PI / 3 : -Math.PI / 3,
      };
  }
}
```

### Stability Assessment

```typescript
function assessLagrangeStability(
  lagrangeType: LagrangePointType,
  massRatio: number,
): "stable" | "unstable" | "marginally_stable" {
  switch (lagrangeType) {
    case LagrangePointType.L1:
    case LagrangePointType.L2:
    case LagrangePointType.L3:
      return "unstable"; // Always unstable

    case LagrangePointType.L4:
    case LagrangePointType.L5:
      if (massRatio > 24.96) {
        return "stable";
      } else if (massRatio > 20.0) {
        return "marginally_stable";
      } else {
        return "unstable";
      }
  }
}
```

### Mission Planning

```typescript
function selectLagrangePoint(
  missionType: "observation" | "communication" | "habitat" | "mining",
  systemMassRatio: number,
): LagrangePointType[] {
  const suitablePoints: LagrangePointType[] = [];

  switch (missionType) {
    case "observation":
      suitablePoints.push(LagrangePointType.L1, LagrangePointType.L2);
      break;

    case "communication":
      suitablePoints.push(LagrangePointType.L1, LagrangePointType.L2);
      break;

    case "habitat":
    case "mining":
      // Only use stable points for long-term habitation
      if (systemMassRatio > 24.96) {
        suitablePoints.push(LagrangePointType.L4, LagrangePointType.L5);
      }
      break;
  }

  return suitablePoints;
}
```

### Trojan Population

```typescript
function createTrojanPopulation(
  lagrangeType: LagrangePointType.L4 | LagrangePointType.L5,
  populationSize: number,
  systemProperties: TwoBodySystem,
): CelestialObject[] {
  const trojans: CelestialObject[] = [];

  for (let i = 0; i < populationSize; i++) {
    const trojan: CelestialObject = {
      id: `trojan-${lagrangeType}-${i}`,
      type: CelestialType.ASTEROID,
      name: `${lagrangeType} Trojan ${i}`,
      status: CelestialStatus.ACTIVE,
      realRadius_m: 1000 + Math.random() * 50000, // 1-50 km
      realMass_kg: 1e12 + Math.random() * 1e15, // Variable mass
      temperature: 200,
      orbit: {
        ...createLagrangeOrbit(
          lagrangeType,
          systemProperties.primary.mass_kg,
          systemProperties.secondary.mass_kg,
          systemProperties.separation_m,
        ),
        // Add small perturbations for realistic distribution
        realSemiMajorAxis_m:
          systemProperties.separation_m * (1 + (Math.random() - 0.5) * 0.1),
        eccentricity: Math.random() * 0.2,
        inclination: (Math.random() - 0.5) * 0.3,
        meanAnomaly: Math.random() * 2 * Math.PI,
      },
      properties: {
        type: CelestialType.ASTEROID,
        classType: AsteroidClass.CLUSTER,
        colors: ["#696969", "#808080", "#A9A9A9", "#C0C0C0"],
        heights: [0.0, 0.3, 0.6, 1.0],
        composition: "carbonaceous",
        density: 0.5,
        temperature: 0.2,
        activity: 0.0,
      },
    };

    trojans.push(trojan);
  }

  return trojans;
}
```

## Integration

### Orbital Mechanics

- Defines special orbital configurations
- Enables complex multi-body dynamics
- Supports asteroid population modeling

### Mission Planning

- Provides strategic positioning options
- Enables space habitat placement
- Supports communication networks

### Physics System

- Integrates with Lagrange point calculations
- Supports stability analysis
- Enables restricted three-body problem

## Real-World Applications

### Space Missions

| Lagrange Point    | Mission Examples             | Purpose                      |
| ----------------- | ---------------------------- | ---------------------------- |
| Sun-Earth L1      | SOHO, ACE, WIND              | Solar observation            |
| Sun-Earth L2      | James Webb, Planck, Herschel | Deep space astronomy         |
| Earth-Moon L1     | Gateway (planned)            | Lunar operations             |
| Earth-Moon L2     | Chang'e 4 relay              | Lunar far side communication |
| Sun-Jupiter L4/L5 | Trojan asteroids             | Natural populations          |

## 🔗 Related

- [[LagrangePoint]] - Lagrange point interface with detailed properties
- [[OrbitalParameters]] - Orbital parameters with Lagrange point support
- [[TwoBodySystem]] - Two-body system for Lagrange point calculations
- [[PhysicsStateReal]] - Physics state for primary and secondary bodies
- [[@teskooano/core-physics]] - Physics calculations for Lagrange points
