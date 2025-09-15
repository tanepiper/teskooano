---
aliases: [Time Constants]
tags: [data, values, time, animation]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/time.ts"
status: active
---

# Time Constants

Default values and limits for time simulation, animation, and performance settings.

## Overview

The time constants module provides default values and limits for time simulation, animation, and performance settings in the Teskooano simulation. These constants ensure consistent time behavior, provide sensible defaults for user interfaces, and establish bounds for time-related parameters.

## Time Step Settings

### DEFAULT_TIME_STEP

```typescript
export const DEFAULT_TIME_STEP = 1.0;
```

Default simulation time step in seconds.

**Description:**
The default time step used for physics calculations in the simulation. This provides a good balance between accuracy and performance for most celestial mechanics calculations.

**Value:** 1.0 seconds

**Usage Examples:**

```typescript
// Initialize simulation with default time step
const simulation = new PhysicsSimulation(DEFAULT_TIME_STEP);

// Reset time step to default
simulation.setTimeStep(DEFAULT_TIME_STEP);

// Create time step slider with default value
const timeStepSlider = createSlider(
  MIN_TIME_STEP,
  MAX_TIME_STEP,
  DEFAULT_TIME_STEP,
);

// Calculate simulation progress
const simulationTime = timeStep * DEFAULT_TIME_STEP;
```

### MIN_TIME_STEP

```typescript
export const MIN_TIME_STEP = 0.001;
```

Minimum time step in seconds.

**Description:**
The minimum allowed time step for physics calculations in the simulation. This ensures numerical stability and prevents excessive computational overhead from extremely small time steps.

**Value:** 0.001 seconds (1 millisecond)

**Usage Examples:**

```typescript
// Validate time step input
const isValidTimeStep = timeStep >= MIN_TIME_STEP && timeStep <= MAX_TIME_STEP;

// Clamp time step to valid range
const clampedTimeStep = Math.max(
  MIN_TIME_STEP,
  Math.min(timeStep, MAX_TIME_STEP),
);

// Check if time step is too small
const isTooSmall = timeStep < MIN_TIME_STEP;

// Use minimum time step for high precision
const highPrecisionStep = MIN_TIME_STEP;
```

### MAX_TIME_STEP

```typescript
export const MAX_TIME_STEP = 86400;
```

Maximum time step in seconds.

**Description:**
The maximum allowed time step for physics calculations in the simulation. This prevents numerical instability from extremely large time steps that could cause objects to jump unrealistic distances.

**Value:** 86,400 seconds (1 day)

**Usage Examples:**

```typescript
// Validate time step input
const isValidTimeStep = timeStep >= MIN_TIME_STEP && timeStep <= MAX_TIME_STEP;

// Check if time step is too large
const isTooLarge = timeStep > MAX_TIME_STEP;

// Adjust time step for fast-forward mode
const fastForwardTimeStep = Math.min(timeStep * 10, MAX_TIME_STEP);

// Use maximum time step for long-term simulation
const longTermStep = MAX_TIME_STEP;
```

## Time Scale Settings

### DEFAULT_TIME_SCALE

```typescript
export const DEFAULT_TIME_SCALE = 1.0;
```

Default time scale multiplier.

**Description:**
The default time scale multiplier for the simulation. A value of 1.0 represents real-time simulation speed.

**Value:** 1.0 (real-time)

**Usage Examples:**

```typescript
// Initialize simulation with default time scale
const simulation = new PhysicsSimulation();
simulation.setTimeScale(DEFAULT_TIME_SCALE);

// Reset time scale to default
simulation.setTimeScale(DEFAULT_TIME_SCALE);

// Create time scale slider with default value
const timeScaleSlider = createSlider(
  MIN_TIME_SCALE,
  MAX_TIME_SCALE,
  DEFAULT_TIME_SCALE,
);

// Calculate effective time elapsed
const effectiveTime = realTime * DEFAULT_TIME_SCALE;
```

### MIN_TIME_SCALE

```typescript
export const MIN_TIME_SCALE = 0.001;
```

Minimum time scale multiplier.

**Description:**
The minimum allowed time scale multiplier for the simulation. This allows for very slow motion observation of fast events while preventing the simulation from becoming unresponsive.

**Value:** 0.001 (0.1% of real-time)

**Usage Examples:**

```typescript
// Validate time scale input
const isValidTimeScale =
  timeScale >= MIN_TIME_SCALE && timeScale <= MAX_TIME_SCALE;

// Clamp time scale to valid range
const clampedTimeScale = Math.max(
  MIN_TIME_SCALE,
  Math.min(timeScale, MAX_TIME_SCALE),
);

// Check if simulation is in slow motion
const isSlowMotion = timeScale < 1.0;

// Use minimum time scale for detailed observation
const slowMotionScale = MIN_TIME_SCALE;
```

### MAX_TIME_SCALE

```typescript
export const MAX_TIME_SCALE = 1000000;
```

Maximum time scale multiplier.

**Description:**
The maximum allowed time scale multiplier for the simulation. This allows for fast-forward observation of slow events while preventing numerical instability from excessive speeds.

**Value:** 1,000,000 (1 million times real-time)

**Usage Examples:**

```typescript
// Validate time scale input
const isValidTimeScale =
  timeScale >= MIN_TIME_SCALE && timeScale <= MAX_TIME_SCALE;

// Check if simulation is in fast forward
const isFastForward = timeScale > 1.0;

// Calculate effective time elapsed
const effectiveTimeElapsed = realTimeElapsed * timeScale;

// Use maximum time scale for long-term evolution
const fastForwardScale = MAX_TIME_SCALE;
```

## Performance Settings

### TARGET_FPS

```typescript
export const TARGET_FPS = 60;
```

Target frame rate for performance calculations.

