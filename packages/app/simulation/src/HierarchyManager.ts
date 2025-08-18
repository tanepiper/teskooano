import {
  celestialManager,
  physicsSystemAdapter,
  StateAccessor,
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";
import { WasmSpatialService } from "@teskooano/core-physics";

/**
 * Manages the dynamic hierarchy of celestial objects within the simulation.
 *
 * Simple hierarchy rules:
 * - Main star (largest star) is the root
 * - Other stars can orbit the main star (binary/multiple systems)
 * - Celestials (planets, gas giants, comets, asteroids) orbit stars
 * - Moons orbit planets/gas giants
 * - If moons escape (> 0.1 AU), they become dwarf planets
 * - Satellites can escape planets and become independent
 */
export class HierarchyManager {
  private updateIndex = 0;
  private wasmSpatialService: WasmSpatialService;

  constructor() {
    this.wasmSpatialService = WasmSpatialService.getInstance();
  }

  /**
   * Updates the hierarchies of all celestial objects based on simple rules.
   * Processes one object per tick to avoid performance issues.
   */
  public updateHierarchies(): void {
    const allObjects = StateAccessor.getCurrentCelestialObjects();
    const objectIds = Object.keys(allObjects);
    const allPhysicsStates = physicsSystemAdapter.getPhysicsBodies();

    if (objectIds.length === 0) {
      this.updateIndex = 0;
      return;
    }

    if (this.updateIndex >= objectIds.length) {
      this.updateIndex = 0;
    }

    const objectId = objectIds[this.updateIndex];
    const obj = allObjects[objectId];
    const physicsState = allPhysicsStates.find((p) => p.id === objectId);

    if (
      obj &&
      physicsState &&
      obj.status !== CelestialStatus.DESTROYED &&
      obj.status !== CelestialStatus.ANNIHILATED
    ) {
      this.handleObjectHierarchy(
        obj,
        physicsState,
        allObjects,
        allPhysicsStates,
      );
    }

    this.updateIndex++;
  }

  /**
   * Main hierarchy handler - applies simple rules to each object
   */
  private handleObjectHierarchy(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): void {
    // Skip stars - they maintain their hierarchy
    if (obj.type === CelestialType.STAR) return;

    // Handle moon escape (> 0.1 AU from parent)
    if (obj.type === CelestialType.MOON) {
      this.handleMoonEscape(obj, physicsState, allObjects, allPhysicsStates);
      return;
    }

    // Handle satellite escape
    if (obj.type === CelestialType.SATELLITE) {
      this.handleSatelliteEscape(
        obj,
        physicsState,
        allObjects,
        allPhysicsStates,
      );
      return;
    }

    // Handle orphaned objects (parent destroyed)
    this.handleOrphanedObject(obj, physicsState, allObjects, allPhysicsStates);
  }

  /**
   * Handles moon escape - if moon is > 0.1 AU from parent, it becomes a dwarf planet
   */
  private handleMoonEscape(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): void {
    if (!obj.parentId) return;

    const parent = allObjects[obj.parentId];
    const parentState = allPhysicsStates.find((p) => p.id === obj.parentId);
    if (!parent || !parentState) return;

    const distanceToParent = physicsState.position_m.distanceTo(
      parentState.position_m,
    );
    const escapeDistance = 0.1 * AU_METERS; // 0.1 AU in meters

    if (distanceToParent > escapeDistance) {
      // Moon has escaped - find new parent (usually a star)
      const newParent = this.findBestParent(
        obj,
        physicsState,
        allObjects,
        allPhysicsStates,
      );
      if (newParent) {
        celestialManager.updateObject(obj.id, {
          type: CelestialType.DWARF_PLANET,
          parentId: newParent.id,
        });

        // No need to dispatch events - UI will update via celestialObjects$ subscription
      }
    }
  }

  /**
   * Handles satellite escape - similar to moon escape but for satellites
   */
  private handleSatelliteEscape(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): void {
    if (!obj.parentId) return;

    const parent = allObjects[obj.parentId];
    const parentState = allPhysicsStates.find((p) => p.id === obj.parentId);
    if (!parent || !parentState) return;

    const distanceToParent = physicsState.position_m.distanceTo(
      parentState.position_m,
    );
    const escapeDistance = 0.05 * AU_METERS; // 0.05 AU for satellites

    if (distanceToParent > escapeDistance) {
      // Satellite has escaped - find new parent
      const newParent = this.findBestParent(
        obj,
        physicsState,
        allObjects,
        allPhysicsStates,
      );
      if (newParent) {
        celestialManager.updateObject(obj.id, {
          type: CelestialType.ASTEROID, // Satellites become asteroids when they escape
          parentId: newParent.id,
        });

        // No need to dispatch events - UI will update via celestialObjects$ subscription
      }
    }
  }

  /**
   * Handles orphaned objects (parent destroyed)
   */
  private handleOrphanedObject(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): void {
    const parentId = obj.parentId;
    if (!parentId) return;

    const parent = allObjects[parentId];
    if (!parent || parent.status === CelestialStatus.DESTROYED) {
      // Parent is gone, find a new one
      const newParent = this.findBestParent(
        obj,
        physicsState,
        allObjects,
        allPhysicsStates,
      );
      if (newParent) {
        celestialManager.updateObject(obj.id, {
          parentId: newParent.id,
        });

        // No need to dispatch events - UI will update via celestialObjects$ subscription
      }
    }
  }

  /**
   * Finds the best parent for an object using centralized WASM spatial partitioning
   */
  private findBestParent(
    child: CelestialObject,
    childState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): CelestialObject | null {
    if (!this.wasmSpatialService.isInitialized()) {
      return this.findBestParentTraditional(
        child,
        childState,
        allObjects,
        allPhysicsStates,
      );
    }

    try {
      // Update the centralized WASM spatial service with current positions
      this.wasmSpatialService.update(allPhysicsStates);

      // Use centralized WASM service to find nearby bodies
      const searchDistance = this.getSearchDistance(child);
      const nearbyBodies = this.wasmSpatialService.findBodiesInRange(
        childState.position_m,
        searchDistance,
      );

      let bestParent: CelestialObject | null = null;
      let maxForce = -1;

      for (const nearbyId of nearbyBodies) {
        if (nearbyId === child.id) continue;

        const potentialParent = allObjects[nearbyId];
        const parentState = allPhysicsStates.find((p) => p.id === nearbyId);

        if (
          !potentialParent ||
          !parentState ||
          potentialParent.status === CelestialStatus.DESTROYED
        ) {
          continue;
        }

        // Calculate gravitational force
        const distanceVec = childState.position_m
          .clone()
          .sub(parentState.position_m);
        const distanceSq = distanceVec.lengthSq();

        if (distanceSq === 0) continue;

        const force = potentialParent.realMass_kg / distanceSq;

        if (force > maxForce) {
          maxForce = force;
          bestParent = potentialParent;
        }
      }

      return bestParent;
    } catch (error) {
      console.warn(
        "[HierarchyManager] Centralized WASM spatial partitioning failed, falling back to traditional method:",
        error,
      );
      return this.findBestParentTraditional(
        child,
        childState,
        allObjects,
        allPhysicsStates,
      );
    }
  }

  /**
   * Traditional method for finding best parent (fallback)
   */
  private findBestParentTraditional(
    child: CelestialObject,
    childState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): CelestialObject | null {
    let bestParent: CelestialObject | null = null;
    let maxForce = -1;

    for (const potentialParentId in allObjects) {
      if (potentialParentId === child.id) continue;

      const potentialParent = allObjects[potentialParentId];
      const parentState = allPhysicsStates.find(
        (p) => p.id === potentialParent.id,
      );

      if (
        !potentialParent ||
        !parentState ||
        potentialParent.status === CelestialStatus.DESTROYED
      ) {
        continue;
      }

      const distanceVec = childState.position_m
        .clone()
        .sub(parentState.position_m);
      const distanceSq = distanceVec.lengthSq();

      if (distanceSq === 0) continue;

      const force = potentialParent.realMass_kg / distanceSq;

      if (force > maxForce) {
        maxForce = force;
        bestParent = potentialParent;
      }
    }

    return bestParent;
  }

  /**
   * Gets appropriate search distance based on object type
   * Returns distance in scene units (1 unit = 1 AU)
   * Increased for extremely large-scale simulations with escaping objects
   */
  private getSearchDistance(obj: CelestialObject): number {
    switch (obj.type) {
      case CelestialType.MOON:
        return 1000000; // 100,000 AU - moons can escape very far from parent
      case CelestialType.SATELLITE:
        return 500000; // 50,000 AU - satellites can escape
      case CelestialType.DWARF_PLANET:
        return 5000000; // 500,000 AU - dwarf planets can escape
      case CelestialType.PLANET:
        return 10000000; // 1M AU - planets can escape to interstellar space
      case CelestialType.COMET:
        return 100000000; // 10M AU - comets can escape to deep space
      case CelestialType.ASTEROID:
        return 1000000; // 100,000 AU - asteroids can escape
      default:
        return 10000000; // 1M AU default
    }
  }
}
