import { describe, expect, it, beforeEach } from "vitest";
import {
  CelestialZoneManager,
  generateZonesForStar,
} from "./CelestialZoneManager";
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

describe("CelestialZoneManager", () => {
  let manager: CelestialZoneManager;
  let mockRandom: () => number;
  let mockSun: any;
  let mockRedDwarf: any;

  beforeEach(() => {
    mockRandom = () => 0.5; // Default to middle value
    manager = new CelestialZoneManager(mockRandom);

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
  });

  describe("constructor", () => {
    it("should create manager with default zones", () => {
      expect(manager).toBeDefined();
      expect(manager.getAllZones()).toHaveLength(enhancedCelestialZones.length);
    });

    it("should create manager with custom zones", () => {
      const customZones = [enhancedCelestialZones[0]]; // Just one zone
      const customManager = new CelestialZoneManager(mockRandom, customZones);

      expect(customManager.getAllZones()).toHaveLength(1);
      expect(customManager.getAllZones()[0].name).toBe("Scorched Zone");
    });
  });

  describe("createForStar", () => {
    it("should create manager scaled for Sun-like star", () => {
      const scaledManager = CelestialZoneManager.createForStar(
        mockSun,
        mockRandom,
      );

      expect(scaledManager).toBeDefined();
      const zones = scaledManager.getAllZones();
      expect(zones.length).toBe(enhancedCelestialZones.length);

      // Zones should be scaled appropriately for Sun-like star
      const temperateZone = zones.find((z) => z.name === "Temperate Zone");
      expect(temperateZone?.minAU).toBeCloseTo(0.7, 1);
      expect(temperateZone?.maxAU).toBeCloseTo(1.5, 1);
    });

    it("should create manager scaled for red dwarf", () => {
      const scaledManager = CelestialZoneManager.createForStar(
        mockRedDwarf,
        mockRandom,
      );

      expect(scaledManager).toBeDefined();
      const zones = scaledManager.getAllZones();

      // Zones should be much closer for red dwarf
      const temperateZone = zones.find((z) => z.name === "Temperate Zone");
      expect(temperateZone?.minAU).toBeLessThan(0.1);
      expect(temperateZone?.maxAU).toBeLessThan(0.5);
    });

    it("should scale zones based on stellar properties", () => {
      const sunManager = CelestialZoneManager.createForStar(
        mockSun,
        mockRandom,
      );
      const redDwarfManager = CelestialZoneManager.createForStar(
        mockRedDwarf,
        mockRandom,
      );

      const sunZones = sunManager.getAllZones();
      const redDwarfZones = redDwarfManager.getAllZones();

      // Red dwarf zones should be much closer than Sun zones
      const sunTemperate = sunZones.find((z) => z.name === "Temperate Zone");
      const redDwarfTemperate = redDwarfZones.find(
        (z) => z.name === "Temperate Zone",
      );

      expect(redDwarfTemperate?.minAU).toBeLessThan(sunTemperate?.minAU || 0);
      expect(redDwarfTemperate?.maxAU).toBeLessThan(sunTemperate?.maxAU || 0);
    });
  });

  describe("determineStellarConfiguration", () => {
    it("should determine single star configuration", () => {
      mockRandom = () => 0.7; // Should result in SINGLE_STAR
      manager = new CelestialZoneManager(mockRandom);

      const config = manager.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.SINGLE_STAR);
      expect(config.stars).toBe(1);
    });

    it("should determine binary configuration", () => {
      mockRandom = () => 0.3; // Should result in BINARY_CLOSE
      manager = new CelestialZoneManager(mockRandom);

      const config = manager.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.BINARY_CLOSE);
      expect(config.stars).toBe(2);
    });

    it("should determine multiple star configuration", () => {
      mockRandom = () => 0.99; // Should result in MULTIPLE_COMPLEX
      manager = new CelestialZoneManager(mockRandom);

      const config = manager.determineStellarConfiguration();

      expect(config.type).toBe(StellarSystemType.MULTIPLE_COMPLEX);
      expect(config.stars).toBeGreaterThanOrEqual(4);
      expect(config.stars).toBeLessThanOrEqual(6);
    });
  });

  describe("getAdjustedZones", () => {
    it("should return zones adjusted for single star", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const adjustedZones = manager.getAdjustedZones([mockSun], config);

      expect(adjustedZones.length).toBe(enhancedCelestialZones.length);

      // Zones should be scaled for the star
      const temperateZone = adjustedZones.find(
        (z) => z.name === "Temperate Zone",
      );
      expect(temperateZone?.minAU).toBeCloseTo(0.7, 1);
      expect(temperateZone?.maxAU).toBeCloseTo(1.5, 1);
    });

    it("should return zones adjusted for binary system", () => {
      const config = { type: StellarSystemType.BINARY_CLOSE, stars: 2 };
      const adjustedZones = manager.getAdjustedZones(
        [mockSun, mockRedDwarf],
        config,
      );

      expect(adjustedZones.length).toBe(enhancedCelestialZones.length);

      // Formation probability should be reduced for binary system
      const temperateZone = adjustedZones.find(
        (z) => z.name === "Temperate Zone",
      );
      expect(temperateZone?.formationProbability).toBeLessThan(0.9); // Original is 0.9
    });

    it("should handle empty stars array", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const adjustedZones = manager.getAdjustedZones([], config);

      expect(adjustedZones).toEqual(enhancedCelestialZones);
    });
  });

  describe("selectZonesForPlacement", () => {
    it("should select zones for single star system", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = manager.selectZonesForPlacement([mockSun], config);

      expect(selectedZones.length).toBeGreaterThan(0);
      expect(selectedZones.length).toBeLessThanOrEqual(7);
      expect(selectedZones.every((zone) => zone.name)).toBe(true);
    });

    it("should select zones for binary system", () => {
      const config = { type: StellarSystemType.BINARY_CLOSE, stars: 2 };
      const selectedZones = manager.selectZonesForPlacement(
        [mockSun, mockRedDwarf],
        config,
      );

      expect(selectedZones.length).toBeGreaterThan(0);
      expect(selectedZones.length).toBeLessThanOrEqual(7);
      expect(selectedZones.every((zone) => zone.name)).toBe(true);
    });

    it("should include guaranteed zones", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = manager.selectZonesForPlacement([mockSun], config);

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

    it("should sort zones by distance", () => {
      const config = { type: StellarSystemType.SINGLE_STAR, stars: 1 };
      const selectedZones = manager.selectZonesForPlacement([mockSun], config);

      for (let i = 0; i < selectedZones.length - 1; i++) {
        expect(selectedZones[i].minAU).toBeLessThanOrEqual(
          selectedZones[i + 1].minAU,
        );
      }
    });
  });

  describe("getAllZones", () => {
    it("should return all zones", () => {
      const zones = manager.getAllZones();

      expect(zones.length).toBe(enhancedCelestialZones.length);
      expect(zones.map((z) => z.name)).toEqual(
        enhancedCelestialZones.map((z) => z.name),
      );
    });

    it("should return a copy of zones", () => {
      const zones = manager.getAllZones();
      const originalZones = manager.getAllZones();

      // Modifying the returned array should not affect the original
      zones[0] = { ...zones[0], name: "Modified Zone" };

      expect(originalZones[0].name).toBe(enhancedCelestialZones[0].name);
      expect(zones[0].name).toBe("Modified Zone");
    });
  });

  describe("getZoneForDistance", () => {
    it("should find zone for distance within range", () => {
      // Create a manager with zones that have actual minAU/maxAU values
      const zonesWithDistances = manager.getAllZones().map((zone) => ({
        ...zone,
        minAU: zone.baseMinAU,
        maxAU: zone.baseMaxAU,
      }));

      // Create a temporary manager with the zones that have distances
      const tempManager = new CelestialZoneManager(
        mockRandom,
        zonesWithDistances,
      );
      const zone = tempManager.getZoneForDistance(1.0);

      expect(zone).toBeDefined();
      expect(zone?.name).toBe("Temperate Zone");
      expect(1.0).toBeGreaterThanOrEqual(zone!.minAU);
      expect(1.0).toBeLessThan(zone!.maxAU);
    });

    it("should return undefined for distance outside all zones", () => {
      const zone = manager.getZoneForDistance(10000);
      expect(zone).toBeUndefined();
    });

    it("should find correct zones for various distances", () => {
      // Create a manager with zones that have actual minAU/maxAU values
      const zonesWithDistances = manager.getAllZones().map((zone) => ({
        ...zone,
        minAU: zone.baseMinAU,
        maxAU: zone.baseMaxAU,
      }));

      // Create a temporary manager with the zones that have distances
      const tempManager = new CelestialZoneManager(
        mockRandom,
        zonesWithDistances,
      );

      const scorchedZone = tempManager.getZoneForDistance(0.2);
      expect(scorchedZone?.name).toBe("Scorched Zone");

      const hotZone = tempManager.getZoneForDistance(0.6);
      expect(hotZone?.name).toBe("Hot Inner Zone");

      const temperateZone = tempManager.getZoneForDistance(1.2);
      expect(temperateZone?.name).toBe("Temperate Zone");

      const coolZone = tempManager.getZoneForDistance(2.5);
      expect(coolZone?.name).toBe("Cool Zone");

      const outerZone = tempManager.getZoneForDistance(4.0);
      expect(outerZone?.name).toBe("Outer Gas Zone");
    });
  });

  describe("createStarSpecificZones", () => {
    it("should create star-specific zones for Sun", () => {
      const zones = CelestialZoneManager.createStarSpecificZones(
        mockSun,
        mockRandom,
      );

      expect(zones.length).toBeGreaterThan(0);
      expect(zones.some((zone) => zone.name === "Temperate Zone")).toBe(true);
    });

    it("should create star-specific zones for red dwarf", () => {
      const zones = CelestialZoneManager.createStarSpecificZones(
        mockRedDwarf,
        mockRandom,
      );

      expect(zones.length).toBeGreaterThan(0);

      // Red dwarf zones should be much closer
      const temperateZone = zones.find(
        (zone) => zone.name === "Temperate Zone",
      );
      expect(temperateZone?.minAU).toBeLessThan(0.1);
      expect(temperateZone?.maxAU).toBeLessThan(0.5);
    });

    it("should create different zones for different star types", () => {
      const sunZones = CelestialZoneManager.createStarSpecificZones(
        mockSun,
        mockRandom,
      );
      const redDwarfZones = CelestialZoneManager.createStarSpecificZones(
        mockRedDwarf,
        mockRandom,
      );

      const sunTemperate = sunZones.find((z) => z.name === "Temperate Zone");
      const redDwarfTemperate = redDwarfZones.find(
        (z) => z.name === "Temperate Zone",
      );

      expect(redDwarfTemperate?.minAU).toBeLessThan(sunTemperate?.minAU || 0);
      expect(redDwarfTemperate?.maxAU).toBeLessThan(sunTemperate?.maxAU || 0);
    });
  });

  describe("generateZonesForStar", () => {
    it("should generate zones for a star", () => {
      const zones = generateZonesForStar(mockRandom, mockSun);

      expect(zones.length).toBeGreaterThan(0);
      expect(zones.every((zone) => zone.name)).toBe(true);
    });

    it("should generate different zones for different stars", () => {
      const sunZones = generateZonesForStar(mockRandom, mockSun);
      const redDwarfZones = generateZonesForStar(mockRandom, mockRedDwarf);

      expect(sunZones.length).toBeGreaterThan(0);
      expect(redDwarfZones.length).toBeGreaterThan(0);

      // Zones should be different due to different stellar properties
      const sunTemperate = sunZones.find((z) => z.name === "Temperate Zone");
      const redDwarfTemperate = redDwarfZones.find(
        (z) => z.name === "Temperate Zone",
      );

      if (sunTemperate && redDwarfTemperate) {
        expect(sunTemperate.minAU).not.toBe(redDwarfTemperate.minAU);
        expect(sunTemperate.maxAU).not.toBe(redDwarfTemperate.maxAU);
      }
    });

    it("should generate zones with valid properties", () => {
      const zones = generateZonesForStar(mockRandom, mockSun);

      zones.forEach((zone) => {
        expect(zone.name).toBeTruthy();
        expect(zone.category).toBeDefined();
        expect(zone.minAU).toBeGreaterThan(0);
        expect(zone.maxAU).toBeGreaterThan(zone.minAU);
        expect(zone.allowedPlanetTypes.length).toBeGreaterThan(0);
        expect(zone.allowedGasGiantClasses.length).toBeGreaterThan(0);
        expect(zone.formationProbability).toBeGreaterThanOrEqual(0);
        expect(zone.formationProbability).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("integration tests", () => {
    it("should handle complete zone generation workflow", () => {
      // Test the complete workflow from star to selected zones
      const config = manager.determineStellarConfiguration();
      const adjustedZones = manager.getAdjustedZones([mockSun], config);
      const selectedZones = manager.selectZonesForPlacement([mockSun], config);

      expect(config).toBeDefined();
      expect(adjustedZones.length).toBe(enhancedCelestialZones.length);
      expect(selectedZones.length).toBeGreaterThan(0);
      expect(selectedZones.length).toBeLessThanOrEqual(7);
    });

    it("should handle binary system workflow", () => {
      mockRandom = () => 0.3; // Force binary configuration
      manager = new CelestialZoneManager(mockRandom);

      const config = manager.determineStellarConfiguration();
      const adjustedZones = manager.getAdjustedZones(
        [mockSun, mockRedDwarf],
        config,
      );
      const selectedZones = manager.selectZonesForPlacement(
        [mockSun, mockRedDwarf],
        config,
      );

      expect(config.type).toBe(StellarSystemType.BINARY_CLOSE);
      expect(config.stars).toBe(2);
      expect(adjustedZones.length).toBe(enhancedCelestialZones.length);
      expect(selectedZones.length).toBeGreaterThan(0);
    });

    it("should handle multiple star system workflow", () => {
      mockRandom = () => 0.99; // Force multiple star configuration
      manager = new CelestialZoneManager(mockRandom);

      const mockStars = [
        mockSun,
        mockRedDwarf,
        { ...mockSun, id: "star3" },
        { ...mockSun, id: "star4" },
      ];
      const config = manager.determineStellarConfiguration();
      const adjustedZones = manager.getAdjustedZones(mockStars, config);
      const selectedZones = manager.selectZonesForPlacement(mockStars, config);

      expect(config.type).toBe(StellarSystemType.MULTIPLE_COMPLEX);
      expect(config.stars).toBeGreaterThanOrEqual(4);
      expect(adjustedZones.length).toBe(enhancedCelestialZones.length);
      expect(selectedZones.length).toBeGreaterThan(0);
    });
  });
});
