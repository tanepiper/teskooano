import { ceres } from "./ceres";
import { vesta } from "./vesta";
import { pallas } from "./pallas";
import { eris, dysnomia } from "./eris";
import { makemake, mk2 } from "./makemake";
import { haumea, hiiaka, namaka } from "./haumea";
import { asteroidBelt } from "./asteroid-belt";

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
