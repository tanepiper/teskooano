import { describe, expect, it, beforeEach } from "vitest";
import {
  updateStarPropertiesForBinary,
  updateStarPropertiesForMultiple,
  updateStarPropertiesForContact,
} from "./star-properties";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";

describe("Star Properties Updater", () => {
  let mockPrimaryStar: any;
  let mockCompanionStar: any;
  let mockTertiaryStar: any;

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
        partnerStars: [],
      },
    };

    // Create a mock companion star (K5V)
    mockCompanionStar = {
      id: "companion-star",
      name: "Companion Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 0.7,
      realRadius_m: CONST.SOLAR_RADIUS_M * 0.7,
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
        partnerStars: [],
      },
    };

    // Create a mock tertiary star (M3V)
    mockTertiaryStar = {
      id: "tertiary-star",
      name: "Tertiary Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 0.3,
      realRadius_m: CONST.SOLAR_RADIUS_M * 0.3,
      temperature: 3000,
      properties: {
        type: CelestialType.STAR,
        isMainStar: false,
        spectralClass: "M3V",
        mainSpectralClass: SpectralClass.M,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 0.01,
        color: "#FF6B6B",
        partnerStars: [],
      },
    };
  });

  describe("updateStarPropertiesForBinary", () => {
    it("should set primary and secondary status correctly", () => {
      updateStarPropertiesForBinary(mockPrimaryStar, mockCompanionStar);

      expect(mockPrimaryStar.properties.isMainStar).toBe(true);
      expect(mockCompanionStar.properties.isMainStar).toBe(false);
    });

    it("should link stars with partner references", () => {
      updateStarPropertiesForBinary(mockPrimaryStar, mockCompanionStar);

      expect(mockPrimaryStar.properties.partnerStars).toContain(
        "companion-star",
      );
      expect(mockCompanionStar.properties.partnerStars).toContain(
        "primary-star",
      );
    });

    it("should preserve existing partner stars", () => {
      mockPrimaryStar.properties.partnerStars = ["existing-star"];
      mockCompanionStar.properties.partnerStars = ["another-star"];

      updateStarPropertiesForBinary(mockPrimaryStar, mockCompanionStar);

      expect(mockPrimaryStar.properties.partnerStars).toContain(
        "existing-star",
      );
      expect(mockPrimaryStar.properties.partnerStars).toContain(
        "companion-star",
      );
      expect(mockCompanionStar.properties.partnerStars).toContain(
        "another-star",
      );
      expect(mockCompanionStar.properties.partnerStars).toContain(
        "primary-star",
      );
    });
  });

  describe("updateStarPropertiesForMultiple", () => {
    it("should set tertiary star as non-main", () => {
      updateStarPropertiesForMultiple(mockTertiaryStar, [
        mockPrimaryStar,
        mockCompanionStar,
      ]);

      expect(mockTertiaryStar.properties.isMainStar).toBe(false);
    });

    it("should link tertiary to all companions", () => {
      updateStarPropertiesForMultiple(mockTertiaryStar, [
        mockPrimaryStar,
        mockCompanionStar,
      ]);

      expect(mockTertiaryStar.properties.partnerStars).toContain(
        "primary-star",
      );
      expect(mockTertiaryStar.properties.partnerStars).toContain(
        "companion-star",
      );
    });

    it("should update companions to include tertiary", () => {
      updateStarPropertiesForMultiple(mockTertiaryStar, [
        mockPrimaryStar,
        mockCompanionStar,
      ]);

      expect(mockPrimaryStar.properties.partnerStars).toContain(
        "tertiary-star",
      );
      expect(mockCompanionStar.properties.partnerStars).toContain(
        "tertiary-star",
      );
    });

    it("should handle companions without existing partner stars", () => {
      delete mockPrimaryStar.properties.partnerStars;
      delete mockCompanionStar.properties.partnerStars;

      updateStarPropertiesForMultiple(mockTertiaryStar, [
        mockPrimaryStar,
        mockCompanionStar,
      ]);

      expect(mockPrimaryStar.properties.partnerStars).toContain(
        "tertiary-star",
      );
      expect(mockCompanionStar.properties.partnerStars).toContain(
        "tertiary-star",
      );
    });
  });

  describe("updateStarPropertiesForContact", () => {
    it("should call binary update function", () => {
      const originalLuminosity = mockPrimaryStar.properties.luminosity;

      updateStarPropertiesForContact(
        () => 0.5,
        mockPrimaryStar,
        mockCompanionStar,
      );

      expect(mockPrimaryStar.properties.isMainStar).toBe(true);
      expect(mockCompanionStar.properties.isMainStar).toBe(false);
    });

    it("should enhance luminosity for both stars", () => {
      const primaryOriginalLuminosity = mockPrimaryStar.properties.luminosity;
      const companionOriginalLuminosity =
        mockCompanionStar.properties.luminosity;

      updateStarPropertiesForContact(
        () => 0.5,
        mockPrimaryStar,
        mockCompanionStar,
      );

      expect(mockPrimaryStar.properties.luminosity).toBeGreaterThan(
        primaryOriginalLuminosity,
      );
      expect(mockCompanionStar.properties.luminosity).toBeGreaterThan(
        companionOriginalLuminosity,
      );
    });

    it("should enhance luminosity by up to 20%", () => {
      const primaryOriginalLuminosity = mockPrimaryStar.properties.luminosity;
      const companionOriginalLuminosity =
        mockCompanionStar.properties.luminosity;

      updateStarPropertiesForContact(
        () => 1.0,
        mockPrimaryStar,
        mockCompanionStar,
      ); // Max enhancement

      expect(mockPrimaryStar.properties.luminosity).toBeCloseTo(
        primaryOriginalLuminosity * 1.2,
        2,
      );
      expect(mockCompanionStar.properties.luminosity).toBeCloseTo(
        companionOriginalLuminosity * 1.2,
        2,
      );
    });
  });
});
