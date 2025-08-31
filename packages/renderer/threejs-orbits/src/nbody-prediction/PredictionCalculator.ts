import { OSVector3 } from "@teskooano/core-math";
import {
  type RenderableCelestialObject,
  CelestialType,
  CelestialStatus,
} from "@teskooano/data-types";
import { predictTrajectory } from "@teskooano/core-physics";
import {
  StateAccessor,
  physicsSystemAdapter,
  PhysicsStateProvider,
} from "@teskooano/core-state";

/**
 * Handles core prediction calculation logic for celestial object trajectories.
 * Uses WASM spatial partitioning for all predictions.
 */
export class PredictionCalculator {
  private predictionDuration: number = 0;
  private predictionSteps: number = 60;

  /**
   * Sets the prediction duration in seconds
   */
  setPredictionDuration(duration: number): void {
    this.predictionDuration = duration;
  }

  /**
   * Sets the number of prediction steps
   */
  setPredictionSteps(steps: number): void {
    this.predictionSteps = steps;
  }

  /**
   * Calculates prediction trajectory using WASM spatial engine
   */
  async calculatePredictionTrajectory(
    objectId: string,
    relativeToBodyId?: string,
  ): Promise<{ points: OSVector3[]; timestamps: number[] }> {
    try {
      const fullObjectsMap = StateAccessor.getCelestialObjects();
      const targetObject = fullObjectsMap[objectId];

      if (!targetObject) {
        console.warn(`Target object ${objectId} not found for prediction`);
        return { points: [], timestamps: [] };
      }

      const allBodies = physicsSystemAdapter.getPhysicsBodies();

      // Prepare simulation parameters
      const radii = new Map<string | number, number>();
      const bodyTypes = new Map<string | number, CelestialType>();

      // Use pre-filtered physics-active objects instead of manual filtering
      const physicsActiveObjects = StateAccessor.getPhysicsActiveObjects();

      Object.values(physicsActiveObjects).forEach((obj) => {
        const physicsState = PhysicsStateProvider.getPhysicsState(obj);
        if (physicsState) {
          radii.set(obj.id, obj.realRadius_m);
          bodyTypes.set(obj.id, obj.type);
        }
      });

      // Use WASM spatial partitioning for all predictions
      const predictedResult = await predictTrajectory(
        objectId,
        allBodies,
        this.predictionDuration,
        this.predictionSteps,
        {
          relativeToBodyId,
          scaleToSceneUnits: true,
          collisionDetection: false,
          bodyTypes,
          radii,
        },
      );

      if (predictedResult.length < 2) {
        return { points: [], timestamps: [] };
      }

      return {
        points: predictedResult.map((p) => p.point),
        timestamps: predictedResult.map((p) => p.timestamp),
      };
    } catch (error) {
      console.error("Error calculating prediction trajectory:", error);
      return { points: [], timestamps: [] };
    }
  }

  /**
   * Calculates the optimal number of steps for a prediction line based on the
   * orbit's size, ensuring a consistent visual density.
   */
  calculatePredictionSteps(
    object: RenderableCelestialObject,
    allObjects: Record<string, RenderableCelestialObject>,
  ): number {
    const MIN_STEPS = 200;
    const MAX_STEPS = 3000;
    const POINTS_PER_AU_PLANETARY = 500;
    const POINTS_PER_AU_LUNAR = 50000; // High density for moons

    // For moons or any object orbiting another non-star body.
    if (object.parentId) {
      const parent = allObjects[object.parentId];
      if (parent && parent.type !== CelestialType.STAR && parent.position) {
        const distanceToParent_m =
          object.position.distanceTo(parent.position) / 1e9; // Convert to AU
        const circumference_au = 2 * Math.PI * distanceToParent_m;
        const steps = Math.round(circumference_au * POINTS_PER_AU_LUNAR);
        return Math.max(MIN_STEPS, Math.min(steps, MAX_STEPS));
      }
    }

    // Fallback to original logic for planets orbiting a star.
    if (!object.orbit) {
      return MIN_STEPS;
    }

    const circumferenceAU =
      2 * Math.PI * (object.orbit.realSemiMajorAxis_m / 1.496e11); // Convert to AU
    const steps = Math.round(circumferenceAU * POINTS_PER_AU_PLANETARY);

    return Math.max(MIN_STEPS, Math.min(steps, MAX_STEPS));
  }

  /**
   * Determines the reference body for relative coordinates based on object type and system configuration
   */
  determineRelativeBodyId(objectId: string): string | undefined {
    const fullObjectsMap = StateAccessor.getCelestialObjects();
    const renderableObjectsMap = StateAccessor.getRenderableObjects();
    const targetObject = fullObjectsMap[objectId];
    const renderableTargetObject = renderableObjectsMap[objectId];

    if (!targetObject || !renderableTargetObject) {
      return undefined;
    }

    // For moons, always use their parent planet as reference
    if (targetObject.type === CelestialType.MOON) {
      return renderableTargetObject.parentId;
    }

    // For planets and other objects, use their parent star (or absolute in multi-star systems)
    let relativeToBodyId = renderableTargetObject.parentId;

    // Check if this is a multi-star system
    const stars = Object.values(fullObjectsMap).filter(
      (obj) => obj.type === CelestialType.STAR,
    );
    const isMultiStarSystem = stars.length > 1;

    if (isMultiStarSystem && relativeToBodyId) {
      // For multi-star systems, use absolute coordinates for non-moon objects
      relativeToBodyId = undefined;
    }

    return relativeToBodyId;
  }
}
