---
aliases:
  [
    LagrangePointService,
    lagrange-points,
    lagrangian-points,
    l-points,
    trojan-points,
  ]
tags: [core, physics, lagrange, orbital, mechanics, trojan, libration]
type: Class
package: "@teskooano/core-physics"
name: LagrangePointService
dependencies: ["@teskooano/core-math", "@teskooano/data-types"]
classes: ["LagrangePointService"]
functions: []
constants: []
types:
  [
    "PhysicsStateReal",
    "LagrangePoint",
    "LagrangePointType",
    "LagrangePointCalculation",
  ]
status: active
---

# LagrangePointService

Calculates and manages the five Lagrange points (L1-L5) for any two-body system, providing positions and stability analysis.

**Location**: `src/orbital/lagrange-service.ts`

## 🎯 Purpose

The `LagrangePointService` provides comprehensive Lagrange point analysis:

- **Five Lagrange Points**: L1, L2, L3, L4, L5 calculation and analysis
- **Stability Analysis**: Determines stability of each Lagrange point
- **Trojan Positions**: Calculates positions for Trojan asteroids
- **Libration Points**: Identifies regions of orbital stability
- **Mass Ratio Analysis**: Considers mass ratios for accurate calculations
- **Coordinate Systems**: Provides positions in various coordinate frames

## 🏗️ Architecture

### Service Pattern Implementation

Provides static methods for Lagrange point calculations:

```typescript
export class LagrangePointService {
  static calculateLagrangePoints(
    primary: PhysicsStateReal,
    secondary: PhysicsStateReal,
  ): LagrangePoint[];
}
```

### Lagrange Point Types

Defines the five classical Lagrange points:

```typescript
enum LagrangePointType {
  L1 = "L1", // Between primary and secondary
  L2 = "L2", // Beyond secondary
  L3 = "L3", // Beyond primary
  L4 = "L4", // Leading Trojan point
  L5 = "L5", // Trailing Trojan point
}
```

### Calculation Results

Comprehensive Lagrange point information:

```typescript
interface LagrangePoint {
  type: LagrangePointType;
  position_m: OSVector3;
  stability: "stable" | "unstable" | "conditionally_stable";
  massRatio: number;
  distanceFromPrimary_m: number;
  distanceFromSecondary_m: number;
  orbitalPeriod_s?: number;
}
```

## 🔧 Core Methods

### Main Calculation Interface

```typescript
static calculateLagrangePoints(
  primary: PhysicsStateReal,
  secondary: PhysicsStateReal
): LagrangePoint[];
```

**Calculation Features:**

- All five Lagrange points (L1-L5)
- Stability analysis for each point
- Mass ratio considerations
- Distance calculations
- Orbital period estimation

### Individual Point Calculations

```typescript
static calculateL1Point(primary: PhysicsStateReal, secondary: PhysicsStateReal): LagrangePoint;
static calculateL2Point(primary: PhysicsStateReal, secondary: PhysicsStateReal): LagrangePoint;
static calculateL3Point(primary: PhysicsStateReal, secondary: PhysicsStateReal): LagrangePoint;
static calculateL4Point(primary: PhysicsStateReal, secondary: PhysicsStateReal): LagrangePoint;
static calculateL5Point(primary: PhysicsStateReal, secondary: PhysicsStateReal): LagrangePoint;
```

**Point Features:**

- Individual Lagrange point calculations
- Specific stability analysis
- Position accuracy optimization
- Mass ratio considerations

### Stability Analysis

```typescript
static analyzeStability(
  lagrangePoint: LagrangePoint,
  primary: PhysicsStateReal,
  secondary: PhysicsStateReal
): "stable" | "unstable" | "conditionally_stable";
```

**Stability Features:**

- L4/L5 stability criteria
- L1/L2/L3 instability analysis
- Mass ratio considerations
- Perturbation effects

### Trojan Position Calculation

```typescript
static calculateTrojanPositions(
  primary: PhysicsStateReal,
  secondary: PhysicsStateReal
): { leading: OSVector3; trailing: OSVector3 };
```

**Trojan Features:**

- Leading (L4) and trailing (L5) positions
- Equilateral triangle formation
- Orbital stability analysis
- Mass ratio considerations

## 🚀 Usage Examples

### Basic Lagrange Point Calculation

```typescript
import { LagrangePointService } from "@teskooano/core-physics";

// Calculate all Lagrange points for Earth-Sun system
const sun = {
  id: "sun",
  mass_kg: 1.989e30,
  position_m: new OSVector3(0, 0, 0),
  velocity_mps: new OSVector3(0, 0, 0),
};

const earth = {
  id: "earth",
  mass_kg: 5.972e24,
  position_m: new OSVector3(1.496e11, 0, 0),
  velocity_mps: new OSVector3(0, 0, 29780),
};

const lagrangePoints = LagrangePointService.calculateLagrangePoints(sun, earth);

console.log("Earth-Sun Lagrange Points:");
lagrangePoints.forEach((point) => {
  console.log(`${point.type}:`, {
    position: point.position_m,
    stability: point.stability,
    distanceFromSun: point.distanceFromPrimary_m,
    distanceFromEarth: point.distanceFromSecondary_m,
  });
});
```

