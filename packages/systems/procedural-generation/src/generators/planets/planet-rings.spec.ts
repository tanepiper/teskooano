import { describe, expect, it, beforeEach } from "vitest";
import { generateRings } from "./planet-rings";
import {
  RockyType,
  CelestialType,
  GasGiantClass,
  PlanetType,
  type CelestiaClassType,
} from "@teskooano/data-types";

// Define the RingFormationContext interface to match the one in planet-rings.ts
interface RingFormationContext {
  planetMass: number;
  planetRadius: number;
  stellarDistanceAU: number;
  systemAge: number;
  hasLargeMoons: boolean;
  classType: CelestiaClassType;
}

describe("Planet Rings Generator", () => {
  let mockRandom: () => number;
  let randomValues: number[];
  let randomIndex: number;

  beforeEach(() => {
    // Create a deterministic random function for testing
    // Use a single value to make tests deterministic
    mockRandom = () => 0.5; // Always returns 0.5 for deterministic testing
  });

  describe("generateRings", () => {
    const EARTH_RADIUS_M = 6371000; // Earth radius in meters

    it("returns undefined when chance is 0", () => {
      const result = generateRings(
        mockRandom,
        0.0, // No chance
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeUndefined();
    });

    it("returns undefined when no allowed types provided", () => {
      const result = generateRings(
        mockRandom,
        0.5, // 50% chance
        [], // No allowed types
        EARTH_RADIUS_M,
      );

      expect(result).toBeUndefined();
    });

    it("generates rings when chance is high enough", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result!.length).toBeGreaterThan(0);
    });

    it("generates rings with valid properties", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      result!.forEach((ring) => {
        expect(ring.innerRadius).toBeGreaterThan(0);
        expect(ring.outerRadius).toBeGreaterThan(ring.innerRadius);
        expect(ring.density).toBeGreaterThanOrEqual(0);
        expect(ring.density).toBeLessThanOrEqual(1);
        expect(ring.opacity).toBeGreaterThanOrEqual(0);
        expect(ring.opacity).toBeLessThanOrEqual(1);
        expect(ring.color).toBeDefined();
        expect(ring.composition).toBeDefined();
        expect(Array.isArray(ring.composition)).toBe(true);
        expect(ring.composition.length).toBeGreaterThan(0);
      });
    });

    it("generates multiple rings in a system", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      expect(result!.length).toBeGreaterThanOrEqual(1);
      expect(result!.length).toBeLessThanOrEqual(5); // Max rings for rocky planets
    });

    it("generates more rings for gas giants", () => {
      const context: RingFormationContext = {
        planetMass: 10, // Jupiter masses
        planetRadius: EARTH_RADIUS_M,
        stellarDistanceAU: 5.0,
        systemAge: 0.5, // Young system
        hasLargeMoons: false,
        classType: GasGiantClass.CLASS_I,
      };

      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
        1.5, // Outer radius factor
        context,
      );

      expect(result).toBeDefined();
      expect(result!.length).toBeGreaterThanOrEqual(1);
      expect(result!.length).toBeLessThanOrEqual(8); // Max rings for gas giants
    });

    it("respects Roche limit for ring placement", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      result!.forEach((ring) => {
        // Rings should start outside the Roche limit (approximately 2.44 * planet radius)
        const rocheLimit = 2.44 * EARTH_RADIUS_M;
        expect(ring.innerRadius).toBeGreaterThan(rocheLimit * 0.8); // Allow some tolerance
      });
    });

    it("generates rings with appropriate spacing", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      if (result!.length > 1) {
        for (let i = 0; i < result!.length - 1; i++) {
          const currentRing = result![i];
          const nextRing = result![i + 1];

          // Rings should not overlap
          expect(nextRing.innerRadius).toBeGreaterThan(currentRing.outerRadius);

          // Should have reasonable gaps between rings
          const gap = nextRing.innerRadius - currentRing.outerRadius;
          expect(gap).toBeGreaterThan(0);
        }
      }
    });

    it("generates ice rings with appropriate properties", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      result!.forEach((ring) => {
        expect(ring.type).toBe(RockyType.ICE);
        // Ice rings should have higher density and lower opacity
        expect(ring.density).toBeGreaterThanOrEqual(0.6);
        expect(ring.opacity).toBeLessThanOrEqual(0.8);
      });
    });

    it("generates metallic rings with appropriate properties", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.METALLIC],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      result!.forEach((ring) => {
        expect(ring.type).toBe(RockyType.METALLIC);
        // Metallic rings should have variable density and lower opacity
        expect(ring.density).toBeGreaterThanOrEqual(0.4);
        expect(ring.opacity).toBeLessThanOrEqual(0.5);
      });
    });

    it("handles formation context correctly", () => {
      const context: RingFormationContext = {
        planetMass: 1, // Earth mass
        planetRadius: EARTH_RADIUS_M,
        stellarDistanceAU: 1.0, // Habitable zone
        systemAge: 4.5, // Old system
        hasLargeMoons: true, // Has large moons
        classType: PlanetType.TERRESTRIAL,
      };

      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
        1.5,
        context,
      );

      expect(result).toBeDefined();
      // Context should influence ring generation but not prevent it entirely
      if (result) {
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it("produces deterministic results with same seed", () => {
      const result1 = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      const result2 = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      if (result1 && result2) {
        expect(result1.length).toBe(result2.length);
        for (let i = 0; i < result1.length; i++) {
          expect(result1[i].innerRadius).toBe(result2[i].innerRadius);
          expect(result1[i].outerRadius).toBe(result2[i].outerRadius);
          expect(result1[i].type).toBe(result2[i].type);
        }
      }
    });

    it("handles edge case planet sizes", () => {
      // Test with very small planet
      const smallPlanetRadius = 1000000; // 1000 km

      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        smallPlanetRadius,
      );

      expect(result).toBeDefined();
      if (result) {
        result.forEach((ring) => {
          expect(ring.innerRadius).toBeGreaterThan(smallPlanetRadius);
          expect(ring.outerRadius).toBeGreaterThan(ring.innerRadius);
        });
      }
    });
  });
});
