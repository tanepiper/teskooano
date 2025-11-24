export * from "./renderer";
export * from "./createMesh";
export * from "./materials/atmosphere.material";
export * from "./materials/atmosphere-tsl.material";
export * from "./materials/atmosphere-factory";
export * from "./materials/procedural-planet.material";
export * from "./materials/procedural-planet-tsl.material";
export * from "./materials/procedural-planet-factory";
export * from "./materials/MaterialFactory";
export * from "./utils/atmosphere-utils";
export * from "./utils/planet-material-utils";

// Re-export old factory function names for backward compatibility
export { createPlanetMesh, createMoonMesh } from "./createMesh";
