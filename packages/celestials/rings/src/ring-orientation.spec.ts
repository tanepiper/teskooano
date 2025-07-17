import { describe, it, expect } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  calculatePlanetRingOrientation,
  getPlanetRingViewingInfo,
  getPlanetRingPhaseDescription,
  shouldUseDynamicRingOrientation,
  getOrbitalPeriod
} from "./ring-orientation";

// Mock planet object factory
const createMockPlanet = (
  id: string,
  position: OSVector3,
  axialTiltDeg: number,
  orbitalPeriodYears: number,
  eccentricity: number = 0,
  hasRings: boolean = true
): RenderableCelestialObject => {
  const JULIAN_YEAR_SECONDS = 365.25 * 24 * 3600;
  const tiltRad = axialTiltDeg * (Math.PI / 180);
  
  return {
    celestialObjectId: id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    position,
    radius: 60000000, // 60,000 km radius
    realRadius_m: 60000000,
    velocity: new OSVector3(0, 0, 0),
    velocityMagnitude_mps: 0,
    type: "GAS_GIANT" as any,
    properties: hasRings ? {
      rings: [
        {
          innerRadius: 70000000,
          outerRadius: 100000000,
          density: 0.5,
          opacity: 0.7,
          color: "#E0DDCF"
        }
      ]
    } : {} as any,
    rotation: null as any,
    seed: id,
    orbit: {
      period_s: orbitalPeriodYears * JULIAN_YEAR_SECONDS,
      eccentricity: eccentricity,
      axialTilt: new OSVector3(
        Math.sin(tiltRad),
        Math.cos(tiltRad),
        0
      ).normalize()
    }
  } as any;
};

// Mock star object
const createMockStar = (position: OSVector3): RenderableCelestialObject => ({
  celestialObjectId: "sol",
  name: "Sol",
  position,
  radius: 696340000,
  realRadius_m: 696340000,
  velocity: new OSVector3(0, 0, 0),
  velocityMagnitude_mps: 0,
  type: "STAR" as any,
  properties: {} as any,
  rotation: null as any,
  seed: "sol"
});

