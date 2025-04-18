import { describe, it, expect } from "vitest";
import { PhysicsStateReal } from "@teskooano/data-types"; // Import REAL state
import { OSVector3 } from "../math/OSVector3"; // Import OSVector3
import {
  detectSphereCollision,
  resolveCollision,
  handleCollisions,
} from "./collision";
import { Collision } from "./collision"; // Collision interface uses OSVector3 now

// Helper to create REAL state
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

describe("Collision Detection (detectSphereCollision)", () => {
  it("should detect collision when spheres overlap", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const radius1 = 1.5;
    const radius2 = 1.5;
    const collision = detectSphereCollision(body1, radius1, body2, radius2);
    expect(collision).not.toBeNull();
    if (collision) {
      expect(collision.penetrationDepth).toBeCloseTo(1.0); // (1.5+1.5) - 2
      // Check normal (points from body2 towards body1)
      expect(collision.normal.x).toBeCloseTo(-1.0);
      expect(collision.normal.y).toBeCloseTo(0.0);
      expect(collision.normal.z).toBeCloseTo(0.0);
      // Check collision point (surface of body2 towards body1)
      const expectedPoint = body2.position_m
        .clone()
        .add(collision.normal.clone().multiplyScalar(radius2));
      expect(collision.point.x).toBeCloseTo(expectedPoint.x); // 2 + (-1 * 1.5) = 0.5
      expect(collision.point.y).toBeCloseTo(expectedPoint.y);
      expect(collision.point.z).toBeCloseTo(expectedPoint.z);
    }
  });

  it("should not detect collision when spheres touch exactly", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const radius1 = 1.5;
    const radius2 = 1.5;
    const collision = detectSphereCollision(body1, radius1, body2, radius2);
    expect(collision).toBeNull();
  });

  it("should not detect collision when spheres are separate", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 4, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const radius1 = 1.5;
    const radius2 = 1.5;
    const collision = detectSphereCollision(body1, radius1, body2, radius2);
    expect(collision).toBeNull();
  });
});

describe("Collision Resolution (resolveCollision)", () => {
  it("should resolve head-on collision correctly (equal mass)", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      1,
    );
    const radius = 0.6; // Ensure they overlap
    const collisionInfo = detectSphereCollision(body1, radius, body2, radius);
    expect(collisionInfo).not.toBeNull();
    if (!collisionInfo) return;

    const [newState1, newState2] = resolveCollision(
      collisionInfo,
      body1,
      body2,
    );

    // Equal mass, head-on elastic collision: velocities should swap
    expect(newState1.velocity_mps.x).toBeCloseTo(-1.0);
    expect(newState1.velocity_mps.y).toBeCloseTo(0.0);
    expect(newState1.velocity_mps.z).toBeCloseTo(0.0);
    expect(newState2.velocity_mps.x).toBeCloseTo(1.0);
    expect(newState2.velocity_mps.y).toBeCloseTo(0.0);
    expect(newState2.velocity_mps.z).toBeCloseTo(0.0);
  });

  it("should resolve collision with one stationary body (equal mass)", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const radius = 0.6;
    const collisionInfo = detectSphereCollision(body1, radius, body2, radius);
    expect(collisionInfo).not.toBeNull();
    if (!collisionInfo) return;

    const [newState1, newState2] = resolveCollision(
      collisionInfo,
      body1,
      body2,
    );

    // Equal mass, one stationary: body1 stops, body2 moves with body1's initial velocity
    expect(newState1.velocity_mps.x).toBeCloseTo(0.0);
    expect(newState1.velocity_mps.y).toBeCloseTo(0.0);
    expect(newState1.velocity_mps.z).toBeCloseTo(0.0);
    expect(newState2.velocity_mps.x).toBeCloseTo(2.0);
    expect(newState2.velocity_mps.y).toBeCloseTo(0.0);
    expect(newState2.velocity_mps.z).toBeCloseTo(0.0);
  });

  it("should resolve head-on collision correctly (unequal mass)", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      2,
    ); // Mass = 2
    const body2 = createRealState(
      "2",
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      1,
    ); // Mass = 1
    const radius = 0.6;
    const collisionInfo = detectSphereCollision(body1, radius, body2, radius);
    expect(collisionInfo).not.toBeNull();
    if (!collisionInfo) return;

    const [newState1, newState2] = resolveCollision(
      collisionInfo,
      body1,
      body2,
    );

    // Conservation of momentum and kinetic energy equations for elastic collision:
    // v1_final = ((m1 - m2) / (m1 + m2)) * v1_initial + ((2 * m2) / (m1 + m2)) * v2_initial
    // v2_final = ((2 * m1) / (m1 + m2)) * v1_initial + ((m2 - m1) / (m1 + m2)) * v2_initial
    // v1_initial = 1, v2_initial = -1, m1 = 2, m2 = 1
    // v1_final = ((2-1)/(2+1))*1 + ((2*1)/(2+1))*(-1) = (1/3)*1 + (2/3)*(-1) = 1/3 - 2/3 = -1/3
    // v2_final = ((2*2)/(2+1))*1 + ((1-2)/(2+1))*(-1) = (4/3)*1 + (-1/3)*(-1) = 4/3 + 1/3 = 5/3

    expect(newState1.velocity_mps.x).toBeCloseTo(-1 / 3);
    expect(newState2.velocity_mps.x).toBeCloseTo(5 / 3);
  });
});

describe("Collision Handling (handleCollisions)", () => {
  it("should handle multiple simultaneous collisions", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      1,
    );
    const body3 = createRealState(
      "3",
      { x: 2, y: 0, z: 0 },
      { x: -2, y: 0, z: 0 },
      1,
    );
    const radius = 0.6;
    const radii = new Map<string | number, number>([
      ["1", radius],
      ["2", radius],
      ["3", radius],
    ]);
    const bodies = [body1, body2, body3];

    const updatedBodies = handleCollisions(bodies, radii);

    // Expected: 1 collides with 2, 2 collides with 3
    // After 1&2 collision: v1=-1, v2=1
    // Then 2&3 collision (with v2=1, v3=-2):
    //   v2_final = ((1-1)/(1+1))*1 + ((2*1)/(1+1))*(-2) = 0 + (2/2)*(-2) = -2
    //   v3_final = ((2*1)/(1+1))*1 + ((1-1)/(1+1))*(-2) = (2/2)*1 + 0 = 1

    // NOTE: Simple pairwise handling order matters. A more robust solver might be needed.
    // Based on simple loop order (1&2, 1&3, 2&3):
    // 1&2 -> v1=-1, v2=1
    // 1&3 (no collision initially)
    // 2&3 (v2=1, v3=-2) -> v2_final = -2, v3_final = 1
    const finalV1 = updatedBodies.find((b) => b.id === "1")?.velocity_mps;
    const finalV2 = updatedBodies.find((b) => b.id === "2")?.velocity_mps;
    const finalV3 = updatedBodies.find((b) => b.id === "3")?.velocity_mps;

    expect(finalV1?.x).toBeCloseTo(-1.0);
    expect(finalV2?.x).toBeCloseTo(-2.0); // This depends on resolution order
    expect(finalV3?.x).toBeCloseTo(1.0); // This depends on resolution order
  });
});
