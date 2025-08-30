# Phase 1: Move Calculations to Physics Package

## 🎯 Goal

Move all orbital calculations from the rendering package to the physics package where they belong, creating a clean separation between physics calculations and rendering visualization.

## 📋 Steps

### Step 1.1: Create Orbital Calculation Functions

**File**: `packages/core/physics/src/orbital/calculations.ts`

**Purpose**: Move pure calculation functions from renderer package to physics package

```typescript
import { OSVector3 } from "@teskooano/core-math";
import { OrbitalParameters } from "@teskooano/data-types";
import { calculateKeplerianStateAtTime } from "./shared";

/**
 * Calculate points for a complete Keplerian orbit
 * @param orbitalParameters The orbital parameters
 * @param numPoints Number of points to generate (default: 100)
 * @returns Array of 3D points representing the orbit
 */
export function calculateKeplerianOrbitPoints(
  orbitalParameters: OrbitalParameters,
  numPoints: number = 100,
): OSVector3[] {
  const points: OSVector3[] = [];
  const period = orbitalParameters.period;

  // Generate points over one complete orbital period
  for (let i = 0; i < numPoints; i++) {
    const time = (i / (numPoints - 1)) * period;
    const state = calculateKeplerianStateAtTime(orbitalParameters, time);
    points.push(state.position);
  }

  return points;
}

/**
 * Calculate Keplerian state at a specific time
 * @param orbitalParameters The orbital parameters
 * @param time Time since epoch
 * @returns Position and velocity at the given time
 */
export function calculateKeplerianStateAtTime(
  orbitalParameters: OrbitalParameters,
  time: number,
): { position: OSVector3; velocity: OSVector3 } {
  // Implementation of Keplerian orbital mechanics
  // This would use the standard orbital elements to calculate position and velocity
  // at any given time

  // For now, return a placeholder implementation
  return {
    position: new OSVector3(0, 0, 0),
    velocity: new OSVector3(0, 0, 0),
  };
}

/**
 * Calculate current Keplerian state
 * @param orbitalParameters The orbital parameters
 * @param currentTime Current simulation time
 * @returns Current position and velocity
 */
export function calculateCurrentKeplerianState(
  orbitalParameters: OrbitalParameters,
  currentTime: number,
): { position: OSVector3; velocity: OSVector3 } {
  return calculateKeplerianStateAtTime(orbitalParameters, currentTime);
}
```

### Step 1.2: Create Orbital Data Manager

**File**: `packages/core/physics/src/orbital/managers/KeplerianOrbitManager.ts`

**Purpose**: Provide Keplerian orbit data with caching for static calculations

```typescript
import { OSVector3 } from "@teskooano/core-math";
import { OrbitalParameters } from "@teskooano/data-types";
import { calculateKeplerianOrbitPoints } from "../calculations";

/**
 * Manager for Keplerian orbit data
 * Calculates orbit points once per simulation and caches them
 */
export class KeplerianOrbitManager {
  private static orbitCache = new Map<string, OSVector3[]>();
  private static readonly DEFAULT_POINTS = 1200;

  /**
   * Get orbit points for a celestial object
   * Calculates once and caches for the entire simulation
   */
  static getOrbitPoints(
    objectId: string,
    orbitalParameters: OrbitalParameters,
    numPoints?: number,
  ): OSVector3[] {
    const cacheKey = `${objectId}_${numPoints || this.DEFAULT_POINTS}`;

    // Check cache first
    if (this.orbitCache.has(cacheKey)) {
      return this.orbitCache.get(cacheKey)!;
    }

    // Calculate orbit points (only once per simulation)
    const points = calculateKeplerianOrbitPoints(
      orbitalParameters,
      numPoints || this.DEFAULT_POINTS,
    );

    // Cache the result
    this.orbitCache.set(cacheKey, points);

    return points;
  }

  /**
   * Clear orbit cache (useful when simulation parameters change)
   */
  static clearCache(): void {
    this.orbitCache.clear();
  }

  /**
   * Remove specific object from cache
   */
  static removeFromCache(objectId: string): void {
    const keysToRemove = Array.from(this.orbitCache.keys()).filter((key) =>
      key.startsWith(`${objectId}_`),
    );

    keysToRemove.forEach((key) => {
      this.orbitCache.delete(key);
    });
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.orbitCache.size,
      keys: Array.from(this.orbitCache.keys()),
    };
  }
}
```

