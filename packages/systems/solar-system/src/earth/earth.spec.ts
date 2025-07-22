import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { earthSystemBodies } from "./index";
import { sun } from "../sol/star";
import { celestialManager, celestial } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

describe("Earth System Objects", () => {
  beforeEach(() => {
    // Clear any existing state before each test
    celestialManager.clearState();
  });

  afterEach(() => {
    // Clean up after each test
    celestialManager.clearState();
  });

  describe("Earth and Luna Configuration Objects", () => {
    it("should have correct Earth and Luna objects in earthSystemBodies", () => {
      // Check that we have both Earth and Luna
      expect(earthSystemBodies).toHaveLength(2);

      const earthObject = earthSystemBodies.find((obj) => obj.id === "earth");
      const lunaObject = earthSystemBodies.find((obj) => obj.id === "luna");

      expect(earthObject).toBeDefined();
      expect(lunaObject).toBeDefined();
    });

    it("should have Earth with correct properties", () => {
      const earth = earthSystemBodies.find((obj) => obj.id === "earth")!;

      expect(earth.name).toBe("Earth");
      expect(earth.type).toBe(CelestialType.PLANET);
      expect(earth.status).toBe(CelestialStatus.ACTIVE);
      expect(earth.parentId).toBe("sun");

      // Check Earth's physical properties
      expect(earth.realMass_kg).toBe(5.972168e24); // Exact Earth mass from data file
      expect(earth.realRadius_m).toBeCloseTo(6371000, 0); // Should be close to Earth's radius
      expect(earth.temperature).toBeGreaterThan(0);
      expect(earth.albedo).toBeGreaterThan(0);
      expect(earth.albedo).toBeLessThanOrEqual(1);

      // Check Earth's orbital properties
      expect(earth.orbit.realSemiMajorAxis_m).toBeCloseTo(
        1.4960015226288e11,
        0,
      ); // Exact value from data file
      expect(earth.orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(earth.orbit.eccentricity).toBeLessThan(1);
      expect(earth.orbit.period_s).toBeGreaterThan(0);

      // Check Earth's properties
      expect(earth.properties).toBeDefined();
      const earthProps = earth.properties as PlanetProperties;
      expect(earthProps.type).toBe(CelestialType.PLANET);
      expect(earthProps.isMoon).toBe(false);
      expect(earthProps.classType).toBe(PlanetType.TERRESTRIAL);
      expect(earthProps.composition).toContain("liquid water");
      expect(earthProps.composition).toContain("nitrogen-oxygen atmosphere");
    });

    it("should have Luna with correct properties", () => {
      const luna = earthSystemBodies.find((obj) => obj.id === "luna")!;

      expect(luna.name).toBe("Moon");
      expect(luna.type).toBe(CelestialType.MOON);
      expect(luna.status).toBe(CelestialStatus.ACTIVE);
      expect(luna.parentId).toBe("earth");

      // Check Luna's physical properties
      expect(luna.realMass_kg).toBe(7.346e22); // Exact Luna mass from data file
      expect(luna.realRadius_m).toBe(1737.4 * 1000); // Exact Luna radius from data file
      expect(luna.temperature).toBeGreaterThan(0);
      expect(luna.albedo).toBeGreaterThan(0);
      expect(luna.albedo).toBeLessThanOrEqual(1);

      // Check Luna's orbital properties
      expect(luna.orbit.realSemiMajorAxis_m).toBeCloseTo(384322400, 0); // Exact value from data file
      expect(luna.orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(luna.orbit.eccentricity).toBeLessThan(1);
      expect(luna.orbit.period_s).toBeGreaterThan(0);

      // Check Luna's properties
      expect(luna.properties).toBeDefined();
      const lunaProps = luna.properties as PlanetProperties;
      expect(lunaProps.type).toBe(CelestialType.MOON);
      expect(lunaProps.isMoon).toBe(true);
      expect(lunaProps.classType).toBe(PlanetType.ROCKY);
    });

    it("should have Earth with correct atmospheric properties", () => {
      const earth = earthSystemBodies.find((obj) => obj.id === "earth")!;

      // Check Earth's atmospheric properties
      expect(earth.properties).toBeDefined();
      const earthProps = earth.properties as PlanetProperties;
      expect(earthProps.atmosphere).toBeDefined();
      expect(earthProps.atmosphere?.glowColor).toBe("#87CEEB");
      expect(earthProps.atmosphere?.intensity).toBe(0.6);
      expect(earthProps.atmosphere?.power).toBe(1.2);
      expect(earthProps.atmosphere?.thickness).toBe(0.25);
    });

    it("should have Earth with correct surface properties", () => {
      const earth = earthSystemBodies.find((obj) => obj.id === "earth")!;

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

    it("should be able to add Earth system to celestial manager", () => {
      // Add sun first using the existing sun object
      celestialManager.addObjects([sun]);

      // Add Earth system
      celestialManager.addObjects(earthSystemBodies);

      // Get all objects
      const objects = celestial.getObjects();

      // Check Earth
      const earth = objects["earth"];
      expect(earth).toBeDefined();
      expect(earth.name).toBe("Earth");
      expect(earth.type).toBe(CelestialType.PLANET);
      expect(earth.status).toBe(CelestialStatus.ACTIVE);
      expect(earth.parentId).toBe("sun");

      // Check Luna
      const luna = objects["luna"];
      expect(luna).toBeDefined();
      expect(luna.name).toBe("Moon");
      expect(luna.type).toBe(CelestialType.MOON);
      expect(luna.status).toBe(CelestialStatus.ACTIVE);
      expect(luna.parentId).toBe("earth");
    });
  });
});
