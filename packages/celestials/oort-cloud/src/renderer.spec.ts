import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { OortCloudRenderer } from "./renderer";
import {
  CelestialType,
  CelestialStatus,
  type OortCloudProperties,
  type RenderableCelestialObject,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

// Mock THREE.TextureLoader
vi.mock("three", async () => {
  const actual = await vi.importActual("three");
  return {
    ...actual,
    TextureLoader: vi.fn().mockImplementation(() => ({
      load: vi.fn().mockImplementation((url, onLoad, onError) => {
        // Create a mock texture
        const mockTexture = {
          uuid: Math.random().toString(),
          name: url,
          image: { width: 64, height: 64 },
          needsUpdate: false,
        } as THREE.Texture;

        // Simulate successful load
        if (onLoad) {
          setTimeout(() => onLoad(mockTexture), 0);
        }
      }),
    })),
  };
});

describe("OortCloudRenderer", () => {
  let renderer: OortCloudRenderer;
  let mockObject: RenderableCelestialObject<OortCloudProperties>;

  beforeEach(() => {
    const oortCloudProperties: OortCloudProperties = {
      type: CelestialType.OORT_CLOUD,
      innerRadiusAU: 2000,
      outerRadiusAU: 20000,
      visualParticleCount: 1000,
      visualDensity: 0.1,
      visualParticleColor: "#161717",
      composition: ["ice"],
      // Additional properties for consistency
      count: 1000,
      color: "#161717",
      // No texturePaths provided - will use fallback textures
    };

    mockObject = {
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
      temperature: 200,
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

  it("should create LOD levels with instanced meshes", () => {
    const lodLevels = renderer.getLODLevels(mockObject);

    expect(lodLevels).toBeDefined();
    expect(lodLevels.length).toBeGreaterThan(0);

    const level = lodLevels[0];
    expect(level.object).toBeInstanceOf(THREE.InstancedMesh);
    expect(level.distance).toBe(0);

    const instancedMesh = level.object as THREE.InstancedMesh;
    expect(instancedMesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(instancedMesh.material).toBeInstanceOf(THREE.ShaderMaterial);
  });

  it("should create material with proper properties", () => {
    const material = renderer["createMaterial"](mockObject);

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.uniforms).toBeDefined();
    expect(material.uniforms.asteroidTextures).toBeDefined();
    expect(material.uniforms.beltRotationAngle).toBeDefined();
    expect(material.uniforms.time).toBeDefined();
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

  it("should create multiple LOD levels with different distances", () => {
    const lodLevels = renderer.getLODLevels(mockObject);

    expect(lodLevels.length).toBeGreaterThan(1);

    // Check that distances are in ascending order
    for (let i = 1; i < lodLevels.length; i++) {
      expect(lodLevels[i].distance).toBeGreaterThanOrEqual(
        lodLevels[i - 1].distance,
      );
    }

    // Check that all levels have valid objects
    lodLevels.forEach((level) => {
      expect(level.object).toBeInstanceOf(THREE.InstancedMesh);
    });
  });

  it("should handle texture paths when provided", () => {
    const objectWithTextures: RenderableCelestialObject<OortCloudProperties> = {
      ...mockObject,
      properties: {
        ...mockObject.properties!,
        texturePaths: [
          "space/textures/asteroids/asteroid_1.png",
          "space/textures/asteroids/asteroid_2.png",
        ],
      },
    };

    const rendererWithTextures = new OortCloudRenderer(objectWithTextures);
    const material = rendererWithTextures["createMaterial"](objectWithTextures);

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.uniforms.asteroidTextures).toBeDefined();
  });
});
