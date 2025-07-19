import { describe, expect, it, beforeEach } from "vitest";
import { determinePlanetTypeAndBaseProperties } from "./planet-type";
import {
  CelestialType,
  PlanetType,
  GasGiantClass,
  CelestialStatus,
  type StarProperties,
  type CelestialObject,
} from "@teskooano/data-types";

// Define a simplified zone interface for testing
interface TestZone {
  minAU: number;
  maxAU: number;
  allowedPlanetTypes?: string[];
  allowedGasGiantClasses?: string[];
  formationProbability?: number;
}

describe("Planet Type Generator", () => {
  let mockRandom: () => number;
  let randomValues: number[];
  let randomIndex: number;
  let mockParentStar: CelestialObject<StarProperties>;

  beforeEach(() => {
    // Create a deterministic random function for testing
    // Use a single value to make tests deterministic
    mockRandom = () => 0.5; // Always returns 0.5 for deterministic testing

    // Create a mock parent star
    mockParentStar = {
      id: "test-star",
      name: "Test Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: 1.989e30, // Solar mass
      realRadius_m: 696340000, // Solar radius
      temperature: 5778, // Solar temperature
      albedo: 0.1,
      orbit: {
        realSemiMajorAxis_m: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 0,
        siderealRotationPeriod_s: 0,
        realAphelion_m: 0,
        realPerihelion_m: 0,
        averageOrbitalSpeed_mps: 0,
        epoch: "J2000",
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        luminosity: 1.0,
        color: "#FFFFE0",
      },
      seed: "test-star-seed",
    };
  });

  describe("determinePlanetTypeAndBaseProperties", () => {
    it("returns undefined when no zone is provided", () => {
      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        null,
      );

      expect(result).toBeUndefined();
    });

    it("respects zone constraints for allowed planet types", () => {
      const zone: TestZone = {
        minAU: 0.8,
        maxAU: 2.5,
        allowedPlanetTypes: ["TERRESTRIAL", "OCEAN", "ROCKY"],
        // No gas giants allowed in this zone
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.PLANET);
      expect([
        PlanetType.TERRESTRIAL,
        PlanetType.OCEAN,
        PlanetType.ROCKY,
      ]).toContain(result!.celestialClass);
    });

    it("respects zone constraints for gas giants", () => {
      const zone: TestZone = {
        minAU: 5.0,
        maxAU: 15.0,
        allowedPlanetTypes: ["ICE", "ROCKY"],
        allowedGasGiantClasses: ["CLASS_I", "CLASS_II", "CLASS_III"],
        formationProbability: 0.6, // With random() = 0.5, this should select gas giants
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.GAS_GIANT);
      expect([
        GasGiantClass.CLASS_I,
        GasGiantClass.CLASS_II,
        GasGiantClass.CLASS_III,
      ]).toContain(result!.celestialClass);
    });

    it("falls back to temperature-based selection when no zone constraints", () => {
      const zone: TestZone = {
        minAU: 1.0,
        maxAU: 2.0,
        // No allowedPlanetTypes specified
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.PLANET);
      expect(Object.values(PlanetType)).toContain(result!.celestialClass);
    });

    it("generates appropriate density for gas giants", () => {
      const zone: TestZone = {
        minAU: 5.0,
        maxAU: 15.0,
        allowedPlanetTypes: ["ICE"],
        allowedGasGiantClasses: ["CLASS_I"],
        formationProbability: 0.6, // With random() = 0.5, this should select gas giants
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.GAS_GIANT);
      expect(result!.targetDensity_kg_m3).toBeGreaterThanOrEqual(500);
      expect(result!.targetDensity_kg_m3).toBeLessThanOrEqual(2000);
    });

    it("generates appropriate density for rocky planets", () => {
      const zone: TestZone = {
        minAU: 0.8,
        maxAU: 2.5,
        allowedPlanetTypes: ["TERRESTRIAL", "ROCKY"],
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.PLANET);
      expect(result!.targetDensity_kg_m3).toBeGreaterThanOrEqual(2000);
      expect(result!.targetDensity_kg_m3).toBeLessThanOrEqual(5500);
    });

    it("generates appropriate mass multiplier factors", () => {
      const zone: TestZone = {
        minAU: 1.0,
        maxAU: 2.0,
        allowedPlanetTypes: ["TERRESTRIAL", "GAS_GIANT"],
        allowedGasGiantClasses: ["CLASS_I"],
        formationProbability: 0.5,
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.massMultiplierFactor).toBeGreaterThan(0);
    });

    it("generates higher ring chance for gas giants", () => {
      const zone: TestZone = {
        minAU: 5.0,
        maxAU: 15.0,
        allowedPlanetTypes: ["ICE"],
        allowedGasGiantClasses: ["CLASS_I"],
        formationProbability: 0.6, // With random() = 0.5, this should select gas giants
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.GAS_GIANT);
      expect(result!.ringChance).toBe(0.75);
    });

    it("generates lower ring chance for rocky planets", () => {
      const zone: TestZone = {
        minAU: 0.8,
        maxAU: 2.5,
        allowedPlanetTypes: ["TERRESTRIAL", "ROCKY"],
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.PLANET);
      expect(result!.ringChance).toBe(0.1);
    });

    it("handles different stellar properties", () => {
      const redDwarfStar: CelestialObject<StarProperties> = {
        ...mockParentStar,
        temperature: 3000,
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "M5V",
          luminosity: 0.01,
          color: "#FF6B6B",
        },
      };

      const zone: TestZone = {
        minAU: 0.1,
        maxAU: 0.5,
        allowedPlanetTypes: ["TERRESTRIAL", "ROCKY"],
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        redDwarfStar,
        zone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.PLANET);
    });

    it("produces deterministic results with same seed", () => {
      const zone: TestZone = {
        minAU: 1.0,
        maxAU: 2.0,
        allowedPlanetTypes: ["TERRESTRIAL", "ROCKY"],
      };

      const result1 = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      const result2 = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        zone,
      );

      expect(result1!.celestialType).toBe(result2!.celestialType);
      expect(result1!.celestialClass).toBe(result2!.celestialClass);
      expect(result1!.targetDensity_kg_m3).toBe(result2!.targetDensity_kg_m3);
      expect(result1!.massMultiplierFactor).toBe(result2!.massMultiplierFactor);
    });

    it("handles edge case zone configurations", () => {
      // Zone with no allowed types
      const emptyZone: TestZone = {
        minAU: 1.0,
        maxAU: 2.0,
        allowedPlanetTypes: [],
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        emptyZone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.PLANET);
    });

    it("handles invalid planet type strings gracefully", () => {
      const invalidZone: TestZone = {
        minAU: 1.0,
        maxAU: 2.0,
        allowedPlanetTypes: ["INVALID_TYPE", "TERRESTRIAL"],
      };

      const result = determinePlanetTypeAndBaseProperties(
        mockRandom,
        mockParentStar,
        invalidZone,
      );

      expect(result).toBeDefined();
      expect(result!.celestialType).toBe(CelestialType.PLANET);
      expect(result!.celestialClass).toBe(PlanetType.TERRESTRIAL);
    });
  });
});
