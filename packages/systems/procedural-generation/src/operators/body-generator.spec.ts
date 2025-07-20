import { describe, expect, it, beforeEach, vi } from "vitest";
import { generateBodyForSlot } from "./body-generator";
import { OrbitalConfiguration } from "../zones/types";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
} from "@teskooano/data-types";
import * as CONST from "../constants";
import { firstValueFrom, toArray, of } from "rxjs";

describe("Body Generator", () => {
  let mockParentStar: any;
  let mockZone: any;
  let mockPlacement: any;

  beforeEach(() => {
    // Create a mock parent star (G2V like our Sun)
    mockParentStar = {
      id: "parent-star",
      name: "Parent Star",
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

    mockZone = {
      name: "Habitable Zone",
      category: "HABITABLE",
      minAU: 0.8,
      maxAU: 2.5,
      minBodies: 1,
      maxBodies: 3,
      formationProbability: 0.9,
      cometChance: 0.05,
      asteroidBeltChance: 0.1,
      allowedPlanetTypes: ["TERRESTRIAL", "OCEAN", "ROCKY"],
      allowedGasGiantClasses: ["NEPTUNIAN", "JOVIAN"],
      specialConfigurations: ["RINGS"],
      temperatureRange: { min: 200, max: 400 },
      bodyCount: { min: 1, max: 3 },
      chance: 0.9,
    };

    mockPlacement = {
      parentStar: mockParentStar,
      distanceRelativeToParentAU: 1.5,
      distanceAU: 1.5,
      zone: mockZone,
      slotIndex: 0,
      configuration: OrbitalConfiguration.STANDARD,
    };
  });

  describe("generateBodyForSlot", () => {
    it("should generate a standard body for STANDARD configuration", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(mockPlacement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      expect(result.parentId).toBe(mockParentStar.id);
      expect(result.orbit).toBeDefined();
    });

    it("should generate a standard body for BINARY_PAIR configuration", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";
      const placement = {
        ...mockPlacement,
        configuration: OrbitalConfiguration.BINARY_PAIR,
      };

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(placement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      expect(result.parentId).toBe(mockParentStar.id);
    });

    it("should generate a standard body for TROJAN configuration", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";
      const placement = {
        ...mockPlacement,
        configuration: OrbitalConfiguration.TROJAN,
      };

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(placement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      expect(result.parentId).toBe(mockParentStar.id);
    });

    it("should generate a standard body for CO_ORBITAL configuration", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";
      const placement = {
        ...mockPlacement,
        configuration: OrbitalConfiguration.CO_ORBITAL,
      };

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(placement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      expect(result.parentId).toBe(mockParentStar.id);
    });

    it("should generate a standard body for CIRCUMBINARY configuration", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";
      const placement = {
        ...mockPlacement,
        configuration: OrbitalConfiguration.CIRCUMBINARY,
      };

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(placement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      expect(result.parentId).toBe(mockParentStar.id);
    });

    it("should generate a rogue object for ROGUE configuration", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";
      const placement = {
        ...mockPlacement,
        configuration: OrbitalConfiguration.ROGUE,
      };

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(placement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      expect(result.parentId).toBeUndefined(); // Rogue planets have no parent
    });

    it("should generate a standard body for unknown configuration", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";
      const placement = { ...mockPlacement, configuration: "UNKNOWN" as any };

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(placement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      expect(result.parentId).toBe(mockParentStar.id);
    });

    it("should generate a comet when random value is below comet chance", async () => {
      const random = vi.fn().mockReturnValue(0.02); // Below 0.05 comet chance
      const seed = "test-seed";

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(mockPlacement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.COMET);
      expect(result.parentId).toBe(mockParentStar.id);
    });

    it("should generate an asteroid belt when random value is in asteroid belt range", async () => {
      const random = vi.fn().mockReturnValue(0.08); // Between 0.05 and 0.15
      const seed = "test-seed";

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(mockPlacement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.ASTEROID_FIELD);
      expect(result.parentId).toBe(mockParentStar.id);
    });

    it("should generate a planet when random value is above belt chance", async () => {
      const random = vi.fn().mockReturnValue(0.2); // Above 0.15
      const seed = "test-seed";

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(mockPlacement).pipe(operator));

      expect(result).toBeDefined();
      expect(result.type).toBe(CelestialType.PLANET);
      expect(result.parentId).toBe(mockParentStar.id);
    });

    it("should generate moons for planets", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";

      const operator = generateBodyForSlot(random, seed);
      const results = await firstValueFrom(
        of(mockPlacement).pipe(operator, toArray()),
      );

      expect(results.length).toBeGreaterThan(1); // Planet + moons
      expect(results[0].type).toBe(CelestialType.PLANET);

      // Check for moons
      const moons = results.slice(1);
      moons.forEach((moon: any) => {
        expect(moon.type).toBe(CelestialType.MOON);
        expect(moon.parentId).toBe(results[0].id);
      });
    });

    it("should not generate moons for rogue planets", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";
      const placement = {
        ...mockPlacement,
        configuration: OrbitalConfiguration.ROGUE,
      };

      const operator = generateBodyForSlot(random, seed);
      const results = await firstValueFrom(
        of(placement).pipe(operator, toArray()),
      );

      expect(results.length).toBe(1); // Only the rogue planet
      expect(results[0].type).toBe(CelestialType.PLANET);
      expect(results[0].parentId).toBeUndefined();
    });

    it("should use the provided random function", async () => {
      const mockRandom = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";

      const operator = generateBodyForSlot(mockRandom, seed);
      await firstValueFrom(of(mockPlacement).pipe(operator));

      expect(mockRandom).toHaveBeenCalled();
    });

    it("should use the provided seed", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "unique-test-seed";

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(mockPlacement).pipe(operator));

      expect(result).toBeDefined();
      // The seed should influence the generation (though exact behavior depends on implementation)
    });

    it("should handle different zone configurations", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";

      const differentZones = [
        { ...mockZone, cometChance: 0.0, asteroidBeltChance: 0.0 },
        { ...mockZone, cometChance: 0.5, asteroidBeltChance: 0.0 },
        { ...mockZone, cometChance: 0.0, asteroidBeltChance: 0.5 },
      ];

      for (const zone of differentZones) {
        const placement = { ...mockPlacement, zone };
        const operator = generateBodyForSlot(random, seed);
        const result = await firstValueFrom(of(placement).pipe(operator));

        expect(result).toBeDefined();
        expect(result.type).toBeDefined();
      }
    });

    it("should handle different distances", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";

      const distances = [0.5, 1.0, 5.0, 10.0];

      for (const distance of distances) {
        const placement = {
          ...mockPlacement,
          distanceRelativeToParentAU: distance,
          distanceAU: distance,
        };
        const operator = generateBodyForSlot(random, seed);
        const result = await firstValueFrom(of(placement).pipe(operator));

        expect(result).toBeDefined();
        expect(result.orbit).toBeDefined();
        expect(result.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
      }
    });

    it("should handle different slot indices", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";

      const slotIndices = [0, 1, 2, 5];

      for (const slotIndex of slotIndices) {
        const placement = { ...mockPlacement, slotIndex };
        const operator = generateBodyForSlot(random, seed);
        const result = await firstValueFrom(of(placement).pipe(operator));

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      }
    });

    it("should generate bodies with valid properties", async () => {
      const random = vi.fn().mockReturnValue(0.5);
      const seed = "test-seed";

      const operator = generateBodyForSlot(random, seed);
      const result = await firstValueFrom(of(mockPlacement).pipe(operator));

      expect(result.id).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.status).toBe(CelestialStatus.ACTIVE);
      expect(result.realMass_kg).toBeGreaterThan(0);
      expect(result.realRadius_m).toBeGreaterThan(0);
      expect(result.temperature).toBeGreaterThan(0);
      expect(result.orbit).toBeDefined();
    });

    it("should handle edge case random values", async () => {
      const seed = "test-seed";

      // Test with minimum random value
      const minRandom = vi.fn().mockReturnValue(0.0);
      const minOperator = generateBodyForSlot(minRandom, seed);
      const minResult = await firstValueFrom(
        of(mockPlacement).pipe(minOperator),
      );
      expect(minResult).toBeDefined();

      // Test with maximum random value
      const maxRandom = vi.fn().mockReturnValue(1.0);
      const maxOperator = generateBodyForSlot(maxRandom, seed);
      const maxResult = await firstValueFrom(
        of(mockPlacement).pipe(maxOperator),
      );
      expect(maxResult).toBeDefined();
    });
  });
});
