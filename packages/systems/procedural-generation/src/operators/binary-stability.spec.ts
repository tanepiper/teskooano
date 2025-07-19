import { describe, expect, it, beforeEach } from "vitest";
import { calculateBinaryStability } from "./binary-stability";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";

describe("Binary Stability Calculator", () => {
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

  describe("calculateBinaryStability", () => {
    it("should validate stable close binary separation", () => {
      const separationAU = 1.0; // 1 AU separation
      const result = calculateBinaryStability(
        mockPrimaryStar,
        mockCompanionStar,
        separationAU,
      );

      expect(result.isStable).toBe(true);
      expect(result.minSeparationAU).toBeGreaterThan(0);
      expect(result.recommendedSeparationAU).toBeGreaterThanOrEqual(
        result.minSeparationAU,
      );
      expect(result.warnings).toHaveLength(0);
    });

    it("should detect unstable separation below minimum", () => {
      const separationAU = 0.001; // Very close separation
      const result = calculateBinaryStability(
        mockPrimaryStar,
        mockCompanionStar,
        separationAU,
      );

      expect(result.isStable).toBe(false);
      expect(
        result.warnings.some((warning) => warning.includes("Stars too close")),
      ).toBe(true);
    });

    it("should detect Roche limit violations", () => {
      const separationAU = 0.01; // Close enough to trigger Roche limit warning
      const result = calculateBinaryStability(
        mockPrimaryStar,
        mockCompanionStar,
        separationAU,
      );

      expect(result.isStable).toBe(false);
      expect(
        result.warnings.some((warning) =>
          warning.includes("Within Roche limit"),
        ),
      ).toBe(true);
    });

    it("should warn about close binaries requiring smaller timesteps", () => {
      const separationAU = 0.5; // Close binary
      const result = calculateBinaryStability(
        mockPrimaryStar,
        mockCompanionStar,
        separationAU,
      );

      expect(result.isStable).toBe(true);
      expect(
        result.warnings.some((warning) =>
          warning.includes("Close binary detected"),
        ),
      ).toBe(true);
    });

    it("should handle massive stars correctly", () => {
      const massivePrimary = {
        ...mockPrimaryStar,
        realMass_kg: CONST.SOLAR_MASS_KG * 20, // 20 solar masses
        realRadius_m: CONST.SOLAR_RADIUS_M * 10, // 10 solar radii
      };

      const massiveCompanion = {
        ...mockCompanionStar,
        realMass_kg: CONST.SOLAR_MASS_KG * 15, // 15 solar masses
        realRadius_m: CONST.SOLAR_RADIUS_M * 8, // 8 solar radii
      };

      const separationAU = 5.0;
      const result = calculateBinaryStability(
        massivePrimary,
        massiveCompanion,
        separationAU,
      );

      expect(result.isStable).toBe(true);
      expect(result.minSeparationAU).toBeGreaterThan(0);
      expect(result.recommendedSeparationAU).toBeGreaterThanOrEqual(
        result.minSeparationAU,
      );
    });

    it("should provide reasonable recommended separations", () => {
      const separationAU = 0.1; // Unstable separation
      const result = calculateBinaryStability(
        mockPrimaryStar,
        mockCompanionStar,
        separationAU,
      );

      expect(result.recommendedSeparationAU).toBeGreaterThan(
        result.minSeparationAU,
      );
      expect(result.recommendedSeparationAU).toBeGreaterThanOrEqual(0.5); // At least 0.5 AU
    });
  });
});