### Step 1.3: Create N-Body Trail Manager

**File**: `packages/core/physics/src/orbital/managers/NBodyTrailManager.ts`

**Purpose**: Provide N-body trail data for dynamic position history

```typescript
import { OSVector3 } from "@teskooano/core-math";
import { RenderableCelestialObject } from "@teskooano/data-types";

/**
 * Manager for N-body trail data
 * Manages position history for trail rendering in N-body mode
 */
export class NBodyTrailManager {
  private static positionHistory = new Map<string, OSVector3[]>();
  private static readonly MAX_HISTORY_LENGTH = 1000; // Maximum trail length - this is multiplied by the state value and by default it's 10, so this will in reality be 10000

  /**
   * Add current position to history for a celestial object
   * Called each frame in N-body mode
   */
  static addPosition(objectId: string, position: OSVector3): void {
    if (!this.positionHistory.has(objectId)) {
      this.positionHistory.set(objectId, []);
    }

    const history = this.positionHistory.get(objectId)!;
    history.push(position);

    // Limit history length
    if (history.length > this.MAX_HISTORY_LENGTH) {
      history.shift(); // Remove oldest position
    }
  }

  /**
   * Get trail points for a celestial object
   * Returns position history for trail rendering
   */
  static getTrailPoints(objectId: string): OSVector3[] {
    return this.positionHistory.get(objectId) || [];
  }

  /**
   * Get trail points with length limit
   * Useful for performance optimization
   */
  static getTrailPointsLimited(
    objectId: string,
    maxLength: number,
  ): OSVector3[] {
    const history = this.positionHistory.get(objectId) || [];
    return history.slice(-maxLength); // Return last N positions
  }

  /**
   * Clear trail history for a specific object
   */
  static clearTrail(objectId: string): void {
    this.positionHistory.delete(objectId);
  }

  /**
   * Clear all trail history
   */
  static clearAllTrails(): void {
    this.positionHistory.clear();
  }

  /**
   * Get trail statistics
   */
  static getTrailStats(): { objectCount: number; totalPositions: number } {
    let totalPositions = 0;
    this.positionHistory.forEach((history) => {
      totalPositions += history.length;
    });

    return {
      objectCount: this.positionHistory.size,
      totalPositions,
    };
  }
}
```

### Step 1.4: Create Prediction Manager

**File**: `packages/core/physics/src/orbital/managers/PredictionManager.ts`

**Purpose**: Provide prediction data when enabled

```typescript
import { OSVector3 } from "@teskooano/core-math";
import { OrbitalParameters } from "@teskooano/data-types";
import { calculateKeplerianStateAtTime } from "../calculations";

/**
 * Manager for orbital prediction data
 * Calculates future positions when predictions are enabled
 */
export class PredictionManager {
  private static predictionCache = new Map<
    string,
    { points: OSVector3[]; timestamps: number[] }
  >();
  private static readonly PREDICTION_STEPS = 365; // 1 year ahead
  private static readonly PREDICTION_INTERVAL = 24 * 60 * 60; // 1 day intervals

  /**
   * Calculate prediction points for a celestial object
   * @param objectId Unique identifier for the object
   * @param orbitalParameters Current orbital parameters
   * @param currentTime Current simulation time
   * @returns Prediction points and timestamps
   */
  static getPredictionPoints(
    objectId: string,
    orbitalParameters: OrbitalParameters,
    currentTime: number,
  ): { points: OSVector3[]; timestamps: number[] } {
    const cacheKey = `${objectId}_${currentTime}`;

    // Check cache first
    if (this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey)!;
    }

    const points: OSVector3[] = [];
    const timestamps: number[] = [];

    // Calculate prediction points
    for (let i = 0; i < this.PREDICTION_STEPS; i++) {
      const predictionTime = currentTime + i * this.PREDICTION_INTERVAL;
      const state = calculateKeplerianStateAtTime(
        orbitalParameters,
        predictionTime,
      );

      points.push(state.position);
      timestamps.push(predictionTime);
    }

    const result = { points, timestamps };

    // Cache the result
    this.predictionCache.set(cacheKey, result);

    return result;
  }

  /**
   * Clear prediction cache
   */
  static clearCache(): void {
    this.predictionCache.clear();
  }

  /**
   * Remove specific object from prediction cache
   */
  static removeFromCache(objectId: string): void {
    const keysToRemove = Array.from(this.predictionCache.keys()).filter((key) =>
      key.startsWith(`${objectId}_`),
    );

    keysToRemove.forEach((key) => {
      this.predictionCache.delete(key);
    });
  }

  /**
   * Get prediction cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.predictionCache.size,
      keys: Array.from(this.predictionCache.keys()),
    };
  }
}
```

