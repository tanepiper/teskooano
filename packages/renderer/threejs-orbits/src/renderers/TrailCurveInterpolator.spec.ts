import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { TrailCurveInterpolator } from "./TrailCurveInterpolator";
import { TrailCurveType, TrailCurveConfig } from "./TrailManager";

describe("TrailCurveInterpolator", () => {
  describe("interpolate", () => {
    it("should return original points for linear interpolation", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Linear,
      };

      const result = TrailCurveInterpolator.interpolate(points, config);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(points[0]);
      expect(result[1]).toEqual(points[1]);
      expect(result[2]).toEqual(points[2]);
    });

    it("should return original points for insufficient points", () => {
      const points = [new THREE.Vector3(0, 0, 0)];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Smooth,
      };

      const result = TrailCurveInterpolator.interpolate(points, config);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(points[0]);
    });

    it("should create smooth curves for smooth interpolation", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Smooth,
        tension: 0.5,
        segments: 8,
      };

      const result = TrailCurveInterpolator.interpolate(points, config);

      expect(result.length).toBeGreaterThan(3);
      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });

    it("should create orbital curves for orbital interpolation", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(1, -1, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Orbital,
        tension: 0.4,
        segments: 12,
        smoothing: 0.3,
      };

      const result = TrailCurveInterpolator.interpolate(points, config);

      expect(result.length).toBeGreaterThan(4);
      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });

    it("should create adaptive curves for adaptive interpolation", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(0, 0, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Adaptive,
        tension: 0.5,
        segments: 10,
        smoothing: 0.3,
        adaptiveThreshold: 3,
      };

      const result = TrailCurveInterpolator.interpolate(points, config);

      expect(result.length).toBeGreaterThan(5);
      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });
  });

  describe("createSmoothCurve", () => {
    it("should create smooth curves with Catmull-Rom interpolation", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Smooth,
        tension: 0.5,
        segments: 8,
      };

      const result = TrailCurveInterpolator.createSmoothCurve(points, config);

      expect(result.length).toBeGreaterThan(3);
      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });

    it("should return original points for insufficient points", () => {
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 0)];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Smooth,
      };

      const result = TrailCurveInterpolator.createSmoothCurve(points, config);

      expect(result).toEqual(points);
    });
  });

  describe("createOrbitalCurve", () => {
    it("should create orbital curves with smoothing", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(1, -1, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Orbital,
        tension: 0.4,
        segments: 12,
        smoothing: 0.3,
      };

      const result = TrailCurveInterpolator.createOrbitalCurve(points, config);

      expect(result.length).toBeGreaterThan(4);
      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });

    it("should fall back to smooth curve for insufficient points", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Orbital,
      };

      const result = TrailCurveInterpolator.createOrbitalCurve(points, config);

      expect(result.length).toBeGreaterThan(3);
    });
  });

  describe("createTypeOptimizedCurve", () => {
    it("should create orbital curves for planets", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Smooth,
        tension: 0.5,
        segments: 8,
      };

      const result = TrailCurveInterpolator.createTypeOptimizedCurve(
        points,
        "PLANET",
        config,
      );

      expect(result.length).toBeGreaterThan(3);
    });

    it("should create smooth curves for stars", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Smooth,
        tension: 0.5,
        segments: 8,
      };

      const result = TrailCurveInterpolator.createTypeOptimizedCurve(
        points,
        "STAR",
        config,
      );

      expect(result.length).toBeGreaterThan(3);
    });

    it("should create adaptive curves for unknown types", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      const config: TrailCurveConfig = {
        type: TrailCurveType.Smooth,
        tension: 0.5,
        segments: 8,
      };

      const result = TrailCurveInterpolator.createTypeOptimizedCurve(
        points,
        "UNKNOWN",
        config,
      );

      expect(result.length).toBeGreaterThan(3);
    });
  });

  describe("applyOrbitalSmoothing", () => {
    it("should apply orbital smoothing to curve points", () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      const result = TrailCurveInterpolator.applyOrbitalSmoothing(points, 0.3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });

    it("should return original points for insufficient points", () => {
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 0)];

      const result = TrailCurveInterpolator.applyOrbitalSmoothing(points, 0.3);

      expect(result).toEqual(points);
    });
  });
});
