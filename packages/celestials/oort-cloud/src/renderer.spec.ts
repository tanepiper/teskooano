import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { OortCloudRenderer } from "./renderer";
import {
  CelestialType,
  CelestialStatus,
  type OortCloudProperties,
  type RenderableCelestialObject,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

describe("OortCloudRenderer", () => {
  let renderer: OortCloudRenderer;
  let mockObject: RenderableCelestialObject<OortCloudProperties>;

  beforeEach(() => {
    const oortCloudProperties: OortCloudProperties = {
      type: CelestialType.OORT_CLOUD,
      innerRadiusAU: 2000,
      outerRadiusAU: 20000,
      composition: ["ice"],
      visualDensity: 0.1,
      visualParticleCount: 150,
      visualParticleColor: "#353536",
      // No texturePaths provided - will use fallback texture
    };

    mockObject = {
      celestialObjectId: "test-oort-cloud",
      id: "test-oort-cloud",
      name: "Test Oort Cloud",
      type: CelestialType.OORT_CLOUD,
      status: CelestialStatus.ACTIVE,
      radius: 1,
      mass: 1.0,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      velocityMagnitude_mps: 0,
      rotation: new THREE.Quaternion(),
      seed: "test-seed",
      realRadius_m: 1000000,
      realMass_kg: 1e20,
      temperature: 50,
      albedo: 0.1,
      axialTilt: new OSVector3(0, 0, 0),
      uniforms: {},
      properties: oortCloudProperties,
      orbit: {
        realSemiMajorAxis_m: 0,
        realAphelion_m: 0,
        realPerihelion_m: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 0,
        averageOrbitalSpeed_mps: 0,
        epoch: "J2000",
      },
      physicsStateReal: {
        id: "test-oort-cloud",
        mass_kg: 1e20,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      isVisible: true,
      isTargetable: true,
      isSelected: false,
      isFocused: false,
    } as RenderableCelestialObject<OortCloudProperties>;

    renderer = new OortCloudRenderer(mockObject);
  });

  it("should create LOD levels with points mesh", () => {
    const lodLevels = renderer.getLODLevels(mockObject);

    expect(lodLevels).toBeDefined();
    expect(lodLevels.length).toBeGreaterThan(0);

    const level = lodLevels[0];
    expect(level.object).toBeInstanceOf(THREE.Points);
    expect(level.distance).toBe(0);

    const points = level.object as THREE.Points;
    expect(points.geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(points.material).toBeInstanceOf(THREE.ShaderMaterial);
  });

  it("should create mesh components with geometry and material", () => {
    const { geometry, material } = renderer.getMeshComponents(mockObject);

    expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(material).toBeInstanceOf(THREE.ShaderMaterial);

    // Check that geometry has required attributes
    expect(geometry.attributes.position).toBeDefined();
    expect(geometry.attributes.color).toBeDefined();
    expect(geometry.attributes.size).toBeDefined();
    expect(geometry.attributes.initialRotation).toBeDefined();
  });

  it("should create a points mesh", () => {
    const mesh = renderer.createMesh(mockObject);

    expect(mesh).toBeInstanceOf(THREE.Points);
    expect(mesh.name).toBe("test-oort-cloud-oortcloud");
    expect(mesh.visible).toBe(true);
    expect(mesh.frustumCulled).toBe(true);
  });

  it("should handle update calls without errors", () => {
    const mockLightSources = new Map();
    const mockCamera = new THREE.PerspectiveCamera();

    expect(() => {
      renderer.update(mockObject, 1.0, 1.0, mockLightSources, mockCamera);
    }).not.toThrow();
  });

  it("should dispose resources without errors", () => {
    renderer.getLODLevels(mockObject);

    expect(() => {
      renderer.dispose();
    }).not.toThrow();
  });

  it("should handle texture paths when provided", () => {
    const oortCloudWithTextures: OortCloudProperties = {
      type: CelestialType.OORT_CLOUD,
      innerRadiusAU: 2000,
      outerRadiusAU: 20000,
      composition: ["ice"],
      visualDensity: 0.1,
      visualParticleCount: 150,
      visualParticleColor: "#353536",
      texturePaths: [
        "space/textures/asteroids/asteroid_1.png",
        "space/textures/asteroids/asteroid_2.png",
      ],
    };

    const mockObjectWithTextures = {
      ...mockObject,
      properties: oortCloudWithTextures,
    } as RenderableCelestialObject<OortCloudProperties>;

    const rendererWithTextures = new OortCloudRenderer(mockObjectWithTextures);
    const lodLevels = rendererWithTextures.getLODLevels(mockObjectWithTextures);

    expect(lodLevels).toBeDefined();
    expect(lodLevels.length).toBeGreaterThan(0);
  });
});
