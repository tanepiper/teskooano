import { CelestialObject, CelestialType } from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { CelestialDistanceService } from "@teskooano/core-physics";
import { physicsSystemAdapter } from "@teskooano/core-state";
import type { PhysicsStateReal } from "@teskooano/data-types";
import { DistanceStateService } from "../services/DistanceStateService.js";

/**
 * Manages distance calculations and list reordering for celestial objects.
 *
 * This manager reads the current physics state and updates the UI components
 * with distance information and reorders the celestial hierarchy tree based
 * on distance from the origin.
 */
export class DistanceUpdateManager {
  private _treeListContainer: HTMLUListElement;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _listUpdateInterval: number | null = null;
  private _getCurrentObjects: () => Record<string, CelestialObject>;
  private _CelestialDistanceService: CelestialDistanceService;
  private _distanceStateService: DistanceStateService;

  constructor(
    treeListContainer: HTMLUListElement,
    _destroyedListContainer: HTMLUListElement,
    getCurrentObjects: () => Record<string, CelestialObject>,
  ) {
    this._treeListContainer = treeListContainer;
    // Note: _destroyedListContainer parameter kept for API compatibility but not used
    this._getCurrentObjects = getCurrentObjects;
    this._CelestialDistanceService = CelestialDistanceService.getInstance();
    this._distanceStateService = DistanceStateService.getInstance();
  }

  /**
   * Sets the parent panel reference for accessing the renderer.
   *
   * @param panel - The composite engine panel
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
  }

  /**
   * Starts periodic distance updates every 500ms.
   */
  public startPeriodicUpdates(): void {
    this._listUpdateInterval = window.setInterval(
      () => this.updateAndReorderList(),
      500,
    );
  }

  /**
   * Stops periodic distance updates.
   */
  public stopPeriodicUpdates(): void {
    if (this._listUpdateInterval) {
      window.clearInterval(this._listUpdateInterval);
      this._listUpdateInterval = null;
    }
  }

  /**
   * Forces an immediate distance update and list reordering.
   */
  public forceDistanceUpdate(): void {
    this.updateAndReorderList();
  }

  /**
   * Updates distances for all celestial objects and reorders the hierarchy tree.
   */
  private updateAndReorderList(): void {
    if (!this._parentPanel) return;

    const renderer = this._parentPanel.getRenderer();
    if (!renderer) return;

    const allObjects = this._getCurrentObjects();
    if (Object.keys(allObjects).length === 0) return;

    this._updateDistancesFromPhysicsState();
    this._reorderLists();
  }

  /**
   * Updates distances by reading the current physics state and calculating
   * distances from each object to its parent (or main star if no parent).
   *
   * Note: Distance calculation uses plain math and does NOT depend on WASM
   * initialization. The WASM update is optional and used for spatial queries
   * elsewhere in the system.
   */
  private _updateDistancesFromPhysicsState(): void {
    try {
      // Get current physics bodies from the state
      const physicsBodies = physicsSystemAdapter.getPhysicsBodies();
      if (physicsBodies.length === 0) return;

      // Get all celestial objects to check parent relationships
      const allObjects = this._getCurrentObjects();

      // Update WASM spatial partitioning with current positions (optional)
      // This keeps spatial queries in sync but isn't required for distance calculation
      if (this._CelestialDistanceService.isInitialized()) {
        try {
          this._CelestialDistanceService.update(physicsBodies);
        } catch (wasmError) {
          // WASM update failed - continue with distance calculation anyway
          console.debug(
            "[DistanceUpdateManager] WASM update skipped:",
            wasmError,
          );
        }
      }

      // Calculate distances from each object to its parent
      const distances = new Map<string, number>();

      physicsBodies.forEach((body) => {
        const celestialObj = allObjects[body.id];
        if (!celestialObj) return;

        const bodyId = String(body.id);

        if (celestialObj.parentId) {
          // Object has a parent - calculate distance to parent
          const parentBody = physicsBodies.find(
            (p) => p.id === celestialObj.parentId,
          );
          if (parentBody) {
            const distance = body.position_m.distanceTo(parentBody.position_m);
            distances.set(bodyId, distance);
          }
        } else {
          // Object has no parent - calculate distance to main star
          const mainStar = this._findMainStar(physicsBodies);
          if (mainStar && mainStar.id !== body.id) {
            const distance = body.position_m.distanceTo(mainStar.position_m);
            distances.set(bodyId, distance);
          } else {
            // This is the main star itself
            distances.set(bodyId, 0);
          }
        }
      });

      // Update the distance state service with calculated distances
      this._distanceStateService.updateDistances(distances);
    } catch (error) {
      console.error(
        "[DistanceUpdateManager] Distance calculation failed:",
        error,
      );
    }
  }

  /**
   * Finds the main star (primary star) of the system.
   *
   * @param physicsBodies - Array of physics bodies to search through
   * @returns The main star's physics state or null if not found
   */
  private _findMainStar(
    physicsBodies: PhysicsStateReal[],
  ): PhysicsStateReal | null {
    // Get all celestial objects to check their types
    const allObjects = this._getCurrentObjects();

    // Find the primary star (star with no parent or the most massive star)
    const stars = physicsBodies.filter((body) => {
      const celestialObj = allObjects[body.id];
      return celestialObj && celestialObj.type === CelestialType.STAR;
    });

    if (stars.length === 0) return null;

    // If there's only one star, it's the main star
    if (stars.length === 1) return stars[0];

    // If multiple stars, find the one with no parent (primary star)
    const primaryStar = stars.find((star) => {
      const celestialObj = allObjects[star.id];
      return celestialObj && !celestialObj.parentId;
    });

    if (primaryStar) return primaryStar;

    // Fallback: return the most massive star
    return stars.reduce((max, current) =>
      current.mass_kg > max.mass_kg ? current : max,
    );
  }

  /**
   * Reorders the celestial hierarchy tree based on distance from the main star.
   * Only reorders active objects; destroyed objects maintain their list order.
   */
  private _reorderLists(): void {
    const listsToSort =
      this._treeListContainer.querySelectorAll<HTMLUListElement>(
        "ul#focus-tree-list, ul.nested",
      );

    listsToSort.forEach((list) => {
      const currentChildren = Array.from(
        list.querySelectorAll<HTMLLIElement>(":scope > li[data-id]"),
      );

      // Create a new array that can be sorted without affecting the live NodeList
      const sortedChildren = [...currentChildren];
      const currentDistances = this._distanceStateService.getCurrentDistances();

      sortedChildren.sort((a, b) => {
        const idA = a.dataset.id;
        const idB = b.dataset.id;
        if (!idA || !idB) return 0;

        const distA = currentDistances.get(idA) ?? 0;
        const distB = currentDistances.get(idB) ?? 0;
        return distA - distB;
      });

      // Check if the current DOM order matches the desired sorted order
      const orderHasChanged = currentChildren.some(
        (child, index) => child.dataset.id !== sortedChildren[index].dataset.id,
      );

      // Only manipulate the DOM if the order has actually changed
      if (orderHasChanged) {
        sortedChildren.forEach((child) => list.appendChild(child));
      }
    });
  }
}