### Individual Lagrange Point Analysis

```typescript
// Calculate specific Lagrange points
const l1Point = LagrangePointService.calculateL1Point(sun, earth);
const l2Point = LagrangePointService.calculateL2Point(sun, earth);
const l4Point = LagrangePointService.calculateL4Point(sun, earth);
const l5Point = LagrangePointService.calculateL5Point(sun, earth);

console.log("L1 Point (Earth-Sun):", {
  position: l1Point.position_m,
  stability: l1Point.stability,
  distanceFromSun: l1Point.distanceFromPrimary_m,
  distanceFromEarth: l1Point.distanceFromSecondary_m,
});

console.log("L4 Point (Leading Trojan):", {
  position: l4Point.position_m,
  stability: l4Point.stability,
  orbitalPeriod: l4Point.orbitalPeriod_s,
});
```

### Trojan Asteroid Positions

```typescript
// Calculate Trojan positions for Jupiter
const jupiter = {
  id: "jupiter",
  mass_kg: 1.898e27,
  position_m: new OSVector3(7.785e11, 0, 0),
  velocity_mps: new OSVector3(0, 0, 13070),
};

const trojanPositions = LagrangePointService.calculateTrojanPositions(
  sun,
  jupiter,
);

console.log("Jupiter Trojan Positions:");
console.log("Leading Trojans (L4):", trojanPositions.leading);
console.log("Trailing Trojans (L5):", trojanPositions.trailing);

// Verify equilateral triangle formation
const sunToJupiter = jupiter.position_m.distanceTo(sun.position_m);
const sunToLeading = trojanPositions.leading.distanceTo(sun.position_m);
const jupiterToLeading = trojanPositions.leading.distanceTo(jupiter.position_m);

console.log("Triangle verification:");
console.log("Sun-Jupiter distance:", sunToJupiter);
console.log("Sun-L4 distance:", sunToLeading);
console.log("Jupiter-L4 distance:", jupiterToLeading);
console.log(
  "Equilateral triangle:",
  Math.abs(sunToJupiter - sunToLeading) < 1e6,
);
```

### Stability Analysis

```typescript
// Analyze stability of different Lagrange points
const earthSunLagrangePoints = LagrangePointService.calculateLagrangePoints(
  sun,
  earth,
);

earthSunLagrangePoints.forEach((point) => {
  const stability = LagrangePointService.analyzeStability(point, sun, earth);
  console.log(`${point.type} stability:`, stability);

  if (stability === "stable") {
    console.log(`  ${point.type} is suitable for long-term orbital objects`);
  } else if (stability === "conditionally_stable") {
    console.log(
      `  ${point.type} requires station-keeping for long-term stability`,
    );
  } else {
    console.log(`  ${point.type} is unstable and requires active control`);
  }
});
```

### Multiple Body Systems

```typescript
// Calculate Lagrange points for multiple systems
const systems = [
  { name: "Earth-Sun", primary: sun, secondary: earth },
  { name: "Moon-Earth", primary: earth, secondary: moon },
  { name: "Jupiter-Sun", primary: sun, secondary: jupiter },
];

systems.forEach((system) => {
  const lagrangePoints = LagrangePointService.calculateLagrangePoints(
    system.primary,
    system.secondary,
  );

  console.log(`\n${system.name} Lagrange Points:`);
  lagrangePoints.forEach((point) => {
    console.log(`  ${point.type}: ${point.stability} at ${point.position_m}`);
  });
});
```

### Lagrange Point Visualization

```typescript
// Create visualization data for Lagrange points
function createLagrangeVisualization(
  primary: PhysicsStateReal,
  secondary: PhysicsStateReal,
) {
  const lagrangePoints = LagrangePointService.calculateLagrangePoints(
    primary,
    secondary,
  );

  const visualizationData = {
    primary: {
      position: primary.position_m,
      mass: primary.mass_kg,
    },
    secondary: {
      position: secondary.position_m,
      mass: secondary.mass_kg,
    },
    lagrangePoints: lagrangePoints.map((point) => ({
      type: point.type,
      position: point.position_m,
      stability: point.stability,
      color: getStabilityColor(point.stability),
    })),
  };

  return visualizationData;
}

function getStabilityColor(stability: string): string {
  switch (stability) {
    case "stable":
      return "#00ff00"; // Green
    case "conditionally_stable":
      return "#ffff00"; // Yellow
    case "unstable":
      return "#ff0000"; // Red
    default:
      return "#888888"; // Gray
  }
}
```

