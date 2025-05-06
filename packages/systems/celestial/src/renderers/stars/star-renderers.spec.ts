import * as THREE from "three";
import { describe, it, expect, beforeEach } from "vitest";
import {
  CelestialObject,
  CelestialType,
  StarProperties,
} from "@teskooano/data-types";
import {
  createStarRenderer,
  BaseStarRenderer,
  ClassOStarRenderer,
  ClassBStarRenderer,
  ClassAStarRenderer,
  ClassFStarRenderer,
  ClassGStarRenderer,
  ClassKStarRenderer,
  ClassMStarRenderer,
  MainSequenceStarRenderer,
} from "./index";

describe("Star Renderers", () => {
  let mockStar: CelestialObject;

  beforeEach(() => {
    mockStar = {
      id: "test-star",
      type: CelestialType.STAR,
      name: "Test Star",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      radius: 10,
      mass: 1000,
      properties: {
        spectralClass: "G",
        luminosity: 1,
        temperature: 5800,
        color: "",
      } as StarProperties,
    };
  });

  it("should create the correct renderer based on spectral class", () => {
    expect(createStarRenderer("O")).toBeInstanceOf(ClassOStarRenderer);
    expect(createStarRenderer("B")).toBeInstanceOf(ClassBStarRenderer);
    expect(createStarRenderer("A")).toBeInstanceOf(ClassAStarRenderer);
    expect(createStarRenderer("F")).toBeInstanceOf(ClassFStarRenderer);
    expect(createStarRenderer("G")).toBeInstanceOf(ClassGStarRenderer);
    expect(createStarRenderer("K")).toBeInstanceOf(ClassKStarRenderer);
    expect(createStarRenderer("M")).toBeInstanceOf(ClassMStarRenderer);

    expect(createStarRenderer("g")).toBeInstanceOf(ClassGStarRenderer);

    expect(createStarRenderer()).toBeInstanceOf(MainSequenceStarRenderer);
    expect(createStarRenderer("")).toBeInstanceOf(MainSequenceStarRenderer);
    expect(createStarRenderer("X")).toBeInstanceOf(MainSequenceStarRenderer);
  });

  it("should create and dispose a mesh correctly", () => {
    const renderers = [
      new ClassOStarRenderer(),
      new ClassBStarRenderer(),
      new ClassAStarRenderer(),
      new ClassFStarRenderer(),
      new ClassGStarRenderer(),
      new ClassKStarRenderer(),
      new ClassMStarRenderer(),
      new MainSequenceStarRenderer(),
    ];

    renderers.forEach((renderer) => {
      const mesh = renderer.createMesh(mockStar);

      expect(mesh).toBeInstanceOf(THREE.Object3D);
      expect(mesh.name).toBe(mockStar.id);
      expect(mesh.position.x).toBe(mockStar.position.x);
      expect(mesh.position.y).toBe(mockStar.position.y);
      expect(mesh.position.z).toBe(mockStar.position.z);

      expect(mesh.children.length).toBeGreaterThan(0);
      expect(mesh.children[0].name).toBe(`${mockStar.id}-body`);

      renderer.dispose();
    });
  });

  it("should use the correct color for each spectral class", () => {
    const spectralClasses = ["O", "B", "A", "F", "G", "K", "M"];
    const expectedColors = [
      0x9bb0ff, 0xaabfff, 0xf8f7ff, 0xfff4ea, 0xffcc00, 0xffaa55, 0xff6644,
    ];

    spectralClasses.forEach((spectralClass, index) => {
      const starProps = mockStar.properties as StarProperties;
      starProps.spectralClass = spectralClass;
      starProps.color = "";

      const renderer = createStarRenderer(spectralClass);
      const mesh = renderer.createMesh(mockStar);

      const starBody = mesh.children.find(
        (child) => child.name === `${mockStar.id}-body`,
      );
      expect(starBody).toBeTruthy();

      const material = (starBody as THREE.Mesh)
        .material as THREE.ShaderMaterial;

      const starColor = material.uniforms.starColor.value as THREE.Color;

      const actualColorHex = starColor.getHex();
      const expectedColor = new THREE.Color(expectedColors[index]);

      expect(actualColorHex).toEqual(expectedColor.getHex());

      renderer.dispose();
    });
  });

  it("should animate and update without errors", () => {
    const renderer = createStarRenderer("G");

    renderer.createMesh(mockStar);

    expect(() => renderer.animate()).not.toThrow();
    expect(() => renderer.update(10)).not.toThrow();

    renderer.dispose();
  });
});
