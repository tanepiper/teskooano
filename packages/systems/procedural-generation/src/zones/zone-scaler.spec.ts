import { describe, expect, it, beforeEach } from "vitest";
import { ZoneScaler } from "./zone-scaler";
import { enhancedCelestialZones } from "./zone-definitions";
import { StellarSystemType } from "./types";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";

describe("ZoneScaler", () => {
  let mockSun: any;
  let mockRedDwarf: any;
  let mockBlueGiant: any;
  let mockWhiteDwarf: any;
  let mockNeutronStar: any;

  beforeEach(() => {
    // Create a mock Sun-like star (G2V)
    mockSun = {
      id: "sun",
      name: "Sun",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG,
      realRadius_m: CONST.SOLAR_RADIUS_M,
      temperature: 5778,
      properties: {
        type: CelestialType.STAR,
        stellarType: StellarType.MAIN_SEQUENCE,
        spectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        luminosity: 1.0,
        classType: "MAIN_SEQUENCE",
      },
    };

    // Create a mock red dwarf (M5V)
    mockRedDwarf = {
      id: "red-dwarf",
      name: "Red Dwarf",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 0.1,
      realRadius_m: CONST.SOLAR_RADIUS_M * 0.15,
      temperature: 2800,
      properties: {
        type: CelestialType.STAR,
        stellarType: StellarType.MAIN_SEQUENCE,
        spectralClass: SpectralClass.M,
        luminosityClass: LuminosityClass.V,
        luminosity: 0.004,
        classType: "MAIN_SEQUENCE",
      },
    };

    // Create a mock blue giant (O5V)
    mockBlueGiant = {
      id: "blue-giant",
      name: "Blue Giant",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 40,
      realRadius_m: CONST.SOLAR_RADIUS_M * 12,
      temperature: 40000,
      properties: {
        type: CelestialType.STAR,
        stellarType: StellarType.MAIN_SEQUENCE,
        spectralClass: SpectralClass.O,
        luminosityClass: LuminosityClass.V,
        luminosity: 280000,
        classType: "MAIN_SEQUENCE",
      },
    };

    // Create a mock white dwarf
    mockWhiteDwarf = {
      id: "white-dwarf",
      name: "White Dwarf",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 0.6,
      realRadius_m: CONST.SOLAR_RADIUS_M * 0.01,
      temperature: 15000,
      properties: {
        type: CelestialType.STAR,
        stellarType: StellarType.WHITE_DWARF,
        spectralClass: "D",
        luminosityClass: LuminosityClass.VII,
        luminosity: 0.01,
        classType: "WHITE_DWARF",
      },
    };

    // Create a mock neutron star
    mockNeutronStar = {
      id: "neutron-star",
      name: "Neutron Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 1.4,
      realRadius_m: 12000, // 12 km
      temperature: 1000000,
      properties: {
        type: CelestialType.STAR,
        stellarType: StellarType.NEUTRON_STAR,
        spectralClass: "P", // Pulsar
        luminosityClass: LuminosityClass.VII,
        luminosity: 0.001,
        classType: "NEUTRON_STAR",
      },
    };
  });

  describe("calculateScalingFactor", () => {
    it("should return 1.0 for Sun-like star", () => {
      const scalingFactor = ZoneScaler.calculateScalingFactor(mockSun);
      expect(scalingFactor).toBeCloseTo(1.0, 1);
    });

    it("should return small scaling factor for red dwarf", () => {
      const scalingFactor = ZoneScaler.calculateScalingFactor(mockRedDwarf);
      // Red dwarf: √0.004 * 0.3 = 0.063 * 0.3 = 0.019, but capped at 0.1
      expect(scalingFactor).toBeCloseTo(0.1, 1);
    });

    it("should return large scaling factor for blue giant", () => {
      const scalingFactor = ZoneScaler.calculateScalingFactor(mockBlueGiant);
      // Blue giant: √280000 * 3.0 = 529 * 3.0 = 1587, but capped at 5.0
      expect(scalingFactor).toBe(5.0); // Should be capped
    });

    it("should return very small scaling factor for white dwarf", () => {
      const scalingFactor = ZoneScaler.calculateScalingFactor(mockWhiteDwarf);
      // White dwarf: √0.01 * 0.1 = 0.1 * 0.1 = 0.01, but capped at 0.1
      expect(scalingFactor).toBeCloseTo(0.1, 1);
    });

    it("should return very small scaling factor for neutron star", () => {
      const scalingFactor = ZoneScaler.calculateScalingFactor(mockNeutronStar);
      // Neutron star: √0.001 * 0.05 = 0.032 * 0.05 = 0.0016, but minimum is 0.1
      expect(scalingFactor).toBe(0.1); // Should be minimum
    });

    it("should handle stars without luminosity property", () => {
      const starWithoutLuminosity = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          luminosity: undefined,
        },
      };

      const scalingFactor = ZoneScaler.calculateScalingFactor(
        starWithoutLuminosity,
      );
      // Should fall back to mass-based calculation: √1.0^3.5 = 1.0
      expect(scalingFactor).toBeCloseTo(1.0, 1);
    });

    it("should handle stars without stellar type", () => {
      const starWithoutStellarType = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          stellarType: undefined,
        },
      };

      const scalingFactor = ZoneScaler.calculateScalingFactor(
        starWithoutStellarType,
      );
      // Should use default stellar type multiplier of 1.0
      expect(scalingFactor).toBeCloseTo(1.0, 1);
    });

    it("should handle stars without spectral class", () => {
      const starWithoutSpectralClass = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          spectralClass: undefined,
        },
      };

      const scalingFactor = ZoneScaler.calculateScalingFactor(
        starWithoutSpectralClass,
      );
      // Should use default spectral class multiplier of 1.0
      expect(scalingFactor).toBeCloseTo(1.0, 1);
    });

    it("should respect minimum scaling factor", () => {
      const veryDimStar = {
        ...mockRedDwarf,
        properties: {
          ...mockRedDwarf.properties,
          luminosity: 0.0001, // Very dim
        },
      };

      const scalingFactor = ZoneScaler.calculateScalingFactor(veryDimStar);
      expect(scalingFactor).toBe(0.1); // Should be minimum
    });

    it("should respect maximum scaling factor", () => {
      const veryBrightStar = {
        ...mockBlueGiant,
        properties: {
          ...mockBlueGiant.properties,
          luminosity: 1000000, // Very bright
        },
      };

      const scalingFactor = ZoneScaler.calculateScalingFactor(veryBrightStar);
      expect(scalingFactor).toBe(5.0); // Should be maximum
    });
  });

  describe("calculateCombinedLuminosity", () => {
    it("should calculate combined luminosity for single star", () => {
      const combinedLuminosity = ZoneScaler.calculateCombinedLuminosity([
        mockSun,
      ]);
      expect(combinedLuminosity).toBe(1.0);
    });

    it("should calculate combined luminosity for multiple stars", () => {
      const combinedLuminosity = ZoneScaler.calculateCombinedLuminosity([
        mockSun,
        mockRedDwarf,
      ]);
      expect(combinedLuminosity).toBeCloseTo(1.004, 3);
    });

    it("should handle stars without luminosity property", () => {
      const starWithoutLuminosity = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          luminosity: undefined,
        },
      };

      const combinedLuminosity = ZoneScaler.calculateCombinedLuminosity([
        starWithoutLuminosity,
      ]);
      // Should fall back to mass-based calculation: 1.0^3.5 = 1.0
      expect(combinedLuminosity).toBeCloseTo(1.0, 1);
    });

    it("should return 0 for empty array", () => {
      const combinedLuminosity = ZoneScaler.calculateCombinedLuminosity([]);
      expect(combinedLuminosity).toBe(0);
    });
  });

  describe("getComplexityFactor", () => {
    it("should return 1.0 for single star", () => {
      const factor = ZoneScaler.getComplexityFactor({
        type: StellarSystemType.SINGLE_STAR,
        stars: 1,
      });
      expect(factor).toBe(1.0);
    });

    it("should return 0.8 for close binary", () => {
      const factor = ZoneScaler.getComplexityFactor({
        type: StellarSystemType.BINARY_CLOSE,
        stars: 2,
      });
      expect(factor).toBe(0.8);
    });

    it("should return 1.1 for wide binary", () => {
      const factor = ZoneScaler.getComplexityFactor({
        type: StellarSystemType.BINARY_WIDE,
        stars: 2,
      });
      expect(factor).toBe(1.1);
    });

    it("should return 0.9 for hierarchical triple", () => {
      const factor = ZoneScaler.getComplexityFactor({
        type: StellarSystemType.TRIPLE_HIERARCHICAL,
        stars: 3,
      });
      expect(factor).toBe(0.9);
    });

    it("should return 0.7 for complex multiple", () => {
      const factor = ZoneScaler.getComplexityFactor({
        type: StellarSystemType.MULTIPLE_COMPLEX,
        stars: 4,
      });
      expect(factor).toBe(0.7);
    });

    it("should return 1.0 for unknown type", () => {
      const factor = ZoneScaler.getComplexityFactor({
        type: "UNKNOWN" as any,
        stars: 1,
      });
      expect(factor).toBe(1.0);
    });
  });

  describe("scaleZones", () => {
    it("should scale zones for single star", () => {
      const scaledZones = ZoneScaler.scaleZones(
        enhancedCelestialZones,
        [mockSun],
        { type: StellarSystemType.SINGLE_STAR, stars: 1 },
      );

      expect(scaledZones).toHaveLength(enhancedCelestialZones.length);

      // Check that zones are scaled appropriately
      const temperateZone = scaledZones.find(
        (z) => z.name === "Temperate Zone",
      );
      expect(temperateZone?.minAU).toBeCloseTo(0.7, 1);
      expect(temperateZone?.maxAU).toBeCloseTo(1.5, 1);
      expect(temperateZone?.formationProbability).toBeCloseTo(0.9, 1);
    });

    it("should scale zones for red dwarf", () => {
      const scaledZones = ZoneScaler.scaleZones(
        enhancedCelestialZones,
        [mockRedDwarf],
        { type: StellarSystemType.SINGLE_STAR, stars: 1 },
      );

      const temperateZone = scaledZones.find(
        (z) => z.name === "Temperate Zone",
      );
      // Red dwarf scaling: should be scaled down significantly
      expect(temperateZone?.minAU).toBeLessThan(0.7);
      expect(temperateZone?.maxAU).toBeLessThan(1.5);
      expect(temperateZone?.minAU).toBeGreaterThan(0);
      expect(temperateZone?.maxAU).toBeGreaterThan(temperateZone?.minAU || 0);
    });

    it("should scale zones for binary system", () => {
      const scaledZones = ZoneScaler.scaleZones(
        enhancedCelestialZones,
        [mockSun, mockRedDwarf],
        { type: StellarSystemType.BINARY_CLOSE, stars: 2 },
      );

      const temperateZone = scaledZones.find(
        (z) => z.name === "Temperate Zone",
      );
      // Combined luminosity: 1.004, complexity: 0.8, scaling: √(1.004 * 0.8) = √0.8032 = 0.896
      expect(temperateZone?.minAU).toBeCloseTo(0.7 * 0.896, 2);
      expect(temperateZone?.maxAU).toBeCloseTo(1.5 * 0.896, 2);
      expect(temperateZone?.formationProbability).toBeCloseTo(0.9 * 0.8, 1);
    });

    it("should handle empty stars array", () => {
      const scaledZones = ZoneScaler.scaleZones(enhancedCelestialZones, [], {
        type: StellarSystemType.SINGLE_STAR,
        stars: 1,
      });

      expect(scaledZones).toEqual(enhancedCelestialZones);
    });

    it("should respect maximum distance cap", () => {
      const scaledZones = ZoneScaler.scaleZones(
        enhancedCelestialZones,
        [mockBlueGiant],
        { type: StellarSystemType.SINGLE_STAR, stars: 1 },
      );

      // All zones should be capped at SYSTEM_MAX_DISTANCE_AU
      scaledZones.forEach((zone) => {
        expect(zone.minAU).toBeLessThanOrEqual(CONST.SYSTEM_MAX_DISTANCE_AU);
        expect(zone.maxAU).toBeLessThanOrEqual(CONST.SYSTEM_MAX_DISTANCE_AU);
      });
    });

    it("should preserve zone order", () => {
      const scaledZones = ZoneScaler.scaleZones(
        enhancedCelestialZones,
        [mockSun],
        { type: StellarSystemType.SINGLE_STAR, stars: 1 },
      );

      for (let i = 0; i < scaledZones.length - 1; i++) {
        expect(scaledZones[i].name).toBe(enhancedCelestialZones[i].name);
        expect(scaledZones[i].category).toBe(
          enhancedCelestialZones[i].category,
        );
      }
    });

    it("should scale formation probabilities correctly", () => {
      const scaledZones = ZoneScaler.scaleZones(
        enhancedCelestialZones,
        [mockSun, mockSun], // Two sun-like stars
        { type: StellarSystemType.BINARY_WIDE, stars: 2 },
      );

      const temperateZone = scaledZones.find(
        (z) => z.name === "Temperate Zone",
      );
      // Combined luminosity: 2.0, complexity: 1.1, scaling: √(2.0 * 1.1) = √2.2 = 1.48
      // Original probability: 0.9, new probability: 0.9 * 1.1 = 0.99
      expect(temperateZone?.formationProbability).toBeCloseTo(0.99, 2);
    });
  });
});
