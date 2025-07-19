import { describe, expect, it, beforeEach } from "vitest";
import { generateMoonsObservable } from "./moons";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  GasGiantClass,
  type PlanetProperties,
  type GasGiantProperties,
  type CelestialObject,
} from "@teskooano/data-types";
import * as CONST from "../../constants";

describe("Moon System Generator", () => {
  let mockRandom: () => number;
  let mockTerrestrialPlanet: CelestialObject<PlanetProperties>;
  let mockGasGiantPlanet: CelestialObject<GasGiantProperties>;

  beforeEach(() => {
    // Create a deterministic random function for testing
    mockRandom = () => 0.5;

    // Create a mock terrestrial planet (Earth-like)
    mockTerrestrialPlanet = {
      id: "test-terrestrial",
      name: "Test Terrestrial",
      type: CelestialType.PLANET,
      status: CelestialStatus.ACTIVE,
      parentId: "test-star",
      realMass_kg: CONST.SOLAR_MASS_KG * 3e-6, // Earth mass
      realRadius_m: 6371000, // Earth radius
      temperature: 255,
      albedo: 0.3,
      orbit: {
        realSemiMajorAxis_m: CONST.AU_TO_METERS, // 1 AU
        eccentricity: 0.0167,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 365.25 * 24 * 60 * 60,
        siderealRotationPeriod_s: 24 * 60 * 60,
        realAphelion_m: CONST.AU_TO_METERS * 1.0167,
        realPerihelion_m: CONST.AU_TO_METERS * 0.9833,
        averageOrbitalSpeed_mps: 29780,
        epoch: "J2000",
      },
      properties: {
        type: CelestialType.PLANET,
        classType: PlanetType.TERRESTRIAL,
        isMoon: false,
        composition: ["silicates", "iron", "water"],
      },
    };

    // Create a mock gas giant (Jupiter-like)
    mockGasGiantPlanet = {
      id: "test-gas-giant",
      name: "Test Gas Giant",
      type: CelestialType.GAS_GIANT,
      status: CelestialStatus.ACTIVE,
      parentId: "test-star",
      realMass_kg: CONST.SOLAR_MASS_KG * 1e-3, // Jupiter-like mass
      realRadius_m: 69911000, // Jupiter radius
      temperature: 165,
      albedo: 0.5,
      orbit: {
        realSemiMajorAxis_m: CONST.AU_TO_METERS * 5, // 5 AU
        eccentricity: 0.048,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 365.25 * 24 * 60 * 60 * 11.86, // Jupiter period
        siderealRotationPeriod_s: 9.9 * 60 * 60, // Jupiter rotation
        realAphelion_m: CONST.AU_TO_METERS * 5.24,
        realPerihelion_m: CONST.AU_TO_METERS * 4.76,
        averageOrbitalSpeed_mps: 13100,
        epoch: "J2000",
      },
      properties: {
        type: CelestialType.GAS_GIANT,
        classType: GasGiantClass.CLASS_I,
        atmosphereColor: "#E0C0A0",
        cloudColor: "#FFFFFF",
        cloudSpeed: 0.05,
      },
    };
  });

  describe("generateMoonsObservable", () => {
    it("generates moons for terrestrial planets", async () => {
      const moons: CelestialObject[] = [];

      const observable = generateMoonsObservable(
        mockRandom,
        mockTerrestrialPlanet,
        mockTerrestrialPlanet.realMass_kg,
        mockTerrestrialPlanet.realRadius_m,
        "test-seed",
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (moon) => moons.push(moon),
          complete: () => resolve(),
        });
      });

      // Terrestrial planets typically have 0-3 moons
      expect(moons.length).toBeGreaterThanOrEqual(0);
      expect(moons.length).toBeLessThanOrEqual(5);

      moons.forEach((moon) => {
        expect(moon.type).toBe(CelestialType.MOON);
        expect(moon.parentId).toBe("test-terrestrial");
        expect(moon.realMass_kg).toBeGreaterThan(0);
        expect(moon.realRadius_m).toBeGreaterThan(0);
      });
    });

    it("generates moons for gas giants", async () => {
      const moons: CelestialObject[] = [];

      const observable = generateMoonsObservable(
        mockRandom,
        mockGasGiantPlanet,
        mockGasGiantPlanet.realMass_kg,
        mockGasGiantPlanet.realRadius_m,
        "test-seed",
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (moon) => moons.push(moon),
          complete: () => resolve(),
        });
      });

      // Gas giants can have many moons
      expect(moons.length).toBeGreaterThanOrEqual(0);
      expect(moons.length).toBeLessThanOrEqual(50);

      moons.forEach((moon) => {
        expect(moon.type).toBe(CelestialType.MOON);
        expect(moon.parentId).toBe("test-gas-giant");
        expect(moon.realMass_kg).toBeGreaterThan(0);
        expect(moon.realRadius_m).toBeGreaterThan(0);
      });
    });

    it("does not generate moons for very close planets", async () => {
      const closePlanet: CelestialObject<PlanetProperties> = {
        ...mockTerrestrialPlanet,
        orbit: {
          ...mockTerrestrialPlanet.orbit,
          realSemiMajorAxis_m: CONST.AU_TO_METERS * 0.1, // 0.1 AU - very close
        },
      };

      const moons: CelestialObject[] = [];

      const observable = generateMoonsObservable(
        mockRandom,
        closePlanet,
        closePlanet.realMass_kg,
        closePlanet.realRadius_m,
        "test-seed",
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (moon) => moons.push(moon),
          complete: () => resolve(),
        });
      });

      // Very close planets should not have moons due to stellar tides
      expect(moons.length).toBe(0);
    });

    it("generates deterministic results with same seed", async () => {
      const moons1: CelestialObject[] = [];
      const moons2: CelestialObject[] = [];

      const observable1 = generateMoonsObservable(
        mockRandom,
        mockTerrestrialPlanet,
        mockTerrestrialPlanet.realMass_kg,
        mockTerrestrialPlanet.realRadius_m,
        "test-seed",
      );

      const observable2 = generateMoonsObservable(
        mockRandom,
        mockTerrestrialPlanet,
        mockTerrestrialPlanet.realMass_kg,
        mockTerrestrialPlanet.realRadius_m,
        "test-seed",
      );

      await new Promise<void>((resolve) => {
        observable1.subscribe({
          next: (moon) => moons1.push(moon),
          complete: () => {
            observable2.subscribe({
              next: (moon) => moons2.push(moon),
              complete: () => resolve(),
            });
          },
        });
      });

      expect(moons1.length).toBe(moons2.length);

      for (let i = 0; i < moons1.length; i++) {
        expect(moons1[i].id).toBe(moons2[i].id);
        expect(moons1[i].name).toBe(moons2[i].name);
        expect(moons1[i].realMass_kg).toBe(moons2[i].realMass_kg);
        expect(moons1[i].realRadius_m).toBe(moons2[i].realRadius_m);
      }
    });

    it("handles different planet masses correctly", async () => {
      const smallPlanet: CelestialObject<PlanetProperties> = {
        ...mockTerrestrialPlanet,
        realMass_kg: CONST.SOLAR_MASS_KG * 1e-7, // Small planet
      };

      const largePlanet: CelestialObject<PlanetProperties> = {
        ...mockTerrestrialPlanet,
        realMass_kg: CONST.SOLAR_MASS_KG * 1e-5, // Large planet
      };

      const smallMoons: CelestialObject[] = [];
      const largeMoons: CelestialObject[] = [];

      const smallObservable = generateMoonsObservable(
        mockRandom,
        smallPlanet,
        smallPlanet.realMass_kg,
        smallPlanet.realRadius_m,
        "test-seed",
      );

      const largeObservable = generateMoonsObservable(
        mockRandom,
        largePlanet,
        largePlanet.realMass_kg,
        largePlanet.realRadius_m,
        "test-seed",
      );

      await new Promise<void>((resolve) => {
        smallObservable.subscribe({
          next: (moon) => smallMoons.push(moon),
          complete: () => {
            largeObservable.subscribe({
              next: (moon) => largeMoons.push(moon),
              complete: () => resolve(),
            });
          },
        });
      });

      // Larger planets should generally have more moons
      expect(largeMoons.length).toBeGreaterThanOrEqual(smallMoons.length);
    });

    it("handles different distances from star correctly", async () => {
      const closePlanet: CelestialObject<PlanetProperties> = {
        ...mockTerrestrialPlanet,
        orbit: {
          ...mockTerrestrialPlanet.orbit,
          realSemiMajorAxis_m: CONST.AU_TO_METERS * 0.5, // 0.5 AU
        },
      };

      const distantPlanet: CelestialObject<PlanetProperties> = {
        ...mockTerrestrialPlanet,
        orbit: {
          ...mockTerrestrialPlanet.orbit,
          realSemiMajorAxis_m: CONST.AU_TO_METERS * 10, // 10 AU
        },
      };

      const closeMoons: CelestialObject[] = [];
      const distantMoons: CelestialObject[] = [];

      const closeObservable = generateMoonsObservable(
        mockRandom,
        closePlanet,
        closePlanet.realMass_kg,
        closePlanet.realRadius_m,
        "test-seed",
      );

      const distantObservable = generateMoonsObservable(
        mockRandom,
        distantPlanet,
        distantPlanet.realMass_kg,
        distantPlanet.realRadius_m,
        "test-seed",
      );

      await new Promise<void>((resolve) => {
        closeObservable.subscribe({
          next: (moon) => closeMoons.push(moon),
          complete: () => {
            distantObservable.subscribe({
              next: (moon) => distantMoons.push(moon),
              complete: () => resolve(),
            });
          },
        });
      });

      // Distant planets should generally have more moons
      expect(distantMoons.length).toBeGreaterThanOrEqual(closeMoons.length);
    });

    it("generates moons with proper spacing", async () => {
      const moons: CelestialObject[] = [];

      const observable = generateMoonsObservable(
        mockRandom,
        mockGasGiantPlanet,
        mockGasGiantPlanet.realMass_kg,
        mockGasGiantPlanet.realRadius_m,
        "test-seed",
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (moon) => moons.push(moon),
          complete: () => resolve(),
        });
      });

      if (moons.length > 1) {
        // Check that moons are properly spaced
        const distances = moons
          .map((moon) => moon.orbit.realSemiMajorAxis_m)
          .sort((a, b) => a - b);

        for (let i = 1; i < distances.length; i++) {
          // Each moon should be further out than the previous one
          expect(distances[i]).toBeGreaterThan(distances[i - 1]);

          // Spacing should be reasonable (not too close, not too far)
          const spacing = distances[i] / distances[i - 1];
          expect(spacing).toBeGreaterThan(1.2); // At least 20% spacing
          expect(spacing).toBeLessThan(10); // Not more than 10x spacing
        }
      }
    });

    it("handles edge cases gracefully", async () => {
      const edgeCases = [
        // Very small planet
        {
          ...mockTerrestrialPlanet,
          realMass_kg: CONST.SOLAR_MASS_KG * 1e-8,
          realRadius_m: 1000000,
        },
        // Very large planet
        {
          ...mockTerrestrialPlanet,
          realMass_kg: CONST.SOLAR_MASS_KG * 1e-4,
          realRadius_m: 100000000,
        },
        // Planet at edge of habitable zone
        {
          ...mockTerrestrialPlanet,
          orbit: {
            ...mockTerrestrialPlanet.orbit,
            realSemiMajorAxis_m: CONST.AU_TO_METERS * 0.2, // Just above the 0.2 AU limit
          },
        },
      ];

      for (const edgeCase of edgeCases) {
        const moons: CelestialObject[] = [];

        const observable = generateMoonsObservable(
          mockRandom,
          edgeCase,
          edgeCase.realMass_kg,
          edgeCase.realRadius_m,
          "test-seed",
        );

        await new Promise<void>((resolve) => {
          observable.subscribe({
            next: (moon) => moons.push(moon),
            complete: () => resolve(),
          });
        });

        // Should not crash and should generate reasonable results
        expect(moons.length).toBeGreaterThanOrEqual(0);
        expect(moons.length).toBeLessThanOrEqual(100);

        moons.forEach((moon) => {
          expect(moon.type).toBe(CelestialType.MOON);
          expect(moon.parentId).toBe(edgeCase.id);
          expect(moon.realMass_kg).toBeGreaterThan(0);
          expect(moon.realRadius_m).toBeGreaterThan(0);
        });
      }
    });

    it("generates moons with realistic orbital parameters", async () => {
      const moons: CelestialObject[] = [];

      const observable = generateMoonsObservable(
        mockRandom,
        mockTerrestrialPlanet,
        mockTerrestrialPlanet.realMass_kg,
        mockTerrestrialPlanet.realRadius_m,
        "test-seed",
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (moon) => moons.push(moon),
          complete: () => resolve(),
        });
      });

      moons.forEach((moon) => {
        // Check orbital parameters
        expect(moon.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
        expect(moon.orbit.eccentricity).toBeGreaterThanOrEqual(0);
        expect(moon.orbit.eccentricity).toBeLessThan(1);
        expect(moon.orbit.period_s).toBeGreaterThan(0);
        expect(moon.orbit.siderealRotationPeriod_s).toBeGreaterThan(0);

        // Check that moon orbits are within reasonable bounds
        const moonDistance_radii =
          moon.orbit.realSemiMajorAxis_m / mockTerrestrialPlanet.realRadius_m;
        expect(moonDistance_radii).toBeGreaterThan(5); // At least 5 planetary radii
        expect(moonDistance_radii).toBeLessThan(1000); // Not more than 1000 planetary radii
      });
    });
  });
});
