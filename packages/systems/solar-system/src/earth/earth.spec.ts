import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeEarth } from "./index";
import { celestial } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

describe("Earth System Initialization", () => {
  beforeEach(() => {
    // Clear any existing state before each test
    celestial.clearState();
  });

  afterEach(() => {
    // Clean up after each test
    celestial.clearState();
  });

  describe("initializeEarth", () => {
    it("should create Earth and Luna with correct properties", () => {
      // Create a mock sun first
      const sunId = "sun";
      celestial.addCelestial({
        id: sunId,
        name: "Sun",
        type: CelestialType.STAR,
        status: CelestialStatus.ACTIVE,
        realMass_kg: 1.989e30,
        realRadius_m: 696340000,
        temperature: 5778,
        albedo: 0.3,
        orbit: {
          realSemiMajorAxis_m: 0,
          eccentricity: 0,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: 0,
          period_s: 0,
        },
        physicsStateReal: {
          id: sunId,
          mass_kg: 1.989e30,
          position_m: { x: 0, y: 0, z: 0 } as any,
          velocity_mps: { x: 0, y: 0, z: 0 } as any,
        },
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G2V",
          luminosity: 1.0,
          color: "#FFFFE0",
        },
      });

      // Initialize Earth system
      const earthId = initializeEarth(sunId);

      // Get all objects
      const objects = celestial.getObjects();

      // Check Earth
      const earth = objects[earthId];
      expect(earth).toBeDefined();
      expect(earth.name).toBe("Earth");
      expect(earth.type).toBe(CelestialType.PLANET);
      expect(earth.status).toBe(CelestialStatus.ACTIVE);
      expect(earth.parentId).toBe(sunId);

      // Check Earth's physical properties
      expect(earth.realMass_kg).toBeCloseTo(5.972e24, 1); // Should be close to Earth's mass
      expect(earth.realRadius_m).toBeCloseTo(6371000, 0); // Should be close to Earth's radius
      expect(earth.temperature).toBeGreaterThan(0);
      expect(earth.albedo).toBeGreaterThan(0);
      expect(earth.albedo).toBeLessThanOrEqual(1);

      // Check Earth's orbital properties
      expect(earth.orbit.realSemiMajorAxis_m).toBeCloseTo(1.496e11, 0); // ~1 AU
      expect(earth.orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(earth.orbit.eccentricity).toBeLessThan(1);
      expect(earth.orbit.period_s).toBeGreaterThan(0);

      // Check Earth's properties
      expect(earth.properties).toBeDefined();
      const earthProps = earth.properties as PlanetProperties;
      expect(earthProps.type).toBe(CelestialType.PLANET);
      expect(earthProps.isMoon).toBe(false);
      expect(earthProps.composition).toContain("liquid water");
      expect(earthProps.composition).toContain("nitrogen-oxygen atmosphere");

      // Check Luna
      const luna = objects["luna"];
      expect(luna).toBeDefined();
      expect(luna.name).toBe("Moon");
      expect(luna.type).toBe(CelestialType.MOON);
      expect(luna.status).toBe(CelestialStatus.ACTIVE);
      expect(luna.parentId).toBe(earthId);

      // Check Luna's physical properties
      expect(luna.realMass_kg).toBeCloseTo(7.342e22, 1); // Should be close to Moon's mass
      expect(luna.realRadius_m).toBeCloseTo(1737400, 0); // Should be close to Moon's radius
      expect(luna.temperature).toBeGreaterThan(0);
      expect(luna.albedo).toBeGreaterThan(0);
      expect(luna.albedo).toBeLessThanOrEqual(1);

      // Check Luna's orbital properties
      expect(luna.orbit.realSemiMajorAxis_m).toBeCloseTo(384400000, 0); // ~384,400 km
      expect(luna.orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(luna.orbit.eccentricity).toBeLessThan(1);
      expect(luna.orbit.period_s).toBeGreaterThan(0);

      // Check Luna's properties
      expect(luna.properties).toBeDefined();
      const lunaProps = luna.properties as PlanetProperties;
      expect(lunaProps.type).toBe(CelestialType.MOON);
      expect(lunaProps.isMoon).toBe(true);
      expect(lunaProps.parentPlanet).toBe(earthId);
      expect(lunaProps.composition).toContain("silicates");
    });

    it("should create Earth with correct atmospheric properties", () => {
      // Create a mock sun first
      const sunId = "sun";
      celestial.addCelestial({
        id: sunId,
        name: "Sun",
        type: CelestialType.STAR,
        status: CelestialStatus.ACTIVE,
        realMass_kg: 1.989e30,
        realRadius_m: 696340000,
        temperature: 5778,
        albedo: 0.3,
        orbit: {
          realSemiMajorAxis_m: 0,
          eccentricity: 0,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: 0,
          period_s: 0,
        },
        physicsStateReal: {
          id: sunId,
          mass_kg: 1.989e30,
          position_m: { x: 0, y: 0, z: 0 } as any,
          velocity_mps: { x: 0, y: 0, z: 0 } as any,
        },
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G2V",
          luminosity: 1.0,
          color: "#FFFFE0",
        },
      });

      // Initialize Earth system
      initializeEarth(sunId);

      // Get Earth
      const objects = celestial.getObjects();
      const earth = objects["earth"];

      // Check Earth's atmospheric properties
      expect(earth.properties).toBeDefined();
      const earthProps = earth.properties as PlanetProperties;
      expect(earthProps.atmosphere).toBeDefined();
      expect(earthProps.atmosphere?.glowColor).toBe("#87CEEB");
      expect(earthProps.atmosphere?.intensity).toBe(0.6);
      expect(earthProps.atmosphere?.power).toBe(1.2);
      expect(earthProps.atmosphere?.thickness).toBe(0.25);
    });

    it("should create Earth with correct surface properties", () => {
      // Create a mock sun first
      const sunId = "sun";
      celestial.addCelestial({
        id: sunId,
        name: "Sun",
        type: CelestialType.STAR,
        status: CelestialStatus.ACTIVE,
        realMass_kg: 1.989e30,
        realRadius_m: 696340000,
        temperature: 5778,
        albedo: 0.3,
        orbit: {
          realSemiMajorAxis_m: 0,
          eccentricity: 0,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: 0,
          period_s: 0,
        },
        physicsStateReal: {
          id: sunId,
          mass_kg: 1.989e30,
          position_m: { x: 0, y: 0, z: 0 } as any,
          velocity_mps: { x: 0, y: 0, z: 0 } as any,
        },
        properties: {
          type: CelestialType.STAR,
          isMainStar: true,
          spectralClass: "G2V",
          luminosity: 1.0,
          color: "#FFFFE0",
        },
      });

      // Initialize Earth system
      initializeEarth(sunId);

      // Get Earth
      const objects = celestial.getObjects();
      const earth = objects["earth"];

      // Check Earth's surface properties
      expect(earth.properties).toBeDefined();
      const earthProps = earth.properties as PlanetProperties;
      expect(earthProps.surface).toBeDefined();
      if (earthProps.surface) {
        expect(earthProps.surface.color1).toBeDefined();
        expect(earthProps.surface.color2).toBeDefined();
        expect(earthProps.surface.color3).toBeDefined();
        expect(earthProps.surface.color4).toBeDefined();
        expect(earthProps.surface.color5).toBeDefined();
        expect(earthProps.surface.roughness).toBeGreaterThanOrEqual(0);
        expect(earthProps.surface.roughness).toBeLessThanOrEqual(1);
        expect(earthProps.surface.octaves).toBeGreaterThan(0);
        expect(earthProps.surface.persistence).toBeGreaterThan(0);
        expect(earthProps.surface.persistence).toBeLessThan(1);
      }
    });
  });
});
