import { adrastea } from "./adrastea";
import { amalthea } from "./amalthea";
import { callisto } from "./callisto";
import { europa } from "./europa";
import { ganymede } from "./ganymede";
import { himalia } from "./himalia";
import { io } from "./io";
import { jupiter } from "./jupiter";
import { metis } from "./metis";
import { thebe } from "./thebe";

/**
 * Jupiter system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const jupiterSystemBodies = [
  jupiter,
  // Inner moons
  metis,
  adrastea,
  amalthea,
  thebe,
  himalia,
  // Galilean moons
  io,
  europa,
  ganymede,
  callisto,
];
