import { borrelly } from "./borrelly";
import { encke } from "./encke";
import { haleBopp } from "./hale-bopp";
import { halley } from "./halley";
import { swan2025R2 } from "./swan-2025-r2";
import { temple2 } from "./temple-2";
import { whipple } from "./whipple";

/**
 * Comet bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const allComets = [
  halley,
  haleBopp,
  encke,
  temple2,
  borrelly,
  whipple,
  swan2025R2,
];
