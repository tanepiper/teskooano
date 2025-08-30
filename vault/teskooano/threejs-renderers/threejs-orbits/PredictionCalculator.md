---
name: "PredictionCalculator"
description: "Core prediction calculation logic for future trajectory visualization"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  ["@teskooano/core-state", "@teskooano/core-physics", "@teskooano/data-types"]
classes: ["StateAccessor", "PhysicsStateProvider", "OSVector3"]
functions:
  [
    "calculatePredictionTrajectory",
    "calculatePredictionSteps",
    "determineRelativeBodyId",
    "setPredictionDuration",
    "setPredictionSteps",
  ]
constants: []
types: ["RenderableCelestialObject", "CelestialObject", "CelestialType"]
---

# PredictionCalculator

Core prediction calculation logic for future trajectory visualization, providing physics-based trajectory prediction using the core physics engine.

## 🎯 Purpose

`PredictionCalculator` is responsible for calculating future trajectories of celestial objects using the core physics engine. It provides the mathematical foundation for prediction visualization, handling complex N-body gravitational interactions and determining optimal prediction parameters.

## 🏗️ Architecture

### Core Components

The calculator integrates with the core physics system:

```typescript
class PredictionCalculator {
  private stateAccessor: StateAccessor;
  private physicsStateProvider: PhysicsStateProvider;
  private predictionDuration: number = 0;
  private predictionSteps: number = 60;
}
```

### Physics Integration

- **State Access**: Uses `StateAccessor` to access current simulation state
- **Physics Engine**: Leverages `@teskooano/core-physics` for trajectory calculations
- **Multi-body Support**: Handles complex gravitational interactions between multiple objects

## 🚀 Core Features

### Trajectory Prediction

Calculates future positions using physics simulation:

```typescript
async calculatePredictionTrajectory(
  objectId: string,
  relativeToBodyId?: string
): Promise<{ points: OSVector3[]; timestamps: number[] }>
```

**Features:**

- **Physics-based Calculation**: Uses real N-body physics simulation
- **Multi-body Interactions**: Accounts for gravitational forces from all objects
- **Relative Positioning**: Supports predictions relative to specific bodies
- **Time Stamps**: Provides temporal information for each prediction point

### Adaptive Step Calculation

Determines optimal prediction steps based on object properties:

```typescript
calculatePredictionSteps(
  object: RenderableCelestialObject,
  allObjects: Record<string, RenderableCelestialObject>
): number
```

**Logic:**

- **Orbital Period**: Uses orbital period for periodic objects
- **Distance-based**: Adjusts steps based on object distance from camera
- **Performance Optimization**: Balances accuracy with computational cost
- **Object Type**: Different step counts for different celestial types

### Relative Body Determination

Automatically determines the appropriate reference body:

```typescript
determineRelativeBodyId(objectId: string): string | undefined
```

**Behavior:**

- **Hierarchy Analysis**: Examines celestial object hierarchy
- **Gravitational Dominance**: Considers gravitational relationships
- **Multi-star Systems**: Handles complex multi-star scenarios
- **Default Fallback**: Uses barycenter when no clear parent exists

## 🔧 Key Methods

### Constructor

```typescript
constructor(stateAccessor: StateAccessor, physicsStateProvider: PhysicsStateProvider)
```

**Parameters:**

- `stateAccessor`: Access to current simulation state
- `physicsStateProvider`: Access to physics engine capabilities

### Prediction Duration Control

```typescript
setPredictionDuration(duration: number): void
setPredictionSteps(steps: number): void
```

**Purpose:**

- Configures prediction time span and resolution
- Allows runtime adjustment of prediction parameters
- Balances accuracy with performance requirements

### Core Calculation

```typescript
async calculatePredictionTrajectory(
  objectId: string,
  relativeToBodyId?: string
): Promise<{ points: OSVector3[]; timestamps: number[] }>
```

**Process:**

1. **State Retrieval**: Gets current physics state
2. **Step Calculation**: Determines optimal prediction steps
3. **Physics Simulation**: Runs prediction using physics engine
4. **Coordinate Transformation**: Converts to relative coordinates if needed
5. **Result Formatting**: Returns positions and timestamps

## 🔄 Data Flow

### State Access

```typescript
// Retrieve current physics state
const physicsState = this.stateAccessor.getPhysicsState();
const celestialObjects = this.stateAccessor.getCelestialObjects();
```

### Physics Integration

```typescript
// Use core physics for prediction
const predictionResult = await predictTrajectory(
  physicsState,
  objectId,
  this.predictionDuration,
  this.predictionSteps,
);
```

### Coordinate Transformation

```typescript
// Convert to relative coordinates if needed
if (relativeToBodyId) {
  const relativePoints = this.transformToRelativeCoordinates(
    predictionResult.points,
    relativeToBodyId,
  );
  return { points: relativePoints, timestamps: predictionResult.timestamps };
}
```

## 🎨 Calculation Features

### Multi-body Physics

Advanced gravitational interaction handling:

```typescript
// Account for all gravitational influences
const gravitationalForces = this.calculateGravitationalForces(
  objectId,
  allObjects,
  currentPosition,
);
```

