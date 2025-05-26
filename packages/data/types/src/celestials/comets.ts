import type { CelestialType, SmallBodyType, CompositionType } from "./common";
import type { CelestialBase } from "./base";
import type { SurfaceProperties } from "./components";

/**
 * Comet - icy small body with nucleus, coma, and tail when active
 */
export interface Comet extends CelestialBase {
  type: CelestialType.SMALL_BODY;
  smallBodyType:
    | SmallBodyType.COMET
    | SmallBodyType.SHORT_PERIOD_COMET
    | SmallBodyType.LONG_PERIOD_COMET;

  // Physical properties
  surface: SurfaceProperties; // Nucleus surface
  composition: CompositionType[]; // Nucleus composition (ices + dust)

  // Activity properties
  activity: number; // Outgassing activity level (0-1)
  perihelionDistance_AU: number; // Closest approach to sun
  isActive?: boolean; // Currently active vs dormant

  // Coma and tail properties (when active)
  comaRadius_m?: number; // Current coma size
  tailLength_m?: number; // Current tail length
  tailDirection?: number; // Tail direction in radians
  dustTailLength_m?: number; // Dust tail length
  ionTailLength_m?: number; // Ion tail length

  // Orbital characteristics
  isShortPeriod?: boolean; // < 200 year period
  isLongPeriod?: boolean; // > 200 year period
  originRegion?: string; // Kuiper Belt, Oort Cloud, etc.

  // Physical evolution
  massLossRate_kgs?: number; // Mass loss per second when active
  rotationPeriod_h?: number; // Nucleus rotation period
  nucleusShape?: string; // Irregular, elongated, etc.
}
