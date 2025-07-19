import { describe, expect, it, beforeEach } from "vitest";
import { generateMoon } from "./moon";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
  type CelestialObject,
} from "@teskooano/data-types";
import * as CONST from "../../constants";

describe("Moon Generator", () => {
  let mockRandom: () => number;
  let mockParentPlanet: CelestialObject<PlanetProperties>;

  beforeEach(() => {
    // Create a deterministic random function for testing
    mockRandom = () => 0.5;

    // Create a mock parent planet (Earth-like)
    mockParentPlanet = {
      id: "test-planet",
      name: "Test Planet",
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
  });

  describe("generateMoon", () => {
    it("generates a valid moon with realistic properties", () => {
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5, // Initial moon distance
        "test-seed",
      );

      expect(result.moonData).toBeDefined();
      expect(result.moonData!.id).toContain("moon-test-planet-");
      expect(result.moonData!.name).toBeDefined();
      expect(result.moonData!.type).toBe(CelestialType.MOON);
      expect(result.moonData!.status).toBe(CelestialStatus.ACTIVE);
      expect(result.moonData!.parentId).toBe("test-planet");
      expect(result.moonData!.realMass_kg).toBeGreaterThan(0);
      expect(result.moonData!.realRadius_m).toBeGreaterThan(0);
      expect(result.moonData!.temperature).toBe(mockParentPlanet.temperature);
      expect(result.moonData!.orbit).toBeDefined();
      expect(result.moonData!.properties).toBeDefined();
    });

    it("generates moon with correct orbital parameters", () => {
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result.moonData).toBeDefined();
      expect(result.moonData!.orbit.realSemiMajorAxis_m).toBeGreaterThan(0);
      expect(result.moonData!.orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(result.moonData!.orbit.eccentricity).toBeLessThan(1);
      expect(result.moonData!.orbit.period_s).toBeGreaterThan(0);
      expect(result.moonData!.orbit.siderealRotationPeriod_s).toBeGreaterThan(
        0,
      );
      expect(result.moonData!.orbit.axialTilt).toBeDefined();
    });

    it("generates moon with correct properties", () => {
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result.moonData).toBeDefined();
      const moonProps = result.moonData!.properties as PlanetProperties;
      expect(moonProps.type).toBe(CelestialType.PLANET);
      expect(moonProps.isMoon).toBe(true);
      expect(moonProps.composition).toBeDefined();
      expect(Array.isArray(moonProps.composition)).toBe(true);
      expect(moonProps.composition.length).toBeGreaterThan(0);
      expect(moonProps.atmosphere).toBeUndefined(); // Most moons lack atmospheres
    });

    it("generates realistic moon size and mass", () => {
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result.moonData).toBeDefined();
      // Moon mass should be much smaller than parent planet
      expect(result.moonData!.realMass_kg).toBeLessThan(
        mockParentPlanet.realMass_kg * 0.1,
      ); // Allow for larger moons
      expect(result.moonData!.realMass_kg).toBeGreaterThan(0);

      // Moon radius should be much smaller than parent planet
      expect(result.moonData!.realRadius_m).toBeLessThan(
        mockParentPlanet.realRadius_m * 0.3,
      );
      expect(result.moonData!.realRadius_m).toBeGreaterThan(0);
    });

    it("respects Hill sphere constraints", () => {
      // Test with a very large moon distance that would exceed Hill sphere
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        1000, // Very large distance
        "test-seed",
      );

      // Should return null if orbit would be unstable
      expect(result.moonData).toBeNull();
    });

    it("adjusts distance to realistic values", () => {
      // Test with a very small moon distance that gets adjusted
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        0.1, // Very small distance that should be adjusted
        "test-seed",
      );

      // The function should adjust the distance to be realistic rather than returning null
      expect(result.moonData).toBeDefined();
      expect(result.moonData!.orbit.realSemiMajorAxis_m).toBeGreaterThan(
        mockParentPlanet.realRadius_m * 5,
      ); // At least 5 planetary radii
    });

    it("handles different parent planet masses", () => {
      // Test with a gas giant
      const gasGiantPlanet: CelestialObject<PlanetProperties> = {
        ...mockParentPlanet,
        id: "gas-giant",
        realMass_kg: CONST.SOLAR_MASS_KG * 1e-3, // Jupiter-like mass
        realRadius_m: 69911000, // Jupiter radius
        properties: {
          type: CelestialType.PLANET,
          classType: PlanetType.TERRESTRIAL, // Will be treated as gas giant in logic
          isMoon: false,
          composition: ["hydrogen", "helium"],
        },
      };

      const result = generateMoon(
        mockRandom,
        gasGiantPlanet,
        gasGiantPlanet.realMass_kg,
        gasGiantPlanet.realRadius_m,
        10,
        "test-seed",
      );

      expect(result.moonData).toBeDefined();
      // Gas giant moons should have different properties
      expect(result.moonData!.realMass_kg).toBeGreaterThan(0);
    });

    it("returns null for invalid parent planet mass", () => {
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        0, // Invalid mass
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result.moonData).toBeNull();
    });

    it("returns null for invalid orbital parameters", () => {
      const invalidPlanet: CelestialObject<PlanetProperties> = {
        ...mockParentPlanet,
        orbit: {
          ...mockParentPlanet.orbit,
          realSemiMajorAxis_m: -1, // Invalid semi-major axis
        },
      };

      const result = generateMoon(
        mockRandom,
        invalidPlanet,
        invalidPlanet.realMass_kg,
        invalidPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result.moonData).toBeNull();
    });

    it("generates deterministic results with same seed", () => {
      const result1 = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      const result2 = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result1.moonData).toBeDefined();
      expect(result2.moonData).toBeDefined();
      expect(result1.moonData!.id).toBe(result2.moonData!.id);
      expect(result1.moonData!.name).toBe(result2.moonData!.name);
      expect(result1.moonData!.realMass_kg).toBe(result2.moonData!.realMass_kg);
      expect(result1.moonData!.realRadius_m).toBe(
        result2.moonData!.realRadius_m,
      );
    });

    it("updates next moon distance correctly", () => {
      const initialDistance = 5;
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        initialDistance,
        "test-seed",
      );

      expect(result.nextLastMoonDistance_radii).toBeGreaterThan(
        initialDistance,
      );
      expect(result.nextLastMoonDistance_radii).toBeLessThan(
        initialDistance * 10,
      ); // Reasonable spacing
    });

    it("handles different formation mechanisms", () => {
      // Test with different random values to trigger different formation mechanisms
      const random1 = () => 0.1; // Likely co-accretion
      const random2 = () => 0.5; // Mixed formation
      const random3 = () => 0.9; // Likely capture

      const result1 = generateMoon(
        random1,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      const result2 = generateMoon(
        random2,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      const result3 = generateMoon(
        random3,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result1.moonData).toBeDefined();
      expect(result2.moonData).toBeDefined();
      expect(result3.moonData).toBeDefined();

      // Different formation mechanisms should produce different properties
      expect(result1.moonData!.realMass_kg).not.toBe(
        result2.moonData!.realMass_kg,
      );
      expect(result2.moonData!.realMass_kg).not.toBe(
        result3.moonData!.realMass_kg,
      );
    });

    it("generates moons with appropriate surface properties", () => {
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result.moonData).toBeDefined();
      const moonProps = result.moonData!.properties as PlanetProperties;
      expect(moonProps.surface).toBeDefined();
      expect(moonProps.surface!.color1).toBeDefined();
      expect(moonProps.surface!.roughness).toBeGreaterThan(0);
      expect(moonProps.surface!.persistence).toBeGreaterThan(0);
    });

    it("generates realistic rotation periods", () => {
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result.moonData).toBeDefined();
      expect(result.moonData!.orbit.siderealRotationPeriod_s).toBeGreaterThan(
        0,
      );

      // Most moons should have rotation periods similar to their orbital periods (tidally locked)
      const orbitalPeriod = result.moonData!.orbit.period_s;
      const rotationPeriod = result.moonData!.orbit.siderealRotationPeriod_s;
      if (rotationPeriod !== undefined) {
        const ratio = rotationPeriod / orbitalPeriod;
        expect(ratio).toBeGreaterThan(0.5);
        expect(ratio).toBeLessThan(2.0);
      }
    });

    it("generates moons with low axial tilt", () => {
      const result = generateMoon(
        mockRandom,
        mockParentPlanet,
        mockParentPlanet.realMass_kg,
        mockParentPlanet.realRadius_m,
        5,
        "test-seed",
      );

      expect(result.moonData).toBeDefined();
      expect(result.moonData!.orbit.axialTilt).toBeDefined();

      // Moons typically have low axial tilt due to tidal forces
      const tilt = result.moonData!.orbit.axialTilt;
      if (tilt !== undefined) {
        expect(tilt.x).toBe(0);
        expect(tilt.y).toBeGreaterThan(0.8); // Low tilt (cosine of small angle)
        expect(tilt.z).toBeLessThan(0.6); // Small tilt (sine of small angle)
      }
    });
  });
});
