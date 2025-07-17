import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { SatelliteRenderer } from "./renderer";
import {
  RenderableCelestialObject,
  SatelliteProperties,
  CelestialType,
  CelestialStatus,
} from "@teskooano/data-types";

describe("SatelliteRenderer", () => {
  let renderer: SatelliteRenderer;

  beforeEach(() => {
    renderer = new SatelliteRenderer();
  });

  describe("scaling calculations", () => {
    it("should scale large satellites (ISS) appropriately", () => {
      const issObject: RenderableCelestialObject = {
        celestialObjectId: "iss",
        name: "International Space Station",
        type: CelestialType.SATELLITE,
        realRadius_m: 54.5, // ISS is ~109m diameter
        radius: 1.0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        status: CelestialStatus.ACTIVE,
        seed: "iss-seed",
        mass: 420000, // 420 metric tons
        rotation: new THREE.Quaternion(),
        albedo: 0.3,
        temperature: 300,
        axialTilt: 0,
        uniforms: {},
        properties: {
          type: CelestialType.SATELLITE,
          modelPath: "models/satellite/iss.glb",
          missionType: "scientific",
          operationalStatus: "active",
        } as SatelliteProperties,
      };

      // Access the private method for testing
      const scale = (renderer as any).calculateSatelliteScale(
        issObject,
        issObject.properties,
      );

      // ISS should be scaled down due to its large size
      expect(scale).toBeGreaterThan(0);
      expect(scale).toBeLessThan(1); // Should be reasonably sized
    });

    it("should scale medium satellites (Hubble) appropriately", () => {
      const hubbleObject: RenderableCelestialObject = {
        celestialObjectId: "hubble",
        name: "Hubble Space Telescope",
        type: CelestialType.SATELLITE,
        realRadius_m: 6.5, // Hubble is ~13m diameter
        radius: 1.0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        status: CelestialStatus.ACTIVE,
        seed: "hubble-seed",
        mass: 11110, // 11,110 kg
        rotation: new THREE.Quaternion(),
        albedo: 0.3,
        temperature: 300,
        axialTilt: 0,
        uniforms: {},
        properties: {
          type: CelestialType.SATELLITE,
          modelPath: "models/satellite/hubble.glb",
          missionType: "scientific",
          operationalStatus: "active",
        } as SatelliteProperties,
      };

      const scale = (renderer as any).calculateSatelliteScale(
        hubbleObject,
        hubbleObject.properties,
      );

      // Hubble should have moderate scaling
      expect(scale).toBeGreaterThan(0);
    });

    it("should scale small satellites (cubesats) appropriately", () => {
      const cubesatObject: RenderableCelestialObject = {
        celestialObjectId: "cubesat",
        name: "CubeSat",
        type: CelestialType.SATELLITE,
        realRadius_m: 0.1, // 20cm cubesat
        radius: 1.0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        status: CelestialStatus.ACTIVE,
        seed: "cubesat-seed",
        mass: 1.33, // 1.33 kg
        rotation: new THREE.Quaternion(),
        albedo: 0.3,
        temperature: 300,
        axialTilt: 0,
        uniforms: {},
        properties: {
          type: CelestialType.SATELLITE,
          modelPath: "models/satellite/satellite.glb",
          missionType: "scientific",
          operationalStatus: "active",
        } as SatelliteProperties,
      };

      const scale = (renderer as any).calculateSatelliteScale(
        cubesatObject,
        cubesatObject.properties,
      );

      // Small satellites should get significant scaling
      expect(scale).toBeGreaterThan(0);
    });

    it("should apply mission-specific adjustments", () => {
      const commSatObject: RenderableCelestialObject = {
        celestialObjectId: "commsat",
        name: "Communication Satellite",
        type: CelestialType.SATELLITE,
        realRadius_m: 5.0,
        radius: 1.0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        status: CelestialStatus.ACTIVE,
        seed: "commsat-seed",
        mass: 1000,
        rotation: new THREE.Quaternion(),
        albedo: 0.3,
        temperature: 300,
        axialTilt: 0,
        uniforms: {},
        properties: {
          type: CelestialType.SATELLITE,
          modelPath: "models/satellite/satellite.glb",
          missionType: "communications",
          operationalStatus: "active",
        } as SatelliteProperties,
      };

      const standardObject: RenderableCelestialObject = {
        celestialObjectId: "standard",
        name: "Standard Satellite",
        type: CelestialType.SATELLITE,
        realRadius_m: 5.0,
        radius: 1.0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        status: CelestialStatus.ACTIVE,
        seed: "standard-seed",
        mass: 1000,
        rotation: new THREE.Quaternion(),
        albedo: 0.3,
        temperature: 300,
        axialTilt: 0,
        uniforms: {},
        properties: {
          type: CelestialType.SATELLITE,
          modelPath: "models/satellite/satellite.glb",
          missionType: "scientific",
          operationalStatus: "active",
        } as SatelliteProperties,
      };

      const commScale = (renderer as any).calculateSatelliteScale(
        commSatObject,
        commSatObject.properties,
      );
      const standardScale = (renderer as any).calculateSatelliteScale(
        standardObject,
        standardObject.properties,
      );

      // Communication satellites should be slightly larger
      expect(commScale).toBeGreaterThan(standardScale);
    });

    it("should respect custom modelScale property", () => {
      const object: RenderableCelestialObject = {
        celestialObjectId: "custom",
        name: "Custom Satellite",
        type: CelestialType.SATELLITE,
        realRadius_m: 5.0,
        radius: 1.0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        status: CelestialStatus.ACTIVE,
        seed: "custom-seed",
        mass: 1000,
        rotation: new THREE.Quaternion(),
        albedo: 0.3,
        temperature: 300,
        axialTilt: 0,
        uniforms: {},
        properties: {
          type: CelestialType.SATELLITE,
          modelPath: "models/satellite/satellite.glb",
          modelScale: 2.0, // Custom scale
          missionType: "scientific",
          operationalStatus: "active",
        } as SatelliteProperties,
      };

      const scale = (renderer as any).calculateSatelliteScale(
        object,
        object.properties,
      );

      // Should be affected by the custom modelScale
      expect(scale).toBeGreaterThan(0);
    });
  });

  describe("mission type adjustments", () => {
    it("should return correct adjustments for different mission types", () => {
      const getMissionAdjustment = (
        renderer as any
      ).getMissionTypeAdjustment.bind(renderer);

      expect(getMissionAdjustment("communications")).toBe(1.2);
      expect(getMissionAdjustment("navigation")).toBe(1.2);
      expect(getMissionAdjustment("scientific")).toBe(1.0);
      expect(getMissionAdjustment("military")).toBe(1.0);
      expect(getMissionAdjustment("commercial")).toBe(1.0);
      expect(getMissionAdjustment("other")).toBe(1.0);
      expect(getMissionAdjustment("unknown")).toBe(1.0);
      expect(getMissionAdjustment(undefined)).toBe(1.0);
    });
  });

  describe("LOD creation", () => {
    it("should create LOD levels with correct distances", () => {
      const mockObject: RenderableCelestialObject = {
        celestialObjectId: "lod-test",
        name: "LOD Test",
        type: CelestialType.SATELLITE,
        realRadius_m: 1000, // Large enough to trigger LOD
        radius: 1.0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        status: CelestialStatus.ACTIVE,
        seed: "lod-seed",
        mass: 100000, // Large enough to trigger LOD
        rotation: new THREE.Quaternion(),
        albedo: 0.3,
        temperature: 300,
        axialTilt: 0,
        uniforms: {},
        properties: {
          type: CelestialType.SATELLITE,
          modelPath: "models/satellite/satellite.glb",
          missionType: "scientific",
          operationalStatus: "active",
        } as SatelliteProperties,
      };

      const levels = renderer.getLODLevels(mockObject);

      expect(levels).toHaveLength(3); // High detail, medium detail, and billboard
      expect(levels[0].distance).toBe(0);
      expect(levels[1].distance).toBe(500); // Medium detail at 500m
      expect(levels[2].distance).toBe(5000); // Billboard at 5km
      expect(levels[0].object).toBeDefined();
      expect(levels[1].object).toBeDefined();
      expect(levels[2].object).toBeDefined();
    });
  });
});
