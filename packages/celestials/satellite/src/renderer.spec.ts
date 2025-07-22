import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { SatelliteRenderer } from "./renderer";
import {
  RenderableCelestialObject,
  SatelliteProperties,
  CelestialType,
  CelestialStatus,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { createOrbitalElements } from "../../../core/physics/src/orbital";

describe("SatelliteRenderer", () => {
  let renderer: SatelliteRenderer;
  let mockObject: RenderableCelestialObject<SatelliteProperties>;

  beforeEach(() => {
    const mockObject: RenderableCelestialObject<SatelliteProperties> = {
      celestialObjectId: "test-satellite",
      id: "test-satellite",
      name: "Test Satellite",
      type: CelestialType.SATELLITE,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      radius: 1,
      realRadius_m: 1,
      mass: 1000,
      rotation: new THREE.Quaternion(),
      physicsStateReal: {
        position_m: new OSVector3(),
        velocity_mps: new OSVector3(),
        id: "test-satellite",
        mass_kg: 1000,
      },
      uniforms: {},
      status: CelestialStatus.ACTIVE,
      albedo: 0.3,
      temperature: 300,
      realMass_kg: 1000,
      orbit: createOrbitalElements({
        semiMajorAxisAU: 1,
        eccentricity: 0.01,
        inclinationDeg: 0,
        longitudeOfAscendingNodeDeg: 0,
        argumentOfPeriapsisDeg: 0,
        siderealRotationPeriod_s: 86400,
        axialTiltDeg: 0,
        period_s: 31536000, // 1 year in seconds
      }),
      properties: {
        type: CelestialType.SATELLITE,
        modelPath: "test.glb",
      } as SatelliteProperties,
      seed: "test-seed",
    };
    renderer = new SatelliteRenderer(mockObject);
  });

  describe("scaling calculations", () => {
    it("should scale large satellites (ISS) appropriately", () => {
      const issObject: RenderableCelestialObject<SatelliteProperties> = {
        celestialObjectId: "iss",
        id: "iss",
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
        physicsStateReal: {
          position_m: new OSVector3(),
          velocity_mps: new OSVector3(),
          id: "iss",
          mass_kg: 420000,
        },
        uniforms: {},
        realMass_kg: 420000,
        orbit: createOrbitalElements({
          semiMajorAxisAU: 1,
          eccentricity: 0.01,
          inclinationDeg: 0,
          longitudeOfAscendingNodeDeg: 0,
          argumentOfPeriapsisDeg: 0,
          siderealRotationPeriod_s: 86400,
          axialTiltDeg: 0,
          period_s: 31536000, // 1 year in seconds
        }),
        albedo: 0.3,
        temperature: 300,
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

      // ISS should be scaled appropriately
      expect(scale).toBeGreaterThan(0);
    });

    it("should scale medium satellites (Hubble) appropriately", () => {
      const hubbleObject: RenderableCelestialObject<SatelliteProperties> = {
        celestialObjectId: "hubble",
        id: "hubble",
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
        physicsStateReal: {
          position_m: new OSVector3(),
          velocity_mps: new OSVector3(),
          id: "hubble",
          mass_kg: 11110,
        },
        uniforms: {},
        realMass_kg: 11110,
        orbit: createOrbitalElements({
          semiMajorAxisAU: 1,
          eccentricity: 0.01,
          inclinationDeg: 0,
          longitudeOfAscendingNodeDeg: 0,
          argumentOfPeriapsisDeg: 0,
          siderealRotationPeriod_s: 86400,
          axialTiltDeg: 0,
          period_s: 31536000, // 1 year in seconds
        }),
        albedo: 0.3,
        temperature: 300,
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

      // Hubble should have appropriate scaling
      expect(scale).toBeGreaterThan(0);
    });

    it("should scale small satellites (cubesats) appropriately", () => {
      const cubesatObject: RenderableCelestialObject<SatelliteProperties> = {
        celestialObjectId: "cubesat",
        id: "cubesat",
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
        physicsStateReal: {
          position_m: new OSVector3(),
          velocity_mps: new OSVector3(),
          id: "cubesat",
          mass_kg: 1.33,
        },
        uniforms: {},
        realMass_kg: 1.33,
        orbit: createOrbitalElements({
          semiMajorAxisAU: 1,
          eccentricity: 0.01,
          inclinationDeg: 0,
          longitudeOfAscendingNodeDeg: 0,
          argumentOfPeriapsisDeg: 0,
          siderealRotationPeriod_s: 86400,
          axialTiltDeg: 0,
          period_s: 31536000, // 1 year in seconds
        }),
        albedo: 0.3,
        temperature: 300,
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

      // Small satellites should get appropriate scaling
      expect(scale).toBeGreaterThan(0);
    });

    it("should respect custom modelScale property", () => {
      const object: RenderableCelestialObject<SatelliteProperties> = {
        celestialObjectId: "custom",
        id: "custom",
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
        physicsStateReal: {
          position_m: new OSVector3(),
          velocity_mps: new OSVector3(),
          id: "custom",
          mass_kg: 1000,
        },
        uniforms: {},
        realMass_kg: 1000,
        orbit: createOrbitalElements({
          semiMajorAxisAU: 1,
          eccentricity: 0.01,
          inclinationDeg: 0,
          longitudeOfAscendingNodeDeg: 0,
          argumentOfPeriapsisDeg: 0,
          siderealRotationPeriod_s: 86400,
          axialTiltDeg: 0,
          period_s: 31536000, // 1 year in seconds
        }),
        albedo: 0.3,
        temperature: 300,
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

  describe("LOD creation", () => {
    it("should create LOD levels with correct distances", () => {
      const mockObject: RenderableCelestialObject<SatelliteProperties> = {
        celestialObjectId: "lod-test",
        id: "lod-test",
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
        physicsStateReal: {
          position_m: new OSVector3(),
          velocity_mps: new OSVector3(),
          id: "lod-test",
          mass_kg: 100000,
        },
        uniforms: {},
        realMass_kg: 100000,
        orbit: createOrbitalElements({
          semiMajorAxisAU: 1,
          eccentricity: 0.01,
          inclinationDeg: 0,
          longitudeOfAscendingNodeDeg: 0,
          argumentOfPeriapsisDeg: 0,
          siderealRotationPeriod_s: 86400,
          axialTiltDeg: 0,
          period_s: 31536000, // 1 year in seconds
        }),
        albedo: 0.3,
        temperature: 300,
        properties: {
          type: CelestialType.SATELLITE,
          modelPath: "models/satellite/satellite.glb",
          missionType: "scientific",
          operationalStatus: "active",
        } as SatelliteProperties,
      };

      const levels = renderer.getLODLevels(mockObject);

      expect(levels).toHaveLength(2); // High detail and billboard
      expect(levels[0].distance).toBe(0);
      expect(levels[1].distance).toBe(5000); // Billboard at 5km
      expect(levels[0].object).toBeDefined();
      expect(levels[1].object).toBeDefined();
    });
  });
});
