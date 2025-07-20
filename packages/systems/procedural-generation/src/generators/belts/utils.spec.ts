import { describe, expect, it } from "vitest";
import { isValidAsteroidBeltDistance } from "./utils";
import * as CONST from "../../constants";

describe("Belt Utilities", () => {
  describe("isValidAsteroidBeltDistance", () => {
    it("should reject distances beyond system boundary", () => {
      const solarMass = 1.989e30;

      // Test with distance beyond system boundary
      expect(
        isValidAsteroidBeltDistance(
          CONST.SYSTEM_MAX_DISTANCE_AU + 1,
          solarMass,
        ),
      ).toBe(false);
      expect(
        isValidAsteroidBeltDistance(
          CONST.SYSTEM_MAX_DISTANCE_AU + 1000,
          solarMass,
        ),
      ).toBe(false);
      expect(isValidAsteroidBeltDistance(Infinity, solarMass)).toBe(false);
    });

    it("should accept valid distances for solar-mass stars", () => {
      const solarMass = 1.989e30;

      // Valid distances for solar-mass stars (1.5-6.0 AU, or up to 100 AU for outer belts)
      expect(isValidAsteroidBeltDistance(2.0, solarMass)).toBe(true); // Main belt
      expect(isValidAsteroidBeltDistance(3.0, solarMass)).toBe(true); // Main belt
      expect(isValidAsteroidBeltDistance(5.0, solarMass)).toBe(true); // Main belt
      expect(isValidAsteroidBeltDistance(50.0, solarMass)).toBe(true); // Outer belt
      expect(isValidAsteroidBeltDistance(100.0, solarMass)).toBe(true); // Outer belt
    });

    it("should reject distances too close for solar-mass stars", () => {
      const solarMass = 1.989e30;

      // Too close for belt stability (below 1.5 AU)
      expect(isValidAsteroidBeltDistance(1.0, solarMass)).toBe(false);
      expect(isValidAsteroidBeltDistance(1.4, solarMass)).toBe(false);
      expect(isValidAsteroidBeltDistance(0.5, solarMass)).toBe(false);
      expect(isValidAsteroidBeltDistance(0, solarMass)).toBe(false);
      expect(isValidAsteroidBeltDistance(-1, solarMass)).toBe(false);
    });

    it("should reject distances too far for solar-mass stars", () => {
      const solarMass = 1.989e30;

      // The function allows outer belts up to 100 AU, so distances beyond 100 AU should be rejected
      expect(isValidAsteroidBeltDistance(100.1, solarMass)).toBe(false); // Just beyond outer belt limit
      expect(isValidAsteroidBeltDistance(150.0, solarMass)).toBe(false); // Beyond outer belt limit
      expect(isValidAsteroidBeltDistance(1000.0, solarMass)).toBe(false); // Far beyond limit

      // But outer belts are allowed up to 100 AU
      expect(isValidAsteroidBeltDistance(6.1, solarMass)).toBe(true); // Beyond main belt but within outer belt
      expect(isValidAsteroidBeltDistance(7.0, solarMass)).toBe(true); // Beyond main belt but within outer belt
      expect(isValidAsteroidBeltDistance(10.0, solarMass)).toBe(true); // Beyond main belt but within outer belt
      expect(isValidAsteroidBeltDistance(50.0, solarMass)).toBe(true); // Outer belt
      expect(isValidAsteroidBeltDistance(100.0, solarMass)).toBe(true); // Outer belt
    });

    it("should scale limits correctly for different star masses", () => {
      const solarMass = 1.989e30;

      // Low-mass star (0.1 solar masses)
      const lowMassStar = solarMass * 0.1;
      const lowMassInnerLimit = 1.5 * Math.sqrt(0.1); // ~0.47 AU
      const lowMassOuterLimit = 6.0 * Math.sqrt(0.1); // ~1.90 AU

      expect(
        isValidAsteroidBeltDistance(lowMassInnerLimit - 0.1, lowMassStar),
      ).toBe(false);
      expect(isValidAsteroidBeltDistance(lowMassInnerLimit, lowMassStar)).toBe(
        true,
      );
      expect(isValidAsteroidBeltDistance(lowMassOuterLimit, lowMassStar)).toBe(
        true,
      );
      // Beyond main belt but within outer belt (up to 100 AU)
      expect(
        isValidAsteroidBeltDistance(lowMassOuterLimit + 0.1, lowMassStar),
      ).toBe(true);
      expect(isValidAsteroidBeltDistance(2.0, lowMassStar)).toBe(true);

      // But outer belts are still allowed up to 100 AU
      expect(isValidAsteroidBeltDistance(50.0, lowMassStar)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.0, lowMassStar)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.1, lowMassStar)).toBe(false);
    });

    it("should scale limits correctly for high-mass stars", () => {
      const solarMass = 1.989e30;

      // High-mass star (4 solar masses)
      const highMassStar = solarMass * 4.0;
      const highMassInnerLimit = 1.5 * Math.sqrt(4.0); // ~3.0 AU
      const highMassOuterLimit = 6.0 * Math.sqrt(4.0); // ~12.0 AU

      expect(
        isValidAsteroidBeltDistance(highMassInnerLimit - 0.1, highMassStar),
      ).toBe(false);
      expect(
        isValidAsteroidBeltDistance(highMassInnerLimit, highMassStar),
      ).toBe(true);
      expect(
        isValidAsteroidBeltDistance(highMassOuterLimit, highMassStar),
      ).toBe(true);
      // Beyond main belt but within outer belt (up to 100 AU)
      expect(
        isValidAsteroidBeltDistance(highMassOuterLimit + 0.1, highMassStar),
      ).toBe(true);
      expect(isValidAsteroidBeltDistance(15.0, highMassStar)).toBe(true);

      // But outer belts are still allowed up to 100 AU
      expect(isValidAsteroidBeltDistance(50.0, highMassStar)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.0, highMassStar)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.1, highMassStar)).toBe(false);
    });

    it("should handle edge cases for very low-mass stars", () => {
      const solarMass = 1.989e30;

      // Very low-mass star (0.01 solar masses)
      const veryLowMassStar = solarMass * 0.01;
      const veryLowMassInnerLimit = 1.5 * Math.sqrt(0.01); // ~0.15 AU
      const veryLowMassOuterLimit = 6.0 * Math.sqrt(0.01); // ~0.60 AU

      expect(
        isValidAsteroidBeltDistance(
          veryLowMassInnerLimit - 0.01,
          veryLowMassStar,
        ),
      ).toBe(false);
      expect(
        isValidAsteroidBeltDistance(veryLowMassInnerLimit, veryLowMassStar),
      ).toBe(true);
      expect(
        isValidAsteroidBeltDistance(veryLowMassOuterLimit, veryLowMassStar),
      ).toBe(true);
      // Beyond main belt but within outer belt (up to 100 AU)
      expect(
        isValidAsteroidBeltDistance(
          veryLowMassOuterLimit + 0.01,
          veryLowMassStar,
        ),
      ).toBe(true);
      expect(isValidAsteroidBeltDistance(1.0, veryLowMassStar)).toBe(true);

      // Outer belts still allowed
      expect(isValidAsteroidBeltDistance(50.0, veryLowMassStar)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.0, veryLowMassStar)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.1, veryLowMassStar)).toBe(false);
    });

    it("should handle edge cases for very high-mass stars", () => {
      const solarMass = 1.989e30;

      // Very high-mass star (16 solar masses)
      const veryHighMassStar = solarMass * 16.0;
      const veryHighMassInnerLimit = 1.5 * Math.sqrt(16.0); // ~6.0 AU
      const veryHighMassOuterLimit = 6.0 * Math.sqrt(16.0); // ~24.0 AU

      expect(
        isValidAsteroidBeltDistance(
          veryHighMassInnerLimit - 0.1,
          veryHighMassStar,
        ),
      ).toBe(false);
      expect(
        isValidAsteroidBeltDistance(veryHighMassInnerLimit, veryHighMassStar),
      ).toBe(true);
      expect(
        isValidAsteroidBeltDistance(veryHighMassOuterLimit, veryHighMassStar),
      ).toBe(true);
      // Beyond main belt but within outer belt (up to 100 AU)
      expect(
        isValidAsteroidBeltDistance(
          veryHighMassOuterLimit + 0.1,
          veryHighMassStar,
        ),
      ).toBe(true);
      expect(isValidAsteroidBeltDistance(30.0, veryHighMassStar)).toBe(true);

      // Outer belts still allowed
      expect(isValidAsteroidBeltDistance(50.0, veryHighMassStar)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.0, veryHighMassStar)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.1, veryHighMassStar)).toBe(false);
    });

    it("should handle invalid star masses gracefully", () => {
      const solarMass = 1.989e30;

      // Zero mass - results in mass ratio of 0, so inner limit = 0, outer limit = 0, max = 100
      // This means any distance from 0 to 100 AU is valid
      expect(isValidAsteroidBeltDistance(3.0, 0)).toBe(true);
      expect(isValidAsteroidBeltDistance(50.0, 0)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.0, 0)).toBe(true);
      expect(isValidAsteroidBeltDistance(100.1, 0)).toBe(false);

      // Negative mass - results in negative mass ratio, which gives NaN when sqrt is applied
      expect(isValidAsteroidBeltDistance(3.0, -solarMass)).toBe(false);

      // Infinite mass - results in infinite mass ratio, which gives Infinity when sqrt is applied
      expect(isValidAsteroidBeltDistance(3.0, Infinity)).toBe(false);
      expect(isValidAsteroidBeltDistance(3.0, -Infinity)).toBe(false);

      // NaN mass - this will result in NaN mass ratio
      expect(isValidAsteroidBeltDistance(3.0, NaN)).toBe(false);
    });

    it("should handle invalid distances gracefully", () => {
      const solarMass = 1.989e30;

      // Invalid distance values
      expect(isValidAsteroidBeltDistance(NaN, solarMass)).toBe(false);
      expect(isValidAsteroidBeltDistance(Infinity, solarMass)).toBe(false);
      expect(isValidAsteroidBeltDistance(-Infinity, solarMass)).toBe(false);
    });

    it("should provide realistic belt formation zones", () => {
      const solarMass = 1.989e30;

      // Test that the function provides realistic ranges for different star types
      // Red dwarf (0.1 solar masses)
      const redDwarfMass = solarMass * 0.1;
      expect(isValidAsteroidBeltDistance(0.5, redDwarfMass)).toBe(true); // Should be valid
      expect(isValidAsteroidBeltDistance(1.0, redDwarfMass)).toBe(true); // Should be valid
      expect(isValidAsteroidBeltDistance(2.0, redDwarfMass)).toBe(true); // Beyond main belt but within outer belt

      // Sun-like star (1 solar mass)
      expect(isValidAsteroidBeltDistance(2.0, solarMass)).toBe(true); // Should be valid
      expect(isValidAsteroidBeltDistance(4.0, solarMass)).toBe(true); // Should be valid
      expect(isValidAsteroidBeltDistance(7.0, solarMass)).toBe(true); // Beyond main belt but within outer belt

      // Blue giant (10 solar masses)
      const blueGiantMass = solarMass * 10.0;
      expect(isValidAsteroidBeltDistance(5.0, blueGiantMass)).toBe(true); // Should be valid
      expect(isValidAsteroidBeltDistance(15.0, blueGiantMass)).toBe(true); // Should be valid
      expect(isValidAsteroidBeltDistance(25.0, blueGiantMass)).toBe(true); // Beyond main belt but within outer belt

      // All should reject distances beyond 100 AU
      expect(isValidAsteroidBeltDistance(100.1, redDwarfMass)).toBe(false);
      expect(isValidAsteroidBeltDistance(100.1, solarMass)).toBe(false);
      expect(isValidAsteroidBeltDistance(100.1, blueGiantMass)).toBe(false);
    });
  });
});
