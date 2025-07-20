import { describe, expect, it, beforeEach, vi } from "vitest";
import { setupBinaryOrbit } from "./binary-orbit-setup";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";

describe("Binary Orbit Setup", () => {
  let mockPrimaryStar: any;
  let mockCompanionStar: any;

  beforeEach(() => {
    // Create a mock primary star (G2V like our Sun)
    mockPrimaryStar = {
      id: "primary-star",
      name: "Primary Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG,
      realRadius_m: CONST.SOLAR_RADIUS_M,
      temperature: 5778,
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 1.0,
        color: "#FFF9E5",
      },
    };

    // Create a mock companion star (K5V)
    mockCompanionStar = {
      id: "companion-star",
      name: "Companion Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 0.7, // 70% solar mass
      realRadius_m: CONST.SOLAR_RADIUS_M * 0.7, // 70% solar radius
      temperature: 4000,
      properties: {
        type: CelestialType.STAR,
        isMainStar: false,
        spectralClass: "K5V",
        mainSpectralClass: SpectralClass.K,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 0.2,
        color: "#FFD2A1",
      },
    };
  });

  describe("setupBinaryOrbit", () => {
    it("should set up binary orbit with valid parameters", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const separationAU = 1.0;
      const eccentricity = 0.1;
      const inclination = 0.05; // ~2.9 degrees

      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        separationAU,
        eccentricity,
        inclination,
        random,
      );

      expect(primary).toBe(mockPrimaryStar);
      expect(companion).toBe(mockCompanionStar);
    });

    it("should set up proper parent-child relationships", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      expect(primary.parentId).toBeUndefined(); // Primary has no parent
      expect(companion.parentId).toBe(primary.id); // Companion orbits primary
    });

    it("should generate valid orbital parameters for both stars", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      [primary, companion].forEach((star) => {
        expect(star.orbit).toBeDefined();
        expect(star.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
        expect(star.orbit.eccentricity).toBe(0.1);
        expect(star.orbit.period_s).toBeGreaterThan(0);
        expect(star.orbit.inclination).toBeDefined();
        expect(star.orbit.longitudeOfAscendingNode).toBeDefined();
        expect(star.orbit.argumentOfPeriapsis).toBeDefined();
        expect(star.orbit.meanAnomaly).toBeDefined();
        expect(star.orbit.siderealRotationPeriod_s).toBeDefined();
        expect(star.orbit.axialTilt).toBeDefined();
      });
    });

    it("should calculate correct semi-major axes based on mass ratio", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const separationAU = 2.0;
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        separationAU,
        0.1,
        0.05,
        random,
      );

      const totalMass =
        mockPrimaryStar.realMass_kg + mockCompanionStar.realMass_kg;
      const separationMeters = separationAU * CONST.AU_TO_METERS;

      const expectedPrimarySMA =
        (mockCompanionStar.realMass_kg / totalMass) * separationMeters;
      const expectedCompanionSMA =
        (mockPrimaryStar.realMass_kg / totalMass) * separationMeters;

      expect(primary.orbit.realSemiMajorAxis_m).toBeCloseTo(
        expectedPrimarySMA,
        0,
      );
      expect(companion.orbit.realSemiMajorAxis_m).toBeCloseTo(
        expectedCompanionSMA,
        0,
      );
    });

    it("should set up 180° phase separation for stability", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      // Check that the stars are 180° out of phase
      const primaryMeanAnomaly = primary.orbit.meanAnomaly;
      const companionMeanAnomaly = companion.orbit.meanAnomaly;

      // Convert to radians and check phase difference
      const primaryRad = (primaryMeanAnomaly * Math.PI) / 180;
      const companionRad = (companionMeanAnomaly * Math.PI) / 180;

      const phaseDifference = Math.abs(primaryRad - companionRad);
      const expectedPhaseDifference = Math.PI; // 180°

      expect(phaseDifference).toBeCloseTo(expectedPhaseDifference, 1);
    });

    it("should set up argument of periapsis with 180° difference", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      const primaryArgPeriapsis = primary.orbit.argumentOfPeriapsis;
      const companionArgPeriapsis = companion.orbit.argumentOfPeriapsis;

      // Convert to radians and check difference
      const primaryRad = (primaryArgPeriapsis * Math.PI) / 180;
      const companionRad = (companionArgPeriapsis * Math.PI) / 180;

      const difference = Math.abs(primaryRad - companionRad);
      const expectedDifference = Math.PI; // 180°

      expect(difference).toBeCloseTo(expectedDifference, 1);
    });

    it("should use the same orbital period for both stars", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      expect(primary.orbit.period_s).toBe(companion.orbit.period_s);
      expect(primary.orbit.period_s).toBeGreaterThan(0);
    });

    it("should use the same longitude of ascending node for both stars", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      expect(primary.orbit.longitudeOfAscendingNode).toBe(
        companion.orbit.longitudeOfAscendingNode,
      );
    });

    it("should use the same inclination for both stars", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      expect(primary.orbit.inclination).toBe(companion.orbit.inclination);
    });

    it("should handle different separation values", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const separations = [0.5, 1.0, 5.0, 10.0];

      separations.forEach((separation) => {
        const [primary, companion] = setupBinaryOrbit(
          mockPrimaryStar,
          mockCompanionStar,
          separation,
          0.1,
          0.05,
          random,
        );

        expect(primary.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
        expect(companion.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
        expect(primary.orbit.period_s).toBeGreaterThan(0);
        expect(companion.orbit.period_s).toBeGreaterThan(0);
      });
    });

    it("should handle different eccentricity values", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const eccentricities = [0.0, 0.1, 0.5, 0.9];

      eccentricities.forEach((eccentricity) => {
        const [primary, companion] = setupBinaryOrbit(
          mockPrimaryStar,
          mockCompanionStar,
          1.0,
          eccentricity,
          0.05,
          random,
        );

        expect(primary.orbit.eccentricity).toBe(eccentricity);
        expect(companion.orbit.eccentricity).toBe(eccentricity);
      });
    });

    it("should handle different inclination values", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const inclinations = [0.0, 0.1, 0.5, 1.0];

      inclinations.forEach((inclination) => {
        const [primary, companion] = setupBinaryOrbit(
          mockPrimaryStar,
          mockCompanionStar,
          1.0,
          0.1,
          inclination,
          random,
        );

        expect(primary.orbit.inclination).toBeDefined();
        expect(companion.orbit.inclination).toBeDefined();
        expect(primary.orbit.inclination).toBe(companion.orbit.inclination);
      });
    });

    it("should use the provided random function", () => {
      const mockRandom = vi.fn().mockReturnValue(0.5);

      setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        mockRandom,
      );

      expect(mockRandom).toHaveBeenCalled();
    });

    it("should generate realistic orbital periods", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      const period = primary.orbit.period_s;
      expect(period).toBeGreaterThan(0);
      // For 1 AU separation, period should be roughly 1 year
      expect(period).toBeCloseTo(365.25 * 24 * 3600, -1); // Within order of magnitude
    });

    it("should preserve original star properties", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const originalPrimary = { ...mockPrimaryStar };
      const originalCompanion = { ...mockCompanionStar };

      const [primary, companion] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        1.0,
        0.1,
        0.05,
        random,
      );

      expect(primary.id).toBe(originalPrimary.id);
      expect(primary.name).toBe(originalPrimary.name);
      expect(primary.realMass_kg).toBe(originalPrimary.realMass_kg);
      expect(primary.properties).toBe(originalPrimary.properties);

      expect(companion.id).toBe(originalCompanion.id);
      expect(companion.name).toBe(originalCompanion.name);
      expect(companion.realMass_kg).toBe(originalCompanion.realMass_kg);
      expect(companion.properties).toBe(originalCompanion.properties);
    });

    it("should handle edge case parameters gracefully", () => {
      const random = vi.fn().mockReturnValue(0.5);

      // Test with very small separation
      const [primary1, companion1] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        0.001,
        0.0,
        0.0,
        random,
      );
      expect(primary1.orbit).toBeDefined();
      expect(companion1.orbit).toBeDefined();

      // Test with very large separation
      const [primary2, companion2] = setupBinaryOrbit(
        mockPrimaryStar,
        mockCompanionStar,
        100.0,
        0.9,
        1.0,
        random,
      );
      expect(primary2.orbit).toBeDefined();
      expect(companion2.orbit).toBeDefined();
    });
  });
});
