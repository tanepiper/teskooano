import { describe, expect, it, beforeEach } from "vitest";
import { StellarSystemConfigurator } from "./stellar-system-configurator";
import { StellarSystemType } from "./types";

describe("StellarSystemConfigurator", () => {
  let configurator: StellarSystemConfigurator;
  let mockRandom: () => number;

  beforeEach(() => {
    mockRandom = () => 0.5; // Default to middle value
    configurator = new StellarSystemConfigurator(mockRandom);
  });

  describe("determineStellarConfiguration", () => {
    it("should return BINARY_CLOSE for low random values", () => {
      mockRandom = () => 0.3; // 30% - should be BINARY_CLOSE
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.BINARY_CLOSE);
      expect(config.stars).toBe(2);
      expect(config.systemName).toBe("Binary System");
      expect(config.description).toBe("A dramatic binary system");
    });

    it("should return SINGLE_STAR for medium-low random values", () => {
      mockRandom = () => 0.7; // 70% - should be SINGLE_STAR
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.SINGLE_STAR);
      expect(config.stars).toBe(1);
      expect(config.systemName).toBe("Single Star System");
      expect(config.description).toBe("A lonely single star");
    });

    it("should return BINARY_WIDE for medium-high random values", () => {
      mockRandom = () => 0.9; // 90% - should be BINARY_WIDE
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.BINARY_WIDE);
      expect(config.stars).toBe(2);
      expect(config.systemName).toBe("Wide Binary System");
      expect(config.description).toBe("A wide binary system");
    });

    it("should return TRIPLE_HIERARCHICAL for high random values", () => {
      mockRandom = () => 0.97; // 97% - should be TRIPLE_HIERARCHICAL
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.TRIPLE_HIERARCHICAL);
      expect(config.stars).toBe(3);
      expect(config.systemName).toBe("Triple System");
      expect(config.description).toBe("A complex triple system");
    });

    it("should return MULTIPLE_COMPLEX for very high random values", () => {
      mockRandom = () => 0.99; // 99% - should be MULTIPLE_COMPLEX
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.MULTIPLE_COMPLEX);
      expect(config.stars).toBeGreaterThanOrEqual(4);
      expect(config.stars).toBeLessThanOrEqual(6);
      expect(config.systemName).toBe("Complex System");
      expect(config.description).toBe("A chaotic multiple star system");
    });

    it("should handle edge case at 0.6", () => {
      mockRandom = () => 0.6; // Exactly at BINARY_CLOSE boundary
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.SINGLE_STAR);
      expect(config.stars).toBe(1);
    });

    it("should handle edge case at 0.85", () => {
      mockRandom = () => 0.85; // Exactly at SINGLE_STAR boundary
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.BINARY_WIDE);
      expect(config.stars).toBe(2);
    });

    it("should handle edge case at 0.95", () => {
      mockRandom = () => 0.95; // Exactly at BINARY_WIDE boundary
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.TRIPLE_HIERARCHICAL);
      expect(config.stars).toBe(3);
    });

    it("should handle edge case at 0.98", () => {
      mockRandom = () => 0.98; // Exactly at TRIPLE_HIERARCHICAL boundary
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.MULTIPLE_COMPLEX);
      expect(config.stars).toBeGreaterThanOrEqual(4);
      expect(config.stars).toBeLessThanOrEqual(7);
    });

    it("should handle edge case at 1.0", () => {
      mockRandom = () => 1.0; // Maximum value
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.MULTIPLE_COMPLEX);
      expect(config.stars).toBeGreaterThanOrEqual(4);
      expect(config.stars).toBeLessThanOrEqual(7);
    });

    it("should handle edge case at 0.0", () => {
      mockRandom = () => 0.0; // Minimum value
      configurator = new StellarSystemConfigurator(mockRandom);

      const config = configurator.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.BINARY_CLOSE);
      expect(config.stars).toBe(2);
    });

    it("should generate consistent results with same random seed", () => {
      let callCount = 0;
      mockRandom = () => {
        callCount++;
        return 0.5; // Consistent value
      };
      configurator = new StellarSystemConfigurator(mockRandom);

      const config1 = configurator.determineStellarConfiguration();
      const config2 = configurator.determineStellarConfiguration();

      expect(config1).toEqual(config2);
      expect(callCount).toBe(2); // Should be called twice
    });

    it("should generate different results with different random values", () => {
      let callCount = 0;
      mockRandom = () => {
        callCount++;
        return callCount === 1 ? 0.3 : 0.9; // Different values
      };
      configurator = new StellarSystemConfigurator(mockRandom);

      const config1 = configurator.determineStellarConfiguration();
      const config2 = configurator.determineStellarConfiguration();

      expect(config1.type).not.toBe(config2.type);
      expect(callCount).toBe(2); // Should be called twice
    });

    it("should have correct probability distribution", () => {
      const results: Record<string, number> = {};
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const randomValue = Math.random();
        mockRandom = () => randomValue;
        configurator = new StellarSystemConfigurator(mockRandom);

        const config = configurator.determineStellarConfiguration();
        const type = config.type;
        results[type] = (results[type] || 0) + 1;
      }

      // Check that we get reasonable distributions
      // BINARY_CLOSE should be ~60% (0.0-0.6)
      expect(results[StellarSystemType.BINARY_CLOSE] / iterations).toBeCloseTo(
        0.6,
        1,
      );

      // SINGLE_STAR should be ~25% (0.6-0.85)
      expect(results[StellarSystemType.SINGLE_STAR] / iterations).toBeCloseTo(
        0.25,
        1,
      );

      // BINARY_WIDE should be ~10% (0.85-0.95)
      expect(results[StellarSystemType.BINARY_WIDE] / iterations).toBeCloseTo(
        0.1,
        1,
      );

      // TRIPLE_HIERARCHICAL should be ~3% (0.95-0.98)
      expect(
        results[StellarSystemType.TRIPLE_HIERARCHICAL] / iterations,
      ).toBeCloseTo(0.03, 1);

      // MULTIPLE_COMPLEX should be ~2% (0.98-1.0)
      expect(
        results[StellarSystemType.MULTIPLE_COMPLEX] / iterations,
      ).toBeCloseTo(0.02, 1);
    });
  });
});
