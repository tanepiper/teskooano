import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CelestialObject, CelestialType } from '@teskooano/data-types';
import { createReducedDetailMesh, createLODMesh } from '../../lod-manager/lod-mesh-builder';

describe('LOD Mesh Builder Module', () => {
  let testObject: CelestialObject;
  let material: THREE.Material;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create test object
    testObject = {
      id: 'test-planet',
      type: CelestialType.PLANET,
      name: 'Test Planet',
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(),
      radius: 10,
      mass: 1000,
      properties: { type: 'rocky' }
    };
    
    // Create material
    material = new THREE.MeshStandardMaterial();
  });
  
  describe('createReducedDetailMesh', () => {
    it('should create a reduced detail mesh with sphere geometry', () => {
      const baseGeometry = new THREE.SphereGeometry(10, 32, 32);
      const segments = 16;
      
      const mesh = createReducedDetailMesh(testObject, segments, material, baseGeometry);
      
      expect(mesh).toBeDefined();
      expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
      if (mesh.geometry instanceof THREE.SphereGeometry) {
        expect(mesh.geometry.parameters.radius).toBe(10);
        expect(mesh.geometry.parameters.widthSegments).toBe(segments);
        expect(mesh.geometry.parameters.heightSegments).toBe(segments);
      }
    });
    
    it('should create a reduced detail mesh with icosahedron geometry', () => {
      const baseGeometry = new THREE.IcosahedronGeometry(10, 3);
      const segments = 16;
      
      const mesh = createReducedDetailMesh(testObject, segments, material, baseGeometry);
      
      expect(mesh).toBeDefined();
      expect(mesh.geometry).toBeInstanceOf(THREE.IcosahedronGeometry);
    });
    
    it('should handle other geometry types', () => {
      const baseGeometry = new THREE.BufferGeometry();
      const segments = 16;
      
      const mesh = createReducedDetailMesh(testObject, segments, material, baseGeometry);
      
      expect(mesh).toBeDefined();
      expect(mesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
    });
    
    it('should create a default sphere when no geometry is provided', () => {
      const segments = 16;
      
      const mesh = createReducedDetailMesh(testObject, segments, material);
      
      expect(mesh).toBeDefined();
      expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
      if (mesh.geometry instanceof THREE.SphereGeometry) {
        expect(mesh.geometry.parameters.radius).toBe(10);
        expect(mesh.geometry.parameters.widthSegments).toBe(segments);
        expect(mesh.geometry.parameters.heightSegments).toBe(segments);
      }
    });
  });
  
  describe('createLODMesh', () => {
    it('should create LOD mesh for a planet with multiple levels', () => {
      const lod = createLODMesh(testObject, material);
      
      expect(lod).toBeDefined();
      expect(lod).toBeInstanceOf(THREE.LOD);
      expect(lod.levels.length).toBe(4);
    });
    
    it('should create LOD mesh for a moon with multiple levels', () => {
      testObject.type = CelestialType.MOON;
      
      const lod = createLODMesh(testObject, material);
      
      expect(lod).toBeDefined();
      expect(lod).toBeInstanceOf(THREE.LOD);
      expect(lod.levels.length).toBe(4);
    });
    
    it('should create LOD mesh for an asteroid with multiple levels', () => {
      testObject.type = CelestialType.ASTEROID;
      
      const lod = createLODMesh(testObject, material);
      
      expect(lod).toBeDefined();
      expect(lod).toBeInstanceOf(THREE.LOD);
      expect(lod.levels.length).toBe(4);
    });
    
    it('should create LOD mesh with a provided base geometry', () => {
      const baseGeometry = new THREE.SphereGeometry(10, 32, 32);
      
      const lod = createLODMesh(testObject, material, baseGeometry);
      
      expect(lod).toBeDefined();
      expect(lod).toBeInstanceOf(THREE.LOD);
      expect(lod.levels.length).toBe(4);
    });
  });
}); 