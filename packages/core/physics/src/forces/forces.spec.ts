import { describe, it, expect } from 'vitest';
import { OSVector3 } from '../math/OSVector3';
import {
  calculateNewtonianGravitationalForce,
  calculateRelativisticCorrection,
  calculateNonGravitationalForces,
  calculateTotalForce,
  calculateAcceleration
} from './index'; // Assuming index exports these
import { PhysicsStateReal } from '@teskooano/data-types';
import { GRAVITATIONAL_CONSTANT } from '@teskooano/data-types';

// Helper to create REAL state
const createRealState = (
  id: string,
  pos: { x: number; y: number; z: number },
  vel: { x: number; y: number; z: number },
  mass: number
): PhysicsStateReal => ({
  id,
  mass_kg: mass,
  position_m: new OSVector3(pos.x, pos.y, pos.z),
  velocity_mps: new OSVector3(vel.x, vel.y, vel.z),
});

describe('Force Calculations', () => {
  describe('calculateNewtonianGravitationalForce', () => {
    it('calculates correct force between two bodies', () => {
      const body1 = createRealState('1', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e6); // 1 million kg
      const body2 = createRealState('2', { x: 1000, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e6);
      const expectedMagnitude = GRAVITATIONAL_CONSTANT * (1e6 * 1e6) / (1000 * 1000);
      const force = calculateNewtonianGravitationalForce(body1, body2); // Force on body2 by body1

      // Force on body2 should point towards body1 (-X direction)
      expect(force.length()).toBeCloseTo(expectedMagnitude);
      expect(force.x).toBeCloseTo(-expectedMagnitude);
      expect(force.y).toBeCloseTo(0);
      expect(force.z).toBeCloseTo(0);
    });

    it('returns zero force for zero distance (or very close)', () => {
      const body1 = createRealState('1', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e6);
      const body2 = createRealState('2', { x: 1e-7, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e6);
      const force = calculateNewtonianGravitationalForce(body1, body2);
      expect(force.x).toBe(0);
      expect(force.y).toBe(0);
      expect(force.z).toBe(0);
    });
    
    // Add tests for zero mass? (Should likely return zero force)
  });

  describe('calculateRelativisticCorrection', () => {
    it('should return zero correction for low velocities/masses (Newtonian limit)', () => {
       const body1 = createRealState('1', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e6);
       const body2 = createRealState('2', { x: 1000, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e6);
       const correction = calculateRelativisticCorrection(body1, body2);
       expect(correction.x).toBeCloseTo(0);
       expect(correction.y).toBeCloseTo(0);
       expect(correction.z).toBeCloseTo(0);
    });
    
    // Add tests for high velocity/mass cases if specific relativistic formula implemented
  });

  describe('calculateNonGravitationalForces', () => {
     it('should return zero force if no non-gravitational effects defined', () => {
       const body = createRealState('1', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1);
       const force = calculateNonGravitationalForces(body);
       expect(force.x).toBe(0);
       expect(force.y).toBe(0);
       expect(force.z).toBe(0);
     });
     
     // Add tests for specific effects like radiation pressure, drag, thrust later
  });

  describe('calculateTotalForce', () => {
    it('calculates total force on a body from others', () => {
      const targetBody = createRealState('target', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e3);
      const body1 = createRealState('1', { x: 1000, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e6);
      const body2 = createRealState('2', { x: 0, y: -2000, z: 0 }, { x: 0, y: 0, z: 0 }, 4e6);
      const allBodies = [targetBody, body1, body2];
      
      const forceOnTarget = calculateTotalForce(targetBody, allBodies);

      // Calculate individual forces for verification
      const forceFrom1 = calculateNewtonianGravitationalForce(body1, targetBody);
      const forceFrom2 = calculateNewtonianGravitationalForce(body2, targetBody);
      const expectedTotalForce = forceFrom1.clone().add(forceFrom2);

      expect(forceOnTarget.x).toBeCloseTo(expectedTotalForce.x);
      expect(forceOnTarget.y).toBeCloseTo(expectedTotalForce.y);
      expect(forceOnTarget.z).toBeCloseTo(expectedTotalForce.z);
    });
    
     it('excludes self-interaction', () => {
      const targetBody = createRealState('target', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1e3);
      const allBodies = [targetBody]; // Only contains itself
      const forceOnTarget = calculateTotalForce(targetBody, allBodies);
      expect(forceOnTarget.x).toBe(0);
      expect(forceOnTarget.y).toBe(0);
      expect(forceOnTarget.z).toBe(0);
    });
  });
  
  describe('calculateAcceleration', () => {
     it('calculates acceleration correctly (a = F/m)', () => {
         const force = new OSVector3(10, -20, 30);
         const mass = 10;
         const acceleration = calculateAcceleration(mass, force);
         expect(acceleration.x).toBeCloseTo(1);  // 10 / 10
         expect(acceleration.y).toBeCloseTo(-2); // -20 / 10
         expect(acceleration.z).toBeCloseTo(3);  // 30 / 10
     });
     
     it('returns zero acceleration for zero mass', () => {
         const force = new OSVector3(10, -20, 30);
         const mass = 0;
         const acceleration = calculateAcceleration(mass, force);
         expect(acceleration.x).toBe(0);
         expect(acceleration.y).toBe(0);
         expect(acceleration.z).toBe(0);
     });
     
      it('returns zero acceleration for zero force', () => {
         const force = new OSVector3(0, 0, 0);
         const mass = 10;
         const acceleration = calculateAcceleration(mass, force);
         expect(acceleration.x).toBe(0);
         expect(acceleration.y).toBe(0);
         expect(acceleration.z).toBe(0);
     });
  });
}); 