import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createStarField, createStarLayers, updateStarColors, BASE_DISTANCE } from '../../background-manager/star-field';

describe('Star Field Module', () => {
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
  });

  it('should create a star field with the correct parameters', () => {
    const count = 1000;
    const baseDistance = 10000;
    const distanceSpread = 2000;
    const minBrightness = 0.5;
    const maxBrightness = 1.0;
    const size = 3.0;
    
    const starField = createStarField(
      count,
      baseDistance,
      distanceSpread,
      minBrightness,
      maxBrightness,
      size
    );
    
    expect(starField).toBeDefined();
    expect(starField).toBeInstanceOf(THREE.Points);
    expect(starField.geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(starField.material).toBeInstanceOf(THREE.PointsMaterial);
    
    // Verify material properties
    const material = starField.material as THREE.PointsMaterial;
    expect(material.size).toBe(size);
    expect(material.vertexColors).toBe(true);
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBe(0.8);
    expect(material.sizeAttenuation).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(material.fog).toBe(false);
    
    // Verify geometry attributes
    expect(starField.geometry.attributes.position).toBeDefined();
    expect(starField.geometry.attributes.color).toBeDefined();
    expect(starField.geometry.attributes.position.count).toBe(count);
    expect(starField.geometry.attributes.color.count).toBe(count);
  });
  
  it('should create star layers', () => {
    const layers = createStarLayers();
    
    expect(layers).toBeDefined();
    expect(layers.length).toBe(3);
    
    // Verify each layer is a THREE.Points instance
    layers.forEach(layer => {
      expect(layer).toBeInstanceOf(THREE.Points);
      expect(layer.geometry).toBeInstanceOf(THREE.BufferGeometry);
      expect(layer.material).toBeInstanceOf(THREE.PointsMaterial);
    });
  });
  
  it('should update star colors in debug mode', () => {
    // Create star layers
    const layers = createStarLayers();
    
    // Call updateStarColors in debug mode
    updateStarColors(layers, true);
    
    // Verify colors were updated
    layers.forEach(layer => {
      const colorAttribute = layer.geometry.attributes.color;
      expect(colorAttribute).toBeDefined();
      
      // Check that colors are not all white (which would be the default)
      const colorArray = colorAttribute.array as Float32Array;
      let hasNonWhiteColor = false;
      
      for (let i = 0; i < colorArray.length; i += 3) {
        if (colorArray[i] !== 1 || colorArray[i + 1] !== 1 || colorArray[i + 2] !== 1) {
          hasNonWhiteColor = true;
          break;
        }
      }
      
      expect(hasNonWhiteColor).toBe(true);
    });
  });
  
  it('should export BASE_DISTANCE constant', () => {
    expect(BASE_DISTANCE).toBeDefined();
    expect(typeof BASE_DISTANCE).toBe('number');
  });
}); 