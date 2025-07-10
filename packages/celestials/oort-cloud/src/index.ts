export * from "./renderer";
export * from "./createMesh";
export * from "./material";

// Re-export the old factory function name for backward compatibility
export { createMesh as createOortCloudMesh } from "./createMesh";
