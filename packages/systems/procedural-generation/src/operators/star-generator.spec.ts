import { describe, expect, it, vi } from "vitest";
import { generateStars } from "./star-generator";
import { StellarSystemType } from "../zones/types";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";

describe("Star Generator", () => {
  describe("generateStars", () => {
    it("should generate stars with system configuration", () => {
      const random = vi
        .fn()
        .mockReturnValueOnce(0.1) // For stellar system config (BINARY_CLOSE)
        .mockReturnValueOnce(0.5) // For star generation
        .mockReturnValueOnce(0.5); // For binary setup

      const result = generateStars(random);

      expect(result.stars).toBeDefined();
      expect(result.stars.length).toBeGreaterThan(0);
      expect(result.systemConfig).toBeDefined();
      expect(result.systemConfig.type).toBeDefined();
      expect(result.systemConfig.stars).toBeDefined();
    });

    it("should generate primary star with valid properties", () => {
      const random = vi
        .fn()
        .mockReturnValueOnce(0.1) // For stellar system config
        .mockReturnValueOnce(0.5) // For star generation
        .mockReturnValueOnce(0.5); // For binary setup

      const result = generateStars(random);
      const primaryStar = result.stars[0];

      expect(primaryStar.id).toBeDefined();
      expect(primaryStar.name).toBeDefined();
      expect(primaryStar.type).toBe(CelestialType.STAR);
      expect(primaryStar.status).toBe(CelestialStatus.ACTIVE);
      expect(primaryStar.realMass_kg).toBeGreaterThan(0);
      expect(primaryStar.realRadius_m).toBeGreaterThan(0);
      expect(primaryStar.temperature).toBeGreaterThan(0);
      expect(primaryStar.properties).toBeDefined();
    });

    it("should generate different system types based on random values", () => {
      // Test single star system
      const singleStarRandom = vi
        .fn()
        .mockReturnValueOnce(0.5) // For stellar system config (SINGLE_STAR)
        .mockReturnValueOnce(0.5); // For star generation

      const singleResult = generateStars(singleStarRandom);
      expect(singleResult.stars).toHaveLength(1);
      expect(singleResult.systemConfig.type).toBe(
        StellarSystemType.SINGLE_STAR,
      );

      // Test binary system
      const binaryRandom = vi
        .fn()
        .mockReturnValueOnce(0.1) // For stellar system config (BINARY_CLOSE)
        .mockReturnValueOnce(0.5) // For star generation
        .mockReturnValueOnce(0.5); // For binary setup

      const binaryResult = generateStars(binaryRandom);
      expect(binaryResult.stars.length).toBeGreaterThanOrEqual(2);
      expect(binaryResult.systemConfig.type).toBe(
        StellarSystemType.BINARY_CLOSE,
      );
    });

    it("should generate multiple stars for complex systems", () => {
      const random = vi
        .fn()
        .mockReturnValueOnce(0.99) // For stellar system config (MULTIPLE_COMPLEX)
        .mockReturnValueOnce(0.5) // For star generation
        .mockReturnValueOnce(0.5) // For additional stars
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);

      const result = generateStars(random);

      expect(result.stars.length).toBeGreaterThanOrEqual(4);
      expect(result.systemConfig.type).toBe(StellarSystemType.MULTIPLE_COMPLEX);

      // All stars should have valid properties
      result.stars.forEach((star) => {
        expect(star.type).toBe(CelestialType.STAR);
        expect(star.status).toBe(CelestialStatus.ACTIVE);
        expect(star.realMass_kg).toBeGreaterThan(0);
        expect(star.realRadius_m).toBeGreaterThan(0);
        expect(star.temperature).toBeGreaterThan(0);
      });
    });

    it("should generate hierarchical triple systems", () => {
      const random = vi
        .fn()
        .mockReturnValueOnce(0.95) // For stellar system config (TRIPLE_HIERARCHICAL)
        .mockReturnValueOnce(0.5) // For star generation
        .mockReturnValueOnce(0.5) // For binary setup
        .mockReturnValueOnce(0.5); // For tertiary star

      const result = generateStars(random);

      expect(result.stars).toHaveLength(3);
      expect(result.systemConfig.type).toBe(
        StellarSystemType.TRIPLE_HIERARCHICAL,
      );

      // Check that all stars have unique IDs
      const starIds = result.stars.map((star) => star.id);
      const uniqueIds = new Set(starIds);
      expect(uniqueIds.size).toBe(starIds.length);
    });

    it("should use the provided random function consistently", () => {
      const mockRandom = vi.fn().mockReturnValue(0.5);

      generateStars(mockRandom);

      // Should be called multiple times for star generation and system setup
      expect(mockRandom).toHaveBeenCalledTimes(expect.any(Number));
      expect(mockRandom).toHaveBeenCalledWith();
    });

    it("should generate stars with realistic stellar properties", () => {
      const random = vi
        .fn()
        .mockReturnValueOnce(0.5) // For stellar system config
        .mockReturnValueOnce(0.5) // For star generation
        .mockReturnValueOnce(0.5); // For binary setup

      const result = generateStars(random);

      result.stars.forEach((star) => {
        const props = star.properties as any;

        // Check for required stellar properties
        expect(props.spectralClass).toBeDefined();
        expect(props.mainSpectralClass).toBeDefined();
        expect(props.luminosityClass).toBeDefined();
        expect(props.stellarType).toBeDefined();
        expect(props.luminosity).toBeGreaterThan(0);
        expect(props.color).toBeDefined();

        // Check for valid spectral class
        expect(Object.values(SpectralClass)).toContain(props.mainSpectralClass);
        expect(Object.values(LuminosityClass)).toContain(props.luminosityClass);
        expect(Object.values(StellarType)).toContain(props.stellarType);
      });
    });

    it("should handle edge case random values", () => {
      // Test with minimum random value
      const minRandom = vi.fn().mockReturnValue(0.0);
      const minResult = generateStars(minRandom);
      expect(minResult.stars).toBeDefined();
      expect(minResult.stars.length).toBeGreaterThan(0);

      // Test with maximum random value
      const maxRandom = vi.fn().mockReturnValue(1.0);
      const maxResult = generateStars(maxRandom);
      expect(maxResult.stars).toBeDefined();
      expect(maxResult.stars.length).toBeGreaterThan(0);
    });

    it("should generate deterministic results with same random function", () => {
      const random1 = vi.fn().mockReturnValue(0.5);
      const random2 = vi.fn().mockReturnValue(0.5);

      const result1 = generateStars(random1);
      const result2 = generateStars(random2);

      // Should generate the same system type
      expect(result1.systemConfig.type).toBe(result2.systemConfig.type);
      expect(result1.systemConfig.stars).toBe(result2.systemConfig.stars);

      // Should generate the same number of stars
      expect(result1.stars.length).toBe(result2.stars.length);
    });

    it("should generate different results with different random functions", () => {
      const random1 = vi.fn().mockReturnValue(0.1); // BINARY_CLOSE
      const random2 = vi.fn().mockReturnValue(0.5); // SINGLE_STAR

      const result1 = generateStars(random1);
      const result2 = generateStars(random2);

      // Should generate different system types
      expect(result1.systemConfig.type).not.toBe(result2.systemConfig.type);
    });
  });
});
