import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-types";
import { physicsSystemAdapter, StateAccessor } from "@teskooano/core-state";
import { celestial } from "@teskooano/core-state";
import { calculateGravitationalForce } from "@teskooano/core-physics";

/**
 * Manages the dynamic hierarchy of celestial objects within the simulation.
 * This includes handling cases where objects are orphaned due to parent destruction
 * or when they escape their parent's gravitational influence.
 */
export class HierarchyManager {
  private updateIndex = 0;

  /**
   * Checks if an object is part of a binary star system and should be protected from hierarchy changes.
   * Binary stars with parentId = undefined (primary) or parentId = primary star ID (companion) should maintain their relationships.
   * @param obj The celestial object to check.
   * @returns True if the object should be protected from hierarchy changes.
   */
  private isBinaryStarProtected(obj: CelestialObject): boolean {
    if (obj.type !== CelestialType.STAR) return false;

    // Primary star (no parent) is protected
    if (!obj.parentId) return true;

    // Companion star (orbits primary) is protected
    const parentStar = this.getParentStar(obj);
    return parentStar !== null && parentStar.type === CelestialType.STAR;
  }

  /**
   * Gets the parent star of an object
   */
  private getParentStar(obj: CelestialObject): CelestialObject | null {
    if (!obj.parentId) return null;

    const allObjects = StateAccessor.getCurrentCelestialObjects();
    return (
      Object.values(allObjects).find((parent) => parent.id === obj.parentId) ||
      null
    );
  }

  /**
   * Updates the hierarchies of all celestial objects based on a set of rules.
   * This is called on every simulation tick, but only processes a single object
   * per tick to avoid performance issues.
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

    if (obj && physicsState) {
      // No need to check for orphans if the object is already destroyed
      if (
        obj.status !== CelestialStatus.DESTROYED &&
        obj.status !== CelestialStatus.ANNIHILATED
      ) {
        // Skip hierarchy management for asteroid belts - they should have static relationships
        if (obj.type !== CelestialType.ASTEROID_FIELD) {
          this.handleOrphanedObjects(
            obj,
            physicsState,
            allObjects,
            allPhysicsStates,
          );

          const wasChanged = this.handleMoonEscape(
            obj,
            physicsState,
            allObjects,
            allPhysicsStates,
          );

          if (!wasChanged) {
            // Check for binary star hierarchy updates before general capture
            const binaryChanged = this.handleBinaryStarHierarchy(
              obj,
              physicsState,
              allObjects,
              allPhysicsStates,
            );

            if (!binaryChanged) {
              this.handleCapture(
                obj,
                physicsState,
                allObjects,
                allPhysicsStates,
              );
            }
          }
        }
      }
    }

    this.updateIndex++;
  }

  /**
   * Checks if an object's parent has been destroyed and finds a new parent if necessary.
   * @param obj The celestial object to check.
   * @param physicsState The current physics state of the object.
   * @param allObjects A map of all celestial objects.
   * @param allPhysicsStates An array of all physics states.
   */
  private handleOrphanedObjects(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ) {
    // Protect binary star systems from orphan handling
    if (this.isBinaryStarProtected(obj)) {
      return;
    }

    const parentId = obj.parentId;
    if (!parentId) return; // No parent to be orphaned from.

    const parent = allObjects[parentId];
    if (!parent || parent.status === CelestialStatus.DESTROYED) {
      // Parent is gone, find a new one.
      const newParent = this.findBestParent(
        obj,
        physicsState,
        allObjects,
        allPhysicsStates,
      );
      if (newParent) {
        celestial.updateObject(obj.id, {
          parentId: newParent.id,
        });
      }
    }
  }

