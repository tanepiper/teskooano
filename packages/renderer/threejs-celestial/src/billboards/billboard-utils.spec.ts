import { describe, it, expect, beforeEach } from "vitest";
import { LightingHelper } from "@teskooano/renderer-threejs-helpers";
import * as THREE from "three";
import {
  createBillboardSprite,
  createBillboardPointLight,
  createBillboardLODLevel,
} from "./billboard-utils";
import { BillboardLODConfig } from "./types";
import {
  RenderableCelestialObject,
  CelestialType,
  CelestialStatus,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

describe("Billboard Utils", () => {
  let mockObject: RenderableCelestialObject;
  let mockTexture: THREE.Texture;
  let mockStarMaterial: THREE.ShaderMaterial;

  beforeEach(() => {
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

    // Create a mock texture using document (available in jsdom environment)
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    mockTexture = new THREE.CanvasTexture(canvas);
    mockStarMaterial = new THREE.ShaderMaterial({
      vertexShader: "void main() { gl_Position = vec4(0.0); }",
      fragmentShader: "void main() { gl_FragColor = vec4(1.0); }",
    });
  });

  describe("createBillboardSprite", () => {
    it("should create billboard sprite with correct properties", () => {
      const starColor = new THREE.Color(1, 0, 0); // Red
      const size = 50;
      const albedo = 0.5;

      const billboardInfo = createBillboardSprite(
        mockObject,
        mockTexture,
        size,
        starColor,
        albedo,
      );

      expect(billboardInfo.sprite).toBeInstanceOf(THREE.Sprite);
      expect(billboardInfo.activationDistance).toBe(0); // Set by BillboardManager
      expect(billboardInfo.maxFadeDistance).toBe(0); // Set by BillboardManager
      expect(billboardInfo.object).toBe(mockObject);
    });

    it("should use default albedo when not provided", () => {
      const starColor = new THREE.Color(1, 1, 1);
      const size = 50;

      const billboardInfo = createBillboardSprite(
        mockObject,
        mockTexture,
        size,
        starColor,
      );

      expect(billboardInfo.sprite).toBeInstanceOf(THREE.Sprite);
      expect(billboardInfo.sprite.material).toBeInstanceOf(
        THREE.SpriteMaterial,
      );
    });

    it("should set sprite material properties correctly", () => {
      const starColor = new THREE.Color(0, 1, 0); // Green
      const size = 100;
      const albedo = 0.7;

      const billboardInfo = createBillboardSprite(
        mockObject,
        mockTexture,
        size,
        starColor,
        albedo,
      );

      const material = billboardInfo.sprite.material as THREE.SpriteMaterial;
      expect(material.map).toBe(mockTexture);
      // The color should be the star color multiplied by albedo
      expect(material.color.r).toBeCloseTo(starColor.r * albedo, 5);
      expect(material.color.g).toBeCloseTo(starColor.g * albedo, 5);
      expect(material.color.b).toBeCloseTo(starColor.b * albedo, 5);
      expect(material.transparent).toBe(true);
    });
  });

  describe("createBillboardPointLight", () => {
    it("should create point light with correct properties", () => {
      const starColor = new THREE.Color(1, 0, 0); // Red

      const pointLight = createBillboardPointLight(
        mockObject,
        starColor,
        mockStarMaterial,
      );

      expect(pointLight).toBeInstanceOf(THREE.PointLight);
      expect(pointLight.color).toEqual(starColor);
      expect(pointLight.intensity).toBeGreaterThan(0);
      expect(pointLight.distance).toBe(0); // No decay distance limit
      expect(pointLight.position).toEqual(mockObject.position);
    });

    it("should set point light intensity based on object properties", () => {
      const starColor = new THREE.Color(1, 1, 1);
      const highAlbedoObject = { ...mockObject, albedo: 0.8 };

      const pointLight = createBillboardPointLight(
        highAlbedoObject,
        starColor,
        mockStarMaterial,
      );

      expect(pointLight.intensity).toBeGreaterThan(0);
    });
  });

  describe("createBillboardLODLevel", () => {
    it("should create LOD level with correct properties", () => {
      const sprite = new THREE.Sprite();
      const pointLight = LightingHelper.createPointLight();
      const billboardDistance = 1000;

      const lodLevel = createBillboardLODLevel(
        mockObject,
        sprite,
        pointLight,
        billboardDistance,
      );

      expect(lodLevel.distance).toBe(billboardDistance);
      expect(lodLevel.object).toBeInstanceOf(THREE.Group);

      const group = lodLevel.object as THREE.Group;
      expect(group.children).toContain(sprite);
      expect(group.children).toContain(pointLight);
    });

    it("should position sprite and point light correctly", () => {
      const sprite = new THREE.Sprite();
      const pointLight = LightingHelper.createPointLight();
      const billboardDistance = 1500;

      const lodLevel = createBillboardLODLevel(
        mockObject,
        sprite,
        pointLight,
        billboardDistance,
      );

      const group = lodLevel.object as THREE.Group;

      // Both sprite and point light should be at the same position
      expect(sprite.position).toEqual(new THREE.Vector3(0, 0, 0));
      expect(pointLight.position).toEqual(new THREE.Vector3(0, 0, 0));
    });

    it("should handle different billboard distances", () => {
      const sprite = new THREE.Sprite();
      const pointLight = LightingHelper.createPointLight();
      const distances = [500, 1000, 2000];

      distances.forEach((distance) => {
        const lodLevel = createBillboardLODLevel(
          mockObject,
          sprite,
          pointLight,
          distance,
        );

        expect(lodLevel.distance).toBe(distance);
      });
    });
  });

  describe("billboard info properties", () => {
    it("should calculate activation and fade distances correctly", () => {
      const starColor = new THREE.Color(1, 1, 1);
      const size = 50;
      const albedo = 0.3;

      const billboardInfo = createBillboardSprite(
        mockObject,
        mockTexture,
        size,
        starColor,
        albedo,
      );

      expect(billboardInfo.activationDistance).toBe(0); // Set by BillboardManager
      expect(billboardInfo.maxFadeDistance).toBe(0); // Set by BillboardManager
      expect(billboardInfo.object).toBe(mockObject);
    });

    it("should handle different object sizes", () => {
      const starColor = new THREE.Color(1, 1, 1);
      const sizes = [25, 50, 100];

      sizes.forEach((size) => {
        const billboardInfo = createBillboardSprite(
          mockObject,
          mockTexture,
          size,
          starColor,
        );

        expect(billboardInfo.activationDistance).toBe(0); // Set by BillboardManager
        expect(billboardInfo.maxFadeDistance).toBe(0); // Set by BillboardManager
      });
    });
  });
});
