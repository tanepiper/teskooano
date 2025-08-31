import { ammonite } from "./ammonite";
import { ceres } from "./ceres";
import { dysnomia, eris } from "./eris";
import { haumea, hiiaka, namaka } from "./haumea";
import { leleakuhonua } from "./leleakuhonua";
import { lido2020VN40 } from "./lido-2020-vn40";
import { makemake, mk2 } from "./makemake";
import { sedna } from "./sedna"; // Import Sedna
import { vp113 } from "./vp113";

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
  // Resonant TNOs
  lido2020VN40, // 2020 VN40 (LiDO) - First 10:1 resonator with Neptune
];
