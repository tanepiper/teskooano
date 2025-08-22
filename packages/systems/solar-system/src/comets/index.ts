import { borrelly } from "./borrelly";
import { encke } from "./encke";
import { haleBopp } from "./hale-bopp";
import { halley } from "./halley";
import { temple2 } from "./temple-2";
import { whipple } from "./whipple";

/**
 * Comet bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const allComets = [halley, haleBopp, encke, temple2, borrelly, whipple];
