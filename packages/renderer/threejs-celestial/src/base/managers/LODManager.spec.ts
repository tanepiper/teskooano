import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { LODManager } from "./LODManager";
import {
  RenderableCelestialObject,
  CelestialType,
  CelestialStatus,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

describe("LODManager", () => {
  let lodManager: LODManager;
  let mockObject: RenderableCelestialObject;
  let mockLOD: THREE.LOD;
  let mockCamera: THREE.PerspectiveCamera;

  beforeEach(() => {
    lodManager = new LODManager();
    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    mockCamera.position.set(0, 0, 1000);

    mockObject = {
      id: "test-object",
      name: "Test Object",
      type: CelestialType.PLANET,
      status: CelestialStatus.ACTIVE,
      realRadius_m: 1000,
      realMass_kg: 1000,
      radius: 1000,
      mass: 1000,
      temperature: 300,
      albedo: 0.3,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(),
      physicsStateReal: {
        id: "test-object",
        mass_kg: 1000,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      orbit: {
        realSemiMajorAxis_m: 1000,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 86400,
        realAphelion_m: 1000,
        realPerihelion_m: 1000,
        averageOrbitalSpeed_mps: 1000,
        epoch: "J2000",
      },
      parentId: undefined,
      primaryLightSourceId: undefined,
      properties: undefined,
      uniforms: {},
    };

    mockLOD = new THREE.LOD();
    const geometry = new THREE.SphereGeometry(1);
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mockLOD.addLevel(mesh, 0);
  });

  describe("registerLOD", () => {
    it("should register LOD for object", () => {
      lodManager.registerLOD("test-object", mockLOD);

      expect(lodManager.hasLOD("test-object")).toBe(true);
      expect(lodManager.getLOD("test-object")).toBe(mockLOD);
    });

    it("should overwrite existing LOD", () => {
      const newLOD = new THREE.LOD();
      lodManager.registerLOD("test-object", mockLOD);
      lodManager.registerLOD("test-object", newLOD);

      expect(lodManager.getLOD("test-object")).toBe(newLOD);
    });
  });

  describe("getLOD", () => {
    it("should return undefined for non-existent LOD", () => {
      expect(lodManager.getLOD("nonexistent")).toBeUndefined();
    });

    it("should return registered LOD", () => {
      lodManager.registerLOD("test-object", mockLOD);
      expect(lodManager.getLOD("test-object")).toBe(mockLOD);
    });
  });

  describe("getLODForObject", () => {
    it("should return LOD for object using celestialObjectId", () => {
      lodManager.registerLOD("test-object", mockLOD);
      const result = lodManager.getLODForObject(mockObject);

      expect(result).toBe(mockLOD);
    });

    it("should return undefined for object without LOD", () => {
      const result = lodManager.getLODForObject(mockObject);
      expect(result).toBeUndefined();
    });
  });

  describe("updateLOD", () => {
    it("should update LOD level based on camera distance", () => {
      const updateSpy = vi.spyOn(mockLOD, "update");
      lodManager.registerLOD("test-object", mockLOD);

      const result = lodManager.updateLOD("test-object", mockCamera);

      expect(result).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(mockCamera);
    });

    it("should return false for non-existent LOD", () => {
      const result = lodManager.updateLOD("nonexistent", mockCamera);
      expect(result).toBe(false);
    });
  });

  describe("updateObjectLOD", () => {
    it("should update LOD for object", () => {
      const updateSpy = vi.spyOn(mockLOD, "update");
      lodManager.registerLOD("test-object", mockLOD);

      const result = lodManager.updateObjectLOD(mockObject, mockCamera);

      expect(result).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(mockCamera);
    });

    it("should return false for object without LOD", () => {
      const result = lodManager.updateObjectLOD(mockObject, mockCamera);
      expect(result).toBe(false);
    });
  });

  describe("calculateLODLevel", () => {
    it("should calculate LOD level based on distance and radius", () => {
      const distance = 1000;
      const radius = 100;
      const level = lodManager.calculateLODLevel(distance, radius);

      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    });

    it("should handle zero distance", () => {
      const level = lodManager.calculateLODLevel(0, 100);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    });

    it("should handle zero radius", () => {
      const level = lodManager.calculateLODLevel(1000, 0);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    });
  });

  describe("getCurrentLODLevel", () => {
    it("should return current LOD level for object", () => {
      lodManager.registerLOD("test-object", mockLOD);
      const level = lodManager.getCurrentLODLevel(mockObject, mockCamera);

      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(mockLOD.levels.length - 1);
    });

    it("should return null for object without LOD", () => {
      const level = lodManager.getCurrentLODLevel(mockObject, mockCamera);
      expect(level).toBeNull();
    });
  });

  describe("removeLOD", () => {
    it("should remove existing LOD", () => {
      lodManager.registerLOD("test-object", mockLOD);
      const removed = lodManager.removeLOD("test-object");

      expect(removed).toBe(true);
      expect(lodManager.hasLOD("test-object")).toBe(false);
    });

    it("should return false for non-existent LOD", () => {
      const removed = lodManager.removeLOD("nonexistent");
      expect(removed).toBe(false);
    });
  });

  describe("hasLOD", () => {
    it("should return true for existing LOD", () => {
      lodManager.registerLOD("test-object", mockLOD);
      expect(lodManager.hasLOD("test-object")).toBe(true);
    });

    it("should return false for non-existent LOD", () => {
      expect(lodManager.hasLOD("nonexistent")).toBe(false);
    });
  });

  describe("getLODCount", () => {
    it("should return correct count", () => {
      expect(lodManager.getLODCount()).toBe(0);

      lodManager.registerLOD("test1", mockLOD);
      expect(lodManager.getLODCount()).toBe(1);

      const lod2 = new THREE.LOD();
      lodManager.registerLOD("test2", lod2);
      expect(lodManager.getLODCount()).toBe(2);
    });
  });

  describe("getLODIds", () => {
    it("should return array of LOD ids", () => {
      lodManager.registerLOD("test1", mockLOD);
      const lod2 = new THREE.LOD();
      lodManager.registerLOD("test2", lod2);

      const ids = lodManager.getLODIds();
      expect(ids).toContain("test1");
      expect(ids).toContain("test2");
      expect(ids).toHaveLength(2);
    });
  });

  describe("dispose", () => {
    it("should dispose all LODs and clear the map", () => {
      lodManager.registerLOD("test-object", mockLOD);

      lodManager.dispose();

      expect(lodManager.getLODCount()).toBe(0);
    });

    it("should handle multiple LODs", () => {
      const lod2 = new THREE.LOD();
      const geometry = new THREE.SphereGeometry(1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      lod2.addLevel(mesh, 0);

      lodManager.registerLOD("test1", mockLOD);
      lodManager.registerLOD("test2", lod2);

      lodManager.dispose();

      expect(lodManager.getLODCount()).toBe(0);
    });
  });
});
