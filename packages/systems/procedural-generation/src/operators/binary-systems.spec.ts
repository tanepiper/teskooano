import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  generateCloseBinary,
  generateWideBinary,
  generateContactBinary,
} from "./binary-systems";
import { StellarSystemType } from "../zones/types";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";

describe("Binary Systems", () => {
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
      type: StellarSystemType.BINARY_CLOSE,
      stars: 2,
      separationAU: [1.0],
    };
  });

  describe("generateCloseBinary", () => {
    it("should generate a close binary system", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateCloseBinary(random, mockPrimaryStar, mockConfig);

      expect(stars).toHaveLength(2);
      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[1].type).toBe(CelestialType.STAR);
      expect(stars[1].id).not.toBe(mockPrimaryStar.id);
    });

    it("should generate stars with valid orbital parameters", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateCloseBinary(random, mockPrimaryStar, mockConfig);

      stars.forEach((star) => {
        expect(star.orbit).toBeDefined();
        expect(star.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
        expect(star.orbit.eccentricity).toBeGreaterThanOrEqual(0);
        expect(star.orbit.eccentricity).toBeLessThanOrEqual(1);
        expect(star.orbit.period_s).toBeGreaterThan(0);
      });
    });

    it("should set up proper parent-child relationships", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateCloseBinary(random, mockPrimaryStar, mockConfig);

      expect(stars[0].parentId).toBeUndefined(); // Primary has no parent
      expect(stars[1].parentId).toBe(stars[0].id); // Companion orbits primary
    });

    it("should generate low eccentricity orbits for stability", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateCloseBinary(random, mockPrimaryStar, mockConfig);

      stars.forEach((star) => {
        expect(star.orbit.eccentricity).toBeGreaterThanOrEqual(0.01);
        expect(star.orbit.eccentricity).toBeLessThanOrEqual(0.06);
      });
    });

    it("should handle stability validation", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const unstableConfig = { ...mockConfig, separationAU: [0.001] }; // Very close separation

      const stars = generateCloseBinary(
        random,
        mockPrimaryStar,
        unstableConfig,
      );

      expect(stars).toHaveLength(2);
      // Should still generate stars even if initial separation was unstable
    });
  });

  describe("generateWideBinary", () => {
    it("should generate a wide binary system", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const wideConfig = { ...mockConfig, separationAU: [50.0] };
      const stars = generateWideBinary(random, mockPrimaryStar, wideConfig);

      expect(stars).toHaveLength(2);
      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[1].type).toBe(CelestialType.STAR);
      expect(stars[1].id).not.toBe(mockPrimaryStar.id);
    });

    it("should generate higher eccentricity orbits for wide binaries", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const wideConfig = { ...mockConfig, separationAU: [50.0] };
      const stars = generateWideBinary(random, mockPrimaryStar, wideConfig);

      stars.forEach((star) => {
        expect(star.orbit.eccentricity).toBeGreaterThanOrEqual(0.05);
        expect(star.orbit.eccentricity).toBeLessThanOrEqual(0.45);
      });
    });

    it("should generate larger inclination ranges for wide binaries", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const wideConfig = { ...mockConfig, separationAU: [50.0] };
      const stars = generateWideBinary(random, mockPrimaryStar, wideConfig);

      stars.forEach((star) => {
        const inclinationRad = star.orbit.inclination * (Math.PI / 180);
        expect(inclinationRad).toBeGreaterThanOrEqual(-0.15);
        expect(inclinationRad).toBeLessThanOrEqual(0.15);
      });
    });
  });

  describe("generateContactBinary", () => {
    it("should generate a contact binary system", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const contactConfig = { ...mockConfig, separationAU: [0.1] };
      const stars = generateContactBinary(
        random,
        mockPrimaryStar,
        contactConfig,
      );

      expect(stars).toHaveLength(2);
      expect(stars[0]).toBe(mockPrimaryStar);
      expect(stars[1].type).toBe(CelestialType.STAR);
      expect(stars[1].id).not.toBe(mockPrimaryStar.id);
    });

    it("should generate extremely low eccentricity orbits for contact binaries", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const contactConfig = { ...mockConfig, separationAU: [0.1] };
      const stars = generateContactBinary(
        random,
        mockPrimaryStar,
        contactConfig,
      );

      stars.forEach((star) => {
        expect(star.orbit.eccentricity).toBeGreaterThanOrEqual(0.001);
        expect(star.orbit.eccentricity).toBeLessThanOrEqual(0.006);
      });
    });

    it("should generate extremely small inclination for contact binaries", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const contactConfig = { ...mockConfig, separationAU: [0.1] };
      const stars = generateContactBinary(
        random,
        mockPrimaryStar,
        contactConfig,
      );

      stars.forEach((star) => {
        const inclinationRad = star.orbit.inclination * (Math.PI / 180);
        expect(inclinationRad).toBeGreaterThanOrEqual(-0.005);
        expect(inclinationRad).toBeLessThanOrEqual(0.005);
      });
    });

    it("should handle stability validation for contact binaries", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const unstableConfig = { ...mockConfig, separationAU: [0.001] }; // Very close separation

      const stars = generateContactBinary(
        random,
        mockPrimaryStar,
        unstableConfig,
      );

      expect(stars).toHaveLength(2);
      // Should still generate stars even if initial separation was unstable
    });
  });

  describe("Common Binary Properties", () => {
    it("should generate stars with unique IDs", () => {
      const random = vi.fn().mockReturnValue(0.5);

      const closeStars = generateCloseBinary(
        random,
        mockPrimaryStar,
        mockConfig,
      );
      const wideStars = generateWideBinary(random, mockPrimaryStar, {
        ...mockConfig,
        separationAU: [50.0],
      });
      const contactStars = generateContactBinary(random, mockPrimaryStar, {
        ...mockConfig,
        separationAU: [0.1],
      });

      [closeStars, wideStars, contactStars].forEach((stars) => {
        const starIds = stars.map((star) => star.id);
        const uniqueIds = new Set(starIds);
        expect(uniqueIds.size).toBe(starIds.length);
      });
    });

    it("should generate stars with valid stellar properties", () => {
      const random = vi.fn().mockReturnValue(0.5);
      const stars = generateCloseBinary(random, mockPrimaryStar, mockConfig);

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

      generateCloseBinary(mockRandom, mockPrimaryStar, mockConfig);

      expect(mockRandom).toHaveBeenCalled();
    });

    it("should handle different separation values", () => {
      const random = vi.fn().mockReturnValue(0.5);

      const separations = [0.5, 1.0, 10.0, 100.0];

      separations.forEach((separation) => {
        const config = { ...mockConfig, separationAU: [separation] };
        const stars = generateCloseBinary(random, mockPrimaryStar, config);

        expect(stars).toHaveLength(2);
        expect(stars[0]).toBe(mockPrimaryStar);
        expect(stars[1].type).toBe(CelestialType.STAR);
      });
    });
  });
});
