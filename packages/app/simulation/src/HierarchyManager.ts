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
    const allObjects = StateAccessor.getCelestialObjects();
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

    // Use pre-filtered active objects instead of manual status checking
    const activeObjects = StateAccessor.getActiveObjects();
    if (
      obj &&
      physicsState &&
      activeObjects[objectId] // Object is active if it exists in activeObjects
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
    // Use pre-filtered active objects to check if parent is destroyed
    const activeObjects = StateAccessor.getActiveObjects();
    if (!parent || !activeObjects[parentId]) {
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

        // Use pre-filtered active objects to check if parent is destroyed
        const activeObjects = StateAccessor.getActiveObjects();
        if (!potentialParent || !parentState || !activeObjects[nearbyId]) {
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

    // Use pre-filtered active objects instead of manual filtering
    const activeObjects = StateAccessor.getActiveObjects();

    for (const potentialParentId in activeObjects) {
      if (potentialParentId === child.id) continue;

      const potentialParent = activeObjects[potentialParentId];
      const parentState = allPhysicsStates.find(
        (p) => p.id === potentialParent.id,
      );

      if (!potentialParent || !parentState) {
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
   * Returns distance in meters for realistic astronomical scales
   */
  private getSearchDistance(obj: CelestialObject): number {
    switch (obj.type) {
      case CelestialType.STAR:
        return 1000 * AU_METERS; // 1000 AU - stars can influence objects at great distances
      case CelestialType.GAS_GIANT:
        return 100 * AU_METERS; // 100 AU - gas giants have strong gravitational influence
      case CelestialType.PLANET:
        return 10 * AU_METERS; // 10 AU - planets influence nearby objects
      case CelestialType.DWARF_PLANET:
        return 10 * AU_METERS; // 10 AU - dwarf planets similar to planets
      case CelestialType.MOON:
        return 1 * AU_METERS; // 1 AU - moons typically stay within 1 AU of parent
      case CelestialType.SATELLITE:
        return 10e6; // 10 Mm (10 million meters) - satellites stay close to parent
      case CelestialType.COMET:
        return 100 * AU_METERS; // 100 AU - comets can have wide orbits
      case CelestialType.ASTEROID:
        return 10 * AU_METERS; // 10 AU - asteroids typically within planetary systems
      default:
        return 10 * AU_METERS; // 10 AU default
    }
  }
}
