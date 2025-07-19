import { describe, expect, it, beforeEach } from "vitest";
import { generatePlanetSpecificProperties } from "./planet-properties";
import {
  CelestialType,
  PlanetType,
  GasGiantClass,
  AtmosphereType,
  type GasGiantProperties,
  type PlanetProperties,
} from "@teskooano/data-types";
import type { PlanetBaseProperties } from "./planet-type";

describe("Planet Properties Generator", () => {
  let mockRandom: () => number;

  beforeEach(() => {
    // Create a deterministic random function for testing
    mockRandom = () => 0.5;
  });

  describe("generatePlanetSpecificProperties", () => {
    it("generates gas giant properties correctly", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.GAS_GIANT,
        celestialClass: GasGiantClass.CLASS_I,
        preliminaryDensity_kg_m3: 1000,
        targetDensity_kg_m3: 1000,
        massMultiplierFactor: 1.0,
        ringChance: 0.75,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        5.0, // 5 AU distance
      );

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.GAS_GIANT);

      const gasGiantResult = result as GasGiantProperties;
      expect(gasGiantResult.classType).toBe(GasGiantClass.CLASS_I);
      expect(gasGiantResult.atmosphere).toBeDefined();
      expect(gasGiantResult.atmosphereColor).toBeDefined();
      expect(gasGiantResult.cloudColor).toBeDefined();
      expect(typeof gasGiantResult.cloudSpeed).toBe("number");
    });

    it("generates terrestrial planet properties correctly", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.TERRESTRIAL,
        preliminaryDensity_kg_m3: 4000,
        targetDensity_kg_m3: 4000,
        massMultiplierFactor: 1.0,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        1.0, // 1 AU distance
      );

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);

      const planetResult = result as PlanetProperties;
      expect(planetResult.classType).toBe(PlanetType.TERRESTRIAL);
      expect(planetResult.isMoon).toBe(false);
      expect(planetResult.composition).toBeDefined();
      expect(Array.isArray(planetResult.composition)).toBe(true);
      expect(planetResult.composition.length).toBeGreaterThan(0);
    });

    it("generates ice planet properties correctly", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.ICE,
        preliminaryDensity_kg_m3: 3000,
        targetDensity_kg_m3: 3000,
        massMultiplierFactor: 0.5,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        10.0, // 10 AU distance
      );

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);

      const planetResult = result as PlanetProperties;
      expect(planetResult.classType).toBe(PlanetType.ICE);
      expect(planetResult.composition).toContain("water ice");
    });

    it("generates ocean planet properties correctly", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.OCEAN,
        preliminaryDensity_kg_m3: 3500,
        targetDensity_kg_m3: 3500,
        massMultiplierFactor: 1.2,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        1.5, // 1.5 AU distance
      );

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);

      const planetResult = result as PlanetProperties;
      expect(planetResult.classType).toBe(PlanetType.OCEAN);
      expect(planetResult.composition).toContain("water");
    });

    it("generates atmosphere for appropriate planet types", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.TERRESTRIAL,
        preliminaryDensity_kg_m3: 4000,
        targetDensity_kg_m3: 4000,
        massMultiplierFactor: 1.0,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        1.0,
      );

      expect(result).toBeDefined();

      const planetResult = result as PlanetProperties;
      expect(planetResult.atmosphere).toBeDefined();
      expect(planetResult.atmosphere!.glowColor).toBeDefined();
      expect(planetResult.atmosphere!.intensity).toBeGreaterThan(0);
      expect(planetResult.atmosphere!.power).toBeGreaterThan(0);
      expect(planetResult.atmosphere!.thickness).toBeGreaterThan(0);
    });

    it("does not generate atmosphere for barren planets", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.BARREN,
        preliminaryDensity_kg_m3: 3500,
        targetDensity_kg_m3: 3500,
        massMultiplierFactor: 0.8,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        0.5,
      );

      expect(result).toBeDefined();
      const planetResult = result as PlanetProperties;
      expect(planetResult.atmosphere).toBeUndefined();
    });

    it("generates clouds for planets with atmosphere", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.OCEAN,
        preliminaryDensity_kg_m3: 3500,
        targetDensity_kg_m3: 3500,
        massMultiplierFactor: 1.2,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        1.5,
      );

      expect(result).toBeDefined();
      const planetResult = result as PlanetProperties;
      expect(planetResult.clouds).toBeDefined();
      expect(planetResult.clouds!.color).toBeDefined();
      expect(planetResult.clouds!.opacity).toBeGreaterThan(0);
      expect(planetResult.clouds!.coverage).toBeGreaterThan(0);
      expect(planetResult.clouds!.speed).toBeGreaterThan(0);
    });

    it("generates surface properties for rocky planets", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.TERRESTRIAL,
        preliminaryDensity_kg_m3: 4000,
        targetDensity_kg_m3: 4000,
        massMultiplierFactor: 1.0,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        1.0,
      );

      expect(result).toBeDefined();
      const planetResult = result as PlanetProperties;
      expect(planetResult.surface).toBeDefined();
      expect(planetResult.surface!.color1).toBeDefined();
      expect(planetResult.surface!.color2).toBeDefined();
      expect(planetResult.surface!.color3).toBeDefined();
      expect(planetResult.surface!.roughness).toBeGreaterThan(0);
      expect(planetResult.surface!.persistence).toBeGreaterThan(0);
      expect(planetResult.surface!.lacunarity).toBeGreaterThan(0);
    });

    it("generates different gas giant class properties", () => {
      const classes = [
        GasGiantClass.CLASS_I,
        GasGiantClass.CLASS_II,
        GasGiantClass.CLASS_III,
        GasGiantClass.CLASS_IV,
        GasGiantClass.CLASS_V,
      ];

      classes.forEach((gasGiantClass) => {
        const baseProps: PlanetBaseProperties = {
          celestialType: CelestialType.GAS_GIANT,
          celestialClass: gasGiantClass,
          preliminaryDensity_kg_m3: 1000,
          targetDensity_kg_m3: 1000,
          massMultiplierFactor: 1.0,
          ringChance: 0.75,
          ringAllowedTypes: [],
        };

        const result = generatePlanetSpecificProperties(
          mockRandom,
          baseProps,
          5.0,
        );

        expect(result).toBeDefined();
        expect(result.type).toBe(CelestialType.GAS_GIANT);
        const gasGiantResult = result as GasGiantProperties;
        expect(gasGiantResult.classType).toBe(gasGiantClass);
        expect(gasGiantResult.atmosphere).toBeDefined();
        expect(gasGiantResult.atmosphereColor).toBeDefined();
        expect(gasGiantResult.cloudColor).toBeDefined();
      });
    });

    it("generates appropriate atmospheric composition for different planet types", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.OCEAN,
        preliminaryDensity_kg_m3: 3500,
        targetDensity_kg_m3: 3500,
        massMultiplierFactor: 1.2,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        1.5,
      );

      expect(result).toBeDefined();

      const planetResult = result as PlanetProperties;
      expect(planetResult.atmosphere).toBeDefined();
      expect(planetResult.atmosphere!.glowColor).toBeDefined();
      expect(planetResult.atmosphere!.intensity).toBeGreaterThan(0);
      expect(planetResult.atmosphere!.power).toBeGreaterThan(0);
      expect(planetResult.atmosphere!.thickness).toBeGreaterThan(0);
    });

    it("handles metallic planet types", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: "METALLIC" as PlanetType, // Using string literal for metallic type
        preliminaryDensity_kg_m3: 6000,
        targetDensity_kg_m3: 6000,
        massMultiplierFactor: 0.8,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        0.3,
      );

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      const planetResult = result as PlanetProperties;
      expect(planetResult.classType).toBe("METALLIC");
      expect(planetResult.composition).toContain("iron");
    });

    it("produces deterministic results with same seed", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.TERRESTRIAL,
        preliminaryDensity_kg_m3: 4000,
        targetDensity_kg_m3: 4000,
        massMultiplierFactor: 1.0,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result1 = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        1.0,
      );

      const result2 = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        1.0,
      );

      expect(result1.type).toBe(result2.type);
      const planetResult1 = result1 as PlanetProperties;
      const planetResult2 = result2 as PlanetProperties;
      expect(planetResult1.classType).toBe(planetResult2.classType);
      expect(planetResult1.composition).toEqual(planetResult2.composition);
    });

    it("handles edge case distances", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: PlanetType.TERRESTRIAL,
        preliminaryDensity_kg_m3: 4000,
        targetDensity_kg_m3: 4000,
        massMultiplierFactor: 1.0,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      // Test very close distance
      const closeResult = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        0.01,
      );
      expect(closeResult).toBeDefined();

      // Test very distant distance
      const distantResult = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        100.0,
      );
      expect(distantResult).toBeDefined();
    });

    it("handles gas giant moons correctly", () => {
      const baseProps: PlanetBaseProperties = {
        celestialType: CelestialType.PLANET,
        celestialClass: GasGiantClass.CLASS_I, // Gas giant class for moon
        preliminaryDensity_kg_m3: 2000,
        targetDensity_kg_m3: 2000,
        massMultiplierFactor: 0.1,
        ringChance: 0.1,
        ringAllowedTypes: [],
      };

      const result = generatePlanetSpecificProperties(
        mockRandom,
        baseProps,
        5.0,
      );

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);

      const planetResult = result as PlanetProperties;
      expect(planetResult.composition).toContain("water ice"); // Gas giant moons are typically icy
    });
  });
});
