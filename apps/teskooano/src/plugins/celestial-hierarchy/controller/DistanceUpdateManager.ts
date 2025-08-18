import { CelestialObject, CelestialType } from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { WasmSpatialService } from "@teskooano/core-physics";
import { OSVector3 } from "@teskooano/core-math";
import { physicsSystemAdapter } from "@teskooano/core-state";
import type { PhysicsStateReal } from "@teskooano/data-types";

/**
 * Manages distance calculations and list reordering for celestial objects.
 *
 * This manager reads the current physics state and updates the UI components
 * with distance information and reorders the celestial hierarchy tree based
 * on distance from the origin.
 */
export class DistanceUpdateManager {
  private _treeListContainer: HTMLUListElement;
  private _destroyedListContainer: HTMLUListElement;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _listUpdateInterval: number | null = null;
  private _getCurrentObjects: () => Record<string, CelestialObject>;
  private _wasmSpatialService: WasmSpatialService;

  constructor(
    treeListContainer: HTMLUListElement,
    destroyedListContainer: HTMLUListElement,
    getCurrentObjects: () => Record<string, CelestialObject>,
  ) {
    this._treeListContainer = treeListContainer;
    this._destroyedListContainer = destroyedListContainer;
    this._getCurrentObjects = getCurrentObjects;
    this._wasmSpatialService = WasmSpatialService.getInstance();
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
   */
  private _updateDistancesFromPhysicsState(): void {
    if (!this._wasmSpatialService.isInitialized()) return;

    try {
      // Get current physics bodies from the state
      const physicsBodies = physicsSystemAdapter.getPhysicsBodies();
      if (physicsBodies.length === 0) return;

      // Get all celestial objects to check parent relationships
      const allObjects = this._getCurrentObjects();

      // Update WASM spatial partitioning with current positions
      this._wasmSpatialService.update(physicsBodies);

      // Calculate distances from each object to its parent
      const distances = new Map<string | number, number>();

      physicsBodies.forEach((body) => {
        const celestialObj = allObjects[body.id];
        if (!celestialObj) return;

        if (celestialObj.parentId) {
          // Object has a parent - calculate distance to parent
          const parentBody = physicsBodies.find(
            (p) => p.id === celestialObj.parentId,
          );
          if (parentBody) {
            const distance = body.position_m.distanceTo(parentBody.position_m);
            distances.set(body.id, distance);
          }
        } else {
          // Object has no parent - calculate distance to main star
          const mainStar = this._findMainStar(physicsBodies);
          if (mainStar && mainStar.id !== body.id) {
            const distance = body.position_m.distanceTo(mainStar.position_m);
            distances.set(body.id, distance);
          } else {
            // This is the main star itself
            distances.set(body.id, 0);
          }
        }
      });

      // Update all list items with calculated distances
      const treeItems = Array.from(
        this._treeListContainer.querySelectorAll<HTMLLIElement>("li[data-id]"),
      );
      const destroyedItems = Array.from(
        this._destroyedListContainer.querySelectorAll<HTMLLIElement>(
          "li[data-id]",
        ),
      );
      const allListItems = [...treeItems, ...destroyedItems];

      allListItems.forEach((li) => {
        const id = li.dataset.id;
        if (!id) return;

        // Try both string and number ID formats
        let distanceMeters = distances.get(id);
        if (distanceMeters === undefined) {
          // Try converting to number if it's a numeric ID
          const numericId = parseInt(id, 10);
          if (!isNaN(numericId)) {
            distanceMeters = distances.get(numericId);
          }
        }

        if (distanceMeters !== undefined) {
          li.dataset.distance = distanceMeters.toString();
          const row = li.querySelector<any>("celestial-row");
          if (row && typeof row.updateDistance === "function") {
            row.updateDistance(distanceMeters);
          }
        }
      });
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
      sortedChildren.sort((a, b) => {
        const distA = parseFloat(a.dataset.distance ?? "0");
        const distB = parseFloat(b.dataset.distance ?? "0");
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
