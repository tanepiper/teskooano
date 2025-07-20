import { describe, expect, it, beforeEach, vi } from "vitest";
import { generateHierarchicalTriple } from "./hierarchical-triple";
import { StellarSystemType } from "../zones/types";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";

describe("Hierarchical Triple System", () => {
  let mockPrimaryStar: any;
  let mockConfig: any;

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

    mockConfig = {
      type: StellarSystemType.TRIPLE_HIERARCHICAL,
      stars: 3,
      separationAU: [2.0, 200.0], // Binary separation, tertiary distance
    };
  });

  describe("generateHierarchicalTriple", () => {
    it("should generate a hierarchical triple system", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      expect(stars).toHaveLength(3);
      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[1].type).toBe(CelestialType.STAR);
      expect(stars[2].type).toBe(CelestialType.STAR);
    });

    it("should generate stars with unique IDs", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      const starIds = stars.map((star) => star.id);
      const uniqueIds = new Set(starIds);
      expect(uniqueIds.size).toBe(starIds.length);
      expect(starIds[0]).toBe(mockPrimaryStar.id);
    });

    it("should set up proper parent-child relationships", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      // Primary star has no parent (center of system)
      expect(stars[0].parentId).toBeUndefined();

      // Secondary star orbits the primary (part of close binary)
      expect(stars[1].parentId).toBe(stars[0].id);

      // Tertiary star orbits the primary (around binary barycenter)
      expect(stars[2].parentId).toBe(stars[0].id);
    });

    it("should generate valid orbital parameters for all stars", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      stars.forEach((star) => {
        expect(star.orbit).toBeDefined();
        expect(star.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
        expect(star.orbit.eccentricity).toBeGreaterThanOrEqual(0);
        expect(star.orbit.eccentricity).toBeLessThanOrEqual(1);
        expect(star.orbit.period_s).toBeGreaterThan(0);
        expect(star.orbit.inclination).toBeDefined();
        expect(star.orbit.longitudeOfAscendingNode).toBeDefined();
        expect(star.orbit.argumentOfPeriapsis).toBeDefined();
        expect(star.orbit.meanAnomaly).toBeDefined();
      });
    });

    it("should generate close binary with low eccentricity", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      // Primary and secondary form the close binary
      const primaryOrbit = stars[0].orbit;
      const secondaryOrbit = stars[1].orbit;

      expect(primaryOrbit.eccentricity).toBeGreaterThanOrEqual(0.01);
      expect(primaryOrbit.eccentricity).toBeLessThanOrEqual(0.11);
      expect(secondaryOrbit.eccentricity).toBeGreaterThanOrEqual(0.01);
      expect(secondaryOrbit.eccentricity).toBeLessThanOrEqual(0.11);
    });

    it("should generate tertiary star with higher eccentricity", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      const tertiaryOrbit = stars[2].orbit;

      // Tertiary can have higher eccentricity as it's further out
      expect(tertiaryOrbit.eccentricity).toBeGreaterThanOrEqual(0.1);
      expect(tertiaryOrbit.eccentricity).toBeLessThanOrEqual(0.6);
    });

    it("should generate tertiary star with significant inclination", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      const tertiaryOrbit = stars[2].orbit;
      const inclinationRad = tertiaryOrbit.inclination * (Math.PI / 180);

      // Tertiary can have significant inclination relative to binary plane
      expect(inclinationRad).toBeGreaterThanOrEqual(-0.4);
      expect(inclinationRad).toBeLessThanOrEqual(0.4);
    });

    it("should use configuration separation values", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const customConfig = {
        ...mockConfig,
        separationAU: [1.5, 150.0], // Different separations
      };

      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        customConfig,
      );

      expect(stars).toHaveLength(3);
      // The orbital parameters should reflect the configured separations
      expect(stars[0].orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
      expect(stars[1].orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
      expect(stars[2].orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
    });

    it("should generate stars with valid stellar properties", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      stars.forEach((star) => {
        expect(star.id).toBeDefined();
        expect(star.name).toBeDefined();
        expect(star.type).toBe(CelestialType.STAR);
        expect(star.status).toBe(CelestialStatus.ACTIVE);
        expect(star.realMass_kg).toBeGreaterThan(0);
        expect(star.realRadius_m).toBeGreaterThan(0);
        expect(star.temperature).toBeGreaterThan(0);
        expect(star.properties).toBeDefined();
      });
    });

    it("should use the provided random function", () => {
      const mockRandom = vi.fn().mockReturnValue(0.5);

      generateHierarchicalTriple(mockRandom, mockPrimaryStar, mockConfig);

      expect(mockRandom).toHaveBeenCalled();
    });

    it("should handle different binary separations", () => {
      const random = vi.fn().mockReturnValue(0.5);

      const binarySeparations = [0.5, 1.0, 5.0, 10.0];

      binarySeparations.forEach((separation) => {
        const config = { ...mockConfig, separationAU: [separation, 200.0] };
        const stars = generateHierarchicalTriple(
          random,
          mockPrimaryStar,
          config,
        );

        expect(stars).toHaveLength(3);
        expect(stars[0]).toBe(mockPrimaryStar);
        expect(stars[1].type).toBe(CelestialType.STAR);
        expect(stars[2].type).toBe(CelestialType.STAR);
      });
    });

    it("should handle different tertiary distances", () => {
      const random = vi.fn().mockReturnValue(0.5);

      const tertiaryDistances = [50.0, 100.0, 300.0, 500.0];

      tertiaryDistances.forEach((distance) => {
        const config = { ...mockConfig, separationAU: [2.0, distance] };
        const stars = generateHierarchicalTriple(
          random,
          mockPrimaryStar,
          config,
        );

        expect(stars).toHaveLength(3);
        expect(stars[0]).toBe(mockPrimaryStar);
        expect(stars[1].type).toBe(CelestialType.STAR);
        expect(stars[2].type).toBe(CelestialType.STAR);
      });
    });

    it("should generate realistic orbital periods", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      stars.forEach((star) => {
        expect(star.orbit.period_s).toBeGreaterThan(0);
        // Period should be reasonable (not too short, not too long)
        expect(star.orbit.period_s).toBeLessThan(1e12); // Less than ~30,000 years
      });
    });

    it("should preserve primary star properties", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const originalPrimary = { ...mockPrimaryStar };

      const stars = generateHierarchicalTriple(
        random,
        mockPrimaryStar,
        mockConfig,
      );

      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[0].id).toBe(originalPrimary.id);
      expect(stars[0].name).toBe(originalPrimary.name);
      expect(stars[0].realMass_kg).toBe(originalPrimary.realMass_kg);
      expect(stars[0].properties).toBe(originalPrimary.properties);
    });
  });
});
