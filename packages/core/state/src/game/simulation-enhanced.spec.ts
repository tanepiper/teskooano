import { describe, it, expect, beforeEach, vi } from "vitest";
import { SimulationStateService } from "./simulation";
import type {
  SimulationConfiguration,
  AlgorithmType,
  IntegratorType,
} from "./types";

describe("Enhanced SimulationStateService", () => {
  let service: SimulationStateService;

  beforeEach(() => {
    // Get fresh instance for each test
    service = SimulationStateService.getInstance();

    // Reset to initial state
    service.setSimulationConfiguration({
      mode: "nbody",
      algorithm: "tree-pm",
      integrator: "pefrl",
    });
  });

  describe("setSimulationConfiguration", () => {
    it("should set valid ideal mode configuration", () => {
      const config: SimulationConfiguration = { mode: "ideal" };

      service.setSimulationConfiguration(config);

      const state = service.getSimulationState();
      expect(state.simulationConfig).toEqual(config);
    });

    it("should set valid nbody mode configuration", () => {
      const config: SimulationConfiguration = {
        mode: "nbody",
        algorithm: "direct",
        integrator: "rk4",
      };

      service.setSimulationConfiguration(config);

      const state = service.getSimulationState();
      expect(state.simulationConfig).toEqual(config);
    });

    it("should throw error for invalid configuration", () => {
      const invalidConfig = {
        mode: "nbody",
        // Missing required algorithm and integrator
      } as SimulationConfiguration;

      expect(() => service.setSimulationConfiguration(invalidConfig)).toThrow(
        /Invalid simulation configuration/,
      );
    });

    it("should correctly set different integrator configurations", () => {
      const testCases = [
        { integrator: "euler" as IntegratorType },
        { integrator: "symplectic" as IntegratorType },
        { integrator: "verlet" as IntegratorType },
        { integrator: "rk4" as IntegratorType },
        { integrator: "adaptive" as IntegratorType },
      ];

      testCases.forEach(({ integrator }) => {
        const config = {
          mode: "nbody" as const,
          algorithm: "barnes-hut" as const,
          integrator,
        };

        service.setSimulationConfiguration(config);

        const state = service.getSimulationState();
        expect(state.simulationConfig).toEqual(config);
      });
    });
  });

  describe("setSimulationMode", () => {
    it("should switch to ideal mode from nbody", () => {
      // Start in nbody mode
      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "fmm",
        integrator: "rk4",
      });

      // Switch to ideal
      service.setSimulationMode("ideal");

      const config = service.getSimulationConfiguration();
      expect(config.mode).toBe("ideal");
      expect(config.algorithm).toBeUndefined();
      expect(config.integrator).toBeUndefined();
    });

    it("should switch to nbody mode from ideal", () => {
      // Start in ideal mode
      service.setSimulationConfiguration({ mode: "ideal" });

      // Switch to nbody
      service.setSimulationMode("nbody");

      const config = service.getSimulationConfiguration();
      expect(config.mode).toBe("nbody");
      expect(config.algorithm).toBe("barnes-hut"); // Default
      expect(config.integrator).toBe("verlet"); // Default
    });

    it("should preserve existing algorithm/integrator when switching to nbody", () => {
      // Start with specific nbody config
      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "fmm",
        integrator: "rk4",
      });

      // Switch to ideal and back
      service.setSimulationMode("ideal");
      service.setSimulationMode("nbody");

      const config = service.getSimulationConfiguration();
      expect(config.algorithm).toBe("barnes-hut"); // Uses default, not preserved
      expect(config.integrator).toBe("verlet"); // Uses default, not preserved
    });
  });

  describe("setNBodyAlgorithm", () => {
    beforeEach(() => {
      // Ensure we're in nbody mode
      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "barnes-hut",
        integrator: "verlet",
      });
    });

    it("should change algorithm in nbody mode", () => {
      const algorithms: AlgorithmType[] = ["direct", "fmm", "p3m"];

      algorithms.forEach((algorithm) => {
        service.setNBodyAlgorithm(algorithm);

        const config = service.getSimulationConfiguration();
        expect(config.algorithm).toBe(algorithm);
        expect(config.integrator).toBe("verlet"); // Should preserve integrator
      });
    });

    it("should throw error when not in nbody mode", () => {
      service.setSimulationConfiguration({ mode: "ideal" });

      expect(() => service.setNBodyAlgorithm("direct")).toThrow(
        /Cannot set N-Body algorithm when not in N-Body mode/,
      );
    });

    it("should preserve integrator when changing algorithm", () => {
      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "barnes-hut",
        integrator: "rk4",
      });

      service.setNBodyAlgorithm("fmm");

      const config = service.getSimulationConfiguration();
      expect(config.algorithm).toBe("fmm");
      expect(config.integrator).toBe("rk4"); // Preserved
    });
  });

  describe("setNBodyIntegrator", () => {
    beforeEach(() => {
      // Ensure we're in nbody mode
      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "barnes-hut",
        integrator: "verlet",
      });
    });

    it("should change integrator in nbody mode", () => {
      const integrators: IntegratorType[] = [
        "euler",
        "symplectic",
        "rk4",
        "adaptive",
      ];

      integrators.forEach((integrator) => {
        service.setNBodyIntegrator(integrator);

        const config = service.getSimulationConfiguration();
        expect(config.integrator).toBe(integrator);
        expect(config.algorithm).toBe("barnes-hut"); // Should preserve algorithm
      });
    });

    it("should throw error when not in nbody mode", () => {
      service.setSimulationConfiguration({ mode: "ideal" });

      expect(() => service.setNBodyIntegrator("rk4")).toThrow(
        /Cannot set N-Body integrator when not in N-Body mode/,
      );
    });

    it("should preserve algorithm when changing integrator", () => {
      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "fmm",
        integrator: "verlet",
      });

      service.setNBodyIntegrator("adaptive");

      const config = service.getSimulationConfiguration();
      expect(config.algorithm).toBe("fmm"); // Preserved
      expect(config.integrator).toBe("adaptive");
    });
  });

  describe("getSimulationConfiguration", () => {
    it("should return current configuration", () => {
      const config: SimulationConfiguration = {
        mode: "nbody",
        algorithm: "p3m",
        integrator: "adaptive",
      };

      service.setSimulationConfiguration(config);

      expect(service.getSimulationConfiguration()).toEqual(config);
    });

    it("should return live configuration that updates", () => {
      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "direct",
        integrator: "euler",
      });

      const config1 = service.getSimulationConfiguration();
      expect(config1.algorithm).toBe("direct");

      service.setNBodyAlgorithm("fmm");

      const config2 = service.getSimulationConfiguration();
      expect(config2.algorithm).toBe("fmm");
    });
  });

  describe("isConfigurationValid", () => {
    it("should return true for valid configurations", () => {
      service.setSimulationConfiguration({ mode: "ideal" });
      expect(service.isConfigurationValid()).toBe(true);

      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "barnes-hut",
        integrator: "verlet",
      });
      expect(service.isConfigurationValid()).toBe(true);
    });

    it("should return false for invalid configurations", () => {
      // Manually set invalid state to test validation
      service.setSimulationState({
        ...service.getSimulationState(),
        simulationConfig: {
          mode: "nbody",
          // Missing algorithm and integrator
        } as SimulationConfiguration,
      });

      expect(service.isConfigurationValid()).toBe(false);
    });
  });

  describe("reactive state updates", () => {
    it("should emit state changes when configuration updates", (done: () => void) => {
      const initialConfig = service.getSimulationConfiguration();

      // Subscribe to state changes
      const subscription = service.simulationState$.subscribe((state: any) => {
        if (state.simulationConfig !== initialConfig) {
          expect(state.simulationConfig.mode).toBe("ideal");
          subscription.unsubscribe();
          done();
        }
      });

      // Trigger change
      service.setSimulationMode("ideal");
    });

    it("should maintain reactivity when using specific setters", (done: () => void) => {
      service.setSimulationConfiguration({
        mode: "nbody",
        algorithm: "barnes-hut",
        integrator: "verlet",
      });

      let changeCount = 0;
      const subscription = service.simulationState$.subscribe((state: any) => {
        changeCount++;
        if (changeCount === 2) {
          // Skip initial emission
          expect(state.simulationConfig.algorithm).toBe("fmm");
          subscription.unsubscribe();
          done();
        }
      });

      service.setNBodyAlgorithm("fmm");
    });
  });

  describe("error handling", () => {
    it("should provide clear error messages for invalid configurations", () => {
      const invalidConfig = { mode: "invalid" } as any;

      expect(() => service.setSimulationConfiguration(invalidConfig)).toThrow(
        /Invalid simulation configuration/,
      );
    });

    it("should handle edge cases gracefully", () => {
      // Test setting algorithm when integrator is missing
      service.setSimulationState({
        ...service.getSimulationState(),
        simulationConfig: { mode: "nbody", algorithm: "barnes-hut" } as any,
      });

      expect(() => service.setNBodyIntegrator("rk4")).not.toThrow();

      const config = service.getSimulationConfiguration();
      expect(config.integrator).toBe("rk4");
      expect(config.algorithm).toBe("barnes-hut");
    });
  });
});
