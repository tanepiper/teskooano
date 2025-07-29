/**
 * Exports for star renderers
 * Based on stellar evolution theory from https://en.wikipedia.org/wiki/Stellar_evolution
 */

// Base star classes
export * from "./base/base-star";

// Main sequence stars (hydrogen burning)
export * from "./main-sequence/main-sequence-star";

// Mature stars (post-main sequence evolution)
export * from "./mature-stars";

// Stellar remnants
export * from "./remnants/neutron-star";
export * from "./remnants/white-dwarf";

// Black holes
export * from "./black-holes/schwarzschild-black-hole";
export * from "./black-holes/kerr-black-hole";
export * from "./black-holes/gravitational-lensing";

// Mesh creation utilities
export * from "./createMesh";

// Re-export the old factory function name for backward compatibility
export { createMesh as createStarMesh } from "./createMesh";
