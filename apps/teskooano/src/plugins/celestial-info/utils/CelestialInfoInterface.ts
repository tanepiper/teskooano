import { CelestialObject } from "@teskooano/data-types";

export interface CelestialInfoComponent extends HTMLElement {
  updateData(celestial: CelestialObject): void;
}
