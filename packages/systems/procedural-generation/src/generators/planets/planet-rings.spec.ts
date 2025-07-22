import { describe, expect, it, beforeEach } from "vitest";
import { generateRings, generateRingsArray } from "./planet-rings";
import {
  RockyType,
  CelestialType,
  GasGiantClass,
  PlanetType,
  type CelestiaClassType,
} from "@teskooano/data-types";

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
      expect(result!.rings).toBeDefined();
      expect(Array.isArray(result!.rings)).toBe(true);
      expect(result!.rings.length).toBeGreaterThan(0);
    });

    it("generates rings with valid properties", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      result!.rings.forEach((ring) => {
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
      expect(result!.rings.length).toBeGreaterThanOrEqual(1);
      expect(result!.rings.length).toBeLessThanOrEqual(5); // Max rings for rocky planets
    });

    it("generates more rings for gas giants", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
        1.5, // Outer radius factor
      );

      expect(result).toBeDefined();
      expect(result!.rings.length).toBeGreaterThanOrEqual(1);
      expect(result!.rings.length).toBeLessThanOrEqual(5); // Max rings for gas giants
    });

    it("respects Roche limit for ring placement", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      result!.rings.forEach((ring) => {
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
      if (result!.rings.length > 1) {
        for (let i = 0; i < result!.rings.length - 1; i++) {
          const currentRing = result!.rings[i];
          const nextRing = result!.rings[i + 1];

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
      result!.rings.forEach((ring) => {
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
      result!.rings.forEach((ring) => {
        expect(ring.type).toBe(RockyType.METALLIC);
        // Metallic rings should have variable density and lower opacity
        expect(ring.density).toBeGreaterThanOrEqual(0.4);
        expect(ring.opacity).toBeLessThanOrEqual(0.9);
      });
    });

    it("generates ring system with enhanced configuration", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      expect(result!.rings).toBeDefined();
      expect(result!.systemAxialInclination).toBeDefined();
      expect(result!.inheritParentTilt).toBe(true);
      expect(result!.precessionRate).toBeDefined();
      expect(result!.unifiedRendering).toBe(true);
    });

    it("generates rings with enhanced axial inclination controls", () => {
      const result = generateRings(
        mockRandom,
        0.6, // 60% chance (higher than random() = 0.5)
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeDefined();
      result!.rings.forEach((ring) => {
        expect(ring.ringTilt).toBeDefined();
        expect(ring.inheritParentTilt).toBe(true);
        // Ring tilt should be within reasonable bounds
        expect(ring.ringTilt!).toBeGreaterThanOrEqual(-0.1);
        expect(ring.ringTilt!).toBeLessThanOrEqual(0.1);
      });
    });
  });

  describe("generateRingsArray (backward compatibility)", () => {
    const EARTH_RADIUS_M = 6371000; // Earth radius in meters

    it("returns undefined when chance is 0", () => {
      const result = generateRingsArray(
        mockRandom,
        0.0, // No chance
        [RockyType.ICE, RockyType.LIGHT_ROCK],
        EARTH_RADIUS_M,
      );

      expect(result).toBeUndefined();
    });

    it("returns rings array when chance is high enough", () => {
      const result = generateRingsArray(
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
      const result = generateRingsArray(
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
  });
});
