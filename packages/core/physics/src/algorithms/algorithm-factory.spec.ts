import { describe, it, expect } from "vitest";
import { AlgorithmFactory } from "./algorithm-factory";
import type {
  AlgorithmType,
  SimulationConfiguration,
} from "@teskooano/core-state";
import { SimulationMode } from "@teskooano/data-types";

describe("AlgorithmFactory", () => {
  describe("selectOptimalAlgorithm", () => {
    it("should select barnes-hut algorithm for small body counts", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(50);
      expect(algorithm).toBe("barnes-hut");
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

    it("should select barnes-hut for small systems when prioritizing accuracy", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(50, {
        prioritizeAccuracy: true,
      });
      expect(algorithm).toBe("barnes-hut"); // barnes-hut for small systems
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
    it("should return performance estimate for barnes-hut algorithm", () => {
      const estimate = AlgorithmFactory.getPerformanceEstimate(
        "barnes-hut",
        100,
      );

      expect(estimate.accuracy).toBe("high");
      expect(estimate.memoryUsage).toBe("medium");
      expect(estimate.isOptimal).toBe(true); // 100 is in optimal range [2, 10000]
      expect(estimate.relativeSpeed).toBeGreaterThan(0);
    });

    it("should return performance estimate for barnes-hut", () => {
      const estimate = AlgorithmFactory.getPerformanceEstimate(
        "barnes-hut",
        1000,
      );

      expect(estimate.accuracy).toBe("high");
      expect(estimate.memoryUsage).toBe("medium");
      expect(estimate.isOptimal).toBe(true); // 1000 is in optimal range [2, 10000]
    });

    it("should indicate when algorithm is not optimal", () => {
      const estimate = AlgorithmFactory.getPerformanceEstimate(
        "barnes-hut",
        50000,
      );

      expect(estimate.isOptimal).toBe(false); // 50000 is outside optimal range [2, 10000]
    });

    it("should calculate relative speed correctly", () => {
      const estimateSmall = AlgorithmFactory.getPerformanceEstimate(
        "barnes-hut",
        10,
      );
      const estimateLarge = AlgorithmFactory.getPerformanceEstimate(
        "barnes-hut",
        1000,
      );

      expect(estimateSmall.relativeSpeed).toBeGreaterThan(0);
      expect(estimateLarge.relativeSpeed).toBeGreaterThan(0);
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
      const validation = AlgorithmFactory.validateAlgorithmChoice("fmm", 10);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });

    it("should recommend better algorithms", () => {
      const validation = AlgorithmFactory.validateAlgorithmChoice("p3m", 50);

      expect(
        validation.recommendations.some((rec) => rec.includes("barnes-hut")),
      ).toBe(true);
    });

    it("should warn about specific performance issues", () => {
      const validation = AlgorithmFactory.validateAlgorithmChoice("fmm", 100);

      expect(validation.warnings.some((w) => w.includes("overhead"))).toBe(
        true,
      );
    });

    it("should warn about FMM overhead for small systems", () => {
      const validation = AlgorithmFactory.validateAlgorithmChoice("fmm", 500);

      expect(validation.warnings.some((w) => w.includes("FMM"))).toBe(true);
    });
  });

  describe("getAlgorithmInfo", () => {
    it("should return complete algorithm information", () => {
      const info = AlgorithmFactory.getAlgorithmInfo("barnes-hut");

      expect(info.type).toBe("barnes-hut");
      expect(info.complexity).toBe("O(N log N)");
      expect(info.description).toBeTruthy();
      expect(info.optimalRange).toEqual([2, 10000]);
    });

    it("should return information for all algorithm types", () => {
      const algorithms: AlgorithmType[] = [
        "barnes-hut",
        "fmm",
        "p3m",
        "tree-pm",
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

      expect(Object.keys(algorithms)).toContain("barnes-hut");
      expect(Object.keys(algorithms)).toContain("fmm");
      expect(Object.keys(algorithms)).toContain("p3m");
      expect(Object.keys(algorithms)).toContain("tree-pm");
    });

    it("should return immutable copy", () => {
      const algorithms1 = AlgorithmFactory.getAllAlgorithms();
      const algorithms2 = AlgorithmFactory.getAllAlgorithms();

      expect(algorithms1).not.toBe(algorithms2);
    });
  });

  describe("createOptimalConfiguration", () => {
    it("should create ideal configuration when requested", () => {
      const config = AlgorithmFactory.createOptimalConfiguration(
        100,
        SimulationMode.IDEAL,
      );

      expect(config.mode).toBe("ideal");
      expect(config.integrator).toBeUndefined();
      expect(config.algorithm).toBeUndefined();
    });

    it("should create nbody configuration with optimal algorithm", () => {
      const config = AlgorithmFactory.createOptimalConfiguration(
        1000,
        SimulationMode.NBODY,
      );

      expect(config.mode).toBe("nbody");
      expect(config.algorithm).toBe("barnes-hut");
      expect(config.integrator).toBe("verlet");
    });

    it("should use high-accuracy integrator when requested", () => {
      const config = AlgorithmFactory.createOptimalConfiguration(
        500,
        SimulationMode.NBODY,
        {
          prioritizeAccuracy: true,
        },
      );

      expect(config.integrator).toBe("rk4");
    });

    it("should respect all preferences", () => {
      const config = AlgorithmFactory.createOptimalConfiguration(
        10000,
        SimulationMode.NBODY,
        {
          prioritizeSpeed: true,
          maxMemoryUsage: "medium",
        },
      );

      expect(config.algorithm).toBe("fmm");
      expect(config.integrator).toBe("verlet");
    });
  });

  describe("edge cases", () => {
    it("should handle zero bodies gracefully", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(0);
      expect(algorithm).toBe("barnes-hut"); // Fallback
    });

    it("should handle extremely large body counts", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(1000000);
      expect(algorithm).toBe("fmm");
    });

    it("should handle negative body counts", () => {
      const algorithm = AlgorithmFactory.selectOptimalAlgorithm(-10);
      expect(algorithm).toBe("barnes-hut"); // Fallback
    });
  });
});
