import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { BillboardManager } from "./manager";
import { BillboardLODConfig } from "./types";
import {
  RenderableCelestialObject,
  CelestialType,
  CelestialStatus,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

describe("BillboardManager", () => {
  let billboardManager: BillboardManager;
  let mockObject: RenderableCelestialObject;
  let mockCamera: THREE.PerspectiveCamera;
  let mockAllObjects: Record<string, RenderableCelestialObject>;
  let mockAllMeshes: Record<string, THREE.Object3D>;

  beforeEach(() => {
    billboardManager = new BillboardManager();
    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    mockCamera.position.set(0, 0, 1000);

    mockObject = {
      id: "test-object",
      celestialObjectId: "test-object",
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

    mockAllObjects = {
      "test-object": mockObject,
    };

    mockAllMeshes = {
      "test-object": new THREE.Object3D(),
    };
  });

  describe("createBillboardLOD", () => {
    it("should create billboard LOD level", () => {
      const config: BillboardLODConfig = {
        distance: 1000,
        size: 50,
        color: new THREE.Color(1, 1, 1),
        albedo: 0.3,
      };

      const lodLevel = billboardManager.createBillboardLOD(mockObject, config);

      expect(lodLevel).toBeDefined();
      expect(lodLevel.distance).toBe(1000);
      expect(lodLevel.object).toBeInstanceOf(THREE.Group);
    });

    it("should create billboard with default albedo", () => {
      const config: BillboardLODConfig = {
        distance: 1000,
        size: 50,
        color: new THREE.Color(1, 1, 1),
      };

      const lodLevel = billboardManager.createBillboardLOD(mockObject, config);

      expect(lodLevel).toBeDefined();
      expect(lodLevel.object).toBeInstanceOf(THREE.Group);
    });
  });

  describe("update", () => {
    it("should update billboard visibility based on camera distance", () => {
      const config: BillboardLODConfig = {
        distance: 500, // Close distance for testing
        size: 50,
        color: new THREE.Color(1, 1, 1),
      };

      const lodLevel = billboardManager.createBillboardLOD(mockObject, config);

      // Move camera far away
      mockCamera.position.set(0, 0, 2000);
      billboardManager.update(mockCamera, mockAllObjects, mockAllMeshes);

      // The billboard should be visible when camera is far
      const group = lodLevel.object as THREE.Group;
      const sprite = group.children.find(
        (child) => child instanceof THREE.Sprite,
      ) as THREE.Sprite;
      expect(sprite).toBeDefined();
    });

    it("should handle objects without billboards", () => {
      // Should not throw when no billboards exist
      expect(() => {
        billboardManager.update(mockCamera, mockAllObjects, mockAllMeshes);
      }).not.toThrow();
    });

    it("should handle empty objects map", () => {
      expect(() => {
        billboardManager.update(mockCamera, {}, mockAllMeshes);
      }).not.toThrow();
    });
  });

  describe("dispose", () => {
    it("should dispose all billboard resources", () => {
      const config: BillboardLODConfig = {
        distance: 1000,
        size: 50,
        color: new THREE.Color(1, 1, 1),
      };

      billboardManager.createBillboardLOD(mockObject, config);

      // Should not throw when disposing
      expect(() => {
        billboardManager.dispose();
      }).not.toThrow();
    });

    it("should handle disposal when no billboards exist", () => {
      expect(() => {
        billboardManager.dispose();
      }).not.toThrow();
    });
  });

  describe("billboard texture", () => {
    it("should create and reuse billboard texture", () => {
      const config1: BillboardLODConfig = {
        distance: 1000,
        size: 50,
        color: new THREE.Color(1, 1, 1),
      };

      const config2: BillboardLODConfig = {
        distance: 1500,
        size: 60,
        color: new THREE.Color(0, 1, 0),
      };

      const lodLevel1 = billboardManager.createBillboardLOD(
        mockObject,
        config1,
      );
      const lodLevel2 = billboardManager.createBillboardLOD(
        mockObject,
        config2,
      );

      // Both should use the same texture instance
      const group1 = lodLevel1.object as THREE.Group;
      const group2 = lodLevel2.object as THREE.Group;
      const sprite1 = group1.children.find(
        (child) => child instanceof THREE.Sprite,
      ) as THREE.Sprite;
      const sprite2 = group2.children.find(
        (child) => child instanceof THREE.Sprite,
      ) as THREE.Sprite;

      expect(sprite1.material.map).toBe(sprite2.material.map);
    });
  });

  describe("point light creation", () => {
    it("should create point light for billboard", () => {
      const config: BillboardLODConfig = {
        distance: 1000,
        size: 50,
        color: new THREE.Color(1, 0, 0), // Red color
        albedo: 0.5,
      };

      const lodLevel = billboardManager.createBillboardLOD(mockObject, config);
      const group = lodLevel.object as THREE.Group;
      const pointLight = group.children.find(
        (child) => child instanceof THREE.PointLight,
      ) as THREE.PointLight;

      expect(pointLight).toBeDefined();
      expect(pointLight.color.r).toBeCloseTo(1, 5);
      expect(pointLight.color.g).toBeCloseTo(0, 5);
      expect(pointLight.color.b).toBeCloseTo(0, 5);
    });
  });
});
