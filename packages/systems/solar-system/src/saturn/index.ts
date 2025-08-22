import { dione } from "./dione";
import { enceladus } from "./enceladus";
import { hyperion } from "./hyperion";
import { iapetus } from "./iapetus";
import { mimas } from "./mimas";
import { phoebe } from "./phoebe";
import { rhea } from "./rhea";
import { saturn } from "./saturn";
import { tethys } from "./tethys";
import { titan } from "./titan";

/**
 * Saturn system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const saturnSystemBodies = [
  saturn,
  titan,
  enceladus,
  rhea,
  dione,
  tethys,
  mimas,
  hyperion,
  iapetus,
  phoebe,
];
