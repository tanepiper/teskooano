import { describe, it, expect, beforeEach } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import { orbitalValidationDebugger } from "./orbitalValidation";

/**
 * Test suite for orbital conservation laws.
 * Validates our physics engine against the mathematical proof of eccentricity vector conservation.
 */
describe("Orbital Conservation Laws", () => {
  beforeEach(() => {
    orbitalValidationDebugger.clearTestResults();
  });

  describe("Energy-Eccentricity Relation", () => {
    it("should satisfy e² = 2HL² + 1 for circular orbits", () => {
      // Earth-like circular orbit around Sun
      const position = new OSVector3(149.6e9, 0, 0); // 1 AU from Sun
      const velocity = new OSVector3(0, 29.78e3, 0); // Circular orbital velocity
      const parentMass = 1.989e30; // Solar mass

      const result = orbitalValidationDebugger.testEnergyEccentricityRelation(
        position,
        velocity,
        parentMass,
        2e-10, // Slightly more lenient tolerance for exact circular orbit
      );

      console.log("Circular orbit test results:", {
        energy: result.energy,
        angularMomentumSquared: result.angularMomentumSquared,
        expectedEccentricitySquared: result.expectedEccentricitySquared,
        actualEccentricitySquared: result.actualEccentricitySquared,
        relativeError: result.relativeError,
        isValid: result.isValid,
      });

      expect(result.isValid).toBe(true);
      expect(result.relativeError).toBeLessThan(2e-10); // Slightly more lenient tolerance
      expect(result.energy).toBeLessThan(0); // Bound orbit
    });

    it("should satisfy e² = 2HL² + 1 for elliptical orbits", () => {
      // Mercury-like elliptical orbit
      const position = new OSVector3(46e9, 0, 0); // Perihelion
      const velocity = new OSVector3(0, 59e3, 0); // High velocity at perihelion
      const parentMass = 1.989e30; // Solar mass

      const result = orbitalValidationDebugger.testEnergyEccentricityRelation(
        position,
        velocity,
        parentMass,
      );

      expect(result.isValid).toBe(true);
      expect(result.energy).toBeLessThan(0); // Bound orbit
    });

    it("should satisfy e² = 2HL² + 1 for hyperbolic orbits", () => {
      // Hyperbolic escape trajectory
      const position = new OSVector3(149.6e9, 0, 0); // 1 AU from Sun
      const velocity = new OSVector3(0, 50e3, 0); // Escape velocity
      const parentMass = 1.989e30; // Solar mass

      const result = orbitalValidationDebugger.testEnergyEccentricityRelation(
        position,
        velocity,
        parentMass,
      );

      expect(result.isValid).toBe(true);
      expect(result.energy).toBeGreaterThan(0); // Unbound orbit
    });
  });

  describe("Eccentricity-Angular Momentum Orthogonality", () => {
    it("should have e · L = 0 for circular orbits", () => {
      const position = new OSVector3(149.6e9, 0, 0);
      const velocity = new OSVector3(0, 29.78e3, 0);
      const parentMass = 1.989e30;

      const result =
        orbitalValidationDebugger.testEccentricityAngularMomentumOrthogonality(
          position,
          velocity,
          parentMass,
          1e-12, // Very strict tolerance
        );

      expect(result.isValid).toBe(true);
      expect(Math.abs(result.dotProduct)).toBeLessThan(1e-12);
    });

    it("should have e · L = 0 for elliptical orbits", () => {
      const position = new OSVector3(46e9, 0, 0);
      const velocity = new OSVector3(0, 59e3, 0);
      const parentMass = 1.989e30;

      const result =
        orbitalValidationDebugger.testEccentricityAngularMomentumOrthogonality(
          position,
          velocity,
          parentMass,
        );

      expect(result.isValid).toBe(true);
      expect(Math.abs(result.dotProduct)).toBeLessThan(1e-12);
    });

    it("should have e · L = 0 for hyperbolic orbits", () => {
      const position = new OSVector3(149.6e9, 0, 0);
      const velocity = new OSVector3(0, 50e3, 0);
      const parentMass = 1.989e30;

      const result =
        orbitalValidationDebugger.testEccentricityAngularMomentumOrthogonality(
          position,
          velocity,
          parentMass,
        );

      expect(result.isValid).toBe(true);
      expect(Math.abs(result.dotProduct)).toBeLessThan(1e-12);
    });
  });

  describe("Comprehensive Conservation Laws", () => {
    it("should pass all conservation law tests for various orbit types", () => {
      const testCases = [
        {
          name: "Circular Earth",
          position: new OSVector3(149.6e9, 0, 0),
          velocity: new OSVector3(0, 29.78e3, 0),
          parentMass: 1.989e30,
        },
        {
          name: "Elliptical Mercury",
          position: new OSVector3(46e9, 0, 0),
          velocity: new OSVector3(0, 59e3, 0),
          parentMass: 1.989e30,
        },
        {
          name: "Hyperbolic Escape",
          position: new OSVector3(149.6e9, 0, 0),
          velocity: new OSVector3(0, 50e3, 0),
          parentMass: 1.989e30,
        },
        {
          name: "Moon around Earth",
          position: new OSVector3(384.4e6, 0, 0),
          velocity: new OSVector3(0, 1.022e3, 0),
          parentMass: 5.972e24,
        },
      ];

      testCases.forEach(({ name, position, velocity, parentMass }) => {
        const result = orbitalValidationDebugger.testAllConservationLaws(
          position,
          velocity,
          parentMass,
        );

        expect(result.isAllValid).toBe(true);
        expect(result.energyEccentricityRelation.isValid).toBe(true);
        expect(result.orthogonality.isValid).toBe(true);
      });
    });
  });

  describe("Conservation Over Time", () => {
    it("should maintain conservation laws over orbital period", () => {
      // Earth-like orbit
      const initialPosition = new OSVector3(149.6e9, 0, 0);
      const initialVelocity = new OSVector3(0, 29.78e3, 0);
      const parentMass = 1.989e30;

      // Simulate position after half an orbit (opposite side)
      const finalPosition = new OSVector3(-149.6e9, 0, 0);
      const finalVelocity = new OSVector3(0, -29.78e3, 0);

      const result = orbitalValidationDebugger.testConservationOverTime(
        { position: initialPosition, velocity: initialVelocity },
        { position: finalPosition, velocity: finalVelocity },
        parentMass,
      );

      // In a perfect simulation, all should be conserved
      // In practice, numerical errors may accumulate
      expect(result.energyConserved).toBe(true);
      expect(result.angularMomentumConserved).toBe(true);
      expect(result.eccentricityVectorConserved).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle near-radial trajectories", () => {
      // Nearly radial trajectory (very small angular momentum)
      const position = new OSVector3(149.6e9, 0, 0);
      const velocity = new OSVector3(0, 1e3, 0); // Very small tangential velocity
      const parentMass = 1.989e30;

      const result = orbitalValidationDebugger.testAllConservationLaws(
        position,
        velocity,
        parentMass,
      );

      // Should still satisfy conservation laws even with small angular momentum
      expect(result.isAllValid).toBe(true);
    });

    it("should handle very eccentric orbits", () => {
      // Highly elliptical orbit (e ≈ 0.9)
      const position = new OSVector3(5e9, 0, 0); // Very close to Sun (0.033 AU)
      const velocity = new OSVector3(0, 200e3, 0); // Very high velocity at perihelion
      const parentMass = 1.989e30;

      const result = orbitalValidationDebugger.testAllConservationLaws(
        position,
        velocity,
        parentMass,
      );

      expect(result.isAllValid).toBe(true);
      expect(result.eccentricityMagnitude).toBeGreaterThan(0.5); // Should be highly eccentric
    });
  });

  describe("Mathematical Proof Validation", () => {
    it("should validate the mathematical proof directly", () => {
      // Test with the exact scenario from the mathematical proof
      // Using simplified units where G = 1, parent mass = 1
      const position = new OSVector3(1, 0, 0);
      const velocity = new OSVector3(0, 1, 0);
      const parentMass = 1; // Simplified mass

      const result = orbitalValidationDebugger.testAllConservationLaws(
        position,
        velocity,
        parentMass,
      );

      // This should exactly match the mathematical proof
      expect(result.isAllValid).toBe(true);
      expect(result.energyEccentricityRelation.relativeError).toBeLessThan(
        1e-15,
      );
      expect(Math.abs(result.orthogonality.dotProduct)).toBeLessThan(1e-15);
    });
  });
});