**Description:**
The target frame rate for the simulation's rendering loop. This provides smooth visual updates while maintaining reasonable performance requirements.

**Value:** 60 FPS

**Usage Examples:**

```typescript
// Calculate frame time target
const targetFrameTime = 1000 / TARGET_FPS; // milliseconds

// Check if performance is acceptable
const isPerformanceGood = currentFPS >= TARGET_FPS;

// Adjust quality settings based on performance
if (currentFPS < TARGET_FPS) {
  reduceRenderingQuality();
}

// Calculate performance ratio
const performanceRatio = currentFPS / TARGET_FPS;
```

### MIN_FPS

```typescript
export const MIN_FPS = 30;
```

Minimum frame rate before performance degradation.

**Description:**
The minimum acceptable frame rate before the simulation starts degrading visual quality to maintain performance. This ensures the simulation remains responsive even under heavy computational load.

**Value:** 30 FPS

**Usage Examples:**

```typescript
// Check if performance degradation is needed
const needsDegradation = currentFPS < MIN_FPS;

// Apply performance optimizations
if (currentFPS < MIN_FPS) {
  enablePerformanceMode();
  reduceObjectCount();
  simplifyRendering();
}

// Monitor performance health
const performanceHealth =
  currentFPS >= TARGET_FPS
    ? "excellent"
    : currentFPS >= MIN_FPS
      ? "acceptable"
      : "poor";

// Calculate performance margin
const performanceMargin = currentFPS - MIN_FPS;
```

## Usage Patterns

### Time Step Management

```typescript
class TimeStepManager {
  private currentTimeStep = DEFAULT_TIME_STEP;

  setTimeStep(step: number): void {
    this.currentTimeStep = Math.max(
      MIN_TIME_STEP,
      Math.min(step, MAX_TIME_STEP),
    );
  }

  getTimeStep(): number {
    return this.currentTimeStep;
  }

  resetToDefault(): void {
    this.currentTimeStep = DEFAULT_TIME_STEP;
  }

  adaptToPerformance(fps: number): void {
    if (fps < MIN_FPS) {
      // Increase time step to improve performance
      this.currentTimeStep = Math.min(
        this.currentTimeStep * 1.5,
        MAX_TIME_STEP,
      );
    } else if (fps > TARGET_FPS) {
      // Decrease time step to improve accuracy
      this.currentTimeStep = Math.max(
        this.currentTimeStep * 0.9,
        MIN_TIME_STEP,
      );
    }
  }
}
```

### Time Scale Management

```typescript
class TimeScaleManager {
  private currentTimeScale = DEFAULT_TIME_SCALE;

  setTimeScale(scale: number): void {
    this.currentTimeScale = Math.max(
      MIN_TIME_SCALE,
      Math.min(scale, MAX_TIME_SCALE),
    );
  }

  getTimeScale(): number {
    return this.currentTimeScale;
  }

  resetToDefault(): void {
    this.currentTimeScale = DEFAULT_TIME_SCALE;
  }

  getEffectiveTimeStep(): number {
    return this.currentTimeStep * this.currentTimeScale;
  }
}
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private currentFPS = 0;

  update(): void {
    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime - this.lastTime >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;

      this.checkPerformance();
    }
  }

  private checkPerformance(): void {
    if (this.currentFPS < MIN_FPS) {
      this.triggerPerformanceDegradation();
    } else if (this.currentFPS >= TARGET_FPS) {
      this.triggerPerformanceOptimization();
    }
  }

  private triggerPerformanceDegradation(): void {
    // Reduce quality settings
    console.warn("Performance degradation triggered");
  }

  private triggerPerformanceOptimization(): void {
    // Increase quality settings
    console.log("Performance optimization available");
  }
}
```

### Animation Timing

```typescript
class AnimationManager {
  private timeScale = DEFAULT_TIME_SCALE;
  private timeStep = DEFAULT_TIME_STEP;

  update(deltaTime: number): void {
    const effectiveDeltaTime = deltaTime * this.timeScale;

    // Update animations with scaled time
    this.updateAnimations(effectiveDeltaTime);

    // Update physics with time step
    this.updatePhysics(this.timeStep);
  }

  private updateAnimations(deltaTime: number): void {
    // Animation updates use scaled time
    this.animations.forEach((animation) => {
      animation.update(deltaTime);
    });
  }

  private updatePhysics(timeStep: number): void {
    // Physics updates use fixed time step
    this.physicsSystem.step(timeStep);
  }
}
```

## Performance Considerations

### Time Step Selection

- **High Accuracy**: Use `MIN_TIME_STEP` for precise calculations
- **Balanced**: Use `DEFAULT_TIME_STEP` for general simulation
- **Performance**: Use `MAX_TIME_STEP` for long-term evolution

### Time Scale Management

- **Real-time**: Use `DEFAULT_TIME_SCALE` for normal operation
- **Slow Motion**: Use `MIN_TIME_SCALE` for detailed observation
- **Fast Forward**: Use `MAX_TIME_SCALE` for long-term evolution

### Frame Rate Optimization

- **Target**: Maintain `TARGET_FPS` for smooth visuals
- **Minimum**: Never drop below `MIN_FPS`
- **Adaptive**: Adjust quality based on performance

## Integration

### Physics System

- Time step integration
- Time scale application
- Performance monitoring

### Rendering System

- Frame rate management
- Animation timing
- Performance optimization

### Simulation System

- Time management
- Performance monitoring
- Quality adaptation

## 🔗 Related

- [[Conversion Factors]] - Time conversion factors
- [[Simulation Limits]] - Performance and stability limits
- [[Rendering Constants]] - Visual performance settings
- [[@teskooano/core-physics]] - Physics system using time constants
- [[@teskooano/core-state]] - State management with time settings
