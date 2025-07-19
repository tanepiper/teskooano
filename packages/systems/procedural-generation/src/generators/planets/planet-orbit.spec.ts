import { describe, expect, it, beforeEach } from "vitest";
import { calculatePlanetOrbitAndInitialState } from "./planet-orbit";
import { CelestialType } from "@teskooano/data-types";
import * as CONST from "../../constants";

describe("Planet Orbit Generator", () => {
  let mockRandom: () => number;

  beforeEach(() => {
    // Create a deterministic random function for testing
    mockRandom = () => 0.5;
  });

  describe("calculatePlanetOrbitAndInitialState", () => {
    const SOLAR_MASS_KG = 1.989e30;
    const EARTH_MASS_KG = 5.972e24;

    it("generates valid orbital parameters for a close planet", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        0.5, // 0.5 AU
        "test-planet-1",
      );

      expect(result.orbit).toBeDefined();
      expect(result.orbit.realSemiMajorAxis_m).toBeCloseTo(
        0.5 * CONST.AU_TO_METERS,
        -8,
      );
      expect(result.orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(result.orbit.eccentricity).toBeLessThan(1);
      expect(result.orbit.period_s).toBeGreaterThan(0);
      expect(result.orbit.siderealRotationPeriod_s).toBeGreaterThan(0);
      expect(result.orbit.axialTilt).toBeDefined();
    });

    it("generates valid orbital parameters for a distant planet", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        10.0, // 10 AU
        "test-planet-2",
      );

      expect(result.orbit).toBeDefined();
      expect(result.orbit.realSemiMajorAxis_m).toBeCloseTo(
        10.0 * CONST.AU_TO_METERS,
        -8,
      );
      expect(result.orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(result.orbit.eccentricity).toBeLessThan(1);
      expect(result.orbit.period_s).toBeGreaterThan(0);
    });

    it("generates very low eccentricity for close planets", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        0.05, // Very close planet
        "test-planet-close",
      );

      expect(result.orbit.eccentricity).toBeLessThan(0.05);
    });

    it("generates conservative eccentricity for medium-distance planets", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        2.0, // Medium distance
        "test-planet-medium",
      );

      expect(result.orbit.eccentricity).toBeLessThan(0.1);
    });

    it("generates realistic orbital periods", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        1.0, // 1 AU
        "test-planet-earth-like",
      );

      // Earth-like planet at 1 AU should have period around 1 year
      const expectedPeriod_s = 365.25 * 24 * 60 * 60; // ~1 year
      expect(result.orbit.period_s).toBeCloseTo(expectedPeriod_s, -7);
    });

    it("generates tidally locked rotation for very close planets", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        0.05, // Very close planet
        "test-planet-tidally-locked",
      );

      // Should be tidally locked (rotation period = orbital period)
      expect(result.orbit.siderealRotationPeriod_s).toBeCloseTo(
        result.orbit.period_s,
        -6,
      );
    });

    it("generates independent rotation for distant planets", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        5.0, // Distant planet
        "test-planet-distant",
      );

      // Should have independent rotation (not tidally locked)
      expect(result.orbit.siderealRotationPeriod_s).not.toBeCloseTo(
        result.orbit.period_s,
        -6,
      );
    });

    it("handles different star masses correctly", () => {
      const redDwarfMass = 0.1 * SOLAR_MASS_KG;
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        redDwarfMass,
        EARTH_MASS_KG,
        0.1, // Close to red dwarf
        "test-planet-red-dwarf",
      );

      // Lower mass star should result in longer orbital period
      expect(result.orbit.period_s).toBeGreaterThan(0);
    });

    it("handles different planet masses correctly", () => {
      const jupiterMass = 317.8 * EARTH_MASS_KG;
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        jupiterMass,
        5.0, // Jupiter-like distance
        "test-planet-jupiter-like",
      );

      expect(result.orbit).toBeDefined();
      expect(result.orbit.period_s).toBeGreaterThan(0);
    });

    it("generates realistic inclination values", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        1.0,
        "test-planet-inclination",
      );

      // Most planets should have low inclination (nearly coplanar)
      expect(result.orbit.inclination).toBeGreaterThanOrEqual(0);
      expect(result.orbit.inclination).toBeLessThan(0.26); // ~15 degrees max
    });

    it("generates valid orbital angles", () => {
      const result = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        1.0,
        "test-planet-angles",
      );

      // All angles should be in valid ranges
      expect(result.orbit.longitudeOfAscendingNode).toBeGreaterThanOrEqual(0);
      expect(result.orbit.longitudeOfAscendingNode).toBeLessThan(2 * Math.PI);
      expect(result.orbit.argumentOfPeriapsis).toBeGreaterThanOrEqual(0);
      expect(result.orbit.argumentOfPeriapsis).toBeLessThan(2 * Math.PI);
      expect(result.orbit.meanAnomaly).toBeGreaterThanOrEqual(0);
      expect(result.orbit.meanAnomaly).toBeLessThan(2 * Math.PI);
    });

    it("handles edge case distances", () => {
      // Test very close distance
      const closeResult = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        0.01, // Very close
        "test-planet-very-close",
      );
      expect(closeResult.orbit).toBeDefined();

      // Test very distant distance
      const distantResult = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        100.0, // Very distant
        "test-planet-very-distant",
      );
      expect(distantResult.orbit).toBeDefined();
    });

    it("produces deterministic results with same seed", () => {
      const result1 = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        1.0,
        "test-planet-deterministic",
      );

      const result2 = calculatePlanetOrbitAndInitialState(
        mockRandom,
        SOLAR_MASS_KG,
        EARTH_MASS_KG,
        1.0,
        "test-planet-deterministic",
      );

      expect(result1.orbit.realSemiMajorAxis_m).toBe(
        result2.orbit.realSemiMajorAxis_m,
      );
      expect(result1.orbit.eccentricity).toBe(result2.orbit.eccentricity);
      expect(result1.orbit.inclination).toBe(result2.orbit.inclination);
      expect(result1.orbit.period_s).toBe(result2.orbit.period_s);
    });
  });
});
