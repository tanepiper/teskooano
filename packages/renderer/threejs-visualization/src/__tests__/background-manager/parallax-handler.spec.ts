import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { updateParallax, animateStarField } from '../../background-manager/parallax-handler';

describe('Parallax Handler Module', () => {
  let camera: THREE.PerspectiveCamera;
  let starsGroup: THREE.Group;
  
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    
    // Create camera and stars group
    camera = new THREE.PerspectiveCamera();
    starsGroup = new THREE.Group();
  });

  it('should update parallax position based on camera position', () => {
    // Set camera position
    camera.position.set(100, 200, 300);
    
    // Default parallax strength is 0.1
    const expectedX = -100 * 0.1;
    const expectedY = -200 * 0.1;
    const expectedZ = -300 * 0.1;
    
    // Call update function
    updateParallax(starsGroup, camera);
    
    // Verify position was updated with correct parallax values
    expect(starsGroup.position.x).toBe(expectedX);
    expect(starsGroup.position.y).toBe(expectedY);
    expect(starsGroup.position.z).toBe(expectedZ);
  });
  
  it('should handle null camera gracefully', () => {
    // Call update with null camera
    updateParallax(starsGroup, null);
    
    // Verify position was not updated (should remain at 0,0,0)
    expect(starsGroup.position.x).toBe(0);
    expect(starsGroup.position.y).toBe(0);
    expect(starsGroup.position.z).toBe(0);
  });
  
  it('should animate star field with rotation', () => {
    // Create star layers
    const starLayers = [
      new THREE.Points(),
      new THREE.Points(),
      new THREE.Points()
    ];
    
    // Set initial rotation
    starsGroup.rotation.y = 0;
    starLayers.forEach(layer => {
      layer.rotation.y = 0;
    });
    
    // Set delta time
    const deltaTime = 10;
    
    // Default rotation speed is 0.0002
    const expectedGroupRotation = 0.0002 * deltaTime;
    
    // Call animate function
    animateStarField(starsGroup, starLayers, deltaTime);
    
    // Verify group rotation was updated
    expect(starsGroup.rotation.y).toBe(expectedGroupRotation);
    
    // Verify each layer was rotated with different speeds
    expect(starLayers[0].rotation.y).toBe(0.0002 * deltaTime * 0.5);
    expect(starLayers[1].rotation.y).toBe(0.0002 * deltaTime * 0.3);
    expect(starLayers[2].rotation.y).toBe(0.0002 * deltaTime * 0.1);
  });
}); 