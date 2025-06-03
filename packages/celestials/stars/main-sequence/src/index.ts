export { MainSequenceStarRenderer } from "./base/star-renderer";
export { MainSequenceStarCelestial } from "./base/star-celestial";
export {
  MainSequenceStarMaterial,
  type MainSequenceStarMaterials,
  type MainSequenceStarMaterialOptions,
} from "./base/star-material";
export {
  CelestialCoronaMaterial,
  type CoronaMaterialOptions,
} from "./base/corona-material";
export {
  getStarColor,
  type StarColorDeterminationProperties,
} from "./utils/star-color-utils";

// Export G-class implementation
export * from "./class-g";

// Export K-class implementation
export * from "./class-k";

// Export M-class implementation
export * from "./class-m";

// Export F-class implementation
export * from "./class-f";

// Export A-class implementation
export * from "./class-a";

// Export B-class implementation
export * from "./class-b";

// Export O-class implementation
export * from "./class-o";

// Export types
export type {
  MainSequenceStar,
  MainSequenceStarConstructorParams,
  MainSequenceStarRendererOptions,
  StarPhysicalProperties,
  StarShaderUniforms,
} from "./types/star.types";
