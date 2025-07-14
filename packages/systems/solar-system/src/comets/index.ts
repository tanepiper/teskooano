import { initializeComets } from "../comets/comets";

/**
 * Initializes all minor bodies in the Solar System.
 * This includes dwarf planets, asteroids, comets, and other small bodies.
 *
 * @param parentId The ID of the parent object (Sun).
 */
export function initializeMinorBodies(parentId: string): void {
  // Comets
  initializeComets(parentId);
}

// Re-export individual initializers for flexibility
export { initializeComets };
