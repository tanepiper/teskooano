/**
 * @deprecated This package has been split into individual manager packages:
 * - `@teskooano/renderer-threejs-objects`
 * - `@teskooano/renderer-threejs-orbits`
 * - `@teskooano/renderer-threejs-background`
 * Please update your dependencies.
 */

console.warn(
  "DEPRECATED: @teskooano/renderer-threejs-visualization is deprecated. Use @teskooano/renderer-threejs-objects, @teskooano/renderer-threejs-orbits, and @teskooano/renderer-threejs-background instead.",
);

export {};

// Sub-component specific logic
export * from "./background-manager";
export * from "./object-manager";
export * from "./orbit-manager";

// Main manager classes
export * from "./BackgroundManager";
export * from "./ObjectManager";
export * from "./OrbitManager";

// Enums and Types specific to visualization
export type { VisualizationMode } from "./OrbitManager";

export { ObjectManager } from "./ObjectManager";
