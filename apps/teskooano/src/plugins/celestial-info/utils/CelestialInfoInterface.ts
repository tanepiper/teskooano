import { CelestialObject } from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";

export interface CelestialInfoComponent extends HTMLElement {
  updateData(celestial: CelestialObject): void;
  setParentPanel(panel: CompositeEnginePanel | null): void;
}
