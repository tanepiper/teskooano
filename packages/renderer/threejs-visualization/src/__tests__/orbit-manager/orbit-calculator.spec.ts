import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";
import { calculateOrbitPoints } from "../../orbit-manager/orbit-calculator";
import type { OrbitalParameters } from "@teskooano/data-types";

// Mock dependencies
vi.mock("@teskooano/core-physics", () => ({
  calculateOrbitalPosition: vi
    .fn()
    .mockImplementation((parentState, orbitalParams, time) => {
      // Simple mock implementation that returns a position based on time
      const angle = time * 0.01; // Simple time-based angle
      return {
        x: Math.cos(angle) * orbitalParams.semiMajorAxis,
        y: 0,
        z: Math.sin(angle) * orbitalParams.semiMajorAxis,
      };
    }),
}));

describe("Orbit Calculator Module", () => {
  let mockOrbitalParameters: OrbitalParameters;
  let mockParentPosition: THREE.Vector3;
  let mockParentPhysicsState: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup test data
    mockOrbitalParameters = {
      semiMajorAxis: 100,
      eccentricity: 0.1,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period: 1000,
    };

    mockParentPosition = new THREE.Vector3(0, 0, 0);

    mockParentPhysicsState = {
      position: { x: 0, y: 0, z: 0 },
      mass: 1000000,
    };
  });

  describe("calculateOrbitPoints", () => {
    it("should calculate orbit points using physics engine when parent physics state is available", () => {
      const currentTime = 500;
      const points = calculateOrbitPoints(
        mockOrbitalParameters,
        mockParentPosition,
        mockParentPhysicsState,
        currentTime,
      );

      // Should return array of Vector3 points
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);
      expect(points[0]).toBeInstanceOf(THREE.Vector3);

      // Should have calculated enough points for a smooth orbit
      expect(points.length).toBeGreaterThanOrEqual(64);

      // First and last points should connect (closed orbit)
      // Allow for small floating point differences
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      expect(firstPoint.distanceTo(lastPoint)).toBeLessThan(0.1);
    });

    it("should use fallback calculation when parent physics state is not available", () => {
      const currentTime = 500;
      const points = calculateOrbitPoints(
        mockOrbitalParameters,
        mockParentPosition,
        undefined,
        currentTime,
      );

      // Should still return array of Vector3 points
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);
      expect(points[0]).toBeInstanceOf(THREE.Vector3);

      // Points should form an elliptical orbit around parent position
      // Check that points are at varying distances from parent
      const distances = points.map((p) => p.distanceTo(mockParentPosition));
      const minDistance = Math.min(...distances);
      const maxDistance = Math.max(...distances);

      // For an elliptical orbit, min and max distances should differ
      expect(maxDistance).toBeGreaterThan(minDistance);

      // Check that the orbit is centered at parent position
      const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      const avgZ = points.reduce((sum, p) => sum + p.z, 0) / points.length;

      // Center should be close to parent position (allowing for eccentricity)
      expect(Math.abs(avgX - mockParentPosition.x)).toBeLessThan(
        mockOrbitalParameters.semiMajorAxis *
          mockOrbitalParameters.eccentricity,
      );
      expect(Math.abs(avgY - mockParentPosition.y)).toBeLessThan(1); // Y should be close to parent Y
      expect(Math.abs(avgZ - mockParentPosition.z)).toBeLessThan(
        mockOrbitalParameters.semiMajorAxis *
          mockOrbitalParameters.eccentricity,
      );
    });

    it("should use the current time to calculate positions", () => {
      // Test with different time values
      const time1 = 0;
      const time2 = 500;

      const points1 = calculateOrbitPoints(
        mockOrbitalParameters,
        mockParentPosition,
        mockParentPhysicsState,
        time1,
      );

      const points2 = calculateOrbitPoints(
        mockOrbitalParameters,
        mockParentPosition,
        mockParentPhysicsState,
        time2,
      );

      // Points should be different due to different time inputs
      // Check first point of each
      expect(points1[0].equals(points2[0])).toBe(false);
    });
  });
});