  /**
   * Checks if a moon has strayed too far from its parent planet.
   * If it has, it "escapes" and finds a new parent, typically a star.
   * @param obj The celestial object to check.
   * @param physicsState The current physics state of the object.
   * @param allObjects A map of all celestial objects.
   * @param allPhysicsStates An array of all physics states.
   */
  private handleMoonEscape(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): boolean {
    // Protect binary star systems from moon escape handling
    if (this.isBinaryStarProtected(obj)) {
      return false;
    }

    if (obj.type !== CelestialType.MOON) return false;

    const parentId = obj.parentId;
    if (!parentId) return false;

    const parent = allObjects[parentId];
    const parentPhysicsState = allPhysicsStates.find((p) => p.id === parentId);
    if (!parent || !parentPhysicsState) return false;

    const distanceToParent = physicsState.position_m.distanceTo(
      parentPhysicsState.position_m,
    );

    const parentHillSphere = this.calculateParentHillSphere(
      parent,
      allObjects,
      allPhysicsStates,
    );

    // A moon is considered to have escaped if it travels beyond about half
    // of its parent's Hill Sphere. This is a conservative but stable threshold.
    const escapeDistance = parentHillSphere * 0.5;

    if (distanceToParent > escapeDistance) {
      const newParent = this.findBestParent(
        obj,
        physicsState,
        allObjects,
        allPhysicsStates,
        parent.id,
      );
      if (newParent) {
        const updatePayload = {
          type: CelestialType.DWARF_PLANET, // It's no longer a moon
          parentId: newParent.id,
        };

        celestial.updateObject(obj.id, updatePayload);

        // Dispatch a custom event to notify UI components about the hierarchy change
        document.dispatchEvent(
          new CustomEvent("celestial-hierarchy-changed", {
            detail: {
              objectId: obj.id,
              newType: CelestialType.DWARF_PLANET,
              newParentId: newParent.id,
            },
          }),
        );

        return true; // The object was changed
      }
    }
    return false; // No change was made
  }

  /**
   * Handles dynamic hierarchy changes in binary star systems.
   * Allows planets to switch between binary stars based on gravitational dominance.
   * @param obj The celestial object to check.
   * @param physicsState The current physics state of the object.
   * @param allObjects A map of all celestial objects.
   * @param allPhysicsStates An array of all physics states.
   * @returns True if the object's hierarchy was changed, false otherwise.
   */
  private handleBinaryStarHierarchy(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): boolean {
    // Only handle planets, dwarf planets, and moons in binary star systems
    if (
      obj.type !== CelestialType.PLANET &&
      obj.type !== CelestialType.DWARF_PLANET &&
      obj.type !== CelestialType.MOON
    ) {
      return false;
    }

    // Find all stars in the system
    const stars = Object.values(allObjects).filter(
      (celestial) => celestial.type === CelestialType.STAR,
    );

    // Only proceed if we have exactly 2 stars (binary system)
    if (stars.length !== 2) {
      return false;
    }

    const [star1, star2] = stars;
    const star1State = allPhysicsStates.find((p) => p.id === star1.id);
    const star2State = allPhysicsStates.find((p) => p.id === star2.id);

    if (!star1State || !star2State) {
      return false;
    }

    // Calculate gravitational forces from both stars
    const distanceToStar1Sq = physicsState.position_m
      .clone()
      .sub(star1State.position_m)
      .lengthSq();

    const distanceToStar2Sq = physicsState.position_m
      .clone()
      .sub(star2State.position_m)
      .lengthSq();

    if (distanceToStar1Sq === 0 || distanceToStar2Sq === 0) {
      return false;
    }

    const force1 = star1.realMass_kg / distanceToStar1Sq;
    const force2 = star2.realMass_kg / distanceToStar2Sq;

    // Determine which star should be the parent
    const dominantStar = force1 > force2 ? star1 : star2;

    // If the object is already orbiting the gravitationally dominant star, no change needed
    if (obj.parentId === dominantStar.id) {
      return false;
    }

    // Check if the current parent is one of the binary stars
    const currentParent = obj.parentId ? allObjects[obj.parentId] : null;
    const isCurrentlyOrbitingStar =
      currentParent &&
      currentParent.type === CelestialType.STAR &&
      (currentParent.id === star1.id || currentParent.id === star2.id);

    if (!isCurrentlyOrbitingStar) {
      return false; // Object is not currently orbiting either star
    }

    // Add hysteresis to prevent rapid switching
    const forceRatio = Math.max(force1, force2) / Math.min(force1, force2);
    const SWITCHING_THRESHOLD = 1.5; // Dominant star must be 50% stronger

    if (forceRatio < SWITCHING_THRESHOLD) {
      return false; // Forces are too close, avoid switching
    }

    // Switch the object to orbit the gravitationally dominant star
    celestial.updateObject(obj.id, {
      parentId: dominantStar.id,
    });

    // Dispatch event for UI updates
    document.dispatchEvent(
      new CustomEvent("celestial-hierarchy-changed", {
        detail: {
          objectId: obj.id,
          newParentId: dominantStar.id,
          binaryStarSwitch: true,
          reason: `Switched to gravitationally dominant star: ${dominantStar.name}`,
        },
      }),
    );

    return true; // Hierarchy was changed
  }

