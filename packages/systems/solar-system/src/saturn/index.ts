import { saturn } from "./saturn";
import { titan } from "./titan";
import { enceladus } from "./enceladus";
import { rhea } from "./rhea";
import { dione } from "./dione";
import { tethys } from "./tethys";
import { mimas } from "./mimas";
import { hyperion } from "./hyperion";
import { iapetus } from "./iapetus";
import { phoebe } from "./phoebe";

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
