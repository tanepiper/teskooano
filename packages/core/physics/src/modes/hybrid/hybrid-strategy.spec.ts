import { describe, it, expect, beforeEach } from "vitest";
import { HybridStrategy } from "./hybrid-strategy";
import type { PhysicsStateReal, OrbitalParameters } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

describe("HybridStrategy", () => {
  let strategy: HybridStrategy;
  let mockBodies: PhysicsStateReal[];
  let mockOrbitalParams: Map<string, OrbitalParameters>;
  let mockParentIds: Map<string, string>;

  beforeEach(() => {
    strategy = new HybridStrategy();
    
    // Create mock bodies
    mockBodies = [
      {
        id: "sun",
        mass_kg: 1.989e30,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "earth",
        mass_kg: 5.972e24,
        position_m: new OSVector3(1.496e11, 0, 0),
        velocity_mps: new OSVector3(0, 29780, 0),
      },
      {
        id: "moon",
        mass_kg: 7.342e22,
        position_m: new OSVector3(1.496e11 + 3.844e8, 0, 0),
        velocity_mps: new OSVector3(0, 29780 + 1022, 0),
      },
    ];

    // Create mock orbital parameters
    mockOrbitalParams = new Map([
      ["earth", {
        realSemiMajorAxis_m: 1.496e11,
        eccentricity: 0.0167,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomalyAtEpoch: 0,
        epoch: 0,
      }],
      ["moon", {
        realSemiMajorAxis_m: 3.844e8,
        eccentricity: 0.0549,
        inclination: 0.0898,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomalyAtEpoch: 0,
        epoch: 0,
      }],
    ]);

    // Create mock parent hierarchy
    mockParentIds = new Map([
      ["earth", "sun"],
      ["moon", "earth"],
    ]);
  });

  describe("canHandle", () => {
    it("should handle hybrid mode", () => {
      const config = { mode: "hybrid" };
      expect(strategy.canHandle(config)).toBe(true);
    });

    it("should not handle other modes", () => {
      const config = { mode: "ideal" };
      expect(strategy.canHandle(config)).toBe(false);
    });
  });

  describe("getRecommendedParameters", () => {
    it("should return hybrid-specific parameters", () => {
      const params = strategy.getRecommendedParameters();
      
      expect(params.correctionConfig).toBeDefined();
      expect(params.correctionConfig?.frequency).toBe("adaptive");
      expect(params.correctionConfig?.threshold).toBe(0.01);
      expect(params.correctionConfig?.preserveMomentum).toBe(true);
      expect(params.correctionConfig?.hierarchicalCorrections).toBe(true);
    });
  });

  describe("simulate", () => {
    it("should require orbital parameters for hybrid mode", () => {
      const params = {
        bodies: mockBodies,
        deltaTime: 86400, // 1 day
        configuration: { mode: "hybrid" },
        orbitalParameters: undefined,
        parentIds: undefined,
        currentTime_s: undefined,
        correctionConfig: {
          frequency: "adaptive",
          threshold: 0.01,
          preserveMomentum: true,
          hierarchicalCorrections: true,
          maxCorrectionMagnitude: 0.1,
          adaptive: {
            baseFrequency: 1.0,
            timeScaleFactor: 0.5,
            bodyCountFactor: 0.3,
            errorFactor: 1.0,
          },
        },
      };

      const result = strategy.simulate(params);
      
      expect(result.metadata.algorithmUsed).toBe("hybrid-error");
      expect(result.states).toEqual(mockBodies);
    });

    it("should process bodies with orbital parameters", () => {
      const params = {
        bodies: mockBodies,
        deltaTime: 86400, // 1 day
        configuration: { mode: "hybrid" },
        orbitalParameters: mockOrbitalParams,
        parentIds: mockParentIds,
        currentTime_s: Date.now() / 1000,
        correctionConfig: {
          frequency: "adaptive",
          threshold: 0.01,
          preserveMomentum: true,
          hierarchicalCorrections: true,
          maxCorrectionMagnitude: 0.1,
          adaptive: {
            baseFrequency: 1.0,
            timeScaleFactor: 0.5,
            bodyCountFactor: 0.3,
            errorFactor: 1.0,
          },
        },
      };

      const result = strategy.simulate(params);
      
      expect(result.metadata.algorithmUsed).toBe("hybrid");
      expect(result.metadata.integratorUsed).toBe("nbody+kepler");
      expect(result.metadata.mode).toBe("hybrid");
      expect(result.states).toHaveLength(3);
      expect(result.metadata.totalBodies).toBe(3);
    });
  });
});