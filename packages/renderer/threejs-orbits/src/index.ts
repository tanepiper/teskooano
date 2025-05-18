/**
 * @teskooano/renderer-threejs-orbits
 *
 * Visualization of orbital paths using ThreeJS
 */

// Original exports for backward compatibility
import { OrbitManager, VisualizationMode as LegacyVisualizationMode } from "./OrbitManager";
export { OrbitManager, VisualizationMode as LegacyVisualizationMode } from "./OrbitManager";
export * from "./orbit-manager";

// New refactored exports
// These are the preferred imports for new code
export { OrbitsManager, VisualizationMode } from "./core";
export * from "./core/SharedMaterials";
export * from "./keplerian";
export * from "./verlet";
export * from "./utils";