  /**
   * Checks for gravitational capture between objects.
   * When two objects are close enough to become bound, the more massive one becomes the parent.
   * @param obj The celestial object to check for captures.
   * @param physicsState The current physics state of the object.
   * @param allObjects A map of all celestial objects.
   * @param allPhysicsStates An array of all physics states.
   */
  private handleCapture(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): void {
    // Protect binary star systems from capture
    if (this.isBinaryStarProtected(obj)) {
      return;
    }

    // A moon with a stable parent should not be trying to capture other objects.
    // Its primary check should be for escaping its current parent.
    if (obj.type === CelestialType.MOON && obj.parentId) {
      return;
    }

    // Only check for captures with objects that can be captured (planets, dwarf planets, moons, comets)
    // if (
    //   obj.type !== CelestialType.COMET &&
    //   obj.type !== CelestialType.PLANET &&
    //   obj.type !== CelestialType.DWARF_PLANET &&
    //   obj.type !== CelestialType.MOON
    // ) {
    //   return;
    // }

    // Define capture distance based on object type
    const CAPTURE_DISTANCE_METERS = this.getCaptureDistance(obj);

    for (const otherObjectId in allObjects) {
      if (otherObjectId === obj.id) continue;

      const otherObj = allObjects[otherObjectId];
      const otherPhysicsState = allPhysicsStates.find(
        (p) => p.id === otherObjectId,
      );

      if (!otherObj || !otherPhysicsState) continue;

      // Skip if the other object is destroyed or not a capturable type
      if (
        otherObj.status === CelestialStatus.DESTROYED ||
        otherObj.status === CelestialStatus.ANNIHILATED
      ) {
        continue;
      }

      // Skip if they already have a parent-child relationship
      if (this.areAlreadyRelated(obj, otherObj, allObjects)) {
        continue;
      }

      // Asteroid belts should not capture other asteroid belts
      if (
        obj.type === CelestialType.ASTEROID_FIELD &&
        otherObj.type === CelestialType.ASTEROID_FIELD
      ) {
        continue;
      }

      const distance = physicsState.position_m.distanceTo(
        otherPhysicsState.position_m,
      );

      // Check if they're close enough for capture
      if (distance <= CAPTURE_DISTANCE_METERS) {
        this.performCapture(obj, otherObj, allObjects);
        return; // Only handle one capture per tick
      }
    }
  }

  /**
   * Gets the capture distance for an object based on its type and properties.
   * @param obj The celestial object.
   * @returns The capture distance in meters.
   */
  private getCaptureDistance(obj: CelestialObject): number {
    // Much more liberal capture distance - gravitational influence extends far
    const BASE_MULTIPLIER = 50.0; // Objects can influence each other from 50x their radius

    if (obj.realRadius_m) {
      return obj.realRadius_m * BASE_MULTIPLIER;
    }

    // Fallback: liberal distances based on type to allow gravitational influence
    switch (obj.type) {
      case CelestialType.PLANET:
        return 100000000; // 100,000 km - much more liberal
      case CelestialType.DWARF_PLANET:
        return 50000000; // 50,000 km - much more liberal
      case CelestialType.MOON:
        return 25000000; // 25,000 km - much more liberal
      case CelestialType.COMET:
        return 10000000; // 10,000 km - much more liberal
      default:
        return 10000000; // 10,000 km - much more liberal
    }
  }

  /**
   * Checks if two objects are already related in the parent-child hierarchy.
   * @param obj1 The first object.
   * @param obj2 The second object.
   * @param allObjects A map of all celestial objects.
   * @returns True if they are already related, false otherwise.
   */
  private areAlreadyRelated(
    obj1: CelestialObject,
    obj2: CelestialObject,
    allObjects: Record<string, CelestialObject>,
  ): boolean {
    const parentId1 = obj1.parentId;
    const parentId2 = obj2.parentId;
    if (parentId1 && parentId2 && parentId1 === parentId2) {
      return true; // They are siblings, already related enough to not capture each other.
    }

    // Check if obj1 is a parent/ancestor of obj2
    let current = obj2;
    while (current) {
      const parentId = current.parentId;
      if (!parentId) break;
      if (parentId === obj1.id) return true;
      current = allObjects[parentId];
      if (!current) break;
    }

    // Check if obj2 is a parent/ancestor of obj1
    current = obj1;
    while (current) {
      const parentId = current.parentId;
      if (!parentId) break;
      if (parentId === obj2.id) return true;
      current = allObjects[parentId];
      if (!current) break;
    }

    return false;
  }

