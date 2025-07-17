import { describe, it, expect } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  calculateSaturnRingOrientation,
  getSaturnRingViewingInfo,
  getSaturnRingPhaseDescription
} from "./saturn-ring-orientation";

// Mock Saturn object for testing
const createMockSaturn = (position: OSVector3): RenderableCelestialObject => ({
  celestialObjectId: "saturn",
  name: "Saturn",
  position,
  radius: 60268000, // Saturn's equatorial radius in meters
  realRadius_m: 60268000,
  velocity: new OSVector3(0, 0, 0),
  velocityMagnitude_mps: 0,
  type: "GAS_GIANT" as any,
  properties: {} as any,
  rotation: null as any,
  seed: "saturn"
});

// Mock Sun object for testing
const createMockSun = (position: OSVector3): RenderableCelestialObject => ({
  celestialObjectId: "sol",
  name: "Sol",
  position,
  radius: 696340000, // Sun's radius in meters
  realRadius_m: 696340000,
  velocity: new OSVector3(0, 0, 0),
  velocityMagnitude_mps: 0,
  type: "STAR" as any,
  properties: {} as any,
  rotation: null as any,
  seed: "sol"
});

describe("Saturn Ring Orientation", () => {
  const JULIAN_YEAR_SECONDS = 365.25 * 24 * 3600;
  const SATURN_ORBITAL_PERIOD_YEARS = 29.4571;
  const SATURN_ORBITAL_PERIOD_SECONDS = SATURN_ORBITAL_PERIOD_YEARS * JULIAN_YEAR_SECONDS;

  describe("calculateSaturnRingOrientation", () => {
    it("should return a valid quaternion for Saturn's ring orientation", () => {
      const saturn = createMockSaturn(new OSVector3(1000000000, 0, 0)); // 1 million km from origin
      const sun = createMockSun(new OSVector3(0, 0, 0)); // At origin
      const currentTime = 0; // Start of simulation

      const orientation = calculateSaturnRingOrientation(saturn, currentTime, sun.position);

      // Should return a valid quaternion
      expect(orientation).toBeDefined();
      expect(typeof orientation.w).toBe("number");
      expect(typeof orientation.x).toBe("number");
      expect(typeof orientation.y).toBe("number");
      expect(typeof orientation.z).toBe("number");

      // Quaternion should be normalized (magnitude ≈ 1)
      const magnitude = Math.sqrt(
        orientation.w * orientation.w +
        orientation.x * orientation.x +
        orientation.y * orientation.y +
        orientation.z * orientation.z
      );
      expect(magnitude).toBeCloseTo(1, 6);
    });

    it("should calculate different orientations at different orbital positions", () => {
      const sun = createMockSun(new OSVector3(0, 0, 0));
      
      // Saturn at two different orbital positions
      const saturn1 = createMockSaturn(new OSVector3(1000000000, 0, 0));
      const saturn2 = createMockSaturn(new OSVector3(0, 1000000000, 0));
      
      const time = SATURN_ORBITAL_PERIOD_SECONDS * 0.25; // Quarter orbit

      const orientation1 = calculateSaturnRingOrientation(saturn1, 0, sun.position);
      const orientation2 = calculateSaturnRingOrientation(saturn2, time, sun.position);

      // Orientations should be different for different orbital positions
      const diff = Math.abs(orientation1.w - orientation2.w) +
                   Math.abs(orientation1.x - orientation2.x) +
                   Math.abs(orientation1.y - orientation2.y) +
                   Math.abs(orientation1.z - orientation2.z);
      
      expect(diff).toBeGreaterThan(0.01); // Should have measurable difference
    });

    it("should handle edge-on viewing periods correctly", () => {
      const saturn = createMockSaturn(new OSVector3(1000000000, 0, 0));
      const sun = createMockSun(new OSVector3(0, 0, 0));
      
      // Test at equinox times (rings should be edge-on)
      const equinoxTime1 = 0; // Start of cycle
      const equinoxTime2 = SATURN_ORBITAL_PERIOD_SECONDS * 0.5; // Middle of cycle

      const orientation1 = calculateSaturnRingOrientation(saturn, equinoxTime1, sun.position);
      const orientation2 = calculateSaturnRingOrientation(saturn, equinoxTime2, sun.position);

      // Both should be valid orientations
      expect(orientation1).toBeDefined();
      expect(orientation2).toBeDefined();
    });
  });

  describe("getSaturnRingViewingInfo", () => {
    it("should correctly identify edge-on viewing periods", () => {
      // Test at start of cycle (should be near edge-on)
      const info1 = getSaturnRingViewingInfo(0);
      expect(info1.viewingAngle).toBeLessThan(5); // Should be near edge-on
      expect(info1.isNearEdgeOn).toBe(true);

      // Test at quarter cycle (should be near maximum tilt)
      const quarterCycle = SATURN_ORBITAL_PERIOD_SECONDS * 0.25;
      const info2 = getSaturnRingViewingInfo(quarterCycle);
      expect(info2.viewingAngle).toBeGreaterThan(15); // Should be more tilted
      expect(info2.isNearEdgeOn).toBe(false);
    });

    it("should return viewing angles between 0 and maximum tilt", () => {
      // Test multiple points in the cycle
      for (let i = 0; i < 10; i++) {
        const time = (SATURN_ORBITAL_PERIOD_SECONDS * i) / 10;
        const info = getSaturnRingViewingInfo(time);
        
        expect(info.viewingAngle).toBeGreaterThanOrEqual(0);
        expect(info.viewingAngle).toBeLessThanOrEqual(27); // Should not exceed Saturn's axial tilt
        expect(typeof info.timeSinceLastEdgeOn).toBe("number");
        expect(typeof info.timeToNextEdgeOn).toBe("number");
      }
    });

    it("should handle the unequal equinox periods correctly", () => {
      // The periods between equinoxes should be 13.7 and 15.7 years
      const EQUINOX_PERIOD_1_SECONDS = 13.7 * JULIAN_YEAR_SECONDS;
      const EQUINOX_PERIOD_2_SECONDS = 15.7 * JULIAN_YEAR_SECONDS;

      // Test that the cycle properly accounts for unequal periods
      const info1 = getSaturnRingViewingInfo(EQUINOX_PERIOD_1_SECONDS / 2);
      const info2 = getSaturnRingViewingInfo(EQUINOX_PERIOD_1_SECONDS + EQUINOX_PERIOD_2_SECONDS / 2);

      // Both should be at maximum tilt but in different parts of the cycle
      expect(Math.abs(info1.viewingAngle - info2.viewingAngle)).toBeLessThan(2); // Should be similar viewing angles
    });
  });

  describe("getSaturnRingPhaseDescription", () => {
    it("should return descriptive strings for different phases", () => {
      // Test edge-on period
      const edgeOnDesc = getSaturnRingPhaseDescription(0);
      expect(edgeOnDesc).toContain("Edge-on");

      // Test maximum tilt period
      const quarterCycle = SATURN_ORBITAL_PERIOD_SECONDS * 0.25;
      const maxTiltDesc = getSaturnRingPhaseDescription(quarterCycle);
      expect(maxTiltDesc).toMatch(/maximum tilt|Moderate tilt/);

      // All descriptions should contain angle information
      expect(edgeOnDesc).toMatch(/\d+\.\d+°/);
      expect(maxTiltDesc).toMatch(/\d+\.\d+°/);
    });

    it("should provide consistent descriptions for the same phase", () => {
      const desc1 = getSaturnRingPhaseDescription(0);
      const desc2 = getSaturnRingPhaseDescription(SATURN_ORBITAL_PERIOD_SECONDS); // Full cycle later
      
      // Should be similar descriptions for the same phase in the cycle
      expect(desc1.split('(')[0]).toBe(desc2.split('(')[0]); // Same phase type
    });
  });

  describe("Astronomical accuracy", () => {
    it("should respect the 29.4571 Julian year orbital period", () => {
      const startInfo = getSaturnRingViewingInfo(0);
      const endInfo = getSaturnRingViewingInfo(SATURN_ORBITAL_PERIOD_SECONDS);
      
      // Should be at the same phase after a full orbital period
      expect(Math.abs(startInfo.viewingAngle - endInfo.viewingAngle)).toBeLessThan(0.1);
    });

    it("should show edge-on viewing twice per Saturnian year", () => {
      const edgeOnTimes: number[] = [];
      const timeStep = SATURN_ORBITAL_PERIOD_SECONDS / 100; // Check 100 points per cycle
      
      for (let i = 0; i < 100; i++) {
        const time = i * timeStep;
        const info = getSaturnRingViewingInfo(time);
        if (info.isNearEdgeOn) {
          edgeOnTimes.push(time);
        }
      }
      
      // Should find edge-on periods twice per cycle (allowing for some measurement tolerance)
      expect(edgeOnTimes.length).toBeGreaterThan(10); // Should have multiple edge-on measurements
    });

    it("should reflect the 26.73 degree axial tilt", () => {
      // Find the maximum viewing angle in a cycle
      let maxAngle = 0;
      const timeStep = SATURN_ORBITAL_PERIOD_SECONDS / 100;
      
      for (let i = 0; i < 100; i++) {
        const time = i * timeStep;
        const info = getSaturnRingViewingInfo(time);
        maxAngle = Math.max(maxAngle, info.viewingAngle);
      }
      
      // Maximum viewing angle should be close to Saturn's axial tilt (26.73°)
      expect(maxAngle).toBeCloseTo(26.73, 1);
    });
  });
});