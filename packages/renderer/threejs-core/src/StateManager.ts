import { OSVector3 } from "@teskooano/core-math";
import { celestialObjectsStore, simulationState } from "@teskooano/core-state";
import type { CelestialObject } from "@teskooano/data-types";

/**
 * Interface for extended celestial object with renderer-specific properties
 */
export interface RendererCelestialObject extends CelestialObject {
  orbitalParameters?: any;
  parentId?: string;
}

/**
 * Callback type for object state changes
 */
export type ObjectStateCallback = (
  action: "add" | "update" | "remove",
  object: RendererCelestialObject,
  id: string,
) => void;

/**
 * Callback type for camera state changes
 */
export type CameraStateCallback = (
  position: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
) => void;

/**
 * Manages state subscriptions and updates for the renderer
 */
export class StateManager {
  private objectSubscribers: Set<ObjectStateCallback> = new Set();
  private cameraSubscribers: Set<CameraStateCallback> = new Set();
  private unsubscribes: (() => void)[] = [];

  /**
   * Create a new StateManager
   */
  constructor() {
    this.subscribeToStateChanges();
  }

  /**
   * Subscribe to state changes
   */
  private subscribeToStateChanges(): void {
    // Subscribe to simulation state changes (camera, etc.)
    const simUnsubscribe = simulationState.subscribe((state) => {
      // Notify camera subscribers
      this.cameraSubscribers.forEach((callback) => {
        callback(state.camera.position, state.camera.target);
      });
    });

    // Subscribe to celestial objects changes
    const objUnsubscribe = celestialObjectsStore.subscribe(
      (newObjects, prevObjects) => {
        // Process added and updated objects
        for (const id in newObjects) {
          const object = newObjects[id] as RendererCelestialObject;

          if (!prevObjects || !prevObjects[id]) {
            // New object
            this.objectSubscribers.forEach((callback) => {
              callback("add", object, id);
            });
          } else {
            // Check if object has changed - focusing on physics state
            const prevObject = prevObjects[id];

            // Compare physicsStateReal for position/velocity changes
            let physicsChanged = false;
            const currentPhysics = object.physicsStateReal;
            const prevPhysics = prevObject.physicsStateReal;

            if (
              currentPhysics &&
              prevPhysics &&
              currentPhysics.position_m instanceof OSVector3 &&
              prevPhysics.position_m instanceof OSVector3 &&
              currentPhysics.velocity_mps instanceof OSVector3 &&
              prevPhysics.velocity_mps instanceof OSVector3
            ) {
              const posChanged =
                currentPhysics.position_m.x !== prevPhysics.position_m.x ||
                currentPhysics.position_m.y !== prevPhysics.position_m.y ||
                currentPhysics.position_m.z !== prevPhysics.position_m.z;

              const velChanged =
                currentPhysics.velocity_mps.x !== prevPhysics.velocity_mps.x ||
                currentPhysics.velocity_mps.y !== prevPhysics.velocity_mps.y ||
                currentPhysics.velocity_mps.z !== prevPhysics.velocity_mps.z;

              physicsChanged = posChanged || velChanged;
            } else if (currentPhysics !== prevPhysics) {
              // Fallback if state objects themselves changed (e.g., one added/removed)
              physicsChanged = true;
            }

            // Rotation change can still be checked on the top level if needed,
            // but it's not typically driven by physics state.
            // Consider if rotation updates need a separate mechanism.

            if (physicsChanged) {
              // Trigger update if physics state changed
              // Object has been updated
              this.objectSubscribers.forEach((callback) => {
                callback("update", object, id);
              });
            }
          }
        }

        // Process removed objects
        if (prevObjects) {
          for (const id in prevObjects) {
            if (!newObjects[id]) {
              // Object was removed
              this.objectSubscribers.forEach((callback) => {
                callback(
                  "remove",
                  prevObjects[id] as RendererCelestialObject,
                  id,
                );
              });
            }
          }
        }
      },
    );

    this.unsubscribes.push(simUnsubscribe, objUnsubscribe);
  }

  /**
   * Subscribe to object state changes
   */
  onObjectsChange(callback: ObjectStateCallback): () => void {
    this.objectSubscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.objectSubscribers.delete(callback);
    };
  }

  /**
   * Subscribe to camera state changes
   */
  onCameraChange(callback: CameraStateCallback): () => void {
    this.cameraSubscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.cameraSubscribers.delete(callback);
    };
  }

  /**
   * Get all current celestial objects
   */
  getAllObjects(): Record<string, RendererCelestialObject> {
    return celestialObjectsStore.get() as Record<
      string,
      RendererCelestialObject
    >;
  }

  /**
   * Add an unsubscribe function to be called during cleanup
   */
  addUnsubscribe(unsubscribe: () => void): void {
    this.unsubscribes.push(unsubscribe);
  }

  /**
   * Dispose of all resources and unsubscribe from state
   */
  dispose(): void {
    // Call all unsubscribe functions
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes = [];
    this.objectSubscribers.clear();
    this.cameraSubscribers.clear();
  }
}
