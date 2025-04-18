import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";
import {
  predictTrajectory,
  createTrajectoryLine,
  TrajectoryOptions,
} from "../../orbit-manager/trajectory-predictor";
import type { OrbitalParameters } from "@teskooano/data-types";

// Mock physics calculation dependency
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

describe("Trajectory Predictor Module", () => {
  let mockOrbitalParameters: OrbitalParameters;
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

    mockParentPhysicsState = {
      position: { x: 0, y: 0, z: 0 },
      mass: 1000000,
    };
  });

  describe("predictTrajectory", () => {
    it("should calculate trajectory points using physics engine", () => {
      const currentTime = 500;
      const duration = 10000;
      const points = predictTrajectory(
        mockOrbitalParameters,
        mockParentPhysicsState,
        currentTime,
        duration,
      );

      // Should return array of Vector3 points
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);

      // Test that the first point is a Vector3
      expect(points[0]).toBeInstanceOf(THREE.Vector3);
      expect(typeof points[0].x).toBe("number");
      expect(typeof points[0].y).toBe("number");
      expect(typeof points[0].z).toBe("number");

      // Should have a reasonable number of points
      expect(points.length).toBeGreaterThan(10);
    });

    it("should use the provided step size if specified", () => {
      const currentTime = 500;
      const duration = 10000;
      const stepSize = 1000; // Larger step size

      const points = predictTrajectory(
        mockOrbitalParameters,
        mockParentPhysicsState,
        currentTime,
        duration,
        { stepSize },
      );

      // Should have calculated the right number of points based on duration and step size
      const expectedPoints = Math.floor(duration / stepSize) + 1; // +1 because it includes both start and end points
      expect(points.length).toBe(expectedPoints);
    });

    it("should use fixed points when specified", () => {
      const currentTime = 500;
      const duration = 10000;
      const fixedPoints = 50;

      const points = predictTrajectory(
        mockOrbitalParameters,
        mockParentPhysicsState,
        currentTime,
        duration,
        { fixedPoints },
      );

      // Should have exactly the specified number of points plus one for start/end
      expect(points.length).toBe(fixedPoints + 1);
    });

    it("should handle different current times correctly", () => {
      const time1 = 0;
      const time2 = 5000;
      const duration = 1000;

      const points1 = predictTrajectory(
        mockOrbitalParameters,
        mockParentPhysicsState,
        time1,
        duration,
      );

      const points2 = predictTrajectory(
        mockOrbitalParameters,
        mockParentPhysicsState,
        time2,
        duration,
      );

      // Points should be different due to different start times
      // Check first point of each
      expect(points1[0].x).not.toBe(points2[0].x);
      expect(points1[0].z).not.toBe(points2[0].z);
    });
  });

  describe("createTrajectoryLine", () => {
    it("should create a line with the provided points and correct styling", () => {
      // Create some mock points
      const mockPoints = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(-1, 0, 0),
      ];

      const line = createTrajectoryLine(mockPoints);

      // Check line was created
      expect(line).toBeDefined();
      expect(line).toBeInstanceOf(THREE.Line);

      // Check geometry was set up with points
      expect(line.geometry).toBeInstanceOf(THREE.BufferGeometry);
      expect(line.geometry.attributes.position.count).toBe(mockPoints.length);

      // Check material properties
      const material = line.material as THREE.LineDashedMaterial;
      expect(material).toBeInstanceOf(THREE.LineDashedMaterial);
      expect(material.color.getHex()).toBe(0xffff00);
      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(0.6);
      expect(material.dashSize).toBe(3);
      expect(material.gapSize).toBe(1);
      expect(material.depthTest).toBe(false);
      expect(material.depthWrite).toBe(false);

      // Check line rendering properties
      expect(line.renderOrder).toBe(2); // Render order is 2 for trajectories
      expect(line.frustumCulled).toBe(false);
    });
  });
});
