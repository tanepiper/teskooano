import { describe, it, expect } from "vitest";

import { PhysicsStateReal } from "@teskooano/data-types";
import { standardEuler } from "./euler";
import { verletIntegrate, velocityVerletIntegrate } from "./verlet";
import * as THREE from "three";
import { Vector3 } from "three";

describe("Physics Integrators", () => {
  describe("Euler Integration", () => {
    it("updates position and velocity correctly under constant acceleration", () => {
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0),
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 1;

      const newState = standardEuler(initialState, acceleration, dt);

      expect(newState.velocity_mps.x).toBe(1);
      expect(newState.velocity_mps.y).toBe(0);
      expect(newState.velocity_mps.z).toBe(0);

      expect(newState.position_m.x).toBe(0.5);
      expect(newState.position_m.y).toBe(0);
      expect(newState.position_m.z).toBe(0);
    });

    it("preserves body properties (id, mass_kg)", () => {
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0),
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 1;

      const newState = standardEuler(initialState, acceleration, dt);

      expect(newState.id).toBe(initialState.id);
      expect(newState.mass_kg).toBe(initialState.mass_kg);
    });

    it("handles zero acceleration correctly", () => {
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0),
      };
      const acceleration = new THREE.Vector3(0, 0, 0);
      const dt = 1;

      const newState = standardEuler(initialState, acceleration, dt);

      expect(newState.velocity_mps).toEqual(initialState.velocity_mps);

      expect(newState.position_m.x).toBe(1);
      expect(newState.position_m.y).toBe(0);
      expect(newState.position_m.z).toBe(0);
    });

    it("handles zero time step correctly", () => {
      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0),
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 0;

      const newState = standardEuler(initialState, acceleration, dt);

      expect(newState).toEqual(initialState);
    });
  });

  describe("Verlet Integration", () => {
    it("updates position and velocity correctly under constant acceleration", () => {
      const previousState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0),
      };
      const currentState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0.5, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0),
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 1;

      const newState = verletIntegrate(
        currentState,
        previousState,
        acceleration,
        dt,
      );

      expect(newState.position_m.x).toBe(1.5);
      expect(newState.position_m.y).toBe(0);
      expect(newState.position_m.z).toBe(0);

      expect(newState.velocity_mps.x).toBe(0.75);
      expect(newState.velocity_mps.y).toBe(0);
      expect(newState.velocity_mps.z).toBe(0);
    });

    it("preserves body properties (id, mass_kg)", () => {
      const previousState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0),
      };
      const currentState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0.5, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0),
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 1;

      const newState = verletIntegrate(
        currentState,
        previousState,
        acceleration,
        dt,
      );

      expect(newState.id).toBe(currentState.id);
      expect(newState.mass_kg).toBe(currentState.mass_kg);
    });

    it("handles zero acceleration correctly", () => {
      const previousState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0),
      };
      const currentState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(1, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0),
      };
      const acceleration = new THREE.Vector3(0, 0, 0);
      const dt = 1;

      const newState = verletIntegrate(
        currentState,
        previousState,
        acceleration,
        dt,
      );

      expect(newState.position_m.x).toBe(2);
      expect(newState.position_m.y).toBe(0);
      expect(newState.position_m.z).toBe(0);

      expect(newState.velocity_mps).toEqual(currentState.velocity_mps);
    });

    it("handles zero time step correctly", () => {
      const previousState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0, 0, 0),
        velocity_mps: new THREE.Vector3(0, 0, 0),
      };
      const currentState: PhysicsStateReal = {
        id: 1,
        mass_kg: 1000,
        position_m: new THREE.Vector3(0.5, 0, 0),
        velocity_mps: new THREE.Vector3(1, 0, 0),
      };
      const acceleration = new THREE.Vector3(1, 0, 0);
      const dt = 0;

      const newState = verletIntegrate(
        currentState,
        previousState,
        acceleration,
        dt,
      );

      expect(newState).toEqual(currentState);
    });

    it("maintains better energy conservation than Euler for circular orbital motion", () => {
      const G = 6.6743e-11;
      const centralMass = 1.989e30;
      const dt = 0.01;
      const orbitalRadius = 1.496e11;
      const steps = 1000;

      const orbitalSpeed = Math.sqrt((G * centralMass) / orbitalRadius);

      const initialState: PhysicsStateReal = {
        id: 1,
        mass_kg: 5.972e24,
        position_m: new THREE.Vector3(orbitalRadius, 0, 0),
        velocity_mps: new THREE.Vector3(0, orbitalSpeed, 0),
      };

      const calculateAcceleration = (position: Vector3): Vector3 => {
        const r = position.clone();
        const distanceCubed = Math.pow(r.length(), 3);
        if (distanceCubed === 0) return new THREE.Vector3(0, 0, 0);
        return r.multiplyScalar((-G * centralMass) / distanceCubed);
      };

      let eulerState: PhysicsStateReal = { ...initialState };
      let verletState: PhysicsStateReal = { ...initialState };

      const initialKineticEnergy =
        0.5 * initialState.mass_kg * Math.pow(orbitalSpeed, 2);
      const initialPotentialEnergy =
        (-G * centralMass * initialState.mass_kg) / orbitalRadius;
      const initialEnergy = initialKineticEnergy + initialPotentialEnergy;

      let maxEulerEnergyDiff = 0;
      let maxVerletEnergyDiff = 0;

      let eulerAccel = calculateAcceleration(eulerState.position_m);
      let verletAccel = calculateAcceleration(verletState.position_m);

      for (let i = 0; i < steps; i++) {
        const newEulerState = standardEuler(eulerState, eulerAccel, dt);

        const newVerletState = velocityVerletIntegrate(
          verletState,
          verletAccel,
          (pos_m) => calculateAcceleration(pos_m),
          dt,
        );

        const eulerVelSquared = Math.pow(
          newEulerState.velocity_mps.length(),
          2,
        );
        const eulerKinetic = 0.5 * newEulerState.mass_kg * eulerVelSquared;
        const eulerDistance = newEulerState.position_m.length();
        const eulerPotential =
          (-G * centralMass * newEulerState.mass_kg) / eulerDistance;
        const eulerEnergy = eulerKinetic + eulerPotential;

        const verletVelSquared = Math.pow(
          newVerletState.velocity_mps.length(),
          2,
        );
        const verletKinetic = 0.5 * newVerletState.mass_kg * verletVelSquared;
        const verletDistance = newVerletState.position_m.length();
        const verletPotential =
          (-G * centralMass * newVerletState.mass_kg) / verletDistance;
        const verletEnergy = verletKinetic + verletPotential;

        const eulerEnergyDiff = Math.abs(
          (eulerEnergy - initialEnergy) / initialEnergy,
        );
        const verletEnergyDiff = Math.abs(
          (verletEnergy - initialEnergy) / initialEnergy,
        );

        maxEulerEnergyDiff = Math.max(maxEulerEnergyDiff, eulerEnergyDiff);
        maxVerletEnergyDiff = Math.max(maxVerletEnergyDiff, verletEnergyDiff);

        eulerState = newEulerState;
        eulerAccel = calculateAcceleration(eulerState.position_m);

        verletState = newVerletState;
        verletAccel = calculateAcceleration(verletState.position_m);
      }

      expect(maxVerletEnergyDiff).toBeLessThan(maxEulerEnergyDiff);

      expect(maxVerletEnergyDiff).toBeLessThan(0.1);
    });
  });
});
