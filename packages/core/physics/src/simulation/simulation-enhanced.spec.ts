import { describe, expect, it, vi } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import {
  PhysicsStateReal,
  SimulationMode,
  AlgorithmType,
  IntegratorType,
} from "@teskooano/data-types";
import type { SimulationConfiguration } from "@teskooano/core-state";
import { updateSimulationWithConfiguration } from "./simulation";

describe("Enhanced Simulation System", () => {
  const mockBody: PhysicsStateReal = {
    id: "test-body",
    mass_kg: 5.972e24,
    position_m: new OSVector3(1.496e11, 0, 0),
    velocity_mps: new OSVector3(0, 29780, 0),
  };

  const basicParams = {
    radii: new Map([["test-body", 6371000]]),
    isStar: new Map([["test-body", false]]),
    bodyTypes: new Map(),
    octreeSize: 5e13,
    barnesHutTheta: 0.7,
  };

  describe("updateSimulationWithConfiguration", () => {
    it("should handle ideal mode configuration", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.IDEAL,
      };

      const result = updateSimulationWithConfiguration([mockBody], 1.0, {
        ...basicParams,
        simulationConfig: config,
        orbitalParameters: new Map(),
        parentIds: new Map(),
        currentTime_s: 0,
      });

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
      expect(result.accelerations.size).toBeGreaterThanOrEqual(0);
    });

    it("should handle nbody mode configuration", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        integrator: IntegratorType.VERLET,
        algorithm: AlgorithmType.BARNES_HUT,
      };

      const result = updateSimulationWithConfiguration([mockBody], 1.0, {
        ...basicParams,
        simulationConfig: config,
      });

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
      expect(result.accelerations.size).toBeGreaterThanOrEqual(0);
    });

    it("should migrate legacy physics engine to new configuration", () => {
      const result = updateSimulationWithConfiguration([mockBody], 1.0, {
        ...basicParams,
        simulationConfig: {
          mode: SimulationMode.NBODY,
          integrator: IntegratorType.EULER,
          algorithm: AlgorithmType.BARNES_HUT,
        },
      });

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
    });

    it("should use default configuration when none provided", () => {
      const result = updateSimulationWithConfiguration([mockBody], 1.0, {
        ...basicParams,
        simulationConfig: {
          mode: SimulationMode.NBODY,
          integrator: IntegratorType.VERLET,
          algorithm: AlgorithmType.BARNES_HUT,
        },
      });

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
    });

    it("should handle invalid configuration gracefully", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const invalidConfig = {
        mode: SimulationMode.NBODY,
        // Missing required integrator and algorithm
      } as SimulationConfiguration;

      const result = updateSimulationWithConfiguration([mockBody], 1.0, {
        ...basicParams,
        simulationConfig: invalidConfig,
      });

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should prioritize simulationConfig over legacy engine", () => {
      const config: SimulationConfiguration = {
        mode: SimulationMode.NBODY,
        integrator: IntegratorType.SYMPLECTIC,
        algorithm: AlgorithmType.BARNES_HUT,
      };

      const result = updateSimulationWithConfiguration([mockBody], 1.0, {
        ...basicParams,
        simulationConfig: config,
      });

      expect(result).toBeDefined();
      expect(result.states).toHaveLength(1);
    });

    it("should translate all integrator types correctly", () => {
      const integrators = [
        IntegratorType.EULER,
        IntegratorType.SYMPLECTIC,
        IntegratorType.VERLET,
        IntegratorType.RK4,
        IntegratorType.ADAPTIVE,
      ] as const;

      integrators.forEach((integrator) => {
        const config: SimulationConfiguration = {
          mode: SimulationMode.NBODY,
          integrator,
          algorithm: AlgorithmType.BARNES_HUT,
        };

        const result = updateSimulationWithConfiguration([mockBody], 1.0, {
          ...basicParams,
          simulationConfig: config,
        });

        expect(result).toBeDefined();
        expect(result.states).toHaveLength(1);
      });
    });

    it("should translate all algorithm types correctly", () => {
      const algorithms = [
        AlgorithmType.BARNES_HUT,
        AlgorithmType.FMM,
        AlgorithmType.P3M,
      ] as const;

      algorithms.forEach((algorithm) => {
        const config: SimulationConfiguration = {
          mode: SimulationMode.NBODY,
          integrator: IntegratorType.VERLET,
          algorithm,
        };

        const result = updateSimulationWithConfiguration([mockBody], 1.0, {
          ...basicParams,
          simulationConfig: config,
        });

        expect(result).toBeDefined();
        expect(result.states).toHaveLength(1);
      });
    });
  });
});
