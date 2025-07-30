import { ceres } from "./ceres";
import { leleakuhonua } from "./leleakuhonua";
import { vp113 } from "./vp113";
import { eris, dysnomia } from "./eris";
import { makemake, mk2 } from "./makemake";
import { haumea, hiiaka, namaka } from "./haumea";
import { sedna } from "./sedna"; // Import Sedna
import { ammonite } from "./ammonite";

/**
 * Minor bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const minorBodies = [
  // Dwarf Planets (in order of discovery/significance)
  ceres,
  sedna, // Added Sedna
  leleakuhonua, // 541132 Leleākūhonua (The Goblin) - extreme sednoid
  vp113, // 2012 VP113 (Biden) - early sednoid discovery
  eris,
  dysnomia,
  makemake,
  mk2,
  haumea,
  hiiaka,
  namaka,
  ammonite,
];
