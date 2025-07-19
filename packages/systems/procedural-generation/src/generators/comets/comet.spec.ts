import { describe, expect, it, beforeEach } from "vitest";
import { generateComet } from "./comet";
import {
  CelestialType,
  CelestialStatus,
  CometClass,
  StellarType,
  SpectralClass,
  LuminosityClass,
  type StarProperties,
  type CelestialObject,
  type CometProperties,
} from "@teskooano/data-types";
import * as CONST from "../../constants";

describe("Comet Generator", () => {
  let mockRandom: () => number;
  let mockParentStar: CelestialObject<StarProperties>;

  beforeEach(() => {
    // Create a deterministic random function for testing
    mockRandom = () => 0.5;

    // Create a mock parent star (G2V like our Sun)
    mockParentStar = {
      id: "test-star",
      name: "Test Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      parentId: undefined,
      realMass_kg: CONST.SOLAR_MASS_KG,
      realRadius_m: 696340000, // Solar radius
      temperature: 5778,
      albedo: 0.0,
      orbit: {
        realSemiMajorAxis_m: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 0,
        siderealRotationPeriod_s: 0,
        realAphelion_m: 0,
        realPerihelion_m: 0,
        averageOrbitalSpeed_mps: 0,
        epoch: "J2000",
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        color: "#FFF9E5",
        luminosity: 1.0, // Solar luminosity
      },
    };
  });

  describe("generateComet", () => {
    it("generates a valid comet with realistic properties", () => {
      const result = generateComet(mockRandom, mockParentStar, 5.0, 1);

      expect(result).toBeDefined();
      expect(result!.id).toContain("comet-test-star-");
      expect(result!.name).toBeDefined();
      expect(result!.type).toBe(CelestialType.COMET);
      expect(result!.status).toBe(CelestialStatus.ACTIVE);
      expect(result!.parentId).toBe("test-star");
      expect(result!.realMass_kg).toBeGreaterThan(0);
      expect(result!.realRadius_m).toBeGreaterThan(0);
      expect(result!.temperature).toBeGreaterThan(0);
      expect(result!.orbit).toBeDefined();
      expect(result!.properties).toBeDefined();
    });

    it("generates comet with correct orbital parameters", () => {
      const result = generateComet(mockRandom, mockParentStar, 10.0, 1);

      expect(result).toBeDefined();
      expect(result!.orbit.realSemiMajorAxis_m).toBeCloseTo(
        10.0 * CONST.AU_TO_METERS,
        -8,
      );
      expect(result!.orbit.eccentricity).toBeGreaterThanOrEqual(0.5);
      expect(result!.orbit.eccentricity).toBeLessThan(1.0);
      expect(result!.orbit.period_s).toBeGreaterThan(0);
      expect(result!.orbit.siderealRotationPeriod_s).toBe(
        result!.orbit.period_s,
      ); // Comets don't rotate independently
      expect(result!.orbit.inclination).toBeGreaterThanOrEqual(-Math.PI / 2);
      expect(result!.orbit.inclination).toBeLessThanOrEqual(Math.PI / 2);
    });

    it("generates comet with correct properties", () => {
      const result = generateComet(mockRandom, mockParentStar, 5.0, 1);

      expect(result).toBeDefined();
      const cometProps = result!.properties as CometProperties;
      expect(cometProps.type).toBe(CelestialType.COMET);
      expect(cometProps.classType).toBe(CometClass.ACTIVE);
      expect(cometProps.composition).toEqual(CONST.ICE_COMPOSITION);
      expect(cometProps.activity).toBeGreaterThanOrEqual(0.5);
      expect(cometProps.activity).toBeLessThanOrEqual(1.0);
      expect(cometProps.visualComaRadius).toBeGreaterThan(result!.realRadius_m);
      expect(cometProps.visualComaColor).toBe("#C8DCFF");
      expect(cometProps.visualComaOpacity).toBe(0.5);
      expect(cometProps.visualMaxTailLength).toBeGreaterThan(0);
      expect(cometProps.visualTailColor).toBe("#DCE6FF");
      expect(cometProps.visualTailOpacity).toBe(0.6);
    });

    it("generates realistic comet size and mass", () => {
      const result = generateComet(mockRandom, mockParentStar, 5.0, 1);

      expect(result).toBeDefined();
      // Comet radius should be between 1-21 km
      expect(result!.realRadius_m).toBeGreaterThanOrEqual(1000); // 1 km
      expect(result!.realRadius_m).toBeLessThanOrEqual(21000); // 21 km

      // Mass should be reasonable for the size
      const expectedDensity = 600; // kg/m^3
      const expectedMass =
        (4 / 3) * Math.PI * Math.pow(result!.realRadius_m, 3) * expectedDensity;
      expect(result!.realMass_kg).toBeCloseTo(expectedMass, -10);
    });

    it("handles different distances correctly", () => {
      const closeResult = generateComet(mockRandom, mockParentStar, 0.5, 1);
      const distantResult = generateComet(mockRandom, mockParentStar, 20.0, 2);

      expect(closeResult).toBeDefined();
      expect(distantResult).toBeDefined();

      // Distant comets should have longer orbital periods
      expect(distantResult!.orbit.period_s).toBeGreaterThan(
        closeResult!.orbit.period_s,
      );

      // Distant comets should be colder
      expect(distantResult!.temperature).toBeLessThan(closeResult!.temperature);
    });

    it("handles different star masses correctly", () => {
      const redDwarfStar: CelestialObject<StarProperties> = {
        ...mockParentStar,
        id: "red-dwarf",
        realMass_kg: 0.1 * CONST.SOLAR_MASS_KG,
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "M5V",
          mainSpectralClass: SpectralClass.M,
          luminosityClass: LuminosityClass.V,
          stellarType: StellarType.MAIN_SEQUENCE,
          color: "#FF6B35",
          luminosity: 0.01, // Very low luminosity
        },
      };

      const result = generateComet(mockRandom, redDwarfStar, 1.0, 1);

      expect(result).toBeDefined();
      expect(result!.temperature).toBeLessThan(mockParentStar.temperature);
    });

    it("returns null for invalid star mass", () => {
      const invalidStar: CelestialObject<StarProperties> = {
        ...mockParentStar,
        realMass_kg: 0,
      };

      const result = generateComet(mockRandom, invalidStar, 5.0, 1);
      expect(result).toBeNull();
    });

    it("adjusts distance to stay within system boundary", () => {
      const result = generateComet(
        mockRandom,
        mockParentStar,
        CONST.SYSTEM_MAX_DISTANCE_AU + 1000,
        1,
      );

      // The function should adjust the distance to stay within bounds rather than returning null
      expect(result).toBeDefined();
      expect(result!.orbit.realSemiMajorAxis_m).toBeLessThan(
        CONST.SYSTEM_MAX_DISTANCE_AU * CONST.AU_TO_METERS,
      );

      // The aphelion should also be within bounds
      const aphelionAU =
        (result!.orbit.realSemiMajorAxis_m * (1 + result!.orbit.eccentricity)) /
        CONST.AU_TO_METERS;
      expect(aphelionAU).toBeLessThanOrEqual(CONST.SYSTEM_MAX_DISTANCE_AU + 1); // Allow small floating point error
    });

    it("adjusts orbit to stay within system boundary", () => {
      // Test with a distance that would create an orbit exceeding the boundary
      const result = generateComet(
        mockRandom,
        mockParentStar,
        CONST.SYSTEM_MAX_DISTANCE_AU * 0.8,
        1,
      );

      expect(result).toBeDefined();
      // The orbit should be adjusted to stay within bounds
      const aphelionAU =
        (result!.orbit.realSemiMajorAxis_m * (1 + result!.orbit.eccentricity)) /
        CONST.AU_TO_METERS;
      expect(aphelionAU).toBeLessThanOrEqual(CONST.SYSTEM_MAX_DISTANCE_AU + 1); // Allow small floating point error
    });

    it("generates deterministic results with same seed", () => {
      const result1 = generateComet(mockRandom, mockParentStar, 5.0, 1);
      const result2 = generateComet(mockRandom, mockParentStar, 5.0, 1);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1!.id).toBe(result2!.id);
      expect(result1!.name).toBe(result2!.name);
      expect(result1!.realMass_kg).toBe(result2!.realMass_kg);
      expect(result1!.realRadius_m).toBe(result2!.realRadius_m);
      expect(result1!.orbit.eccentricity).toBe(result2!.orbit.eccentricity);
      expect(result1!.orbit.period_s).toBe(result2!.orbit.period_s);
    });

    it("handles edge case distances", () => {
      // Test very close distance
      const closeResult = generateComet(mockRandom, mockParentStar, 0.1, 1);
      expect(closeResult).toBeDefined();

      // Test very distant distance (but within boundary)
      const distantResult = generateComet(
        mockRandom,
        mockParentStar,
        CONST.SYSTEM_MAX_DISTANCE_AU * 0.9,
        2,
      );
      expect(distantResult).toBeDefined();
    });

    it("generates unique IDs for different comets", () => {
      // Use different random functions to generate different names
      const random1 = () => 0.3;
      const random2 = () => 0.7;

      const result1 = generateComet(random1, mockParentStar, 5.0, 1);
      const result2 = generateComet(random2, mockParentStar, 5.0, 2);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1!.id).not.toBe(result2!.id);
    });

    it("calculates realistic temperatures", () => {
      const result = generateComet(mockRandom, mockParentStar, 1.0, 1);

      expect(result).toBeDefined();
      // Temperature should be reasonable for a comet at 1 AU from a Sun-like star
      expect(result!.temperature).toBeGreaterThan(2.7); // Not colder than cosmic background
      expect(result!.temperature).toBeLessThan(300); // Not hotter than room temperature
    });

    it("handles stars without luminosity property", () => {
      const starWithoutLuminosity: CelestialObject<StarProperties> = {
        ...mockParentStar,
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G2V",
          mainSpectralClass: SpectralClass.G,
          luminosityClass: LuminosityClass.V,
          stellarType: StellarType.MAIN_SEQUENCE,
          color: "#FFF9E5",
          luminosity: 0, // Set to 0 to test fallback behavior
        },
      };

      const result = generateComet(mockRandom, starWithoutLuminosity, 1.0, 1);
      expect(result).toBeDefined();
      expect(result!.temperature).toBeGreaterThan(0);
    });
  });
});
