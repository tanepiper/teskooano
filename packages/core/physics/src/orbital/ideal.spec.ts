import { describe, it, expect } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import {
  calculateKeplerianStateAtTime,
  calculateKeplerianPositionAtTrueAnomaly,
} from "./ideal";
import { solveKeplerEquation } from "./shared";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";

describe("Kepler Equation Solver", () => {
  it("should solve Kepler's equation for circular orbit (e=0)", () => {
    // For circular orbits, eccentric anomaly equals mean anomaly
    const meanAnomaly = Math.PI / 4;
    const eccentricity = 0;

    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, eccentricity);

    expect(eccentricAnomaly).toBeCloseTo(meanAnomaly);
  });

  it("should solve Kepler's equation for elliptical orbit (e=0.5)", () => {
    const meanAnomaly = Math.PI / 2;
    const eccentricity = 0.5;

    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, eccentricity);

    // Verify that E - e*sin(E) = M
    const check = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly);
    expect(check).toBeCloseTo(meanAnomaly);
  });

  it("should converge for high eccentricity (e=0.9)", () => {
    const meanAnomaly = Math.PI / 4;
    const eccentricity = 0.9;

    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, eccentricity);

    // Verify that E - e*sin(E) = M
    const check = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly);
    expect(check).toBeCloseTo(meanAnomaly);
  });
});

