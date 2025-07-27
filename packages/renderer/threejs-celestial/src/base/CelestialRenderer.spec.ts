import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import {
  CelestialRenderer,
  LightSourceData,
  LightSourcesMap,
  LightingCalculator,
  ShadowCasterUtils,
  LightArrayUtils,
  ShadowCasterData,
} from "./CelestialRenderer";
import {
  RenderableCelestialObject,
  CelestialType,
  CelestialStatus,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

describe("CelestialRenderer Interface", () => {
  let mockObject: RenderableCelestialObject;
  let mockCamera: THREE.PerspectiveCamera;
  let mockLightSources: LightSourcesMap;

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

    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    mockCamera.position.set(0, 0, 1000);

    mockLightSources = new Map();
    mockLightSources.set("star1", {
      position: new THREE.Vector3(1000, 0, 0),
      color: new THREE.Color(1, 1, 1),
      intensity: 1.0,
    });
  });

  describe("LightingCalculator", () => {
    describe("applyDistanceAttenuation", () => {
      it("should apply distance-based attenuation to light sources", () => {
        const result = LightingCalculator.applyDistanceAttenuation(
          mockObject,
          mockLightSources,
        );

        expect(result).toBe(mockLightSources);
        const lightData = result.get("star1");
        expect(lightData).toBeDefined();
        expect(lightData!.intensity).toBeLessThan(1.0);
      });

      it("should handle empty light sources map", () => {
        const emptyMap = new Map();
        const result = LightingCalculator.applyDistanceAttenuation(
          mockObject,
          emptyMap,
        );

        expect(result).toBe(emptyMap);
        expect(result.size).toBe(0);
      });

      it("should respect modifyInPlace configuration", () => {
        const result = LightingCalculator.applyDistanceAttenuation(
          mockObject,
          mockLightSources,
          { modifyInPlace: false },
        );

        expect(result).not.toBe(mockLightSources);
        expect(result.size).toBe(mockLightSources.size);
      });
    });

    describe("findClosestLightSource", () => {
      it("should find the closest light source", () => {
        const lightSources = new Map();
        lightSources.set("far", {
          position: new THREE.Vector3(2000, 0, 0),
          color: new THREE.Color(1, 1, 1),
          intensity: 1.0,
        });
        lightSources.set("close", {
          position: new THREE.Vector3(500, 0, 0),
          color: new THREE.Color(1, 1, 1),
          intensity: 1.0,
        });

        const closest = LightingCalculator.findClosestLightSource(
          mockObject,
          lightSources,
        );

        expect(closest).toBeDefined();
        expect(closest!.position.x).toBe(500);
      });

      it("should return null for empty light sources", () => {
        const emptyMap = new Map();
        const result = LightingCalculator.findClosestLightSource(
          mockObject,
          emptyMap,
        );

        expect(result).toBeNull();
      });
    });

    describe("calculateLightIntensityAtDistance", () => {
      it("should calculate attenuated intensity at distance", () => {
        const lightSource: LightSourceData = {
          position: new THREE.Vector3(0, 0, 0),
          color: new THREE.Color(1, 1, 1),
          intensity: 1.0,
        };

        const intensity = LightingCalculator.calculateLightIntensityAtDistance(
          lightSource,
          1000,
        );

        expect(intensity).toBeLessThan(1.0);
        expect(intensity).toBeGreaterThan(0);
      });
    });

    describe("calculateDynamicAmbientLight", () => {
      it("should calculate ambient light from nearby stars", () => {
        const ambient = LightingCalculator.calculateDynamicAmbientLight(
          mockObject,
          mockLightSources,
        );

        expect(ambient).toBeGreaterThan(0);
        expect(ambient).toBeLessThanOrEqual(0.5);
      });

      it("should return minimum ambient for no light sources", () => {
        const emptyMap = new Map();
        const ambient = LightingCalculator.calculateDynamicAmbientLight(
          mockObject,
          emptyMap,
        );

        expect(ambient).toBe(0.25); // MIN_AMBIENT_INTENSITY
      });
    });
  });

  describe("ShadowCasterUtils", () => {
    let allObjects: Record<string, RenderableCelestialObject>;

    beforeEach(() => {
      allObjects = {
        planet: {
          ...mockObject,
          celestialObjectId: "planet",
          type: CelestialType.PLANET,
        },
        moon1: {
          ...mockObject,
          celestialObjectId: "moon1",
          type: CelestialType.MOON,
          parentId: "planet",
          position: new THREE.Vector3(100, 0, 0),
          radius: 100,
        },
        moon2: {
          ...mockObject,
          celestialObjectId: "moon2",
          type: CelestialType.MOON,
          parentId: "planet",
          position: new THREE.Vector3(-100, 0, 0),
          radius: 150,
        },
      };
    });

    describe("findShadowCasters", () => {
      it("should find moons as shadow casters for planets", () => {
        const planet = allObjects["planet"];
        const shadowCasters = ShadowCasterUtils.findShadowCasters(
          planet,
          allObjects,
        );

        expect(shadowCasters).toHaveLength(2);
        expect(shadowCasters[0].position.x).toBe(100);
        expect(shadowCasters[1].position.x).toBe(-100);
      });

      it("should find parent as shadow caster for moons", () => {
        const moon = allObjects["moon1"];
        const shadowCasters = ShadowCasterUtils.findShadowCasters(
          moon,
          allObjects,
        );

        expect(shadowCasters).toHaveLength(1);
        expect(shadowCasters[0].position.x).toBe(0);
      });

      it("should not include stars as shadow casters", () => {
        const starObject = {
          ...mockObject,
          type: CelestialType.STAR,
        };
        allObjects["star"] = starObject;
        allObjects["planet"].parentId = "star";

        const shadowCasters = ShadowCasterUtils.findShadowCasters(
          allObjects["planet"],
          allObjects,
        );

        expect(shadowCasters).toHaveLength(2); // Only moons, not star
      });
    });

    describe("findRingShadowCasters", () => {
      it("should include parent body and moons for ring shadow casters", () => {
        const planet = allObjects["planet"];
        const shadowCasters = ShadowCasterUtils.findRingShadowCasters(
          planet,
          allObjects,
        );

        expect(shadowCasters).toHaveLength(3); // Planet + 2 moons
        expect(shadowCasters[0].position.x).toBe(0); // Planet
        expect(shadowCasters[1].position.x).toBe(100); // Moon 1
        expect(shadowCasters[2].position.x).toBe(-100); // Moon 2
      });
    });

    describe("toShaderFormat", () => {
      it("should convert shadow caster data to shader format", () => {
        const shadowCasters: ShadowCasterData[] = [
          { position: new THREE.Vector3(1, 2, 3), radius: 100 },
          { position: new THREE.Vector3(4, 5, 6), radius: 200 },
        ];

        const result = ShadowCasterUtils.toShaderFormat(shadowCasters);

        expect(result).toHaveLength(2);
        expect(result[0].position.x).toBe(1);
        expect(result[0].radius).toBe(100);
        expect(result[1].position.x).toBe(4);
        expect(result[1].radius).toBe(200);
      });
    });
  });

  describe("LightArrayUtils", () => {
    describe("createLightSourceArray", () => {
      it("should create array with specified size", () => {
        const array = LightArrayUtils.createLightSourceArray(3);

        expect(array).toHaveLength(3);
        expect(array[0]).toHaveProperty("position");
        expect(array[0]).toHaveProperty("color");
        expect(array[0]).toHaveProperty("intensity");
      });

      it("should use default size of 4", () => {
        const array = LightArrayUtils.createLightSourceArray();

        expect(array).toHaveLength(4);
      });
    });

    describe("createShadowCasterArray", () => {
      it("should create array with specified size", () => {
        const array = LightArrayUtils.createShadowCasterArray(2);

        expect(array).toHaveLength(2);
        expect(array[0]).toHaveProperty("position");
        expect(array[0]).toHaveProperty("radius");
      });
    });

    describe("resizeLightArray", () => {
      it("should resize array while preserving data", () => {
        const material = new THREE.ShaderMaterial();
        const currentArray = LightArrayUtils.createLightSourceArray(2);
        currentArray[0].intensity = 0.5;
        currentArray[1].intensity = 0.8;

        const newArray = LightArrayUtils.resizeLightArray(
          material,
          4,
          currentArray,
        );

        expect(newArray).toHaveLength(4);
        expect(newArray[0].intensity).toBe(0.5);
        expect(newArray[1].intensity).toBe(0.8);
        expect(newArray[2].intensity).toBe(0);
        expect(newArray[3].intensity).toBe(0);
      });

      it("should update shader defines", () => {
        const material = new THREE.ShaderMaterial({
          defines: { MAX_LIGHTS: 2 },
        });
        const currentArray = LightArrayUtils.createLightSourceArray(2);

        LightArrayUtils.resizeLightArray(material, 5, currentArray);

        expect(material.defines.MAX_LIGHTS).toBe(5);
        expect(material.needsUpdate).toBeDefined();
      });
    });

    describe("toShaderFormat", () => {
      it("should convert LightSourcesMap to shader format", () => {
        const lightSources = new Map();
        lightSources.set("light1", {
          position: new THREE.Vector3(1, 2, 3),
          color: new THREE.Color(1, 0, 0),
          intensity: 0.5,
        });
        lightSources.set("light2", {
          position: new THREE.Vector3(4, 5, 6),
          color: new THREE.Color(0, 1, 0),
          intensity: 0.8,
        });

        const result = LightArrayUtils.toShaderFormat(lightSources);

        expect(result).toHaveLength(2);
        expect(result[0].position.x).toBe(1);
        expect(result[0].color.r).toBe(1);
        expect(result[0].intensity).toBe(0.5);
        expect(result[1].position.x).toBe(4);
        expect(result[1].color.g).toBe(1);
        expect(result[1].intensity).toBe(0.8);
      });
    });
  });
});