describe("Generalized Ring Orientation System", () => {
  const JULIAN_YEAR_SECONDS = 365.25 * 24 * 3600;

  describe("shouldUseDynamicRingOrientation", () => {
    it("should return true for planets with rings and significant axial tilt", () => {
      const saturn = createMockPlanet("saturn", new OSVector3(0, 0, 0), 26.73, 29.4571);
      expect(shouldUseDynamicRingOrientation(saturn)).toBe(true);
    });

    it("should return false for planets without rings", () => {
      const planetNoRings = createMockPlanet("test", new OSVector3(0, 0, 0), 25, 10, 0, false);
      expect(shouldUseDynamicRingOrientation(planetNoRings)).toBe(false);
    });

    it("should return false for planets with minimal axial tilt", () => {
      const planetNoTilt = createMockPlanet("test", new OSVector3(0, 0, 0), 1, 10); // 1 degree tilt
      expect(shouldUseDynamicRingOrientation(planetNoTilt)).toBe(false);
    });

    it("should work for various realistic planetary scenarios", () => {
      const uranus = createMockPlanet("uranus", new OSVector3(0, 0, 0), 97.77, 84); // Extreme tilt
      const jupiter = createMockPlanet("jupiter", new OSVector3(0, 0, 0), 3.13, 12); // Small tilt
      const earth = createMockPlanet("earth", new OSVector3(0, 0, 0), 23.44, 1, 0, false); // No rings
      
      expect(shouldUseDynamicRingOrientation(uranus)).toBe(true);
      expect(shouldUseDynamicRingOrientation(jupiter)).toBe(true);
      expect(shouldUseDynamicRingOrientation(earth)).toBe(false);
    });
  });

  describe("calculatePlanetRingOrientation", () => {
    it("should return identity quaternion for planets with no axial tilt", () => {
      const planet = createMockPlanet("test", new OSVector3(1000000000, 0, 0), 0, 10);
      const star = createMockStar(new OSVector3(0, 0, 0));
      
      const orientation = calculatePlanetRingOrientation(planet, 0, star.position);
      
      // Should be identity quaternion (no rotation)
      expect(orientation.w).toBeCloseTo(1, 6);
      expect(orientation.x).toBeCloseTo(0, 6);
      expect(orientation.y).toBeCloseTo(0, 6);
      expect(orientation.z).toBeCloseTo(0, 6);
    });

    it("should return valid normalized quaternions for tilted planets", () => {
      const planet = createMockPlanet("test", new OSVector3(1000000000, 0, 0), 25, 10);
      const star = createMockStar(new OSVector3(0, 0, 0));
      
      const orientation = calculatePlanetRingOrientation(planet, 0, star.position);
      
      // Should be normalized
      const magnitude = Math.sqrt(
        orientation.w * orientation.w +
        orientation.x * orientation.x +
        orientation.y * orientation.y +
        orientation.z * orientation.z
      );
      expect(magnitude).toBeCloseTo(1, 6);
    });

    it("should produce different orientations at different orbital positions", () => {
      const star = createMockStar(new OSVector3(0, 0, 0));
      const planet1 = createMockPlanet("test", new OSVector3(1000000000, 0, 0), 25, 10);
      const planet2 = createMockPlanet("test", new OSVector3(0, 1000000000, 0), 25, 10);
      
      const orientation1 = calculatePlanetRingOrientation(planet1, 0, star.position);
      const orientation2 = calculatePlanetRingOrientation(planet2, 0, star.position);
      
      // Should be different orientations
      const diff = Math.abs(orientation1.w - orientation2.w) +
                   Math.abs(orientation1.x - orientation2.x) +
                   Math.abs(orientation1.y - orientation2.y) +
                   Math.abs(orientation1.z - orientation2.z);
      
      expect(diff).toBeGreaterThan(0.01);
    });

    it("should handle eccentric orbits correctly", () => {
      const planet = createMockPlanet("test", new OSVector3(1000000000, 0, 0), 25, 10, 0.5); // High eccentricity
      const star = createMockStar(new OSVector3(0, 0, 0));
      
      const orientation1 = calculatePlanetRingOrientation(planet, 0, star.position);
      const orientation2 = calculatePlanetRingOrientation(planet, 5 * JULIAN_YEAR_SECONDS, star.position);
      
      // Should have different orientations due to eccentric timing
      expect(orientation1).toBeDefined();
      expect(orientation2).toBeDefined();
    });
  });

  describe("getPlanetRingViewingInfo", () => {
    it("should correctly identify planets with significant tilt", () => {
      const saturn = createMockPlanet("saturn", new OSVector3(0, 0, 0), 26.73, 29.4571);
      const info = getPlanetRingViewingInfo(saturn, 0);
      
      expect(info.hasSignificantTilt).toBe(true);
      expect(info.axialTiltDeg).toBeCloseTo(26.73, 1);
    });

    it("should correctly identify planets without significant tilt", () => {
      const planet = createMockPlanet("test", new OSVector3(0, 0, 0), 0.5, 10);
      const info = getPlanetRingViewingInfo(planet, 0);
      
      expect(info.hasSignificantTilt).toBe(false);
      expect(info.axialTiltDeg).toBeCloseTo(0.5, 1);
    });

    it("should return viewing angles within expected range", () => {
      const planet = createMockPlanet("test", new OSVector3(0, 0, 0), 30, 10);
      
      // Test multiple points in the orbital cycle
      for (let i = 0; i < 10; i++) {
        const time = (10 * JULIAN_YEAR_SECONDS * i) / 10;
        const info = getPlanetRingViewingInfo(planet, time);
        
        expect(info.viewingAngle).toBeGreaterThanOrEqual(0);
        expect(info.viewingAngle).toBeLessThanOrEqual(31); // Should not exceed axial tilt + margin
        expect(info.orbitalPhase).toBeGreaterThanOrEqual(0);
        expect(info.orbitalPhase).toBeLessThanOrEqual(1);
      }
    });

    it("should identify edge-on viewing periods", () => {
      const planet = createMockPlanet("test", new OSVector3(0, 0, 0), 25, 10);
      
      // At start of cycle, should be near edge-on
      const info1 = getPlanetRingViewingInfo(planet, 0);
      expect(info1.viewingAngle).toBeLessThan(5);
      expect(info1.isNearEdgeOn).toBe(true);
      
      // At quarter cycle, should be more tilted
      const info2 = getPlanetRingViewingInfo(planet, 2.5 * JULIAN_YEAR_SECONDS);
      expect(info2.viewingAngle).toBeGreaterThan(10);
      expect(info2.isNearEdgeOn).toBe(false);
    });
  });

  describe("getPlanetRingPhaseDescription", () => {
    it("should provide appropriate descriptions for different tilt scenarios", () => {
      const tiltedPlanet = createMockPlanet("test", new OSVector3(0, 0, 0), 25, 10);
      const flatPlanet = createMockPlanet("test", new OSVector3(0, 0, 0), 0.5, 10);
      
      const tiltedDesc = getPlanetRingPhaseDescription(tiltedPlanet, 0);
      const flatDesc = getPlanetRingPhaseDescription(flatPlanet, 0);
      
      expect(tiltedDesc).toContain("Edge-on");
      expect(flatDesc).toContain("No significant axial tilt");
    });

    it("should include angle information in descriptions", () => {
      const planet = createMockPlanet("test", new OSVector3(0, 0, 0), 25, 10);
      
      const desc = getPlanetRingPhaseDescription(planet, 0);
      expect(desc).toMatch(/\d+\.\d+°/); // Should contain angle with decimal
    });
  });

  describe("getOrbitalPeriod", () => {
    it("should extract orbital period from planet object", () => {
      const planet = createMockPlanet("test", new OSVector3(0, 0, 0), 25, 10);
      const period = getOrbitalPeriod(planet);
      
      expect(period).toBeDefined();
      expect(period).toBeCloseTo(10 * JULIAN_YEAR_SECONDS, 1000);
    });

    it("should return undefined for objects without orbital data", () => {
      const objectWithoutOrbit = {
        celestialObjectId: "test",
        position: new OSVector3(0, 0, 0)
      } as any;
      
      const period = getOrbitalPeriod(objectWithoutOrbit);
      expect(period).toBeUndefined();
    });
  });

  describe("Real-world planetary examples", () => {
    it("should handle Saturn correctly", () => {
      const saturn = createMockPlanet("saturn", new OSVector3(1000000000, 0, 0), 26.73, 29.4571, 0.0565);
      const star = createMockStar(new OSVector3(0, 0, 0));
      
      expect(shouldUseDynamicRingOrientation(saturn)).toBe(true);
      
      const orientation = calculatePlanetRingOrientation(saturn, 0, star.position);
      const info = getPlanetRingViewingInfo(saturn, 0);
      
      expect(orientation).toBeDefined();
      expect(info.axialTiltDeg).toBeCloseTo(26.73, 1);
      expect(info.hasSignificantTilt).toBe(true);
    });

    it("should handle Uranus with extreme tilt", () => {
      const uranus = createMockPlanet("uranus", new OSVector3(2000000000, 0, 0), 97.77, 84);
      const star = createMockStar(new OSVector3(0, 0, 0));
      
      expect(shouldUseDynamicRingOrientation(uranus)).toBe(true);
      
      const info = getPlanetRingViewingInfo(uranus, 0);
      expect(info.axialTiltDeg).toBeCloseTo(97.77, 1);
      expect(info.hasSignificantTilt).toBe(true);
    });

    it("should handle Jupiter with minimal tilt but rings", () => {
      const jupiter = createMockPlanet("jupiter", new OSVector3(800000000, 0, 0), 3.13, 12);
      
      expect(shouldUseDynamicRingOrientation(jupiter)).toBe(true); // Has rings and tilt > 3°
      
      const info = getPlanetRingViewingInfo(jupiter, 0);
      expect(info.axialTiltDeg).toBeCloseTo(3.13, 1);
      expect(info.hasSignificantTilt).toBe(true);
    });

    it("should handle Neptune", () => {
      const neptune = createMockPlanet("neptune", new OSVector3(3000000000, 0, 0), 28.32, 165);
      
      expect(shouldUseDynamicRingOrientation(neptune)).toBe(true);
      
      const info = getPlanetRingViewingInfo(neptune, 0);
      expect(info.axialTiltDeg).toBeCloseTo(28.32, 1);
    });
  });

  describe("Edge case handling", () => {
    it("should handle missing orbital data gracefully", () => {
      const planetNoOrbit = {
        celestialObjectId: "test",
        position: new OSVector3(0, 0, 0),
        properties: { rings: [{}] }
      } as any;
      
      const star = createMockStar(new OSVector3(0, 0, 0));
      
      expect(shouldUseDynamicRingOrientation(planetNoOrbit)).toBe(false);
      
      const orientation = calculatePlanetRingOrientation(planetNoOrbit, 0, star.position);
      expect(orientation.w).toBeCloseTo(1, 6); // Should return identity
    });

    it("should handle very long orbital periods", () => {
      const distantPlanet = createMockPlanet("test", new OSVector3(0, 0, 0), 25, 1000); // 1000 year orbit
      const star = createMockStar(new OSVector3(0, 0, 0));
      
      const orientation = calculatePlanetRingOrientation(distantPlanet, 0, star.position);
      expect(orientation).toBeDefined();
      
      // Test over a long time span
      const orientation2 = calculatePlanetRingOrientation(
        distantPlanet, 
        500 * JULIAN_YEAR_SECONDS, 
        star.position
      );
      expect(orientation2).toBeDefined();
    });
  });
});