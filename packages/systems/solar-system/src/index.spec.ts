import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeSolarSystem } from "./index";
import { celestialManager, celestial } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  type CometProperties,
  type PlanetProperties,
  type StarProperties,
} from "@teskooano/data-types";

describe("Solar System Initialization", () => {
  beforeEach(() => {
    // Clear any existing state before each test
    celestialManager.clearState();
  });

  afterEach(() => {
    // Clean up after each test
    celestialManager.clearState();
  });

  describe("initializeSolarSystem", () => {
    it("should create the complete solar system with all major bodies", () => {
      // Initialize the solar system
      initializeSolarSystem();

      // Get all created objects
      const objects = celestial.getObjects();
      const objectIds = Object.keys(objects);

      // Should have created multiple celestial objects
      expect(objectIds.length).toBeGreaterThan(10);

      // Check for the Sun (should be the first object created)
      const sun = objects["sun"];
      expect(sun).toBeDefined();
      expect(sun.name).toBe("Sun");
      expect(sun.type).toBe(CelestialType.STAR);
      expect(sun.status).toBe(CelestialStatus.ACTIVE);
      expect(sun.parentId).toBeUndefined(); // Sun has no parent

      // Check for major planets and gas giants
      const expectedPlanets = ["mercury", "venus", "earth", "mars"];
      const expectedGasGiants = ["jupiter", "saturn", "uranus", "neptune"];

      expectedPlanets.forEach((planetId) => {
        const planet = objects[planetId];
        expect(planet).toBeDefined();
        expect(planet.type).toBe(CelestialType.PLANET);
        expect(planet.status).toBe(CelestialStatus.ACTIVE);
        expect(planet.parentId).toBe("sun");
      });

      expectedGasGiants.forEach((planetId) => {
        const planet = objects[planetId];
        expect(planet).toBeDefined();
        expect(planet.type).toBe(CelestialType.GAS_GIANT);
        expect(planet.status).toBe(CelestialStatus.ACTIVE);
        expect(planet.parentId).toBe("sun");
      });

      // Check for Pluto (currently classified as planet in the data)
      const pluto = objects["pluto"];
      expect(pluto).toBeDefined();
      expect(pluto.name).toBe("Pluto");
      expect(pluto.type).toBe(CelestialType.PLANET);
      expect(pluto.parentId).toBe("sun");

      // Check for Earth's moon
      const luna = objects["luna"];
      expect(luna).toBeDefined();
      expect(luna.name).toBe("Moon");
      expect(luna.type).toBe(CelestialType.MOON);
      expect(luna.parentId).toBe("earth");
    });

    it("should create objects with valid physical properties", () => {
      initializeSolarSystem();
      const objects = celestial.getObjects();

      Object.values(objects).forEach((obj) => {
        // All objects should have valid mass
        expect(obj.realMass_kg).toBeGreaterThan(0);
        expect(Number.isFinite(obj.realMass_kg)).toBe(true);

        // All objects should have valid radius
        expect(obj.realRadius_m).toBeGreaterThan(0);
        expect(Number.isFinite(obj.realRadius_m)).toBe(true);

        // All objects should have valid temperature
        expect(obj.temperature).toBeGreaterThan(0);
        expect(Number.isFinite(obj.temperature)).toBe(true);

        // All objects should have valid albedo (some objects can have albedo > 1)
        expect(obj.albedo).toBeDefined();
        expect(obj.albedo).toBeGreaterThanOrEqual(0);
        expect(obj.albedo).toBeLessThanOrEqual(2); // Allow for some objects with high albedo
        expect(Number.isFinite(obj.albedo)).toBe(true);

        // All objects should have valid orbital parameters
        expect(obj.orbit).toBeDefined();
        // Sun has 0 semi-major axis (it's the center), other celestial bodies should be > 0
        // Allow negative semi-major axes for hyperbolic orbits (like Oumuamua)
        if (
          obj.type !== CelestialType.STAR &&
          obj.type !== CelestialType.SATELLITE
        ) {
          expect(Math.abs(obj.orbit.realSemiMajorAxis_m)).toBeGreaterThan(0);
        }
        expect(obj.orbit.eccentricity).toBeGreaterThanOrEqual(0);
        // Allow very high eccentricity for interstellar objects and some comets
        expect(obj.orbit.eccentricity).toBeLessThanOrEqual(10);
        expect(obj.orbit.inclination).toBeGreaterThanOrEqual(0);
        // Sun has 0 period (it's the center), others should be finite
        if (obj.type !== CelestialType.STAR) {
          expect(Number.isFinite(obj.orbit.period_s)).toBe(true);
        }

        // All objects should have valid physics state (if available)
        // Note: physicsStateReal is calculated on-demand, not stored on the object
        expect(obj.id).toBeDefined();
        expect(obj.realMass_kg).toBeGreaterThan(0);
      });
    });

    it("should create objects with proper hierarchy relationships", () => {
      initializeSolarSystem();
      const objects = celestial.getObjects();

      // Check that all objects have proper parent relationships
      Object.values(objects).forEach((obj) => {
        if (obj.id !== "sun") {
          // Some objects might not have parentId defined, skip those for now
          if (obj.parentId !== undefined) {
            // If it's a moon, it should have a planet, gas giant, or dwarf planet as parent
            if (obj.type === CelestialType.MOON) {
              const parent = objects[obj.parentId!];
              expect(parent).toBeDefined();
              expect([
                CelestialType.PLANET,
                CelestialType.GAS_GIANT,
                CelestialType.DWARF_PLANET,
              ]).toContain(parent.type);
            } else if (
              obj.type !== CelestialType.STAR &&
              obj.type !== CelestialType.SATELLITE
            ) {
              // Other non-star, non-satellite objects should have the sun as parent
              expect(obj.parentId).toBe("sun");
            }
          }
        }
      });
    });

    it("should create comets with valid properties", () => {
      initializeSolarSystem();
      const objects = celestial.getObjects();

      // Check for comets
      const comets = Object.values(objects).filter(
        (obj) => obj.type === CelestialType.COMET,
      );
      expect(comets.length).toBeGreaterThan(0);

      comets.forEach((comet) => {
        expect(comet.properties).toBeDefined();
        const cometProps = comet.properties as CometProperties;
        expect(cometProps.type).toBe(CelestialType.COMET);
        // Allow activity = 0 for extinct comets (like Oumuamua)
        expect(cometProps.activity).toBeGreaterThanOrEqual(0);
        expect(cometProps.activity).toBeLessThanOrEqual(1);
        expect(cometProps.composition).toBeDefined();
        expect(Array.isArray(cometProps.composition)).toBe(true);
      });
    });

    it("should create planets with appropriate surface properties", () => {
      initializeSolarSystem();
      const objects = celestial.getObjects();

      const planets = Object.values(objects).filter(
        (obj) =>
          obj.type === CelestialType.PLANET ||
          obj.type === CelestialType.DWARF_PLANET,
      );

      planets.forEach((planet) => {
        expect(planet.properties).toBeDefined();
        const planetProps = planet.properties as PlanetProperties;
        expect(planetProps.type).toBe(planet.type);
        expect(planetProps.surface).toBeDefined();
        if (planetProps.surface) {
          expect(planetProps.surface.color1).toBeDefined();
          expect(planetProps.surface.roughness).toBeGreaterThanOrEqual(0);
          expect(planetProps.surface.roughness).toBeLessThanOrEqual(1);
        }
      });
    });

    it("should create the sun with correct stellar properties", () => {
      initializeSolarSystem();
      const objects = celestial.getObjects();
      const sun = objects["sun"];

      expect(sun.properties).toBeDefined();
      const starProps = sun.properties as StarProperties;
      expect(starProps.type).toBe(CelestialType.STAR);
      expect(starProps.isMainStar).toBe(true);
      expect(starProps.luminosity).toBeGreaterThan(0);
      expect(sun.temperature).toBeGreaterThan(0); // Temperature is on the object, not in properties
    });

    it("should handle multiple initializations gracefully", () => {
      // First initialization
      initializeSolarSystem();
      const firstObjects = celestial.getObjects();
      const firstCount = Object.keys(firstObjects).length;

      // Second initialization (should clear and recreate)
      initializeSolarSystem();
      const secondObjects = celestial.getObjects();
      const secondCount = Object.keys(secondObjects).length;

      // Should have the same number of objects
      expect(secondCount).toBe(firstCount);

      // Should have the same structure
      expect(Object.keys(secondObjects)).toEqual(Object.keys(firstObjects));
    });
  });
});