### Adaptive Time Steps

Dynamic step calculation based on object properties:

```typescript
// Calculate optimal steps based on orbital period
const orbitalPeriod = object.orbit?.period_s || 0;
const baseSteps = Math.max(60, Math.min(300, Math.floor(orbitalPeriod / 1000)));

// Adjust based on distance and object type
const distanceFactor = this.calculateDistanceFactor(object);
const typeFactor = this.getTypeFactor(object.type);
const finalSteps = Math.floor(baseSteps * distanceFactor * typeFactor);
```

### Performance Optimization

Efficient calculation strategies:

```typescript
// Use adaptive step sizes for long predictions
const stepSize = this.predictionDuration / this.predictionSteps;
const adaptiveSteps = this.calculateAdaptiveSteps(stepSize, object);

// Early termination for stable orbits
if (this.isStableOrbit(object, predictionPoints)) {
  return this.extrapolateStableOrbit(object, predictionPoints);
}
```

## 📊 Performance Considerations

### Calculation Optimization

- **Adaptive Steps**: Dynamic step calculation based on object properties
- **Early Termination**: Stop calculation for stable orbits
- **Caching**: Cache results for repeated calculations
- **Parallel Processing**: Support for concurrent predictions

### Memory Management

- **Efficient Data Structures**: Use optimized arrays for position data
- **Garbage Collection**: Minimize object allocations during calculation
- **Result Reuse**: Reuse calculation results when possible

### Accuracy vs Performance

- **Configurable Precision**: Adjustable accuracy settings
- **Performance Monitoring**: Track calculation performance
- **Adaptive Quality**: Automatically adjust quality based on system performance

## 🔧 Integration Points

### Physics Engine Integration

```typescript
// Integrate with core physics engine
import { predictTrajectory } from "@teskooano/core-physics";

const result = await predictTrajectory(physicsState, objectId, duration, steps);
```

### State System Integration

```typescript
// Access simulation state
const state = this.stateAccessor.getPhysicsState();
const objects = this.stateAccessor.getCelestialObjects();
```

### Coordinate System Integration

```typescript
// Handle coordinate transformations
const relativePoints = this.transformCoordinates(absolutePoints, referenceBody);
```

## 🎯 Usage Examples

### Basic Prediction

```typescript
import { PredictionCalculator } from "@teskooano/renderer-threejs-orbits";

const calculator = new PredictionCalculator(
  stateAccessor,
  physicsStateProvider,
);

// Set prediction parameters
calculator.setPredictionDuration(3600); // 1 hour
calculator.setPredictionSteps(120); // 120 steps

// Calculate prediction
const prediction = await calculator.calculatePredictionTrajectory("earth");
console.log("Prediction points:", prediction.points);
console.log("Timestamps:", prediction.timestamps);
```

### Relative Prediction

```typescript
// Calculate prediction relative to Sun
const relativePrediction = await calculator.calculatePredictionTrajectory(
  "earth",
  "sun",
);

// Calculate prediction relative to Earth (for moon)
const moonPrediction = await calculator.calculatePredictionTrajectory(
  "moon",
  "earth",
);
```

### Adaptive Step Calculation

```typescript
// Get optimal steps for an object
const object = celestialObjects["earth"];
const optimalSteps = calculator.calculatePredictionSteps(object, allObjects);

// Use optimal steps for prediction
calculator.setPredictionSteps(optimalSteps);
const prediction = await calculator.calculatePredictionTrajectory("earth");
```

## 🔍 Debug Features

### Calculation Monitoring

```typescript
// Monitor calculation performance
const startTime = performance.now();
const prediction = await calculator.calculatePredictionTrajectory("earth");
const endTime = performance.now();
console.log(`Prediction calculation took ${endTime - startTime}ms`);
```

### Step Analysis

```typescript
// Analyze step calculation
const object = celestialObjects["earth"];
const steps = calculator.calculatePredictionSteps(object, allObjects);
console.log(`Optimal steps for ${object.id}: ${steps}`);
```

### Coordinate Verification

```typescript
// Verify coordinate transformations
const absolutePrediction =
  await calculator.calculatePredictionTrajectory("earth");
const relativePrediction = await calculator.calculatePredictionTrajectory(
  "earth",
  "sun",
);

console.log("Absolute prediction length:", absolutePrediction.points.length);
console.log("Relative prediction length:", relativePrediction.points.length);
```

## 🚀 Future Enhancements

### Planned Features

- **GPU Acceleration**: Move calculations to GPU using compute shaders
- **Advanced Physics**: Support for relativistic effects and perturbations
- **Real-time Updates**: Continuous prediction updates during simulation

### Optimization Opportunities

- **Predictive Caching**: Cache prediction results for reuse
- **Spatial Indexing**: Advanced spatial partitioning for large scenes
- **Parallel Processing**: Multi-threaded prediction calculations

### Advanced Features

- **Uncertainty Visualization**: Show prediction uncertainty ranges
- **Multi-scenario Predictions**: Compare multiple prediction scenarios
- **Interactive Predictions**: User-controlled prediction parameters
