import { describe, it, expect } from "vitest";
import {
  isValidConfiguration,
  getDefaultConfiguration,
  getConfigurationDisplayName,
  getConfigurationShortName,
  type SimulationConfiguration,
} from "./types";

describe("SimulationConfiguration", () => {
  describe("isValidConfiguration", () => {
    it("should validate ideal mode configurations", () => {
      expect(isValidConfiguration({ mode: "ideal" })).toBe(true);
      expect(
        isValidConfiguration({
          mode: "ideal",
          integrator: "verlet",
        }),
      ).toBe(false);
      expect(
        isValidConfiguration({
          mode: "ideal",
          algorithm: "barnes-hut",
        }),
      ).toBe(false);
      expect(
        isValidConfiguration({
          mode: "ideal",
          integrator: "verlet",
          algorithm: "barnes-hut",
        }),
      ).toBe(false);
    });

    it("should validate nbody mode configurations", () => {
      expect(
        isValidConfiguration({
          mode: "nbody",
          integrator: "verlet",
          algorithm: "barnes-hut",
        }),
      ).toBe(true);

      expect(
        isValidConfiguration({
          mode: "nbody",
          integrator: "verlet",
          // missing algorithm
        }),
      ).toBe(false);

      expect(
        isValidConfiguration({
          mode: "nbody",
          algorithm: "barnes-hut",
          // missing integrator
        }),
      ).toBe(false);

      expect(
        isValidConfiguration({
          mode: "nbody",
          // missing both
        }),
      ).toBe(false);
    });

    it("should validate all algorithm types", () => {
      const algorithms = ["direct", "barnes-hut", "fmm", "p3m"];
      algorithms.forEach((algorithm) => {
        expect(
          isValidConfiguration({
            mode: "nbody",
            integrator: "verlet",
            algorithm: algorithm as any,
          }),
        ).toBe(true);
      });
    });

    it("should validate all integrator types", () => {
      const integrators = ["euler", "symplectic", "verlet", "rk4", "adaptive"];
      integrators.forEach((integrator) => {
        expect(
          isValidConfiguration({
            mode: "nbody",
            integrator: integrator as any,
            algorithm: "barnes-hut",
          }),
        ).toBe(true);
      });
    });
  });

  describe("getDefaultConfiguration", () => {
    it("should return a valid default configuration", () => {
      const defaultConfig = getDefaultConfiguration();

      expect(defaultConfig.mode).toBe("nbody");
      expect(defaultConfig.integrator).toBe("pefrl");
      expect(defaultConfig.algorithm).toBe("tree-pm");
      expect(isValidConfiguration(defaultConfig)).toBe(true);
    });
  });

  describe("display names", () => {
    describe("getConfigurationDisplayName", () => {
      it("should generate correct display name for ideal mode", () => {
        expect(getConfigurationDisplayName({ mode: "ideal" })).toBe(
          "Ideal Orrery",
        );
      });

      it("should generate correct display names for nbody configurations", () => {
        expect(
          getConfigurationDisplayName({
            mode: "nbody",
            integrator: "verlet",
            algorithm: "barnes-hut",
          }),
        ).toBe("N-Body (Barnes-Hut + Verlet)");

        expect(
          getConfigurationDisplayName({
            mode: "nbody",
            integrator: "rk4",
            algorithm: "fmm",
          }),
        ).toBe("N-Body (Fmm + Rk4)");

        expect(
          getConfigurationDisplayName({
            mode: "nbody",
            integrator: "euler",
            algorithm: "direct",
          }),
        ).toBe("N-Body (Direct + Euler)");

        expect(
          getConfigurationDisplayName({
            mode: "nbody",
            integrator: "adaptive",
            algorithm: "p3m",
          }),
        ).toBe("N-Body (P3m + Adaptive)");
      });

      it("should handle missing integrator or algorithm gracefully", () => {
        expect(
          getConfigurationDisplayName({
            mode: "nbody",
            algorithm: "barnes-hut",
            // missing integrator
          }),
        ).toBe("N-Body (Barnes-Hut + Unknown)");

        expect(
          getConfigurationDisplayName({
            mode: "nbody",
            integrator: "verlet",
            // missing algorithm
          }),
        ).toBe("N-Body (Unknown + Verlet)");

        expect(
          getConfigurationDisplayName({
            mode: "nbody",
            // missing both
          }),
        ).toBe("N-Body (Unknown + Unknown)");
      });
    });

    describe("getConfigurationShortName", () => {
      it("should generate correct short name for ideal mode", () => {
        expect(getConfigurationShortName({ mode: "ideal" })).toBe("Ideal");
      });

      it("should generate correct short names for nbody configurations", () => {
        expect(
          getConfigurationShortName({
            mode: "nbody",
            integrator: "verlet",
            algorithm: "barnes-hut",
          }),
        ).toBe("BH-Ver");

        expect(
          getConfigurationShortName({
            mode: "nbody",
            integrator: "rk4",
            algorithm: "fmm",
          }),
        ).toBe("FMM-Rk4");

        expect(
          getConfigurationShortName({
            mode: "nbody",
            integrator: "euler",
            algorithm: "direct",
          }),
        ).toBe("Dir-Eul");

        expect(
          getConfigurationShortName({
            mode: "nbody",
            integrator: "adaptive",
            algorithm: "p3m",
          }),
        ).toBe("P3M-Ada");

        expect(
          getConfigurationShortName({
            mode: "nbody",
            integrator: "symplectic",
            algorithm: "barnes-hut",
          }),
        ).toBe("BH-Sym");
      });

      it("should handle missing integrator gracefully", () => {
        expect(
          getConfigurationShortName({
            mode: "nbody",
            algorithm: "fmm",
            // missing integrator
          }),
        ).toBe("FMM-Unk");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty configuration object", () => {
      expect(isValidConfiguration({} as SimulationConfiguration)).toBe(false);
    });

    it("should handle configuration with invalid mode", () => {
      expect(
        isValidConfiguration({
          mode: "invalid" as any,
        }),
      ).toBe(false);
    });

    it("should handle configuration with valid mode but invalid sub-properties", () => {
      expect(
        isValidConfiguration({
          mode: "nbody",
          integrator: "invalid" as any,
          algorithm: "barnes-hut",
        }),
      ).toBe(true); // Note: We only validate presence, not validity of enum values

      expect(
        isValidConfiguration({
          mode: "nbody",
          integrator: "verlet",
          algorithm: "invalid" as any,
        }),
      ).toBe(true); // Note: We only validate presence, not validity of enum values
    });
  });
});
