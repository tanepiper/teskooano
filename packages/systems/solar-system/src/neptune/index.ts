import { despina } from "./despina";
import { galatea } from "./galatea";
import { naiad } from "./naiad";
import { neptune } from "./neptune";
import { nereid } from "./nereid";
import { thalassa } from "./thalassa";
import { triton } from "./triton";

/**
 * Neptune system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const neptuneSystemBodies = [
  neptune,
  triton,
  nereid,
  galatea,
  despina,
  thalassa,
  naiad,
];
