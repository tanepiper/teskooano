import { describe, expect, it } from "vitest";
import {
  OrbitalConfiguration,
  StellarSystemType,
  ZoneCategory,
  type CelestialZone,
  type StellarSystemConfiguration,
} from "./types";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
} from "@teskooano/data-types";

describe("Zone Types", () => {
  describe("OrbitalConfiguration", () => {
    it("should have all expected orbital configurations", () => {
      expect(OrbitalConfiguration.STANDARD).toBe("STANDARD");
      expect(OrbitalConfiguration.BINARY_PAIR).toBe("BINARY_PAIR");
      expect(OrbitalConfiguration.TROJAN).toBe("TROJAN");
      expect(OrbitalConfiguration.CO_ORBITAL).toBe("CO_ORBITAL");
      expect(OrbitalConfiguration.ROGUE).toBe("ROGUE");
      expect(OrbitalConfiguration.CIRCUMBINARY).toBe("CIRCUMBINARY");
    });

    it("should have unique values", () => {
      const values = Object.values(OrbitalConfiguration);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("StellarSystemType", () => {
    it("should have all expected stellar system types", () => {
      expect(StellarSystemType.SINGLE_STAR).toBe("SINGLE_STAR");
      expect(StellarSystemType.BINARY_CLOSE).toBe("BINARY_CLOSE");
      expect(StellarSystemType.BINARY_WIDE).toBe("BINARY_WIDE");
      expect(StellarSystemType.TRIPLE_HIERARCHICAL).toBe("TRIPLE_HIERARCHICAL");
      expect(StellarSystemType.MULTIPLE_COMPLEX).toBe("MULTIPLE_COMPLEX");
    });

    it("should have unique values", () => {
      const values = Object.values(StellarSystemType);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("ZoneCategory", () => {
    it("should have all expected zone categories", () => {
      expect(ZoneCategory.SCORCHED).toBe("SCORCHED");
      expect(ZoneCategory.HOT).toBe("HOT");
      expect(ZoneCategory.TEMPERATE).toBe("TEMPERATE");
      expect(ZoneCategory.COOL).toBe("COOL");
      expect(ZoneCategory.COLD).toBe("COLD");
      expect(ZoneCategory.FROZEN).toBe("FROZEN");
      expect(ZoneCategory.OUTER).toBe("OUTER");
      expect(ZoneCategory.DISTANT).toBe("DISTANT");
      expect(ZoneCategory.INTERSTELLAR).toBe("INTERSTELLAR");
    });

    it("should have unique values", () => {
      const values = Object.values(ZoneCategory);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("CelestialZone interface", () => {
    it("should allow creation of valid zone objects", () => {
      const zone: CelestialZone = {
        name: "Test Zone",
        category: ZoneCategory.TEMPERATE,
        baseMinAU: 0.8,
        baseMaxAU: 2.0,
        minAU: 0.8,
        maxAU: 2.0,
        temperatureRange: { min: 200, max: 400 },
        allowedPlanetTypes: [PlanetType.TERRESTRIAL, PlanetType.OCEAN],
        allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
        cometChance: 0.0,
        asteroidBeltChance: 0.1,
        formationProbability: 0.8,
        specialConfigurations: [OrbitalConfiguration.STANDARD],
        maxBodies: 3,
        minBodies: 1,
      };

      expect(zone.name).toBe("Test Zone");
      expect(zone.category).toBe(ZoneCategory.TEMPERATE);
      expect(zone.allowedPlanetTypes).toContain(PlanetType.TERRESTRIAL);
      expect(zone.specialConfigurations).toContain(
        OrbitalConfiguration.STANDARD,
      );
    });

    it("should allow optional minBodies property", () => {
      const zone: CelestialZone = {
        name: "Optional Zone",
        category: ZoneCategory.INTERSTELLAR,
        baseMinAU: 1000.0,
        baseMaxAU: 5000.0,
        minAU: 1000.0,
        maxAU: 5000.0,
        temperatureRange: { min: 2, max: 10 },
        allowedPlanetTypes: [PlanetType.ICE],
        allowedGasGiantClasses: [GasGiantClass.CLASS_III],
        cometChance: 0.25,
        asteroidBeltChance: 0.1,
        formationProbability: 0.4,
        specialConfigurations: [OrbitalConfiguration.ROGUE],
        maxBodies: 2,
        // minBodies is optional
      };

      expect(zone.minBodies).toBeUndefined();
      expect(zone.maxBodies).toBe(2);
    });
  });

  describe("StellarSystemConfiguration interface", () => {
    it("should allow creation of single star configuration", () => {
      const config: StellarSystemConfiguration = {
        type: StellarSystemType.SINGLE_STAR,
        stars: 1,
        systemName: "Test Star",
        description: "A funny description of the system",
      };

      expect(config.type).toBe(StellarSystemType.SINGLE_STAR);
      expect(config.stars).toBe(1);
      expect(config.systemName).toBe("Test Star");
      expect(config.description).toBe("A funny description of the system");
    });

    it("should allow creation of binary system configuration", () => {
      const config: StellarSystemConfiguration = {
        type: StellarSystemType.BINARY_CLOSE,
        stars: 2,
        separationAU: [0.5, 2.0],
        supportsCircumbinaryPlanets: true,
        systemName: "Binary System",
        description: "A dramatic binary system description",
      };

      expect(config.type).toBe(StellarSystemType.BINARY_CLOSE);
      expect(config.stars).toBe(2);
      expect(config.separationAU).toEqual([0.5, 2.0]);
      expect(config.supportsCircumbinaryPlanets).toBe(true);
      expect(config.systemName).toBe("Binary System");
      expect(config.description).toBe("A dramatic binary system description");
    });

    it("should allow creation of complex multiple star configuration", () => {
      const config: StellarSystemConfiguration = {
        type: StellarSystemType.MULTIPLE_COMPLEX,
        stars: 5,
        separationAU: [0.5, 2.0, 10.0, 50.0],
        supportsCircumbinaryPlanets: false,
        systemName: "Complex System",
        description: "A chaotic multiple star system",
      };

      expect(config.type).toBe(StellarSystemType.MULTIPLE_COMPLEX);
      expect(config.stars).toBe(5);
      expect(config.separationAU).toHaveLength(4);
      expect(config.systemName).toBe("Complex System");
      expect(config.description).toBe("A chaotic multiple star system");
    });
  });
});
