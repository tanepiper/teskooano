export * from "./material";
export * from "./renderer";
export * from "./createMesh";

// Re-export the old factory function name for backward compatibility
export { createMesh as createAsteroidMesh } from "./createMesh";
