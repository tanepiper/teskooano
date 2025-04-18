import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LightManager } from "../LightManager";
import * as THREE from "three";

describe("LightManager", () => {
  let lightManager: LightManager;
  let scene: THREE.Scene;

  beforeEach(() => {
    // Create a new scene for each test
    scene = new THREE.Scene();
    lightManager = new LightManager(scene);
  });

  afterEach(() => {
    // Clean up
    lightManager.dispose();
  });

  it("should add a star light to the scene", () => {
    const position = new THREE.Vector3(100, 200, 300);
    const color = 0xff0000;
    const intensity = 2.0;
    const id = "star1";

    lightManager.addStarLight(id, position, color, intensity);

    // Get the light from the scene
    const light = scene.children[0] as THREE.PointLight;

    // Verify light properties
    expect(light).toBeInstanceOf(THREE.PointLight);
    expect(light.color.getHex()).toBe(color);
    expect(light.intensity).toBe(intensity);
    expect(light.position.x).toBe(position.x);
    expect(light.position.y).toBe(position.y);
    expect(light.position.z).toBe(position.z);
    expect(light.decay).toBe(0.5); // Check decay parameter
    expect(light.distance).toBe(0); // Check distance parameter
  });

  it("should add a star light with default parameters", () => {
    const position = new THREE.Vector3(100, 200, 300);
    const id = "star1";

    lightManager.addStarLight(id, position);

    const light = scene.children[0] as THREE.PointLight;

    // Verify default properties
    expect(light.color.getHex()).toBe(0xffffff);
    expect(light.intensity).toBe(1.5);
  });

  it("should update star light position", () => {
    const initialPosition = new THREE.Vector3(100, 200, 300);
    const id = "star1";

    // Add a light
    lightManager.addStarLight(id, initialPosition);

    // Update position
    const newPosition = new THREE.Vector3(400, 500, 600);
    lightManager.updateStarLight(id, newPosition);

    const light = scene.children[0] as THREE.PointLight;

    // Verify new position
    expect(light.position.x).toBe(newPosition.x);
    expect(light.position.y).toBe(newPosition.y);
    expect(light.position.z).toBe(newPosition.z);
  });

  it("should not throw when updating non-existent light", () => {
    const position = new THREE.Vector3(100, 200, 300);

    // This should not throw
    expect(() => {
      lightManager.updateStarLight("nonexistent", position);
    }).not.toThrow();
  });

  it("should remove star light from scene", () => {
    const position = new THREE.Vector3(100, 200, 300);
    const id = "star1";

    // Add a light
    lightManager.addStarLight(id, position);
    expect(scene.children.length).toBe(1);

    // Remove the light
    lightManager.removeStarLight(id);
    expect(scene.children.length).toBe(0);
  });

  it("should not throw when removing non-existent light", () => {
    expect(() => {
      lightManager.removeStarLight("nonexistent");
    }).not.toThrow();
  });

  it("should get all star light positions", () => {
    const positions = [
      new THREE.Vector3(100, 200, 300),
      new THREE.Vector3(400, 500, 600),
    ];
    const ids = ["star1", "star2"];

    // Add multiple lights
    positions.forEach((pos, index) => {
      lightManager.addStarLight(ids[index], pos);
    });

    const lightPositions = lightManager.getStarLightPositions();

    // Verify positions map
    expect(lightPositions.size).toBe(2);
    positions.forEach((pos, index) => {
      const lightPos = lightPositions.get(ids[index]);
      expect(lightPos).toBeDefined();
      expect(lightPos?.x).toBe(pos.x);
      expect(lightPos?.y).toBe(pos.y);
      expect(lightPos?.z).toBe(pos.z);
    });
  });

  it("should dispose all lights", () => {
    // Add multiple lights
    const positions = [
      new THREE.Vector3(100, 200, 300),
      new THREE.Vector3(400, 500, 600),
    ];
    positions.forEach((pos, index) => {
      lightManager.addStarLight(`star${index}`, pos);
    });

    expect(scene.children.length).toBe(2);

    // Dispose lights
    lightManager.dispose();

    // Verify all lights are removed
    expect(scene.children.length).toBe(0);
  });

  it("should handle multiple operations on the same light", () => {
    const id = "star1";
    const initialPos = new THREE.Vector3(100, 200, 300);
    const updatedPos = new THREE.Vector3(400, 500, 600);

    // Add light
    lightManager.addStarLight(id, initialPos);
    expect(scene.children.length).toBe(1);

    // Update position
    lightManager.updateStarLight(id, updatedPos);
    const light = scene.children[0] as THREE.PointLight;
    expect(light.position.x).toBe(updatedPos.x);
    expect(light.position.y).toBe(updatedPos.y);
    expect(light.position.z).toBe(updatedPos.z);

    // Remove light
    lightManager.removeStarLight(id);
    expect(scene.children.length).toBe(0);

    // Try to update after removal (should not throw)
    expect(() => {
      lightManager.updateStarLight(id, initialPos);
    }).not.toThrow();
  });
});