### Step 1.5: Create Unified Orbital Data Provider

**File**: `packages/core/physics/src/orbital/providers/OrbitalProvider.ts`

**Purpose**: Provide unified access to all orbital data types

```typescript
import { OSVector3 } from "@teskooano/core-math";
import {
  OrbitalParameters,
  RenderableCelestialObject,
  SimulationMode,
} from "@teskooano/data-types";
import { KeplerianOrbitManager } from "../managers/KeplerianOrbitManager";
import { NBodyTrailManager } from "../managers/NBodyTrailManager";
import { PredictionManager } from "../managers/PredictionManager";

/**
 * Unified provider for all orbital data types
 * Coordinates access to Keplerian, N-body, and prediction data
 */
export class OrbitalProvider {
  /**
   * Get Keplerian orbit points (calculated once per simulation)
   * Available in all simulation modes
   */
  static getKeplerianOrbitPoints(
    objectId: string,
    orbitalParameters: OrbitalParameters,
    numPoints?: number,
  ): OSVector3[] {
    return KeplerianOrbitManager.getOrbitPoints(
      objectId,
      orbitalParameters,
      numPoints,
    );
  }

  /**
   * Add current position to N-body trail history
   * Only called in N-body simulation mode
   */
  static addNBodyPosition(objectId: string, position: OSVector3): void {
    NBodyTrailManager.addPosition(objectId, position);
  }

  /**
   * Get N-body trail points
   * Only available in N-body simulation mode
   */
  static getNBodyTrailPoints(
    objectId: string,
    maxLength?: number,
  ): OSVector3[] {
    if (maxLength) {
      return NBodyTrailManager.getTrailPointsLimited(objectId, maxLength);
    }
    return NBodyTrailManager.getTrailPoints(objectId);
  }

  /**
   * Get prediction points (when predictions are enabled)
   */
  static getPredictionPoints(
    objectId: string,
    orbitalParameters: OrbitalParameters,
    currentTime: number,
  ): { points: OSVector3[]; timestamps: number[] } {
    return PredictionManager.getPredictionPoints(
      objectId,
      orbitalParameters,
      currentTime,
    );
  }

  /**
   * Clear all caches and history
   */
  static clearAll(): void {
    KeplerianOrbitManager.clearCache();
    NBodyTrailManager.clearAllTrails();
    PredictionManager.clearCache();
  }

  /**
   * Get statistics for all providers
   */
  static getStats(): {
    keplerianCache: { size: number; keys: string[] };
    nBodyTrails: { objectCount: number; totalPositions: number };
    predictionCache: { size: number; keys: string[] };
  } {
    return {
      keplerianCache: KeplerianOrbitManager.getCacheStats(),
      nBodyTrails: NBodyTrailManager.getTrailStats(),
      predictionCache: PredictionManager.getCacheStats(),
    };
  }
}
```

## 🎯 **Key Implementation Details**

### **Keplerian Orbit Points**

- **Calculated once per simulation** when first requested
- **Cached for entire simulation duration**
- **Available in all simulation modes** (Keplerian and N-body)
- **Static data** - doesn't change during simulation

### **N-Body Trail Points**

- **Dynamic position history** updated each frame
- **Only available in N-body simulation mode**
- **Limited history length** for performance
- **Real-time updates** as objects move

### **Prediction Points**

- **Calculated on-demand** when predictions are enabled
- **Cached with time-based keys** for efficiency
- **1 year ahead** with daily intervals
- **Optional feature** - only when turned on

### **Data Usage by Mode**

| Mode          | Keplerian Points | Trail Points | Prediction Points |
| ------------- | ---------------- | ------------ | ----------------- |
| **Keplerian** | ✅ Rendered      | ❌ Not used  | ✅ Optional       |
| **N-Body**    | ✅ Rendered      | ✅ Rendered  | ✅ Optional       |

This ensures that:

1. **Keplerian orbit points are calculated once** and reused
2. **Trail points are only used in N-body mode**
3. **Predictions are optional** in both modes
4. **Performance is optimized** with appropriate caching
