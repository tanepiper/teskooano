import { initializeAsteroidBelt } from "./asteroid-belt";
import { initializeCeres } from "./ceres";
import { initializeComets } from "./comets";
import { initializeEris } from "./eris";
import { initializeHaumea } from "./haumea";
import { initializeMakemake } from "./makemake";
import { initializeOortCloud } from "./oort-cloud";
import { initializePallas } from "./pallas";
import { initializeVesta } from "./vesta";

/**
 * Initializes all minor bodies in the Solar System.
 * This includes dwarf planets, asteroids, comets, and other small bodies.
 *
 * @param parentId The ID of the parent object (Sun).
 */
export function initializeMinorBodies(parentId: string): void {
  // Dwarf Planets (in order of discovery/significance)
  initializeCeres(parentId);
  initializePallas(parentId);
  initializeVesta(parentId);
  initializeEris(parentId);
  initializeMakemake(parentId);
  initializeHaumea(parentId);

  // Comets
  initializeComets(parentId);

  // Asteroid Belt (collective)
  initializeAsteroidBelt(parentId);

  // Outer System
  // initializeOortCloud(parentId); // Commented out as in original
}

// Re-export individual initializers for flexibility
export {
  initializeAsteroidBelt,
  initializeCeres,
  initializeComets,
  initializeEris,
  initializeHaumea,
  initializeMakemake,
  initializeOortCloud,
  initializePallas,
  initializeVesta,
};
