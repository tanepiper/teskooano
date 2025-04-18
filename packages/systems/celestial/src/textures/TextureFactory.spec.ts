import { describe, it, expect, afterAll } from 'vitest';
import * as THREE from 'three';
import { TextureFactory } from './TextureFactory';
import { GasGiantClass } from '@teskooano/data-types';
import { TextureResult } from './TextureTypes';

// Test the TextureFactory methods in browser context
describe('TextureFactory', () => {
  // Clean up resources after all tests
  afterAll(() => {
    TextureFactory.dispose();
  });
  
  describe('generateGasGiantTexture', () => {
    it('should generate textures for different gas giant classes', () => {
      // Test each gas giant class
      const classes = [
        GasGiantClass.CLASS_I,
        GasGiantClass.CLASS_II,
        GasGiantClass.CLASS_III,
        GasGiantClass.CLASS_IV,
        GasGiantClass.CLASS_V
      ];
      
      classes.forEach(gasGiantClass => {
        // Generate texture for this class
        const textureResult = TextureFactory.generateGasGiantTexture({
          class: gasGiantClass,
          baseColor: new THREE.Color(0xCCBB99),
          secondaryColor: new THREE.Color(0xBBAA88),
          textureSize: 256, // Use smaller size for faster tests
          seed: 12345 // Fixed seed for reproducibility
        });
        
        // Verify texture properties
        expect(textureResult).toBeDefined();
        expect(textureResult.colorMap).toBeInstanceOf(THREE.Texture);
        
        // In browser-based testing, we may not be able to directly check image properties
        // as they might not be fully initialized immediately
        if (textureResult.colorMap.image) {
          expect(textureResult.colorMap.image.width).toBeGreaterThan(0);
          expect(textureResult.colorMap.image.height).toBeGreaterThan(0);
        }
        
        // Verify texture has correct wrapping and filtering
        expect(textureResult.colorMap.wrapS).toBe(THREE.RepeatWrapping);
        expect(textureResult.colorMap.wrapT).toBe(THREE.RepeatWrapping);
      });
    });
    
    it('should create textures with different seeds', () => {
      // Generate two textures with different seeds
      const textureResult1 = TextureFactory.generateGasGiantTexture({
        class: GasGiantClass.CLASS_I,
        baseColor: '#AABBCC',
        secondaryColor: '#CCDDEE',
        textureSize: 128,
        seed: 123
      });
      
      const textureResult2 = TextureFactory.generateGasGiantTexture({
        class: GasGiantClass.CLASS_I,
        baseColor: '#AABBCC',
        secondaryColor: '#CCDDEE',
        textureSize: 128,
        seed: 456
      });
      
      // Simply check that textures were created
      expect(textureResult1).toBeDefined();
      expect(textureResult2).toBeDefined();
      expect(textureResult1.colorMap).toBeInstanceOf(THREE.Texture);
      expect(textureResult2.colorMap).toBeInstanceOf(THREE.Texture);
      
      // The actual content comparison is difficult in browser environment
      // without direct pixel access, so we just verify they're not the same object
      expect(textureResult1.colorMap).not.toBe(textureResult2.colorMap);
    });
    
    it('should return cached textures for identical parameters', () => {
      // Generate the same texture twice
      const options = {
        class: GasGiantClass.CLASS_I,
        baseColor: '#AABBCC',
        secondaryColor: '#CCDDEE',
        textureSize: 128,
        seed: 789
      };
      
      const textureResult1 = TextureFactory.generateGasGiantTexture(options);
      const textureResult2 = TextureFactory.generateGasGiantTexture(options);
      
      // Verify they're the same object (from cache)
      expect(textureResult1).toBe(textureResult2);
      expect(textureResult1.colorMap).toBe(textureResult2.colorMap);
    });
  });
  
  describe('clearCache', () => {
    it('should clear the texture cache', () => {
      // Generate a texture
      const options = {
        class: GasGiantClass.CLASS_I,
        baseColor: '#DDCCBB',
        textureSize: 128,
        seed: 1000
      };
      
      // Generate once to cache
      const textureResult1 = TextureFactory.generateGasGiantTexture(options);
      
      // Clear cache
      TextureFactory.clearCache();
      
      // Generate again
      const textureResult2 = TextureFactory.generateGasGiantTexture(options);
      
      // Verify we got a new texture, not from cache
      expect(textureResult1).not.toBe(textureResult2);
      expect(textureResult1.colorMap).not.toBe(textureResult2.colorMap);
    });
  });
  
  describe('dispose', () => {
    it('should dispose resources without errors', () => {
      // First generate a texture to ensure there are resources to dispose
      TextureFactory.generateGasGiantTexture({
        class: GasGiantClass.CLASS_I,
        baseColor: '#AABBCC',
        secondaryColor: '#CCDDEE',
        textureSize: 128
      });
      
      // Then dispose
      expect(() => TextureFactory.dispose()).not.toThrow();
      
      // Calling dispose again should also not throw
      expect(() => TextureFactory.dispose()).not.toThrow();
    });
  });
}); 