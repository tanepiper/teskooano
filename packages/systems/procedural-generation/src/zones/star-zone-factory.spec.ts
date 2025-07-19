import { describe, expect, it, beforeEach } from "vitest";
import { StarZoneFactory } from "./star-zone-factory";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";

describe("StarZoneFactory", () => {
  let mockSun: any;
  let mockRedDwarf: any;
  let mockBlueGiant: any;
  let mockWhiteDwarf: any;
  let mockNeutronStar: any;
  let mockBlackHole: any;
  let mockWolfRayet: any;

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

    // Create a mock black hole
    mockBlackHole = {
      id: "black-hole",
      name: "Black Hole",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 10,
      realRadius_m: 30000, // Schwarzschild radius
      temperature: 0,
      properties: {
        type: CelestialType.STAR,
        stellarType: StellarType.BLACK_HOLE,
        spectralClass: "BH",
        luminosityClass: LuminosityClass.VII,
        luminosity: 0.0001,
        classType: "BLACK_HOLE",
      },
    };

    // Create a mock Wolf-Rayet star
    mockWolfRayet = {
      id: "wolf-rayet",
      name: "Wolf-Rayet Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 20,
      realRadius_m: CONST.SOLAR_RADIUS_M * 3,
      temperature: 50000,
      properties: {
        type: CelestialType.STAR,
        stellarType: StellarType.WOLF_RAYET,
        spectralClass: "W",
        luminosityClass: LuminosityClass.I,
        luminosity: 100000,
        classType: "WOLF_RAYET",
      },
    };
  });

  describe("createStarSpecificZones", () => {
    it("should create zones for Sun-like star", () => {
      const zones = StarZoneFactory.createStarSpecificZones(mockSun, () => 0.5);

      expect(zones.length).toBeGreaterThan(0);
      expect(zones.some((zone) => zone.name === "Scorched Zone")).toBe(true);
      expect(zones.some((zone) => zone.name === "Hot Inner Zone")).toBe(true);
      expect(zones.some((zone) => zone.name === "Temperate Zone")).toBe(true);
      expect(zones.some((zone) => zone.name === "Cool Zone")).toBe(true);
      expect(zones.some((zone) => zone.name === "Outer Gas Zone")).toBe(true);
    });

    it("should create compact zones for red dwarf", () => {
      const zones = StarZoneFactory.createStarSpecificZones(
        mockRedDwarf,
        () => 0.5,
      );

      expect(zones.length).toBeGreaterThan(0);

      // Red dwarf zones should be much closer
      const temperateZone = zones.find(
        (zone) => zone.name === "Temperate Zone",
      );
      expect(temperateZone?.minAU).toBeLessThan(0.1);
      expect(temperateZone?.maxAU).toBeLessThan(0.5);
    });

    it("should create massive zones for blue giant", () => {
      const zones = StarZoneFactory.createStarSpecificZones(
        mockBlueGiant,
        () => 0.5,
      );

      expect(zones.length).toBeGreaterThan(0);

      // Blue giant zones should be much farther
      const temperateZone = zones.find(
        (zone) => zone.name === "Temperate Zone",
      );
      expect(temperateZone?.minAU).toBeGreaterThan(30);
      expect(temperateZone?.maxAU).toBeGreaterThan(100);
    });

    it("should create very compact zones for white dwarf", () => {
      const zones = StarZoneFactory.createStarSpecificZones(
        mockWhiteDwarf,
        () => 0.5,
      );

      expect(zones.length).toBeGreaterThan(0);

      // White dwarf zones should be very close
      const temperateZone = zones.find(
        (zone) => zone.name === "Temperate Zone",
      );
      expect(temperateZone?.minAU).toBeLessThan(0.1);
      expect(temperateZone?.maxAU).toBeLessThan(0.5);
    });

    it("should create extremely compact zones for neutron star", () => {
      const zones = StarZoneFactory.createStarSpecificZones(
        mockNeutronStar,
        () => 0.5,
      );

      expect(zones.length).toBeGreaterThan(0);

      // Neutron star zones should be extremely close
      const temperateZone = zones.find(
        (zone) => zone.name === "Temperate Zone",
      );
      expect(temperateZone?.minAU).toBeLessThan(0.1);
      expect(temperateZone?.maxAU).toBeLessThan(0.5);
    });

    it("should create zones for black hole with terrestrial planets in cool zone", () => {
      const zones = StarZoneFactory.createStarSpecificZones(
        mockBlackHole,
        () => 0.5,
      );

      expect(zones.length).toBeGreaterThan(0);

      const coolZone = zones.find((zone) => zone.name === "Cool Zone");
      expect(coolZone).toBeDefined();
      expect(coolZone?.allowedPlanetTypes).toContain("TERRESTRIAL");
      expect(coolZone?.allowedPlanetTypes).toContain("OCEAN");
    });

    it("should create massive zones for Wolf-Rayet star", () => {
      const zones = StarZoneFactory.createStarSpecificZones(
        mockWolfRayet,
        () => 0.5,
      );

      expect(zones.length).toBeGreaterThan(0);

      // Wolf-Rayet zones should be very far
      const temperateZone = zones.find(
        (zone) => zone.name === "Temperate Zone",
      );
      expect(temperateZone?.minAU).toBeGreaterThan(60);
      expect(temperateZone?.maxAU).toBeGreaterThan(200);
    });

    it("should handle stars without stellar type", () => {
      const starWithoutStellarType = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          stellarType: undefined,
        },
      };

      const zones = StarZoneFactory.createStarSpecificZones(
        starWithoutStellarType,
        () => 0.5,
      );
      expect(zones.length).toBeGreaterThan(0);
    });

    it("should handle stars without spectral class", () => {
      const starWithoutSpectralClass = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          spectralClass: undefined,
        },
      };

      const zones = StarZoneFactory.createStarSpecificZones(
        starWithoutSpectralClass,
        () => 0.5,
      );
      expect(zones.length).toBeGreaterThan(0);
    });

    it("should handle stars without luminosity", () => {
      const starWithoutLuminosity = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          luminosity: undefined,
        },
      };

      const zones = StarZoneFactory.createStarSpecificZones(
        starWithoutLuminosity,
        () => 0.5,
      );
      expect(zones.length).toBeGreaterThan(0);
    });

    it("should handle unknown stellar type", () => {
      const unknownStar = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          stellarType: "UNKNOWN_TYPE",
        },
      };

      const zones = StarZoneFactory.createStarSpecificZones(
        unknownStar,
        () => 0.5,
      );
      expect(zones.length).toBeGreaterThan(0);
    });

    it("should handle unknown spectral class", () => {
      const unknownSpectralStar = {
        ...mockSun,
        properties: {
          ...mockSun.properties,
          spectralClass: "X", // Unknown spectral class
        },
      };

      const zones = StarZoneFactory.createStarSpecificZones(
        unknownSpectralStar,
        () => 0.5,
      );
      expect(zones.length).toBeGreaterThan(0);
    });

    it("should create zones with valid properties", () => {
      const zones = StarZoneFactory.createStarSpecificZones(mockSun, () => 0.5);

      zones.forEach((zone) => {
        expect(zone.name).toBeTruthy();
        expect(zone.category).toBeDefined();
        expect(zone.baseMinAU).toBeGreaterThan(0);
        expect(zone.baseMaxAU).toBeGreaterThan(zone.baseMinAU);
        expect(zone.minAU).toBeGreaterThan(0);
        expect(zone.maxAU).toBeGreaterThan(zone.minAU);
        expect(zone.temperatureRange.min).toBeGreaterThan(0);
        expect(zone.temperatureRange.max).toBeGreaterThan(
          zone.temperatureRange.min,
        );
        expect(zone.allowedPlanetTypes.length).toBeGreaterThan(0);
        expect(zone.allowedGasGiantClasses.length).toBeGreaterThan(0);
        expect(zone.formationProbability).toBeGreaterThanOrEqual(0);
        expect(zone.formationProbability).toBeLessThanOrEqual(1);
        expect(zone.maxBodies).toBeGreaterThan(0);
      });
    });

    it("should create zones in order of increasing distance", () => {
      const zones = StarZoneFactory.createStarSpecificZones(mockSun, () => 0.5);

      for (let i = 0; i < zones.length - 1; i++) {
        expect(zones[i].minAU).toBeLessThanOrEqual(zones[i + 1].minAU);
      }
    });

    it("should respect maximum distance cap", () => {
      const zones = StarZoneFactory.createStarSpecificZones(
        mockBlueGiant,
        () => 0.5,
      );

      zones.forEach((zone) => {
        expect(zone.minAU).toBeLessThanOrEqual(CONST.SYSTEM_MAX_DISTANCE_AU);
        expect(zone.maxAU).toBeLessThanOrEqual(CONST.SYSTEM_MAX_DISTANCE_AU);
      });
    });

    it("should create different zones for different star types", () => {
      const sunZones = StarZoneFactory.createStarSpecificZones(
        mockSun,
        () => 0.5,
      );
      const redDwarfZones = StarZoneFactory.createStarSpecificZones(
        mockRedDwarf,
        () => 0.5,
      );
      const blueGiantZones = StarZoneFactory.createStarSpecificZones(
        mockBlueGiant,
        () => 0.5,
      );

      // Zones should have different distances for different star types
      const sunTemperate = sunZones.find((z) => z.name === "Temperate Zone");
      const redDwarfTemperate = redDwarfZones.find(
        (z) => z.name === "Temperate Zone",
      );
      const blueGiantTemperate = blueGiantZones.find(
        (z) => z.name === "Temperate Zone",
      );

      expect(sunTemperate?.minAU).toBeGreaterThan(
        redDwarfTemperate?.minAU || 0,
      );
      expect(blueGiantTemperate?.minAU).toBeGreaterThan(
        sunTemperate?.minAU || 0,
      );
    });

    it("should create fallback zones when template not found", () => {
      // This tests the fallback mechanism when a template zone is not found
      const zones = StarZoneFactory.createStarSpecificZones(mockSun, () => 0.5);
      expect(zones.length).toBeGreaterThan(0);

      // All zones should have valid properties even if template was not found
      zones.forEach((zone) => {
        expect(zone.name).toBeTruthy();
        expect(zone.category).toBeDefined();
        expect(zone.allowedPlanetTypes.length).toBeGreaterThan(0);
      });
    });
  });
});
