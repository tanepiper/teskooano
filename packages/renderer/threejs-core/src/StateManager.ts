import { OSVector3 } from "@teskooano/core-math";
import {
  celestialObjects$,
  getCelestialObjects,
  getSimulationState,
  simulationState$,
} from "@teskooano/core-state";
import type { CelestialObject } from "@teskooano/data-types";
import { Subscription } from "rxjs";
import { pairwise, startWith } from "rxjs/operators";

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
  private unsubscribes: Subscription[] = [];

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
    const simUnsubscribe = simulationState$.subscribe((state) => {
      this.cameraSubscribers.forEach((callback) => {
        callback(state.camera.position, state.camera.target);
      });
    });

    const initialObjects = getCelestialObjects();
    const objUnsubscribe = celestialObjects$
      .pipe(startWith(initialObjects), pairwise())
      .subscribe(([prevObjects, newObjects]) => {
        const safePrevObjects = prevObjects ?? {};

        for (const id in newObjects) {
          const object = newObjects[id] as RendererCelestialObject;

          if (!safePrevObjects[id]) {
            this.objectSubscribers.forEach((callback) => {
              callback("add", object, id);
            });
          } else {
            const prevObject = safePrevObjects[id];

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
              physicsChanged = true;
            }

            if (physicsChanged) {
              this.objectSubscribers.forEach((callback) => {
                callback("update", object, id);
              });
            }
          }
        }

        for (const id in safePrevObjects) {
          if (!newObjects[id]) {
            this.objectSubscribers.forEach((callback) => {
              callback(
                "remove",
                safePrevObjects[id] as RendererCelestialObject,
                id,
              );
            });
          }
        }
      });

    this.unsubscribes.push(simUnsubscribe, objUnsubscribe);
  }

  /**
   * Subscribe to object state changes
   */
  onObjectsChange(callback: ObjectStateCallback): () => void {
    this.objectSubscribers.add(callback);

    return () => {
      this.objectSubscribers.delete(callback);
    };
  }

  /**
   * Subscribe to camera state changes
   */
  onCameraChange(callback: CameraStateCallback): () => void {
    this.cameraSubscribers.add(callback);

    return () => {
      this.cameraSubscribers.delete(callback);
    };
  }

  /**
   * Get all current celestial objects
   */
  getAllObjects(): Record<string, RendererCelestialObject> {
    return getCelestialObjects() as Record<string, RendererCelestialObject>;
  }

  /**
   * Add an unsubscribe function to be called during cleanup
   */
  addUnsubscribe(unsubscribe: Subscription): void {
    this.unsubscribes.push(unsubscribe);
  }

  /**
   * Dispose of all resources and unsubscribe from state
   */
  dispose(): void {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe.unsubscribe());
    this.unsubscribes = [];
    this.objectSubscribers.clear();
    this.cameraSubscribers.clear();
  }
}
