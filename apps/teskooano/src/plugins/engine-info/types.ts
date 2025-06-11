import type { CompositeEnginePanel } from "../engine-panel/panels/composite-panel/CompositeEnginePanel.js";

/**
 * Optional parameters passed during the initialization of the RendererInfoDisplay panel.
 */
export type RendererInfoParams = {
  /**
   * A direct reference to the parent CompositeEnginePanel instance,
   * used for communication (e.g., getting the renderer).
   */
  parentInstance?: CompositeEnginePanel;
};
