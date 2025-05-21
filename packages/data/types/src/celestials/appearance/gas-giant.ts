import type { CelestialAppearanceBase } from "./base";

/** Appearance for Gas Giants. */
export interface GasGiantAppearance extends CelestialAppearanceBase {
  atmosphereColor: string; // Base color of bands/atmosphere (Hex)
  cloudColor: string; // Color of cloud patterns (Hex)
  cloudSpeed: number; // Animation speed of clouds
  stormColor?: string; // Color of major storms (Hex)
  stormSpeed?: number; // Animation speed of storms
  emissiveColor?: string; // For hot gas giants that might emit light (Hex)
  emissiveIntensity?: number;
  // ringTilt is complex if rings are not aligned with axialTilt, usually handled by RingSystemAppearance
}
