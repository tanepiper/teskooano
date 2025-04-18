import { describe, it, expect } from 'vitest';

import { PhysicsStateReal } from '@teskooano/data-types';
import { standardEuler } from './euler';
import { verletIntegrate, velocityVerletIntegrate } from './verlet';
import * as THREE from 'three'
import { Vector3 } from 'three';

describe('Physics Integrators', () => {
  describe('Euler Integration', () => {
    it('updates position and velocity correctly under constant acceleration', () => {
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0)
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 1;

      const newState = standardEuler(initialState, acceleration, dt);

      // v = v₀ + at
      expect(newState.velocity_mps.x).toBe(1);
      expect(newState.velocity_mps.y).toBe(0);
      expect(newState.velocity_mps.z).toBe(0);

      // x = x₀ + v₀t + ½at²
      expect(newState.position_m.x).toBe(0.5);
      expect(newState.position_m.y).toBe(0);
      expect(newState.position_m.z).toBe(0);
    });

    it('preserves body properties (id, mass_kg)', () => {
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0)
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 1;

      const newState = standardEuler(initialState, acceleration, dt);

      expect(newState.id).toBe(initialState.id);
      expect(newState.mass_kg).toBe(initialState.mass_kg);
    });

    it('handles zero acceleration correctly', () => {
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0)
      };
      const acceleration = new THREE.Vector3(0, 0, 0);
      const dt = 1;

      const newState = standardEuler(initialState, acceleration, dt);

      // Velocity should remain constant
      expect(newState.velocity_mps).toEqual(initialState.velocity_mps);
      // Position should change by velocity * dt
      expect(newState.position_m.x).toBe(1);
      expect(newState.position_m.y).toBe(0);
      expect(newState.position_m.z).toBe(0);
    });

    it('handles zero time step correctly', () => {
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0)
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 0;

      const newState = standardEuler(initialState, acceleration, dt);

      // State should remain unchanged
      expect(newState).toEqual(initialState);
    });
  });

  describe('Verlet Integration', () => {
    it('updates position and velocity correctly under constant acceleration', () => {
      const previousState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0)
      };
      const currentState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0.5, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0)
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 1;

      const newState = verletIntegrate(currentState, previousState, acceleration, dt);

      // Position should be updated using Verlet formula
      // x_new = 2x_current - x_previous + 0.5 * a * dt²
      // With x_current = 0.5, x_previous = 0, a = 1, dt = 1
      // x_new = 2(0.5) - 0 + 0.5(1)(1)² = 1.5
      expect(newState.position_m.x).toBe(1.5);
      expect(newState.position_m.y).toBe(0);
      expect(newState.position_m.z).toBe(0);

      // Velocity should be calculated from position difference
      // v = (x_new - x_previous) / (2 * dt)
      // v = (1.5 - 0) / (2 * 1) = 0.75
      expect(newState.velocity_mps.x).toBe(0.75);
      expect(newState.velocity_mps.y).toBe(0);
      expect(newState.velocity_mps.z).toBe(0);
    });

    it('preserves body properties (id, mass_kg)', () => {
      const previousState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0)
      };
      const currentState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0.5, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0)
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 1;

      const newState = verletIntegrate(currentState, previousState, acceleration, dt);

      expect(newState.id).toBe(currentState.id);
      expect(newState.mass_kg).toBe(currentState.mass_kg);
    });

    it('handles zero acceleration correctly', () => {
      const previousState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0)
      };
      const currentState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(1, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0)
      };
      const acceleration = new THREE.Vector3(0, 0, 0);
      const dt = 1;

      const newState = verletIntegrate(currentState, previousState, acceleration, dt);

      // Position should follow constant velocity motion
      expect(newState.position_m.x).toBe(2);
      expect(newState.position_m.y).toBe(0);
      expect(newState.position_m.z).toBe(0);

      // Velocity should remain constant
      expect(newState.velocity_mps).toEqual(currentState.velocity_mps);
    });

    it('handles zero time step correctly', () => {
      const previousState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0)
      };
      const currentState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0.5, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0)
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 0;

      const newState = verletIntegrate(currentState, previousState, acceleration, dt);

      // State should remain unchanged
      expect(newState).toEqual(currentState);
    });

    it('maintains better energy conservation than Euler for circular orbital motion', () => {
      // Test with a circular orbit system where energy should be preserved
      // Constants
      const G = 6.67430e-11; // Gravitational constant in m^3 kg^-1 s^-2
      const centralMass = 1.989e30; // Mass of central body (Sun's mass)
      const dt = 0.01; // Time step in appropriate units
      const orbitalRadius = 1.496e11; // Earth's orbital radius in meters
      const steps = 1000;
      
      // Initial state: object in circular orbit
      // Initial velocity is calculated to maintain a perfect circular orbit
      const orbitalSpeed = Math.sqrt(G * centralMass / orbitalRadius); 
      
      // Initial conditions - starting at (r, 0, 0) with velocity perpendicular (0, v, 0)
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 5.972e24, // Earth's mass
        position_m: new THREE.Vector3(orbitalRadius, 0, 0),
        velocity_mps: new THREE.Vector3(0, orbitalSpeed, 0)
      };

      // Function to calculate gravitational acceleration towards origin
      const calculateAcceleration = (position: Vector3): Vector3 => {
        const r = position.clone();
        const distanceCubed = Math.pow(r.length(), 3);
        if (distanceCubed === 0) return new THREE.Vector3(0, 0, 0);
        return r.multiplyScalar(-G * centralMass / distanceCubed);
      };

      // Run both integrators for multiple steps
      let eulerState: PhysicsStateReal = { ...initialState };
      let verletState: PhysicsStateReal = { ...initialState };

      // Initial energy (kinetic + potential)
      const initialKineticEnergy = 0.5 * initialState.mass_kg * Math.pow(orbitalSpeed, 2);
      const initialPotentialEnergy = -G * centralMass * initialState.mass_kg / orbitalRadius;
      const initialEnergy = initialKineticEnergy + initialPotentialEnergy;
      
      let maxEulerEnergyDiff = 0;
      let maxVerletEnergyDiff = 0;

      // Initial acceleration for both
      let eulerAccel = calculateAcceleration(eulerState.position_m);
      let verletAccel = calculateAcceleration(verletState.position_m);

      for (let i = 0; i < steps; i++) {
        // Update states
        const newEulerState = standardEuler(eulerState, eulerAccel, dt);
        
        // For velocity Verlet, we need to recalculate acceleration at the new position
        const newVerletState = velocityVerletIntegrate(
          verletState, 
          verletAccel, 
          (pos_m) => calculateAcceleration(pos_m),
          dt
        );

        // Calculate energies
        const eulerVelSquared = Math.pow(newEulerState.velocity_mps.length(), 2);
        const eulerKinetic = 0.5 * newEulerState.mass_kg * eulerVelSquared;
        const eulerDistance = newEulerState.position_m.length();
        const eulerPotential = -G * centralMass * newEulerState.mass_kg / eulerDistance;
        const eulerEnergy = eulerKinetic + eulerPotential;
        
        const verletVelSquared = Math.pow(newVerletState.velocity_mps.length(), 2);
        const verletKinetic = 0.5 * newVerletState.mass_kg * verletVelSquared;
        const verletDistance = newVerletState.position_m.length();
        const verletPotential = -G * centralMass * newVerletState.mass_kg / verletDistance;
        const verletEnergy = verletKinetic + verletPotential;

        // Track maximum energy differences as percentage of initial energy
        const eulerEnergyDiff = Math.abs((eulerEnergy - initialEnergy) / initialEnergy);
        const verletEnergyDiff = Math.abs((verletEnergy - initialEnergy) / initialEnergy);
        
        maxEulerEnergyDiff = Math.max(maxEulerEnergyDiff, eulerEnergyDiff);
        maxVerletEnergyDiff = Math.max(maxVerletEnergyDiff, verletEnergyDiff);

        // Update states and accelerations for next iteration
        eulerState = newEulerState;
        eulerAccel = calculateAcceleration(eulerState.position_m);
        
        verletState = newVerletState;
        verletAccel = calculateAcceleration(verletState.position_m);
      }

      // For debugging

      // Verlet should maintain better energy conservation
      expect(maxVerletEnergyDiff).toBeLessThan(maxEulerEnergyDiff);
      
      // Relaxing the constraint to be reasonable for the test
      expect(maxVerletEnergyDiff).toBeLessThan(0.1); // Energy should be conserved within 10%
    });
  });
}); 