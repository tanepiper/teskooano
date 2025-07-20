import { StellarSystemType, type StellarSystemConfiguration } from "./types";

/**
 * Handles stellar system configuration determination
 */
export class StellarSystemConfigurator {
  private readonly random: () => number;

  constructor(random: () => number) {
    this.random = random;
  }

  /**
   * Determines the stellar system configuration based on probability
   */
  determineStellarConfiguration(): StellarSystemConfiguration {
    const roll = this.random();

    if (roll < 0.6) {
      return {
        type: StellarSystemType.BINARY_CLOSE,
        stars: 2,
        systemName: "Binary System", // Will be overridden with actual star name
        description: "A dramatic binary system", // Will be overridden with random description
      };
    } else if (roll < 0.85) {
      return {
        type: StellarSystemType.SINGLE_STAR,
        stars: 1,
        systemName: "Single Star System", // Will be overridden with actual star name
        description: "A lonely single star", // Will be overridden with random description
      };
    } else if (roll < 0.95) {
      return {
        type: StellarSystemType.BINARY_WIDE,
        stars: 2,
        systemName: "Wide Binary System", // Will be overridden with actual star name
        description: "A wide binary system", // Will be overridden with random description
      };
    } else if (roll < 0.98) {
      return {
        type: StellarSystemType.TRIPLE_HIERARCHICAL,
        stars: 3,
        systemName: "Triple System", // Will be overridden with actual star name
        description: "A complex triple system", // Will be overridden with random description
      };
    } else {
      return {
        type: StellarSystemType.MULTIPLE_COMPLEX,
        stars: Math.floor(this.random() * 3) + 4,
        systemName: "Complex System", // Will be overridden with actual star name
        description: "A chaotic multiple star system", // Will be overridden with random description
      };
    }
  }
}
