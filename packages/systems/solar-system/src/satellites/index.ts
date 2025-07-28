import { jwst } from "./jwst";
import { voyager1 } from "./voyager1";
import { voyager2 } from "./voyager2";

/**
 * Deep space satellites that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const deepSpaceSatellites = [jwst];

/**
 * Rogue satellites (no parent) that can be initialized in any order.
 * These are objects in interstellar space not orbiting any body.
 */
export const rogueSatellites = [voyager1, voyager2];

/**
 * All satellites that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const allSatellites = [...deepSpaceSatellites, ...rogueSatellites];
