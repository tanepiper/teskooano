import { ceres, initializeCeres } from "./ceres";
import { vesta, initializeVesta } from "./vesta";
import { pallas, initializePallas } from "./pallas";
import { eris, dysnomia, initializeEris } from "./eris";
import { makemake, mk2, initializeMakemake } from "./makemake";
import { haumea, hiiaka, namaka, initializeHaumea } from "./haumea";
import { asteroidBelt, initializeAsteroidBelt } from "./asteroid-belt";

/**
 * Minor bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const minorBodies = [
  // Dwarf Planets (in order of discovery/significance)
  ceres,
  vesta,
  pallas,
  eris,
  dysnomia,
  makemake,
  mk2,
  haumea,
  hiiaka,
  namaka,

  // Asteroid Belt (collective)
  asteroidBelt,
];

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the minorBodies array instead.
 */
export function initializeMinorBodies(parentId: string): void {
  // This function is now deprecated - use the modular approach instead
  // The minorBodies array should be used with the main solar system initialization
}

// Re-export individual initializers for flexibility (deprecated)
export {
  initializeAsteroidBelt,
  initializeCeres,
  initializeEris,
  initializeHaumea,
  initializeMakemake,
  initializePallas,
  initializeVesta,
};
