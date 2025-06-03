export * from "./scaling";
export * from "./physics";
export * from "./celestials/common";
export * from "./ui";
export * from "./events";
export * from "./globals.d";
export type { ICelestialLabelComponent } from "./ui-plugin-types"; // Export the new interface
export type {
  CelestialObject,
  StarProperties,
  PlanetProperties,
  GasGiantProperties,
} from "./old-celestial";
