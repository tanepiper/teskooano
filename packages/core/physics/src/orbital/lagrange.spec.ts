import { describe, it, expect } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import type { PhysicsStateReal } from "@teskooano/data-types";
import {
  solveL1QuinticEquation,
  solveL2QuinticEquation,
  calculateL3Position,
  calculateHillSphereRadius,
  analyzeLagrangeStability,
  createTwoBodySystem,
  calculateAllLagrangePoints,
  findAllLagrangePointsInSystem,
  calculateEffectivePotential,
} from "./lagrange";

// Physical constants for testing
const SUN_MASS_KG = 1.989e30; // kg
const EARTH_MASS_KG = 5.972e24; // kg
const SUN_EARTH_DISTANCE_M = 1.496e11; // 1 AU in meters
const EARTH_MASS_RATIO = EARTH_MASS_KG / (SUN_MASS_KG + EARTH_MASS_KG); // ≈ 3.0e-6

describe("Lagrange Point Calculations", () => {
  describe("Quintic Equation Solvers", () => {
    it("should solve L1 quintic equation for Sun-Earth system", () => {
      const x1 = solveL1QuinticEquation(EARTH_MASS_RATIO);

      // L1 should be approximately 1.5 million km from Earth (about 0.01 AU)
      const expectedDistance_m = x1 * SUN_EARTH_DISTANCE_M;

      expect(x1).toBeGreaterThan(0);
      expect(x1).toBeLessThan(1);
      expect(expectedDistance_m).toBeCloseTo(1.5e9, -8); // ≈ 1.5 million km, within 1 order of magnitude
    });

    it("should solve L2 quintic equation for Sun-Earth system", () => {
      const x2 = solveL2QuinticEquation(EARTH_MASS_RATIO);

      // L2 should be approximately 1.5 million km from Earth on the far side
      const expectedDistance_m = x2 * SUN_EARTH_DISTANCE_M;

      expect(x2).toBeGreaterThan(0);
      expect(x2).toBeLessThan(2);
      expect(expectedDistance_m).toBeCloseTo(1.5e9, -8); // ≈ 1.5 million km
    });

    it("should handle very small mass ratios", () => {
      const verySmallMassRatio = 1e-9;

      const x1 = solveL1QuinticEquation(verySmallMassRatio);
      const x2 = solveL2QuinticEquation(verySmallMassRatio);

      expect(x1).toBeGreaterThan(0);
      expect(x2).toBeGreaterThan(0);
      expect(x1).toBeLessThan(1);
      expect(x2).toBeLessThan(2);
    });

    it("should throw error if quintic equation fails to converge", () => {
      expect(() => {
        solveL1QuinticEquation(EARTH_MASS_RATIO, {
          maxIterations: 1,
          tolerance: 1e-15,
        });
      }).toThrow();
    });
  });

  describe("L3 Position Calculation", () => {
    it("should calculate L3 position for Sun-Earth system", () => {
      const x3 = calculateL3Position(EARTH_MASS_RATIO);

      // L3 should be a very small distance for Earth-Sun system
      expect(x3).toBeGreaterThan(0);
      expect(x3).toBeLessThan(0.1);

      // For Earth-Sun, should be approximately (7/12) * 3e-6 ≈ 1.75e-6
      expect(x3).toBeCloseTo((7 / 12) * EARTH_MASS_RATIO, 6);
    });
  });

  describe("Hill Sphere Calculation", () => {
    it("should calculate correct Hill sphere radius", () => {
      const hillRadius = calculateHillSphereRadius(
        SUN_EARTH_DISTANCE_M,
        SUN_MASS_KG,
        EARTH_MASS_KG,
      );

      // Earth's Hill sphere is approximately 1.5 million km
      expect(hillRadius).toBeCloseTo(1.5e9, -8);
    });

    it("should scale with separation distance", () => {
      const baseRadius = calculateHillSphereRadius(
        1e11,
        SUN_MASS_KG,
        EARTH_MASS_KG,
      );
      const doubleRadius = calculateHillSphereRadius(
        2e11,
        SUN_MASS_KG,
        EARTH_MASS_KG,
      );

      expect(doubleRadius).toBeCloseTo(baseRadius * 2, 6);
    });
  });

  describe("Stability Analysis", () => {
    it("should classify L1, L2, L3 as unstable", () => {
      expect(analyzeLagrangeStability("L1", EARTH_MASS_RATIO)).toBe("unstable");
      expect(analyzeLagrangeStability("L2", EARTH_MASS_RATIO)).toBe("unstable");
      expect(analyzeLagrangeStability("L3", EARTH_MASS_RATIO)).toBe("unstable");
    });

    it("should classify L4, L5 as stable for Sun-Earth system", () => {
      // Sun/Earth mass ratio is >> 25, so L4/L5 should be stable
      expect(analyzeLagrangeStability("L4", EARTH_MASS_RATIO)).toBe("stable");
      expect(analyzeLagrangeStability("L5", EARTH_MASS_RATIO)).toBe("stable");
    });

    it("should classify L4, L5 as unstable for equal masses", () => {
      const equalMassRatio = 0.5; // Equal masses
      expect(analyzeLagrangeStability("L4", equalMassRatio)).toBe("unstable");
      expect(analyzeLagrangeStability("L5", equalMassRatio)).toBe("unstable");
    });

    it("should handle marginal stability case", () => {
      // Mass ratio that gives m1/m2 ≈ 24.5 (marginally stable)
      const marginalMassRatio = 1 / (24.5 + 1); // ≈ 0.0392
      expect(analyzeLagrangeStability("L4", marginalMassRatio)).toBe(
        "marginally_stable",
      );
    });
  });

  describe("Two-Body System Creation", () => {
    it("should create two-body system with correct primary/secondary assignment", () => {
      const sun: PhysicsStateReal = {
        id: "sun",
        mass_kg: SUN_MASS_KG,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      const earth: PhysicsStateReal = {
        id: "earth",
        mass_kg: EARTH_MASS_KG,
        position_m: new OSVector3(SUN_EARTH_DISTANCE_M, 0, 0),
        velocity_mps: new OSVector3(0, 0, 29780),
      };

      const system = createTwoBodySystem(sun, earth);

      expect(system.primary.id).toBe("sun");
      expect(system.secondary.id).toBe("earth");
      expect(system.separation_m).toBeCloseTo(SUN_EARTH_DISTANCE_M, 6);
      expect(system.massRatio).toBeCloseTo(EARTH_MASS_RATIO, 10);
    });

    it("should handle reversed input order", () => {
      const lightBody: PhysicsStateReal = {
        id: "small",
        mass_kg: 1e20,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      const heavyBody: PhysicsStateReal = {
        id: "large",
        mass_kg: 1e30,
        position_m: new OSVector3(1e11, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      // Pass light body first, heavy body second
      const system = createTwoBodySystem(lightBody, heavyBody);

      // Should still assign heavy body as primary
      expect(system.primary.id).toBe("large");
      expect(system.secondary.id).toBe("small");
    });
  });

  describe("Complete Lagrange Point Calculation", () => {
    it("should calculate all 5 Lagrange points for Sun-Earth system", () => {
      const sun: PhysicsStateReal = {
        id: "sun",
        mass_kg: SUN_MASS_KG,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      const earth: PhysicsStateReal = {
        id: "earth",
        mass_kg: EARTH_MASS_KG,
        position_m: new OSVector3(SUN_EARTH_DISTANCE_M, 0, 0),
        velocity_mps: new OSVector3(0, 0, 29780),
      };

      const system = createTwoBodySystem(sun, earth);
      const lagrangePoints = calculateAllLagrangePoints(system);

      // Should find all 5 Lagrange points
      expect(lagrangePoints).toHaveLength(5);

      const pointIds = lagrangePoints.map((p) => p.id);
      expect(pointIds).toContain("L1");
      expect(pointIds).toContain("L2");
      expect(pointIds).toContain("L3");
      expect(pointIds).toContain("L4");
      expect(pointIds).toContain("L5");

      // Check that L1 and L2 are approximately at Hill sphere distance
      const l1Point = lagrangePoints.find((p) => p.id === "L1");
      const l2Point = lagrangePoints.find((p) => p.id === "L2");

      expect(l1Point).toBeDefined();
      expect(l2Point).toBeDefined();

      if (l1Point && l2Point) {
        expect(l1Point.distanceFromSecondary_m).toBeCloseTo(1.5e9, -8);
        expect(l2Point.distanceFromSecondary_m).toBeCloseTo(1.5e9, -8);

        // L1 and L2 should have proper stability classification
        expect(l1Point.stability).toBe("unstable");
        expect(l2Point.stability).toBe("unstable");

        // L4 and L5 should be stable for Sun-Earth
        const l4Point = lagrangePoints.find((p) => p.id === "L4");
        const l5Point = lagrangePoints.find((p) => p.id === "L5");
        expect(l4Point?.stability).toBe("stable");
        expect(l5Point?.stability).toBe("stable");
      }
    });

    it("should handle calculation options", () => {
      const sun: PhysicsStateReal = {
        id: "sun",
        mass_kg: SUN_MASS_KG,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      const earth: PhysicsStateReal = {
        id: "earth",
        mass_kg: EARTH_MASS_KG,
        position_m: new OSVector3(SUN_EARTH_DISTANCE_M, 0, 0),
        velocity_mps: new OSVector3(0, 0, 29780),
      };

      const system = createTwoBodySystem(sun, earth);

      // Test with different options
      const lagrangePoints = calculateAllLagrangePoints(system, {
        tolerance: 1e-10,
        maxIterations: 500,
        calculatePotential: false,
      });

      expect(lagrangePoints.length).toBeGreaterThan(0);

      // Since calculatePotential is false, effective potential should be 0
      lagrangePoints.forEach((point) => {
        expect(point.effectivePotential_Jkg).toBe(0);
      });
    });
  });

  describe("System-wide Lagrange Point Discovery", () => {
    it("should find Lagrange points for multiple body pairs", () => {
      const sun: PhysicsStateReal = {
        id: "sun",
        mass_kg: SUN_MASS_KG,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      const earth: PhysicsStateReal = {
        id: "earth",
        mass_kg: EARTH_MASS_KG,
        position_m: new OSVector3(SUN_EARTH_DISTANCE_M, 0, 0),
        velocity_mps: new OSVector3(0, 0, 29780),
      };

      const moon: PhysicsStateReal = {
        id: "moon",
        mass_kg: 7.342e22, // kg
        position_m: new OSVector3(SUN_EARTH_DISTANCE_M + 3.844e8, 0, 0), // Earth + Moon distance
        velocity_mps: new OSVector3(0, 0, 29780 + 1022), // Earth velocity + Moon orbital velocity
      };

      const bodies = [sun, earth, moon];
      const allLagrangePoints = findAllLagrangePointsInSystem(bodies);

      // Should find Lagrange points for 3 pairs: Sun-Earth, Sun-Moon, Earth-Moon
      expect(allLagrangePoints.size).toBe(3);

      // Check that we have the expected pairs
      const pairKeys = Array.from(allLagrangePoints.keys());
      expect(pairKeys).toContain("sun-earth");
      expect(pairKeys).toContain("sun-moon");
      expect(pairKeys).toContain("earth-moon");

      // Each pair should have 5 Lagrange points
      allLagrangePoints.forEach((points, pairKey) => {
        expect(points).toHaveLength(5);
      });
    });

    it("should skip bodies with zero mass", () => {
      const massiveBody: PhysicsStateReal = {
        id: "massive",
        mass_kg: 1e30,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      const masslessBody: PhysicsStateReal = {
        id: "massless",
        mass_kg: 0,
        position_m: new OSVector3(1e11, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      const bodies = [massiveBody, masslessBody];
      const allLagrangePoints = findAllLagrangePointsInSystem(bodies);

      // Should not find any Lagrange points since one body is massless
      expect(allLagrangePoints.size).toBe(0);
    });
  });

  describe("Effective Potential Calculation", () => {
    it("should calculate reasonable effective potential", () => {
      const sun: PhysicsStateReal = {
        id: "sun",
        mass_kg: SUN_MASS_KG,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      };

      const earth: PhysicsStateReal = {
        id: "earth",
        mass_kg: EARTH_MASS_KG,
        position_m: new OSVector3(SUN_EARTH_DISTANCE_M, 0, 0),
        velocity_mps: new OSVector3(0, 0, 29780),
      };

      const system = createTwoBodySystem(sun, earth);

      // Test potential at L1 point
      const l1Position = new OSVector3(SUN_EARTH_DISTANCE_M - 1.5e9, 0, 0); // Approximate L1
      const potential = calculateEffectivePotential(l1Position, system);

      // Potential should be negative (bound state)
      expect(potential).toBeLessThan(0);
      expect(isFinite(potential)).toBe(true);
    });
  });
});
