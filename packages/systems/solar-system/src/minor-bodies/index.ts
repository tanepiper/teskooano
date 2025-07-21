import { ceres } from "./ceres";
import { vesta } from "./vesta";
import { pallas } from "./pallas";
import { ammonite } from "./ammonite";
import { leleakuhonua } from "./leleakuhonua";
import { vp113 } from "./vp113";
import { eris, dysnomia } from "./eris";
import { makemake, mk2 } from "./makemake";
import { haumea, hiiaka, namaka } from "./haumea";
import { sedna } from "./sedna"; // Import Sedna
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
  sedna, // Added Sedna
  ammonite, // 2023 KQ14 - recently discovered sednoid
  leleakuhonua, // 541132 Leleākūhonua (The Goblin) - extreme sednoid
  vp113, // 2012 VP113 (Biden) - early sednoid discovery
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
