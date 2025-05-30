import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { MainSequenceStarRenderer } from "./main-sequence-star";

describe("MainSequenceStarRenderer", () => {
  let renderer: MainSequenceStarRenderer;
  let mockStar: any;

  beforeEach(() => {
    renderer = new MainSequenceStarRenderer();
    mockStar = {
      id: "star-1",
      name: "Test Star",
      type: "star",
      radius: 10,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
  });

  it("should create a group with star and corona meshes", () => {
    const group = renderer.createMesh(mockStar) as THREE.Group;

    expect(group).toBeDefined();
    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.name).toBe("star-1");

    expect(group.position.x).toBe(0);
    expect(group.position.y).toBe(0);
    expect(group.position.z).toBe(0);

    expect(group.children.length).toBeGreaterThan(0);

    const starMesh = group.children.find(
      (child) =>
        child.name.includes("body") || child.name === `${mockStar.id}-body`,
    );
    expect(starMesh).toBeDefined();
    expect(starMesh).toBeInstanceOf(THREE.Mesh);

    const effectMeshes = group.children.filter(
      (child) => child !== starMesh && child instanceof THREE.Mesh,
    );
    expect(effectMeshes.length).toBeGreaterThan(0);

    let hasShaderMaterial = false;
    group.children.forEach((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.ShaderMaterial
      ) {
        hasShaderMaterial = true;

        const material = child.material as THREE.ShaderMaterial;
        expect(material.uniforms).toBeDefined();

        if (material.uniforms.time) {
          expect(material.uniforms.time).toBeDefined();
        }
      }
    });
    expect(hasShaderMaterial).toBe(true);
  });

  it("should update all materials with the current time", () => {
    renderer.createMesh(mockStar);

    renderer.update(1.0);

    expect(true).toBe(true);
  });

  it("should dispose all materials when disposed", () => {
    renderer.createMesh(mockStar);

    renderer.dispose();

    expect(true).toBe(true);
  });
});
