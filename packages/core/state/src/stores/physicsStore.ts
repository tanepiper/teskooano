import { BehaviorSubject, Observable } from "rxjs";
import type { OSVector3 } from "@teskooano/core-math";

/**
 * Manages physics-related state like acceleration vectors.
 * Pure data store with no business logic.
 */
export class PhysicsStore {
  private static instance: PhysicsStore;

  private readonly _accelerationVectors: BehaviorSubject<
    Record<string, OSVector3>
  >;
  public readonly accelerationVectors$: Observable<Record<string, OSVector3>>;

  private constructor() {
    this._accelerationVectors = new BehaviorSubject<Record<string, OSVector3>>(
      {},
    );
    this.accelerationVectors$ = this._accelerationVectors.asObservable();
  }

  public static getInstance(): PhysicsStore {
    if (!PhysicsStore.instance) {
      PhysicsStore.instance = new PhysicsStore();
    }
    return PhysicsStore.instance;
  }

  public getAccelerationVectors(): Record<string, OSVector3> {
    return this._accelerationVectors.getValue();
  }

  public updateAccelerationVectors(vectors: Map<string, OSVector3>): void {
    const vectorsRecord: Record<string, OSVector3> = {};
    vectors.forEach((vec, id) => {
      vectorsRecord[id] = vec;
    });
    this._accelerationVectors.next(vectorsRecord);
  }

  public setAccelerationVector(id: string, vector: OSVector3): void {
    const current = this._accelerationVectors.getValue();
    this._accelerationVectors.next({ ...current, [id]: vector });
  }

  public removeAccelerationVector(id: string): void {
    const current = this._accelerationVectors.getValue();
    if (current[id]) {
      const newVectors = { ...current };
      delete newVectors[id];
      this._accelerationVectors.next(newVectors);
    }
  }

  public clearAccelerationVectors(): void {
    this._accelerationVectors.next({});
  }
}

export const physicsStore = PhysicsStore.getInstance();
