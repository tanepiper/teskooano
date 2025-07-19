import { describe, expect, it, beforeEach } from "vitest";
import { ZoneSelector } from "./zone-selector";
import { enhancedCelestialZones } from "./zone-definitions";
import { StellarSystemType, ZoneCategory } from "./types";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";

describe("ZoneSelector", () => {
  let selector: ZoneSelector;
  let mockRandom: () => number;
  let mockSun: any;

  beforeEach(() => {
    mockRandom = () => 0.5; // Default to middle value
    selector = new ZoneSelector(mockRandom);

    // Create a mock Sun-like star
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
  });

  describe("selectZonesForPlacement", () => {
    it("should include guaranteed zones with minBodies > 0", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        enhancedCelestialZones,
        [mockSun],
        config,
      );

      // Should include zones with minBodies > 0
      const guaranteedZones = enhancedCelestialZones.filter(
        (zone) => (zone.minBodies ?? 0) > 0,
      );
      // At least some guaranteed zones should be selected
      const selectedGuaranteedZones = selectedZones.filter((zone) =>
        guaranteedZones.some((guaranteed) => guaranteed.name === zone.name),
      );
      expect(selectedGuaranteedZones.length).toBeGreaterThan(0);
    });

    it("should handle empty adjusted zones array", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        [],
        [mockSun],
        config,
      );

      // Should return default zones when no adjusted zones provided
      expect(selectedZones.length).toBeGreaterThan(0);
      expect(selectedZones[0].name).toBe("Temperate Zone");
    });

    it("should handle null adjusted zones", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        null as any,
        [mockSun],
        config,
      );

      // Should return default zones when null provided
      expect(selectedZones.length).toBeGreaterThan(0);
      expect(selectedZones[0].name).toBe("Temperate Zone");
    });

    it("should add fallback zones when no zones are selected", () => {
      // Create zones with very low formation probabilities
      const lowProbabilityZones = enhancedCelestialZones.map((zone) => ({
        ...zone,
        formationProbability: 0.01, // Very low probability
        minBodies: 0, // No guaranteed zones
      }));

      mockRandom = () => 0.99; // High random value to avoid selection
      selector = new ZoneSelector(mockRandom);

      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        lowProbabilityZones,
        [mockSun],
        config,
      );

      // Should have fallback zones
      expect(selectedZones.length).toBeGreaterThan(0);
    });

    it("should limit total zones to prevent over-generation", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        enhancedCelestialZones,
        [mockSun],
        config,
      );

      // Should be limited to 5-7 zones
      expect(selectedZones.length).toBeLessThanOrEqual(7);
      expect(selectedZones.length).toBeGreaterThanOrEqual(5);
    });

    it("should sort zones by distance", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        enhancedCelestialZones,
        [mockSun],
        config,
      );

      // Zones should be sorted by minAU
      for (let i = 0; i < selectedZones.length - 1; i++) {
        expect(selectedZones[i].minAU).toBeLessThanOrEqual(
          selectedZones[i + 1].minAU,
        );
      }
    });

    it("should prioritize inner zones when trimming", () => {
      // Create many zones to force trimming
      const manyZones = [
        ...enhancedCelestialZones,
        ...enhancedCelestialZones.map((zone, index) => ({
          ...zone,
          name: `${zone.name} Copy ${index}`,
          minAU: zone.minAU + 1000, // Far outer zones
          maxAU: zone.maxAU + 1000,
        })),
      ];

      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        manyZones,
        [mockSun],
        config,
      );

      // Should prioritize inner zones (lower minAU values)
      const maxSelectedAU = Math.max(...selectedZones.map((z) => z.minAU));
      expect(maxSelectedAU).toBeLessThan(100); // Should not include the far outer copies
    });

    it("should apply zone inclusion multipliers correctly", () => {
      // Test with deterministic random to control selection
      let callCount = 0;
      mockRandom = () => {
        callCount++;
        return 0.3; // Low enough to trigger selection for most zones
      };
      selector = new ZoneSelector(mockRandom);

      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        enhancedCelestialZones,
        [mockSun],
        config,
      );

      // Should have selected zones
      expect(selectedZones.length).toBeGreaterThan(0);
    });

    it("should handle single star system", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        enhancedCelestialZones,
        [mockSun],
        config,
      );

      expect(selectedZones.length).toBeGreaterThan(0);
      expect(selectedZones.every((zone) => zone.name)).toBe(true);
    });

    it("should handle binary system", () => {
      const mockCompanion = {
        ...mockSun,
        id: "companion",
        name: "Companion Star",
      };

      const config = { type: StellarSystemType.BINARY_CLOSE, stars: 2 };
      const selectedZones = selector.selectZonesForPlacement(
        enhancedCelestialZones,
        [mockSun, mockCompanion],
        config,
      );

      expect(selectedZones.length).toBeGreaterThan(0);
      expect(selectedZones.every((zone) => zone.name)).toBe(true);
    });

    it("should handle complex multiple star system", () => {
      const mockStars = [
        mockSun,
        { ...mockSun, id: "star2", name: "Star 2" },
        { ...mockSun, id: "star3", name: "Star 3" },
        { ...mockSun, id: "star4", name: "Star 4" },
      ];

      const config = { type: StellarSystemType.MULTIPLE_COMPLEX, stars: 4 };
      const selectedZones = selector.selectZonesForPlacement(
        enhancedCelestialZones,
        mockStars,
        config,
      );

      expect(selectedZones.length).toBeGreaterThan(0);
      expect(selectedZones.every((zone) => zone.name)).toBe(true);
    });
  });

  describe("getZoneForDistance", () => {
    it("should find zone for distance within range", () => {
      // Create zones with actual minAU/maxAU values
      const zonesWithDistances = enhancedCelestialZones.map((zone) => ({
        ...zone,
        minAU: zone.baseMinAU,
        maxAU: zone.baseMaxAU,
      }));

      const zone = selector.getZoneForDistance(zonesWithDistances, 1.0);
      expect(zone).toBeDefined();
      expect(zone?.name).toBe("Temperate Zone");
      expect(1.0).toBeGreaterThanOrEqual(zone!.minAU);
      expect(1.0).toBeLessThan(zone!.maxAU);
    });

    it("should find zone for distance at boundary", () => {
      // Create zones with actual minAU/maxAU values
      const zonesWithDistances = enhancedCelestialZones.map((zone) => ({
        ...zone,
        minAU: zone.baseMinAU,
        maxAU: zone.baseMaxAU,
      }));

      const zone = selector.getZoneForDistance(zonesWithDistances, 0.7);
      expect(zone).toBeDefined();
      expect(zone?.name).toBe("Temperate Zone");
    });

    it("should return undefined for distance outside all zones", () => {
      const zone = selector.getZoneForDistance(enhancedCelestialZones, 10000);
      expect(zone).toBeUndefined();
    });

    it("should return undefined for negative distance", () => {
      const zone = selector.getZoneForDistance(enhancedCelestialZones, -1);
      expect(zone).toBeUndefined();
    });

    it("should handle empty zones array", () => {
      const zone = selector.getZoneForDistance([], 1.0);
      expect(zone).toBeUndefined();
    });

    it("should find correct zone for various distances", () => {
      // Create zones with actual minAU/maxAU values
      const zonesWithDistances = enhancedCelestialZones.map((zone) => ({
        ...zone,
        minAU: zone.baseMinAU,
        maxAU: zone.baseMaxAU,
      }));

      const scorchedZone = selector.getZoneForDistance(zonesWithDistances, 0.2);
      expect(scorchedZone?.name).toBe("Scorched Zone");

      const hotZone = selector.getZoneForDistance(zonesWithDistances, 0.6);
      expect(hotZone?.name).toBe("Hot Inner Zone");

      const temperateZone = selector.getZoneForDistance(
        zonesWithDistances,
        1.2,
      );
      expect(temperateZone?.name).toBe("Temperate Zone");

      const coolZone = selector.getZoneForDistance(zonesWithDistances, 2.5);
      expect(coolZone?.name).toBe("Cool Zone");

      const outerZone = selector.getZoneForDistance(zonesWithDistances, 4.0);
      expect(outerZone?.name).toBe("Outer Gas Zone");
    });
  });

  describe("zone inclusion multipliers", () => {
    it("should apply correct multipliers for different zone categories", () => {
      // This tests the private method indirectly through zone selection
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = selector.selectZonesForPlacement(
        enhancedCelestialZones,
        [mockSun],
        config,
      );

      // Should have a mix of zone categories
      const categories = selectedZones.map((zone) => zone.category);
      expect(categories.length).toBeGreaterThan(0);

      // Should include some inner zones (these have higher inclusion chances)
      const innerZones = selectedZones.filter(
        (zone) =>
          zone.category === ZoneCategory.SCORCHED ||
          zone.category === ZoneCategory.HOT ||
          zone.category === ZoneCategory.TEMPERATE,
      );
      expect(innerZones.length).toBeGreaterThan(0);
    });
  });
});
