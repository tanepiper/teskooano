import { halley } from "./halley";
import { haleBopp } from "./hale-bopp";
import { encke } from "./encke";
import { temple2 } from "./temple-2";
import { borrelly } from "./borrelly";
import { whipple } from "./whipple";

/**
 * Comet bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const allComets = [halley, haleBopp, encke, temple2, borrelly, whipple];
