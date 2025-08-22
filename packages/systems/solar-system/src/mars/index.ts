import { mars } from "./mars";
import { phobos } from "./phobos";
import { deimos } from "./deimos";

/**
 * Mars system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const marsSystemBodies = [mars, phobos, deimos];
