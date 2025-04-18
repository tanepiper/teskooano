import { describe, it, expect } from "vitest";
import { OSVector3 } from "../math/OSVector3";
import { calculateOrbitalPosition, calculateOrbitalVelocity } from "./orbital";
import { PhysicsStateReal } from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-types";

// Helper to create REAL state
const createRealState = (
  id: string,
  pos: { x: number; y: number; z: number },
  vel: { x: number; y: number; z: number },
  mass: number,
): PhysicsStateReal => ({
  id,
  mass_kg: mass,
  position_m: new OSVector3(pos.x, pos.y, pos.z),
  velocity_mps: new OSVector3(vel.x, vel.y, vel.z),
});

describe("Orbital Mechanics", () => {
  const sunMass = 1.989e30; // kg
  const earthSemiMajorAxis = 1.496e11; // meters (1 AU)
  const earthOrbitalPeriod = 31557600; // seconds (approx 1 year)

  const mockSunState: PhysicsStateReal = createRealState(
    "sun",
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    sunMass,
  );

  describe("calculateOrbitalVelocity", () => {
    it("should calculate correct circular orbital velocity", () => {
      const velocity = calculateOrbitalVelocity(
        mockSunState,
        earthSemiMajorAxis,
      );
      const expectedSpeed = Math.sqrt(
        (GRAVITATIONAL_CONSTANT * sunMass) / earthSemiMajorAxis,
      );

      // The function calculates the speed magnitude
      expect(velocity).toBeCloseTo(expectedSpeed);
    });

    it("should return 0 for zero parent mass", () => {
      const masslessSun = { ...mockSunState, mass_kg: 0 };
      const velocity = calculateOrbitalVelocity(
        masslessSun,
        earthSemiMajorAxis,
      );
      expect(velocity).toBe(0);
    });

    it("should return 0 for zero distance", () => {
      const velocity = calculateOrbitalVelocity(mockSunState, 0);
      expect(velocity).toBe(0);
    });
  });

  describe("calculateOrbitalPosition", () => {
    it("should calculate correct position for a circular orbit at t=0", () => {
      const orbitalParams = {
        semiMajorAxis_m: earthSemiMajorAxis,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        trueAnomaly: 0, // Start at periapsis (which is anywhere on circle for e=0)
      };
      const position = calculateOrbitalPosition(mockSunState, orbitalParams, 0);

      // At t=0 and trueAnomaly=0, position should be along the positive x-axis (by convention)
      expect(position.x).toBeCloseTo(earthSemiMajorAxis);
      expect(position.y).toBeCloseTo(0);
      expect(position.z).toBeCloseTo(0);
    });

    it("should calculate correct position for a circular orbit at t=T/4", () => {
      const orbitalParams = {
        semiMajorAxis_m: earthSemiMajorAxis,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        trueAnomaly: 0, // Start at periapsis
      };
      const time = earthOrbitalPeriod / 4;
      const position = calculateOrbitalPosition(
        mockSunState,
        orbitalParams,
        time,
      );

      // After T/4, should be along the positive y-axis
      expect(position.x).toBeCloseTo(0);
      expect(position.y).toBeCloseTo(earthSemiMajorAxis);
      expect(position.z).toBeCloseTo(0);
    });

    it("should calculate correct position for an elliptical orbit at periapsis (t=0)", () => {
      const eccentricity = 0.5;
      const orbitalParams = {
        semiMajorAxis_m: earthSemiMajorAxis,
        eccentricity: eccentricity,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        trueAnomaly: 0, // Start at periapsis
      };
      const position = calculateOrbitalPosition(mockSunState, orbitalParams, 0);
      const expectedPeriapsisDist = earthSemiMajorAxis * (1 - eccentricity);

      // At t=0 and trueAnomaly=0 (periapsis), position should be along positive x-axis
      expect(position.x).toBeCloseTo(expectedPeriapsisDist);
      expect(position.y).toBeCloseTo(0);
      expect(position.z).toBeCloseTo(0);
    });

    it("should calculate correct position for an elliptical orbit at apoapsis (t=T/2)", () => {
      const eccentricity = 0.5;
      const orbitalParams = {
        semiMajorAxis_m: earthSemiMajorAxis,
        eccentricity: eccentricity,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        trueAnomaly: 0, // Start at periapsis
      };
      // Time to apoapsis is T/2 for elliptical orbits
      const time = earthOrbitalPeriod / 2;
      const position = calculateOrbitalPosition(
        mockSunState,
        orbitalParams,
        time,
      );
      const expectedApoapsisDist = earthSemiMajorAxis * (1 + eccentricity);

      // At t=T/2, should be at apoapsis along negative x-axis
      expect(position.x).toBeCloseTo(-expectedApoapsisDist);
      expect(position.y).toBeCloseTo(0);
      expect(position.z).toBeCloseTo(0);
    });

    // Add tests for inclination, LAN, arg of periapsis later when implemented
  });
});
