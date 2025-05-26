import { getCelestialObjects } from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";

/**
 * Utility service for handling star destruction events and root star reassignment.
 */
export class StarDestructionHandler {
  /**
   * Handles star destruction events by detecting when a root star is destroyed,
   * finding the new root star, and returning the new root star if found.
   * @param destroyedStarId - The ID of the destroyed star
   * @returns The new root star object if found, null otherwise
   */
  static handleStarDestruction(
    destroyedStarId: string,
  ): CelestialObject | null {
    const currentObjects = getCelestialObjects();
    const destroyedStar = currentObjects[destroyedStarId];

    if (!destroyedStar || destroyedStar.type !== CelestialType.STAR) {
      return null;
    }

    // Check if this was a root star (no parent)
    const wasRootStar =
      !destroyedStar.parentId && !destroyedStar.currentParentId;
    if (!wasRootStar) {
      return null;
    }

    console.debug(
      `[StarDestructionHandler] Root star ${destroyedStarId} destroyed, finding new root...`,
    );

    return this._findNewRootStar(currentObjects, destroyedStarId);
  }

  /**
   * Finds a new root star when the current root star is destroyed.
   * Prioritizes the closest active star.
   * @param currentObjects - Current celestial objects
   * @param destroyedStarId - ID of the destroyed star
   * @returns New root star or null if none found
   */
  private static _findNewRootStar(
    currentObjects: Record<string, CelestialObject>,
    destroyedStarId: string,
  ): CelestialObject | null {
    const destroyedStar = currentObjects[destroyedStarId];
    if (!destroyedStar) return null;

    // Find all active stars that could be new roots
    const candidateStars = Object.values(currentObjects).filter(
      (obj) =>
        obj.type === CelestialType.STAR &&
        obj.status === CelestialStatus.ACTIVE &&
        obj.id !== destroyedStarId,
    );

    if (candidateStars.length === 0) {
      console.warn(
        "[StarDestructionHandler] No active stars available for new root assignment.",
      );
      return null;
    }

    // For now, just pick the first available star
    // In the future, this could be enhanced to pick the closest star
    const newRootStar = candidateStars[0];

    console.debug(
      `[StarDestructionHandler] Selected new root star: ${newRootStar.id} (${newRootStar.name})`,
    );

    return newRootStar;
  }

  /**
   * Checks if an object should be reassigned to a distant star.
   * Objects are reassigned if they are orphaned (parent destroyed) and are
   * planets, moons, or other non-star objects.
   * @param obj - The celestial object to check
   * @param currentObjects - Current celestial objects
   * @returns True if the object should be reassigned
   */
  static shouldReassignToDistantStar(
    obj: CelestialObject,
    currentObjects: Record<string, CelestialObject>,
  ): boolean {
    // Only reassign non-star objects
    if (obj.type === CelestialType.STAR) {
      return false;
    }

    // Check if the object's parent still exists and is active
    const parentId = obj.currentParentId || obj.parentId;
    if (!parentId) {
      return true; // Orphaned object
    }

    const parent = currentObjects[parentId];
    if (!parent || parent.status !== CelestialStatus.ACTIVE) {
      return true; // Parent is destroyed or missing
    }

    return false;
  }
}