### Orbital Period Analysis

```typescript
// Analyze orbital periods at Lagrange points
const earthSunLagrangePoints = LagrangePointService.calculateLagrangePoints(
  sun,
  earth,
);

earthSunLagrangePoints.forEach((point) => {
  if (point.orbitalPeriod_s) {
    const periodDays = point.orbitalPeriod_s / (24 * 3600);
    console.log(`${point.type} orbital period: ${periodDays.toFixed(2)} days`);

    if (point.type === "L4" || point.type === "L5") {
      console.log(`  ${point.type} Trojans orbit with same period as Earth`);
    }
  }
});
```

### Mass Ratio Analysis

```typescript
// Analyze how mass ratio affects Lagrange point positions
function analyzeMassRatioEffects() {
  const primary = { ...sun };
  const secondaries = [
    { name: "Mercury", mass: 3.285e23, distance: 5.791e10 },
    { name: "Earth", mass: 5.972e24, distance: 1.496e11 },
    { name: "Jupiter", mass: 1.898e27, distance: 7.785e11 },
  ];

  secondaries.forEach((secondary) => {
    const secondaryBody = {
      id: secondary.name.toLowerCase(),
      mass_kg: secondary.mass,
      position_m: new OSVector3(secondary.distance, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    };

    const lagrangePoints = LagrangePointService.calculateLagrangePoints(
      primary,
      secondaryBody,
    );
    const massRatio = secondary.mass / primary.mass_kg;

    console.log(
      `\n${secondary.name}-Sun system (mass ratio: ${massRatio.toExponential(2)}):`,
    );
    lagrangePoints.forEach((point) => {
      console.log(`  ${point.type}: ${point.stability} at ${point.position_m}`);
    });
  });
}
```

## 🎯 Performance Considerations

### Algorithm Complexity

- **L1/L2/L3 Calculation**: O(1) - Direct analytical solutions
- **L4/L5 Calculation**: O(1) - Equilateral triangle geometry
- **Stability Analysis**: O(1) - Mass ratio calculations
- **Multiple Systems**: O(N) for N systems

### Accuracy Considerations

**High Accuracy For:**

- Large mass ratios (e.g., Sun-Earth, Sun-Jupiter)
- Circular orbits
- Two-body systems
- Classical Lagrange points

**Reduced Accuracy For:**

- Small mass ratios
- Highly eccentric orbits
- Multi-body perturbations
- Non-classical configurations

### Optimal Use Cases

**Best For:**

- Solar system Lagrange points
- Satellite positioning analysis
- Trojan asteroid calculations
- Orbital mechanics education
- Space mission planning

**Not Ideal For:**

- Multi-body systems with significant perturbations
- Highly eccentric orbits
- Systems with comparable masses
- Dynamic orbital configurations

## 🔗 Integration Points

### With Orbital Mechanics

```typescript
// Integration with orbital calculations
import { calculateOrbitalElements } from "@teskooano/core-physics";

// Lagrange points can be used as initial conditions
const l4Point = LagrangePointService.calculateL4Point(sun, jupiter);
const trojanOrbit = calculateOrbitalElements(
  l4Point.position_m,
  l4Point.velocity_mps,
  sun.mass_kg,
);
```

### With Simulation Systems

```typescript
// Use Lagrange points in simulations
const lagrangePoints = LagrangePointService.calculateLagrangePoints(
  primary,
  secondary,
);

// Add Lagrange point objects to simulation
lagrangePoints.forEach((point) => {
  if (point.stability === "stable") {
    simulation.addBody({
      id: `lagrange-${point.type}`,
      position_m: point.position_m,
      velocity_mps: new OSVector3(0, 0, 0),
      mass_kg: 1e6, // Small test mass
    });
  }
});
```

### With State Management

```typescript
// Store Lagrange point data in state
const lagrangePoints = LagrangePointService.calculateLagrangePoints(sun, earth);
stateSystem.updateLagrangePoints(lagrangePoints);

// Access Lagrange points from state
const currentLagrangePoints = stateSystem.getLagrangePoints();
```

## 🔗 Related Components

- [[OrbitalParameters]] - Orbital element calculations
- [[calculateOrbitalElements]] - Orbital mechanics functions
- [[SimulationManager]] - Integration with simulation systems
- [[PhysicsStateReal]] - Physics state representation

## 📚 Architecture Patterns

- **Service Pattern**: Static utility methods
- **Factory Pattern**: Lagrange point creation
- **Strategy Pattern**: Different calculation methods
- **Analytical Pattern**: Mathematical solutions
- **Geometric Pattern**: Spatial calculations

---

_The LagrangePointService provides comprehensive analysis of the five Lagrange points, enabling accurate positioning and stability analysis for orbital mechanics applications._
