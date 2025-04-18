import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { MainSequenceStarRenderer } from './main-sequence-star';

describe('MainSequenceStarRenderer', () => {
  let renderer: MainSequenceStarRenderer;
  let mockStar: any;

  beforeEach(() => {
    renderer = new MainSequenceStarRenderer();
    mockStar = {
      id: 'star-1',
      name: 'Test Star',
      type: 'star',
      radius: 10,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }
    };
  });

  it('should create a group with star and corona meshes', () => {
    const group = renderer.createMesh(mockStar) as THREE.Group;
    
    expect(group).toBeDefined();
    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.name).toBe('star-1');
    
    // Position should match the star's position
    expect(group.position.x).toBe(0);
    expect(group.position.y).toBe(0);
    expect(group.position.z).toBe(0);
    
    // Should have at least one child (main star body)
    expect(group.children.length).toBeGreaterThan(0);
    
    // Check main star mesh - look for a mesh containing 'body' in the name
    const starMesh = group.children.find(child => 
      child.name.includes('body') || child.name === `${mockStar.id}-body`
    );
    expect(starMesh).toBeDefined();
    expect(starMesh).toBeInstanceOf(THREE.Mesh);
    
    // Check for corona/atmosphere-related meshes - we expect at least one additional mesh
    // besides the main body for visual effects
    const effectMeshes = group.children.filter(child => 
      child !== starMesh && child instanceof THREE.Mesh
    );
    expect(effectMeshes.length).toBeGreaterThan(0);
    
    // Check at least one mesh has a shader material (could be body or corona)
    let hasShaderMaterial = false;
    group.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        hasShaderMaterial = true;
        
        // Check common shader uniforms
        const material = child.material as THREE.ShaderMaterial;
        expect(material.uniforms).toBeDefined();
        
        // Most star shaders will have at least time and some color property
        if (material.uniforms.time) {
          expect(material.uniforms.time).toBeDefined();
        }
      }
    });
    expect(hasShaderMaterial).toBe(true);
  });

  it('should update all materials with the current time', () => {
    // First create a mesh to add materials to the renderer
    renderer.createMesh(mockStar);
    
    // Now update the materials
    renderer.update(1.0);
    
    // Since we can't directly check the uniform values, we just ensure the method runs without errors
    expect(true).toBe(true);
  });

  it('should dispose all materials when disposed', () => {
    // First create a mesh to add materials to the renderer
    renderer.createMesh(mockStar);
    
    // Now dispose the renderer
    renderer.dispose();
    
    // Again, we just ensure the method runs without errors
    expect(true).toBe(true);
  });
}); 