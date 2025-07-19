import { describe, expect, it } from "vitest";
import {
  enhancedCelestialZones,
  createDefaultTemperateZone,
  createDefaultZones,
} from "./zone-definitions";
import { ZoneCategory, OrbitalConfiguration } from "./types";
import { GasGiantClass, PlanetType } from "@teskooano/data-types";

describe("Zone Definitions", () => {
  describe("enhancedCelestialZones", () => {
    it("should have all expected zones", () => {
      const zoneNames = enhancedCelestialZones.map((zone) => zone.name);
      expect(zoneNames).toContain("Scorched Zone");
      expect(zoneNames).toContain("Hot Inner Zone");
      expect(zoneNames).toContain("Temperate Zone");
      expect(zoneNames).toContain("Cool Zone");
      expect(zoneNames).toContain("Outer Gas Zone");
      expect(zoneNames).toContain("Frozen Outer Zone");
      expect(zoneNames).toContain("Outer Zone");
      expect(zoneNames).toContain("Distant Zone");
      expect(zoneNames).toContain("Interstellar Zone");
    });

    it("should have zones in order of increasing distance", () => {
      for (let i = 0; i < enhancedCelestialZones.length - 1; i++) {
        const currentZone = enhancedCelestialZones[i];
        const nextZone = enhancedCelestialZones[i + 1];
        expect(currentZone.baseMinAU).toBeLessThan(nextZone.baseMinAU);
      }
    });

    it("should have valid temperature ranges", () => {
      enhancedCelestialZones.forEach((zone) => {
        expect(zone.temperatureRange.min).toBeGreaterThan(0);
        expect(zone.temperatureRange.max).toBeGreaterThan(
          zone.temperatureRange.min,
        );
      });
    });

    it("should have valid formation probabilities", () => {
      enhancedCelestialZones.forEach((zone) => {
        expect(zone.formationProbability).toBeGreaterThanOrEqual(0);
        expect(zone.formationProbability).toBeLessThanOrEqual(1);
      });
    });

    it("should have valid body counts", () => {
      enhancedCelestialZones.forEach((zone) => {
        expect(zone.maxBodies).toBeGreaterThan(0);
        if (zone.minBodies !== undefined) {
          expect(zone.minBodies).toBeGreaterThanOrEqual(0);
          expect(zone.minBodies).toBeLessThanOrEqual(zone.maxBodies);
        }
      });
    });

    it("should have valid chance values", () => {
      enhancedCelestialZones.forEach((zone) => {
        expect(zone.cometChance).toBeGreaterThanOrEqual(0);
        expect(zone.cometChance).toBeLessThanOrEqual(1);
        expect(zone.asteroidBeltChance).toBeGreaterThanOrEqual(0);
        expect(zone.asteroidBeltChance).toBeLessThanOrEqual(1);
      });
    });

    it("should have at least one allowed planet type per zone", () => {
      enhancedCelestialZones.forEach((zone) => {
        expect(zone.allowedPlanetTypes.length).toBeGreaterThan(0);
      });
    });

    it("should have at least one allowed gas giant class per zone", () => {
      enhancedCelestialZones.forEach((zone) => {
        expect(zone.allowedGasGiantClasses.length).toBeGreaterThan(0);
      });
    });

    it("should have at least one special configuration per zone", () => {
      enhancedCelestialZones.forEach((zone) => {
        expect(zone.specialConfigurations.length).toBeGreaterThan(0);
      });
    });

    it("should have unique zone names", () => {
      const names = enhancedCelestialZones.map((zone) => zone.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("should have proper zone categories", () => {
      const scorchedZone = enhancedCelestialZones.find(
        (z) => z.name === "Scorched Zone",
      );
      expect(scorchedZone?.category).toBe(ZoneCategory.SCORCHED);

      const hotZone = enhancedCelestialZones.find(
        (z) => z.name === "Hot Inner Zone",
      );
      expect(hotZone?.category).toBe(ZoneCategory.HOT);

      const temperateZone = enhancedCelestialZones.find(
        (z) => z.name === "Temperate Zone",
      );
      expect(temperateZone?.category).toBe(ZoneCategory.TEMPERATE);

      const coolZone = enhancedCelestialZones.find(
        (z) => z.name === "Cool Zone",
      );
      expect(coolZone?.category).toBe(ZoneCategory.COOL);

      const coldZone = enhancedCelestialZones.find(
        (z) => z.name === "Outer Gas Zone",
      );
      expect(coldZone?.category).toBe(ZoneCategory.COLD);

      const frozenZone = enhancedCelestialZones.find(
        (z) => z.name === "Frozen Outer Zone",
      );
      expect(frozenZone?.category).toBe(ZoneCategory.FROZEN);

      const outerZone = enhancedCelestialZones.find(
        (z) => z.name === "Outer Zone",
      );
      expect(outerZone?.category).toBe(ZoneCategory.OUTER);

      const distantZone = enhancedCelestialZones.find(
        (z) => z.name === "Distant Zone",
      );
      expect(distantZone?.category).toBe(ZoneCategory.DISTANT);

      const interstellarZone = enhancedCelestialZones.find(
        (z) => z.name === "Interstellar Zone",
      );
      expect(interstellarZone?.category).toBe(ZoneCategory.INTERSTELLAR);
    });

    it("should have appropriate planet types for each zone", () => {
      const scorchedZone = enhancedCelestialZones.find(
        (z) => z.name === "Scorched Zone",
      );
      expect(scorchedZone?.allowedPlanetTypes).toContain(PlanetType.LAVA);
      expect(scorchedZone?.allowedPlanetTypes).toContain(PlanetType.ROCKY);

      const temperateZone = enhancedCelestialZones.find(
        (z) => z.name === "Temperate Zone",
      );
      expect(temperateZone?.allowedPlanetTypes).toContain(
        PlanetType.TERRESTRIAL,
      );
      expect(temperateZone?.allowedPlanetTypes).toContain(PlanetType.OCEAN);

      const coolZone = enhancedCelestialZones.find(
        (z) => z.name === "Cool Zone",
      );
      expect(coolZone?.allowedPlanetTypes).toContain(PlanetType.ICE);

      const outerZone = enhancedCelestialZones.find(
        (z) => z.name === "Outer Gas Zone",
      );
      expect(outerZone?.allowedPlanetTypes).toContain(PlanetType.ICE);
    });

    it("should have appropriate gas giant classes for each zone", () => {
      const scorchedZone = enhancedCelestialZones.find(
        (z) => z.name === "Scorched Zone",
      );
      expect(scorchedZone?.allowedGasGiantClasses).toContain(
        GasGiantClass.CLASS_IV,
      );
      expect(scorchedZone?.allowedGasGiantClasses).toContain(
        GasGiantClass.CLASS_V,
      );

      const temperateZone = enhancedCelestialZones.find(
        (z) => z.name === "Temperate Zone",
      );
      expect(temperateZone?.allowedGasGiantClasses).toContain(
        GasGiantClass.CLASS_III,
      );
      expect(temperateZone?.allowedGasGiantClasses).toContain(
        GasGiantClass.CLASS_IV,
      );
      expect(temperateZone?.allowedGasGiantClasses).toContain(
        GasGiantClass.CLASS_V,
      );

      const coolZone = enhancedCelestialZones.find(
        (z) => z.name === "Cool Zone",
      );
      expect(coolZone?.allowedGasGiantClasses).toContain(GasGiantClass.CLASS_I);
      expect(coolZone?.allowedGasGiantClasses).toContain(
        GasGiantClass.CLASS_II,
      );
      expect(coolZone?.allowedGasGiantClasses).toContain(
        GasGiantClass.CLASS_III,
      );
    });

    it("should have appropriate special configurations", () => {
      const temperateZone = enhancedCelestialZones.find(
        (z) => z.name === "Temperate Zone",
      );
      expect(temperateZone?.specialConfigurations).toContain(
        OrbitalConfiguration.STANDARD,
      );
      expect(temperateZone?.specialConfigurations).toContain(
        OrbitalConfiguration.BINARY_PAIR,
      );
      expect(temperateZone?.specialConfigurations).toContain(
        OrbitalConfiguration.TROJAN,
      );
      expect(temperateZone?.specialConfigurations).toContain(
        OrbitalConfiguration.CO_ORBITAL,
      );

      const interstellarZone = enhancedCelestialZones.find(
        (z) => z.name === "Interstellar Zone",
      );
      expect(interstellarZone?.specialConfigurations).toContain(
        OrbitalConfiguration.ROGUE,
      );
    });
  });

  describe("createDefaultTemperateZone", () => {
    it("should create a valid temperate zone", () => {
      const zone = createDefaultTemperateZone();

      expect(zone.name).toBe("Temperate Zone");
      expect(zone.category).toBe(ZoneCategory.TEMPERATE);
      expect(zone.baseMinAU).toBe(0.8);
      expect(zone.baseMaxAU).toBe(2.0);
      expect(zone.minAU).toBe(0.8);
      expect(zone.maxAU).toBe(2.0);
      expect(zone.temperatureRange.min).toBe(200);
      expect(zone.temperatureRange.max).toBe(400);
      expect(zone.allowedPlanetTypes).toContain(PlanetType.TERRESTRIAL);
      expect(zone.allowedPlanetTypes).toContain(PlanetType.OCEAN);
      expect(zone.allowedPlanetTypes).toContain(PlanetType.ROCKY);
      expect(zone.allowedGasGiantClasses).toContain(GasGiantClass.CLASS_I);
      expect(zone.allowedGasGiantClasses).toContain(GasGiantClass.CLASS_II);
      expect(zone.cometChance).toBe(0);
      expect(zone.asteroidBeltChance).toBe(0.1);
      expect(zone.formationProbability).toBe(0.85);
      expect(zone.specialConfigurations).toContain(
        OrbitalConfiguration.STANDARD,
      );
      expect(zone.maxBodies).toBe(3);
      expect(zone.minBodies).toBe(1);
    });
  });

  describe("createDefaultZones", () => {
    it("should create an array of default zones", () => {
      const zones = createDefaultZones();

      expect(zones).toHaveLength(3);
      expect(zones[0].name).toBe("Temperate Zone");
      expect(zones[1].name).toBe("Hot Inner Zone");
      expect(zones[2].name).toBe("Cool Zone");
    });

    it("should create zones with valid properties", () => {
      const zones = createDefaultZones();

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
        expect(zone.minBodies).toBeGreaterThan(0);
      });
    });

    it("should have zones with valid distance ranges", () => {
      const zones = createDefaultZones();

      zones.forEach((zone) => {
        expect(zone.minAU).toBeGreaterThan(0);
        expect(zone.maxAU).toBeGreaterThan(zone.minAU);
      });
    });
  });
});
