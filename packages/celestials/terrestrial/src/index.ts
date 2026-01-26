export * from "./renderer";
export * from "./createMesh";
export * from "./materials/atmosphere.material";
export * from "./materials/procedural-planet.material";
export * from "./materials/texture-based-planet.material";
export * from "./utils/atmosphere-utils";
export * from "./utils/planet-material-utils";

// Texture generation system
export * from "./texture-generation";

// Re-export old factory function names for backward compatibility
export { createPlanetMesh, createMoonMesh } from "./createMesh";
