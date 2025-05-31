export * from "./scaling";
export * from "./physics";
export * from "./celestial";
// export * from "./celestials/common"; // This caused conflicts
export type { ProceduralSurfaceProperties } from "./celestials/common/procedural-surface-properties"; // Explicitly export the desired type
export type { SurfaceProperties } from "./celestials/components"; // Export SurfaceProperties
export {
  StellarType,
  MainSequenceSpectralClass,
  BrownDwarfSpectralClass,
  type StellarPhysicsData,
  type StellarRenderingData,
} from "./celestials/common/stellar-classification"; // Export stellar enums
export {
  SurfaceType,
  CompositionType,
} from "./celestials/common/physical-properties"; // Export SurfaceType & CompositionType enum
export * from "./ui";
export * from "./events";
export * from "./globals.d";
export * from "./main";
export type { ICelestialLabelComponent } from "./ui-plugin-types"; // Export the new interface