  /**
   * Performs the capture between two objects, making the more massive one the parent.
   * @param obj1 The first object.
   * @param obj2 The second object.
   * @param allObjects A map of all celestial objects.
   */
  private performCapture(
    obj1: CelestialObject,
    obj2: CelestialObject,
    allObjects: Record<string, CelestialObject>,
  ): void {
    // Determine which object should be the parent (more massive)
    const parent = obj1.realMass_kg > obj2.realMass_kg ? obj1 : obj2;
    const child = parent === obj1 ? obj2 : obj1;

    // Don't capture if the "parent" is actually smaller than what would become its child
    // This prevents weird situations where a tiny moon captures a planet
    if (parent.realMass_kg < child.realMass_kg * 0.1) {
      return;
    }

    // Check for circular dependencies
    if (this.wouldCreateCircularDependency(child, parent, allObjects)) {
      console.warn(
        `Skipping capture: ${parent.name} capturing ${child.name} would create circular dependency`,
      );
      return;
    }

    // Determine the new type for the child and parent
    const { parentType, childType } = this.determineObjectTypes(parent, child);

    // Update the parent object type if needed
    if (parent.type !== parentType) {
      celestial.updateObject(parent.id, {
        type: parentType,
      });
    }

    // Update the child object to orbit the parent
    celestial.updateObject(child.id, {
      type: childType,
      parentId: parent.id,
    });

    // Dispatch event for UI updates
    document.dispatchEvent(
      new CustomEvent("celestial-hierarchy-changed", {
        detail: {
          objectId: child.id,
          newType: childType,
          newParentId: parent.id,
          captureEvent: true,
        },
      }),
    );
  }

  /**
   * Determines the appropriate types for parent and child objects during capture.
   * @param parent The object that will become the parent.
   * @param child The object that will become the child.
   * @returns Object containing the types for parent and child.
   */
  private determineObjectTypes(
    parent: CelestialObject,
    child: CelestialObject,
  ): { parentType: CelestialType; childType: CelestialType } {
    // Define thresholds for celestial classification
    // These are based on real astronomical criteria
    const DWARF_PLANET_MIN_MASS_KG = 1e20; // ~100 times more massive than Thalassa
    const DWARF_PLANET_MIN_RADIUS_M = 200_000; // 200 km radius minimum
    const PLANET_MIN_MASS_KG = 1e23; // Much larger threshold for planets

    // If the parent is already a planet, keep it as a planet
    if (
      parent.type === CelestialType.PLANET ||
      parent.realMass_kg >= PLANET_MIN_MASS_KG
    ) {
      return {
        parentType: CelestialType.PLANET,
        childType: CelestialType.MOON,
      };
    }

    // If the parent is already a dwarf planet AND meets the mass/size criteria, keep it as a dwarf planet
    if (
      parent.type === CelestialType.DWARF_PLANET &&
      (parent.realMass_kg >= DWARF_PLANET_MIN_MASS_KG ||
        parent.realRadius_m >= DWARF_PLANET_MIN_RADIUS_M)
    ) {
      return {
        parentType: CelestialType.DWARF_PLANET,
        childType: CelestialType.MOON,
      };
    }

    // Check if the parent is large enough to be a dwarf planet
    if (
      parent.realMass_kg >= DWARF_PLANET_MIN_MASS_KG ||
      parent.realRadius_m >= DWARF_PLANET_MIN_RADIUS_M
    ) {
      return {
        parentType: CelestialType.DWARF_PLANET,
        childType: CelestialType.MOON,
      };
    }

    // If both objects are small (like two tiny moons), keep them as moons
    // The "parent" is just the gravitationally dominant one, but both remain moons
    return {
      parentType: CelestialType.MOON,
      childType: CelestialType.MOON,
    };
  }

