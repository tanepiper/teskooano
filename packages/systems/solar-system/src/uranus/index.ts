import { uranus } from "./uranus";
import { titania } from "./titania";
import { oberon } from "./oberon";
import { umbriel } from "./umbriel";
import { ariel } from "./ariel";
import { miranda } from "./miranda";

/**
 * Uranus system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const uranusSystemBodies = [
  uranus,
  titania,
  oberon,
  umbriel,
  ariel,
  miranda,
];
