import { celestialManager } from "@teskooano/core-state";
import { CelestialObject, CelestialStatus } from "@teskooano/data-types";

// Import individual comet definitions
import { halleyComet } from "./halley";
import { haleBoppComet } from "./hale-bopp";
import { enckeComet } from "./encke";
import { temple2Comet } from "./temple-2";
import { borrellyComet } from "./borrelly";
import { whippleComet } from "./whipple";

const comets: Partial<CelestialObject>[] = [
  halleyComet,
  haleBoppComet,
  enckeComet,
  temple2Comet,
  borrellyComet,
  whippleComet,
];

export const initializeComets = (parentId: string) => {
  comets.forEach((comet) => {
    if (!comet.id || !comet.realMass_kg) {
      console.error("Comet missing required properties:", comet);
      return;
    }

    celestialManager.addCelestial({
      ...comet,
      status: CelestialStatus.ACTIVE,
      parentId: parentId,
    } as CelestialObject);
  });
};
