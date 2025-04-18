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
  // Mock star object for testing
  let mockStar: CelestialObject;

  beforeEach(() => {
    // Set up a default mock star
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
    // Test each spectral class
    expect(createStarRenderer("O")).toBeInstanceOf(ClassOStarRenderer);
    expect(createStarRenderer("B")).toBeInstanceOf(ClassBStarRenderer);
    expect(createStarRenderer("A")).toBeInstanceOf(ClassAStarRenderer);
    expect(createStarRenderer("F")).toBeInstanceOf(ClassFStarRenderer);
    expect(createStarRenderer("G")).toBeInstanceOf(ClassGStarRenderer);
    expect(createStarRenderer("K")).toBeInstanceOf(ClassKStarRenderer);
    expect(createStarRenderer("M")).toBeInstanceOf(ClassMStarRenderer);

    // Test case insensitivity
    expect(createStarRenderer("g")).toBeInstanceOf(ClassGStarRenderer);

    // Test default case
    expect(createStarRenderer()).toBeInstanceOf(MainSequenceStarRenderer);
    expect(createStarRenderer("")).toBeInstanceOf(MainSequenceStarRenderer);
    expect(createStarRenderer("X")).toBeInstanceOf(MainSequenceStarRenderer);
  });

  it("should create and dispose a mesh correctly", () => {
    // For each renderer type
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
      // Create mesh
      const mesh = renderer.createMesh(mockStar);

      // Basic assertions about the created mesh
      expect(mesh).toBeInstanceOf(THREE.Object3D);
      expect(mesh.name).toBe(mockStar.id);
      expect(mesh.position.x).toBe(mockStar.position.x);
      expect(mesh.position.y).toBe(mockStar.position.y);
      expect(mesh.position.z).toBe(mockStar.position.z);

      // Check children - should have the main star body and corona elements
      expect(mesh.children.length).toBeGreaterThan(0);
      expect(mesh.children[0].name).toBe(`${mockStar.id}-body`);

      // Dispose without errors
      renderer.dispose();
    });
  });

  it("should use the correct color for each spectral class", () => {
    // Test for each spectral class
    const spectralClasses = ["O", "B", "A", "F", "G", "K", "M"];
    const expectedColors = [
      0x9bb0ff, // O - Blue
      0xaabfff, // B - Bluish white
      0xf8f7ff, // A - White
      0xfff4ea, // F - Yellowish white
      0xffcc00, // G - Yellow
      0xffaa55, // K - Light orange
      0xff6644, // M - Light orangish red
    ];

    spectralClasses.forEach((spectralClass, index) => {
      // Update the mock star with current spectral class
      const starProps = mockStar.properties as StarProperties;
      starProps.spectralClass = spectralClass;
      starProps.color = ""; // Reset color to use spectral class coloring

      // Create renderer and mesh
      const renderer = createStarRenderer(spectralClass);
      const mesh = renderer.createMesh(mockStar);

      // Access the main star body
      const starBody = mesh.children.find(
        (child) => child.name === `${mockStar.id}-body`,
      );
      expect(starBody).toBeTruthy();

      // Get the material and check the color (more complex in reality but simplified for test)
      const material = (starBody as THREE.Mesh)
        .material as THREE.ShaderMaterial;

      // Get the star color from uniforms
      const starColor = material.uniforms.starColor.value as THREE.Color;

      // Convert actual color to hex and expected color to THREE.Color for comparison
      const actualColorHex = starColor.getHex();
      const expectedColor = new THREE.Color(expectedColors[index]);

      // Compare colors (allowing for small differences in representation)
      expect(actualColorHex).toEqual(expectedColor.getHex());

      // Clean up
      renderer.dispose();
    });
  });

  it("should animate and update without errors", () => {
    // Create a renderer
    const renderer = createStarRenderer("G");

    // Create a mesh
    renderer.createMesh(mockStar);

    // Test animation methods
    expect(() => renderer.animate()).not.toThrow();
    expect(() => renderer.update(10)).not.toThrow();

    // Clean up
    renderer.dispose();
  });
});
