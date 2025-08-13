import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { AsteroidFieldRenderer } from "./renderer";
import {
  CelestialType,
  CelestialStatus,
  type AsteroidFieldProperties,
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

describe("AsteroidFieldRenderer", () => {
  let renderer: AsteroidFieldRenderer;
  let mockObject: RenderableCelestialObject<AsteroidFieldProperties>;

  beforeEach(() => {
    const asteroidFieldProperties: AsteroidFieldProperties = {
      type: CelestialType.ASTEROID_FIELD,
      innerRadiusAU: 2.1,
      outerRadiusAU: 3.3,
      heightAU: 0.5,
      count: 50000,
      color: "#b4afac",
      composition: ["silicates", "carbonaceous", "metallic"],
      // No texturePaths provided - will use fallback textures
    };

    mockObject = {
      id: "test-asteroid-field",
      name: "Test Asteroid Field",
      type: CelestialType.ASTEROID_FIELD,
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
      properties: asteroidFieldProperties,
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
        id: "test-asteroid-field",
        mass_kg: 1e20,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      isVisible: true,
      isTargetable: true,
      isSelected: false,
      isFocused: false,
    } as RenderableCelestialObject<AsteroidFieldProperties>;

    renderer = new AsteroidFieldRenderer(mockObject);
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
      expect(level.object).toBeInstanceOf(THREE.Points);
    });
  });

  it("should handle texture paths when provided", () => {
    const objectWithTextures: RenderableCelestialObject<AsteroidFieldProperties> =
      {
        ...mockObject,
        properties: {
          ...mockObject.properties!,
          texturePaths: [
            "space/textures/asteroids/asteroid_1.png",
            "space/textures/asteroids/asteroid_2.png",
          ],
        },
      };

    const rendererWithTextures = new AsteroidFieldRenderer(objectWithTextures);
    const material = rendererWithTextures["createMaterial"](objectWithTextures);

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.uniforms.asteroidTextures).toBeDefined();
  });
});
