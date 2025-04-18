import { describe, it, expect } from 'vitest';
import { CelestialObject, CelestialType, StellarType } from '@teskooano/data-types';
import { calculateLODDistances, getDetailSegments } from '../../lod-manager/distance-calculator';
import * as THREE from 'three';

describe('Distance Calculator Module', () => {
  describe('calculateLODDistances', () => {
    it('should calculate basic distances based on object radius', () => {
      const testObject: CelestialObject = {
        id: 'test-planet',
        type: CelestialType.PLANET,
        name: 'Test Planet',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        radius: 10,
        mass: 1000,
        properties: { type: 'rocky' }
      };
      
      const distances = calculateLODDistances(testObject);
      
      expect(distances.closeDistance).toBe(10 * 10); // radius * 10
      expect(distances.mediumDistance).toBe(10 * 100); // radius * 100
      expect(distances.farDistance).toBe(10 * 1000); // radius * 1000
    });
    
    it('should adjust distances for moons', () => {
      const testMoon: CelestialObject = {
        id: 'test-moon',
        type: CelestialType.MOON,
        name: 'Test Moon',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        radius: 5,
        mass: 500,
        properties: { type: 'rocky' }
      };
      
      const distances = calculateLODDistances(testMoon);
      
      // Moons use a 0.5 multiplier for all distances
      expect(distances.closeDistance).toBe(5 * 10 * 0.5);
      expect(distances.mediumDistance).toBe(5 * 100 * 0.5);
      expect(distances.farDistance).toBe(5 * 1000 * 0.5);
    });
    
    it('should adjust distances for asteroids', () => {
      const testAsteroid: CelestialObject = {
        id: 'test-asteroid',
        type: CelestialType.SPACE_ROCK,
        name: 'Test Asteroid',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        radius: 2,
        mass: 100,
        properties: { type: 'rocky' }
      };
      
      const distances = calculateLODDistances(testAsteroid);
      
      // Asteroids use a 0.25 multiplier for all distances
      expect(distances.closeDistance).toBe(2 * 10 * 0.25);
      expect(distances.mediumDistance).toBe(2 * 100 * 0.25);
      expect(distances.farDistance).toBe(2 * 1000 * 0.25);
    });
    
    it('should adjust distances for stars', () => {
      const testStar: CelestialObject = {
        id: 'test-star',
        type: CelestialType.STAR,
        name: 'Test Star',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        radius: 100,
        mass: 10000,
        properties: { spectralClass: 'G', stellarType: StellarType.MAIN_SEQUENCE, luminosity: 1000, temperature: 5000, color: '#FFD700' }
      };
      
      const distances = calculateLODDistances(testStar);
      
      // Stars use a 2.0 multiplier for all distances
      expect(distances.closeDistance).toBe(100 * 10 * 2.0);
      expect(distances.mediumDistance).toBe(100 * 100 * 2.0);
      expect(distances.farDistance).toBe(100 * 1000 * 2.0);
    });
  });
  
  describe('getDetailSegments', () => {
    it('should return correct segment counts for planets', () => {
      expect(getDetailSegments(CelestialType.PLANET, 'high')).toBe(24);
      expect(getDetailSegments(CelestialType.PLANET, 'medium')).toBe(12);
      expect(getDetailSegments(CelestialType.PLANET, 'low')).toBe(8);
      expect(getDetailSegments(CelestialType.PLANET, 'very-low')).toBe(4);
    });
    
    it('should return correct segment counts for moons', () => {
      expect(getDetailSegments(CelestialType.MOON, 'high')).toBe(16);
      expect(getDetailSegments(CelestialType.MOON, 'medium')).toBe(8);
      expect(getDetailSegments(CelestialType.MOON, 'low')).toBe(6);
      expect(getDetailSegments(CelestialType.MOON, 'very-low')).toBe(4);
    });
    
    it('should return correct segment counts for asteroids', () => {
      expect(getDetailSegments(CelestialType.ASTEROID, 'high')).toBe(8);
      expect(getDetailSegments(CelestialType.ASTEROID, 'medium')).toBe(6);
      expect(getDetailSegments(CelestialType.ASTEROID, 'low')).toBe(4);
      expect(getDetailSegments(CelestialType.ASTEROID, 'very-low')).toBe(3);
    });
    
    it('should return default segment counts for other object types', () => {
      expect(getDetailSegments(CelestialType.STATION, 'high')).toBe(24);
      expect(getDetailSegments(CelestialType.STATION, 'medium')).toBe(16);
      expect(getDetailSegments(CelestialType.STATION, 'low')).toBe(8);
      expect(getDetailSegments(CelestialType.STATION, 'very-low')).toBe(4);
    });
  });
}); 