describe("Keplerian State Calculation", () => {
  const earthSemiMajorAxis = 1.496e11; // meters
  const earthOrbitalPeriod = 31557600; // seconds (365.25 days)
  const earthEccentricity = 0.0167;

  it("should calculate correct position for circular orbit at t=0", () => {
    const orbitalParameters = {
      period_s: earthOrbitalPeriod,
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: 0,
      inclination: 0,
      meanAnomaly: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      realAphelion_m: earthSemiMajorAxis,
      realPerihelion_m: earthSemiMajorAxis,
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const { position } = calculateKeplerianStateAtTime(orbitalParameters, 0);

    expect(position.x).toBeCloseTo(earthSemiMajorAxis);
    expect(position.y).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(0);
  });

  it("should calculate correct position for circular orbit at t=T/4", () => {
    const orbitalParameters = {
      period_s: earthOrbitalPeriod,
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: 0,
      inclination: 0,
      meanAnomaly: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      realAphelion_m: earthSemiMajorAxis,
      realPerihelion_m: earthSemiMajorAxis,
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const quarterPeriod = earthOrbitalPeriod / 4;
    const { position } = calculateKeplerianStateAtTime(
      orbitalParameters,
      quarterPeriod,
    );

    // In our Y-up coordinate system with counter-clockwise motion,
    // after a quarter orbit, the position should be at (0, 0, -r)
    expect(position.x).toBeCloseTo(0, 0);
    expect(position.y).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(-earthSemiMajorAxis);
  });

  it("should calculate correct velocity magnitude for circular orbit", () => {
    const orbitalParameters = {
      period_s: earthOrbitalPeriod,
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: 0,
      inclination: 0,
      meanAnomaly: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      realAphelion_m: earthSemiMajorAxis,
      realPerihelion_m: earthSemiMajorAxis,
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const { velocity } = calculateKeplerianStateAtTime(orbitalParameters, 0);

    // For circular orbit, v = sqrt(mu/r)
    const mu =
      Math.pow((2 * Math.PI) / earthOrbitalPeriod, 2) *
      Math.pow(earthSemiMajorAxis, 3);
    const expectedVelocity = Math.sqrt(mu / earthSemiMajorAxis);

    expect(velocity.length()).toBeCloseTo(expectedVelocity);
  });

  it("should calculate correct position for elliptical orbit at periapsis", () => {
    const eccentricity = 0.5;
    const orbitalParameters = {
      period_s: earthOrbitalPeriod,
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: eccentricity,
      inclination: 0,
      meanAnomaly: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      realAphelion_m: earthSemiMajorAxis * (1 + eccentricity),
      realPerihelion_m: earthSemiMajorAxis * (1 - eccentricity),
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const { position } = calculateKeplerianStateAtTime(orbitalParameters, 0);
    const expectedPeriapsisDist = earthSemiMajorAxis * (1 - eccentricity);

    expect(position.x).toBeCloseTo(expectedPeriapsisDist);
    expect(position.y).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(0);
  });

  it("should calculate correct position for elliptical orbit at apoapsis", () => {
    const eccentricity = 0.5;
    const orbitalParameters = {
      period_s: earthOrbitalPeriod,
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: eccentricity,
      inclination: 0,
      meanAnomaly: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      realAphelion_m: earthSemiMajorAxis * (1 + eccentricity),
      realPerihelion_m: earthSemiMajorAxis * (1 - eccentricity),
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const halfPeriod = earthOrbitalPeriod / 2;
    const { position } = calculateKeplerianStateAtTime(
      orbitalParameters,
      halfPeriod,
    );
    const expectedApoapsisDist = earthSemiMajorAxis * (1 + eccentricity);

    expect(position.x).toBeCloseTo(-expectedApoapsisDist);
    expect(position.y).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(0);
  });

  it("should correctly apply inclination", () => {
    const inclination = Math.PI / 4; // 45 degrees
    const orbitalParameters = {
      period_s: earthOrbitalPeriod,
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: 0,
      inclination: inclination,
      meanAnomaly: 0,
      longitudeOfAscendingNode: Math.PI / 2, // 90 degrees, to get y component
      argumentOfPeriapsis: 0,
      realAphelion_m: earthSemiMajorAxis,
      realPerihelion_m: earthSemiMajorAxis,
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const { position } = calculateKeplerianStateAtTime(orbitalParameters, 0);

    // With inclination, the position should still have the same magnitude
    expect(position.length()).toBeCloseTo(earthSemiMajorAxis);

    // With inclination of 45 degrees and longitude of ascending node at 90 degrees,
    // the y component should be non-zero - but we don't need to check the exact value
    expect(Math.abs(position.y)).toBeGreaterThan(0);
  });
});

describe("Keplerian Position at True Anomaly", () => {
  const earthSemiMajorAxis = 1.496e11; // meters
  const earthEccentricity = 0.0167;

  it("should calculate correct position at periapsis (true anomaly = 0)", () => {
    const orbitalParameters = {
      period_s: 0, // Not used for this function
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: earthEccentricity,
      inclination: 0,
      meanAnomaly: 0, // Not used for this function
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      realAphelion_m: earthSemiMajorAxis * (1 + earthEccentricity),
      realPerihelion_m: earthSemiMajorAxis * (1 - earthEccentricity),
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const position = calculateKeplerianPositionAtTrueAnomaly(
      orbitalParameters,
      0,
    );
    const expectedPeriapsisDist = earthSemiMajorAxis * (1 - earthEccentricity);

    expect(position.x).toBeCloseTo(expectedPeriapsisDist);
    expect(position.y).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(0);
  });

  it("should calculate correct position at apoapsis (true anomaly = π)", () => {
    const orbitalParameters = {
      period_s: 0, // Not used for this function
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: earthEccentricity,
      inclination: 0,
      meanAnomaly: 0, // Not used for this function
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      realAphelion_m: earthSemiMajorAxis * (1 + earthEccentricity),
      realPerihelion_m: earthSemiMajorAxis * (1 - earthEccentricity),
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const position = calculateKeplerianPositionAtTrueAnomaly(
      orbitalParameters,
      Math.PI,
    );
    const expectedApoapsisDist = earthSemiMajorAxis * (1 + earthEccentricity);

    expect(position.x).toBeCloseTo(-expectedApoapsisDist);
    expect(position.y).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(0);
  });

  it("should correctly apply orbital rotations", () => {
    const orbitalParameters = {
      period_s: 0, // Not used for this function
      realSemiMajorAxis_m: earthSemiMajorAxis,
      eccentricity: 0, // Circular for simplicity
      inclination: Math.PI / 4, // 45 degrees inclination
      meanAnomaly: 0, // Not used for this function
      longitudeOfAscendingNode: Math.PI / 2, // 90 degrees
      argumentOfPeriapsis: Math.PI / 2, // 90 degrees
      realAphelion_m: earthSemiMajorAxis,
      realPerihelion_m: earthSemiMajorAxis,
      averageOrbitalSpeed_mps: 29780,
      epoch: "J2000",
    };

    const position = calculateKeplerianPositionAtTrueAnomaly(
      orbitalParameters,
      0,
    );

    // With these rotations, the position should still have the same magnitude
    expect(position.length()).toBeCloseTo(earthSemiMajorAxis);

    // But the components should be different due to the rotations
    expect(Math.abs(position.x)).not.toBeCloseTo(earthSemiMajorAxis);
  });
});
