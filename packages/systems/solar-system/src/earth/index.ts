import { earth } from "./earth";
import { luna } from "./moon";

/**
 * Earth system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const earthSystemBodies = [earth, luna];
