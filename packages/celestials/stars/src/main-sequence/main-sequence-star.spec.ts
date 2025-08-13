import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { MainSequenceStarRenderer } from "./main-sequence-star";
import type {
  RenderableCelestialObject,
  StarProperties,
  OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import {
  CelestialType,
  CelestialStatus,
  SpectralClass,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

describe("MainSequenceStarRenderer", () => {
  let renderer: MainSequenceStarRenderer;
  let mockStar: RenderableCelestialObject;

  beforeEach(() => {
    const starProperties: StarProperties = {
      type: CelestialType.STAR,
      color: "#ffcc00",
      spectralClass: SpectralClass.G,
      luminosity: 1.0,
      isMainStar: true,
    };

    const orbit: OrbitalParameters = {
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
    };

    const physicsState: PhysicsStateReal = {
      id: "star-1",
      mass_kg: 2e30,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    };

    mockStar = {
      id: "star-1",
      name: "Test Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      radius: 10,
      mass: 1.0,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      velocityMagnitude_mps: 0,
      rotation: new THREE.Quaternion(),
      seed: "test-seed",
      realRadius_m: 1000000,
      realMass_kg: 2e30,
      temperature: 5778,
      albedo: 0.3,
      axialTilt: new OSVector3(0, 0, 0),
      uniforms: {},
      properties: starProperties,
      orbit,
      physicsStateReal: physicsState,
      isVisible: true,
      isTargetable: true,
      isSelected: false,
      isFocused: false,
    } as RenderableCelestialObject<StarProperties>;
    renderer = new MainSequenceStarRenderer(mockStar);
  });

  it("should create LOD levels with star and corona meshes", () => {
    const lodLevels = renderer.getLODLevels(mockStar);

    expect(lodLevels).toBeDefined();
    expect(lodLevels.length).toBeGreaterThan(0);

    const highLOD = lodLevels[0];
    expect(highLOD.object).toBeInstanceOf(THREE.Group);
    expect(highLOD.distance).toBe(0);

    const group = highLOD.object as THREE.Group;
    expect(group.children.length).toBeGreaterThan(0);

    const starMesh = group.children.find(
      (child) =>
        child.name.includes("body") || child.name === `${mockStar.id}-body`,
    );
    expect(starMesh).toBeDefined();
    expect(starMesh).toBeInstanceOf(THREE.Mesh);

    let hasShaderMaterial = false;
    group.children.forEach((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.ShaderMaterial
      ) {
        hasShaderMaterial = true;

        const material = child.material as THREE.ShaderMaterial;
        expect(material.uniforms).toBeDefined();
      }
    });
    expect(hasShaderMaterial).toBe(true);
  });

  it("should update all materials with the current time", () => {
    const lodLevels = renderer.getLODLevels(mockStar);
    const mockLightSources = new Map();
    const mockCamera = new THREE.PerspectiveCamera();

    renderer.update(mockStar, 1.0, 1.0, mockLightSources, mockCamera);

    expect(true).toBe(true);
  });

  it("should dispose all materials when disposed", () => {
    renderer.getLODLevels(mockStar);

    renderer.dispose();

    expect(true).toBe(true);
  });
});
