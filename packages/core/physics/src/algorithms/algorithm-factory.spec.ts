import { describe, it, expect } from "vitest";
import { AlgorithmFactory } from "./algorithm-factory";
import type {
  AlgorithmType,
  SimulationConfiguration,
} from "@teskooano/core-state";

describe("AlgorithmFactory", () => {
  describe("selectOptimalAlgorithm", () => {
    it("should select direct algorithm for small body counts", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(50);
      expect(algorithm).toBe("direct");
    });

    it("should select barnes-hut for medium body counts", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(500);
      expect(algorithm).toBe("barnes-hut");
    });

    it("should select fmm for large body counts", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(10000);
      expect(algorithm).toBe("fmm");
    });

    it("should respect memory constraints", () => {
      // FMM would be optimal for 10000 bodies, but with low memory constraint should fall back to barnes-hut
      // (direct maxBodies is 1000, so can't handle 10000 bodies)
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(10000, {
        maxMemoryUsage: "low",
      });
      expect(algorithm).toBe("barnes-hut"); // Fallback since direct can't handle 10000 bodies
    });

    it("should prioritize accuracy when requested", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(200, {
        prioritizeAccuracy: true,
      });
      expect(algorithm).toBe("barnes-hut"); // barnes-hut is still optimal range for 200 bodies
    });

    it("should select direct for small systems when prioritizing accuracy", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(50, {
        prioritizeAccuracy: true,
      });
      expect(algorithm).toBe("direct"); // Exact accuracy for small systems
    });

    it("should prioritize speed when requested", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(5000, {
        prioritizeSpeed: true,
      });
      expect(algorithm).toBe("fmm"); // O(N) is fastest for large counts
    });

    it("should fall back to barnes-hut when no algorithm fits constraints", () => {
      // Very large body count with low memory should fall back
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(100000, {
        maxMemoryUsage: "low",
      });
      expect(algorithm).toBe("barnes-hut"); // Fallback
    });
  });

  describe("getPerformanceEstimate", () => {
    it("should return performance estimate for direct algorithm", () => {
      const estimate = AlgorithmFactory.getPerformanceEstimate("direct", 100);

      expect(estimate.accuracy).toBe("exact");
      expect(estimate.memoryUsage).toBe("low");
      expect(estimate.isOptimal).toBe(true); // 100 is in optimal range [1, 100]
      expect(estimate.relativeSpeed).toBeGreaterThan(0);
    });

    it("should return performance estimate for barnes-hut", () => {
      const estimate = AlgorithmFactory.getPerformanceEstimate(
        "barnes-hut",
        1000,
      );

      expect(estimate.accuracy).toBe("high");
      expect(estimate.memoryUsage).toBe("medium");
      expect(estimate.isOptimal).toBe(true); // 1000 is in optimal range [100, 10000]
    });

    it("should indicate when algorithm is not optimal", () => {
      const estimate = AlgorithmFactory.getPerformanceEstimate("direct", 5000);

      expect(estimate.isOptimal).toBe(false); // 5000 is outside optimal range [1, 100]
    });

    it("should calculate relative speed correctly", () => {
      const estimateSmall = AlgorithmFactory.getPerformanceEstimate(
        "direct",
        10,
      );
      const estimateLarge = AlgorithmFactory.getPerformanceEstimate(
        "direct",
        1000,
      );

      // Smaller body count should have better relative speed for O(N²) algorithm
      expect(estimateSmall.relativeSpeed).toBeGreaterThan(
        estimateLarge.relativeSpeed,
      );
    });
  });

  describe("validateAlgorithmChoice", () => {
    it("should validate reasonable algorithm choices", () => {
      const validation = AlgorithmFactory.validateAlgorithmChoice(
        "barnes-hut",
        1000,
      );

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it("should warn about poor algorithm choices", () => {
      const validation = AlgorithmFactory.validateAlgorithmChoice(
        "direct",
        2000,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain("not scale well");
    });

    it("should recommend better algorithms", () => {
      const validation = AlgorithmFactory.validateAlgorithmChoice(
        "direct",
        5000,
      );

      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.recommendations[0]).toContain(
        "might be more efficient",
      );
    });

    it("should warn about specific performance issues", () => {
      const validation = AlgorithmFactory.validateAlgorithmChoice(
        "direct",
        600,
      );

      expect(validation.warnings.some((w) => w.includes("very slow"))).toBe(
        true,
      );
    });

    it("should warn about FMM overhead for small systems", () => {
      const validation = AlgorithmFactory.validateAlgorithmChoice("fmm", 1500);

      expect(validation.warnings.some((w) => w.includes("overhead"))).toBe(
        true,
      );
    });
  });

  describe("getAlgorithmInfo", () => {
    it("should return complete algorithm information", () => {
      const info = AlgorithmFactory.getAlgorithmInfo("barnes-hut");

      expect(info.type).toBe("barnes-hut");
      expect(info.complexity).toBe("O(N log N)");
      expect(info.description).toBeDefined();
      expect(info.optimalRange).toHaveLength(2);
      expect(info.memoryUsage).toBeDefined();
      expect(info.accuracy).toBeDefined();
    });

    it("should return information for all algorithm types", () => {
      const algorithms: AlgorithmType[] = [
        "direct",
        "barnes-hut",
        "fmm",
        "p3m",
      ];

      algorithms.forEach((algorithm) => {
        const info = AlgorithmFactory.getAlgorithmInfo(algorithm);
        expect(info.type).toBe(algorithm);
      });
    });
  });

  describe("getAllAlgorithms", () => {
    it("should return all available algorithms", () => {
      const algorithms = AlgorithmFactory.getAllAlgorithms();

      expect(Object.keys(algorithms)).toContain("direct");
      expect(Object.keys(algorithms)).toContain("barnes-hut");
      expect(Object.keys(algorithms)).toContain("fmm");
      expect(Object.keys(algorithms)).toContain("p3m");
    });

    it("should return immutable copy", () => {
      const algorithms1 = AlgorithmFactory.getAllAlgorithms();
      const algorithms2 = AlgorithmFactory.getAllAlgorithms();

      expect(algorithms1).not.toBe(algorithms2); // Different objects
      expect(algorithms1).toEqual(algorithms2); // Same content
    });
  });

  describe("createOptimalConfiguration", () => {
    it("should create ideal configuration when requested", () => {
      const config = AlgorithmFactory.createOptimalConfiguration(1000, "ideal");

      expect(config.mode).toBe("ideal");
      expect(config.algorithm).toBeUndefined();
      expect(config.integrator).toBeUndefined();
    });

    it("should create nbody configuration with optimal algorithm", () => {
      const config = AlgorithmFactory.createOptimalConfiguration(500, "nbody");

      expect(config.mode).toBe("nbody");
      expect(config.algorithm).toBe("barnes-hut"); // Optimal for 500 bodies
      expect(config.integrator).toBe("verlet"); // Default for speed
    });

    it("should use high-accuracy integrator when requested", () => {
      const config = AlgorithmFactory.createOptimalConfiguration(500, "nbody", {
        prioritizeAccuracy: true,
      });

      expect(config.integrator).toBe("rk4"); // High accuracy
    });

    it("should respect all preferences", () => {
      const config = AlgorithmFactory.createOptimalConfiguration(
        2000,
        "nbody",
        {
          prioritizeAccuracy: true,
          maxMemoryUsage: "medium",
        },
      );

      expect(config.mode).toBe("nbody");
      expect(config.integrator).toBe("rk4");
      // Algorithm should respect memory constraint
      expect(["direct", "barnes-hut", "p3m"]).toContain(config.algorithm);
    });
  });

  describe("edge cases", () => {
    it("should handle zero bodies gracefully", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(0);
      expect(algorithm).toBe("barnes-hut"); // Fallback
    });

    it("should handle extremely large body counts", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(1000000);
      expect(algorithm).toBe("fmm"); // Best for very large systems
    });

    it("should handle negative body counts", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(-10);
      expect(algorithm).toBe("barnes-hut"); // Fallback
    });
  });
});
