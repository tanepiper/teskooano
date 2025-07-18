import { factoryOperations } from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

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

    factoryOperations.addCelestial({
      ...comet,
      status: CelestialStatus.ACTIVE,
      parentId: parentId,
      physicsStateReal: {
        id: comet.id,
        mass_kg: comet.realMass_kg,
        position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
        velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
      },
    } as CelestialObject);
  });
};
