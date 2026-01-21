// Mature Stars - Post-Main Sequence Evolution
// Based on stellar evolution theory from https://en.wikipedia.org/wiki/Stellar_evolution

// Subgiant Phase
export { SubgiantMaterial, SubgiantRenderer } from "./subgiant/subgiant";

// Red Giant Phase
export { RedGiantRenderer } from "./red-giant/red-giant";

// Horizontal Branch Phase
export {
  HorizontalBranchMaterial,
  HorizontalBranchRenderer,
} from "./horizontal-branch/horizontal-branch";

// Asymptotic Giant Branch Phase
export { AGBMaterial, AGBRenderer } from "./asymptotic-giant-branch/agb";

// Post-AGB Phase
export { PostAGBMaterial, PostAGBRenderer } from "./post-agb/post-agb";

// Supergiant Phase
export { SupergiantRenderer } from "./supergiant/supergiant";

// Legacy imports (moved from post-main-sequence)
export { HypergiantRenderer } from "./supergiant/hypergiant";
export { WolfRayetMaterial, WolfRayetRenderer } from "./supergiant/wolf-rayet";
