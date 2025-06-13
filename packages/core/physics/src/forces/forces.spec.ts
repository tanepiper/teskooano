import { describe, it, expect } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import { calculateNewtonianGravitationalForce } from "./gravity";
import { calculateRelativisticAcceleration } from "./relativistic";
import { calculateDragForce, calculateThrustForce } from "./non-gravitational";

import { calculateAcceleration } from "./index";
import { PhysicsStateReal } from "../types";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";

const createRealState = (
  id: string,
  pos: { x: number; y: number; z: number },
  vel: { x: number; y: number; z: number },
  mass: number,
): PhysicsStateReal => ({
  id,
  mass_kg: mass,
  position_m: new OSVector3(pos.x, pos.y, pos.z),
  velocity_mps: new OSVector3(vel.x, vel.y, vel.z),
});

describe("Force Calculations", () => {
  describe("calculateNewtonianGravitationalForce", () => {
    it("calculates correct force between two bodies", () => {
      const body1 = createRealState(
        "1",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        1e6,
      );
      const body2 = createRealState(
        "2",
        { x: 1000, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        1e6,
      );
      const expectedMagnitude =
        (GRAVITATIONAL_CONSTANT * (1e6 * 1e6)) / (1000 * 1000);
      const force = calculateNewtonianGravitationalForce(body1, body2);

      expect(force.length()).toBeCloseTo(expectedMagnitude);
      expect(force.x).toBeCloseTo(-expectedMagnitude);
      expect(force.y).toBeCloseTo(0);
      expect(force.z).toBeCloseTo(0);
    });

    it("returns zero force for zero distance (or very close)", () => {
      const body1 = createRealState(
        "1",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        1e6,
      );
      const body2 = createRealState(
        "2",
        { x: 1e-7, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        1e6,
      );
      const force = calculateNewtonianGravitationalForce(body1, body2);
      expect(force.x).toBe(0);
      expect(force.y).toBe(0);
      expect(force.z).toBe(0);
    });
  });

  describe("calculateRelativisticCorrection", () => {
    it("should return zero correction for low velocities/masses (Newtonian limit)", () => {
      const body1 = createRealState(
        "1",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        1e6,
      );
      const body2 = createRealState(
        "2",
        { x: 1000, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        1e6,
      );
      const correction = calculateRelativisticAcceleration(
        body1.mass_kg,
        new OSVector3(1, 1, 1),
        body1.velocity_mps,
      );
      expect(correction.x).toBeCloseTo(1 / 1e6);
      expect(correction.y).toBeCloseTo(1 / 1e6);
      expect(correction.z).toBeCloseTo(1 / 1e6);
    });
  });

  describe("calculateNonGravitationalForces", () => {
    it("should return zero force if no non-gravitational effects defined", () => {
      const body = createRealState(
        "1",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        1,
      );
      const force = calculateThrustForce({
        active: false,
        direction: new OSVector3(1, 0, 0),
        magnitude: 100,
      });
      expect(force.x).toBe(0);
      expect(force.y).toBe(0);
      expect(force.z).toBe(0);
    });
  });

  describe("calculateAcceleration", () => {
    it("calculates acceleration correctly (a = F/m)", () => {
      const force = new OSVector3(10, -20, 30);
      const mass = 10;
      const acceleration = calculateAcceleration(mass, force);
      expect(acceleration.x).toBeCloseTo(1);
      expect(acceleration.y).toBeCloseTo(-2);
      expect(acceleration.z).toBeCloseTo(3);
    });

    it("returns zero acceleration for zero mass", () => {
      const force = new OSVector3(10, -20, 30);
      const mass = 0;
      const acceleration = calculateAcceleration(mass, force);
      expect(acceleration.x).toBe(0);
      expect(acceleration.y).toBe(0);
      expect(acceleration.z).toBe(0);
    });

    it("returns zero acceleration for zero force", () => {
      const force = new OSVector3(0, 0, 0);
      const mass = 10;
      const acceleration = calculateAcceleration(mass, force);
      expect(acceleration.x).toBe(0);
      expect(acceleration.y).toBe(0);
      expect(acceleration.z).toBe(0);
    });
  });
});