  /**
   * Checks if making potentialParent the parent of child would create a circular dependency.
   * @param child The object that would become a child.
   * @param potentialParent The object that would become the parent.
   * @param allObjects A map of all celestial objects.
   * @returns True if a circular dependency would be created, false otherwise.
   */
  private wouldCreateCircularDependency(
    child: CelestialObject,
    potentialParent: CelestialObject,
    allObjects: Record<string, CelestialObject>,
  ): boolean {
    // Walk up the potential parent's chain to see if we eventually reach the child
    let current = potentialParent;
    const visited = new Set<string>();

    while (current) {
      // If we've already visited this object, there's a cycle in the existing hierarchy
      if (visited.has(current.id)) {
        return true;
      }
      visited.add(current.id);

      // If the potential parent's chain leads back to the child, it would create a circle
      if (current.id === child.id) {
        return true;
      }

      // Move up to the next parent
      const parentId = current.parentId;
      if (!parentId) break;

      current = allObjects[parentId];
      if (!current) break;
    }

    return false;
  }

  /**
   * Finds the most gravitationally dominant object to serve as a parent.
   * @param child The object that needs a parent.
   * @param childState The physics state of the child object.
   * @param allObjects A map of all celestial objects.
   * @param allPhysicsStates An array of all physics states.
   * @param excludeId Optional ID to exclude from consideration (e.g., the former parent).
   * @returns The most suitable parent object, or null if none is found.
   */
  private findBestParent(
    child: CelestialObject,
    childState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
    excludeId?: string,
  ): CelestialObject | null {
    let bestParent: CelestialObject | null = null;
    let maxForce = -1;

    for (const potentialParentId in allObjects) {
      if (potentialParentId === child.id || potentialParentId === excludeId) {
        continue;
      }

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

      // Asteroid belts should not be parents of other asteroid belts
      if (
        child.type === CelestialType.ASTEROID_FIELD &&
        potentialParent.type === CelestialType.ASTEROID_FIELD
      ) {
        continue;
      }

      // Critical fix: Check for circular dependencies
      if (
        this.wouldCreateCircularDependency(child, potentialParent, allObjects)
      ) {
        console.warn(
          `Skipping ${potentialParent.name} as parent for ${child.name} - would create circular dependency`,
        );
        continue;
      }

      const distanceVec = childState.position_m
        .clone()
        .sub(parentState.position_m);
      const distanceSq = distanceVec.lengthSq();

      if (distanceSq === 0) continue;

      // Simplified force calculation (proportional to M/r^2)
      // We don't need G here since we're just comparing relative forces.
      const force = potentialParent.realMass_kg / distanceSq;

      if (force > maxForce) {
        maxForce = force;
        bestParent = potentialParent;
      }
    }
    return bestParent;
  }

  /**
   * Calculates the Hill Sphere for a parent object, which is the region where its
   * gravity dominates and it can hold satellites.
   * @param parent The parent object (e.g., a planet).
   * @param allObjects A map of all celestial objects.
   * @param allPhysicsStates An array of all physics states.
   * @returns The Hill Sphere radius in meters.
   */
  private calculateParentHillSphere(
    parent: CelestialObject,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[],
  ): number {
    const grandParentId = parent.parentId;

    // If the parent has no parent (it's a star), its influence is vast.
    if (!grandParentId) {
      return Number.MAX_SAFE_INTEGER;
    }

    const grandParent = allObjects[grandParentId];
    const grandParentState = allPhysicsStates.find(
      (p) => p.id === grandParentId,
    );
    const parentState = allPhysicsStates.find((p) => p.id === parent.id);

    // If we can't find the grandparent, we can't calculate its influence.
    if (
      !grandParent ||
      !grandParentState ||
      !parentState ||
      !grandParent.realMass_kg
    ) {
      // Return a large, but not infinite, fallback distance (e.g., 1 AU)
      return AU_METERS;
    }

    const distanceToGrandParent = parentState.position_m.distanceTo(
      grandParentState.position_m,
    );

    // Hill sphere radius: R_H = r * (m / (3 * M))^(1/3)
    const massRatio = parent.realMass_kg / (3 * grandParent.realMass_kg);

    // If masses are weird (e.g., zero), avoid NaN.
    if (massRatio <= 0 || distanceToGrandParent === 0) {
      return AU_METERS;
    }

    return distanceToGrandParent * Math.cbrt(massRatio);
  }
}
