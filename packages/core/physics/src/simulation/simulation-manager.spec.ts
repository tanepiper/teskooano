import { describe, expect, it, beforeEach, vi } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import {
  OrbitalParameters,
  PhysicsStateReal,
  SimulationMode,
  AlgorithmType,
  IntegratorType,
} from "@teskooano/data-types";
import type { SimulationConfiguration } from "@teskooano/core-state";
import {
  SimulationManager,
  type SimulationManagerParams,
} from "./simulation-manager";

describe("SimulationManager", () => {
  let manager: SimulationManager;

  beforeEach(() => {
    manager = new SimulationManager();
  });

  const mockStar: PhysicsStateReal = {
    id: "central-star",
    mass_kg: 1.989e30,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  };

  const mockBody: PhysicsStateReal = {
    id: "test-body",
    mass_kg: 5.972e24,
    position_m: new OSVector3(1.496e11, 0, 0),
    velocity_mps: new OSVector3(0, 29780, 0),
  };

  const mockOrbitalParams: OrbitalParameters = {
    realSemiMajorAxis_m: 1.496e11,
    eccentricity: 0.0167,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 31557600,
    realAphelion_m: 1.521e11,
    realPerihelion_m: 1.471e11,
    averageOrbitalSpeed_mps: 29780,
    epoch: "J2000",
  };

  describe("ideal mode simulation", () => {
    it("should successfully execute ideal mode simulation", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.IDEAL,
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: config,
        orbitalParameters: new Map([["test-body", mockOrbitalParams]]),
        parentIds: new Map([["test-body", "central-star"]]),
        currentTime_s: 0,
      };

      const result = manager.simulate(params);

      expect(result.metadata.mode).toBe("ideal");
      expect(result.states).toHaveLength(2);
      expect(result.accelerations.size).toBe(0); // No force calculations in ideal mode
    });

    it("should validate required parameters for ideal mode", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.IDEAL,
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: config,
        // Missing orbitalParameters and parentIds - should throw error
      };

      expect(() => manager.simulate(params)).toThrow(
        /Invalid simulation configuration/,
      );
    });
  });

  describe("nbody mode simulation", () => {
    it("should successfully execute nbody mode simulation", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        algorithm: AlgorithmType.BARNES_HUT,
        integrator: IntegratorType.VERLET,
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: config,
        radii: new Map([
          ["central-star", 1000],
          ["test-body", 100],
        ]),
        isStar: new Map([
          ["central-star", true],
          ["test-body", false],
        ]),
        bodyTypes: new Map(),
      };

      const result = manager.simulate(params);

      expect(result.metadata.mode).toBe("nbody");
      expect(result.metadata.algorithm).toBe("barnes-hut");
      expect(result.metadata.integrator).toBe("verlet");
      expect(result.states).toHaveLength(2);
      expect(result.accelerations.size).toBeGreaterThanOrEqual(0);
    });

    it("should auto-select algorithm when requested", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        algorithm: AlgorithmType.BARNES_HUT, // Will be overridden by auto-selection
        integrator: IntegratorType.VERLET,
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: config,
        autoSelectAlgorithm: true,
        performancePreferences: {
          prioritizeSpeed: true,
        },
      };

      const result = manager.simulate(params);

      expect(result.metadata.mode).toBe("nbody");
      // Should auto-select based on body count and preferences
      expect(result.metadata.algorithm).toBeDefined();
    });
  });

  describe("createOptimalConfiguration", () => {
    it("should recommend ideal mode when orbital data available and small system", () => {
      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: {
          mode: SimulationMode.NBODY,
          algorithm: AlgorithmType.BARNES_HUT,
          integrator: IntegratorType.EULER,
        }, // placeholder
        orbitalParameters: new Map([["test-body", mockOrbitalParams]]),
        parentIds: new Map([["test-body", "central-star"]]),
      };

      const config = manager.createOptimalConfiguration(params);

      expect(config.mode).toBe("ideal");
      expect(config.algorithm).toBeUndefined();
      expect(config.integrator).toBeUndefined();
    });

    it("should recommend nbody mode for large systems", () => {
      const largeBodies = Array.from({ length: 2000 }, (_, i) => ({
        ...mockBody,
        id: `body-${i}`,
      }));

      const params: SimulationManagerParams = {
        bodies: largeBodies,
        deltaTime: 3600,
        configuration: {
          mode: SimulationMode.NBODY,
          algorithm: AlgorithmType.BARNES_HUT,
          integrator: IntegratorType.EULER,
        }, // placeholder
        performancePreferences: {
          prioritizeSpeed: true,
        },
      };

      const config = manager.createOptimalConfiguration(params);

      expect(config.mode).toBe("nbody");
      expect(config.algorithm).toBeDefined();
      expect(config.integrator).toBeDefined();
    });

    it("should respect performance preferences", () => {
      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: {
          mode: SimulationMode.NBODY,
          algorithm: AlgorithmType.BARNES_HUT,
          integrator: IntegratorType.EULER,
        }, // placeholder
        performancePreferences: {
          prioritizeAccuracy: true,
        },
      };

      const config = manager.createOptimalConfiguration(params);

      expect(config.mode).toBe("nbody");
      expect(config.integrator).toBe("rk4"); // High accuracy integrator
    });
  });

  describe("getPerformanceComparison", () => {
    it("should indicate ideal mode availability when orbital data present", () => {
      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: {
          mode: SimulationMode.NBODY,
          algorithm: AlgorithmType.BARNES_HUT,
          integrator: IntegratorType.EULER,
        }, // placeholder
        orbitalParameters: new Map([["test-body", mockOrbitalParams]]),
        parentIds: new Map([["test-body", "central-star"]]),
      };

      const comparison = manager.getPerformanceComparison(params);

      expect(comparison.ideal?.available).toBe(true);
      expect(comparison.ideal?.estimatedSpeed).toBe(2); // 2 bodies
    });

    it("should indicate ideal mode unavailable when orbital data missing", () => {
      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: {
          mode: SimulationMode.NBODY,
          algorithm: AlgorithmType.BARNES_HUT,
          integrator: IntegratorType.EULER,
        }, // placeholder
      };

      const comparison = manager.getPerformanceComparison(params);

      expect(comparison.ideal?.available).toBe(false);
      expect(comparison.ideal?.reason).toContain("Missing orbital parameters");
    });

    it("should provide estimates for all algorithm combinations", () => {
      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: {
          mode: SimulationMode.NBODY,
          algorithm: AlgorithmType.BARNES_HUT,
          integrator: IntegratorType.EULER,
        }, // placeholder
      };

      const comparison = manager.getPerformanceComparison(params);

      expect(comparison.configurations.length).toBe(36); // 4 algorithms × 9 integrators

      // Should be sorted by relative speed
      const speeds = comparison.configurations.map(
        (c) => c.estimate.relativeSpeed,
      );
      expect(speeds).toEqual([...speeds].sort((a, b) => b - a)); // Descending order
    });

    it("should include validation results for each configuration", () => {
      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: {
          mode: SimulationMode.NBODY,
          algorithm: AlgorithmType.BARNES_HUT,
          integrator: IntegratorType.EULER,
        }, // placeholder
      };

      const comparison = manager.getPerformanceComparison(params);

      comparison.configurations.forEach((config) => {
        expect(config.validation).toBeDefined();
        expect(typeof config.validation.isValid).toBe("boolean");
        expect(Array.isArray(config.validation.warnings)).toBe(true);
        expect(Array.isArray(config.validation.recommendations)).toBe(true);
      });
    });
  });

  describe("validation", () => {
    it("should validate basic configuration requirements", () => {
      const invalidConfig = {} as SimulationConfiguration;

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: invalidConfig,
      };

      expect(() => manager.simulate(params)).toThrow(
        /Simulation mode is required/,
      );
    });

    it("should validate nbody mode requirements", () => {
      const incompleteConfig: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        // Missing algorithm and integrator
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: incompleteConfig,
      };

      expect(() => manager.simulate(params)).toThrow(/Algorithm required/);
    });

    it("should provide warnings for missing optional parameters", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        algorithm: AlgorithmType.BARNES_HUT,
        integrator: IntegratorType.VERLET,
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: config,
        // Missing radii - should warn but not error
      };

      const result = manager.simulate(params);
      expect(result.metadata.warnings).toBeDefined();
    });
  });

  describe("performance analysis", () => {
    it("should add performance recommendations", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        algorithm: AlgorithmType.BARNES_HUT,
        integrator: IntegratorType.VERLET,
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: config,
        orbitalParameters: new Map([["test-body", mockOrbitalParams]]),
        parentIds: new Map([["test-body", "central-star"]]),
      };

      const result = manager.simulate(params);

      expect(result.metadata.recommendations).toBeDefined();
      expect(Array.isArray(result.metadata.recommendations)).toBe(true);
    });

    it("should warn about slow execution times", () => {
      // Mock performance.now to simulate slow execution
      const originalNow = performance.now;
      let callCount = 0;
      vi.spyOn(performance, "now").mockImplementation(() => {
        return callCount++ === 0 ? 0 : 150; // 150ms execution time
      });

      const config: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        algorithm: AlgorithmType.BARNES_HUT,
        integrator: IntegratorType.VERLET,
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: config,
      };

      const result = manager.simulate(params);

      expect(result.metadata.warnings?.some((w) => w.includes("150.0ms"))).toBe(
        true,
      );

      // Restore original implementation
      performance.now = originalNow;
    });

    it("should include performance profile in metadata", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        algorithm: AlgorithmType.BARNES_HUT,
        integrator: IntegratorType.VERLET,
      };

      const params: SimulationManagerParams = {
        bodies: [mockStar, mockBody],
        deltaTime: 3600,
        configuration: config,
      };

      const result = manager.simulate(params);

      expect(result.metadata.performanceProfile).toBeDefined();
      expect(typeof result.metadata.performanceProfile!.relativeSpeed).toBe(
        "number",
      );
      expect(result.metadata.performanceProfile!.memoryUsage).toBeDefined();
      expect(result.metadata.performanceProfile!.accuracy).toBeDefined();
      expect(typeof result.metadata.performanceProfile!.isOptimal).toBe(
        "boolean",
      );
    });
  });
});
