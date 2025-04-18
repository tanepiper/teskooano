import { describe, it, expect } from 'vitest';
import type { Vector3, Quaternion, Matrix4, CelestialObject, OrbitalParameters, SimulationState } from './main';
import { CelestialType } from './main';

describe('Data Types', () => {
  describe('Vector3', () => {
    it('should be a valid Vector3 type', () => {
      const vector: Vector3 = { x: 1, y: 2, z: 3 };
      expect(vector).toHaveProperty('x');
      expect(vector).toHaveProperty('y');
      expect(vector).toHaveProperty('z');
      expect(typeof vector.x).toBe('number');
      expect(typeof vector.y).toBe('number');
      expect(typeof vector.z).toBe('number');
    });
  });

  describe('Quaternion', () => {
    it('should be a valid Quaternion type', () => {
      const quaternion: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
      expect(quaternion).toHaveProperty('x');
      expect(quaternion).toHaveProperty('y');
      expect(quaternion).toHaveProperty('z');
      expect(quaternion).toHaveProperty('w');
      expect(typeof quaternion.x).toBe('number');
      expect(typeof quaternion.y).toBe('number');
      expect(typeof quaternion.z).toBe('number');
      expect(typeof quaternion.w).toBe('number');
    });
  });

  describe('Matrix4', () => {
    it('should be a valid Matrix4 type', () => {
      const matrix: Matrix4 = { elements: Array(16).fill(0) };
      expect(matrix).toHaveProperty('elements');
      expect(Array.isArray(matrix.elements)).toBe(true);
      expect(matrix.elements.length).toBe(16);
      expect(matrix.elements.every(el => typeof el === 'number')).toBe(true);
    });
  });

  describe('CelestialObject', () => {
    it('should be a valid CelestialObject type', () => {
      const object: CelestialObject = {
        id: 'test-1',
        name: 'Test Object',
        type: CelestialType.PLANET,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
        mass: 1000,
        radius: 100
      };

      expect(object).toHaveProperty('id');
      expect(object).toHaveProperty('name');
      expect(object).toHaveProperty('type');
      expect(object).toHaveProperty('position');
      expect(object).toHaveProperty('rotation');
      expect(object).toHaveProperty('scale');
      expect(object).toHaveProperty('mass');
      expect(object).toHaveProperty('radius');

      expect(typeof object.id).toBe('string');
      expect(typeof object.name).toBe('string');
      expect(Object.values(CelestialType)).toContain(object.type);
      expect(typeof object.mass).toBe('number');
      expect(typeof object.radius).toBe('number');
    });
  });

  describe('OrbitalParameters', () => {
    it('should be a valid OrbitalParameters type', () => {
      const params: OrbitalParameters = {
        semiMajorAxis: 1000,
        eccentricity: 0.1,
        inclination: 0.5,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period: 86400
      };

      expect(params).toHaveProperty('semiMajorAxis');
      expect(params).toHaveProperty('eccentricity');
      expect(params).toHaveProperty('inclination');
      expect(params).toHaveProperty('longitudeOfAscendingNode');
      expect(params).toHaveProperty('argumentOfPeriapsis');
      expect(params).toHaveProperty('meanAnomaly');
      expect(params).toHaveProperty('period');

      expect(typeof params.semiMajorAxis).toBe('number');
      expect(typeof params.eccentricity).toBe('number');
      expect(typeof params.inclination).toBe('number');
      expect(typeof params.longitudeOfAscendingNode).toBe('number');
      expect(typeof params.argumentOfPeriapsis).toBe('number');
      expect(typeof params.meanAnomaly).toBe('number');
      expect(typeof params.period).toBe('number');

      // Validate ranges
      expect(params.eccentricity).toBeGreaterThanOrEqual(0);
      expect(params.eccentricity).toBeLessThanOrEqual(1);
      expect(params.inclination).toBeGreaterThanOrEqual(-Math.PI);
      expect(params.inclination).toBeLessThanOrEqual(Math.PI);
    });
  });

  describe('SimulationState', () => {
    it('should be a valid SimulationState type', () => {
      const state: SimulationState = {
        time: 0,
        timeScale: 1,
        paused: false,
        selectedObject: null,
        camera: {
          position: { x: 0, y: 0, z: 1000 },
          target: { x: 0, y: 0, z: 0 },
          fov: 60
        }
      };

      expect(state).toHaveProperty('time');
      expect(state).toHaveProperty('timeScale');
      expect(state).toHaveProperty('paused');
      expect(state).toHaveProperty('selectedObject');
      expect(state).toHaveProperty('camera');

      expect(typeof state.time).toBe('number');
      expect(typeof state.timeScale).toBe('number');
      expect(typeof state.paused).toBe('boolean');
      expect(state.selectedObject).toBeNull();
      expect(typeof state.camera.fov).toBe('number');
    });
  });
}); 