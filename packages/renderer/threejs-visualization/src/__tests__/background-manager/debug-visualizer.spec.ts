import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createDebugVisuals, cleanupDebugVisuals } from '../../background-manager/debug-visualizer';

describe('Debug Visualizer Module', () => {
  // Spy on console.log
  const consoleLogSpy = vi.spyOn(console, 'log');

  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    consoleLogSpy.mockClear();
  });

  it('should create debug visuals with spheres and axes helper', () => {
    const debugGroup = createDebugVisuals();
    
    expect(debugGroup).toBeDefined();
    expect(debugGroup).toBeInstanceOf(THREE.Group);
    
    // Check that sphere geometries were created (3 layers)
    expect(debugGroup.children.length).toBe(4); // 3 spheres + 1 axes helper
    
    // Check that the first 3 children are meshes with sphere geometries
    for (let i = 0; i < 3; i++) {
      const child = debugGroup.children[i] as THREE.Mesh;
      expect(child).toBeInstanceOf(THREE.Mesh);
      expect(child.geometry).toBeInstanceOf(THREE.SphereGeometry);
      expect(child.material).toBeInstanceOf(THREE.MeshBasicMaterial);
      
      // Type assertion for material
      const material = child.material as THREE.MeshBasicMaterial;
      expect(material.wireframe).toBe(true);
      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(0.1);
    }
    
    // Check that the last child is an axes helper
    const axesHelper = debugGroup.children[3];
    expect(axesHelper).toBeInstanceOf(THREE.AxesHelper);
    
    // Check that console logs were called
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Debug mode enabled:');
  });
  
  it('should clean up debug visuals', () => {
    // Create a group with mesh children
    const mockMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial()
    );
    const mockGroup = new THREE.Group();
    
    // Add mock meshes to the group
    mockGroup.add(mockMesh);
    mockGroup.add(mockMesh.clone());
    mockGroup.add(mockMesh.clone());
    
    // Call cleanup function
    cleanupDebugVisuals(mockGroup);
    
    // Verify that all children were removed
    expect(mockGroup.children.length).toBe(0);
  });
}); 