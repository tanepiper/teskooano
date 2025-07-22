import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { MaterialManager } from "./MaterialManager";

describe("MaterialManager", () => {
  let materialManager: MaterialManager;
  let testMaterial: THREE.Material;
  let testMaterial2: THREE.Material;

  beforeEach(() => {
    materialManager = new MaterialManager();
    testMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    testMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  });

  describe("registerMaterial", () => {
    it("should register a single material", () => {
      materialManager.registerMaterial("test", testMaterial);

      expect(materialManager.hasMaterial("test")).toBe(true);
      expect(materialManager.getMaterial("test")).toBe(testMaterial);
    });

    it("should register multiple materials with the same id", () => {
      const materials = [testMaterial, testMaterial2];
      materialManager.registerMaterials("test", materials);

      expect(materialManager.hasMaterial("test")).toBe(true);
      const result = materialManager.getMaterial("test");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it("should overwrite existing material", () => {
      materialManager.registerMaterial("test", testMaterial);
      materialManager.registerMaterial("test", testMaterial2);

      expect(materialManager.getMaterial("test")).toBe(testMaterial2);
    });
  });

  describe("getMaterial", () => {
    it("should return undefined for non-existent material", () => {
      expect(materialManager.getMaterial("nonexistent")).toBeUndefined();
    });

    it("should return registered material", () => {
      materialManager.registerMaterial("test", testMaterial);
      expect(materialManager.getMaterial("test")).toBe(testMaterial);
    });
  });

  describe("removeMaterial", () => {
    it("should remove existing material", () => {
      materialManager.registerMaterial("test", testMaterial);
      const removed = materialManager.removeMaterial("test");

      expect(removed).toBe(true);
      expect(materialManager.hasMaterial("test")).toBe(false);
    });

    it("should return false for non-existent material", () => {
      const removed = materialManager.removeMaterial("nonexistent");
      expect(removed).toBe(false);
    });
  });

  describe("hasMaterial", () => {
    it("should return true for existing material", () => {
      materialManager.registerMaterial("test", testMaterial);
      expect(materialManager.hasMaterial("test")).toBe(true);
    });

    it("should return false for non-existent material", () => {
      expect(materialManager.hasMaterial("nonexistent")).toBe(false);
    });
  });

  describe("getMaterialCount", () => {
    it("should return correct count", () => {
      expect(materialManager.getMaterialCount()).toBe(0);

      materialManager.registerMaterial("test1", testMaterial);
      expect(materialManager.getMaterialCount()).toBe(1);

      materialManager.registerMaterial("test2", testMaterial2);
      expect(materialManager.getMaterialCount()).toBe(2);
    });
  });

  describe("getMaterialIds", () => {
    it("should return array of material ids", () => {
      materialManager.registerMaterial("test1", testMaterial);
      materialManager.registerMaterial("test2", testMaterial2);

      const ids = materialManager.getMaterialIds();
      expect(ids).toContain("test1");
      expect(ids).toContain("test2");
      expect(ids).toHaveLength(2);
    });
  });

  describe("applyTexture", () => {
    it("should apply texture to material property", () => {
      const texture = new THREE.Texture();
      const material = new THREE.MeshBasicMaterial();

      materialManager.applyTexture(material, "map", texture);

      expect(material.map).toBe(texture);
    });

    it("should apply texture to material uniform", () => {
      const texture = new THREE.Texture();
      const material = new THREE.ShaderMaterial({
        uniforms: { testTexture: { value: null } },
      });

      materialManager.applyTexture(material, "testTexture", texture);

      expect(material.uniforms.testTexture.value).toBe(texture);
    });

    it("should handle null texture", () => {
      const material = new THREE.MeshBasicMaterial();
      const originalTexture = new THREE.Texture();
      material.map = originalTexture;

      materialManager.applyTexture(material, "map", null);

      expect(material.map).toBeNull();
    });
  });

  describe("dispose", () => {
    it("should dispose all materials and clear the map", () => {
      const disposeSpy1 = vi.spyOn(testMaterial, "dispose");
      const disposeSpy2 = vi.spyOn(testMaterial2, "dispose");

      materialManager.registerMaterial("test1", testMaterial);
      materialManager.registerMaterial("test2", testMaterial2);

      materialManager.dispose();

      expect(disposeSpy1).toHaveBeenCalled();
      expect(disposeSpy2).toHaveBeenCalled();
      expect(materialManager.getMaterialCount()).toBe(0);
    });

    it("should dispose material arrays", () => {
      const materials = [testMaterial, testMaterial2];
      const disposeSpy1 = vi.spyOn(testMaterial, "dispose");
      const disposeSpy2 = vi.spyOn(testMaterial2, "dispose");

      materialManager.registerMaterials("test", materials);
      materialManager.dispose();

      expect(disposeSpy1).toHaveBeenCalled();
      expect(disposeSpy2).toHaveBeenCalled();
    });
  });
});
