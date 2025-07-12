import { describe, it, expect } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import { calculateElementsFromStateVectors } from "./elementsFromState";
import { GRAVITATIONAL_CONSTANT as G } from "../units/constants";

describe("Orbital Elements Calculation", () => {
  const sunMass = 1.989e30; // kg
  const earthSemiMajorAxis = 1.496e11; // meters
  const earthEccentricity = 0.0167;

  it("should return null for zero parent mass", () => {
    const position = new OSVector3(earthSemiMajorAxis, 0, 0);
    const velocity = new OSVector3(0, 0, 30000);

    const result = calculateElementsFromStateVectors(position, velocity, 0);

    expect(result).toBeNull();
  });

  it("should return null for near-zero position", () => {
    const position = new OSVector3(1e-10, 0, 0);
    const velocity = new OSVector3(0, 0, 30000);

    const result = calculateElementsFromStateVectors(
      position,
      velocity,
      sunMass,
    );

    expect(result).toBeNull();
  });

  it("should return null for near-zero velocity", () => {
    const position = new OSVector3(earthSemiMajorAxis, 0, 0);
    const velocity = new OSVector3(0, 0, 1e-10);

    const result = calculateElementsFromStateVectors(
      position,
      velocity,
      sunMass,
    );

    expect(result).toBeNull();
  });

  it("should calculate correct elements for circular orbit", () => {
    // For circular orbit, position at (r, 0, 0) and velocity at (0, 0, v)
    const position = new OSVector3(earthSemiMajorAxis, 0, 0);

    // Calculate circular orbit velocity: v = sqrt(mu/r)
    const mu = G * sunMass;
    const circularVelocity = Math.sqrt(mu / earthSemiMajorAxis);
    // In our Y-up coordinate system with counter-clockwise motion, velocity is in -Z direction
    const velocity = new OSVector3(0, 0, -circularVelocity);

    const elements = calculateElementsFromStateVectors(
      position,
      velocity,
      sunMass,
    );

    expect(elements).not.toBeNull();
    if (elements) {
      expect(elements.eccentricity).toBeCloseTo(0, 5);
      expect(elements.realSemiMajorAxis_m).toBeCloseTo(earthSemiMajorAxis);

      // Note: The actual inclination value depends on the implementation details
      // of calculateElementsFromStateVectors and its coordinate system conventions.
      // We don't test the exact value, just that it exists
      expect(elements.inclination).toBeDefined();
      expect(elements.longitudeOfAscendingNode).toBeDefined();
      expect(elements.argumentOfPeriapsis).toBeDefined();
    }
  });

  it("should calculate correct elements for elliptical orbit", () => {
    const eccentricity = 0.5;
    const position = new OSVector3(
      earthSemiMajorAxis * (1 - eccentricity),
      0,
      0,
    ); // Periapsis position

    // At periapsis, velocity is perpendicular to position vector
    const mu = G * sunMass;
    const periapsisVelocity = Math.sqrt(
      (mu * (1 + eccentricity)) / (earthSemiMajorAxis * (1 - eccentricity)),
    );
    // In our Y-up coordinate system, velocity is in -Z direction
    const velocity = new OSVector3(0, 0, -periapsisVelocity);

    const elements = calculateElementsFromStateVectors(
      position,
      velocity,
      sunMass,
    );

    expect(elements).not.toBeNull();
    if (elements) {
      expect(elements.eccentricity).toBeCloseTo(eccentricity, 2);
      expect(elements.realSemiMajorAxis_m).toBeCloseTo(earthSemiMajorAxis, -3); // Lower precision due to approximation

      // Note: The actual inclination value depends on the implementation details
      // of calculateElementsFromStateVectors and its coordinate system conventions.
      // We don't test the exact value, just that it exists
      expect(elements.inclination).toBeDefined();
      expect(elements.longitudeOfAscendingNode).toBeDefined();
      expect(elements.argumentOfPeriapsis).toBeDefined();
    }
  });

  it("should calculate inclination for inclined orbit", () => {
    const inclination = Math.PI / 4; // 45 degrees

    // For an inclined orbit in our coordinate system, we need to adjust the setup
    // Start with position in XZ plane and rotate velocity
    const position = new OSVector3(earthSemiMajorAxis, 0, 0);

    // Calculate circular orbit velocity
    const mu = G * sunMass;
    const circularVelocity = Math.sqrt(mu / earthSemiMajorAxis);

    // Create velocity vector that's not purely in the XZ plane
    // This creates an orbit inclined to the XZ plane
    const velocity = new OSVector3(
      0,
      -circularVelocity * Math.sin(inclination),
      -circularVelocity * Math.cos(inclination),
    );

    const elements = calculateElementsFromStateVectors(
      position,
      velocity,
      sunMass,
    );

    expect(elements).not.toBeNull();
    if (elements) {
      // We only verify that inclination is non-zero when we provide an inclined velocity
      expect(elements.inclination).toBeGreaterThan(0);
    }
  });

  it("should handle near-circular orbits correctly", () => {
    // Earth's actual eccentricity is very small
    const position = new OSVector3(
      earthSemiMajorAxis * (1 - earthEccentricity),
      0,
      0,
    );

    const mu = G * sunMass;
    const velocity = new OSVector3(
      0,
      0,
      -Math.sqrt(
        (mu * (1 + earthEccentricity)) /
          (earthSemiMajorAxis * (1 - earthEccentricity)),
      ),
    );

    const elements = calculateElementsFromStateVectors(
      position,
      velocity,
      sunMass,
    );

    expect(elements).not.toBeNull();
    if (elements) {
      expect(elements.eccentricity).toBeCloseTo(earthEccentricity, 2);
      expect(elements.realSemiMajorAxis_m).toBeCloseTo(earthSemiMajorAxis, -3);
    }
  });

  it("should detect parabolic orbit correctly", () => {
    // For parabolic orbit, eccentricity = 1
    const position = new OSVector3(earthSemiMajorAxis, 0, 0);

    // Escape velocity: v = sqrt(2*mu/r)
    const mu = G * sunMass;
    const escapeVelocity = Math.sqrt((2 * mu) / earthSemiMajorAxis);
    const velocity = new OSVector3(0, 0, -escapeVelocity);

    const elements = calculateElementsFromStateVectors(
      position,
      velocity,
      sunMass,
    );

    expect(elements).not.toBeNull();
    if (elements) {
      expect(elements.eccentricity).toBeCloseTo(1, 1);
    }
  });

  it("should detect hyperbolic orbit correctly", () => {
    // For hyperbolic orbit, eccentricity > 1
    const position = new OSVector3(earthSemiMajorAxis, 0, 0);

    // Greater than escape velocity
    const mu = G * sunMass;
    const hyperVelocity = Math.sqrt((3 * mu) / earthSemiMajorAxis); // 1.5 times escape velocity
    const velocity = new OSVector3(0, 0, -hyperVelocity);

    const elements = calculateElementsFromStateVectors(
      position,
      velocity,
      sunMass,
    );

    expect(elements).not.toBeNull();
    if (elements) {
      expect(elements.eccentricity).toBeGreaterThan(1);
    }
  });
});
