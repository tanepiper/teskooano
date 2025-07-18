import {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
} from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";

export interface CelestialInfoComponent<
  T extends CelestialSpecificPropertiesUnion = CelestialSpecificPropertiesUnion,
> extends HTMLElement {
  updateData(celestial: CelestialObject<T>): void;
  setParentPanel(panel: CompositeEnginePanel | null): void;
}
