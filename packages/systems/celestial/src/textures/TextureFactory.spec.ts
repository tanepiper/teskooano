import { describe, it, expect, afterAll } from "vitest";
import * as THREE from "three";
import { TextureFactory } from "./TextureFactory";
import { GasGiantClass } from "@teskooano/data-types";
import { TextureResult } from "./TextureTypes";

describe("TextureFactory", () => {
  afterAll(() => {
    TextureFactory.dispose();
  });

  describe("generateGasGiantTexture", () => {
    it("should generate textures for different gas giant classes", () => {
      const classes = [
        GasGiantClass.CLASS_I,
        GasGiantClass.CLASS_II,
        GasGiantClass.CLASS_III,
        GasGiantClass.CLASS_IV,
        GasGiantClass.CLASS_V,
      ];

      classes.forEach((gasGiantClass) => {
        const textureResult = TextureFactory.generateGasGiantTexture({
          class: gasGiantClass,
          baseColor: new THREE.Color(0xccbb99),
          secondaryColor: new THREE.Color(0xbbaa88),
          textureSize: 256,
          seed: 12345,
        });

        expect(textureResult).toBeDefined();
        expect(textureResult.colorMap).toBeInstanceOf(THREE.Texture);

        if (textureResult.colorMap.image) {
          expect(textureResult.colorMap.image.width).toBeGreaterThan(0);
          expect(textureResult.colorMap.image.height).toBeGreaterThan(0);
        }

        expect(textureResult.colorMap.wrapS).toBe(THREE.RepeatWrapping);
        expect(textureResult.colorMap.wrapT).toBe(THREE.RepeatWrapping);
      });
    });

    it("should create textures with different seeds", () => {
      const textureResult1 = TextureFactory.generateGasGiantTexture({
        class: GasGiantClass.CLASS_I,
        baseColor: "#AABBCC",
        secondaryColor: "#CCDDEE",
        textureSize: 128,
        seed: 123,
      });

      const textureResult2 = TextureFactory.generateGasGiantTexture({
        class: GasGiantClass.CLASS_I,
        baseColor: "#AABBCC",
        secondaryColor: "#CCDDEE",
        textureSize: 128,
        seed: 456,
      });

      expect(textureResult1).toBeDefined();
      expect(textureResult2).toBeDefined();
      expect(textureResult1.colorMap).toBeInstanceOf(THREE.Texture);
      expect(textureResult2.colorMap).toBeInstanceOf(THREE.Texture);

      expect(textureResult1.colorMap).not.toBe(textureResult2.colorMap);
    });

    it("should return cached textures for identical parameters", () => {
      const options = {
        class: GasGiantClass.CLASS_I,
        baseColor: "#AABBCC",
        secondaryColor: "#CCDDEE",
        textureSize: 128,
        seed: 789,
      };

      const textureResult1 = TextureFactory.generateGasGiantTexture(options);
      const textureResult2 = TextureFactory.generateGasGiantTexture(options);

      expect(textureResult1).toBe(textureResult2);
      expect(textureResult1.colorMap).toBe(textureResult2.colorMap);
    });
  });

  describe("clearCache", () => {
    it("should clear the texture cache", () => {
      const options = {
        class: GasGiantClass.CLASS_I,
        baseColor: "#DDCCBB",
        textureSize: 128,
        seed: 1000,
      };

      const textureResult1 = TextureFactory.generateGasGiantTexture(options);

      TextureFactory.clearCache();

      const textureResult2 = TextureFactory.generateGasGiantTexture(options);

      expect(textureResult1).not.toBe(textureResult2);
      expect(textureResult1.colorMap).not.toBe(textureResult2.colorMap);
    });
  });

  describe("dispose", () => {
    it("should dispose resources without errors", () => {
      TextureFactory.generateGasGiantTexture({
        class: GasGiantClass.CLASS_I,
        baseColor: "#AABBCC",
        secondaryColor: "#CCDDEE",
        textureSize: 128,
      });

      expect(() => TextureFactory.dispose()).not.toThrow();

      expect(() => TextureFactory.dispose()).not.toThrow();
    });
  });
});
