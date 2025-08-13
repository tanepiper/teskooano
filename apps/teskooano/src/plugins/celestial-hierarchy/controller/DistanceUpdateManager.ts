import { METERS_TO_SCENE_UNITS } from "@teskooano/data-values";
import { CelestialObject } from "@teskooano/data-types";
import * as THREE from "three";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { computeDistanceMeters } from "../utils/distance.js";

/**
 * Manages distance calculations and list reordering for celestial objects.
 */
export class DistanceUpdateManager {
  private _treeListContainer: HTMLUListElement;
  private _destroyedListContainer: HTMLUListElement;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _listUpdateInterval: number | null = null;
  private _getCurrentObjects: () => Record<string, CelestialObject>;

  constructor(
    treeListContainer: HTMLUListElement,
    destroyedListContainer: HTMLUListElement,
    getCurrentObjects: () => Record<string, CelestialObject>,
  ) {
    this._treeListContainer = treeListContainer;
    this._destroyedListContainer = destroyedListContainer;
    this._getCurrentObjects = getCurrentObjects;
  }

  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
  }

  public startPeriodicUpdates(): void {
    this._listUpdateInterval = window.setInterval(
      () => this.updateAndReorderList(),
      500,
    );
  }

  public stopPeriodicUpdates(): void {
    if (this._listUpdateInterval) {
      window.clearInterval(this._listUpdateInterval);
      this._listUpdateInterval = null;
    }
  }

  public forceDistanceUpdate(): void {
    if (!this._parentPanel) return;
    const renderer = this._parentPanel.getRenderer();
    if (!renderer) return;

    const allObjects = this._getCurrentObjects();
    const origin = new THREE.Vector3(0, 0, 0);
    const worldPosition = new THREE.Vector3();
    const parentWorldPosition = new THREE.Vector3();
    const SCENE_UNITS_TO_METERS = 1 / METERS_TO_SCENE_UNITS;

    const allRows = [
      ...Array.from(
        this._treeListContainer.querySelectorAll<any>("celestial-row"),
      ),
      ...Array.from(
        this._destroyedListContainer.querySelectorAll<any>("celestial-row"),
      ),
    ];

    allRows.forEach((row) => {
      const objectId = row.getAttribute("object-id");
      if (!objectId) return;

      const celestialObj = allObjects[objectId];
      const sceneObject =
        renderer.renderingOrchestrator.objectManager.getObject(objectId);
      if (!celestialObj) return;

      const distanceMeters = computeDistanceMeters(
        celestialObj,
        allObjects,
        sceneObject,
        renderer,
        origin,
        worldPosition,
        parentWorldPosition,
        SCENE_UNITS_TO_METERS,
      );

      if (typeof row.updateDistance === "function") {
        row.updateDistance(distanceMeters);
      }
    });
  }

  private updateAndReorderList(): void {
    if (!this._parentPanel) return;
    const renderer = this._parentPanel.getRenderer();
    if (!renderer) return;

    const allObjects = this._getCurrentObjects();
    if (Object.keys(allObjects).length === 0) return;

    const origin = new THREE.Vector3(0, 0, 0);
    const worldPosition = new THREE.Vector3();
    const parentWorldPosition = new THREE.Vector3();
    const SCENE_UNITS_TO_METERS = 1 / METERS_TO_SCENE_UNITS;

    // Update distances for both active and destroyed objects
    const allListItems = [
      ...Array.from(
        this._treeListContainer.querySelectorAll<HTMLLIElement>("li[data-id]"),
      ),
      ...Array.from(
        this._destroyedListContainer.querySelectorAll<HTMLLIElement>(
          "li[data-id]",
        ),
      ),
    ];

    allListItems.forEach((li) => {
      const id = li.dataset.id;
      if (!id) return;

      const celestialObj = allObjects[id];
      const sceneObject =
        renderer.renderingOrchestrator.objectManager.getObject(id);
      if (!celestialObj) return;

      const distanceMeters = computeDistanceMeters(
        celestialObj,
        allObjects,
        sceneObject,
        renderer,
        origin,
        worldPosition,
        parentWorldPosition,
        SCENE_UNITS_TO_METERS,
      );

      li.dataset.distance = distanceMeters.toString();
      const row = li.querySelector<any>("celestial-row");
      if (row && typeof row.updateDistance === "function") {
        row.updateDistance(distanceMeters);
      }
    });

    this._reorderLists();
  }

  private _reorderLists(): void {
    // Reorder active objects list only (destroyed objects stay in simple list order)
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
