import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Service for managing celestial object distances in a reactive way.
 *
 * This service provides a centralized way to manage distance data for celestial objects
 * without directly manipulating the DOM. Components can subscribe to distance updates
 * for specific objects or all objects.
 */
export class DistanceStateService {
  private static _instance: DistanceStateService | null = null;
  private _distances$ = new BehaviorSubject<Map<string, number>>(new Map());

  private constructor() {}

  /**
   * Gets the singleton instance of the DistanceStateService.
   */
  public static getInstance(): DistanceStateService {
    if (!DistanceStateService._instance) {
      DistanceStateService._instance = new DistanceStateService();
    }
    return DistanceStateService._instance;
  }

  /**
   * Updates the distance for a specific celestial object.
   *
   * @param objectId - The ID of the celestial object
   * @param distanceInMeters - The distance in meters
   */
  public updateDistance(objectId: string, distanceInMeters: number): void {
    const currentDistances = new Map(this._distances$.value);
    currentDistances.set(objectId, distanceInMeters);
    this._distances$.next(currentDistances);
  }

  /**
   * Updates distances for multiple celestial objects at once.
   *
   * @param distances - Map of object IDs to distances in meters
   */
  public updateDistances(distances: Map<string, number>): void {
    this._distances$.next(new Map(distances));
  }

  /**
   * Gets the current distance for a specific object.
   *
   * @param objectId - The ID of the celestial object
   * @returns The distance in meters, or undefined if not found
   */
  public getDistance(objectId: string): number | undefined {
    return this._distances$.value.get(objectId);
  }

  /**
   * Gets an observable that emits the distance for a specific object.
   *
   * @param objectId - The ID of the celestial object
   * @returns Observable that emits the distance in meters
   */
  public getDistance$(objectId: string): Observable<number | undefined> {
    return this._distances$.pipe(map((distances) => distances.get(objectId)));
  }

  /**
   * Gets an observable that emits all current distances.
   *
   * @returns Observable that emits a Map of object IDs to distances
   */
  public getAllDistances$(): Observable<Map<string, number>> {
    return this._distances$.asObservable();
  }

  /**
   * Removes the distance data for a specific object.
   *
   * @param objectId - The ID of the celestial object to remove
   */
  public removeDistance(objectId: string): void {
    const currentDistances = new Map(this._distances$.value);
    currentDistances.delete(objectId);
    this._distances$.next(currentDistances);
  }

  /**
   * Clears all distance data.
   */
  public clearAllDistances(): void {
    this._distances$.next(new Map());
  }

  /**
   * Gets the current state of all distances.
   *
   * @returns Map of object IDs to distances in meters
   */
  public getCurrentDistances(): Map<string, number> {
    return new Map(this._distances$.value);
  }
}
