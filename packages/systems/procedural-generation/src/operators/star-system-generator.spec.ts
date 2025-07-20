import { describe, expect, it, beforeEach } from "vitest";
import { generateStellarSystem } from "./star-system-generator";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import { StellarSystemType } from "../zones/types";
import * as CONST from "../constants";

describe("Star System Generator", () => {
  let mockPrimaryStar: any;

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
  });

  describe("generateStellarSystem", () => {
    it("should generate single star system", () => {
      const config = {
        type: StellarSystemType.SINGLE_STAR,
        stars: 1,
        separationAU: undefined,
      };

      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      expect(stars).toHaveLength(1);
      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[0].parentId).toBeUndefined();
    });

    it("should generate close binary system", () => {
      const config = {
        type: StellarSystemType.BINARY_CLOSE,
        stars: 2,
        separationAU: [1.0],
      };

      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      expect(stars).toHaveLength(2);
      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[1].type).toBe(CelestialType.STAR);
      expect(stars[1].id).not.toBe(mockPrimaryStar.id);
    });

    it("should generate wide binary system", () => {
      const config = {
        type: StellarSystemType.BINARY_WIDE,
        stars: 2,
        separationAU: [50.0],
      };

      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      expect(stars).toHaveLength(2);
      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[1].type).toBe(CelestialType.STAR);
      expect(stars[1].id).not.toBe(mockPrimaryStar.id);
    });

    it("should generate hierarchical triple system", () => {
      const config = {
        type: StellarSystemType.TRIPLE_HIERARCHICAL,
        stars: 3,
        separationAU: [2.0, 200.0],
      };

      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      expect(stars).toHaveLength(3);
      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[1].type).toBe(CelestialType.STAR);
      expect(stars[2].type).toBe(CelestialType.STAR);
      expect(stars[1].id).not.toBe(mockPrimaryStar.id);
      expect(stars[2].id).not.toBe(mockPrimaryStar.id);
      expect(stars[1].id).not.toBe(stars[2].id);
    });

    it("should generate complex multiple star system", () => {
      const config = {
        type: StellarSystemType.MULTIPLE_COMPLEX,
        stars: 4,
        separationAU: undefined,
      };

      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      expect(stars).toHaveLength(4);
      expect(stars[0]).toBe(mockPrimaryStar);

      // Check that additional stars are generated
      for (let i = 1; i < stars.length; i++) {
        expect(stars[i].type).toBe(CelestialType.STAR);
        expect(stars[i].id).not.toBe(mockPrimaryStar.id);
        expect(stars[i].parentId).toBe(mockPrimaryStar.id);
      }

      // Check that all stars have unique IDs
      const starIds = stars.map((star) => star.id);
      const uniqueIds = new Set(starIds);
      expect(uniqueIds.size).toBe(starIds.length);
    });

    it("should handle unknown system type gracefully", () => {
      const config = {
        type: "UNKNOWN_TYPE" as any,
        stars: 1,
        separationAU: undefined,
      };

      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      expect(stars).toHaveLength(1);
      expect(stars[0]).toBe(mockPrimaryStar);
    });

    it("should use random function for separation calculations", () => {
      const config = {
        type: StellarSystemType.BINARY_CLOSE,
        stars: 2,
        separationAU: [1.0],
      };

      // Test with different random values
      const stars1 = generateStellarSystem(() => 0.0, mockPrimaryStar, config);
      const stars2 = generateStellarSystem(() => 1.0, mockPrimaryStar, config);

      expect(stars1).toHaveLength(2);
      expect(stars2).toHaveLength(2);
      expect(stars1[1].id).not.toBe(stars2[1].id); // Different stars generated
    });

    it("should generate stars with valid properties", () => {
      const config = {
        type: StellarSystemType.BINARY_CLOSE,
        stars: 2,
        separationAU: [1.0],
      };

      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      // Check that generated stars have required properties
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

    it("should handle complex multiple system with different star counts", () => {
      const config = {
        type: StellarSystemType.MULTIPLE_COMPLEX,
        stars: 6,
        separationAU: undefined,
      };

      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      expect(stars).toHaveLength(6);
      expect(stars[0]).toBe(mockPrimaryStar);

      // All additional stars should orbit the primary
      for (let i = 1; i < stars.length; i++) {
        expect(stars[i].parentId).toBe(mockPrimaryStar.id);
      }
    });

    it("should preserve primary star properties", () => {
      const config = {
        type: StellarSystemType.BINARY_CLOSE,
        stars: 2,
        separationAU: [1.0],
      };

      const originalPrimary = { ...mockPrimaryStar };
      const stars = generateStellarSystem(() => 0.5, mockPrimaryStar, config);

      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[0].id).toBe(originalPrimary.id);
      expect(stars[0].name).toBe(originalPrimary.name);
      expect(stars[0].realMass_kg).toBe(originalPrimary.realMass_kg);
      expect(stars[0].properties).toBe(originalPrimary.properties);
    });
  });
});
